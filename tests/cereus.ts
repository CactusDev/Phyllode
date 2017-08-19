
import { test } from "ava";
import { Cereus } from "../src/cereus";
import { default as axios } from "axios";

const mockAdapter = require("axios-mock-adapter");
const cereus = new Cereus("response");
let mockAPI = new mockAdapter(axios);

const packet: CactusContext = {
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

const argPacket: CactusContext = {
    packet: {
        type: "message",
        text: [
            {
                type: "tag",
                data: "innnectic"
            },
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

const argPacketFinished: CactusContext = {
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

const noTextPacket: CactusContext = {
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

const emptyDataPacket: CactusContext = {
    packet: {
        type: "message",
        text: [
            {
                type: "text",
                data: null
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

const eventPacket: CactusContext = {
    packet: {
        type: "event",
        kind: {
            success: true,
            streak: 1,
            type: "follow"
        }
    },
    user: "0x01",
    role: "user",
    service: "Mixer",
    channel: undefined,
}

test("packets containing no variables should be returned", async t => {
    const result = await cereus.parseServiceMessage(packet);
    t.deepEqual(result, packet);
});

test("convert text ARGS to variable ARGS", async t => {
    const result = await cereus.parseServiceMessage(argPacket);
    t.deepEqual(result, argPacketFinished);
});

test("packets without text should be ignored", async t => {
    const result = await cereus.parseServiceMessage(noTextPacket);
    t.deepEqual(result, noTextPacket);
});

test("packets without text data should be ignored", async t => {
    const result = await cereus.parseServiceMessage(emptyDataPacket);
    t.deepEqual(result, emptyDataPacket);
});

test("events packets should be ignored", async t => {
    const result = await cereus.parseServiceMessage(eventPacket);
    t.deepEqual(result, eventPacket);
});

test("should error from invalid json", async t => {
    mockAPI.onGet("/response").reply(200, "");
    t.is(await cereus.handle(eventPacket), null);
});

test("should return 404 from invalid data", async t => {
    mockAPI.onGet("/response").reply(404, []);
    t.is(await cereus.handle(eventPacket), null);
});

test("should return nothing when cereus gives an empty list", async t => {
    mockAPI.onGet("/response").reply(200, []);
    t.is(await cereus.handle(eventPacket), null);
});

