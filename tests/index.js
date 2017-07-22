"use strict";

// We need this for testing services.
require("reflect-metadata");

const chai = require("chai");
chai.use(require("chai-as-promised"));

const assert = chai.assert;
const expect = chai.expect;
const should = chai.should();

const mixer = require("../dist/service/services/mixer").MixerHandler;
const twitch = require("../dist/service/services/twitch").TwitchHandler;

const mixerChatPacket = {
    "channel": 17887,
    "id": "cc486cd0-6f1e-11e7-acbe-8532481fa356",
    "user_name": "0x01",
    "user_id": 1293590,
    "user_roles": [
        "User"
    ],
    "user_level": 5,
    "message": {
        "message": [
            {"type": "text", "data": "test", "text": "test"}
        ],
        "meta": {}
    }
}

const mixerChatConverted = {
}

const mixerWhisperPacket = {
    "channel": 17887,
    "id": "086474c0-6f1f-11e7-acbe-8532481fa356",
    "user_name": "0x01",
    "user_id": 1293590,
    "user_roles": [
        "User"
    ],
    "user_level": 5,
    "message": {
        "message":[
            {"type": "text", "data": "test", "text": "test"}
        ],
        "meta": {
            "whisper": true
        }
    },
    "target": "CactusBotDev"
}

describe("Service", () => {
    describe("Mixer", () => {
        it("should convert an incoming message", () => {
            let response = mixer.prototype.convert(mixerChatPacket);
            response.then(console.log);
            response = mixer.prototype.convert(mixerWhisperPacket);
            response.then(console.log);
        });
    });
});
