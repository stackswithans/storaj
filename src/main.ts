import { writeFile } from "fs/promises";
import { readFileSync } from "fs";
import { randomUUID } from "crypto";
/*

Collection contains CelloObjects

Collection Messages:
- { content: 'oi', from: 'guy', to: 'other guy'};
- { content: 'tás bom?!', from: 'other guy', to: 'guy'};


Two types of objects:
 - Collection;
 - CellaItem (actual Data);


 - Can't have an item without a collection


 Querying the store:

  store.collections("message").query({
    id: op.ne(1), 
    message: op.ne(1), 
  }, { id: 2 });
  
  { id: 1 }


  Matcher(field, operator, value), 
  testMatcher
*/

type ItemBase = { _id: Index };

type Item<T extends ItemBase> = {
    [Property in keyof T]: T[Property];
};

type SerializedBase = { _id: Index; _collection: string };

type SerializedItem<T extends SerializedBase = SerializedBase> = {
    [Property in keyof T]: T[Property];
};

type Index = string | number;

type PersistFn = () => Promise<void>;

type QValues<T> = string | number | null | Matcher<T>;

type Query<T extends ItemBase> = {
    [field in keyof T]?: QValues<T>;
};

type QueryData<T extends ItemBase> = Map<Partial<keyof T>, Matcher<T>>;

enum OPList {
    EQ = 0,
    NOTEQ,
}

class Matcher<T> {
    field: keyof T;
    op: OPList;
    value: QValues<T>;

    constructor(field: keyof T, op: OPList, value: QValues<T>) {
        this.field = field;
        this.op = op;
        this.value = value;
    }
}

function buildMatcher<T>(field: keyof T, matcher: QValues<T>): Matcher<T> {
    if (typeof matcher === undefined) {
        //Should never be undefined because all the fields are in the query
        throw new Error("A matcher should not be undefined.");
    }
    if (matcher instanceof Matcher) {
        //Already a matcher, no need to do anything
        return matcher;
    }
    return new Matcher(field, OPList.EQ, matcher);
}

function testMatcher<T>(matcher: Matcher<T>, value: unknown): boolean {
    switch (matcher.op) {
        case OPList.EQ:
            return value === matcher.value;
    }
    return false;
}

function processQuery<T extends ItemBase>(q: Query<T>): QueryData<T> {
    const queryData: QueryData<T> = new Map();
    for (let field in q) {
        queryData.set(field, buildMatcher(field, q[field] as QValues<T>));
    }
    return queryData;
}

function executeQuery<T extends ItemBase>(
    items: Map<Index, Item<T>>,
    query: QueryData<T>
): Item<T>[] {
    const resultSet: Item<T>[] = [];
    for (let item of items.values()) {
        let satisfiesQuery = true;
        for (let [field, matcher] of query.entries()) {
            const matcherResult = testMatcher<T>(matcher, item[field]);
            if (!matcherResult) {
                satisfiesQuery = false;
                break;
            }
            satisfiesQuery &&= testMatcher(matcher, item[field]);
        }
        if (satisfiesQuery) resultSet.push(item);
    }
    return resultSet;
}

export class Collection<Schema extends ItemBase = ItemBase> {
    name: string;
    private _items: Map<Index, Item<Schema>> = new Map();
    private _onUpdate: PersistFn;

    constructor(name: string, onUpdate: PersistFn) {
        this.name = name;
        this._onUpdate = onUpdate;
    }

    private _validateInsert(item: Item<Schema>) {
        const idIsValid =
            itemHasProp(item, "_id", "string") ||
            itemHasProp(item, "_id", "number");
        if (!idIsValid) {
            throw new Error(
                `InsertionError: The id of an item must be a number or a string.`
            );
        }
        if (this._items.has(item._id)) {
            throw new Error(
                `InsertionError: The id '${item._id}' already exists in the '${this.name}' collection`
            );
        }
    }

    /**Inserts an item into the collection and persists the changes
      @params {CellaItem} item - the item to add to the collection 
    **/
    //#TODO: Return the inserted object or it's id
    async insert<T extends object>(object: T, id?: Index) {
        if (id === undefined) {
            id = randomUUID();
        }
        const item = { _id: id, ...object } as Item<Schema>;
        this._validateInsert(item);
        this._items.set(item._id, item);
        await this._onUpdate();
    }

