type CactusPacket = CactusMessagePacket | CactusEventPacket | CactusBanPacket;

type CactusComponent = Text | Emoji | Tag | URL | Variable;
/**
 * Text component
 *
 * @interface Text
 */
interface Text {
    type: "text";
    data: string;
}
/**
 * Emoji component
 *
 * @interface Emoji
 */
interface Emoji {
    type: "emoji";
    data: string;
}
/**
 * Tag component
 *
 * @interface Tag
 */
interface Tag {
    type: "tag";
    data: string;
}
/**
 * URL component
 *
 * @interface URL
 */
interface URL {
    type: "url";
    data: string;
}
/**
 * Variable component
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
    text: CactusComponent[];
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
