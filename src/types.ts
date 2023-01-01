export type Item<T> = {
    [Property in keyof T]: T[Property];
} & { _id: Index };

export type ItemDefault = Item<unknown>;

export type Index = string | number;

export type StoreData = string | number | null | boolean;
