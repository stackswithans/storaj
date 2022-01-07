import { writeFile } from "fs/promises";
import { readFileSync } from "fs";
import { randomUUID } from "crypto";
import EventEmitter = require("events");
/*

Collection contains CelloObjects

Collection Messages:
- { content: 'oi', from: 'guy', to: 'other guy'};
- { content: 'tás bom?!', from: 'other guy', to: 'guy'};


Two types of objects:
 - Collection;
 - CellaItem (actual Data);


 - Can't have an item without a collection
*/

interface CellaItem<T = any> {
    collection: string;
    id: string | number;
    data: T;
    [prop: string]: any;
}

type Index = string | number;

type PersistFn = () => Promise<void>;

export class Collection extends EventEmitter {
    name: string;
    private _items: Map<Index, CellaItem> = new Map();
    private _onUpdate: PersistFn;

    constructor(name: string, onUpdate: PersistFn) {
        super();
        this.name = name;
        this._onUpdate = onUpdate;
    }

    private validateInsert(item: CellaItem) {
        const idIsValid =
            itemHasProp(item, "id", "string") ||
            itemHasProp(item, "id", "number");
        if (!idIsValid) {
            throw new Error(
                `InsertionError: The id of an item must be a number or a string.`
            );
        }
        if (this._items.has(item.id)) {
            throw new Error(
                `InsertionError: The id '${item.id}' already exists in the '${this.name}' collection`
            );
        }
    }

    /**Inserts an item into the collection and persists the changes
      @params {CellaItem} item - the item to add to the collection 
    **/
    async insert<T extends object>(object: T, id?: Index) {
        if (id === undefined) {
            id = randomUUID();
        }
        const item = { id, collection: this.name, data: object };
        this.validateInsert(item);
        this._items.set(item.id, item);
        await this._onUpdate();
    }

    /**Inserts an item into the collection but does not sync 
      the changes with the data on disk**/
    insertNoSave<T>(item: CellaItem<T>) {
        this.validateInsert(item);
        this._items.set(item.id, item);
    }

    /** Returns all the items in a collection*/
    all<T>(): CellaItem<T>[] {
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

    collections(collection: string): Collection {
        let ref = this._collections.get(collection);
        if (ref === undefined) {
            ref = new Collection(collection, this.persist);
            this._collections.set(collection, ref);
        }
        return ref as Collection;
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
        let items: CellaItem[] = [];
        for (let collection of this._collections.values()) {
            items = [...items, ...collection.all()];
        }
        return JSON.stringify(items);
    }

    async persist() {
        //#TODO: Add logic to save data to filesystem;
        if (!this.fPath) {
            return;
        }
        await writeFile(this.fPath, this.serialize(), { encoding: "utf8" });
        //throw new Error("Not implemented yet");
    }
}

export function itemHasProp(
    item: CellaItem,
    prop: string,
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

export function validateCellaItem(item: CellaItem) {
    //Empty string id
    if (item.id === "") {
        throw new Error(
            `InvalidItemError: id must not be empty. item: ${JSON.stringify(
                item
            )}`
        );
    }
    if (item.collection === "") {
        throw new Error(
            `InvalidItemError: collection name must not be empty. item: ${JSON.stringify(
                item
            )}`
        );
    }
    const isValid =
        (itemHasProp(item, "id", "string") ||
            itemHasProp(item, "id", "number")) &&
        itemHasProp(item, "collection", "string") &&
        itemHasProp(item, "data", "object");
    if (!isValid) {
        throw new Error(
            `InvalidItemError: The following item is missing props or has props of the wrong type: ${JSON.stringify(
                item
            )}`
        );
    }
}

export function buildStore(
    storedData: CellaItem[],
    storePath: string = ""
): CellaStore {
    const store = new CellaStore(storePath);
    if (!(storedData instanceof Array)) {
        throw new Error(
            "Invalid schema passed to function. Argument must be an array of objects"
        );
    }
    storedData.forEach((item) => {
        validateCellaItem(item);
        const collection = store.collections(item.collection);
        collection.insertNoSave(item);
    });
    return store;
}

export function loadStoreFromFile(storePath: string): CellaStore {
    let storedData: CellaItem[];
    storedData = JSON.parse(readFileSync(storePath, "utf8"));
    return buildStore(storedData, storePath);
}
