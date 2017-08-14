
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

const argPacket: CactusScope = {
    packet: {
        type: "message",
        text: [
            {
                type: "text",
                data: "Hello, %ARGS%"
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

const argPacketFinished: CactusScope = {
    packet: {
        type: "message",
        text: [
            {
                type: "text",
                data: "Hello,"
            },
            {
                type: "variable",
                data: "ARGS"
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

const noTextPacket: CactusScope = {
    packet: {
        type: "message",
        text: [],
        action: false
    },
    user: "0x01",
    role: "user",
    service: "Mixer",
    channel: undefined,
    target: "CactusBotDev"
}

test("packets containing no variables should be returned", async t => {
    const result = await cereus.parseServiceMessage(packet);
    t.deepEqual(result, packet);
});

test("convert text ARGS to variable ARGS", async t => {
    const result = await cereus.parseServiceMessage(argPacket);
    t.deepEqual(result, argPacketFinished);
});

test("packets without text or data should be ignored", async t => {
    const result = await cereus.parseServiceMessage(noTextPacket);
    t.deepEqual(result, noTextPacket);
});
