"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.qadd = void 0;
var defs_1 = require("../runtime/defs");
var bignum_1 = require("./bignum");
var madd_1 = require("./madd");
var mgcd_1 = require("./mgcd");
var mmul_1 = require("./mmul");
//  Add rational numbers
//
//  Input:    p1    addend
//            p2    addend
//
//  Output:    sum
function qadd(qadd_frac1, qadd_frac2) {
    // a, qadd_ab, b, qadd_ba, c are all bigNum
    // we are adding the fractions qadd_frac1 + qadd_frac2 i.e.
    // qadd_frac1.q.a/qadd_frac1.q.b + qadd_frac2.q.a/qadd_frac2.q.b
    var qadd_ab = mmul_1.mmul(qadd_frac1.q.a, qadd_frac2.q.b);
    var qadd_ba = mmul_1.mmul(qadd_frac1.q.b, qadd_frac2.q.a);
    var qadd_numerator = madd_1.madd(qadd_ab, qadd_ba);
    //mfree(qadd_ab)
    //mfree(qadd_ba)
    // zero?
    if (defs_1.MZERO(qadd_numerator)) {
        //console.log "qadd IS ZERO"
        //mfree(qadd_numerator)
        return defs_1.Constants.zero;
    }
    var qadd_denominator = mmul_1.mmul(qadd_frac1.q.b, qadd_frac2.q.b);
    let gcdBetweenNumeratorAndDenominator = mgcd_1.mgcd(qadd_numerator, qadd_denominator);
    //console.log "gcd("+qadd_numerator+","+qadd_denominator+"): " + gcdBetweenNumeratorAndDenominator
    gcdBetweenNumeratorAndDenominator = bignum_1.makeSignSameAs(gcdBetweenNumeratorAndDenominator, qadd_denominator);
    //console.log "qadd qadd_denominator: " + qadd_denominator
    //console.log "qadd gcdBetweenNumeratorAndDenominator: " + gcdBetweenNumeratorAndDenominator
    var a = mmul_1.mdiv(qadd_numerator, gcdBetweenNumeratorAndDenominator);
    var b = mmul_1.mdiv(qadd_denominator, gcdBetweenNumeratorAndDenominator);
    var resultSum = new defs_1.Num(a, b);
    //console.log "qadd resultSum.q.a: " + resultSum.q.a
    //console.log "qadd resultSum.q.b: " + resultSum.q.b
    //mfree(qadd_numerator)
    //mfree(qadd_denominator)
    //mfree(gcdBetweenNumeratorAndDenominator)
    return resultSum;
    //console.log "qadd result: " + resultSum
}
exports.qadd = qadd;
