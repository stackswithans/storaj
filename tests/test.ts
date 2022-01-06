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
    }),

    test("buildStore fails with bad schema", () => {
        const store = {} as any;
        assert.throws(
            () => buildStore(store),
            new Error(
                "Invalid schema passed to function. Argument must be an array of objects"
            )
        );
    })
);
