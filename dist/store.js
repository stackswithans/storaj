"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storeFromFile = exports.storeFromObject = exports.validateSerializedItem = exports.itemHasProp = exports.CellaStore = exports.Collection = void 0;
const promises_1 = require("fs/promises");
const fs_1 = require("fs");
const crypto_1 = require("crypto");
const query_1 = require("./query");
class Collection {
    constructor(name, onUpdate) {
        this._items = new Map();
        this.name = name;
        this._onUpdate = onUpdate;
    }
    _validateInsert(item) {
        const idIsValid = itemHasProp(item, "_id", "string") ||
            itemHasProp(item, "_id", "number");
        if (!idIsValid) {
            throw new Error(`InsertionError: The id of an item must be a number or a string.`);
        }
        if (this._items.has(item._id)) {
            throw new Error(`InsertionError: The id '${item._id}' already exists in the '${this.name}' collection`);
        }
    }
    insert(object, id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (id === undefined) {
                id = (0, crypto_1.randomUUID)();
            }
            const item = Object.assign({ _id: id }, object);
            this._validateInsert(item);
            this._items.set(item._id, item);
            yield this._onUpdate();
        });
    }
    get(id) {
        const item = this._items.get(id);
        if (item === undefined) {
            return null;
        }
        return item;
    }
    query(q) {
        return (0, query_1.executeQuery)(this._items, q);
    }
    aggregate() { }
    insertNoSave(item) {
        this._validateInsert(item);
        this._items.set(item._id, item);
        item;
    }
    all() {
        return Array.from(this._items.values());
    }
    count() {
        return this._items.size;
    }
}
exports.Collection = Collection;
class CellaStore {
    constructor(fPath = "") {
        this._collections = new Map();
        this.fPath = fPath;
    }
    collections(collection) {
        let ref = this._collections.get(collection);
        if (ref === undefined) {
            ref = new Collection(collection, this.persist);
            this._collections.set(collection, ref);
        }
        return ref;
    }
    hasCollection(collection) {
        return this._collections.has(collection);
    }
    collNames() {
        return Array.from(this._collections.keys());
    }
    serialize() {
        let items = [];
        for (let collection of this._collections.values()) {
            const serializedItems = collection
                .all()
                .map((_a) => {
                var { _id } = _a, rest = __rest(_a, ["_id"]);
                return (Object.assign({ _id, _collection: collection.name }, rest));
            });
            items = [...items, ...serializedItems];
        }
        return JSON.stringify(items);
    }
    persist() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.fPath) {
                return;
            }
            yield (0, promises_1.writeFile)(this.fPath, this.serialize(), { encoding: "utf8" });
        });
    }
}
exports.CellaStore = CellaStore;
function itemHasProp(item, prop, type) {
    const value = item[prop];
    if (value === undefined) {
        return false;
    }
    const propType = typeof value;
    if (propType !== type) {
        return false;
    }
    return true;
}
exports.itemHasProp = itemHasProp;
function validateSerializedItem(item) {
    if (item._id === "") {
        throw new Error(`InvalidItemError: id must not be empty. item: ${JSON.stringify(item)}`);
    }
    if (item._collection === "") {
        throw new Error(`InvalidItemError: collection name must not be empty. item: ${JSON.stringify(item)}`);
    }
    const isValid = (itemHasProp(item, "_id", "string") ||
        itemHasProp(item, "_id", "number")) &&
        itemHasProp(item, "_collection", "string");
    if (!isValid) {
        throw new Error(`InvalidItemError: The following item is missing props or has props of the wrong type: ${JSON.stringify(item)}`);
    }
}
exports.validateSerializedItem = validateSerializedItem;
function storeFromObject(storedData, storePath = "") {
    const store = new CellaStore(storePath);
    if (!(storedData instanceof Array)) {
        throw new Error("Invalid schema passed to function. Argument must be an array of objects");
    }
    storedData.forEach((item) => {
        validateSerializedItem(item);
        const collection = store.collections(item._collection);
        const { _id, _collection } = item, data = __rest(item, ["_id", "_collection"]);
        collection.insertNoSave(Object.assign({ _id }, data));
    });
    return store;
}
exports.storeFromObject = storeFromObject;
function storeFromFile(storePath) {
    let storedData;
    storedData = JSON.parse((0, fs_1.readFileSync)(storePath, "utf8"));
    return storeFromObject(storedData, storePath);
}
exports.storeFromFile = storeFromFile;
//# sourceMappingURL=store.js.map