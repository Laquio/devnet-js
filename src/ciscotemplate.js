//code for free, use at you own risk!
//by: louie.laquio@gmail.com
//date: July 2019
//lastmod: August 2019
//version: 1.0
const getversion=[
  'Version',
  'uptime',
  'System image file',
  'Last reset',
  'Processor board ID',
  ['Configuration register','0x2102'],// contains 'Configuration register' and '0x2102'
  'memory',
  'NVRAM',
  'interfaces',
  'ROM:',
  'reload reason'

];
const getinterface=[

];
const JSONparsePOE = {key:['int','admin','op','power','device','class','max'],indxv:[0,1,2,3,4,5,6]}
module.exports = {getversion:getversion,getinterface:getinterface,JSONparsePOE:JSONparsePOE}
