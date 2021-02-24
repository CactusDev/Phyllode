
import { AbstractServiceParser } from "."
import { glimeshEmojis } from "./emoji/glimesh"

import { eatSpaces } from "../util"

const isUrl = require("is-url")

export class GlimeshParser extends AbstractServiceParser {
    private reversedEmojis: ReverseEmojis

    constructor() {
        super()
        this.reversedEmojis = this.reverseEmojis(glimeshEmojis)
    }

    protected reverseEmojis(emojis: Emojis): ReverseEmojis {
        let reversed: ReverseEmojis = {}

        Object.keys(emojis).forEach(k => reversed[emojis[k].standard] = k)
        Object.keys(emojis).filter(k => !!emojis[k].alternatives).forEach(k =>
            emojis[k].alternatives.filter(alt => !!reversed[alt]).forEach(alt => reversed[alt] = k))

        return reversed
    }

    public async getEmoji(name: string): Promise<string> {
        return this.reversedEmojis[name] || `:${name}:`;
    }

    public async parse(message: ProxyMessage): Promise<CactusContext> {
        if (!message || !message.meta) {
            return null;
        }

        const state = message.meta
        let role: Role = "user"

        // TODO: Role support

        let components: Component[] = []
        for (let segment of message.parts) {
            if (segment === "") {
                continue
            }

            let segmentType: "text" | "emoji" | "url" = "text"
            let segmentData: any = segment

            if (glimeshEmojis[segment]) {
                segmentType = "emoji"
                segmentData = glimeshEmojis[segment]
            } else if (isUrl(segment)) {
                segmentType = "url"
            }

            components.push({
                type: segmentType,
                data: segmentData
            })
        }

        // TODO: is a message a DM? Is it a /me?
        const isAction = false
        let target: string = null
        const context: CactusContext = {
            packet: {
                "type": "message",
                text: components,
                action: isAction
            },
            channel: message.channel,
            user: state.username,
            role: role || "user",
            service: message.service,
            target: target || undefined
        }
        return context
    }

    public async synthesize(messages: CactusContext[]): Promise<ProxyResponse[]> {
        let responses: ProxyResponse[] = []

        for (let message of messages) {
            let finished = ""
            if (message.packet.type === "message") {
                let packet = <CactusMessagePacket> message.packet
                
                const action = packet.action
                let { channel, service, target}  = message

                for (let msg of packet.text) {
                    /* istanbul skip next */
                    if (!msg) {
                        continue
                    }
                    
                    if (msg.type === "emoji") {
                        const emoji = await this.getEmoji((<EmojiComponentData>msg.data).standard)
                        finished += ` ${emoji}`;
                        continue;
                    }
                    finished += " " + msg.data
                }
                const response: ProxyResponse = {
                    order: 0,
                    channel,
                    service,
                    meta: {
                        action,
                        target
                    },
                    message: eatSpaces(finished)
                };
                responses.push(response);
            }
        }
        return responses;
    }
}
