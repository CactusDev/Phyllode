
import { Logger } from "cactus-stl";

import { Subject } from "rxjs";
import { eatSpaces } from "../util";
import { default as axios } from "axios";

export const messages: Subject<CactusMessagePacket> = new Subject();

/**
 * The CactusBot Cereus handler system.
 *
 * @export
 * @class Cereus
 */
export class Cereus {

    constructor(protected responseUrl: string) {
    }

    public async parseServiceMessage(context: CactusContext): Promise<CactusContext> {
        if (context.packet.type !== "message") {
            return context;
        }
        const components = context.packet.text;
        if (!components || components.some(e => !e.data)) {
            return context;
        }

        let packets: Component[] = [];
        for (let packet of context.packet.text) {
            // We only care about components that can contain a variable, the text type.
            if (packet.type !== "text") {
                packets.push(packet);
                continue;
            }
            const message = <string>packet.data;

            let current = "";

            for (let pos = 0; pos < message.length; pos++) {
                const char = message[pos];
                if (char === " ") {
                    packets.push({
                        type: "text",
                        data: current
                    });

                    current = "";
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
        };
        (<CactusMessagePacket> context.packet).text = packets;
        return context;
    }

    /**
     * Send a service packet to Cereus, and then give the response back.
     *
     * @param {CactusContext} packet the packet to send.
     * @returns {Promise<CactusContext[]>} the response from Cereus
     * @memberof Cereus
     */
    public async handle(packet: CactusContext): Promise<CactusContext[]> {
        const data = JSON.stringify(packet);
        console.log(data);
        const response = await axios.get(this.responseUrl, { data });
        if (response.status === 404) {
            Logger.error("Cereus", "Invalid packet sent: '" + JSON.stringify(packet) + "'");
            return null;
        }
        const message: CactusContext[] = response.data || null;
        return !message || message.length === 0 ? null : message;
    }
}
