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

type Role = "user" | "moderator" | "owner" | "subscriber" | "banned";

/**
 * Handle the Mixer service.
 *
 * @export
 * @class MixerHandler
 * @implements {Service}
 */
@ServiceAnnotation("Mixer")
export class MixerHandler extends Service {

    private chat: ChatSocket;

    private base = "https://mixer.com/api/v1";
    private headers = {
        Authorization: ""
    }

    private reversedEmojis: ReverseEmojis = {};

    private carina: Carina;

    private botName = "";

    private botId = 0;

    constructor(protected cereus: Cereus) {
        super(cereus);

        this.reversedEmojis = this.reverseEmojis(mixerEmojis);
    }

    public async connect(oauthKey: string, refresh?: string, expiry?: number): Promise<boolean> {
        this.headers.Authorization = `Bearer ${oauthKey}`

        // Start up carina connection
        Carina.WebSocket = ws;
        this.carina = new Carina({ isBot: true }).open();
        return true;
    }

    public async authenticate(channelRaw: string | number, botId: number): Promise<boolean> {
        let channelId: number;
        this.botId = botId;
        this.channel = channelRaw.toString();
        const nameResult = await axios.get(`${this.base}/channels/${channelRaw}`);
        if (nameResult.status !== 200) {
            return false;
        }
        channelId = nameResult.data.id;
        this.channel = nameResult.data.token;
        await this.setupCarinaEvents(channelId);

        const userResult = await axios.get(`${this.base}/users/current`, {headers: this.headers});
        if (userResult.status !== 200) {
            return false;
        }
        this.botName = userResult.data.username;

        const result = await axios.get(`${this.base}/chats/${channelId}`, {headers: this.headers});
        if (result.status !== 200) {
            // This is bad
            return false;
        }
        this.chat = new ChatSocket(result.data.endpoints).boot();

        const isAuthed = await this.chat.auth(channelId, botId, result.data.authkey);
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

    public async convert(packet: any): Promise<CactusScope> {
        if (packet.message) {
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
                let type: "text" | "emoji" | "tag" | "url" = "text";

                switch (msg.type) {
                    case "emoticon": {
                        type = "emoji";
                        break;
                    }
                    case "inaspacesuit": {
                        type = "emoji";
                        break;
                    }
                    case "link": {
                        type = "url";
                        break;
                    }
                    case "tag": {
                        type = "tag";
                        break;
                    }
                }

                messageComponents.push({
                    type: type,
                    data: trimmed
                });
            });

            let role = await this.convertRole(packet.user_roles[0].toLowerCase());

            let scope: CactusScope = {
                packet: {
                    type: "message",
                    text: messageComponents,
                    action: !!meta.me
                },
                channel: this.channel,
                user: packet.user_name,
                role: role,
                target: packet.target,
                service: this.serviceName
            }

            return scope;

        }
        return null;
    }

    public async invert(...scopes: CactusScope[]): Promise<string[]> {
        let results: string[] = [];

        for (let scope of scopes) {
            let message = "";

            if (scope.packet.type === "message") {
                if (scope.packet.action) {
                    message += "/me ";
                }

                for (let component of scope.packet.text) {
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

    public async sendMessage(scope: CactusScope) {
        if (!this.chat.isConnected()) {
            throw new Error("Not connected to chat.");
        }

        const finalMessage: string[] = await this.invert(scope);
        finalMessage.forEach(async msg => {
            let method = "msg"
            let args = []

            if (scope.target) {
                method = "whisper";
                args.push(scope.target);
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
            Logger.error("Services", "Unable to disconnect from service 'Mixer'.");
            return;
        }
        const connected = await this.connect(data.access_token);
        const authenticated = await this.authenticate(this.channel, this.botId);
        if (!connected || !authenticated) {
            Logger.error("Services", "Unable to connected to channel " + this.channel);
            return;
        }
        Logger.error("Services", "Reconnected to channel " + this.channel);
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
            const scope: CactusScope = {
                packet: packet,
                channel: this.channel,
                user: data.user.username,
                // role: "we don't get this",  // hnng
                service: this.serviceName
            };
            this.events.next(scope);
        });

        this.carina.subscribe<MixerHostedPacket>(`channel:${id}:hosted`, async data => {
            const packet: CactusEventPacket = {
                type: "event",
                kind: {
                    type: "host",
                    success: true
                }
            };
            const scope: CactusScope = {
                packet: packet,
                channel: this.channel,
                user: data.hoster.token,
                service: this.serviceName
            };
            this.events.next(scope);
        });

        this.carina.subscribe<MixerHostedPacket>(`channel:${id}:unhosted`, async data => {
            const packet: CactusEventPacket = {
                type: "event",
                kind: {
                    type: "host",
                    success: false
                }
            };
            const scope: CactusScope = {
                packet: packet,
                channel: this.channel,
                user: data.hoster.token,
                service: this.serviceName
            };
            this.events.next(scope);
        });

        this.carina.subscribe<MixerSubscribePacket>(`channel:${id}:subscribed`, async data => {
            const packet: CactusEventPacket = {
                type: "event",
                kind: {
                    type: "subscribe",
                    streak: 1
                }
            };
            const scope: CactusScope = {
                packet: packet,
                channel: this.channel,
                user: data.username,
                service: this.serviceName
            };
            this.events.next(scope);
        });

        this.carina.subscribe<MixerResubscribePacket>(`channel:${id}:resubShared`, async data => {
            const packet: CactusEventPacket = {
                type: "event",
                kind: {
                    type: "subscribe",
                    streak: data.totalMonths
                }
            };
            const scope: CactusScope = {
                packet: packet,
                channel: this.channel,
                user: data.username,
                service: this.serviceName
            };
            this.events.next(scope);
        });
    }
}
