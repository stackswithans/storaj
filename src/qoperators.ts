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
    makeOpSpec,
    QuerySpec,
    OperatorSpec,
} from "./criteria";

const _eq = (left: StoreData, right: StoreData) => left === right;
const _ne = (left: StoreData, right: StoreData) => left !== right;
const _gt = (left: StoreData, right: StoreData) =>
    left && right ? left > right : false;
const _gte = (left: StoreData, right: StoreData) =>
    left && right ? left >= right : false;
const _lt = (left: StoreData, right: StoreData) =>
    left && right ? left < right : false;
const _lte = (left: StoreData, right: StoreData) =>
    left && right ? left <= right : false;

export const eq = (value: StoreData) => makeOpSpec(Criteria.EQ, value, _eq);
export const ne = (value: StoreData) => makeOpSpec(Criteria.NE, value, _ne);
export const gt = (value: StoreData) => makeOpSpec(Criteria.GT, value, _gt);
export const gte = (value: StoreData) => makeOpSpec(Criteria.GTE, value, _gte);
export const lt = (value: StoreData) => makeOpSpec(Criteria.LT, value, _lt);
export const lte = (value: StoreData) => makeOpSpec(Criteria.LTE, value, _lte);

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
