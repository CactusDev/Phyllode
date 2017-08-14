
import { Logger } from "../logger";

export interface ServiceOptions {
    singleInstance?: boolean;
}

export function Service(name: string, options?: ServiceOptions) {
    return (target: Function) => {
        if (Reflect.hasMetadata("annotation:service:registration", target)) {
            Logger.error("Services", `Attempt to reregister service ${name} on ${target.name}.`);
            return;
        }
        Reflect.defineMetadata("annotation:service:registration", Service, target);

        target.prototype.serviceName = name;
        target.prototype.registered = true;
        target.prototype.singleInstance = options.singleInstance !== undefined ? options.singleInstance : false;
        Logger.info("Services", `"${name}" has been registered!`);
    };
}
