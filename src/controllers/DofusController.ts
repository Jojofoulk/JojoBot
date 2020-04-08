/** Controller for some dofus API via dofus api fr (unofficial API)*/
import DiscordUtils from '../utils/DiscordUtils';

import { Message, RichEmbed } from 'discord.js';
import fetch from 'node-fetch';
import child_process from "child_process";
import * as stringSimilarity from 'string-similarity'
/** Return an item */
/** Return a profile (no api yet, might have to crawl the ankama website manually and parse the data somehow) */

export class DofusController {

    constructor() {
    }

    runCommand(message: Message, args: string[]) {
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
                else if (res instanceof Message){
                    message.channel.send(res.content);
                }
                else {
                    msg.delete();
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
            case "item":
            case "equip":
            case "equipment":
            case "équipement":
            case "equipement":
                const searchedString = args?.slice(1)?.join(" ");
                
                if (!searchedString) 
                    throw new Error("No item name included. Please provide a summoner name"); 
                const itemName = searchedString.replace(/\s/g, "")
                
                setSearchMessage(`Searching item ${searchedString}...`);

                return await this.searchItem(itemName).then(embed => {
                    if (embed instanceof RichEmbed) {
                        const formattedName: string = embed.title.split(" |")[0];
                        console.log("Successfully retrieved details for item " + formattedName);
                    }
                    return embed
                });
            case "portail":
            case "portal":
            case "portails":
            case "portals":
            case "dimension":
            case "dimensions":
                return await this.fetchPortals().then(data => data);
                break;
            default:
                throw new Error(`Function ${args[0]} unknown for command dofus`);
                
        }
    }

    async searchItem(itemName: string) {

        let equipment: any;
        let set: any;
        return await this.fetchEquipmentByName(itemName).then(res=>{
            equipment = res;
            return null;
        })
        .then(async _ => {
            if(equipment.setId){
                return await this.fetchSetById(equipment.setId);
            }
            else {
                return await Promise.resolve();
            }
        })
        .then(p => {
            set = p;
            return null;
        })
        .then(async _ => {
            return await this.buildItemEmbed(equipment, set);
        })
    }

    async buildItemEmbed(equipment: any, set: any) {
        let embed = new RichEmbed();

        let statsString: string = "";
        if(equipment.statistics)
        equipment.statistics.forEach((s: object) => {
            statsString += this.formatStatsString(Object.keys(s)[0], s);
        });

        let conditionsString: string = "";
        if(equipment.conditionsString)
        equipment.conditions.forEach((c: string) => {
            conditionsString += "- " + c + "\n" 
        })

        let recipeString: string = "";
        if(equipment.recipe)
        equipment.recipe.forEach((ingredients: object) => {
            for (var key in ingredients) {
                if (ingredients.hasOwnProperty(key)) {
                    recipeString += this.formatItemRecipeString(key, ingredients);
                }
            }
        })

        embed.setTitle(equipment.name + " | Niveau " + equipment.level) 
        .setThumbnail(equipment.imgUrl)
        .setColor("#A3E100")
        .setURL(equipment.url)
        .setDescription(`**Description**
        ${equipment.description}\n 
        **Statistiques** 
        ${statsString || "Pas de stats"}\n${conditionsString ? '**Conditions**' : ''}${conditionsString ? '\n'+conditionsString + '\n' : ""}${recipeString ? "**Recette**": ""}${recipeString ? '\n'+recipeString + '\n': ""}`)

        if (set) {
            let statsString = "";
            set.bonus.stats.forEach(s => {
                statsString += this.formatStatsString(Object.keys(s)[0], s)
            });
            embed.description += `**${set.name} (Niveau ${set.level})**
            __Bonus Panoplie (${set.bonus.number} items):__
            ${statsString}
            `
        }

        return await Promise.resolve().then(_=>embed)

    }

    async fetchEquipmentByName(itemName: string) {
        let url = "https://fr.dofus.dofapi.fr/equipments"
        return await fetch(url, {
            method: "GET",
        })
        .then(data => data.json())
        .then((res: any[]) => {

            let names: string[] = res.map(r=>r.name)
            let bestMatch = stringSimilarity.findBestMatch(itemName, names).bestMatch.target;

            let equip = res.find(e => e.name === bestMatch);

            return equip;
           
        })
    }

    async fetchSetById(id: number) {
        let url = "https://fr.dofus.dofapi.fr/sets/" + id
        return await fetch(url, {
            method: "GET",
        })
        .then(data => data.json())
        .then((res: object) => res)
    }

    formatItemRecipeString(key, object) {
       let recipeString = `${key} x${object[key]["quantity"]}\n`;
       return recipeString;
    }
    //Maybe put stat object loop here, and custom sort to have certain stat at the top (PA, PM, Vita, Stats, Sagesse, ...)
    formatStatsString(key, object) {

        let statIcon = (() => {
            switch(key) {
                case "Intelligence":
                    return ":red_circle:";
                case "Force":
                    return ":brown_circle:"
                case "Agilité":
                    return ":green_circle:"
                case "Chance":
                    return ":blue_circle:"
                case "Sagesse":
                    return ":purple_circle:"
                case "Vitalité":
                    return ":hearts:"
                case "Initiative":
                    return ":space_invader:"
                case "Pods":
                    return ":handbag:"
                case "Portée":
                    return ":eye:"
                case "Prospection":
                    return ":shamrock:" 
                case "PA":
                    return ":star:"
                case "PM":
                    return ":boot:"
                case "% Critique":
                    return ":exclamation:"
                case "Dommages":
                    return ":dagger:"
                case "Tacle":
                    return ":people_wrestling:"
                case "Fuite":
                    return ":man_running:"
                default: 
                return "-"
            }
       });
       let iconEmote = statIcon() + " ";
       let _statString = "";
       _statString += iconEmote + key + ": \t";
       _statString += (key === "PA" || !object[key]["max"]) ? "**" + object[key]["min"] + "**\n": "[**" + object[key]["min"] + "** à **" +
       object[key]["max"] +"**]\n";

       return _statString;
    }

    //Todo: add a stdin that feeds which server to look from, right now the value is harcoded in the .py script
    async fetchPortals(): Promise<RichEmbed> {
        const file = require.resolve("./../../Scripts/scraping.py");
        let spawn = child_process.spawn("python",[file]);
        let embed: RichEmbed = new RichEmbed();
        spawn.on('error', function( err ){ throw err })
        embed.setDescription("");

        for await (const portals of spawn.stdout){
            const data = (""+portals).substring(0, (""+portals).indexOf("\r")-1).split("&");                     
            data.forEach(portal => {
                let text = portal.split('|');
                //if no text[1] (position) then format a bit differently
                embed.description += (`**${text[0]}:**  ${(text[1] ? `\`${text[1]}\`` : "")}  ${(text[1] ? `(${text[2]} uses left)` : `\`${text[2]}\``)}\n`);
            });
        }
        const exitCode = await new Promise((resolve) => {
            spawn.on("exit", resolve);
        });

        if(exitCode) {
            throw Error("The script to retrieve protals info didn't run successfullt\n Error code: " + exitCode)
        }
        else {
            embed.setTitle("Dimension Portals (Agrid)")
            .setURL("https://dofus-portals.fr/portails/2");
            return embed;
        }        
    }
}

    
