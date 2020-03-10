const devnet = require('../index');
const devtools = devnet.tools;

let obj = '0.0.0.0          0.0.0.0   132.223.40.254   132.223.40.159     10\n        127.0.0.0        255.0.0.0         On-link         127.0.0.1    306\n        127.0.0.1  255.255.255.255         On-link         127.0.0.1    306'
//console.log("raw obj1 : ",obj);
//console.log("result1: ",devtools.getroute(obj));
let obj2 = "===========================================================================\n\nIPv4 Route Table\n===========================================================================\nActive Routes:\nNetwork Destination        Netmask          Gateway       Interface  Metric\n          0.0.0.0          0.0.0.0      110.136.0.1  110.137.183.109     10\n      110.136.0.0      255.248.0.0         On-link   110.137.183.109    266\n  110.137.183.109  255.255.255.255         On-link   110.137.183.109    266\n\n 110.143.255.255  255.255.255.255         On-link   110.137.183.109    266\n        127.0.0.0        255.0.0.0         On-link         127.0.0.1    306\n        127.0.0.1  255.255.255.255         On-link         127.0.0.1    306\n  127.255.255.255  255.255.255.255         On-link         127.0.0.1    306\n     192.168.56.0    255.255.255.0         On-link      192.168.56.1    266\n     192.168.56.1  255.255.255.255         On-link      192.168.56.1    266\n   192.168.56.255  255.255.255.255         On-link      192.168.56.1    266\n        224.0.0.0        240.0.0.0         On-link         127.0.0.1    306\n        224.0.0.0        240.0.0.0         On-link      192.168.56.1    266\n        224.0.0.0        240.0.0.0         On-link   110.137.183.109    266\n  255.255.255.255  255.255.255.255         On-link         127.0.0.1    306\n  255.255.255.255  255.255.255.255         On-link      192.168.56.1    266\n  255.255.255.255  255.255.255.255         On-link   110.137.183.109    266\n==========================================================================="
console.log("raw obj2 : ",obj2);
console.log("result2: ",devtools.getroute(obj));