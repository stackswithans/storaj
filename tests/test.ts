import { dirname } from "path";
import {
    itemHasProp,
    validateSerializedItem,
    Store,
    Collection,
} from "../src/store";
import * as qoperators from "../src/qoperators";
import { test, runTests } from "./utils";
import * as assert from "assert";
import { readFileSync, rmdirSync, writeFileSync } from "fs";
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

    test("insertMany works", async () => {
        const items = [
            {
                message: "hello world",
                email: "test@gmail.com",
            },
            {
                message: "hello world 2",
                email: "test2@gmail.com",
            },
            {
                message: "hello world 3",
                email: "test3@gmail.com",
            },
        ];

        const store = new Store();
        const collection = store.collections<{
            message: string;
            email: string;
        }>("messages");
        await collection.insertMany(...items);

        assert.ok(store.hasCollection("messages"));
        assert.deepStrictEqual(store.collNames()[0], "messages");

        assert.deepStrictEqual(collection.count(), 3);
    }),

    test("insertMany fails on invalid schema", async () => {
        const items = [
            {
                _id: 3.212,
                message: "hello world",
                email: "test@gmail.com",
            },
            {
                message: "hello world 2",
                email: "test2@gmail.com",
            },
            {
                message: "hello world 3",
                email: "test3@gmail.com",
            },
        ];

        const store = new Store();
        const collection = store.collections<{
            message: string;
            email: string;
        }>("messages");
        await assert.rejects(
            async () => await collection.insertMany(...items),
            new Error(
                `InsertionError: The id of an item must be a number or a string.`
            )
        );
        assert.throws(
            () => collection.insertManySync(...items),
            new Error(
                `InsertionError: The id of an item must be a number or a string.`
            )
        );

        assert.deepStrictEqual(collection.count(), 0);
    }),

    test("insertManySync works", () => {
        const items = [
            {
                message: "hello world",
                email: "test@gmail.com",
            },
            {
                message: "hello world 2",
                email: "test2@gmail.com",
            },
            {
                message: "hello world 3",
                email: "test3@gmail.com",
            },
        ];

        const store = new Store();
        const collection = store.collections<{
            message: string;
            email: string;
        }>("messages");
        collection.insertMany(...items);

        assert.ok(store.hasCollection("messages"));
        assert.deepStrictEqual(store.collNames()[0], "messages");

        assert.deepStrictEqual(collection.count(), 3);
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

        testCol.insertSync({ message: "message4" }, "message-from-bae2");
        assert.deepStrictEqual(testCol.count(), 4);
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
        assert.throws(
            () => testCol.insertSync({ message: "message1" }, [] as any),
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

        const serStore = store._serialize();
        assert.deepStrictEqual(
            serStore,
            JSON.stringify([
                { _id: 1, _collection: "test", message: "message1" },
                { _id: 2, _collection: "test", message: "message2" },
            ])
        );
    }),

    test("Test Store persist saves file if path given", async () => {
        const filePath = "storaj/recursive/path/test.json";
        const store = new Store(filePath);
        const testCol = store.collections("test");
        await testCol.insert({ message: "message1" }, 1);
        await testCol.insert({ message: "message2" }, 2);
        await store.persist();

        const data = readFileSync(filePath, "utf8");
        assert.deepStrictEqual(data, store._serialize());

        //Clean up opened file
        await unlink(filePath);
        rmdirSync(dirname(filePath).split("/")[0], { recursive: true });
    }),

    test("Test Store initialize the store from file if path given", async () => {
        const filePath = "test.json";
        // JSON data under test
        const data = JSON.stringify([{ _id: "1", _collection: "test" }]);

        writeFileSync(filePath, data);
        const fileData = readFileSync(filePath, "utf8");
        assert.deepStrictEqual(fileData, data);

        const store = new Store(filePath);
        const serializedStore = store._serialize();
        assert.deepStrictEqual(data, serializedStore);

        //Clean up opened file
        await unlink(filePath);
    }),

    test("Test Collection get works as expected", async () => {
        const store = new Store();
        const testCol = store.collections<{
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

    test("Test qoperators work correctly works as expected correctly", async () => {
        const item = {
            _id: "assa",
            name: "john",
            age: 10,
        };

        let criterion = qoperators.eq("john");
        assert.deepStrictEqual(
            criterion.eval(criterion.value, item.name),
            true
        );

        criterion = qoperators.eq(11);
        assert.deepStrictEqual(
            criterion.eval(item.age, criterion.value),
            false
        );

        criterion = qoperators.ne(10);
        assert.deepStrictEqual(
            criterion.eval(item.age, criterion.value),
            false
        );

        criterion = qoperators.ne(11);
        assert.deepStrictEqual(criterion.eval(item.age, criterion.value), true);

        criterion = qoperators.ne("steve");
        assert.deepStrictEqual(criterion.eval(item.age, criterion.value), true);

        criterion = qoperators.lt(11);
        assert.deepStrictEqual(criterion.eval(item.age, criterion.value), true);

        criterion = qoperators.lt(9);
        assert.deepStrictEqual(
            criterion.eval(item.age, criterion.value),
            false
        );

        criterion = qoperators.lte(12);
        assert.deepStrictEqual(criterion.eval(item.age, criterion.value), true);

        criterion = qoperators.lte(10);
        assert.deepStrictEqual(criterion.eval(item.age, criterion.value), true);

        criterion = qoperators.lte(9);
        assert.deepStrictEqual(
            criterion.eval(item.age, criterion.value),
            false
        );
        //age: gt(9)

        criterion = qoperators.gt(9);
        assert.deepStrictEqual(criterion.eval(item.age, criterion.value), true);

        criterion = qoperators.gt(10);
        assert.deepStrictEqual(
            criterion.eval(item.age, criterion.value),
            false
        );

        criterion = qoperators.gt(11);
        assert.deepStrictEqual(
            criterion.eval(item.age, criterion.value),
            false
        );

        criterion = qoperators.gte(9);
        assert.deepStrictEqual(criterion.eval(item.age, criterion.value), true);

        criterion = qoperators.gte(10);
        assert.deepStrictEqual(criterion.eval(item.age, criterion.value), true);

        criterion = qoperators.gte(11);
        assert.deepStrictEqual(
            criterion.eval(item.age, criterion.value),
            false
        );
    }),

    test("Test Collection simple query works", async () => {
        const store = new Store();
        const testCol = store.collections<{
            message: string;
        }>("test");
        await testCol.insert({ message: "message1" }, 1);
        await testCol.insert({ message: "message2" }, 2);

        let result = testCol.where({ _id: 1 }).execute();
        assert.deepStrictEqual(result.length, 1);
        assert.deepStrictEqual(result[0].message, "message1");

        result = testCol.where({ _id: 2 }).execute();
        assert.deepStrictEqual(result.length, 1);
        assert.deepStrictEqual(result[0].message, "message2");
    }),

    /*
    test("Test Collection or queries work", async () => {
        const store = new Store();
        const numbers = store.collections<{ num: string }>("numbers");
        numbers.where(
            or(
                {
                    num: "10212",
                },
                {
                    num: "10212",
                }
            )
        );
    }),*/

    test("Test Collection complex queries wok", async () => {
        const store = new Store();
        const collRef = store.collections<{
            age: number;
            school: string;
            sex: string;
        }>("test");
        await collRef.insert({ age: 10, school: "randomSchool", sex: "M" }, 1);
        await collRef.insert({ age: 22, school: "randomUni", sex: "M" }, 2);
        await collRef.insert({ age: 24, school: "randomUni", sex: "F" }, 3);

        let result = collRef.where({ age: qoperators.gt(10) }).execute();
        assert.deepStrictEqual(result.length, 2);
        result = collRef.where({ age: qoperators.gt(10), sex: "F" }).execute();
        assert.deepStrictEqual(result.length, 1);
        assert.deepStrictEqual(result[0].sex, "F");
        assert.deepStrictEqual(result[0].age, 24);
        result = collRef.where({ age: qoperators.lt(24), sex: "M" }).execute();
        assert.deepStrictEqual(result.length, 2);
        result = collRef
            .where({
                age: qoperators.lt(24),
                sex: "M",
                school: "randomSchool",
            })
            .execute();
        assert.deepStrictEqual(result.length, 1);
        assert.deepStrictEqual(result[0].age, 10);
        assert.deepStrictEqual(result[0].school, "randomSchool");
        assert.deepStrictEqual(result[0].sex, "M");
    })
);
