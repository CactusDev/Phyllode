
import { ReflectiveInjector } from "@angular/core";
import { Core } from "./core";

const injector = ReflectiveInjector.resolveAndCreate([
    {
        provide: Core,
        useFactory: () => {
            const core = new Core();
            return core;
        }
    }
]);

const core: Core = injector.get(Core);
core.start()
    .catch(console.error);
