
type CactusPacket = CactusMessagePacket | CactusEventPacket | CactusBanPacket;

interface Component {
    type: "text" | "emoji" | "tag" | "url" | "variable";
    data: string;
}

interface TextComponent extends Component {
    type: "text";
}

interface EmojiComponent extends Component {
    type: "emoji";
}

interface TagComponent extends Component {
    type: "tag";
}

interface URLComponent extends Component {
    type: "url";
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
