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

/**
 * User banned packet
 *
 * @interface CactusBanPacket
 */
interface CactusBanPacket {
    type: "ban";
    duration?: number;
}

type CactusEvent = FollowEvent | SubscribeEvent | HostEvent | JoinEvent;

/**
 * Follow event. {@param success} is true for a follow and false for an
 * unfollow.
 *
 * @interface FollowEvent
 */
interface FollowEvent {
    type: "follow";
    success: boolean;
}

/**
 * Subscribe event. {@param streak} contains the number of continuous months
 * for which the subscription has occurred.
 *
 * @interface SubscribeEvent
 */
interface SubscribeEvent {
    type: "subscribe";
    streak: number;
}

/**
 * Host event. {@param success} is true for a host and false for an unhost.
 *
 * @interface HostEvent
 */
interface HostEvent {
    type: "host";
    success: boolean;
}

/**
 * Join event. {@param success} is true for a join and false for a leave.
 *
 * @interface JoinEvent
 */
interface JoinEvent {
    type: "join";
    success: boolean;
}

/**
 * Events. Events are follows, subs, etc
 *
 * @interface CactusEventPacket
 */
interface CactusEventPacket {
    type: "event";
    kind: CactusEvent;
}

type Channel = string;
type User = string;
type Service = string;

type Role = "banned" | "user" | "subscriber" | "moderator" | "owner";

interface CactusScope {
    packet: CactusPacket;
    channel: Channel;
    user?: User;
    role?: Role;
    target?: User;
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
