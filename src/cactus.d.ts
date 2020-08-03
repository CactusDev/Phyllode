
type CactusPacket = CactusMessagePacket | CactusEventPacket | CactusBanPacket;

interface EmojiComponentData {
    standard: string;
    alternatives: string[];
}

interface Component {
    type: "text" | "emoji" | "tag" | "url" | "variable";
    data: string|EmojiComponentData;
}

interface TextComponent extends Component {
    type: "text";
    data: string;
}

interface EmojiComponent extends Component {
    type: "emoji";
    data: EmojiComponentData;
}

interface TagComponent extends Component {
    type: "tag";
    data: string;
}

interface URLComponent extends Component {
    type: "url";
    data: string;
}

interface CactusMessagePacket {
    type: "message";
    text: Component[];
    action: boolean;
}

type Channel = string;
type User = string;
type Service = string;

type Role = "banned" | "user" | "subscriber" | "moderator" | "owner";

interface CactusContext {
    packet: CactusPacket;
    channel: Channel;
    user?: User;
    role?: Role;
    target?: User;
    service: Service;
}

interface Emoji {
    standard: string;
    alternatives?: string[];
}

interface Emojis {
    [name: string]: Emoji;
}

interface ReverseEmojis {
    [name: string]: string;
}

interface ProxyMessage {
    type: "message";

    botInfo: {
        botId: number;
        username: string;
    };

    channel: string;
    meta: any;
    parts: string[];
    service: string;
    source: string;
}

interface ProxyResponse {
    channel: string;
    message: string;
    service: string;
    order: number;

    meta: {
        action: boolean;
        target?: string;
    }
}

interface RepeatMessage {
    packet: CactusMessagePacket
    channel: Channel
    service: Service
}
