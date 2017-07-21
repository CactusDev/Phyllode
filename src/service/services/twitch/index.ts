import { Service, ServiceStatus } from "../../service";
import { emojis } from "./emoji";

import * as WebSocket from "ws";

const tmi = require("tmi.js");

// tslint:disable-next-line
const MESSAGE_REGEX = /;display-name=([a-zA-Z0-9][\w]{3,24});.+;mod=(0|1);.+;subscriber=(0|1);.+;user-id=(\d+);.+ PRIVMSG #([a-zA-Z0-9][\w]{3,24}) :(.+)/;
const ACTION_REGEX = /ACTION/;

export class TwitchHandler extends Service {

    // private caps = ":twitch.tv/membership twitch.tv/commands twitch.tv/tags";

    private instance: any;
    
    private channel = "";
    private oauth = "";

    private emojiNames: string[] = [];
    private emojiValues: string[] = [];

    public async connect(oauthKey: string, refresh?: string, expiry?: string): Promise<boolean> {
        if (this.status === ServiceStatus.READY) {
            return;
        }
        this.emojiNames = Object.keys(emojis);
        for (let emoji of this.emojiNames) {
            this.emojiValues.push(emojis[emoji]);
        }
        this.oauth = oauthKey;
	return true;
    }

    public async authenticate(channel: string | number, botId: string | number): Promise<boolean> {
        this.channel = (<string>channel).toLowerCase();

	// TODO: Support for multiple channels from the one handler.
	//       This shouldn't be too hard, probably just an observable
	//       that's hosted from this file, then we just watch that
	//       Probably would need some sort of an identifier
	//       in the service annotation or something saying that
	//       this handler can support multiple from one instance,
	//       so that we don't keep creating more.
	const connectionOptions = {
	    options: {
		debug: true  // XXX: This shouldn't stay, but it's useful for debugging
	    },
	    connection: {
		reconnect: true
	    },
	    identity: {
		username: botId,
		password: `oauth:${this.oauth}`
	    },
	    channels: [channel]  // TODO: See the above todo.
	}

	this.instance = new tmi.client(connectionOptions);
	this.instance.connect();

	this.instance.on("message", async (channel: string, state: any, message: string, self: boolean) => {
	    // Make sure that this message didn't come from us.
	    if (self) {
		return;
	    }
	    // Now that we know it's not us, then we can start parsing.
	    const response = await this.convert([message, state]);
	    this.sendMessage(response);
	});
	return true;
    }

    public async disconnect(): Promise<boolean> {
        return true;
    }

    public async convert(packet: any): Promise<CactusMessagePacket> {
	// XXX: Is there a way to make this not gross? Maybe some-sort of an internal `Context` thing?
	const message: any = packet[0];
	const state: any = packet[1];

	const isMod = state.mod;
	const isBroadcaster = state.badges.broadcaster && state.badges.broadcaster === "1";  // Why in tarnation is that a string?!
	const isSub = state.subscriber;
	
	let role: "banned" | "user" | "subscriber" | "moderator" | "owner" = "user";
	if (isSub) {
	    role = "subscriber";
	} else if (isMod) {
	    role = "moderator";
	} else if (isBroadcaster) {
	    role = "owner";
	}

	const finished: CactusMessageComponent[] = [];
	const segments: any[] = message.split(" ");
	console.log("It's segment time " + JSON.stringify(segments));
	for (let rawSegment of segments) {
	    const segment = rawSegment.trim();
	    let segmentType: "text" | "emoji" = "text";
	    let segmentData: any;
	    // XXX: Why must this be casted to any?
	    if ((<any>this.emojiNames).includes(segment)) {
		segmentType = "emoji";
		segmentData = emojis[segment];
	    } else {
		segmentData = segment;
	    }
	    finished.push({
		"type": segmentType,
		data: segmentData
	    });
	}
	let isAction = false;
	let isTarget = false;
	const messageType = state["message-type"]

	if (messageType === "action") {
	    isAction = true;
	} else if (messageType === "whisper") {
	    isTarget = true;
	}
	// TODO: Action parsing, and target parsing.
	const finalMessagePacket: CactusMessagePacket = {
	    "type": "message",
	    user: state["display-name"],
	    role: role,
	    text: finished,
	    action: isAction
	};
	if (isTarget) {
	    finalMessagePacket.target = isTarget;
	}
	return finalMessagePacket;
    }

    public async invert(packet: CactusMessagePacket): Promise<string> {
	// This needs something related to the contexts too. (See the todo below, and one of the many above)
        let messages = packet.text;
        let chatMessage = "";

	if (packet.action) {
	    chatMessage += "/me ";
	}

        messages.forEach(async msg => {
            if (msg !== null) {
		if (msg["type"] === "emoji") {
		    chatMessage += ` ${emojis[msg.data.trim()]}`;
		} else {
		    // HACK: Only kind of a hack, but for some reason all the ACTIONs tain this.
		    //       Can the replace be removed?
		    chatMessage += ` ${msg.data.replace("\u0001", "")}`;
		}
            }
        });
        return chatMessage.trim();
    }

    public async sendMessage(message: CactusMessagePacket) {
	// To make this work between channels, we would need some way to pass around the channels. Maybe an optional parameter for `Context`?
	// (See an above todo for more context information)
	const inverted = await this.invert(message);
	this.instance.say(this.channel, inverted);
    }

    public get status(): ServiceStatus {
        return this._status;
    }

    public set status(state: ServiceStatus) {
        this._status = state;
    }
}
