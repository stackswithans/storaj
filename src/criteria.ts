import { Item, StoreData, Index } from "./types";

export type OperatorSpec = {
    type: "OperatorSpec";
    opType: CriterionTy;
    value: StoreData;
    eval(left: StoreData, right: StoreData): boolean;
};
export type QuerySpec<T extends object> = {
    [field in keyof T]?: T[field] | OperatorSpec;
} & { _id?: Index };

export interface QExpression<T> {
    eval(item: Item<T>): boolean;
}

export const Criteria = {
    EQ: "EQ",
    NE: "NE",
    LT: "LT",
    LTE: "NE",
    GT: "GTE",
    GTE: "GTE",
} as const;
type CriterionTy = keyof typeof Criteria;

export const Operators = {
    AND: "AND",
    OR: "OR",
} as const;

type OpType = keyof typeof Operators;

export interface QOperator<T> extends QExpression<T> {
    opType: OpType;
    leftExp: QExpression<T>;
    rightEXp: QExpression<T>;
}

export interface Criterion<T> extends QExpression<T> {
    criterionTy: CriterionTy;
    field: keyof Item<T>;
    value: StoreData;
    eval(item: Item<T>): boolean;
}

export function makeCriterion<T>(
    criterionTy: CriterionTy,
    field: keyof Item<T>,
    value: StoreData,
    evalFn: (v: Item<T>) => boolean
): Criterion<T> {
    return {
        criterionTy,
        field,
        value,
        eval: evalFn,
    };
}

export function makeEqCriterion<T>(
    field: keyof Item<T>,
    value: StoreData
): Criterion<T> {
    return {
        criterionTy: Criteria.EQ,
        field,
        value,
        eval: (item: Item<T>) => item[field] === value,
    };
}

export function makeOpSpec(
    opType: CriterionTy,
    value: StoreData,
    evalFn: (l: StoreData, r: StoreData) => boolean
): OperatorSpec {
    return { type: "OperatorSpec", opType, value, eval: evalFn };
}

export function makeOperator<T>(
    opType: OpType,
    leftExp: QExpression<T>,
    rightEXp: QExpression<T>
): QOperator<T> {
    return {
        opType,
        leftExp,
        rightEXp,
        eval: (item: Item<T>) =>
            opType === Operators.AND
                ? leftExp.eval(item) && rightEXp.eval(item)
                : leftExp.eval(item) || rightEXp.eval(item),
    };
}

export function isOperatorSpec(expr: any): expr is OperatorSpec {
    return expr.type === "OperatorSpec";
}

export function isQOperator<T>(expr: any): expr is QOperator<T> {
    return typeof expr === "object" && expr.opType !== undefined;
}

export function isQExpression<T>(expr: any): expr is QExpression<T> {
    return (
        typeof expr === "object" &&
        (expr.criterionTy !== undefined || expr.opType !== undefined)
    );
}

export function isCriterion<T>(expr: any): expr is Criterion<T> {
    return typeof expr === "object" && expr.criterionTy !== undefined;
}

export function allCriteria<T extends object>() {
    return { eval: (item: Item<T>) => true };
}
