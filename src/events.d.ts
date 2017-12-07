
type CactusEvent = FollowEvent | SubscribeEvent | HostEvent | JoinEvent;

interface CactusBanPacket {
    type: "ban";
    duration?: number;
}

interface FollowEvent {
    type: "follow";
    success: boolean;
}

interface SubscribeEvent {
    type: "subscribe";
    streak: number;
}

interface HostEvent {
    type: "host";
    success: boolean;
}

interface JoinEvent {
    type: "join";
    success: boolean;
}

interface CactusEventPacket {
    type: "event";
    kind: CactusEvent;
}
