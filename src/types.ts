export type ItemBase = { _id: Index };

export type Item<T extends ItemBase> = {
    [Property in keyof T]: T[Property];
};

export type Index = string | number;
