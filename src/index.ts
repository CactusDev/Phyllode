import "reflect-metadata";

import { ReflectiveInjector } from "@angular/core";
import { Core } from "./core";
import { ServiceHandler } from "./service";

const injector = ReflectiveInjector.resolveAndCreate([
    {
        provide: ServiceHandler,
        deps: [],
        useFactory: () => {
            const serviceHandler = new ServiceHandler();
            return serviceHandler;
        }
    },
    Core
]);

const core: Core = injector.get(Core);
core.start()
    .catch(console.error);
