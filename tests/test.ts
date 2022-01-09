import {
    itemHasProp,
    validateSerializedItem,
    buildMatcher,
    buildStore,
    CellaStore,
    Collection,
    Matcher,
    OPList,
    runMatcher,
} from "../src/main";
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

    test("buildStore works on valid store schema", () => {
        const store = [
            {
                _id: 1,
                _collection: "messages",
            },
        ];

        const cellaStore = buildStore(store);
        assert.ok(cellaStore instanceof CellaStore);
        assert.ok(cellaStore.hasCollection("messages"));
        assert.deepStrictEqual(cellaStore.colNames()[0], "messages");
        assert.ok(cellaStore.collections("messages") instanceof Collection);
        assert.deepStrictEqual(cellaStore.collections("messages").count(), 1);
    }),

    test("buildStore fails with non-list argument", () => {
        const store = {} as any;
        assert.throws(
            () => buildStore(store),
            new Error(
                "Invalid schema passed to function. Argument must be an array of objects"
            )
        );
    }),

    test("CellaStore collections creates new collection if not exists", () => {
        const store = new CellaStore();
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

    test("CellaStore colNames returns collection names", () => {
        const store = new CellaStore();
        store.collections("test");
        store.collections("test2");
        store.collections("test3");
        assert.deepStrictEqual(store.colNames(), ["test", "test2", "test3"]);
    }),

    test("Test collection insert works", async () => {
        const store = new CellaStore();
        const testCol = store.collections("test");
        await testCol.insert({ message: "message1" });
        assert.deepStrictEqual(testCol.count(), 1);

        await testCol.insert({ message: "message2" }, 1);
        assert.deepStrictEqual(testCol.count(), 2);

        await testCol.insert({ message: "message3" }, "message-from-bae");
        assert.deepStrictEqual(testCol.count(), 3);
    }),

    test("Test collection insert fails with id of wrong type", async () => {
        const store = new CellaStore();
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
        const store = new CellaStore();
        const testCol = store.collections("test");
        await testCol.insert({ message: "message1" }, 2);
        await assert.rejects(
            async () => await testCol.insert({ message: "message2" }, 2),
            new Error(
                `InsertionError: The id '2' already exists in the 'test' collection`
            )
        );
    }),

    test("Test CellaStore serialize works correctly", async () => {
        const store = new CellaStore();
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

    test("Test CellaStore persist saves file if path given", async () => {
        const filePath = "test.json";
        const store = new CellaStore(filePath);
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
        const store = new CellaStore();
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

    test("Test Collection query equality works", async () => {
        const store = new CellaStore();
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
    })
);
