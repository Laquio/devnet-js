//code for free, use at you own risk!
//by: louie.laquio@gmail.com
//date: July 2019
//lastmod: August 2019
//version: 1.0
const getversion=[
  'Comware Software',
  'uptime',
  'RAM',
  ['Software','Version'],
  'CPLD',
  'Memory',
  ['Hardware','Version'],// contains 'Configuration register' and '0x2102'
  'Bootrom',
  'NVRAM',
  'SubSlot',
  'ROM:'
];
const getinterface=[
];
const JSONparsePOE = {key:['int','poe','priority','curpower','op','class','status'],indxv:[0,1,2,3,4,5,6]};
const JSONdispBridgeBr = {key:['int','link','speed','duplex','type','pvid','desc'],indxv:[0,1,2,3,4,5,6]}
const JSONlldpneighbor = [
  ['neighbor','port'],
  ['neighbor','index'],
  ['Neighbor','index'],
  'Update time',
  'Chassis type',
  'Chassis ID',
  'Port ID',
  'Time to live',
  'Oper version',
  'Max TCs',
  'Port description',
  'System name',
  'Management address',
  'PVID',
  'Link aggregation supported',
  'Link aggregation enabled',
  'Aggregation port ID',
  ['Auto','negotiation'],
  'OperMau',
  'PSE power',
  'Power type',
  'power value',
  'Maximum frame size'
];
const JSONdhcpSnooping = [
  ['DHCP','Snooping']
];
module.exports = {getversion:getversion,getinterface:getinterface,JSONparsePOE:JSONparsePOE,JSONdispBridgeBr:JSONdispBridgeBr,JSONlldpneighbor:JSONlldpneighbor,JSONdhcpSnooping:JSONdhcpSnooping}