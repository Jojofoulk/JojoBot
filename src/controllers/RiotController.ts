import DiscordUtils from '../utils/DiscordUtils';
import { Message, RichEmbed } from 'discord.js';
import { RiotSummoner, RiotEntry, RiotMastery } from '../models/RiotModels';
import { RIOT_CONSTANTS, DISCORD_CONSTANTS } from '../utils/Constants';

import * as fetch from 'node-fetch';
import DateHelper from '../utils/DateHelper';
import moment from 'moment';
import * as queues from '../utils/league-constants/queues.json';

// http://stelar7.no/cdragon/latest for imgs
export class RiotController {

    constructor() {
    }

    ddragonVersion: string = "";
    championByIdCache = {};
    championJson = {};

    runCommand(message: Message, args: string[]){
        if (args.length <= 0) {
            DiscordUtils.displayText(
                message,
                "You need to add a function behind !"
            );
            return;
        }

        message.channel.send("Searching...").then(msg => msg as Message)
        .then(msg => {
            this.chooseFunction(args, msg)
            .then(res => {
                if (res instanceof RichEmbed){
                    message.channel.send(res)
                    .catch(err=>{
                        console.log(err);
                        DiscordUtils.displayText(message, "Malformed embed");
                    });
                }
                if (res instanceof Message){
                    message.channel.send(res.content);
                }
                msg.delete();
           })
           .catch((err: Error) => {
                //Have custom error too, only log send them to discord channel if it a custom error that allows so;
                DiscordUtils.displayText(message, err.message);
                console.log(err);
                msg.delete();
           })
        })

    }

    async chooseFunction(args: string[], searchMessage?: Message): Promise<RichEmbed | Message> {

        let setSearchMessage = (text: string) => {
            if (searchMessage) {
                searchMessage.edit(text);
            }
        }

        switch(args[0]) {
            case "profile":
            case "summoner":
            case "player":
            case "user":
                const searchedString = args?.slice(2)?.join(" ");
                
                if (!searchedString) 
                    throw new Error("No summoner name included. Please provide a summoner name"); 
                const userName = searchedString.replace(/\s/g, "")
                
                setSearchMessage(`Searching player ${searchedString}...`);

                return await this.searchSummoner(args[1], userName).then(embed => {
                    if (embed instanceof RichEmbed) {
                        const formattedName: string = embed.title.split(" |")[0];
                        //
                        console.log("Successfully retrieved details for user " + formattedName);
                    }
                    return embed
                });
            default:
                throw new Error(`Function ${args[0]} unknown for command riot`);
                
        }
    }

    async searchSummoner(region: string, searchedSummonerName: string): Promise<RichEmbed | Message>{

        let searchedSummoner: RiotSummoner;
        let searchedEntries: RiotEntry[];
        let searchedMasteries: RiotMastery[];
        let activeGame;

        if (!!region && RIOT_CONSTANTS.ENDPOINT_REGIONS.includes(region.toLocaleUpperCase())) {
            // console.log("test");
            
            return this.getSummonerDetails(region, searchedSummonerName)
            //Sets DDragon version, should be done somewhere else tbh
            .then(data => {                
                searchedSummoner = data;

                return fetch("http://ddragon.leagueoflegends.com/api/versions.json").then(r => r.json())
                    .then(rr=>{
                    this.ddragonVersion = rr[0];
                    return data;
                })
            })
            .then(_ => this.getSummonerLeagueEntries(searchedSummoner.id, region))
            .then((entries: RiotEntry[]) => {
                searchedEntries = entries;
                return null;
            })
            .then(_ => this.getSummonerMasteries(searchedSummoner.id, region))
            .then((masteries: RiotMastery[]) => {
                searchedMasteries = masteries;
                return null;
            })
            .then(_ => this.getSummonerActiveGame(searchedSummoner.id, region))
            .then(data => {
                activeGame = data;
                return null;
            })
            .then(_ => {
                return this.buildRichEmbed(searchedSummoner, searchedEntries, searchedMasteries, activeGame, region, searchedSummonerName)
            })
            // messageEmbed.setThumbnail(`http://stelar7.no/cdragon/latest/profile-icons/${summoner.profileIconId}.jpg`)
        }
        else {
            /** not implemented, loop through all the region until a player is found */
            throw new Error("Search without region not implemented.");
        }
        
        
    }


