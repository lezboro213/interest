import { run_test } from '../test-harness';

run_test([
  'x=0\ny=2\nfor(do(x=sqrt(2+x),y=2*y/x), k,1,9)\nfloat(y)',
  '3.141588...',

  'for(do(x=sqrt(2+x),y=2*y/x),k,1,iterations)',
  'for(do(x=sqrt(2+x),y=2*y/x),k,1,iterations)',
]);
