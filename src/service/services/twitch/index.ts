import { Service, ServiceStatus } from "../../service";
import { emojis } from "./emoji";

import * as WebSocket from "ws";

// tslint:disable-next-line
const MESSAGE_REGEX = /;display-name=([a-zA-Z0-9][\w]{3,24});.+;mod=(0|1);.+;subscriber=(0|1);.+;user-id=(\d+);.+ PRIVMSG #([a-zA-Z0-9][\w]{3,24}) :(.+)/;
const ACTION_REGEX = /ACTION/;

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
                if (!packet) {
                    return;
                }
                if (packet.user) {
                    if (packet.user.toLowerCase() !== "cactusbotdev") {
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
        const groups = MESSAGE_REGEX.exec(packet);
        if (!groups) {
            return null;
        }
        if (groups.length < 6) {
            return null;
        }
        const name = groups[1];
        const mod = groups[2];
        const sub = groups[3];
        const userId = groups[4];
        const channel = groups[5];
        const message = groups[6];

        let messageComponents: CactusMessageComponent[] = [];

        message.split(" ").forEach(async part => {
            const trimmed = part.trim();
            let type: "emoji" | "text" = "text";
            if (this.emojiNames.indexOf(trimmed) > -1) {
                type = "emoji";
            }
            messageComponents.push({
                type: type,
                data: part
            });
        });

        let role: "banned" | "user" | "subscriber" | "moderator" | "owner" = "user";
        if (name.toLowerCase() === channel.toLowerCase()) {
            role = "owner";
        } else {
            if (mod) {
                role = "moderator"
            } else if (sub) {
                role = "subscriber";
            }
        }
        const isAction = ACTION_REGEX.test(message);

        return {
            type: "message",
            action: isAction,
            role: role,
            user: name,
            text: messageComponents
        }
    }

    public async invert(packet: CactusMessagePacket): Promise<string> {
        let messages = packet.text;
        let message = "PRIVMSG ";
        let chatMessage = "";

        message += `#${this.channel} :`
        if (packet.action) {
            message += "/me "
            delete messages[0];
        }
        messages.forEach(async msg => {
            if (msg !== null) {
                chatMessage += ` ${msg.data.replace("\u0001", "")}`;
            }
        });
        message += `${chatMessage.trim()}`;
        return message;
    }

    public async sendMessage(message: CactusMessagePacket) {
        this.socket.send(await this.invert(message));
    }

    public get status(): ServiceStatus {
        return this._status;
    }

    public set status(state: ServiceStatus) {
        this._status = state;
    }
}
