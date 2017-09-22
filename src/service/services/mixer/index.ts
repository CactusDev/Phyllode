import { AuthenticationData } from "./authentication";

import { Cereus } from "../../../cereus";
import { Service, ServiceStatus } from "../../service";
import { ChatSocket } from "mixer-chat";

import { mixerEmojis } from "./emoji";

import { Carina } from "carina";
import * as ws from "ws";
import { default as axios } from "axios";

import { Service as ServiceAnnotation } from "../../service.annotation";
import { Logger } from "../../../logger";

import { eatSpaces } from "../../../util";

import { MixerAPI } from "./api";

type Role = "user" | "moderator" | "owner" | "subscriber" | "banned";

const TYPE_MAP: any = {
    emoticon: "emoji",
    inaspacesuit: "emoji",
    link: "url",
    tag: "tag"
}

/**
 * Handle the Mixer service.
 *
 * @export
 * @class MixerHandler
 * @implements {Service}
 */
@ServiceAnnotation("Mixer", {singleInstance: true})
export class MixerHandler extends Service {

    private chat: ChatSocket;

    private base = "https://mixer.com/api/v1";
    private headers = {
        Authorization: ""
    }

    private reversedEmojis: ReverseEmojis = {};

    private botName = "";

    private carina: Carina;
    private api: MixerAPI;

    constructor(protected cereus: Cereus) {
        super(cereus);

        this.reversedEmojis = this.reverseEmojis(mixerEmojis);
    }

    public async initialize() {
        this.api = new MixerAPI("https://mixer.com/api/v1");
    }

    public async connect(oauthKey: string, refresh?: string, expiry?: number): Promise<boolean> {
        this.headers.Authorization = `Bearer ${oauthKey}`

        // Start up carina connection
        Carina.WebSocket = ws;
        this.carina = new Carina({ isBot: true }).open();
        return true;
    }

    public async authenticate(channelRaw: string | number, botId: number): Promise<boolean> {
        this.botId = botId;

        if (+channelRaw) {
            this.channel = <number>channelRaw;
        } else {
            this.channel = await this.api.getChannelId(<string>channelRaw);
        }

        await this.setupCarinaEvents(this.channel);

        this.botName = await this.api.getCurrentUserName(this.headers);
        const chat = await this.api.getChats(this.channel, this.headers);
        this.chat = new ChatSocket(chat.endpoints).boot();

        const isAuthed = await this.chat.auth(this.channel, botId, chat.authkey);
        if (!isAuthed) {
            return false;
        }
        this.chat.on("ChatMessage", async message => {
            Logger.info("Messages", `${this.channel}(Mixer): ${message.message.message}`);
            let converted = await this.convert(message);
            if (converted.user === this.botName) {
                return;
            }
            const responses = await this.cereus.handle(await this.cereus.parseServiceMessage(converted));
            if (!responses) {
                return;
            }
            responses.forEach(async response => this.sendMessage(response));
        });

        this.chat.on("error", error => Logger.error("Services", error));
        return this.chat.isConnected();
    }

    public async disconnect(): Promise<boolean> {
        this.chat.close();
        // Just assume that it was closed.
        return true;
    }

    public async convert(packet: any): Promise<CactusContext> {
        if (!packet.message) {
            return null;
        }
        const message = packet.message.message;
        const meta = packet.message.meta;

        if (message.length < 1) {
            // This would be bad, and a Mixer bug.
            throw new Error("No message");
        }
        let messageComponents: Component[] = [];

        // Parse each piece of the message
        message.forEach(async (msg: MixerChatMessage) => {
            const trimmed = await eatSpaces(msg.text);
            let type: "text" | "emoji" | "tag" | "url" | "text" = TYPE_MAP[msg.type];

            messageComponents.push({
                type: type,
                data: trimmed
            });
        });

        let role = await this.convertRole(packet.user_roles[0].toLowerCase());

        let context: CactusContext = {
            packet: {
                type: "message",
                text: messageComponents,
                action: !!meta.me
            },
            channel: <string>this.channel,
            user: packet.user_name,
            role: role,
            target: packet.target,
            service: this.serviceName
        }

        return context;
    }

