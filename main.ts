// Get the utils functions
import DiscordUtils from "./src/utils/DiscordUtils";

// Get the packages
import * as Discord from "discord.js";
import * as fs from "fs";
import * as util from "util";

// Get the command's functions
import { PurgeController } from './src/controllers/PurgeController';
import { ImageController } from './src/controllers/ImageController';
import { HelpController } from "./src/controllers/HelpController";
import { RiotController } from './src/controllers/RiotController';
import { DofusController } from './src/controllers/DofusController';

// Get the configuration
require("dotenv").config();
const config = process.env;


process.on('SIGINT', () => {
    console.log('Received SIGINT. Press y to exit.');
});

process.on("unhandledRejection", error =>
    console.error("Uncaught Promise Rejection", error)
);

//Prepare the log file
const log_file: fs.WriteStream = fs.createWriteStream(
    __dirname + "/logs/debug-" + Date.now() + ".log",
    { flags: "w" }
);
const log_stdout = process.stdout;
const client: Discord.Client = new Discord.Client();

let helpController: HelpController = new HelpController();
let purgeController: PurgeController = new PurgeController()
let imageController: ImageController = new ImageController()
let dofusController: DofusController = new DofusController()
let riotController: RiotController = new RiotController();
// Override of the lof function to put the logs into a file
console.log = function(d) {
    let text = "[*] " + util.format(d) + "\n";

    log_file.write(text);
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
    if (message.content.startsWith("/")) {
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
            case "help":
                helpController.runCommand(message, args);
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
                message.channel.send("bah nn dukou");
                break;
            default:
                console.log(`Command "${command}" is not recognized`);
                break;
        }
    }
});

client.login(config.BOT_TOKEN);
