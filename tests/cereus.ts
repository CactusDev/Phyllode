
import { test } from "ava";

import { Cereus } from "../src/cereus";

const cereus = new Cereus(null, "");

const packet: CactusScope = {
    packet: {
        type: "message",
        text: [
            {
                type: "text",
                data: "test"
            }
        ],
        action: false
    },
    user: "0x01",
    role: "user",
    service: "Mixer",
    channel: undefined,
    target: "CactusBotDev"
}

const finished: CactusScope = {
    packet: {
        type: "message",
        text: [
            {
                type: "text",
                data: "test"
            }
        ],
        action: false
    },
    user: "0x01",
    role: "user",
    service: "Mixer",
    target: "CactusBotDev",
    channel: undefined
}

test("convert from cactus packet to cereus packet", async t => {
    const result = await cereus.parseServiceMessage(packet);
    t.deepEqual(result, finished);
});
