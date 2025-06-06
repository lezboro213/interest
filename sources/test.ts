import {
  caddr,
  cadr,
  car,
  cddr,
  cdr,
  Constants,
  DOUBLE,
  iscons,
  MSIGN,
  NIL,
  NUM,
  Sign,
  U
} from '../runtime/defs';
import { symbol } from "../runtime/symbol";
import { subtract } from './add';
import { Eval } from './eval';
import { yyfloat } from './float';
import {
  isZeroAtomOrTensor,
  isZeroLikeOrNonZeroLikeOrUndetermined
} from './is';
import { simplify } from './simplify';

// If the number of args is odd then the last arg is the default result.
// Works like a switch statement. Could also be used for piecewise
// functions? TODO should probably be called "switch"?
export function Eval_test(p1: U) {
  var orig = p1;
  p1 = cdr(p1);
  while (iscons(p1)) {
    // odd number of parameters means that the
    // last argument becomes the default case
    // i.e. the one without a test.
    if (cdr(p1) === symbol(NIL)) {
      return Eval(car(p1)); // default case
    }

    var checkResult = isZeroLikeOrNonZeroLikeOrUndetermined(car(p1));
    if (checkResult == null) {
      // we couldn't determine the result
      // of a test. This means we can't conclude
      // anything about the result of the
      // overall test, so we must bail
      // with the unevalled test
      return orig;
    } else if (checkResult) {
      // test succesful, we found out output
      return Eval(cadr(p1));
    } else {
      // test unsuccessful, continue to the
      // next pair of test,value
      p1 = cddr(p1);
    }
  }

  // no test matched and there was no
  // catch-all case, so we return zero.
  return Constants.zero;
}

// we test A==B by first subtracting and checking if we symbolically
// get zero. If not, we evaluate to float and check if we get a zero.
// If we get another NUMBER then we know they are different.
// If we get something else, then we don't know and we return the
// unaveluated test, which is the same as saying "maybe".
export function Eval_testeq(p1: U) {
  // first try without simplifyng both sides
  var orig = p1;
  let subtractionResult = subtract(Eval(cadr(p1)), Eval(caddr(p1)));

  // OK so we are doing something tricky here
  // we are using isZeroLikeOrNonZeroLikeOrUndetermined to check if the result
  // is zero or not zero or unknown.
  // isZeroLikeOrNonZeroLikeOrUndetermined has some routines
  // to determine the zero-ness/non-zero-ness or
  // undeterminate-ness of things so we use
  // that here and down below.
  let checkResult = isZeroLikeOrNonZeroLikeOrUndetermined(subtractionResult);
  if (checkResult) {
    return Constants.zero;
  } else if (checkResult != null && !checkResult) {
    return Constants.one;
  }

  // we didn't get a simple numeric result but
  // let's try again after doing
  // a simplification on both sides
  var arg1 = simplify(Eval(cadr(p1)));
  var arg2 = simplify(Eval(caddr(p1)));
  subtractionResult = subtract(arg1, arg2);

  checkResult = isZeroLikeOrNonZeroLikeOrUndetermined(subtractionResult);
  if (checkResult) {
    return Constants.zero;
  } else if (checkResult != null && !checkResult) {
    return Constants.one;
  }

  // if we didn't get to a number then we
  // don't know whether the quantities are
  // different so do nothing
  return orig;
}

// Relational operators expect a numeric result for operand difference.
export function Eval_testge(p1: U) {
  var orig = p1;
  var comparison = cmp_args(p1);

  if (comparison == null) {
    return orig;
  }

  if (comparison >= 0) {
    return Constants.one;
  } else {
    return Constants.zero;
  }
}

export function Eval_testgt(p1: U) {
  var orig = p1;
  var comparison = cmp_args(p1);

  if (comparison == null) {
    return orig;
  }

  if (comparison > 0) {
    return Constants.one;
  } else {
    return Constants.zero;
  }
}

export function Eval_testle(p1: U) {
  var orig = p1;
  var comparison = cmp_args(p1);

  if (comparison == null) {
    return orig;
  }

  if (comparison <= 0) {
    return Constants.one;
  } else {
    return Constants.zero;
  }
}

export function Eval_testlt(p1: U) {
  var orig = p1;
  var comparison = cmp_args(p1);

  if (comparison == null) {
    return orig;
  }

  if (comparison < 0) {
    return Constants.one;
  } else {
    return Constants.zero;
  }
}

