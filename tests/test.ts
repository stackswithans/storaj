import {
    itemHasProp,
    validateSerializedItem,
    storeFromObject,
    Store,
    Collection,
} from "../src/store";
import {
    buildMatcher,
    Matcher,
    processQuery,
    OPList,
    runMatcher,
    op,
} from "../src/query";
import { test, runTests } from "./utils";
import * as assert from "assert";
import { readFileSync } from "fs";
import { unlink } from "fs/promises";

runTests(
    test("itemHasProp works", () => {
        console.log();
        const item = {
            _id: "",
            _collection: "",
        } as any;
        assert.ok(itemHasProp(item, "_id", "string"));
        assert.deepStrictEqual(itemHasProp(item, "_id", "number"), false);
        assert.deepStrictEqual(itemHasProp(item, "test2", "string"), false);
    }),

    test("validateSerializedItem accepts valid item", () => {
        const item = {
            _id: "dinnkdossaqw",
            _collection: "somecollection",
        };
        validateSerializedItem(item);
    }),

    test("validateSerializedItem raises exception on invalid item", () => {
        const item = {
            id: {},
            collection: "somecollection",
            data: {},
        } as any;
        assert.throws(
            () => validateSerializedItem(item),
            new Error(
                `InvalidItemError: The following item is missing props or has props of the wrong type: ${JSON.stringify(
                    item
                )}`
            )
        );
    }),

    test("validateSerializedItem raises exception on item with empty id string", () => {
        const item = {
            _id: "",
            _collection: "somecollection",
            data: {},
        } as any;

        assert.throws(
            () => validateSerializedItem(item),
            new Error(
                `InvalidItemError: id must not be empty. item: ${JSON.stringify(
                    item
                )}`
            )
        );
    }),

    test("validateSerializedItem raises exception on item with empty collection name", () => {
        const item = {
            _id: 1,
            _collection: "",
            data: {},
        } as any;

        assert.throws(
            () => validateSerializedItem(item),
            new Error(
                `InvalidItemError: collection name must not be empty. item: ${JSON.stringify(
                    item
                )}`
            )
        );
    }),

    test("storeFromObject works on valid store schema", () => {
        const store = [
            {
                _id: 1,
                _collection: "messages",
            },
        ];

        const cellaStore = storeFromObject(store);
        assert.ok(cellaStore instanceof Store);
        assert.ok(cellaStore.hasCollection("messages"));
        assert.deepStrictEqual(cellaStore.collNames()[0], "messages");
        assert.ok(cellaStore.collections("messages") instanceof Collection);
        assert.deepStrictEqual(cellaStore.collections("messages").count(), 1);
    }),

    test("storeFromObject fails with non-list argument", () => {
        const store = {} as any;
        assert.throws(
            () => storeFromObject(store),
            new Error(
                "Invalid schema passed to function. Argument must be an array of objects"
            )
        );
    }),

    test("Store collections creates new collection if not exists", () => {
        const store = new Store();
        assert.deepStrictEqual(
            store.hasCollection("test"),
            false,
            "Should be false. Test hasn't been created"
        );
        store.collections("test");
        assert.deepStrictEqual(
            store.hasCollection("test"),
            true,
            "Should be true. Test has been created"
        );
    }),

    test("Store collNames returns collection names", () => {
        const store = new Store();
        store.collections("test");
        store.collections("test2");
        store.collections("test3");
        assert.deepStrictEqual(store.collNames(), ["test", "test2", "test3"]);
    }),

    test("Test collection insert works", async () => {
        const store = new Store();
        const testCol = store.collections("test");
        await testCol.insert({ message: "message1" });
        assert.deepStrictEqual(testCol.count(), 1);

        await testCol.insert({ message: "message2" }, 1);
        assert.deepStrictEqual(testCol.count(), 2);

        await testCol.insert({ message: "message3" }, "message-from-bae");
        assert.deepStrictEqual(testCol.count(), 3);
    }),

    test("Test collection insert fails with id of wrong type", async () => {
        const store = new Store();
        const testCol = store.collections("test");
        await assert.rejects(
            async () =>
                await testCol.insert({ message: "message1" }, [] as any),
            new Error(
                `InsertionError: The id of an item must be a number or a string.`
            )
        );
    }),

    test("Test collection insert fails with existing id", async () => {
        const store = new Store();
        const testCol = store.collections("test");
        await testCol.insert({ message: "message1" }, 2);
        await assert.rejects(
            async () => await testCol.insert({ message: "message2" }, 2),
            new Error(
                `InsertionError: The id '2' already exists in the 'test' collection`
            )
        );
    }),

    test("Test Store serialize works correctly", async () => {
        const store = new Store();
        const testCol = store.collections("test");
        await testCol.insert({ message: "message1" }, 1);
        await testCol.insert({ message: "message2" }, 2);

        const serStore = store.serialize();
        assert.deepStrictEqual(
            serStore,
            JSON.stringify([
                { _id: 1, _collection: "test", message: "message1" },
                { _id: 2, _collection: "test", message: "message2" },
            ])
        );
    }),

    test("Test Store persist saves file if path given", async () => {
        const filePath = "test.json";
        const store = new Store(filePath);
        const testCol = store.collections("test");
        await testCol.insert({ message: "message1" }, 1);
        await testCol.insert({ message: "message2" }, 2);
        await store.persist();

        const data = readFileSync(filePath, "utf8");
        assert.deepStrictEqual(data, store.serialize());

        //Clean up opened file
        await unlink(filePath);
    }),

    test("Test Collection get works as expected", async () => {
        const store = new Store();
        const testCol = store.collections<{
            _id: number | string;
            message: string;
        }>("test");
        await testCol.insert({ message: "message1" }, 1);
        await testCol.insert({ message: "message2" }, 2);

        assert.notDeepStrictEqual(testCol.get(1), null);
        assert.deepStrictEqual(testCol.get(1)?.message, "message1");
        assert.notDeepStrictEqual(testCol.get(2), null);
        assert.deepStrictEqual(testCol.get(2)?.message, "message2");
        assert.deepStrictEqual(testCol.get(3), null);
    }),

    test("Test buildMatcher  builds matcher correctly", async () => {
        let matcher = buildMatcher(1);
        assert.deepStrictEqual(matcher instanceof Matcher, true);
        assert.deepStrictEqual(matcher.op, OPList.EQ);

        matcher = buildMatcher(new Matcher(OPList.EQ, 1));
        assert.deepStrictEqual(matcher instanceof Matcher, true);
        assert.deepStrictEqual(matcher.op, OPList.EQ);
        assert.deepStrictEqual(matcher.value, 1);

        assert.throws(() => buildMatcher(undefined as any));
    }),

    test("Test runMatcher works as expected correctly", async () => {
        let matcher = new Matcher(OPList.EQ, 1);
        assert.deepStrictEqual(runMatcher(matcher, 1), true);
        assert.deepStrictEqual(runMatcher(matcher, 2), false);
        assert.deepStrictEqual(matcher.op, OPList.EQ);

        matcher = new Matcher(OPList.NE, "test");
        assert.deepStrictEqual(runMatcher(matcher, "test"), false);
        assert.deepStrictEqual(runMatcher(matcher, "test1"), true);
        assert.deepStrictEqual(matcher.op, OPList.NE);

        matcher = new Matcher(OPList.LT, 1);
        assert.deepStrictEqual(runMatcher(matcher, 2), false);
        assert.deepStrictEqual(runMatcher(matcher, 1), false);
        assert.deepStrictEqual(runMatcher(matcher, 0), true);
        assert.deepStrictEqual(matcher.op, OPList.LT);

        matcher = new Matcher(OPList.LTE, 1);
        assert.deepStrictEqual(runMatcher(matcher, 1), true);
        assert.deepStrictEqual(runMatcher(matcher, 0), true);
        assert.deepStrictEqual(runMatcher(matcher, 3), false);
        assert.deepStrictEqual(matcher.op, OPList.LTE);

        matcher = new Matcher(OPList.GT, 1);
        assert.deepStrictEqual(runMatcher(matcher, 1), false);
        assert.deepStrictEqual(runMatcher(matcher, 2), true);
        assert.deepStrictEqual(matcher.op, OPList.GT);

        matcher = new Matcher(OPList.GTE, 1);
        assert.deepStrictEqual(runMatcher(matcher, 1), true);
        assert.deepStrictEqual(runMatcher(matcher, 2), true);
        assert.deepStrictEqual(runMatcher(matcher, 0), false);
        assert.deepStrictEqual(matcher.op, OPList.GTE);
    }),

    test("Test op builds correct matchers", () => {
        let matcher = op.eq(1);
        assert.deepStrictEqual(matcher.op, OPList.EQ);
        matcher = op.ne(1);
        assert.deepStrictEqual(matcher.op, OPList.NE);
        matcher = op.lt(1);
        assert.deepStrictEqual(matcher.op, OPList.LT);
        matcher = op.gt(1);
        assert.deepStrictEqual(matcher.op, OPList.GT);
        matcher = op.lte(1);
        assert.deepStrictEqual(matcher.op, OPList.LTE);
        matcher = op.gte(1);
        assert.deepStrictEqual(matcher.op, OPList.GTE);
    }),

    test("Test processQuery works as expected correctly", async () => {
        type Message = { _id: number | string; message: string };
        let q: Message = {
            _id: 2,
            message: "hello",
        };
        const data = processQuery<Message>(q);
        assert.deepStrictEqual(data.get("_id")?.op, OPList.EQ);
        assert.deepStrictEqual(data.get("_id")?.value, 2);
        assert.deepStrictEqual(data.get("message")?.op, OPList.EQ);
        assert.deepStrictEqual(data.get("message")?.value, "hello");
    }),

    test("Test Collection query equality works", async () => {
        const store = new Store();
        const testCol = store.collections<{
            _id: string | number;
            message: string;
        }>("test");
        await testCol.insert({ message: "message1" }, 1);
        await testCol.insert({ message: "message2" }, 2);

        let result = testCol.query({ _id: 1 });
        assert.deepStrictEqual(result.length, 1);
        assert.deepStrictEqual(result[0].message, "message1");

        result = testCol.query({ _id: 2 });
        assert.deepStrictEqual(result.length, 1);
        assert.deepStrictEqual(result[0].message, "message2");
    }),

    test("Test Collection complex queries wok", async () => {
        const store = new Store();
        const collRef = store.collections<{
            _id: string | number;
            age: number;
            school: string;
            sex: string;
        }>("test");
        await collRef.insert({ age: 10, school: "randomSchool", sex: "M" }, 1);
        await collRef.insert({ age: 22, school: "randomUni", sex: "M" }, 2);
        await collRef.insert({ age: 24, school: "randomUni", sex: "F" }, 3);

        let result = collRef.query({ age: op.gt(10) });
        assert.deepStrictEqual(result.length, 2);
        result = collRef.query({ age: op.gt(10), sex: "F" });
        assert.deepStrictEqual(result.length, 1);
        assert.deepStrictEqual(result[0].sex, "F");
        assert.deepStrictEqual(result[0].age, 24);
        result = collRef.query({ age: op.lt(24), sex: "M" });
        assert.deepStrictEqual(result.length, 2);
        result = collRef.query({
            age: op.lt(24),
            sex: "M",
            school: "randomSchool",
        });
        assert.deepStrictEqual(result.length, 1);
        assert.deepStrictEqual(result[0]._id, 1);
    })
);
