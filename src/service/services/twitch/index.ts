import { Service, ServiceStatus, MessageOptions } from "../../service";
import { emojis } from "./emoji";

import * as WebSocket from "ws";

export class TwitchHandler extends Service {

    private socket: WebSocket = null;
    private caps = ":twitch.tv/membership twitch.tv/commands twitch.tv/tags";

    private channel = "";
    private oauth = "";

    private emojiNames: string[] = [];
    private emojiValues: string[] = [];

    public async connect(oauthKey: string, refresh?: string, expiry?: string): Promise<boolean> {
        if (this.status === ServiceStatus.READY) {
            return;
        }
        this.emojiNames = Object.keys(emojis);
        for (let emoji of this.emojiNames) {
            this.emojiValues.push(emojis[emoji]);
        }
        this.oauth = oauthKey;
        this.socket = new WebSocket("wss://irc-ws.chat.twitch.tv");
        this.socket.on("open", async () => {
            this.socket.on("message", async (message: string) => {
                if (message.startsWith("PING")) {
                    this.socket.send(message.replace("PING", "PONG"));
                    return;
                }
                const packet = await this.convert(message);
                if (packet.user) {
                    if (packet.user.toLowerCase() !== "cactusbotdev") {
                        console.log(JSON.stringify(packet));
                        this.sendMessage(packet);
                    }
                }
            });

            this.socket.on("close", async (code, message) => {
                console.log("Disconnected. " + message);
            });
        });
        this.socket.on("error", async (err) => console.error);
        await new Promise<any>((resolve, reject) => {
            setTimeout(() => resolve(), 1000);
        });
        return true;
    }

    public async authenticate(channel: string | number, botId: string | number): Promise<boolean> {
        this.channel = (<string>channel).toLowerCase();
        await this.socket.send(`CAP REQ ${this.caps}`);
        await this.socket.send(`PASS oauth:${this.oauth.trim()}`);
        await this.socket.send(`NICK ${botId}`);
        await this.socket.send(`JOIN #${this.channel}`);
        return true;
    }

    public async disconnect(): Promise<boolean> {
        this.socket.close();
        return true;
    }

    public async convert(packet: any): Promise<CactusMessagePacket> {
        let tags: {[key: string]: string} = {};
        let parts: string[] = packet.split(" :", 3);
        let user, channel, eventCode = "";
        let message = "";

        if (parts[0].startsWith("@")) {
            parts[0].substring(1).split(";").forEach(tagPart => {
                let value = tagPart.split("=");
                if (value.length > 0) {
                    tags[value[0]] = value.length === 1 ? "" : value[1];
                }
            });
            parts[0] = parts[1];
            if (parts.length > 2) {
                parts[1] = parts[2];
            }
        }
        if (parts[0].startsWith(" ")) {
            if (parts[1].startsWith(" ")) {
                parts[1] = parts[1].substring(1);
            }
        }

        if (parts.length > 1) {
            message = parts[1].replace("\r", "").replace("\n", "");
        }

        if (parts[0].includes("!")) {
            user = parts[0].substring(parts[0].indexOf("!" + 1), parts[0].indexOf("@")).split("!")[0];
        }

        if (parts[0].includes("#")) {
            channel = parts[0].substring(parts[0].indexOf("#" + 1));
        }

        eventCode = parts[0].split(" ")[1];

        let messageComponents: CactusMessageComponent[] = [];

        message.split(" ").forEach(async part => {
            const trimmed = part.trim();
            console.log("Emote " + trimmed);
            console.log(this.emojiNames.indexOf(trimmed) > -1);
            if (this.emojiNames.indexOf(trimmed) > -1) {
                console.log("Found");
                messageComponents.push({
                    type: "emoji",
                    data: part
                });
            } else {
                messageComponents.push({
                    type: "text",
                    data: part
                });
            }
        });

        return {
            type: "message",
            action: false,
            role: "user",  // TODO: This should pull from the parsed information
            user: user,
            text: messageComponents
        }
    }

    public async invert(packet: CactusMessagePacket): Promise<string> {
        let message = "";
        if (packet.action) {
            message += "ACTION "
        } else {
            message += "PRIVMSG "
        }

        let chatMessage = "";
        packet.text.forEach(async msg => {
            chatMessage += ` ${msg.data}`;
        });
        message += `#${this.channel} :${chatMessage}`;
        return message;
    }

    public async sendMessage(message: CactusMessagePacket, options?: MessageOptions) {
        let prefix = "PRIVMSG";
        if (options) {
            if (options.prefix) {
                prefix = options.prefix;
            }
        }
        this.socket.send(await this.invert(message));
    }

    public get status(): ServiceStatus {
        return this._status;
    }

    public set status(state: ServiceStatus) {
        this._status = state;
    }
}
