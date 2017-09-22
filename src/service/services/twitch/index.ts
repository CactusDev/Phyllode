import { Config } from "../../../config";
import { Cereus } from "../../../cereus";
import { Service, ServiceStatus } from "../../service";
import { twitchEmojis } from "./emoji";

import { Service as ServiceAnnotation } from "../../service.annotation";
import { Logger } from "../../../logger";

import { eatSpaces } from "../../../util";

const tmi = require("tmi.js");
const isUrl = require("is-url");

@ServiceAnnotation("Twitch")
export class TwitchHandler extends Service {

    private instance: any;
    private oauth = "";
    private reversedEmojis: ReverseEmojis = {};

    constructor(protected cereus: Cereus) {
        super(cereus);

        this.reversedEmojis = this.reverseEmojis(twitchEmojis);
    }

    public async connect(oauthKey: string, refresh?: string, expiry?: number): Promise<boolean> {
        if (this.getStatus() === ServiceStatus.READY) {
            return false;
        }
        this.oauth = oauthKey;
        return true;
    }

    public async authenticate(channel: string | number, botId: string | number): Promise<boolean> {
        // TODO: Handle number channel ids
        this.channel = (<string>channel).toLowerCase();

        const connectionOptions = {
            connection: {
                reconnect: true
            },
            identity: {
                username: botId,
                password: `oauth:${this.oauth.replace("oauth:", "")}`
            },
            channels: [channel]  // TODO: See the above todo.
        }

        this.instance = new tmi.client(connectionOptions);
        this.instance.connect();

        this.instance.on("join", (joinedChannel: string, user: string, joined: boolean) => {
            if (joined && user === botId) {
                Logger.info("Services", `Connected to Twitch channel '${joinedChannel}' on account '${user}'`);
            }
        });

        this.instance.on("message", async (fromChannel: string, state: any, message: string, self: boolean) => {
            Logger.info("Messages", `${fromChannel}(Twitch): ${message}`);
            // Make sure that this message didn't come from us.
            if (self) {
                return;
            }
            // Now that we know it's not us, then we can start parsing.
            const converted = await this.convert([message, state, fromChannel]);
            const responses = await this.cereus.handle(await this.cereus.parseServiceMessage(converted));
            if (responses) {
                responses.forEach(async response => await this.sendMessage(response));
            }
        });
        return true;
    }

    public async disconnect(): Promise<boolean> {
        return true;
    }

    public async convert(packet: any): Promise<CactusContext> {
        const message: any = packet[0];
        const state: any = packet[1];
        const channel: string = packet[2];

        let isMod = false;
        let isBroadcaster = false;
        let isSub = false;

        if (state.badges) {
            isBroadcaster = state.badges.broadcaster && state.badges.broadcaster === "1";
            isMod = state.mod;
            isSub = state.subscriber;
        }

        let textRole = "user";
        if (isMod) {
            textRole = "mod";
        } else if (isBroadcaster) {
            textRole = "broadcaster";
        }

        const role = await this.convertRole(textRole);

        const finished: Component[] = [];
        const segments: any[] = message.split(" ");
        for (let rawSegment of segments) {
            const segment = rawSegment.trim();
            let segmentType: "text" | "emoji" | "url" = "text";
            let segmentData: any;

            if (twitchEmojis[segment]) {
                // TODO: Make independent of twitchEmojis.
                // For example, Cereus should ban users for emoji spam
                // regarldess of whether or not the emoji has been stored in
                // twitchEmojis.
                // Twitch packets give information about emoji location, which
                // can be used to solve this.
                segmentType = "emoji";
                segmentData = twitchEmojis[segment];
            } else if (isUrl(segment)) {
                segmentType = "url";
                segmentData = segment;
            } else {
                segmentData = segment;
            }
            finished.push({
                "type": segmentType,
                data: await eatSpaces(segmentData)
            });
        }
        let isAction = false;
        let target: string = undefined;
        const messageType = state["message-type"]

        if (messageType === "action") {
            isAction = true;
        } else if (messageType === "whisper") {
            target = state.username;
        }

        const context: CactusContext = {
            packet: {
                "type": "message",
                text: finished,
                action: isAction
            },
            channel: channel,
            user: state["display-name"],
            role: role,
            service: this.serviceName
        };

        if (target) {
            context.target = target;
        }

        return context;
    }

    public async invert(...contexts: CactusContext[]): Promise<string[]> {
        let finished: string[] = [];
        for (let context of contexts) {
            if (context.packet.type === "message") {
                let packet = (<CactusMessagePacket>context.packet);
                let messages = packet.text;
                let chatMessage = "";

                if (packet.action) {
                    chatMessage += "ACTION ";
                }

                for (let msg of messages) {
                    if (msg !== null) {
                        if (msg["type"] === "emoji") {
                            const emoji = await this.getEmoji(msg.data.trim());
                            chatMessage += ` ${emoji}`;
                        } else {
                            chatMessage += ` ${msg.data.replace("\u0001", "")}`;
                        }
                    }
                }
                finished.push(await eatSpaces(chatMessage));
            }
        }
        return finished;
    }

    public async getEmoji(name: string): Promise<string> {
        return this.reversedEmojis[name] || `:${name}:`;
    }

    public async sendMessage(message: CactusContext) {
        const inverted = await this.invert(message);
        inverted.forEach(packet => {
            if (message.target) {
                this.instance.whisper(message.target, packet);
                return;
            }
            this.instance.say(this.channel, packet);
        });
    }

    public async convertRole(role: string): Promise<Role> {
        role = role.toLowerCase();
        if (role === "mod") {
            return "moderator";
        } else if (role === "broadcaster") {
            return "owner";
        }
        return "user";
    }

    public async addChannel(channel: string): Promise<void> {
        Logger.info("Services", `Attempting to join ${channel}...`);
        if (this.instance) {
            this.instance.join(channel);
        }
    }
}