    public async invert(...contexts: CactusContext[]): Promise<string[]> {
        let results: string[] = [];

        for (let context of contexts) {
            let message = "";

            if (context.packet.type === "message") {
                if (context.packet.action) {
                    message += "/me ";
                }

                for (let component of context.packet.text) {
                    if (component.type === "emoji") {
                        const emoji = await this.getEmoji(component.data.trim());
                        message += ` ${emoji}`;
                    } else {
                        message += ` ${component.data}`;
                    }
                }

                results.push(await eatSpaces(message));
            }
        }

        return results;
    }

    public async sendMessage(context: CactusContext) {
        if (!this.chat.isConnected()) {
            throw new Error("Not connected to chat.");
        }

        const finalMessage: string[] = await this.invert(context);
        finalMessage.forEach(async msg => {
            let method = "msg"
            let args = []

            if (context.target) {
                method = "whisper";
                args.push(context.target);
            }
            args.push(msg);
            this.chat.call(method, args);
        });
    }

    public async convertRole(role: String): Promise<Role> {
        role = role.toLowerCase();
        if (role === "mod") {
            return "moderator";
        } else if (role === "owner") {
            return "owner";
        } else {
            return "user";
        }
    }

    public async reauthenticate(data: AuthenticationData) {
        const disconnected = await this.disconnect();
        if (!disconnected) {
            Logger.error("Services", "Mixer: Unable to disconnect");
            return;
        }
        const connected = await this.connect(data.access_token);
        const authenticated = await this.authenticate(this.channel, this.botId);
        if (!connected || !authenticated) {
            Logger.error("Services", `Mixer: Unable to reconnect to ${this.channel}`);
            return;
        }
        Logger.error("Services", `Reconnected to channel ${this.channel}`);
    }

    public async getEmoji(name: string): Promise<string> {
        return this.reversedEmojis[name] || `:${name}:`;
    }

    /**
     * Setup all the carina events.
     *
     * @private
     * @param {number} id the id of the channel to subscribe to
     * @memberof MixerHandler
     */
    private async setupCarinaEvents(id: number) {
        this.carina.on("error", error => Logger.error("Services", error));
        this.carina.subscribe<MixerFollowPacket>(`channel:${id}:followed`, async data => {
            const packet: CactusEventPacket = {
                type: "event",
                kind: {
                    type: "follow",
                    success: data.following
                }
            };
            const context: CactusContext = {
                packet: packet,
                channel: <string>this.channel,
                user: data.user.username,
                service: this.serviceName
            };
            this.events.next(context);
        });

        this.carina.subscribe<MixerHostedPacket>(`channel:${id}:hosted`, async data => {
            const packet: CactusEventPacket = {
                type: "event",
                kind: {
                    type: "host",
                    success: true
                }
            };
            const context: CactusContext = {
                packet: packet,
                channel: <string>this.channel,
                user: data.hoster.token,
                service: this.serviceName
            };
            this.events.next(context);
        });

        this.carina.subscribe<MixerHostedPacket>(`channel:${id}:unhosted`, async data => {
            const packet: CactusEventPacket = {
                type: "event",
                kind: {
                    type: "host",
                    success: false
                }
            };
            const context: CactusContext = {
                packet: packet,
                channel: <string>this.channel,
                user: data.hoster.token,
                service: this.serviceName
            };
            this.events.next(context);
        });

        this.carina.subscribe<MixerSubscribePacket>(`channel:${id}:subscribed`, async data => {
            const packet: CactusEventPacket = {
                type: "event",
                kind: {
                    type: "subscribe",
                    streak: 1
                }
            };
            const context: CactusContext = {
                packet: packet,
                channel: <string>this.channel,
                user: data.username,
                service: this.serviceName
            };
            this.events.next(context);
        });

        this.carina.subscribe<MixerResubscribePacket>(`channel:${id}:resubShared`, async data => {
            const packet: CactusEventPacket = {
                type: "event",
                kind: {
                    type: "subscribe",
                    streak: data.totalMonths
                }
            };
            const context: CactusContext = {
                packet: packet,
                channel: <string>this.channel,
                user: data.username,
                service: this.serviceName
            };
            this.events.next(context);
        });
    }
}