    async buildRichEmbed(summoner: RiotSummoner, entries: RiotEntry[], masteries: RiotMastery[], activeGame: any, region: string, summonerName: string): Promise<RichEmbed> {

        /** RichEmbed to be returned */
        let embedMessage: RichEmbed = new RichEmbed() 

        embedMessage                    
        .setURL(`https://${RIOT_CONSTANTS.OP_GG_DOMAINS[region]}op.gg/summoner/userName=${summonerName}`)
        .setTitle(`${summoner.name} | Level ${summoner.summonerLevel}`)
        .setThumbnail(`http://ddragon.leagueoflegends.com/cdn/${this.ddragonVersion}/img/profileicon/` + summoner.profileIconId + ".png")
        .setTimestamp()  
        
        //Noy currently in game
        if (activeGame.status && activeGame.status.status_code === 404) {
            let lastSeenDate: Date = new Date(summoner.revisionDate);            
            const lastSeenDiff = moment(lastSeenDate).fromNow()
            embedMessage.setDescription(`:clock4: Last seen: ${lastSeenDiff}`)
        }
        else {
            const searchedSummoner = activeGame.participants.find(c=>c.summonerId === summoner.id);

            embedMessage.setImage(`http://stelar7.no/cdragon/latest/splash-art/${searchedSummoner.championId}/0.png`);
            activeGame.gameLength as number;
            
            let timeElapsed: string;


            timeElapsed = DateHelper.dateTimeToFormattedString(activeGame.gameLength);
            
            queues.data.find(q=>q.queueId === activeGame.gameQueueConfigId).description.replace(" games", "");
            await this.getChampionByKey(searchedSummoner.championId).then(champ => {
                embedMessage.setDescription(`:video_game: In game (${timeElapsed}) - Playing a **${queues.data.find(q=>q.queueId === activeGame.gameQueueConfigId).description.replace(" games", "")}** match as **${champ.name} **`)
            });
        }
       

        let rankColor: string;
        let highestRank: string;

        if (entries.length === 0) {
            embedMessage.addField("Rank", "This user has no rank");
        }
        else {
            entries.forEach(entry => {
                highestRank = entry.tier;
                embedMessage.addField("Rank - " + entry.queueType, `${entry.tier} ${entry.rank}`, true);
                if (entry.queueType === "RANKED_SOLO_5x5")
                    rankColor = RIOT_CONSTANTS.RANK_COLORS[entry.tier];
            })
        }
        embedMessage.setColor(rankColor || highestRank || RIOT_CONSTANTS.RANK_COLORS.UNRANKED);
        
        if (masteries.length === 0) {
            embedMessage.addField("Best Champion", `No champion masteries available`);
        }
        else {
            const topThreeChampions = masteries.slice(0,3);
            //Get all champion info from masteries
            const getChampions = async(): Promise<any[]> =>{
                let champions: any[] = [];
                for(const mastery of topThreeChampions) {                            
                    champions.push(await this.getChampionByKey(mastery.championId));
                }
                return champions;
            }
            await getChampions().then(champions => {
                embedMessage.addField("Best Champion ", `**${champions[0].name} - ${masteries[0].championPoints}pts**`);
                //Set image to best champion if image isn't set already (to currently played champ)
                if (!embedMessage.image)
                    embedMessage.setImage(`http://stelar7.no/cdragon/latest/splash-art/${masteries[0].championId}/0.png`);
                if (topThreeChampions[1])
                    embedMessage.addField("2nd",  `${champions[1].name} - ${masteries[1].championPoints}pts`, true);
                if (topThreeChampions[2])
                    embedMessage.addField("3rd",  `${champions[2].name} - ${masteries[2].championPoints}pts`, true);
            })
        }
        return embedMessage;
    }


    async getSummonerDetails(region: string, userName: string): Promise<RiotSummoner> {
        let url = RIOT_CONSTANTS.URL.replace("REGION", region).toLocaleLowerCase() + "summoner/v4/summoners/by-name/" + userName;
        return await fetch(url, {
            method: "GET",
            headers: {"X-Riot-Token": process.env.RIOT_API_KEY}
        })
        .then(data => data.json())
        .then(res => {
            if (!res.status) {
                return res;
            }
            else if (res.status.status_code === 403) {
                console.log("Forbidden. Check if API is expired");
                throw new Error(`Couldn't get user info. \nThis is probably an issue with the bot <@${DISCORD_CONSTANTS.MY_USER_ID}>`);
            }
            else if (res.status.status_code === 404) {
                throw new Error("User" + userName + "not found for region **" + region.toUpperCase() + "**");
            }
            else {
                throw new Error("Unkown error. Riot API might be unavailable");
            }
        })
    }


    async getSummonerLeagueEntries(summonerId: string, region: string): Promise<RiotEntry[]> {
        let url = RIOT_CONSTANTS.URL.replace("REGION", region).toLocaleLowerCase() + "league/v4/entries/by-summoner/" + summonerId;
        return await fetch(url, {
            method: "GET",
            headers: {"X-Riot-Token": process.env.RIOT_API_KEY}
        })
        .then(data => data.json())
    }

    async getSummonerMasteries(summonerId: string, region: string): Promise<RiotMastery[]> {
        let url = RIOT_CONSTANTS.URL.replace("REGION",  region).toLocaleLowerCase() + "champion-mastery/v4/champion-masteries/by-summoner/" + summonerId;
        return await fetch(url, {
            method: "GET",
            headers: {"X-Riot-Token": process.env.RIOT_API_KEY}
        })
        .then(data => data.json())
    }

    async getSummonerActiveGame(summonerId: string, region: string) {
        let url = RIOT_CONSTANTS.URL.replace("REGION", region).toLocaleLowerCase() + "spectator/v4/active-games/by-summoner/" + summonerId;
        return await fetch(url, {
            method: "GET",
            headers: {"X-Riot-Token": process.env.RIOT_API_KEY}
        })
        .then(data => data.json())
    }


    async getLatestChampionDDragon(language) {

        if (this.championJson[language])
            return this.championJson[language];

        let response;
        let versionIndex = 0;
        do { // I loop over versions because 9.22.1 is broken
            const version = (await fetch("http://ddragon.leagueoflegends.com/api/versions.json").then(async(r) => await r.json()))[versionIndex++];
        
            response = await fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/${language}/champion.json`);
        }
        while (!response.ok)
        
        this.championJson[language] = await response.json();
        return this.championJson[language];
    }

    async getChampionByKey(key) {

        // Setup cache
        if (!this.championByIdCache["en_US"]) {
            let json = await this.getLatestChampionDDragon("en_US");

            this.championByIdCache["en_US"] = {};
            for (var championName in json.data) {
                if (!json.data.hasOwnProperty(championName))
                    continue;

                const champInfo = json.data[championName];
                this.championByIdCache["en_US"][champInfo.key] = champInfo;
            }
        }

        return this.championByIdCache["en_US"][key];
    }

}