"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.quickpower = exports.quickfactor = void 0;
var defs_1 = require("../runtime/defs");
var add_1 = require("./add");
var bignum_1 = require("./bignum");
var factor_1 = require("./factor");
var is_1 = require("./is");
var list_1 = require("./list");
var multiply_1 = require("./multiply");
//-----------------------------------------------------------------------------
//
//  Factor small numerical powers
//
//  Input:    BASE        Base (positive integer < 2^31 - 1)
//            EXPONENT    Exponent
//
//  Output:    Expr
//
//-----------------------------------------------------------------------------
function quickfactor(BASE, EXPO) {
    var arr = factor_1.factor_small_number(bignum_1.nativeInt(BASE));
    var n = arr.length;
    for (let i = 0; i < n; i += 2) {
        arr.push(...quickpower(arr[i], multiply_1.multiply(arr[i + 1], EXPO))); // factored base, factored exponent * EXPO
    }
    // arr0 has n results from factor_number_raw()
    // on top of that are all the expressions from quickpower()
    // multiply the quickpower() results
    return multiply_1.multiply_all(arr.slice(n));
}
exports.quickfactor = quickfactor;
// BASE is a prime number so power is simpler
function quickpower(BASE, EXPO) {
    var p3 = bignum_1.bignum_truncate(EXPO);
    var p4 = add_1.subtract(EXPO, p3);
    let fractionalPart;
    // fractional part of EXPO
    if (!is_1.isZeroAtomOrTensor(p4)) {
        fractionalPart = list_1.makeList(defs_1.symbol(defs_1.POWER), BASE, p4);
    }
    var expo = bignum_1.nativeInt(p3);
    if (isNaN(expo)) {
        var result = list_1.makeList(defs_1.symbol(defs_1.POWER), BASE, p3);
        return fractionalPart ? [fractionalPart, result] : [result];
    }
    if (expo === 0) {
        return [fractionalPart];
    }
    var result = bignum_1.bignum_power_number(BASE, expo);
    return fractionalPart ? [fractionalPart, result] : [result];
}
exports.quickpower = quickpower;
//if SELFTEST
