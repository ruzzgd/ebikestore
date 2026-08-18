import { doubleCsrf } from 'csrf-csrf';
const result = doubleCsrf({ getSecret: () => 'abc' });
console.log(Object.keys(result));
