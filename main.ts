// Get the utils functions
import DiscordUtils from "./src/utils/DiscordUtils";

// Get the packages
import * as Discord from "discord.js";
// import * as fs from "fs";
import * as util from "util";

// Get the command's functions
import { PurgeController } from './src/controllers/PurgeController';
import { ImageController } from './src/controllers/ImageController';
import { RiotController } from './src/controllers/RiotController';
import { DofusController } from './src/controllers/DofusController';

// Get the configuration
require("dotenv").config();
const config = process.env;


// process.on('SIGINT', () => {
//     console.log('Received SIGINT. Press y to exit.');
// });

process.on("unhandledRejection", error => {
    console.error("Uncaught Promise Rejection", error);
    console.log("Uncaught Promise Rejection: ", error);
}
);

//Prepare the log file
// const log_file: fs.WriteStream = fs.createWriteStream(
//     __dirname + "/logs/debug-" + Date.now() + ".log",
//     { flags: "w" }
// );
const log_stdout = process.stdout;
const client: Discord.Client = new Discord.Client();

let purgeController: PurgeController = new PurgeController()
let imageController: ImageController = new ImageController()
let dofusController: DofusController = new DofusController()
let riotController: RiotController = new RiotController();
// Override of the lof function to put the logs into a file
console.log = function(d) {
    let text = "[*] " + util.format(d) + "\n";

    // log_file.write(text);
    log_stdout.write(text);
};

client.on("disconnect", () => {
    console.log(`Disconnecting ${client.user.tag}!`)
})

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on("message", message => {
    // If it calls the bot
    if (message.content.startsWith("!")) {
        console.log("Command | " + message.content);

        const command: string = message.content
            .split(" ")
            .shift()
            .substring(1);
        const args: string[] = DiscordUtils.getArgs(message);

        switch (command) {
            case "ping":
                DiscordUtils.reply(message, `Pong! (${client.ping.toFixed(2)}ms)`);
                break;
            case "purge":
                purgeController.runCommand(message, args);
                break;
            case "img":
                imageController.runCommand(message, args);
                break; 
            case "league":
                riotController.runCommand(message, args);
                break;
            case "dofus":
                dofusController.runCommand(message, args);
                break;
            case "ban":
            case "kick":
                message.channel.send("stfu");
                break;
            case "roll":
            case "rand":
                let result;
                console.log(args);
                
                if(!isNaN(+args[0]) && !isNaN(+args[1])) {
                    const min: number = +args[0] < +args[1] ? +args[0] : +args[1];
                    const max: number = +args[0] > +args[1] ? +args[0] : +args[1];
                    console.log(min, max);
                    
                    result = Math.floor(Math.random() * (max - min + 1) + min);
                }
                else if (!isNaN(+args[0])) {
                    result = Math.floor(Math.random() * Math.floor(+args[0]));
                }
                else if(args.length > 1) {
                    result =  args[Math.floor(Math.random() * args.length)];
                }
                else 
                    result = Math.random() > 0.5 ? "Yes" : "No"
                message.channel.send(result);
                break;    
            default:
                message.channel.send(`Command "${command}" is not recognized`);
                console.log(`Command "${command}" is not recognized`);
                break;
        }
    }
});

client.login(config.BOT_TOKEN);
