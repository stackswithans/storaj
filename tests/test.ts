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
        assert.deepEqual(itemHasProp(item, "id", "number"), false);
        assert.deepEqual(itemHasProp(item, "queijo", "string"), false);
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
        assert.deepEqual(cellaStore.colNames()[0], "messages");
        assert.ok(cellaStore.collections("messages") instanceof Collection);
        assert.deepEqual(cellaStore.collections("messages").count(), 1);
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
        assert.deepEqual(
            store.hasCollection("test"),
            false,
            "Should be false. Test hasn't been created"
        );
        store.collections("test");
        assert.deepEqual(
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
        assert.deepEqual(store.colNames(), ["test", "test2", "test3"]);
    })
);
