# Description

devnet-js modules written in JavaScript for [node.js](http://nodejs.org/).

devnet-js simplifies network device interaction using JavaScript functions and templates.

devnet-js is using [ssh2](https://www.npmjs.com/package/ssh2) package to establish SSH connectivity.

# Table of Contents

* [Requirements](#requirements)
* [Installation](#installation)
* [SSH Examples](#ssh-examples)
  * [Sample SSH Stream](#sample-ssh-stream)
  * [Execute `show` Commands in a Cisco Device](#execute-show-in-a-cisco-dev)
  * [Interactive SSH](#interactive-ssh)
  * [Interactive cli console](#stream-cli)
* [Functions Examples](#functions-examples)
  * [Cisco Router](#cisco-router)
      * [Parse Version](#parse-version)
      * [Parse Arp Entry](#parse-arp-entry)
      * [Parse Running Interface](#parse-running-interface)
  * [Cisco Switch](#cisco-switch)
      * [Parse MAC Address](#parse-mac-address)
      * [Parse Vlan](#parse-vlan)
  * [HP Switch](#hp-switch)
      * [Parse poe](#parse-poe)

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

###Execute show commands in a Cisco Device

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
      password: '<pwd>'
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

##Functions Examples

```js
```

##cisco-router
```js
```
###parse version

Returns the summary information of cli show version commands.
option{
  fileref:'path or json', // default is in dir 'src', filename 'ciscotemplate.js' for Cisco devices if not specified.  
  json:true,  //[true || false ] default is true, formats the output json for array format.
  nextmarker:'--More--', // [ word string ] default is '--More--', string indicator in a session emulator/terminal
  nextmarkerflg:true, // [true || false ] default is true, continue marker enable flag in a session emulator/terminal e.g. '--More--' in Cisco CLI
  hide:true   // [true || false ] default is true, hides background console logging
}
sampledev1.parseVersion(option) //return a promise

Example:
```js
var devnet = require('devnet-js');
let sampledev1 = new devnet.CiscoRouter({id:"any string here"});
var loginparam = {
    credential:{  //see ssh2 documentation for other option
      host: '<hostname or IP>',
      port: 22,
      username: '<your-username-here>',
      password: '<pwd>'
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
      json:true,        //Select between Array or JSON
      fileref:__dirname+'/ciscotemplate-cust' //Absolute path
    }
    sampledev1.parseVersion(option).then(res=>{     //example function
      console.log("output:\n",res);
    });
  }
});

```

###parse-arp-entry

```js
```

###parse-running-interface

```js
```

##cisco-switch

```js
```

###parse-mac-address

```js
```

###parse-vlan

```js
```

##hp-switch

```js
```

###parse-poe

```js
```

##Devnet-js default class option and parameter details

###Default class Constructor

###openSshShell function

###streamSendkeys function

###execute function

###streamcli function

###end function
