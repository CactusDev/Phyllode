
import "reflect-metadata";

import { Service as ServiceAnnotation } from "../src/service/service.annotation";
import { Service } from "../src/service/service";
import { test } from "ava";

@ServiceAnnotation("Test1")
@ServiceAnnotation("ErrorTime")
abstract class TestService extends Service {
}

@ServiceAnnotation("Test2", {singleInstance: true})
abstract class TestService2 extends Service {

}

abstract class TestService3 extends Service {

}

@ServiceAnnotation("Test4", {})
abstract class TestService4 extends Service {

}

test("TestService should not be registered", t => {
    t.is(TestService.prototype.registered, false);
});

test("TestService should have metadata 'annotation:service:registration'", t => {
    t.is(Reflect.hasMetadata("annotation:service:registration", TestService), true);
});

test("TestService shouldn't be single instance", t => {
    t.is(TestService.prototype.singleInstance, false);
});

test("TestService2 should be single instance", t => {
    t.is(TestService2.prototype.singleInstance, true);
});

test("TestService should be named Test1", t => {
    t.is(TestService.prototype.serviceName, "ErrorTime");
});

test("TestService2 should be named Test2", t => {
    t.is(TestService2.prototype.serviceName, "Test2");
});

test("TestService3 should have have name", t => {
    t.is(TestService3.prototype.serviceName, undefined);
});

test("TestService3 shouldn't have registered", t => {
    t.is(TestService3.prototype.registered, undefined);
});

test("TestService3 shouldn't have single instance", t => {
    t.is(TestService3.prototype.singleInstance, undefined);
});

test("TestService4 shouldn't be singleInstance", t => {
    t.is(TestService4.prototype.singleInstance, false);
});
