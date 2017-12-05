type CactusPacket = CactusMessagePacket | CactusEventPacket | CactusBanPacket;

interface Component {
    type: "text" | "emoji" | "tag" | "url" | "variable";
    data: string;
}

/**
 * Text {@see Component}, containing raw text.
 *
 * @interface Text
 */
interface TextComponent extends Component {
    type: "text";
}

/**
 * Emoji {@see Component}, containing an emoji.
 * If the emoji is a standard Unicode emoji, its alpha code should be used.
 * Otherwise, a consistent name should be chosen, prefixed with a period.
 *
 * @interface Emoji
 */
interface EmojiComponent extends Component {
    type: "emoji";
}

/**
 * Tag {@see Component}, containing a tag. No prefix, such as an @ symbol,
 * should be stored.
 *
 * @interface Tag
 */
interface TagComponent extends Component {
    type: "tag";
}

/**
 * URL {@see Component}, containing a URL.
 *
 * @interface URL
 */
interface URLComponent extends Component {
    type: "url";
}

/**
 * Variable {@see Component}, containing isolated variable data.
 *
 * @example {
 *     type: "variable",
 *     data: "ARG3|reverse|title"
 * }
 *
 * @example {
 *     type: "variable",
 *     data: "USER"
 *  }
 *
 * @interface Variable
 */
interface VariableComponent extends Component {
    type: "variable";
}

/**
 * Message packet
 *
 * @interface CactusMessagePacket
 */
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

/**
 * Emoji mappings for service emoji mapping files
 *
 * @interface Emojis
 */
interface Emojis {
    [name: string]: Emoji;
}

interface ReverseEmojis {
    [name: string]: string;
}

interface ProxyMessage {
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

    meta: {
        action: boolean;
        target?: string;
    }
}
