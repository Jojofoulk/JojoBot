// Get the utils functions
import DiscordUtils from "../utils/DiscordUtils";
import * as Jimp from 'jimp';

// Get the packages
import * as Discord from "discord.js";

import * as path from 'path';
import * as fs from 'fs';


const imageCacheDirectory: string = "./src/utils/img/";


//allow chain operation when comma seperated?
export class ImageController {
    constructor() {
    }

    processingImageMsg: Discord.Message;
    //This could use a fetchMessages from the bot instead, but it would also need to fitler message with attachments. I'm to lazy to do that so I'll only check if this variable has a value set.
    previousSentImageMsg: Discord.Message;
    filePath: string = ""

    runCommand(message: Discord.Message, args: string[]) {
        if (!message.guild) {
            DiscordUtils.displayText(message, "No channel guild available !");
            return;
        }
        if (args.length <= 0) {
            DiscordUtils.displayText(
                message,
                "You need to add a function behind !"
            );
            return;
        }

        let attachment: Discord.MessageAttachment; 

        if (this.filePath) {
            DiscordUtils.displayText(
                message,
                "Already processing an image"
            );
            return;
        }

        this.findAttachment(message).then(attch => {
            if (!attch){
                DiscordUtils.displayText(
                    message,
                    "The message needs an attachment."
                );
                return;
            }
            //fallback to bot previous msg if the user msg doesn't return an attachment
            
            else {
                console.log("Attachment exists: " + attch.filename + ` (${(attch.filesize/1024).toFixed(1)} KB)`);
                
                attachment = attch;
                let value: number;
                if (!!args[1] && !isNaN(+args[1])){
                    value = +args[1]
                }
               
                message.channel.send("Processing...").then(msg => { 
                    this.processingImageMsg = msg as Discord.Message
                    this.processImage(args[0], attachment, value)
                    .then(img => {    
                            console.log("Processing done", img);     
                            message.channel.send('', {files: [ this.filePath]})
                            .then(imageMsg =>{
                                console.log("Image sent");
                                this.previousSentImageMsg = imageMsg as Discord.Message;
                                this.processingImageMsg.delete()
                            })
                            .catch(err=>{this.processingImageMsg.edit("Couldn't process image, probably too large");throw err})
                        }
                    )
                    .catch(err => {
                        console.log(err);
                        this.processingImageMsg.edit("Couldn't process image, probably too large");
                    })
                    .finally(() => {
                        this.filePath = "";
                        this.clearImageCache();
                    }) 
                });
                // const filter = m => message.author.id === m.author.id;
                // message.channel.awaitMessages(filter, {time: 30000, maxMatches: 1, errors: ['time']})
                // .then(messages => {
                //     if(["/stop", "/cancel"].includes(messages.first().content)) {
                //       //Not sure how to kill a promise, might have to rething the logic
                //     }
                // })
  
            }
        });

       
    }

    async findAttachment(message: Discord.Message): Promise<Discord.MessageAttachment>{
        let attachment: Discord.MessageAttachment = this.getImageAttachment(message) as Discord.MessageAttachment || this.getImageAttachment(this.previousSentImageMsg) as Discord.MessageAttachment;
        //Not super cash money to check if something is falsy, try to assign if it is, and then check again if that worked, rewrite this at some point.
        if (!attachment) {
                return await message.channel.fetchMessages().then(msgs => {
                console.log("No user attachment or bot attachment in current session, looking at channel's previous bot messages")
                const firstBotMessagesWithAttchment = msgs.filter(msg => msg.author.bot && msg.attachments.size > 0).first();
                // console.log("FileName: " + firstBotMessagesWithAttchment.attachments.first().filename);
                
                attachment = !!firstBotMessagesWithAttchment ? this.getImageAttachment(firstBotMessagesWithAttchment) : null;

                if (!attachment) {
                    const firstMessagesWithAttchment = msgs.filter(msg => msg.attachments.size > 0).first();
                    attachment = !!firstMessagesWithAttchment ? this.getImageAttachment(firstMessagesWithAttchment) : null;
                }
                return attachment;
            })
        }
        return attachment;
    
    }

    

    async processImage(operation: string, image: Discord.MessageAttachment, value: number = 90): Promise<any> {
        if(image.filesize > 2000000){
            throw "File too large to process.";
        }
     
        try {
            switch (operation) {
                case "hue":
                    return await this.hueShift(image, value)
                case "deepfry":
                case "df":
                    return await this.deepfry(image);
                default:
                    throw `No operation '${operation}' exist for this command.`;
            }
        } catch (e) {
            console.log(e);
        }
    }
   

    async hueShift(image: Discord.MessageAttachment, value: number = 90): Promise<any>{
        return Jimp.read(image.url).then(i => {
            this.filePath = `${imageCacheDirectory}${image.filename}_hueShifted.${i.getExtension()}`;
            console.log("File path is " + this.filePath);
            return i
                .color([
                    { apply: 'hue', params: [value] },
                ])
                .write(this.filePath);
          })
          .catch(err => {
            console.error(err);
          }
        );
    }

    async deepfry(image: Discord.MessageAttachment): Promise<any>{
        var pixelValue = Math.floor(Math.random() * 2 + 2)
        return Jimp.read(image.url).then(i => {
            this.filePath = `${imageCacheDirectory}${image.filename.substring(0, image.filename.lastIndexOf('.'))}_deepfried.${i.getExtension() === "jpeg" ? "jpg" : i.getExtension()}`;
            console.log("File path is " + this.filePath);
            return i
                .pixelate(pixelValue)
                .contrast(0.95)
                .posterize(4)
                .write(this.filePath);
          })
          .catch(err => {
            console.error(err);
          }
        );
    }


    clearImageCache(): void {
        let directory = imageCacheDirectory;
        fs.readdir(directory, (err, files) => {
            if (err) throw err;
            if(files.length >= 5)
            for (const file of files) {
                fs.unlink(path.join(directory, file), err => {
                if (err) throw err;
                });
            }
        });
    }

    /** returns undefined for non image types */
    getImageAttachment(message: Discord.Message): Discord.MessageAttachment | null{
        if(!message || message.attachments.size === 0){
            return null;
        }
        if(message.author.bot){
            DiscordUtils.displayText(
                message,
                "No attachment provided, using previous image from bot message..."
            ).then(msg=> {
                (msg as Discord.Message).delete(5000);
            });
        }
        
        let attachment: Discord.MessageAttachment = message.attachments.first();
        
        let attachIsImage = (msgAttach: Discord.MessageAttachment): string => {
            var url = msgAttach.url; 
            return this.validImageFormats.find(format => url.toLocaleLowerCase().indexOf(format, url.length - format.length) !== -1)
        }
        

        let attchFormat: string = attachIsImage(attachment);
        console.log("Format is ." + attchFormat)
        if (!attchFormat) {
            DiscordUtils.displayText(
                message,
                "The attachement isn't an image. Please make sure the attached file is an image (.png, .jpg/jpeg, .gif, .bmp)"
            );
            return null;
        }
        return attachment;
       
    }
    readonly validImageFormats: string[] = ["png", "jpg", "jpeg", "gif", "bmp"];
}
