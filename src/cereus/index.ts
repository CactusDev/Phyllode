import { ServiceHandler } from "../service";

import { Logger } from "../logger";

import { Subject } from "rxjs";
import { eatSpaces } from "../util";
import { default as axios } from "axios";

export const messages: Subject<CactusMessagePacket> = new Subject();

const validVariables: string[] = ["COUNT", "CHANNEL", "USER"];

/**
 * The CactusBot Cereus handler system.
 *
 * @export
 * @class Cereus
 */
export class Cereus {

    constructor(private serviceHandler: ServiceHandler, protected responseUrl: string) {
    }

    public async parseServiceMessage(scope: CactusScope): Promise<CactusScope> {
        if (scope.packet.type !== "message") {
            return scope;
        }
        const components = scope.packet.text;
        if (!components || components.some(e => !e.data)) {
            return scope;
        }

        // Does this packet-set actually need to be parsed?
        // Packets that don't contain a variable don't need to be parsed twice.
        if (!components.some(e => e.data.includes("%"))) {
            return scope;
        }

        for (let packet of scope.packet.text) {
            // We only care about components that can contain a variable, the text type.
            if (packet.type !== "text") {
                continue;
            }
            const message = packet.data;

            let current = "";
            let inVariable = false;
            let packets: Component[] = [];

            for (let pos = 0; pos < message.length; pos++) {
                const char = message[pos];
                if (char === " ") {
                    inVariable = false;
                    current += " ";
                } else if (char === "%") {
                    if (inVariable) {
                        inVariable = false;
                        packets.push({
                            type: "variable",
                            data: await eatSpaces(current)
                        });
                        current = "";
                    } else {
                        inVariable = true;
                        packets.push({
                            type: "text",
                            data: await eatSpaces(current)
                        });
                        current = "";
                    }
                } else {
                    current += char;
                    if (pos === message.length - 1) {
                        packets.push({
                            type: "text",
                            data: await eatSpaces(current)
                        });
                    }
                }
            }
            // Now that we're done, set all the packets to the new ones.
            (<CactusMessagePacket> scope.packet).text = packets;
        };
        return scope;
    }

    /**
     * Send a service packet to Cereus, and then give the response back.
     *
     * @param {CactusScope} packet the packet to send.
     * @returns {Promise<CactusScope[]>} the response from Cereus
     * @memberof Cereus
     */
    public async handle(packet: CactusScope): Promise<CactusScope[]> {
        const response = await axios.get(this.responseUrl, {
            data: JSON.stringify(packet)
        });
        if (response.status === 404) {
            Logger.error("Cereus", "Invalid packet sent: '" + JSON.stringify(packet) + "'");
            return null;
        }
        let message: CactusScope[];
        try {
            message = response.data;
        } catch (e) {
            Logger.error("Cereus", `Invalid JSON`);
            return null;
        }
        if (!message || message.length < 1) {
            return null;
        }
        return message;
    }
}
