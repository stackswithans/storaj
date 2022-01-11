//TODO: Add doc comments
import { ItemDefault, Item, Index } from "./types";

export class Matcher {
    op: OPList;
    value: QValues;

    constructor(op: OPList, value: QValues) {
        this.op = op;
        this.value = value;
    }
}

type QValues = string | number | null | Matcher;

export type Query<T extends ItemDefault> = {
    [field in keyof T]?: QValues;
};

type QueryData<T extends ItemDefault> = Map<Partial<keyof T>, Matcher>;

export enum OPList {
    EQ = 0,
    NE,
    LT,
    GT,
    GTE,
    LTE,
}

export const queryOp = {
    eq: (value: QValues) => new Matcher(OPList.EQ, value),
    ne: (value: QValues) => new Matcher(OPList.NE, value),
    lt: (value: QValues) => new Matcher(OPList.LT, value),
    gt: (value: QValues) => new Matcher(OPList.GT, value),
    gte: (value: QValues) => new Matcher(OPList.GTE, value),
    lte: (value: QValues) => new Matcher(OPList.LTE, value),
};

export function buildMatcher(expression: QValues): Matcher {
    if (typeof expression === "undefined") {
        //Should never be undefined because all the fields are in the query
        throw new Error("A expression should not be undefined.");
    }
    if (expression instanceof Matcher) {
        //Already an expression, no need to do anything
        return expression;
    }
    return new Matcher(OPList.EQ, expression);
}

export function runMatcher(matcher: Matcher, value: any): boolean {
    switch (matcher.op) {
        case OPList.EQ:
            return value === matcher.value;
        case OPList.NE:
            return value !== matcher.value;
        case OPList.LT:
            return value < (matcher.value as any);
        case OPList.GT:
            return value > (matcher.value as any);
        case OPList.LTE:
            return value <= (matcher.value as any);
        case OPList.GTE:
            return value >= (matcher.value as any);
        default:
            throw new Error("Non exhaustive op matching");
    }
}

export function processQuery<T extends ItemDefault>(q: Query<T>): QueryData<T> {
    const queryData: QueryData<T> = new Map();
    for (let field in q) {
        queryData.set(field, buildMatcher(q[field] as QValues));
    }
    return queryData;
}

export function executeQuery<T extends ItemDefault>(
    items: Map<Index, Item<T>>,
    query: Query<T>
): Item<T>[] {
    const queryData = processQuery(query);
    const resultSet: Item<T>[] = [];
    for (let item of items.values()) {
        let satisfiesQuery = true;
        for (let [field, matcher] of queryData.entries()) {
            const matcherResult = runMatcher(matcher, item[field]);
            if (!matcherResult) {
                satisfiesQuery = false;
                break;
            }
            satisfiesQuery = satisfiesQuery && matcherResult;
        }
        if (satisfiesQuery) resultSet.push(item);
    }
    return resultSet;
}
