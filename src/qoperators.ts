import { StoreData, Item } from "./types";
import { parseQuerySpec } from "./query";
import {
    Criterion,
    Criteria,
    makeCriterion,
    makeOperator,
    QExpression,
    isQExpression,
    Operators,
    QOperator,
    makeEqCriterion,
    QuerySpec,
} from "./criteria";

export function eq<T>(field: keyof Item<T>, value: StoreData): Criterion<T> {
    return makeEqCriterion(field, value);
}

export function ne<T>(field: keyof Item<T>, value: StoreData): Criterion<T> {
    return makeCriterion(
        Criteria.NE,
        field,
        value,
        (item: Item<T>) => item[field] !== value
    );
}

export function lt<T>(field: keyof Item<T>, value: StoreData): Criterion<T> {
    return makeCriterion(
        Criteria.LT,
        field,
        value,
        (item: Item<T>) => item[field] < <any>value
    );
}

export function gt<T>(field: keyof Item<T>, value: StoreData): Criterion<T> {
    return makeCriterion(
        Criteria.LT,
        field,
        value,
        (item: Item<T>) => item[field] > <any>value
    );
}

export function gte<T>(field: keyof Item<T>, value: StoreData): Criterion<T> {
    return makeCriterion(
        Criteria.LT,
        field,
        value,
        (item: Item<T>) => item[field] >= <any>value
    );
}

export function lte<T>(field: keyof Item<T>, value: StoreData): Criterion<T> {
    return makeCriterion(
        Criteria.LT,
        field,
        value,
        (item: Item<T>) => item[field] <= <any>value
    );
}

export function or<T extends Object>(
    leftSpec: QuerySpec<T> | QOperator<T>,
    rightSpec: QuerySpec<T> | QOperator<T>
): QOperator<T> {
    let leftExpr = !isQExpression(leftSpec)
        ? parseQuerySpec(leftSpec as object)
        : leftSpec;
    let rightExpr = !isQExpression(rightSpec)
        ? parseQuerySpec(rightSpec as object)
        : rightSpec;
    return makeOperator(Operators.OR, leftExpr, rightExpr);
}

export function and<T extends object>(
    leftSpec: QuerySpec<T> | QOperator<T>,
    rightSpec: QuerySpec<T> | QOperator<T>
): QOperator<T> {
    let lexpr = !isQExpression(leftSpec)
        ? parseQuerySpec(leftSpec as object)
        : leftSpec;

    let rexpr = !isQExpression(rightSpec)
        ? parseQuerySpec(rightSpec as object)
        : rightSpec;
    return makeOperator(Operators.AND, lexpr, rexpr);
}
