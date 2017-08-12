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

const mixerChatConverted = {
    type: "message",
    text: [
        {
            type: "text",
            data: "test"
        }
    ],
    action: false,
    user: "0x01",
    role: "user"
}

const mixerWhisperConverted = {
    type: "message",
    text: [
        {
            type: "text",
            data: "test"
        }
    ],
    action: false,
    user: "0x01",
    role: "user",
    target: "CactusBotDev"
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

describe("Service", () => {
    describe("Mixer", () => {
        it("should convert an incoming message", (done) => {
            mixer.prototype.convert(mixerChatPacket).then(JSON.stringify)
                .should.eventually.be.equal(JSON.stringify(mixerChatConverted)).notify(done);
        });

        it("should convert a whispered message", (done) => {
            mixer.prototype.convert(mixerWhisperPacket).then(JSON.stringify)
                .should.eventually.be.equal(JSON.stringify(mixerWhisperConverted)).notify(done);
        });

        // This might look like it does nothing, but it's important.
        it("should convert the 'cactus' emote into 'cactus'", (done) => {
            mixer.prototype.getEmoji("cactus").should.eventually.be.equal("cactus").notify(done);
        });

        it("should convert the 'Mod' role to 'moderator'", (done) => {
            mixer.prototype.convertRole("Mod").should.eventually.be.equal("moderator").notify(done);
        });

        it("should convert the 'User' role to 'user'", (done) => {
            mixer.prototype.convertRole("User").should.eventually.be.equal("user").notify(done);
        });

        it("should convert the 'Owner' role to 'owner'", (done) => {
            mixer.prototype.convertRole("Owner").should.eventually.be.equal("owner").notify(done);
        });

        it("should convert the 'Founder' role to 'Mod'", (done) => {
            mixer.prototype.convertRole("Founder").should.eventually.be.equal("moderator").notify(done);
        });

        it("should convert the 'Global Mod' role 'Mod'", (done) => {
            mixer.prototype.convertRole("Global Mod").should.eventually.be.equal("moderator").notify(done);
        });
    });
});
