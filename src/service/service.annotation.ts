import { ServiceHandler } from ".";

export function Service(name: string) {
    return (target: Function) => {
        if (!(target instanceof ServiceHandler)) {
            throw new Error("Invalid annotation target.");
        }
        if (Reflect.hasMetadata("annotation:service:registration", target)) {
            throw new Error("Service already registered.");
        }
        Reflect.defineMetadata("annotation:service:registration", Service, target);

        target.prototype.serviceName = name;
        target.prototype.registered = true;
        console.log(`Service "${name}" has been registered!`);
    };
}
