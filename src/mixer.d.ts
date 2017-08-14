
/**
 * Response from the Mixer service chat socket
 *
 * @interface MixerChatResponse
 */
interface MixerChatResponse {
    roles: string[];
    authkey: string;
    permissions: string[];
    endpoints: string[];
}

/**
 * A chat message from the mixer service
 *
 * @interface MixerChatMessage
 */
interface MixerChatMessage {
    type: string;
    data: string;
    text: string;
    username?: string;
}


/**
 * User packet from the Mixer service
 *
 * @interface MixerUserPacket
 */
interface MixerUserPacket {
    id: number;
    verified: number;
    avatarUrl: string;
    username: string;
}

/**
 * Channel packet from the Mixer service
 *
 * @interface MixerChannelPacket
 */
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

/**
 * Follow packet from the Mixer service
 *
 * Sent when a user follows
 *
 * @interface MixerFollowPacket
 * @extends {MixerUserPacket}
 */
interface MixerFollowPacket {
    user: MixerUserPacket;
    following: boolean;
}

/**
 * Hosted packet from the Mixer service
 *
 * @interface MixerHostedPacket
 */
interface MixerHostedPacket {
    hosterId: number;
    hoster: MixerChannelPacket;
}

/**
 * Subscription packet from the Mixer service
 *
 * Send when a user subscribes
 *
 * @interface MixerSubscribePacket
 * @extends {MixerUserPacket}
 */
interface MixerSubscribePacket extends MixerUserPacket {

}

/**
 * Resubscribe packet from the Mixer service
 *
 * Sent when a user resubs.
 *
 * @interface MixerResubscribePacket
 * @extends {MixerSubscribePacket}
 */
interface MixerResubscribePacket extends MixerSubscribePacket {
    since: string;
    until: string;
    totalMonths: number;
}
