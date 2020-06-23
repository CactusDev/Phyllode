
import { AbstractServiceParser } from ".";
import { mixerEmojis } from "./emoji/mixer";

import { eatSpaces } from "../util";

const isUrl = require("is-url");

export class MixerParser extends AbstractServiceParser {
    private reversedEmojis: ReverseEmojis;

    constructor() {
        super();

        this.reversedEmojis = this.reverseEmojis(mixerEmojis);
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
        if (!message.meta) {
            return null;
        }

        let role: Role = "user";
        if (message.meta.role === "Mod") {
            role = "moderator";
        } else {
            role = message.meta.role;
        }

        let components: Component[] = [];
        for (let segment of message.parts) {
            if (segment === "") {
                continue;
            }
            let segmentType: "text" | "emoji" | "url" = "text";
            let segmentData: any = segment;

            if (mixerEmojis[segment]) {
                segmentType = "emoji";
                segmentData = mixerEmojis[segment].standard;
            } else if (isUrl(segment)) {
                segmentType = "url";
            }
            components.push({
                type: segmentType,
                data: segmentData
            });
        }

        const context: CactusContext = {
            user: message.source,
            channel: message.channel,
            packet: {
                "type": "message",
                text: components,
                action: message.meta.action
            },
            role: (<any> role.toLowerCase()),
            service: message.service,
            target: message.meta.target
        }
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
                    if (!msg) {
                        continue;
                    }
                    action = packet.action;
                    channel = message.channel;
                    service = message.service;
                    target = message.target;
                    
                    if (msg.type === "emoji") {
                        const emoji = await this.getEmoji(msg.data);
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
