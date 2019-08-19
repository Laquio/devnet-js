//cisco template sample
//by: louie.laquio@gmail.com
//date: Aug 2019
const getversion=[
  'uptime',
  'System image file',
  'Last reset',
  'Processor board ID',
  ['Configuration register','0x2102'],// contains 'Configuration register' and '0x2102'
  'Version',
  'memory'
];
module.exports = {getversion:getversion}
