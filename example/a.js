const devnet = require('../index');
const devtools = devnet.tools;
let arryobj = [{a:1,b:2},{c:3},{d:4}]
console.log("result: ",devtools.jsonmerge(arryobj)); //result:  { a: 1, b: 2, c: 3, d: 4 }
console.log("result: ",devtools.jsonmerge({obj1:'hi'},{obj2:' hello'})); //result:  { obj1: 'hi', obj2: ' hello' }
