import { ItemBase, Item, Index } from "./types";
import { Query } from "./query";
declare type SerializedBase = {
    _id: Index;
    _collection: string;
};
declare type SerializedItem<T extends SerializedBase = SerializedBase> = {
    [Property in keyof T]: T[Property];
};
declare type PersistFn = () => Promise<void>;
export declare class Collection<Schema extends ItemBase = ItemBase> {
    name: string;
    private _items;
    private _onUpdate;
    constructor(name: string, onUpdate: PersistFn);
    private _validateInsert;
    insert(object: Omit<Schema, "_id">, id?: Index): Promise<void>;
    get(id: Index): Item<Schema> | null;
    query(q: Query<Schema>): Item<Schema>[];
    aggregate(): void;
    insertNoSave(item: Schema): void;
    all(): Schema[];
    count(): number;
}
export declare class Store {
    readonly fPath: string;
    readonly _collections: Map<string | number, Collection>;
    constructor(fPath?: string);
    collections<T extends ItemBase>(collection: string): Collection<T>;
    hasCollection(collection: string): boolean;
    collNames(): string[];
    serialize(): string;
    persist(): Promise<void>;
}
export declare function itemHasProp<T>(item: T, prop: keyof T, type: "number" | "string" | "object" | "undefined"): boolean;
export declare function validateSerializedItem(item: SerializedItem): void;
export declare function storeFromObject(storedData: SerializedItem[], storePath?: string): Store;
export declare function storeFromFile(storePath: string): Store;
export {};
