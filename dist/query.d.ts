import { ItemBase, Item, Index } from "./types";
export declare class Matcher {
    op: OPList;
    value: QValues;
    constructor(op: OPList, value: QValues);
}
declare type QValues = string | number | null | Matcher;
export declare type Query<T extends ItemBase> = {
    [field in keyof T]?: QValues;
};
declare type QueryData<T extends ItemBase> = Map<Partial<keyof T>, Matcher>;
export declare enum OPList {
    EQ = 0,
    NE = 1,
    LT = 2,
    GT = 3,
    GTE = 4,
    LTE = 5
}
export declare const op: {
    eq: (value: QValues) => Matcher;
    ne: (value: QValues) => Matcher;
    lt: (value: QValues) => Matcher;
    gt: (value: QValues) => Matcher;
    gte: (value: QValues) => Matcher;
    lte: (value: QValues) => Matcher;
};
export declare function buildMatcher(expression: QValues): Matcher;
export declare function runMatcher(matcher: Matcher, value: any): boolean;
export declare function processQuery<T extends ItemBase>(q: Query<T>): QueryData<T>;
export declare function executeQuery<T extends ItemBase>(items: Map<Index, Item<T>>, query: Query<T>): Item<T>[];
export {};
