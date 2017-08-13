import { Cereus } from "../../../cereus";
import { Service, ServiceStatus } from "../../service";
import { ChatSocket } from "mixer-chat";

import { emojis } from "./emoji";

import { Carina } from "carina";
import * as ws from "ws";
import * as httpm from "typed-rest-client/HttpClient";

import { Service as ServiceAnnotation } from "../../service.annotation";

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

    protected _status: ServiceStatus = ServiceStatus.AUTHENTICATING;

    private chat: ChatSocket;
    private httpc: httpm.HttpClient = new httpm.HttpClient("aerophyl");

    private base = "https://mixer.com/api/v1";
    private headers = {
        Authorization: ""
    }

    private reversedEmoji: Emojis = {};

    private carina: Carina;

    private botName = "";

    constructor(protected cereus: Cereus) {
        super(cereus);

        // Emoji stuff
        for (let k of Object.keys(emojis)) {
            const v = emojis[k];
            this.reversedEmoji[v] = k;
        }
    }

    public async connect(oauthKey: string, refresh?: string, expiry?: string): Promise<boolean> {
        this.headers.Authorization = `Bearer ${oauthKey}`

        // Start up carina connection
        Carina.WebSocket = ws;
        this.carina = new Carina({ isBot: true }).open();
        return true;
    }

    public async authenticate(channelRaw: string | number, botId: number): Promise<boolean> {
        let channelId: number;
        const nameResult = await this.httpc.get(`${this.base}/channels/${channelRaw}`);
        if (nameResult.message.statusCode !== 200) {
            return false;
        }
        let json = JSON.parse(await nameResult.readBody());
        channelId = json.id;
        this._channel = json.token;
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
            let converted = await this.convert(message);
            if (converted.user === this.botName) {
                return;
            }
            const responses = await this.cereus.handle(await this.cereus.parseServiceMessage(converted));
            if (!responses) {
                console.error("Mixer MessageHandler: Got no response from Cereus? " + JSON.stringify(converted));
                return;
            }
            responses.forEach(async response => this.sendMessage(response));
        });

        this.chat.on("error", console.error);
        return this.chat.isConnected();
    }

    public async disconnect(): Promise<boolean> {
        this.chat.close();
        // Just assume that it was closed.
        return true;
    }

    public async convert(packet: any): Promise<CactusScope> {
        if (!!packet.message) {
            const message = packet.message.message;
            const meta = packet.message.meta;

            if (message.length < 1) {
                // This is bad, and a Mixer bug.
                throw new Error("No message");
            }
            let messageComponents: Component[] = []

            // Parse each piece of the message
            message.forEach(async (msg: MixerChatMessage) => {
                const trimmed = msg.text.trim();
                let type: "text" | "emoji" | "tag" | "url" | "variable" = "text";

                if (!!emojis[trimmed]) {
                    type = "emoji";
                }

                messageComponents.push({
                    type: type,
                    data: msg.text
                });
            });

            let role = await this.convertRole(packet.user_roles[0].toLowerCase());

            let scope: CactusScope = {
                packet: {
                    type: "message",
                    text: messageComponents,
                    action: !!meta.me
                },
                channel: this._channel,
                user: packet.user_name,
                role: role,
                target: meta.whisper,
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

                for (let messagePacket of scope.packet.text) {
                    if (messagePacket.type === "emoji") {
                        const emoji = this.getEmoji(messagePacket.data.trim());
                        message += ` :${emoji}`;
                    } else {
                        message += ` ${messagePacket.data}`;
                    }
                }

                results.push(message.trim());
            }

            // return "FLAMING THINGS";
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

    public get status(): ServiceStatus {
        return this._status;
    }

    public set status(status: ServiceStatus) {
        this._status = status;
    }

    public async getEmoji(name: string): Promise<string> {
        return emojis[name] ? emojis[name] : this.reversedEmoji[name] ? this.reversedEmoji[name] : "";
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
                kind: {
                    type: "follow",
                    success: data.following
                }
            };
            const scope: CactusScope = {
                packet: packet,
                channel: this._channel,
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
                channel: this._channel,
                user: data.hoster.token,
                // role: "we don't get this",  // hnng
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
                channel: this._channel,
                user: data.hoster.token,
                // role: "we don't get this",  // hnng
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
                channel: this._channel,
                user: data.username,
                // role: "we don't get this",  // hnng
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
                channel: this._channel,
                user: data.username,
                // role: "we don't get this",  // hnng
                service: this.serviceName
            };
            this.events.next(scope);
        });
    }
}
