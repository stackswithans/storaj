import { StoreData } from "./types";
import { Criteria, makeOpSpec } from "./criteria.js";

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
