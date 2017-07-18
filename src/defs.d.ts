
/**
 * Base cactus packet type
 * 
 * @interface CactusPacket
 */
interface CactusPacket {
    type: "message" | "ban" | "event";
}

interface CactusMessageComponent {
    type: "text" | "emoji" | "url";
    data: string;
}

/**
 * Message packet
 *
 * @interface CactusMessagePacket
 * @extends {CactusPacket}
 */
interface CactusMessagePacket extends CactusPacket {
    text: CactusMessageComponent[];
    user: string;
    role: "banned" | "user" | "subscriber" | "moderator" | "owner";
    action: boolean;
    target?: boolean;
}

interface Emojis {
    [name: string]: string
}

/**
 * User banned packet
 *
 * @interface CactusBanPacket
 * @extends {CactusPacket}
 */
interface CactusBanPacket extends CactusPacket {
    user: string;
    duration?: number;
}

/**
 * Events. Events are follows, subs, etc
 *
 * @interface CactusEventPacket
 * @extends {CactusPacket}
 */
interface CactusEventPacket extends CactusPacket {
    kind: string;
    user: string;
    success: boolean;
    streak?: number;
}

interface MixerUserPacket {
    id: number;
    verified: number;
    avatarUrl: string;
    username: string;
}

interface MixerChannelPacket {
    id: number;
    userId: number;
    token: string;
    partnered: boolean;
    name: string;
    audience: "family" | "teen" | "18+";
    viewersTotal: number;
    viewersCurrent: number;
    numFollowers: number;
}

interface MixerFollowPacket extends MixerUserPacket {
    following: boolean;
}

interface MixerHostedPacket {
    hosterId: number;
    hoster: MixerChannelPacket;
}

interface MixerSubscribePacket extends MixerUserPacket {

}

interface MixerResubscribePacket extends MixerSubscribePacket {
    since: string;
    until: string;
    totalMonths: number;
}
