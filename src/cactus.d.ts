type CactusPacket = CactusMessagePacket | CactusEventPacket | CactusBanPacket;

type Component = Text | Emoji | Tag | URL | Variable;

/**
 * Text {@see Component}, containing raw text.
 *
 * @interface Text
 */
interface Text {
    type: "text";
    data: string;
}

/**
 * Emoji {@see Component}, containing an emoji.
 * If the emoji is a standard Unicode emoji, its alpha code should be used.
 * Otherwise, a consistent name should be chosen, prefixed with a period.
 *
 * @interface Emoji
 */
interface Emoji {
    type: "emoji";
    data: string;
}

/**
 * Tag {@see Component}, containing a tag. No prefix, such as an @ symbol,
 * should be stored.
 *
 * @interface Tag
 */
interface Tag {
    type: "tag";
    data: string;
}

/**
 * URL {@see Component}, containing a URL.
 *
 * @interface URL
 */
interface URL {
    type: "url";
    data: string;
}

/**
 * Variable {@see Component}, containing a fully-capitalized variable tag and
 * a list of lowercase modifiers.
 *
 * @example {
 *     type: "variable",
 *     tag: "ARG3",
 *     modifiers: ["reverse", "title"]
 * }
 *
 * @example {
 *     type: "variable",
 *     tag: "USER",
 *     modifiers: []
 *  }
 *
 * @interface Variable
 */
interface Variable {
    type: "variable";
    tag: string;
    modifiers: string[];
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

/**
 * User banned packet
 *
 * @interface CactusBanPacket
 */
interface CactusBanPacket {
    type: "ban";
    duration?: number;
}

type CactusEvent = "follow" | "subscribe" | "host" | "join" | "leave";

/**
 * Events. Events are follows, subs, etc
 *
 * @interface CactusEventPacket
 */
interface CactusEventPacket {
    kind: CactusEvent;
    success: boolean;
    streak?: number;
}

type Channel = string;
type User = string;
type Service = string;

type Role = "banned" | "user" | "subscriber" | "moderator" | "owner";

interface CactusScope {
    packet: CactusPacket;
    channel: Channel;
    user?: User;
    role: Role;
    target: boolean;
    service: Service;
}

/**
 * Emoji mappings for service emoji mapping files
 *
 * @interface Emojis
 */
interface Emojis {
    [name: string]: string
}
