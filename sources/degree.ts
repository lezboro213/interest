import {
  caddr,
  cadr,
  Constants,
  iscons,
  isNumericAtom,
  ispower,
  NIL,
  U
} from '../runtime/defs';
import { symbol } from "../runtime/symbol";
import { equal, lessp } from '../sources/misc';
import { Eval } from './eval';
import { guess } from './guess';
import { isZeroAtomOrTensor } from './is';

/* deg =====================================================================

Tags
----
scripting, JS, internal, treenode, general concept

Parameters
----------
p,x

General description
-------------------
Returns the degree of polynomial p(x).

*/
export function Eval_degree(p1: U) {
  let poly = Eval(cadr(p1));
  p1 = Eval(caddr(p1));
  let variable = p1 === symbol(NIL) ? guess(poly) : p1;
  return degree(poly, variable);
}

//-----------------------------------------------------------------------------
//
//  Find the degree of a polynomial
//
//  Input:    POLY    p(x)
//            X       x
//
//  Output:    Result
//
//  Note: Finds the largest numerical power of x. Does not check for
//  weirdness in p(x).
//
//-----------------------------------------------------------------------------
export function degree(POLY: U, X: U): U {
  return yydegree(POLY, X, Constants.zero);
}

function yydegree(POLY: U, X: U, DEGREE: U): U {
  if (equal(POLY, X)) {
    if (isZeroAtomOrTensor(DEGREE)) {
      DEGREE = Constants.one;
    }
  } else if (ispower(POLY)) {
    if (
      equal(cadr(POLY), X) &&
      isNumericAtom(caddr(POLY)) &&
      lessp(DEGREE, caddr(POLY))
    ) {
      DEGREE = caddr(POLY);
    }
  } else if (iscons(POLY)) {
    DEGREE = POLY.tail().reduce((a: U, b: U) => yydegree(b, X, a), DEGREE);
  }
  return DEGREE;
}
