
import { AbstractServiceParser } from ".";
import { twitchEmojis } from "./emoji/twitch";

import { eatSpaces } from "../util";

const isUrl = require("is-url");

export class TwitchParser extends AbstractServiceParser {
    private reversedEmojis: ReverseEmojis;

    constructor() {
        super();

        this.reversedEmojis = this.reverseEmojis(twitchEmojis);
    }

    protected reverseEmojis(emojis: Emojis): ReverseEmojis {
        let reversed: ReverseEmojis = {};

        Object.keys(emojis).forEach(k => reversed[emojis[k].standard] = k);
        Object.keys(emojis).filter(k => !!emojis[k].alternatives).forEach(k =>
            emojis[k].alternatives.filter(alt => !!reversed[alt]).forEach(alt => reversed[alt] = k));

        return reversed;
    }

    public async getEmoji(name: string): Promise<string> {
        return this.reversedEmojis[name] || `:${name}:`;
    }

    public async parse(message: ProxyMessage): Promise<CactusContext> {
        if (!message) {
            return null;
        }
        const state = message.meta;
        if (!state) {
            return null;
        }
        let isMod = false;
        let isBroadcaster = false;
        let isSub = false;

        if (state.badges) {
            isBroadcaster = state.badges.broadcaster && state.badges.broadcaster === "1";
            isMod = state.mod;
            isSub = state.subscriber;
        }
        let role: Role = "user";
        /* istanbul skip next */
        if (isMod) {
            role = "moderator";
        } else if (isSub) {
            role = "subscriber"
        } else if (isBroadcaster) {
            role = "owner";
        }

        let components: Component[] = [];
        for (let segment of message.parts) {
            if (segment === "") {
                continue;
            }

            let segmentType: "text" | "emoji" | "url" = "text";
            let segmentData: any = segment;
            if (twitchEmojis[segment]) {
                segmentType = "emoji";
                segmentData = twitchEmojis[segment];
            } else if (isUrl(segment)) {
                segmentType = "url";
            }
            components.push({
                type: segmentType,
                data: segmentData
            });
        }

        const type = state["message-type"];
        const isAction = type === "action";
        let target: string = type === "whisper" ? state.username : null;
        const context: CactusContext = {
            packet: {
                "type": "message",
                text: components,
                action: isAction
            },
            channel: message.channel,
            user: state["display-name"],
            role: role || "user",
            service: message.service,
            target: !!target ? target : undefined
        };
        return context;
    }

    public async synthesize(messages: CactusContext[]): Promise<ProxyResponse[]> {
        let action = false;
        let channel = "";
        let service = "";
        let target = "";

        let responses: ProxyResponse[] = [];

        for (let message of messages) {
            let finished = "";
            if (message.packet.type === "message") {
                let packet = <CactusMessagePacket> message.packet;
                for (let msg of packet.text) {
                    /* istanbul skip next */
                    if (!msg) {
                        continue;
                    }
                    action = packet.action;
                    channel = message.channel;
                    service = message.service;
                    target = message.target;
                    
                    if (msg.type === "emoji") {
                        const emoji = await this.getEmoji((<EmojiComponentData>msg.data).standard);  // TODO: This should lookup alternatives
                        finished += ` ${emoji}`;
                        continue;
                    }
                    finished += " " + msg.data;
                }
                const response: ProxyResponse = {
                    order: 0,
                    channel,
                    service,
                    meta: {
                        action,
                        target
                    },
                    message: await eatSpaces(finished)
                };
                responses.push(response);
            }
        }

        return responses;
    }
}
