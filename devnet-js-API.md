---
title: Devnet-JS Readme
layout: template
filename: README.md
---
# Description

The APIClass.ChildProcAPI is a Javascript class API that handles SSH session in the background or it is using node.exe forked child process handling the ssh session.

The ChildProcAPI can be access with specific set of functions. details soon still in progress

*this is still under development, feel free to try demo code below.

# Table of Contents

* [Requirements](#requirements)
* [Installation](#installation)
* [Child API SSH Examples](#ssh-examples)
  * [Sample SSH via Child](#sample-ssh-via-child)
  * [Sample using Multiple Child Processes](#sample-using-multiple-child-processes)
  * [Sample using Readable Stream](#sample-using-readable-stream)
  * [Sample using Writable Stream](#sample-using-writable-stream)
* [REST and Socket API SSH Examples](#NA)
  * [REST API example](#rest-api)

## Requirements

* [node.js](http://nodejs.org/) -- v5.2.0 or newer
  * node v12.0.0 or newer for Ed25519 key support

## Installation

    npm i devnet-js
    or
    npm install devnet-js --save

## SSH Examples

### Sample SSH via Child

```js
var devnet = require('devnet-js');
let sampleApiHandler1 = new devnet.APIClass.ChildProcAPI({id:"any string here"}); //using ChildProcAPI Event Emitter Class as example

console.log('sampleApiHandler1.forkArryCtr ',sampleApiHandler1.forkArryCtr)
console.log('sampleApiHandler1.forkArryCtr.length ',sampleApiHandler1.forkArry.length)
console.log('\n----------------------------------------------------------------------\n')
let  loginparam = {
  credential:{  //see ssh2 documentation for other option
    host: 'IP or Host here',
    port: 22,
    username: '',
    password: '',
    algorithms: {
      cipher: [ '3des-cbc',"aes256-ctr","aes192-ctr","aes128-ctr"],
      kex: [ "diffie-hellman-group1-sha1","diffie-hellman-group14-sha1" ]
      //, hmac :['hmac-sha2-256','hmac-sha2-512']
    }
  }
}
sampleApiHandler1.on('event-log',(valOutput)=>{   //event emitter "event-log" -> from sampleApiHandler1
  console.log('from sampleApiHandler1 event-log: ',valOutput);
});
sampleApiHandler1.on('child-msg',(val)=>{   //event emitter "child-msg" -> capture output event from child process.
  console.log('from child  child-msg ',val); //from child  child-msg  [ 0, { chunkD: '\r\n<>' } ]
});
sampleApiHandler1.login(loginparam); //login via SSH this will create forkArry[0] '0' as default start, ssh running in a node.exe forked child process
console.log('\n----------------------------------------------------------------------\n');
setTimeout(() => {
  console.log('sampleApiHandler1.forkArryCtr ',sampleApiHandler1.forkArryCtr)     //forkArryCtr is the counter for the number of forked child processes starts at index 0
  console.log('sampleApiHandler1.forkArry.length',sampleApiHandler1.forkArry.length) //forkArry is the Array variable container of the forked child processes
  console.log('sampleApiHandler1.forkArry[0].pid',sampleApiHandler1.forkArry[0].pid) //sample getting the child process ID of the forkArry[] with index of 0
  console.log('\n----------------------------------------------------------------------\n')
  //  sampleApiHandler1.writeCmd({logtimer:true});    //.writeCmd({logtimer:true},0) sending command "{logtimer:true}" to the child process //sampleApiHandler1.writeCmd(Object,Number) -> Object in JSON which contains the command, Number is the target forkArry[] index (0 is the defaults)
  //  sampleApiHandler1.writeCmd({loopflag:false}); // loopflag:false turns off the keep alive loop.
  sampleApiHandler1.writeCmd({loopDelay:10000});   //default is 30seconds. keepalive will write '/n' in the ssh session to keep the session alive.
}, 4000);   //some delay, change keepalive loopDelay after 4 seconds.

setTimeout(() => {
  console.log('\n----------------------------------------------------------------------dir\n')
  sampleApiHandler1.writeCmd({cmd:'dir\n'},);    // or sampleApiHandler1.writeCmd({cmd:'dir\n'},0) default forArryIndx is 0.
}, 7000); //write command 'dir' char(10) to child

setTimeout(() => {
  console.log('\n----------------------------------------------------------------------tempData and clear tempData. \n')
  sampleApiHandler1.writeCmd({tempData:true}); // output at child-msg [ indx# , output];
}, 15000);

```

### Sample using Multiple Child Processes

```js
var devnet = require('devnet-js');
let sampleApiHandler1 = new devnet.APIClass.ChildProcAPI({id:"any string here",multiple:true}); //using ChildProcAPI Event Emitter Class as example with Multiple child processes

console.log('sampleApiHandler1.forkArryCtr ',sampleApiHandler1.forkArryCtr)
console.log('sampleApiHandler1.forkArryCtr.length ',sampleApiHandler1.forkArry.length)
console.log('\n----------------------------------------------------------------------\n')

let  loginparam = {
  credential:{  //see ssh2 documentation for other option
    host: 'device 1 host or IP',
    port: 22,
    username: '',
    password: '',
    algorithms: {
      cipher: [ '3des-cbc',"aes256-ctr","aes192-ctr","aes128-ctr"],
      kex: [ "diffie-hellman-group1-sha1","diffie-hellman-group14-sha1" ]
      //, hmac :['hmac-sha2-256','hmac-sha2-512']
    }
  }
}
sampleApiHandler1.on('event-log',(valOutput)=>{   //event emitter "event-log" -> from sampleApiHandler1
  console.log('from sampleApiHandler1 event-log: ',valOutput);
});

 //* if using multiple "ChildProcAPI({multiple:true})" login param should have unique eventname for the output.
sampleApiHandler1.login(loginparam,'custom-eventname1'); //login via SSH this will create forkArry[0] '0' as default start, ssh running in a node.exe forked child process
console.log('\n----------------------------------------------------------------------\n');

sampleApiHandler1.on('custom-eventname1',(val)=>{   //event emitter "child-msg" -> capture output event from child process.
  console.log('from child  custom-eventname1 ',val); //from child
});

setTimeout(() => {
  console.log('\n----------------------------------------------------------------------dir\n')
  sampleApiHandler1.writeCmd({cmd:'dir\n'},0);    // or sampleApiHandler1.writeCmd({cmd:'dir\n'},0) writes to first device
}, 7000);

let  loginparam2 = {
  credential:{  //see ssh2 documentation for other option
    host: 'device 2 host or IP',
    port: 22,
    username: '',
    password: '',
    algorithms: {
      cipher: [ '3des-cbc',"aes256-ctr","aes192-ctr","aes128-ctr"],
      kex: [ "diffie-hellman-group1-sha1","diffie-hellman-group14-sha1" ]
      , hmac :['hmac-sha2-256','hmac-sha2-512']
    }
  }
}
  //* if using multiple "ChildProcAPI({multiple:true})" login param should have unique eventname for the output.
sampleApiHandler1.login(loginparam2,'custom-eventname2'); //login via SSH this will create forkArry[0] '0' as default start, ssh running in a node.exe forked child process
console.log('\n----------------------------------------------------------------------\n');

sampleApiHandler1.on('custom-eventname2',(val)=>{   //event emitter "child-msg" -> capture output event from child process.
  console.log('from child  custom-eventname2 ',val); //from child
});

console.log('\n----------------------------------------------------------------------\n');
setTimeout(() => {
  console.log('sampleApiHandler1.forkArryCtr ',sampleApiHandler1.forkArryCtr)     //forkArryCtr is the counter for the number of forked child processes starts at index 0
  console.log('sampleApiHandler1.forkArry.length',sampleApiHandler1.forkArry.length) //forkArry is the Array variable container of the forked child processes
  console.log('sampleApiHandler1.forkArry[1].pid',sampleApiHandler1.forkArry[1].pid) //sample getting the child process ID of the forkArry[1]
  console.log('\n----------------------------------------------------------------------\n');
}, 4000);   //some delay 4seconds


setTimeout(() => {
  console.log('\n----------------------------------------------------------------------dir\n')
  sampleApiHandler1.writeCmd({cmd:'dir\n'},1);    // or sampleApiHandler1.writeCmd({cmd:'dir\n'},1). writes to 2nd device
}, 7000);
```

### Sample using Readable Stream

```js
const devnet = require('devnet-js');
let sampleApiHandler1 = new devnet.APIClass.ChildProcAPI({id:"any string here",multiple:true}); //using ChildProcAPI Event Emitter Class as example with Multiple child processes
let  loginparam = {
  credential:{  //see ssh2 documentation for other option
    host: '',
    port: 22,
    username: '',
    password: '',
    algorithms: {
      cipher: [ '3des-cbc',"aes256-ctr","aes192-ctr","aes128-ctr"],
      kex: [ "diffie-hellman-group1-sha1","diffie-hellman-group14-sha1" ]
      //, hmac :['hmac-sha2-256','hmac-sha2-512']
    }
  }
}
sampleApiHandler1.on('event-log',(valOutput)=>{   //event emitter "event-log" -> from sampleApiHandler1
  console.log('from sampleApiHandler1 event-log: ',valOutput);
});

sampleApiHandler1.login(loginparam,'custom-eventname1'); //login via SSH this will create forkArry[0] '0' as default start, ssh running in a node.exe forked child process
console.log('\n----------------------------------------------------------------------\n');

sampleApiHandler1.createInStreamArry(0,true);    //creating a Readable stream -> an option to access the child output via Readable stream, createInStreamArry(Array_index,boolean), boolean true means merge the child ssh output to Transform ioStream varialbe
sampleApiHandler1.ioStream.pipe(process.stdout); //sampleApiHandler1.ioStream the ioStream is a Transform stream variable container -> streaming the child output values using ".pipe" .

//sampleApiHandler1.createInStreamArry(0);    //creating a Readable stream -> an option to access the child output via Readable stream, createInStreamArry(Array_index,boolean), createInStreamArry(Array_index,false) or createInStreamArry(Array_index)  default boolean false means will not merge the child ssh output to Transform ioStream varialbe
//sampleApiHandler1.inStreamArry[0].pipe(process.stdout);  //accessing the Readable stream variable inStreamArry[Array_index] or inStreamArry[0] pipe the values to  process.stdout.

setTimeout(() => {
  console.log('\n----------------------------------------------------------------------dir\n')
  sampleApiHandler1.writeCmd({cmd:'dir\n'},0);    // or sampleApiHandler1.writeCmd({cmd:'dir\n'},0) writes to first device
}, 7000);
setTimeout(() => {
  console.log('\n----------------------------------------------------------------------dir\n')
  sampleApiHandler1.writeCmd({cmd:'dir\n'},0);    // or sampleApiHandler1.writeCmd({cmd:'dir\n'},0) writes to first device
}, 10000);
  

/*
setTimeout(()=>{
  sampleApiHandler1.unMergeInStreamArry(0);  // unMerge or unpipe  with ioStream variable
},20000);

setTimeout(() => {
  console.log('\n----------------------------------------------------------------------dir\n')
  sampleApiHandler1.writeCmd({cmd:'dir\n'},0);    // or sampleApiHandler1.writeCmd({cmd:'dir\n'},0) writes to first device
}, 23000);
*/
```

### Sample using Writable Stream

```js
const devnet = require('devnet-js');
const { Readable } = require('stream');   // for testing purposes
let sampleApiHandler1 = new devnet.APIClass.ChildProcAPI({id:"any string here",multiple:true}); //using ChildProcAPI Event Emitter Class as example with Multiple child processes
let  loginparam = {
  credential:{  //see ssh2 documentation for other option
    host: 'sample host router or switch',
    port: 22,
    username: '',
    password: '',
    algorithms: {
      cipher: [ '3des-cbc',"aes256-ctr","aes192-ctr","aes128-ctr"],
      kex: [ "diffie-hellman-group1-sha1","diffie-hellman-group14-sha1" ]
      //, hmac :['hmac-sha2-256','hmac-sha2-512']
    }
  }
}
sampleApiHandler1.on('event-log',(valOutput)=>{   //event emitter "event-log" -> from sampleApiHandler1
  console.log('from sampleApiHandler1 event-log: ',valOutput);
});

sampleApiHandler1.login(loginparam,'child-eventname1'); //login via SSH this will create forkArry[0] '0' as default start, ssh running in a node.exe forked child process
console.log('\n----------------------------------------------------------------------\n');

sampleApiHandler1.on('child-eventname1',(val)=>{   //event emitter name "child-eventname1" -> capture output event from child process.
  console.log('from child-eventname1 ',val); //from child  child-eventname1s
});

let testres = sampleApiHandler1.createWritableStreamArry(0);  //create or enable the Writable stream for forkArry[indx], or forkArry[0] index = 0 will create sampleApiHandler1.writeStreamArry[0];
console.log('****  testres ',testres);
let readableStream1 = new Readable({ read() {} });            // create a readable stream for testing
readableStream1.pipe(sampleApiHandler1.writeStreamArry[0]);   // pipe the readable stream variable 'readableStream1' to the writable variable sampleApiHandler1.writeStreamArry[0] -> the writeStreamArry[0] was created from createWritableStreamArry function.

setTimeout(() => {
  console.log('\n-------------------------------dir using .writeCmd\n')
  sampleApiHandler1.writeCmd({cmd:'dir\n'},0);    // or sampleApiHandler1.writeCmd({cmd:'dir\n'},0)
}, 7000);

setTimeout(() => {
  console.log('\n-------------------------------dir using Writable stream \n')
  readableStream1.push('dir\n'); // generate data in readable stream readableStream1 using .push()
  // test2();        //un comment function test2 for more testing
}, 10000);

function test2(){
  let  loginparam2 = {
    credential:{  //see ssh2 documentation for other option
      host: 'sample host router or switch',
      port: 22,
      username: '',
      password: '',
      algorithms: {
        cipher: [ '3des-cbc',"aes256-ctr","aes192-ctr","aes128-ctr"],
        kex: [ "diffie-hellman-group1-sha1","diffie-hellman-group14-sha1" ]
        , hmac :['hmac-sha2-256','hmac-sha2-512']
      }
    }
  }
  sampleApiHandler1.login(loginparam2,'custom-eventname2'); //login via SSH this will create forkArry[0] '0' as default start, ssh running in a node.exe forked child process
  console.log('\n----------------------------------------------------------------------\n');
  sampleApiHandler1.on('custom-eventname2',(val)=>{   //event emitter "child-msg" -> capture output event from child process.
    console.log('from child  custom-eventname2 ',val); //from child
  });
  sampleApiHandler1.createWritableStreamArry(1);
  let readableStream2 = new Readable({ read() {} });            // create a readable stream for testing
  readableStream2.pipe(sampleApiHandler1.writeStreamArry[1]);   // pipe the readable stream variable 'readableStream2' to the writable variable sampleApiHandler1.writeStreamArry[1]
  setInterval(() => {
    console.log('\n---------------dir using Writable stream \n')
    readableStream2.push('\n\n'); // generate data in readable stream readableStream1 using .push()
    readableStream1.push('\n\n'); // generate data in readable stream readableStream1 using .push()
  }, 10000);
}

```
