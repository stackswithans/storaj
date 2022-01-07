import {
    itemHasProp,
    validateCellaItem,
    buildStore,
    CellaStore,
    Collection,
} from "../src/main";
import { test, runTests } from "./utils";
import * as assert from "assert";

runTests(
    test("itemHasProp works", () => {
        console.log();
        const item = {
            id: "",
        } as any;
        assert.ok(itemHasProp(item, "id", "string"));
        assert.deepStrictEqual(itemHasProp(item, "id", "number"), false);
        assert.deepStrictEqual(itemHasProp(item, "queijo", "string"), false);
    }),

    test("validateCellaItem accepts valid item", () => {
        const item = {
            id: "dinnkdossaqw",
            collection: "somecollection",
            data: {},
        };
        validateCellaItem(item);
    }),

    test("validateCellaItem raises exception on invalid item", () => {
        const item = {
            id: {},
            collection: "somecollection",
            data: {},
        } as any;
        assert.throws(
            () => validateCellaItem(item),
            new Error(
                `InvalidItemError: The following item is missing props or has props of the wrong type: ${JSON.stringify(
                    item
                )}`
            )
        );
    }),

    test("validateCellaItem raises exception on item with empty id string", () => {
        const item = {
            id: "",
            collection: "somecollection",
            data: {},
        } as any;

        assert.throws(
            () => validateCellaItem(item),
            new Error(
                `InvalidItemError: id must not be empty. item: ${JSON.stringify(
                    item
                )}`
            )
        );
    }),

    test("validateCellaItem raises exception on item with empty collection name", () => {
        const item = {
            id: 1,
            collection: "",
            data: {},
        } as any;

        assert.throws(
            () => validateCellaItem(item),
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
                id: 1,
                collection: "messages",
                data: {},
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

    test("Test collection insert works", () => {
        const store = new CellaStore();
        const testCol = store.collections("test");
        testCol.insert({ message: "message1" });
        assert.deepStrictEqual(testCol.count(), 1);

        testCol.insert({ message: "message2" }, 1);
        assert.deepStrictEqual(testCol.count(), 2);

        testCol.insert({ message: "message3" }, "message-from-bae");
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
        testCol.insert({ message: "message1" }, 2);
        await assert.rejects(
            async () => await testCol.insert({ message: "message2" }, 2),
            new Error(
                `InsertionError: The id '2' already exists in the 'test' collection`
            )
        );
    })
);
