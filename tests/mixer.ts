import { makePropDecorator } from "@angular/core/src/util/decorators";

import "reflect-metadata";

import { test } from "ava";
import { MixerHandler } from "../src/service/services";
import { ServiceStatus } from "../src/service/service";
import { Cereus } from "../src/cereus";
import { default as axios } from "axios";

const mockAdapter = require("axios-mock-adapter");
const cereus = new Cereus("/response");
const mixer = new MixerHandler(cereus);

const mixerChatConverted: CactusContext = {
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

const mixerChatActionConverted: CactusContext = {
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

const mixerWhisperConverted: CactusContext = {
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

const multiEmoji: CactusContext = {
    packet: {
        "type": "message",
        text: [
            {"type": "text", "data": "Cactus love! "},
            {"type": "emoji", "data": "cactus"},
            {"type": "emoji", "data": "green_heart"}
        ],
        action: false // TODO
    },
    channel: undefined,
    user: "0x01",
    role: "user",
    service: "Mixer"
}

const inASpaceSuit = {
    message: {
        message: [
            {
                type: "inaspacesuit",
                text: "0x01inaspacesuit"
            }
        ],
        meta: {}
    },
    "user_roles": [
        "user"
    ],
    "user_name": "0x01"
}

const emoticon = {
    message: {
        message: [
            {
                type: "emoticon",
                text: ":D"
            }
        ],
        meta: {}
    },
    "user_roles": [
        "user"
    ],
    "user_name": "0x01"
}

const link = {
    message: {
        message: [
            {
                type: "link",
                text: "google.com"
            }
        ],
        meta: {}
    },
    "user_roles": [
        "user"
    ],
    "user_name": "0x01"
}

const tag = {
    message: {
        message: [
            {
                type: "tag",
                text: "0x01"
            }
        ],
        meta: {}
    },
    "user_roles": [
        "user"
    ],
    "user_name": "0x01"
}

let mockAPI = new mockAdapter(axios);

test("has the proper name", async t => {
    t.is(mixer.serviceName, "Mixer");
});

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
});

test("should throw an error when trying to join another channel", async t => {
    await mixer.addChannel("test").catch(e => t.pass());
});

test("shouldn't parse when given no message", async t => {
    t.is(await mixer.convert({message: null}), null);
});

test("should error when given 0 length mesages", async t => {
    await mixer.convert({message: {message: []}}).catch(e => t.pass());
});

test("should convert emoticon to emoji", async t => {
    t.deepEqual(await mixer.convert(emoticon), <CactusContext>{
        packet: {
            type: "message",
            text: [
                {
                    type: "emoji",
                    data: ":D"
                }
            ],
            action: false
        },
        channel: undefined,
        user: "0x01",
        role: "user",
        service: "Mixer",
        target: undefined
    });
});

test("should convert inaspacesuit to emoji", async t => {
    t.deepEqual(await mixer.convert(inASpaceSuit), <CactusContext>{
        packet: {
            type: "message",
            text: [
                {
                    type: "emoji",
                    data: "0x01inaspacesuit"
                }
            ],
            action: false
        },
        channel: undefined,
        user: "0x01",
        role: "user",
        service: "Mixer",
        target: undefined
    });
});

test("should convert link to url", async t => {
    t.deepEqual(await mixer.convert(link), <CactusContext>{
        packet: {
            type: "message",
            text: [
                {
                    type: "url",
                    data: "google.com"
                }
            ],
            action: false
        },
        channel: undefined,
        user: "0x01",
        role: "user",
        service: "Mixer",
        target: undefined,
    });
});

test("should convert tag to tag", async t => {
    t.deepEqual(await mixer.convert(tag), <CactusContext>{
        packet: {
            type: "message",
            text: [
                {
                    type: "tag",
                    data: "0x01"
                }
            ],
            action: false
        },
        channel: undefined,
        user: "0x01",
        role: "user",
        service: "Mixer",
        target: undefined
    });
});

const cereusResponseBase: CactusContext[] = [
    {
        service: "Mixer",
        channel: undefined,
        user: "0x01",
        role: "user",
        packet: {
            text: [
                {
                    data: "Cactus love! ",
                    type: "text"
                },
                {
                    data: "cactus",
                    type: "emoji"
                },
                {
                    data: "green_heart",
                    type: "emoji"
                }
            ],
            action: false,
            type: "message"
        },
        target: undefined
    }
]

test("should convert a Cereus packet into Mixer format", async t => {
    mockAPI.onGet("/response").reply(200, cereusResponseBase);

    const response = (await cereus.handle(multiEmoji))[0];  // Only need the first thing
    delete multiEmoji["channel"];
    t.deepEqual(multiEmoji, response);
    const inverted = await mixer.invert(response);
    t.deepEqual(inverted, ["Cactus love! :cactus <3"]);
});