// not definition
export function Eval_not(p1: U) {
  var wholeAndExpression = p1;
  var checkResult = isZeroLikeOrNonZeroLikeOrUndetermined(cadr(p1));
  if (checkResult == null) {
    // inconclusive test on predicate
    return wholeAndExpression;
  } else if (checkResult) {
    // true -> false
    return Constants.zero;
  } else {
    // false -> true
    return Constants.one;
  }
}

/* and =====================================================================

Tags
----
scripting, JS, internal, treenode, general concept

Parameters
----------
a,b,...

General description
-------------------
Logical-and of predicate expressions.

*/

// and definition
export function Eval_and(p1: U) {
  var wholeAndExpression = p1;
  let andPredicates = cdr(wholeAndExpression);
  let somePredicateUnknown = false;
  while (iscons(andPredicates)) {
    // eval each predicate
    var checkResult = isZeroLikeOrNonZeroLikeOrUndetermined(
      car(andPredicates)
    );

    if (checkResult == null) {
      // here we have stuff that is not reconducible to any
      // numeric value (or tensor with numeric values) e.g.
      // 'a+b', so it just means that we just don't know the
      // truth value of this particular predicate.
      // We'll track the fact that we found an unknown
      // predicate and we continue with the other predicates.
      // (note that in case some subsequent predicate will be false,
      // it won't matter that we found some unknowns and
      // the whole test will be immediately zero).
      somePredicateUnknown = true;
      andPredicates = cdr(andPredicates);
    } else if (checkResult) {
      // found a true, move on to the next predicate
      andPredicates = cdr(andPredicates);
    } else if (!checkResult) {
      // found a false, enough to falsify everything and return
      return Constants.zero;
    }
  }

  // We checked all the predicates and none of them
  // was false. So they were all either true or unknown.
  // Now, if even just one was unknown, we'll have to call this
  // test as inconclusive and return the whole test expression.
  // If all the predicates were known, then we can conclude
  // that the test returns true.
  if (somePredicateUnknown) {
    return wholeAndExpression;
  } else {
    return Constants.one;
  }
}

// or definition
export function Eval_or(p1: U) {
  var wholeOrExpression = p1;
  let orPredicates = cdr(wholeOrExpression);
  let somePredicateUnknown = false;
  while (iscons(orPredicates)) {
    // eval each predicate
    var checkResult = isZeroLikeOrNonZeroLikeOrUndetermined(
      car(orPredicates)
    );

    if (checkResult == null) {
      // here we have stuff that is not reconducible to any
      // numeric value (or tensor with numeric values) e.g.
      // 'a+b', so it just means that we just don't know the
      // truth value of this particular predicate.
      // We'll track the fact that we found an unknown
      // predicate and we continue with the other predicates.
      // (note that in case some subsequent predicate will be false,
      // it won't matter that we found some unknowns and
      // the whole test will be immediately zero).
      somePredicateUnknown = true;
      orPredicates = cdr(orPredicates);
    } else if (checkResult) {
      // found a true, enough to return true
      return Constants.one;
    } else if (!checkResult) {
      // found a false, move on to the next predicate
      orPredicates = cdr(orPredicates);
    }
  }

  // We checked all the predicates and none of them
  // was true. So they were all either false or unknown.
  // Now, if even just one was unknown, we'll have to call this
  // test as inconclusive and return the whole test expression.
  // If all the predicates were known, then we can conclude
  // that the test returns false.
  if (somePredicateUnknown) {
    return wholeOrExpression;
  } else {
    return Constants.zero;
  }
}

// use subtract for cases like A < A + 1

// TODO you could be smarter here and
// simplify both sides only in the case
// of "relational operator: cannot determine..."
// a bit like we do in Eval_testeq
function cmp_args(p1: U): Sign {
  let t: Sign = 0;
  var arg1 = simplify(Eval(cadr(p1)));
  var arg2 = simplify(Eval(caddr(p1)));
  p1 = subtract(arg1, arg2);

  // try floating point if necessary
  if (p1.k !== NUM && p1.k !== DOUBLE) {
    p1 = Eval(yyfloat(p1));
  }

  //console.log "comparison: " + p1.toString()

  if (isZeroAtomOrTensor(p1)) {
    //console.log "comparison isZero "
    return 0;
  }

  switch (p1.k) {
    case NUM:
      if (MSIGN(p1.q.a) === -1) {
        t = -1;
      } else {
        t = 1;
      }
      break;
    case DOUBLE:
      //console.log "comparison p1.d: " + p1.d
      if (p1.d < 0.0) {
        t = -1;
      } else {
        t = 1;
      }
      break;
    default:
      //console.log "comparison is null"
      t = null;
  }

  return t;
}
