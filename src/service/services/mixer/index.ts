import { Service, ServiceStatus } from "../../service";
import { ChatSocket } from "mixer-chat";

import { emojis } from "./emoji";

import { Carina } from "carina";
import * as ws from "ws";
import * as httpm from "typed-rest-client/HttpClient";

import { Service as ServiceAnnotation } from "../../service.annotation";

/**
 * Handle the Mixer service.
 *
 * @export
 * @class MixerHandler
 * @implements {Service}
 */
@ServiceAnnotation("Mixer")
export class MixerHandler extends Service {

    protected _status: ServiceStatus = ServiceStatus.AUTHENTICATING;

    private chat: ChatSocket;
    private httpc: httpm.HttpClient = new httpm.HttpClient("aerophyl");

    private base = "https://mixer.com/api/v1";
    private headers = {
        Authorization: "Bearer"
    }

    private reversedEmoji: Emojis = {};

    private carina: Carina;

    private botName = "";

    public async connect(oauthKey: string, refresh?: string, expiry?: string): Promise<boolean> {
        this.headers.Authorization = `Bearer ${oauthKey}`
        // Emoji stuff
        for (let k of Object.keys(emojis)) {
            const v = emojis[k];
            this.reversedEmoji[v] = k;
        }

        // Start up carina connection
        Carina.WebSocket = ws;
        this.carina = new Carina({ isBot: true }).open();
        return true;
    }

    public async authenticate(channelRaw: string | number, botId: number): Promise<boolean> {
        let channelId: number;
        if (<any>channelRaw instanceof String) {
            const nameResult = await this.httpc.get(`${this.base}/channel/${channelRaw}`);
            if (nameResult.message.statusCode !== 200) {
                return false;
            }
            channelId = JSON.parse(await nameResult.readBody()).id;
        } else {
            channelId = <number>channelRaw;
        }
        await this.setupCarinaEvents(channelId);

        const userResult = await this.httpc.get(`${this.base}/users/current`, this.headers);
        if (userResult.message.statusCode !== 200) {
            return false;
        }
        this.botName = JSON.parse(await userResult.readBody()).username;

        const result = await this.httpc.get(`${this.base}/chats/${channelId}`, this.headers);
        if (result.message.statusCode !== 200) {
            // This is bad
            return false;
        }
        const body: MixerChatResponse = JSON.parse(await result.readBody());
        this.chat = new ChatSocket(body.endpoints).boot();

        const isAuthed = await this.chat.auth(channelId, botId, body.authkey);
        if (!isAuthed) {
            return false;
        }
        this.chat.on("ChatMessage", async message => {
            console.log("Raw message", JSON.stringify(message));
            let converted = await this.convert(message);
            if (converted.user === this.botName) {
                return;
            }
            let finished = await this.cereus.parseServiceMessage(converted);
            const response = await this.cereus.handle(await this.cereus.parseServiceMessage(finished));
            if (!response) {
                console.error("Mixer MessageHandler: Got no response from cereus? " + JSON.stringify(finished));
                return;
            }
            this.sendMessage(response);
        });

        this.chat.on("error", console.error);
        return this.chat.isConnected();
    }

    public async disconnect(): Promise<boolean> {
        this.chat.close();
        // Just assume that it was closed.
        return true;
    }

    public async convert(packet: any): Promise<CactusMessagePacket> {
        if (packet.message !== undefined) {
            const message = packet.message.message;
            const meta = packet.message.meta;

            if (message.length < 1) {
                // This is bad, and a Mixer bug.
                throw new Error("No message");
            }
            let messageComponents: CactusMessageComponent[] = []

            // Parse each piece of the message
            message.forEach(async (msg: MixerChatMessage) => {
                const trimmed = msg.text.trim();
                let type: "text" | "emoji" | "url" = "text";

                if (emojis[trimmed] !== undefined) {
                    type = "emoji";
                }
                messageComponents.push({
                    type: type,
                    data: msg.text
                });
            });

            let cactusPacket: CactusMessagePacket = {
                    type: "message",
                    text: messageComponents,
                    action: meta.me !== undefined,
                    user: packet.user_name,
                    role: packet.user_roles[0].toLowerCase()
                };
            if (meta.whisper !== undefined) {
                cactusPacket.target = true
            }
            return cactusPacket;
        }
        return null;
    }

    public async invert(packet: CactusMessagePacket): Promise<string> {
        let message = "";

        if (packet.action) {
            message += "/me ";
        }

        for (let messagePacket of packet.text) {
            if (messagePacket.type === "emoji") {
                const emoji = await this.getEmoji(messagePacket.data.trim());
                message += ` :${emoji}`;
            } else {
                message += ` ${messagePacket.data}`;
            }
        }
        return message.trim();
    }

    public async sendMessage(message: CactusMessagePacket) {
        if (!this.chat.isConnected()) {
            throw new Error("Not connected to chat.");
        }

        const finalMessage = await this.invert(message);
        console.log("The final message is " + finalMessage);
        let method = "msg"
        let args = []

        if (message.target) {
            method = "whisper";
            args.push(message.user);
        }
        args.push(finalMessage);
        this.chat.call(method, args);
    }

    public get status(): ServiceStatus {
        return this._status;
    }

    public set status(status: ServiceStatus) {
        this._status = status;
    }

        /**
     * Setup all the carina events.
     *
     * @private
     * @param {number} id the id of the channel to subscribe to
     * @memberof MixerHandler
     */
    private async setupCarinaEvents(id: number) {
        this.carina.on("error", console.error);
        this.carina.subscribe<MixerFollowPacket>(`channel:${id}:followed`, async data => {
            const packet: CactusEventPacket = {
                type: "event",
                kind: "follow",
                success: data.following,
                user: data.user.username
            };
            this.events.next(packet);
        });

        this.carina.subscribe<MixerHostedPacket>(`channel:${id}:hosted`, async data => {
            const packet: CactusEventPacket = {
                type: "event",
                kind: "host",
                success: true,
                user: data.hoster.token
            };
            this.events.next(packet);
        });

        this.carina.subscribe<MixerHostedPacket>(`channel:${id}:unhosted`, async data => {
            const packet: CactusEventPacket = {
                type: "event",
                kind: "host",
                success: false,
                user: data.hoster.token
            };
            this.events.next(packet);
        });

        this.carina.subscribe<MixerSubscribePacket>(`channel:${id}:subscribed`, async data => {
            const packet: CactusEventPacket = {
                type: "event",
                kind: "subscribe",
                streak: 1,
                success: true,
                user: data.username
            };
            this.events.next(packet);
        });

        this.carina.subscribe<MixerResubscribePacket>(`channel:${id}:resubShared`, async data => {
            const packet: CactusEventPacket = {
                type: "event",
                kind: "subscribe",
                streak: data.totalMonths,
                success: true,
                user: data.username
            };
            this.events.next(packet);
        });
    }

    private async getEmoji(name: string): Promise<string> {
        for (let emoji in emojis) {
            if (emoji === name) {
                console.log("We found the emoji");
                return emoji;
            }
        }
        return "UNKNOWN";
    }

}
