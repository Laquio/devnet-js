# Description

devnet-js modules written in JavaScript for [node.js](http://nodejs.org/).

devnet-js simplifies network device interaction using JavaScript functions and templates.

devnet-js is using [ssh2](https://www.npmjs.com/package/ssh2) package to establish SSH connectivity.

# Table of Contents

* [Requirements](#requirements)
* [Installation](#installation)
* [SSH Examples](#ssh-examples)
  * [Sample SSH Stream](#sample-ssh-stream)
  * [Execute show commands in a Cisco Device](#execute-show-in-a-cisco-device)
  * [Interactive SSH](#interactive-ssh)
  * [Interactive cli console](#stream-cli)
* [Functions Example](#functions-example)
  * [Cisco Router](#cisco-router)
      * [Parse Version](#parse-version)
      * [Parse Arp Entry](#parse-arp-entry)
      * [Parse Running Interface](#parse-running-interface)
  * [Cisco Switch](#cisco-switch)
      * [Parse MAC Address](#parse-mac-address)
      * [Parse Vlan](#parse-vlan)
  * [HP Switch](#hp-switch)
      * [Parse poe](#parse-poe)
      * [Parse MAC-ADDR](#parse-mac-addr)
* [Devnet Tools](#devnet-tools)


## Requirements

* [node.js](http://nodejs.org/) -- v5.2.0 or newer
  * node v12.0.0 or newer for Ed25519 key support

## Installation

    npm i devnet-js
    or
    npm install devnet-js --save

## SSH Examples

### Sample SSH Stream

```js
var devnet = require('devnet-js');
let ciscodev1 = new devnet.CiscoRouter({id:"sample-id-1"});
var loginparam = {
    credential:{  //see ssh2 documentation for other option
      host: '<hostname or IP>',
      port: 22,
      username: '<your-username-here>',
      password: '<pwd>'
    }
  }
ciscodev1.openSshShell(loginparam,function(stream){  // interactive shell
  if(stream){   // stream instance
    console.log('Session Ready');
    stream.on('close', function() {
      console.log('Stream :: close');
      ciscodev1.sshconn.end();
    }).on('data', function(data) {
      console.log('OUTPUT: ' + data);
    });
    stream.end('dir\nexit\n');
  }
});
```

### Execute show commands in a Cisco Device

```js
var devnet = require('devnet-js');
let ciscodev1 = new devnet.CiscoRouter({id:"sample-id-1"});
var loginparam = {
    credential:{  //see ssh2 documentation for other option
      host: '<hostname or IP>',
      port: 22,
      username: '<your-username-here>',
      password: '<pwd>',
      algorithms: {
        cipher: [
          '3des-cbc'
        ]
      }
    }
  }
console.log("show ip int br");
var param = {
  command:"show ip int br",
  endActiveStream:true,
  credential:loginparam.credential,
  setEncoding:"utf-8"
}
ciscodev1.execute(param,function(data){   //non interactive
    console.log('data arry',data);
});
/*
param = {
  command:"show arp",
  endActiveStream:true,
  credential:loginparam.credential,
  setEncoding:"utf-8"
}
ciscodev1.execute(param,function(data){
    console.log('data arry',data);
},function(data2){
    console.log(data2);
});
*/
```

### Interactive SSH

```js
var devnet = require('devnet-js');
let ciscodev1 = new devnet.Defaultclass({id:"any string here"});
var loginparam = {
    credential:{  //see ssh2 documentation for other option
      host: '<hostname or IP>',
      port: 22,
      username: '<your-username-here>',
      password: '<pwd>'
    }
  }
ciscodev1.openSshShell(loginparam);

setTimeout(function(){ //Writing stream in a simple way some delay is required none common method; moments after openSshShell function.
  ciscodev1.streamSendkeys("show ip int br",{autoenter:true,emit:true}).on('data',function(data) {  //other style
    process.stdout.write(data);
  });
}, 3000);
/*
setTimeout(testfn, 2000);
function testfn(){  //-simple stright forward style
    ciscodev1.sshconn.simplify = false;
    ciscodev1.streamSendkeys("show ip int br"); // or ciscodev1.streamSendkeys("show version",{autoenter:true});
    ciscodev1.sshconn.stream.on('data', function(data) {
      process.stdout.write(data);
    });
    ciscodev1.sshconn.stream.on('close', function() {
      console.log('\n--- stream closed');
      ciscodev1.sshconn.end();
    });

    setTimeout(function(){
      process.stdout.write("   - Enter Key!");
      ciscodev1.streamSendkeys("\n")
    }, 3000);
}//-testfn
*/
setTimeout(function(){  //terminate ssh session after 12 seconds
  ciscodev1.end();
}, 12000);
```

### Stream CLI

```js
var devnet = require('devnet-js');
let sampledev1 = new devnet.Defaultclass({id:"any string here"});   //Defaultclass intended for generic devices.
var loginparam = {
    credential:{  //see ssh2 documentation for other option
      host: '<hostname or IP>',
      port: 22,
      username: '<your-username-here>',
      password: '<pwd>',
      algorithms: {
        cipher: [ '3des-cbc' ],
        kex: [ "diffie-hellman-group1-sha1" ]
      }
    }
  }
sampledev1.openSshShell(loginparam);
setTimeout(testfn, 2000); //Writing stream in a simple way some delay is required none common method; moments after openSshShell function.
function testfn(){
    sampledev1.streamcli();    //sample CLI interaction //-hit Esc 2 times to exit process
}
/*
sampledev1.openSshShell(loginparam,function(stream){  // interactive shell ideal method
  if(stream){   // stream instance
    console.log('Session Ready');
    //sampledev1.streamcli({live:true});
    sampledev1.streamcli({psobj:{stopctr:4,stoptoken:3}});    //sampl.e CLI interaction //-hit 'Ctrl+c' four times to exit process
  }
});
*/
/*
sampledev1.openSshShell(loginparam,function(stream){  // interactive shell
  if(stream){   // stream instance
    console.log('Session Ready');
    sampledev1.streamcli({psobj:{stopctr:1,stoptoken:"3"}});    //sampl.e CLI interaction //-hit character '3' 1 time to exit process //single character
  }
});
*/
/*
var tmpkeys = "";
sampledev1.openSshShell(loginparam,function(stream){
  if(stream){   // stream instance
    console.log('Session Ready');
    sampledev1.streamcli({live:true},function(cbval){
      if(cbval.charCodeAt(0)==13){
        console.log("\n last command : ", tmpkeys);
        tmpkeys = "";
        return false;// exclude ascii 13.
      }else{
        tmpkeys+=cbval;
        return true; //send keys
      }
    });
  }
});
*/

```

## Functions Example
See example below:

## Cisco Router

### parse version

Returns the summary information of cli show version command.

```js
option{
  fileref:'path or json', // default is in dir 'src', filename 'ciscotemplate.js' for Cisco devices if not specified.  
  json:true,  //[true || false ] default is true, formats the output into json.
  nextmarker:'--More--', // [ word string ] default is '--More--', string indicator in a session emulator/terminal
  nextmarkerflg:true, // [true || false ] default is true, continue marker enable flag in a session emulator/terminal, will loop through until the end of the command buffer output  e.g. '--More--' in Cisco CLI.
  hide:true   // [true || false ] default is true, hides background console logging
}
sampledev1.parseVersion(option) //returns a promise
```
### list interface

Returns an array object of interfaces.

```js
var option={ json:true }
sampledev1.listif(option).then(res=>{     //example function
  console.log("output:\n",res);
});
```

Example:
```js
var devnet = require('devnet-js');
let sampledev1 = new devnet.CiscoRouter({id:"any string here"});
var loginparam = {
    credential:{  //see ssh2 documentation for other option
      host: '<hostname or IP>',
      port: 22,
      username: '<your-username-here>',
      password: '<pwd>',
      algorithms: {
        cipher: [ '3des-cbc' ],
        kex: [ "diffie-hellman-group1-sha1" ]
      }
    }
  }
new Promise(_res=>{
  sampledev1.openSshShell(loginparam,function(stream){    //ctrl+c to end process
    if(stream){   // stream instance
      stream.setEncoding("utf-8");
      console.log('Session Ready.');
      _res(true);
    }
  });
}).then(res=>{
  if(res){
    var option={
      json:true        //Select between Array or JSON
      //fileref:__dirname+'/ciscotemplate-cust' //Absolute path
    }
    sampledev1.parseVersion(option).then(res=>{     //example function
      console.log("output:\n",res);
    });
  }
});
```
## Cisco Switch

### Parse MAC address
Returns a summary of MAC address entry.
```js
var option={ json:true,format:'XXXX-xx:xx-XX.XX' }
sampledev1.parseMAC(option).then(res=>{     //example function
  console.log("output:\n",res);
});
```

### Parse vlan

```js
```

## HP Switch


### Parse poe
Returns a summary of interface poe status.

```js
var option={ json:true }       //Select between Array or JSON
sampledev1.parsePOE(option).then(res=>{     //example function
  console.log("output:\n",res);
});
```

### Parse Mac Addr
Returns a summary of MAC address entry.

```js
option{
  json:true,  //[true || false ] default is true, formats the output into json.
  format:'XXXX-xxxx-XXXX' // 'X' for uppercase and 'x' for lower case, other symbols are supported e.g. 'XXXX:xx-xx.XXXX'
}
sampledev1 = new devnet.HpSwitch({id:"any string here"});   //HPE SWITCH EXAMPLE
sampledev1.parseMAC(option) //returns a promise
```

```js
var devnet = require('devnet-js');
let sampledev1 = new devnet.HpSwitch({id:"any string here"});   //HPE SWITCH EXAMPLE
var loginparam = {
    credential:{  //see ssh2 documentation for other option
      host: '<hostname or IP>',
      port: 22,
      username: '<your-username-here>',
      password: '<pwd>',
      algorithms: {
        cipher: [ '3des-cbc' ],
        kex: [ "diffie-hellman-group1-sha1","diffie-hellman-group-exchange-sha256","diffie-hellman-group14-sha1" ]
      }
    }
  }
new Promise(_res=>{
  sampledev1.openSshShell(loginparam,function(stream){
    if(stream){   // stream instance
      stream.setEncoding("utf-8");
      console.log('Session Ready.');
      _res(true);
    }
  });
}).then(res=>{
  if(res){
    var option={ json:true,format:'XXXX-xx:xx-XX.XX' }
    sampledev1.parseMAC(option).then(res=>{     //example function
      console.log("output:\n",res);
    });
  }
});
```

### Get LLDP neighbor info

```js
var option={
      json:true,
      stoptokens:false,
      incending:false,
      startinglines :'LLDP neighbor-info',
      refarry:['Update time','Chassis type','Port ID','System name','Management address']
    }
    sampledev1.lldpneighbor(option).then(res=>{     //example function
      console.log("output:\n",res);
    });
```

## Devnet-js Default Class options and parameter details

### Default class Constructor

### openSshShell function

### streamSendkeys function

### execute function

### streamcli function

### end function

## Devnet Tools

Functions you might be interested.
```js
var devnet = require('devnet-js');
const devtools = devnet.tools;

devtools.str2Arry(String,Token)  // returns array of string, sanitize unwanted '\n', '\r' and '\b' split string with token
devtools.extractstr(rawstring,reference_arrays) //parse or format string using reference array(s) then converts into json
devtools.keyval(key,value) // returns JSON object of key and value pair.
devtools.arry2json(arry)//convert multiple array of json into single json formal
devtools.raw2arry(string,option) // convert string separated by space or tabs into arrays.
devtools.formatMAC(mac_string,format)  //format MAC Address, ex. xxxx-XXXX-XXxx.
devtools.quickipcheck(String) // Check String if there is an IPADDR pattern then  convert string into JSON
devtools.arrym2s(Arrays,level) // Iterate over the input multi dimension array then returns a single dimension array. ex. console.log(devtools.arrym2s([[1,2,3],['a',1,2,'h',[{as:'as'},['1k','2k']]]]))
devtools.jsonmerge(json1 | [json_array],json2) //concat 2 or more json ex. console.log(devnet.tools.jsonmerge({a:"a1",b:"b1",c:"c1",x:1},{a:"a 2",b2:"b 2",c_1:"c 2",d:"d1"})); //console.log(devnet.tools.jsonmerge([{a:"a1",b:"b1",c:"c1",x:1},{a:"a 2",b2:"b 2",c_1:"c 2",d:"d1"},{q:'q123'}]));
devtools.getroute(string) // returns possible route in JSON format both destination and mask.
```

### str2Arry function
```js
var devnet = require('devnet-js');
const devtools = devnet.tools;
let strvar = "a b c d \n a1 b1\tc1 d1 \n a2 b2 c2 d2"

console.log("result: ",devtools.str2Arry(strvar));
// result:  [ 'a b c d', 'a1 b1 c1 d1', 'a2 b2 c2 d2' ]
console.log("result: ",devtools.str2Arry(strvar,'\t'));
//result:  [ 'a b c d \n a1 b1', 'c1 d1 \n a2 b2 c2 d2' ]
```
### extractstr function
```js
var devnet = require('devnet-js');
const devtools = devnet.tools;
let strvar = "a b c d \n a1 b1 c1 d1 \n a2 b2 c2 d2"
let arry = [strvar,'the quick brown fox','jumps over the','lazy dog']
console.log("result1: ",devtools.extractstr(arry,['lazy','quick']));
console.log("\nresult2: ",devtools.extractstr(arry,['c2','brown','fox','over','a1','dog']));
//result1:  [ [ { quick: 'the quick brown fox' } ], [ { lazy: 'lazy dog' } ] ]
//result2:  [
//  [ { a1: 'a1 b1 c1 d1' } ],
//  [ { c2: 'a2 b2 c2 d2' } ],
//  [ { brown: 'the quick brown fox' },
//    { fox: 'the quick brown fox' } ],
//  [ { over: 'jumps over the' } ],
//  [ { dog: 'lazy dog' } ]
//]
```
### keyval function
```js
var devnet = require('devnet-js');
const devtools = devnet.tools;
console.log("result1: ",devtools.keyval('abc','123'));
console.log("result2: ",devtools.keyval('123','{a:1,b:2,c:3}'));
//result1:  { abc: '123' }
//result2:  { '123': '{a:1,b:2,c:3}' }
```
### arry2json function
```js
var devnet = require('devnet-js');
const devtools = devnet.tools;
let arry = [
  [ { Version: 'GPL code under the terms of GPL Version 2.0.  For more details, see the' } ],
  [ { 'ROM:': 'ROM: IOS-XE ROMMON' } ],
  [ { uptime: 'rtr1 uptime is 1 week, 5 days, 20 hours, 56 minutes' } ],
  [ { System_image_file: 'System image file is `bootflash:isr4300-universalk9.16.03.08.SPA.bin`' } ],
  [ { reload_reason: 'Last reload reason: PowerOn' } ],
  [ { image: 'System image file is `bootflash:isr4300-universalk9.16.03.08.SPA.bin`' },{ image: 'test string' } ]
]
console.log("result: ",devtools.arry2json(arry));
/*
result:  { Version: 'GPL code under the terms of GPL Version 2.0.  For more details, see the',
  'ROM:': 'ROM: IOS-XE ROMMON',
  uptime: 'rtr1 uptime is 1 week, 5 days, 20 hours, 56 minutes',
  System_image_file: 'System image file is `bootflash:isr4300-universalk9.16.03.08.SPA.bin`',
  reload_reason: 'Last reload reason: PowerOn',
  image: 'System image file is `bootflash:isr4300-universalk9.16.03.08.SPA.bin`',
  image6: 'test string' }
*/
```
### raw2arry function
```js
var devnet = require('devnet-js');
const devtools = devnet.tools;
let strvar = "a b c d \n a1 b1 c1 d1 \n a2 b2 c2 d2"
let arry = [strvar,'the quick brown fox','jumps over the','lazy dog']
console.log("result: ",devtools.raw2arry(arry));
/*
result:  [
  [ [ 'a', 'b', 'c', 'd' ],
    [ 'a1', 'b1', 'c1', 'd1' ],
    [ 'a2', 'b2', 'c2', 'd2' ]
  ],
  [ 'the', 'quick', 'brown', 'fox' ],
  [ 'jumps', 'over', 'the' ],
  [ 'lazy', 'dog' ]
]
*/
```
### formatMAC function
```js
var devnet = require('devnet-js');
const devtools = devnet.tools;
let strvar = "abcd-12ff-9ae6"
console.log("result: ",devtools.formatMAC(strvar,'Xxxx:xxXX-XXXX')); //result:  Abcd:12FF-9AE6
console.log("result: ",devtools.formatMAC("11aa:bb22:cc33",'xx:Xx:xx:XX:XX:XX')); // result:  11:Aa:bb:22:CC:33
```
### quickipcheck function
```js
var devnet = require('devnet-js');
const devtools = devnet.tools;
let strvar = "the quick brown 1.2.3.x  jumps over 7.7.7.7 \n the lazy dog 4.x.x.2"
console.log("result: ",devtools.quickipcheck(strvar));
/*
result:  [
  { a: [ 'the', 'quick', 'brown', '1.2.3.x', 'jumps', 'over', '7.7.7.7' ],
    b: [ '1.2.3.x', '7.7.7.7' ],
    c: 2 },
  { a: [ 'the', 'lazy', 'dog', '4.x.x.2' ],
    b: [ '4.x.x.2' ],
    c: 1 }
  ]
*/
```
### arrym2s function
```js
var devnet = require('devnet-js');
const devtools = devnet.tools;
let arry = [
  ['a1',2,3],
  [0,100,200,300],
  [['a2','b2','c2',['yes','no']],'d']
]
console.log("result: ",devtools.arrym2s(arry)); //result:  [ 'a1', 2, 3, 0, 100, 200, 300, 'a2', 'b2', 'c2', 'yes', 'no', 'd' ]
console.log("result: ",devtools.arrym2s(arry,1));
/*
result:
[ 'a1', 2, 3, 0, 100, 200, 300,
 [ 'a2', 'b2', 'c2', [ 'yes', 'no' ] ],
 'd'
]
*/

```
### jsonmerge function
```js
var devnet = require('devnet-js');
const devtools = devnet.tools
let arryobj = [{a:1,b:2},{c:3},{d:4}]
console.log("result: ",devtools.jsonmerge(arryobj)); //result:  { a: 1, b: 2, c: 3, d: 4 }
console.log("result: ",devtools.jsonmerge({obj1:'hi'},{obj2:' hello'})); //result:  { obj1: 'hi', obj2: ' hello' }
```
### getNetmaskDetails function
```js
var devnet = require('devnet-js');
const devtools = devnet.tools
let netmask_sample = '255.255.0.0'
console.log(devtools.c(netmask_sample));
/*
result:
{ '0': [ '255', '255', '0', '0' ],s
  raw: '11111111.11111111.00000000.00000000',
  arry: [ 255, 255, 0, 0 ],                     // array format
  i: 2,                                         // array index [i] octet
  nm: '255.255.0.0',                            // netmask
  h: '1111111111111111',                        // host count in binary
  u: 65535,                                     // upper host IP count
  ii: 8,                                        // octet host size
  nn: 16 }                                      // nn format
*/
netmask_sample = '/25'                          // string or integer
console.log(devtools.getNetmaskDetails(netmask_sample));
/*
result:
{ '0': [ '255', '255', '255', '128' ],
  raw: '11111111.11111111.11111111.10000000',   
  arry: [ 255, 255, 255, 128 ],                 // array format
  i: 3,                                         // array index [i] octet
  nm: '255.255.255.128',                        // netmask
  h: '1111111',                                 // host count in binary
  u: 127,                                       // upper host IP count
  ii: 7,                                        // octet host size
  nn: 25 }                                      // nn format
  */
  netmask_sample = 13                           // string or integer
  console.log(devtools.getNetmaskDetails(netmask_sample));
/*
result:
{ '0': [ '255', '248', '0', '0' ],
  raw: '11111111.11111000.00000000.00000000',
  arry: [ 255, 248, 0, 0 ],
  i: 1,
  nm: '255.248.0.0',
  h: '1111111111111111111',
  u: 524287,
  ii: 3,
  nn: 13 }
  */

```
### getSubnetInfo function
```js
const devtools = devnet.tools
let subnet_sample = '192.168.1.0/24'
console.log(devtools.getSubnetInfo(subnet_sample));
/*
result:
{ nm: '255.255.255.0',                  //netmask
  ip: '192.168.1.0',                    //input
  maxh: 255,                            //maximum host
  i: 3,                                 // array index [i] octet
  nn: 24,                               //nn format
  arry: [ 255, 255, 255, 0 ],           //netmask array format
  lrange: 0,                            //octet lower IP
  urange: 255 }                         //octet upper IP
*/
subnet_sample = '192.168.1.77/30'
console.log(devtools.getSubnetInfo(subnet_sample));     //(IP/nn) format    
/*
result:
{ nm: '255.255.255.252',                //netmask
  ip: '192.168.1.77',                   //input
  maxh: 3,                              //maximum host
  i: 3,                                 // array index [i] octet
  nn: 30,                               //nn format
  arry: [ 255, 255, 255, 252 ],         //netmask array format
  lrange: 76,                           //octet lower IP
  urange: 79 }                          //octet upper IP
  */
  subnet_sample = '192.168.1.77/255.255.255.240'        //(IP/netmask) format    
  console.log(devtools.getSubnetInfo(subnet_sample));   
  /*
  result:
  { nm: '255.255.255.240',
  ip: '192.168.1.77',
  maxh: 15,
  i: 3,
  nn: 28,
  arry: [ 255, 255, 255, 240 ],
  lrange: 64,
  urange: 79 }
    */
  subnet_sample = '192.168.1.77' 
  console.log(devtools.getSubnetInfo(subnet_sample,'21'));      //(subnet_IP, netmask in nn format)
  /*
  { nm: '255.255.248.0',
  ip: '192.168.1.77',
  maxh: 2047,
  i: 2,
  nn: 21,
  arry: [ 255, 255, 248, 0 ],
  lrange: 0,
  urange: 7 }
  */
  subnet_sample = '4.2.2.2' 
  console.log(devtools.getSubnetInfo(subnet_sample));      //(IP host set to default netmask to /32)
  /*
 { nm: '255.255.255.255',
  ip: '4.2.2.2',
  maxh: NaN,
  i: 3,
  nn: 32,
  arry: [ 255, 255, 255, 255 ],
  lrange: NaN,
  urange: NaN }
  */
```