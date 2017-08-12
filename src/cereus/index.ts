import { ServiceHandler } from "../service";

import { Subject } from "rxjs";
import * as httpm from "typed-rest-client/HttpClient";

export const messages: Subject<CactusMessagePacket> = new Subject();

const validVariables: string[] = ["COUNT", "CHANNEL", "USER"];

/**
 * The CactusBot Cereus handler system.
 *
 * @export
 * @class Cereus
 */
export class Cereus {

    private httpc: httpm.HttpClient = new httpm.HttpClient("aerophyl-cereus-handler");

    constructor(private serviceHandler: ServiceHandler) {

    }

    public async parseServiceMessage(messagePacket: CactusMessagePacket): Promise<CactusMessagePacket> {
        const messagePackets = messagePacket.text;
        if (!messagePackets || messagePackets.some(e => !e.data)) {
            return null;
        }

        // Does this packet-set actually need to be parsed?
        // Packets that don't contain a variable don't need to be parsed twice.
        const shouldParse = messagePackets.some(e => e.data.includes("%"));
        if (!shouldParse) {
            return messagePacket;
        }

        messagePacket.text.forEach(async packet => {
            // We only care about components that can contain a variable, the text type.
            if (packet.type !== "text") {
                return;
            }
            const message = packet.data;

            let current = "";
            let inVariable = false;
            let packets: CactusMessageComponent[] = [];

            for (let pos = 0; pos < message.length; pos++) {
                const char = message[pos];
                if (char === " ") {
                    inVariable = false;
                    current += " ";
                } else if (char === "%") {
                    if (inVariable) {
                        inVariable = false;
                        let split = current.split("|");
                        let data: any = {};
                        let modifiers: string[] = [];

                        if (split.length > 1) {
                            // Get everything that ISN'T the variable.
                            modifiers = split.slice(1);
                        }
                        const prefix = split[0]
                        // Is this an argument-segment?
                        if (prefix.startsWith("ARG")) {
                            // This is all arguments, and it's valid.
                            const end = prefix.substring(3, prefix.length);
                            data["type"] = prefix;
                            if (end === "S") {
                                // XXX: Can we remove this if statement? The only purpose is so that it doesn't hit the `else` block.
                            } else if (+end) {
                                // Handle ARG1
                                data["data"] = +end
                            } else {
                                // Invalid ending for the ARG variable.
                                continue;
                            }
                            // Push the variable.
                            packets.push({
                                "type": "variable",
                                tag: data,
                                modifiers: modifiers
                            });
                            current = "";
                            // And now we're done with this segment!
                            continue;
                        } else if (validVariables.indexOf(prefix)) {
                            // None of the other arguments require extra parsing.
                            // Valid variable, so lets put this into the packet as one.
                            data["type"] = prefix;
                            // Push the variable.
                            packets.push({
                                "type": "variable",
                                tag: data,
                                modifiers: modifiers
                            });
                            current = "";
                            // And we're done with this segment!
                            continue;
                        }
                    } else {
                        inVariable = true;
                        packets.push({
                            "type": "text",
                            data: current
                        });
                        current = "";
                    }
                } else {
                    current += char;
                    if (pos === message.length - 1) {
                        packets.push({
                            "type": "text",
                            data: current
                        });
                    }
                }
            }
            // Now that we're done, set all the packets to the new ones.
            messagePacket.text = packets;
        });
        return messagePacket;
    }

    /**
     * Send a service packet to Cereus, and then give the response back.
     *
     * @param {(CactusEventPacket | CactusMessagePacket)} packet the packet to send.
     * @returns {Promise<CactusMessagePacket>} the response from Cereus
     * @memberof Cereus
     */
    public async handle(packet: CactusEventPacket | CactusMessagePacket): Promise<CactusMessagePacket> {
        const response = await this.httpc.post("http://localhost:5023/response", JSON.stringify(packet));
        if (response.message.statusCode !== 200) {
            return null;
        }
        let message: CactusMessagePacket[];
        try {
            message = JSON.parse(await response.readBody());
        } catch (e) {
            console.error(e);
            return null;
        }
        if (!message || message.length < 1) {
            console.error("Didn't get a response from cereus. Packet: " + JSON.stringify(packet));
            return null;
        }
        return message[0];  // XXX: Do we need all the responses?
    }
}
