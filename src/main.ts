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

class Collection {
    name: string;
    private items: Map<Index, CellaItem> = new Map();

    constructor(name: string) {
        this.name = name;
    }

    private validateInsert(item: CellaItem) {
        if (this.items.has(item.id)) {
            throw Error(
                `Error: The id ${item.id} is already exists use in the ${this.name} collection`
            );
        }
    }

    /**Inserts an item into the collection but does not sync 
      the changes with the data on disk**/
    initInsert(item: CellaItem) {
        this.validateInsert(item);
        this.items.set(item.id, item);
    }
}

export class CellaStore {
    readonly _collections: Map<string | number, Collection> = new Map();
    /** Provides references to the collections in the store.
     * @param {string} collection - name of the collection to be returned.
     */
    collections(collection: string) {}

    /** Returns the name of all collections in the store.
     */
    colNames(): string[] {
        return Array.from(this._collections.keys()) as string[];
    }
}

function enforcePropExists(item: CellaItem, prop: string, type: string) {
    const value = item[prop];
    if (value === undefined) {
        throw new Error(
            `InvalidItemError: The following item does not have the ${prop} property: ${item}`
        );
    }
    const propType = typeof value;
    // Ids can be numbers or strings;
    if (prop === "id" && (propType === "string" || propType === "number"))
        return;
    if (propType !== type) {
        throw new Error(
            `InvalidItemError: The following item has a property of the wrong type:${item}\nPropery:${prop}\nExpected type:${type}\nActualtype:${propType} `
        );
    }
}

export function validateCellaItem(item: CellaItem) {
    enforcePropExists(item, "id", "string");
    enforcePropExists(item, "collection", "string");
    enforcePropExists(item, "data", "object");
}

export function loadCellaStore(storePath: string): CellaStore {
    let storedData: CellaItem[];
    try {
        storedData = JSON.parse(readFileSync(storePath, "utf8"));
    } catch (err) {
        //#TODO: Improve error reporting
        console.error(
            "Bad error ocurred while trying to parse and open the saved store data",
            err
        );
        process.exit(1);
    }
    const store = new CellaStore();
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