    get(id: Index): Item<Schema> | null {
        const item = this._items.get(id);
        if (item === undefined) {
            return null;
        }
        return item;
    }

    //#TODO: Implement this;
    query(q: Query<Schema>): Item<Schema>[] {
        const queryData = processQuery(q);
        return executeQuery(this._items, queryData);
    }

    //#TODO: Implement this;
    aggregate() {}

    /**Inserts an item into the collection but does not sync 
      the changes with the data on disk**/

    insertNoSave(item: Schema) {
        this._validateInsert(item);
        this._items.set(item._id, item);
        item;
    }

    /** Returns all the items in a collection*/
    all(): Schema[] {
        return Array.from(this._items.values());
    }

    count(): number {
        return this._items.size;
    }
}

export class CellaStore {
    /**@property fPath - Path to the file where the data should be persisted*/
    readonly fPath: string;
    readonly _collections: Map<string | number, Collection> = new Map();
    /** Provides references to the collections in the store.
        If the collection does not exist, it will be created
     * @param {string} collection - name of the collection to be returned.
     */
    //#TODO: Implement options for the persistance
    constructor(fPath: string = "") {
        //Empty string means that data should not be persisted to disk
        this.fPath = fPath;
    }

    collections<T extends ItemBase>(collection: string): Collection<T> {
        let ref = this._collections.get(collection);
        if (ref === undefined) {
            ref = new Collection(collection, this.persist);
            this._collections.set(collection, ref);
        }
        return ref as Collection<T>;
    }

    hasCollection(collection: string): boolean {
        return this._collections.has(collection);
    }

    /** Returns the name of all collections in the store.
     */
    colNames(): string[] {
        return Array.from(this._collections.keys()) as string[];
    }

    serialize(): string {
        let items: SerializedItem[] = [];
        for (let collection of this._collections.values()) {
            const serializedItems = collection
                .all()
                .map(({ _id, ...rest }) => ({
                    _id,
                    _collection: collection.name,
                    ...rest,
                }));
            items = [...items, ...serializedItems];
        }
        return JSON.stringify(items);
    }

    async persist() {
        if (!this.fPath) {
            return;
        }
        await writeFile(this.fPath, this.serialize(), { encoding: "utf8" });
    }
}

export function itemHasProp<T>(
    item: T,
    prop: keyof T,
    type: "number" | "string" | "object" | "undefined"
): boolean {
    const value = item[prop];
    if (value === undefined) {
        return false;
    }
    const propType = typeof value;
    // Ids can be numbers or strings;
    if (propType !== type) {
        return false;
    }
    return true;
}

export function validateSerializedItem(item: SerializedItem) {
    //Empty string id
    if (item._id === "") {
        throw new Error(
            `InvalidItemError: id must not be empty. item: ${JSON.stringify(
                item
            )}`
        );
    }
    if (item._collection === "") {
        throw new Error(
            `InvalidItemError: collection name must not be empty. item: ${JSON.stringify(
                item
            )}`
        );
    }
    const isValid =
        (itemHasProp(item, "_id", "string") ||
            itemHasProp(item, "_id", "number")) &&
        itemHasProp(item, "_collection", "string");
    if (!isValid) {
        throw new Error(
            `InvalidItemError: The following item is missing props or has props of the wrong type: ${JSON.stringify(
                item
            )}`
        );
    }
}

export function buildStore(
    storedData: SerializedItem[],
    storePath: string = ""
): CellaStore {
    const store = new CellaStore(storePath);
    if (!(storedData instanceof Array)) {
        throw new Error(
            "Invalid schema passed to function. Argument must be an array of objects"
        );
    }
    storedData.forEach((item) => {
        validateSerializedItem(item);
        const collection = store.collections(item._collection);
        const { _id, _collection, ...data } = item;
        collection.insertNoSave({ _id, ...data });
    });
    return store;
}

export function loadStoreFromFile(storePath: string): CellaStore {
    let storedData: SerializedItem[];
    storedData = JSON.parse(readFileSync(storePath, "utf8"));
    return buildStore(storedData, storePath);
}
