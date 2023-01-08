//TODO: Add doc comments
import { Item, StoreData } from "./types";
import {
    QExpression,
    Operators,
    makeOperator,
    makeEqCriterion,
    QuerySpec,
    OperatorSpec,
    isOperatorSpec,
    makeCriterion,
    allCriteria,
} from "./criteria";

export function parseQuerySpec<T extends object>(
    qSpec: QuerySpec<T>
): QExpression<T> {
    //A non nested object with multiple properties is just a
    //sequence of and operations
    if (!(typeof qSpec === "object")) {
        throw new Error("QuerySpec must be an object.");
    }

    if (Object.values(qSpec).length === 0) {
        return allCriteria();
    }

    let prevExpr: QExpression<T> | null = null;
    for (let [key, value] of Object.entries(qSpec)) {
        if (!isStoreData(value) && !isOperatorSpec(value)) {
            throw new Error(
                "Invalid QuerySpec object. The properties of QuerySpec objects must be primitive values or query criterion"
            );
        }
        if (isStoreData(value)) {
            prevExpr = prevExpr
                ? makeOperator(
                      Operators.AND,
                      prevExpr,
                      makeEqCriterion(key as keyof Item<T>, value)
                  )
                : makeEqCriterion(key as keyof Item<T>, value);
        } else {
            let op = value as OperatorSpec;
            let criterion = makeCriterion(op.opType, key, op.value, (item) =>
                op.eval(item[key] as StoreData, op.value)
            );
            prevExpr = prevExpr
                ? makeOperator(Operators.AND, prevExpr, criterion)
                : criterion;
        }
    }
    return prevExpr as QExpression<T>;
}

type Projection<T> = (item: Item<T>) => Partial<Item<T>>;

export class Query<T extends object> {
    private _selector: Projection<T>;
    private _criteria: QExpression<T>;
    private _items: IterableIterator<Item<T>>;

    constructor(criteria: QuerySpec<T>, collection: IterableIterator<Item<T>>) {
        this._criteria = parseQuerySpec(criteria);
        this._items = collection;
        this._selector = (item) => item;
    }

    and(qSpec: QuerySpec<T>): Query<T> {
        let qExpr = parseQuerySpec(qSpec);
        //Multiple calls to where just adds and clauses to criteria
        this._criteria = makeOperator(Operators.AND, this._criteria, qExpr);
        return this;
    }

    or(qSpec: QuerySpec<T>): Query<T> {
        let qExpr = parseQuerySpec(qSpec);
        this._criteria = makeOperator(Operators.OR, this._criteria, qExpr);
        return this;
    }

    select(selector: Projection<T>): Query<T> {
        this._selector = selector;
        return this;
    }

    execute(): Array<ReturnType<Projection<T>>> {
        let resultSet = [];
        for (let item of this._items) {
            if (!this._criteria.eval(item)) {
                continue;
            }
            resultSet.push(this._selector(item));
        }
        return resultSet;
    }
}

function isStoreData(expr: any): expr is StoreData {
    return (
        typeof expr === "number" ||
        typeof expr === "string" ||
        expr === null ||
        typeof expr === "boolean"
    );
}
