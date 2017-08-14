
import "reflect-metadata";

import { test } from "ava";
import { MixerHandler } from "../src/service/services";

const mixer = new MixerHandler(null);

const mixerChatConverted: CactusScope = {
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
    channel: undefined, // What in tarnation
    target: undefined  // What in tarnation 2
}

const mixerChatActionConverted: CactusScope = {
    packet: {
        type: "message",
        text: [
            {
                type: "text",
                data: "test"
            }
        ],
        action: true
    },
    user: "0x01",
    role: "user",
    service: "Mixer",
    channel: undefined, // What in tarnation
    target: undefined  // What in tarnation 2
}

const mixerWhisperConverted: CactusScope = {
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

const mixerWhisperPacket = {
    channel: 17887,
    id: "086474c0-6f1f-11e7-acbe-8532481fa356",
    user_name: "0x01",
    user_id: 1293590,
    user_roles: [
        "User"
    ],
    user_level: 5,
    message: {
        message: [
            {
                type: "text",
                data: "test",
                text: "test"
            }
        ],
        meta: {
            whisper: true
        }
    },
    target: "CactusBotDev"
}

const mixerChatPacket = {
    channel: 17887,
    id: "cc486cd0-6f1e-11e7-acbe-8532481fa356",
    user_name: "0x01",
    user_id: 1293590,
    user_roles: [
        "User"
    ],
    user_level: 5,
    message: {
        message: [
            {
                type: "text",
                data: "test",
                text: "test"
            }
        ],
        meta: {}
    }
}

const multiEmoji: CactusScope = {
    packet: {
        "type": "message",
        text: [
            {"type": "text", "data": "Cactus love! "},
            {"type": "emoji", "data": "cactus"},
            {"type": "emoji", "data": "green_heart"}
        ],
        action: false // TODO
    },
    channel: "innectic",
    user: "Innectic",
    role: "owner",
    service: "Mixer"
}


test("converts a Mixer chat packet to a Cactus chat packet", async t => {
    const result = await mixer.convert(mixerChatPacket);
    t.deepEqual(result, mixerChatConverted);
});

test("converts a Mixer whisper packet to a Cactus whisper packet", async t => {
    const result = await mixer.convert(mixerWhisperPacket);
    t.deepEqual(result, mixerWhisperConverted);
});

test("converts a Cactus message packet to a Mixer message packet", async t => {
    const result = await mixer.invert(mixerChatConverted);
    t.deepEqual(result, ["test"]);
});

test("converts a Cactus message whisper packet to a Mixer whisper packet", async t => {
    const result = await mixer.invert(mixerWhisperConverted);
    t.deepEqual(result, ["test"]);
});

test("converts a Cactus message action packet to a Mixer message action packet", async t => {
    const result = await mixer.invert(mixerChatActionConverted);
    t.deepEqual(result, ["/me test"]);
});

test("converts 'Owner' to 'owner'", async t => {
    const result = await mixer.convertRole("Owner");
    t.is(result, "owner");
});

test("converts 'Mod' to 'moderator'", async t => {
    const result = await mixer.convertRole("Mod");
    t.is(result, "moderator");
});

test("converts 'literally anything else' to 'user'", async t => {
    const result = await mixer.convertRole("literally anything else");
    t.is(result, "user");
});

test("converts a text, cactus, and green heart to the proper format for Mixer.", async t => {
    const result = await mixer.invert(multiEmoji);
    t.deepEqual(result, ["Cactus love! :cactus <3"]);
})
