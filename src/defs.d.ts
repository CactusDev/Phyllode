
/**
 * Base cactus packet type
 * 
 * @interface CactusPacket
 */
interface CactusPacket {
    type: string;
}

/**
 * Message packet
 *
 * @interface CactusMessagePacket
 * @extends {CactusPacket}
 */
interface CactusMessagePacket extends CactusPacket {
    text: string;
    user: string;
    role: "Banned" | "User" | "Subscriber" | "Moderator" | "Owner";
    action: boolean;
    target?: string;
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
    streak: number;
}
