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
} from "./criteria.js";
import { type Collection } from "./store";

function isStoreData(expr: any): expr is StoreData {
    return (
        typeof expr === "number" ||
        typeof expr === "string" ||
        expr === null ||
        typeof expr === "boolean"
    );
}

function parseQuerySpec<T extends object>(qSpec: QuerySpec<T>): QExpression<T> {
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

class Expression<T extends object> {
    criteria: QExpression<T>;

    constructor(criteria: QuerySpec<T>) {
        this.criteria = parseQuerySpec(criteria);
    }

    and(qSpec: QuerySpec<T>): Expression<T> {
        let qExpr = parseQuerySpec(qSpec);
        //Multiple calls to where just adds and clauses to criteria
        this.criteria = makeOperator(Operators.AND, this.criteria, qExpr);
        return this;
    }

    or(qSpec: QuerySpec<T>): Expression<T> {
        let qExpr = parseQuerySpec(qSpec);
        this.criteria = makeOperator(Operators.OR, this.criteria, qExpr);
        return this;
    }
}

export class Query<T extends object> {
    private _exp: Expression<T>;
    private _items: IterableIterator<Item<T>>;
    private _selector: Projection<T>;

    constructor(criteria: QuerySpec<T>, collection: IterableIterator<Item<T>>) {
        this._exp = new Expression(criteria);
        this._items = collection;
        this._selector = (item) => item;
    }

    and(qSpec: QuerySpec<T>): Query<T> {
        this._exp.and(qSpec);
        return this;
    }

    or(qSpec: QuerySpec<T>): Query<T> {
        this._exp.or(qSpec);
        return this;
    }

    select(selector: Projection<T>): Query<T> {
        this._selector = selector;
        return this;
    }

    execute(): Array<ReturnType<Projection<T>>> {
        let resultSet = [];
        for (let item of this._items) {
            if (!this._exp.criteria.eval(item)) {
                continue;
            }
            resultSet.push(this._selector(item));
        }
        return resultSet;
    }
}

export class Update<T extends object> {
    private _exp: Expression<T>;
    private _collection: Collection<T>;
    private _setParam: SetSpec<T>;

    constructor(
        criteria: QuerySpec<T>,
        setParam: SetSpec<T>,
        collection: Collection<T>
    ) {
        this._exp = new Expression(criteria);
        this._collection = collection;
        this._setParam = setParam;
    }

    and(qSpec: QuerySpec<T>): Update<T> {
        this._exp.and(qSpec);
        return this;
    }

    or(qSpec: QuerySpec<T>): Update<T> {
        this._exp.or(qSpec);
        return this;
    }

    async execute(): Promise<number> {
        let resultSet = [];
        for (let item of this._collection.iter()) {
            if (this._exp.criteria.eval(item)) {
                resultSet.push(item._id);
            }
        }
        for (let id of resultSet) {
            await this._collection.updateById(id, this._setParam);
        }

        return resultSet.length;
    }
}

export class Delete<T extends object> {
    private _exp: Expression<T>;
    private _collection: Collection<T>;

    constructor(criteria: QuerySpec<T>, collection: Collection<T>) {
        this._exp = new Expression(criteria);
        this._collection = collection;
    }

    and(qSpec: QuerySpec<T>): Delete<T> {
        this._exp.and(qSpec);
        return this;
    }

    or(qSpec: QuerySpec<T>): Delete<T> {
        this._exp.or(qSpec);
        return this;
    }

    async execute(): Promise<number> {
        let resultSet = [];
        for (let item of this._collection.iter()) {
            if (this._exp.criteria.eval(item)) {
                resultSet.push(item._id);
            }
        }
        for (let id of resultSet) {
            await this._collection.deleteById(id);
        }

        return resultSet.length;
    }
}

export type SetSpec<T extends object> = Partial<Item<T>>;

export type Where<
    T extends object,
    CollectionOp extends Update<T> | Delete<T>
> = {
    where: (q: QuerySpec<T>) => CollectionOp;
};

export type Set<T extends object, CollectionOp extends Update<T>> = {
    set: (q: SetSpec<T>) => Where<T, CollectionOp>;
};
