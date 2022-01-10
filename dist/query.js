"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeQuery = exports.processQuery = exports.runMatcher = exports.buildMatcher = exports.op = exports.OPList = exports.Matcher = void 0;
class Matcher {
    constructor(op, value) {
        this.op = op;
        this.value = value;
    }
}
exports.Matcher = Matcher;
var OPList;
(function (OPList) {
    OPList[OPList["EQ"] = 0] = "EQ";
    OPList[OPList["NE"] = 1] = "NE";
    OPList[OPList["LT"] = 2] = "LT";
    OPList[OPList["GT"] = 3] = "GT";
    OPList[OPList["GTE"] = 4] = "GTE";
    OPList[OPList["LTE"] = 5] = "LTE";
})(OPList = exports.OPList || (exports.OPList = {}));
exports.op = {
    eq: (value) => new Matcher(OPList.EQ, value),
    ne: (value) => new Matcher(OPList.NE, value),
    lt: (value) => new Matcher(OPList.LT, value),
    gt: (value) => new Matcher(OPList.GT, value),
    gte: (value) => new Matcher(OPList.GTE, value),
    lte: (value) => new Matcher(OPList.LTE, value),
};
function buildMatcher(expression) {
    if (typeof expression === "undefined") {
        throw new Error("A expression should not be undefined.");
    }
    if (expression instanceof Matcher) {
        return expression;
    }
    return new Matcher(OPList.EQ, expression);
}
exports.buildMatcher = buildMatcher;
function runMatcher(matcher, value) {
    switch (matcher.op) {
        case OPList.EQ:
            return value === matcher.value;
        case OPList.NE:
            return value !== matcher.value;
        case OPList.LT:
            return value < matcher.value;
        case OPList.GT:
            return value > matcher.value;
        case OPList.LTE:
            return value <= matcher.value;
        case OPList.GTE:
            return value >= matcher.value;
        default:
            throw new Error("Non exhaustive op matching");
    }
}
exports.runMatcher = runMatcher;
function processQuery(q) {
    const queryData = new Map();
    for (let field in q) {
        queryData.set(field, buildMatcher(q[field]));
    }
    return queryData;
}
exports.processQuery = processQuery;
function executeQuery(items, query) {
    const queryData = processQuery(query);
    const resultSet = [];
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
        if (satisfiesQuery)
            resultSet.push(item);
    }
    return resultSet;
}
exports.executeQuery = executeQuery;
//# sourceMappingURL=query.js.map