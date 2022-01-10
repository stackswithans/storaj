export declare type ItemBase = {
    _id: Index;
};
export declare type Item<T extends ItemBase> = {
    [Property in keyof T]: T[Property];
};
export declare type Index = string | number;
