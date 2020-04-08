import DiscordUtils from '../utils/DiscordUtils';
import { Message, RichEmbed } from 'discord.js';
import { RiotSummoner, RiotEntry, RiotMastery, MatchListDto, CurrentGameInfo } from '../models/RiotModels';
import { RIOT_CONSTANTS, DISCORD_CONSTANTS } from '../utils/Constants';
import DateHelper from '../utils/DateHelper';
import { WinRate } from '../models/CustomRiotModels';
import * as queues from '../utils/league-constants/queues.json';

import fetch from 'node-fetch';
import * as moment from 'moment';

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
        let activeGame: CurrentGameInfo;
        let matchList: MatchListDto;
        let winRate: WinRate = {Wins: 0, Defeats: 0, Ratio: 0};

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
            .then(_ => this.getAccountLastMatches(searchedSummoner.accountId, region))
            .then(_matchList => {
                matchList = _matchList;                
                return null;
            })
            .then(async _ => {
                await Promise.all(matchList.matches.map(m => this.getMatchDetails(""+m.gameId, region))).then(matchArray => {
                    
                    let currentSummonerParticipantArr = matchArray.map(mm=>mm.participantIdentities.find(p => p.player.summonerId === searchedSummoner.id));
                    // console.log(participants)
                    for (let i = 0; i < currentSummonerParticipantArr.length; i++) {
                        let p = matchArray[i].participants.find(matchParticipant => matchParticipant.participantId === currentSummonerParticipantArr[i].participantId);                        
                        p.stats.win ? winRate.Wins += 1 : winRate.Defeats += 1;
                    }
                    
                    winRate.Ratio = +(winRate.Wins/matchArray.length).toFixed(2);
                })
            })
            .then(_ => {
                return this.buildProfileRichEmbed(searchedSummoner, searchedEntries, searchedMasteries, activeGame, matchList, winRate, region, searchedSummonerName)
            })
            // messageEmbed.setThumbnail(`http://stelar7.no/cdragon/latest/profile-icons/${summoner.profileIconId}.jpg`)
        }
        else {
            /** not implemented, loop through all the region until a player is found */
            throw new Error("Search without region not implemented.");
        }
    }


    async buildProfileRichEmbed(summoner: RiotSummoner, entries: RiotEntry[], masteries: RiotMastery[], activeGame: CurrentGameInfo, matchList: MatchListDto, winRate: WinRate, region: string, summonerName: string): Promise<RichEmbed> {

        /** RichEmbed to be returned */
        let embedMessage: RichEmbed = new RichEmbed();

        let specialName = "";
        if(summoner.name.toLowerCase() === "jojofoulk") {
            specialName = "(Jhin God) "
        }
        if(summoner.name.toLowerCase() === "dovakinpowa56") {
            specialName = "(Anivia God) "
        }

        embedMessage                    
        .setURL(`https://${RIOT_CONSTANTS.OP_GG_DOMAINS[region.toUpperCase()]}op.gg/summoner/userName=${summonerName}`)
        .setTitle(`${summoner.name} ${specialName}| Level ${summoner.summonerLevel}`)
        .setThumbnail(`http://ddragon.leagueoflegends.com/cdn/${this.ddragonVersion}/img/profileicon/` + summoner.profileIconId + ".png")
        .setTimestamp()  
        
        //Noy currently in game
        if (!activeGame) {
            let lastSeenDate: Date = new Date(matchList.matches[0].timestamp);
            
            const lastSeenDiff = moment(lastSeenDate).fromNow()
            embedMessage.setDescription(`:clock4: Last game played: ${lastSeenDiff}`)
        }
        else {
            const searchedSummoner = activeGame.participants.find(c=>c.summonerId === summoner.id);

            embedMessage.setImage(`http://stelar7.no/cdragon/latest/splash-art/${searchedSummoner.championId}/0.png`);
            activeGame.gameLength as number;

            //adding time diff from specator endpoint in sec (3 min = 180sec)
            let timeElapsed: string = DateHelper.dateTimeToFormattedString(activeGame.gameLength + 180);
            
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
                embedMessage.addField("Rank - " + entry.queueType, `${entry.tier} ${entry.rank} (${entry.leaguePoints} LP)`, true);
                if (entry.queueType === "RANKED_SOLO_5x5")
                    rankColor = RIOT_CONSTANTS.RANK_COLORS[entry.tier];
            })
        }
        embedMessage.setColor(rankColor || highestRank || RIOT_CONSTANTS.RANK_COLORS.UNRANKED);
        
        embedMessage.addField("Winrate", `**${winRate.Ratio * 100}%** (${winRate.Wins}W/${winRate.Defeats}L)`, true);


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


    //All these could be the same fnct with a parameter that's a constant for the url with a sensible name (e.g: SUMMONER_DETAILS) 

    async getSummonerDetails(region: string, userName: string): Promise<RiotSummoner> {
        let url = RIOT_CONSTANTS.URL.replace("REGION", region).toLocaleLowerCase() + "summoner/v4/summoners/by-name/" + userName;
        return await fetch(url, {
            method: "GET",
            headers: {"X-Riot-Token": process.env.RIOT_API_KEY}
        })
        .then(data => data.json())
        .then(res => {
            //Make this whole check routine a function that takes type to return as argument, and maybe error msg (optional), to add it to other fetch like this 
            if (!res.status) {
                return res as RiotSummoner;
            }
            else if (res.status.status_code === 403) {
                console.log("Forbidden. Check if API is expired");
                throw new Error(`Couldn't get user info. \nThis is probably an issue with the bot <@${DISCORD_CONSTANTS.MY_USER_ID}>`);
            }
            else if (res.status.status_code === 404) {
                throw new Error("User **" + userName + "** not found for region **" + region.toUpperCase() + "**");
            }
            else {
                throw new Error("Unkown error. Riot API might be unavailable");
            }
        })
    }

    async getAccountLastMatches(accountId: string, region: string, beginIndex: number = 0, endIndex: number = 10, championId?: number): Promise<MatchListDto> {
        let url = RIOT_CONSTANTS.URL.replace("REGION", region).toLocaleLowerCase() + `match/v4/matchlists/by-account/${accountId}?endIndex=${endIndex}&beginIndex=${beginIndex}`;
        championId ? url += `&championId=${championId}` : '';
        return await fetch(url, {
            method: "GET",
            headers: {"X-Riot-Token": process.env.RIOT_API_KEY}
        })
        .then(data => data.json())
    }

    async getMatchDetails(matchId: string, region: string): Promise<any> {
        let url = RIOT_CONSTANTS.URL.replace("REGION", region).toLocaleLowerCase() + "match/v4/matches/" + matchId;
        return await fetch(url, {
            method: "GET",
            headers: {"X-Riot-Token": process.env.RIOT_API_KEY}
        })
        .then(data => data.json())
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

    async getSummonerActiveGame(summonerId: string, region: string): Promise<CurrentGameInfo> {
        let url = RIOT_CONSTANTS.URL.replace("REGION", region).toLocaleLowerCase() + "spectator/v4/active-games/by-summoner/" + summonerId;
        return await fetch(url, {
            method: "GET",
            headers: {"X-Riot-Token": process.env.RIOT_API_KEY}
        })
        //return an error instead? with the error code so the fnct call can use catch()
        .then(data => {
            return data.ok ? data.json() : null;
        })
        .catch(err => {
            console.log(err);
            
        })
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