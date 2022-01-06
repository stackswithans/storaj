import { readFileSync } from "fs";
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

interface CellaItem<T = any> extends Object {
    collection: string;
    id: string | number;
    data: T;
    [prop: string]: any;
}

type Index = string | number;

export class Collection {
    name: string;
    private _items: Map<Index, CellaItem> = new Map();

    constructor(name: string) {
        this.name = name;
    }

    private validateInsert(item: CellaItem) {
        if (this._items.has(item.id)) {
            throw Error(
                `InsertionError: The id ${item.id} is already exists use in the ${this.name} collection`
            );
        }
    }

    /**Inserts an item into the collection but does not sync 
      the changes with the data on disk**/
    initInsert(item: CellaItem) {
        this.validateInsert(item);
        this._items.set(item.id, item);
    }

    count(): number {
        return this._items.size;
    }
}

export class CellaStore {
    readonly _collections: Map<string | number, Collection> = new Map();
    /** Provides references to the collections in the store.
        If the collection does not exist, it will be created
     * @param {string} collection - name of the collection to be returned.
     */
    collections(collection: string) {
        let ref = this._collections.get(collection);
        if (collection === undefined) {
            ref = new Collection(collection);
            this._collections.set(collection, ref);
        }
        return ref;
    }

    hasCollection(collection: string) {
        return this._collections.has(collection);
    }

    /** Returns the name of all collections in the store.
     */
    colNames(): string[] {
        return Array.from(this._collections.keys()) as string[];
    }
}

export function itemHasProp(
    item: CellaItem,
    prop: string,
    type: string
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

export function buildStore(storedData: CellaItem[]) {
    const store = new CellaStore();
    if (!(storedData instanceof Array)) {
        throw new Error(
            "Invalid schema passed to function. Argument must be an array of objects"
        );
    }
    storedData.forEach((item) => {
        validateCellaItem(item);
        const colName = item.collection;
        let collection = store._collections.get(item.collection);
        if (!collection) {
            collection = new Collection(colName);
            store._collections.set(colName, collection as Collection);
        }
        collection.initInsert(item);
    });
    return store;
}

export function loadStoreFromFile(storePath: string): CellaStore {
    let storedData: CellaItem[];
    storedData = JSON.parse(readFileSync(storePath, "utf8"));
    return buildStore(storedData);
}
