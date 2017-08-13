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

    public async parseServiceMessage(scope: CactusScope): Promise<CactusScope> {

        if (scope.packet.type === "message") {
            const components = scope.packet.text;
            if (!components || components.some(e => !e.data)) {
                return null;
            }

            // Does this packet-set actually need to be parsed?
            // Packets that don't contain a variable don't need to be parsed twice.
            const shouldParse = components.some(e => e.data.includes("%"));
            if (!shouldParse) {
                return scope;
            }

            scope.packet.text.forEach(async packet => {
                // We only care about components that can contain a variable, the text type.
                if (packet.type !== "text") {
                    return;
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
                                data: current
                            })
                            current = "";
                        } else {
                            inVariable = true;
                            packets.push({
                                type: "text",
                                data: current
                            });
                            current = "";
                        }
                    } else {
                        current += char;
                        if (pos === message.length - 1) {
                            packets.push({
                                type: "text",
                                data: current
                            });
                        }
                    }
                }
                // Now that we're done, set all the packets to the new ones.
                (<CactusMessagePacket>scope.packet).text = packets;
            });
            console.log("Final", JSON.stringify(scope));
            return scope;
        }
    }

    /**
     * Send a service packet to Cereus, and then give the response back.
     *
     * @param {CactusScope} packet the packet to send.
     * @returns {Promise<CactusScope[]>} the response from Cereus
     * @memberof Cereus
     */
    public async handle(packet: CactusScope): Promise<CactusScope[]> {
        const response = await this.httpc.post("http://151.80.89.161:6023/response", JSON.stringify(packet));
        if (response.message.statusCode !== 200) {
            return null;
        }
        let message: CactusScope[];
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
        return message;  // XXX: Do we need all the responses?
    }
}
