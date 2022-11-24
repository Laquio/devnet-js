//Code for free written by:louielaquio May 14, 2022.
const EventEmitter = require('events');
const { Writable, Transform , Readable} = require('stream');
class ChildProcAPIdev extends EventEmitter {
  constructor(_model){
    if(_model){
      super(_model);
      this.ctrv = 0;
      this.forkArry = [];
      this.forkArryCtr = 0;
      this.multiple = false;
      this.inStreamArry = [];
      this.writeStreamArry = [];
      this.jobFlag =false
      this.jobObject = {}
      this.cliVar={};
      if (_model.id) { this.id = _model.id; }
      if (_model.multiple) { this.multiple = _model.multiple || false }
      if (_model.childprocfilePath) { this.childprocfilePath = _model.childprocfilePath }
      else{this.childprocfilePath = __dirname +'\\childproc.js';}
    }
    this.ioStream = new Transform ({
      transform(chunk, encoding, callback) {
        this.push(chunk.toString());
        callback();
      }
    });
  }
  extendCliVar(childIndx,eventName,cliBufferMax){
    if(cliBufferMax==undefined){cliBufferMax =5 }
    this.forkArry[childIndx].send({tempData:true});
    this.cliVar[childIndx]['cliBufferMax'] = cliBufferMax;
    this.cliVar[childIndx]['cliBuffer'] = [];
    this.cliVar[childIndx]['sendConfirm'] = false;
    this.cliVar[childIndx]['chunkflg'] = undefined;
    this.forkArry[childIndx].removeListener('message',this.cliVar[childIndx]['eventObj']);
    if(this.cliVar[childIndx]['loopCheckFN']){ clearInterval(this.cliVar[childIndx]['loopCheckFN']);}
    this.cliVar[childIndx]['eventObj'] = undefined;
    this.cliVar[childIndx]['loopCheckFN'] = setInterval(()=>{
      if(this.cliVar[childIndx]['lastCmd']){
        this.forkArry[childIndx].send({chunkflg:true});
        if(this.cliVar[childIndx]['sendConfirm'] === false){ this.forkArry[childIndx].send({tempData:false}); }
        else if(this.cliVar[childIndx]['sendConfirm'] === true ){
          if(this.cliVar[childIndx]['chunkflg'] === false){
            this.emit(eventName+'-confirm',this.cliVar[childIndx]['lastCmd'].cmd);
            if(this.cliVar[childIndx]['cliBuffer'].length>=this.cliVar[childIndx]['cliBufferMax']){ this.cliVar[childIndx]['cliBuffer'].pop(); }
            this.forkArry[childIndx].send({tempData:true});
            this.cliVar[childIndx]['sendConfirm']=undefined;
          }
        }
      }
    },600);
    this.cliVar[childIndx]['eventObj'] = (msg) => {
      if(msg.tempData){
        if(this.cliVar[childIndx]['lastOutput']!= msg.tempData){
          this.emit(eventName,msg.tempData);
          this.cliVar[childIndx]['cliBuffer'].unshift(msg.tempData);
          this.cliVar[childIndx]['lastOutput'] = msg.tempData;
        }
        this.cliVar[childIndx]['sendConfirm'] = String(msg.tempData).indexOf(String(this.cliVar[childIndx]['lastCmd'].cmd).trim())!=-1
      }else if(msg.chunkflg!=undefined){this.cliVar[childIndx]['chunkflg'] = msg.chunkflg }
      else if(msg.status){this.emit(eventName,msg);}
    }
    this.forkArry[childIndx].on('message',this.cliVar[childIndx]['eventObj']);
  }
  end(childIndx){
    return new Promise(resv=>{
      if(childIndx===undefined){
        if(this.forkArry[0]==undefined){ childIndx = this.forkArryCtr; }
        else{childIndx = 0;}
      }
      try {
        if(this.forkArry[childIndx]!=undefined){
          if(this.cliVar[childIndx]['loopCheckFN']){
            this.forkArry[childIndx].removeListener('message',this.cliVar[childIndx]['eventObj']);
            clearInterval(this.cliVar[childIndx]['loopCheckFN']);
          }
          let oldPID = this.forkArry[childIndx].pid
          this.emit('event-log',Date.now() + ' ending forkArry index = ' + childIndx +', processID: '+oldPID);
          this.forkArry[childIndx].kill();
          this.forkArry.splice(childIndx, 1);
          this.emit('event-log',Date.now() + ' ended forkArry index = ' + childIndx +', old processID: '+oldPID);
          this.forkArryCtr--;
          resv(true);
        }
      } catch (error) { resv([false,{'error':error}]) }
    });
  }
  job(loginparam,hostList,cmd,numberWorker){
    if(!numberWorker){numberWorker = 1}
    if(this.multiple == false){ throw 'Please set the class param multiple = true'}
    if(hostList && cmd){
      this.jobFlag = true;
      this.jobObject.startIndx  =  this.forkArryCtr;
      for (let jwCtr = 0; jwCtr<=numberWorker;jwCtr++){
        loginparam.credential.host = hostList[jwCtr];
        this.login(loginparam,'job-'+jwCtr,this.jobObject.startIndx + jwCtr);
      }
    }else{ throw 'job(hostList as String Array,cmd as String Array) are required'}
  }
  login(loginparam,eventName,jIndx){
    return new Promise(async reslv =>{
      const { fork } = require('child_process');
      loginparam.lean=true;
      let tmpCtr = this.forkArryCtr;
      if(this.multiple===true){
        if({}.toString.call(jIndx) === '[object Integer]'){
          this.forkArry[jIndx] = fork(this.childprocfilePath);
          let pid = this.forkArry[jIndx].pid
          this.forkArry[jIndx].send({loginparam:loginparam,pid:pid});
          this.emit('event-log',Date.now() + ' forkArry[' +jIndx+'] created. processID: '+pid);
          this.cliVar[jIndx] = {}
          
          this.cliVar[jIndx]['eventObj'] = (valtemp)=>{
            if({}.toString.call(eventName) === '[object String]'){ this.emit(eventName,valtemp); }
            else if(eventName){ throw(' login(  ,EventName) must be string!'); }
            else{ this.emit('child-msg',valtemp);}
          }
          this.forkArry[jIndx].on('message',this.cliVar[jIndx]['eventObj']);
          reslv(tmpCtr);
        }else{
          this.forkArry[this.forkArryCtr] = fork(this.childprocfilePath);
          let pid = this.forkArry[this.forkArryCtr].pid
          this.forkArry[this.forkArryCtr].send({loginparam:loginparam,pid:pid});
          this.emit('event-log',Date.now() + ' forkArry[' +tmpCtr+'] created. processID: '+pid);
          this.cliVar[this.forkArryCtr] = {}

          this.cliVar[this.forkArryCtr]['eventObj'] = (valtemp)=>{
            if({}.toString.call(eventName) === '[object String]'){ this.emit(eventName,valtemp); }
            else if(eventName){ throw(' login(  ,EventName) must be string!'); }
            else{ this.emit('child-msg',valtemp);}
          }
          this.forkArry[this.forkArryCtr].on('message',this.cliVar[this.forkArryCtr]['eventObj']);
          this.forkArryCtr ++;
          reslv(tmpCtr);
        }
      }
      else{
        this.forkArry[0] = fork(this.childprocfilePath);
        let pid = this.forkArry[this.forkArryCtr].pid
        this.forkArry[0].send({loginparam:loginparam,pid:this.forkArry[0].pid});
        this.emit('event-log',Date.now() + ' forkArry[0] created. processID: '+pid);
        this.cliVar[0] = {}
        this.cliVar[0]['eventObj'] = (valtemp)=>{
          if({}.toString.call(eventName) === '[object String]'){ this.emit(eventName,valtemp); }
          else if(eventName){ throw(' login(  ,EventName) must be string!'); }
          else{ this.emit('child-msg',valtemp);}
        }
        this.forkArry[0].on('message',this.cliVar[0]['eventObj']);
        reslv(0);
      }
    });
  }
  writeCmd(cmdObj,forkArryIndx){
    if (forkArryIndx==undefined){forkArryIndx = 0};
    if(this.forkArry[forkArryIndx]){
      if(cmdObj.cmd){
        this.cliVar[forkArryIndx]['lastCmd'] = cmdObj;
        this.cliVar[forkArryIndx]['sendConfirm'] = false;
      } 
      this.forkArry[forkArryIndx].send(cmdObj);
    }
  }
  createWritableStreamArry(indx){
    if (indx==undefined){indx = 0};
    if(this.forkArry[indx]){
      let tmpforkArry = this.forkArry[indx];
      this.writeStreamArry[indx] = new Writable({
        write(chunkD, enc, callback) {
          tmpforkArry.send({cmd:chunkD.toString()});
          callback();
        }
      });
      this.emit('event-log',Date.now() + ' writeStreamArry[' +indx+'] created.');
      return true;
    }else{
      this.emit('event-log',Date.now() + ' forkArry[' +indx+'] none existent.');
      return false;
    }
  }
  createInStreamArry(indx,merge){
    if (indx==undefined){indx = 0}; 
    if(this.forkArry[indx]){
      this.inStreamArry[indx] = new Readable({ read() {} });
      this.forkArry[indx].on('message', (msg) => { if(msg.chunkD){ this.inStreamArry[indx].push(msg.chunkD); } });
      this.emit('event-log',Date.now() + ' InStreamArry[' +indx+'] created.');
      if(merge===true){
        this.emit('event-log',Date.now() + ' ioStream connected with indx: ' + indx);
        this.inStreamArry[indx].pipe(this.ioStream);
      }
      return true;
    }else{
      this.emit('event-log',Date.now() + ' forkArry[' +indx+'] none existent.');
      return false;
    }
  }
  unMergeInStreamArry(indx){ if(this.inStreamArry[indx]){this.inStreamArry[indx].unpipe(this.ioStream);} }
  MergeInStreamArry(indx){
    if(this.forkArry[indx]){
      if(this.inStreamArry[indx]){
        this.inStreamArry[indx].pipe(this.ioStream);
        this.emit('event-log',Date.now() + ' ioStream connected with indx: ' + indx);
        return true;
      }else{
        this.emit('event-log',Date.now() + ' inStreamArr[' +indx+'] none existent.');
        return false;
      }
    }else{
      this.emit('event-log',Date.now() + ' forkArry[' +indx+'] none existent.');
      return false;
    }
  }
}
class httpSocketClassAPI extends ChildProcAPIdev{ //under development
  constructor(_model){
    if(_model){
      super(_model);
      if (_model.id) { this.id = _model.id; }
      if (_model.httpPort) { this.httpPort = _model.httpPort}
      else { this.httpPort = 3000 }
      if (_model.socketPort) { this.socketPort = _model.socketPort }
      else { this.socketPort = 3001 }
      if (_model.pbkdf2Pass) { this.pbkdf2Pass = _model.pbkdf2Pass }
      else{this.pbkdf2Pass = 'secretPass'}
      this.multiple = true;
      this.objDef = {};
      this.httpAPP=undefined;
      this.server = require('http').createServer();
      this.npm_forge = require('node-forge');
      this.rsaDecryptObj = undefined;
      this.rsaEncryptObj = undefined;
      this.cipher = undefined;
      this.decipher = undefined;
      this.cipherAlgo = _model.cipherAlgo || 'AES-CBC';
      this.cipherIv =undefined;
      if(_model.cors){
        this.io = new require('socket.io')(this.server,{cors:_model.cors});
      }else{
        this.io = new require('socket.io')(this.server,{
          cors:{
            origin:" url ",
            allowedHeaders:["my-cust-header"],
            credentials:true
          }
        });
      }
    }
    this.express = require('express');
    this.bodyParser = require('body-parser');
  }
  createChildProc(loginparams,httpParams,socketsParams){
    this.objDef.push({lp:loginparams,hp:httpParams,sp:socketsParams});
    this.login(loginparams);
  }
  loginSSH(loginparams,eventName,toClientEventName,toServerEventName){
    if({}.toString.call(eventName) !== '[object String]'){  throw 'eventName must be a String' }
    let name0 = String(eventName).trim()
    let objIndx = this.login(loginparams,eventName);
    let objDefTmp ={eventName:eventName,toClientEventName:toClientEventName,toServerEventName:toServerEventName};
    if(this.cipher){objDefTmp.cipherFlg = true;}
    this.objDef[objIndx]=objDefTmp;
    console.log('this.objDef ',this.objDef);
    this.io.of('/'+name0).on('connection', async (socket) => {
      socket.join('room1');
      if({}.toString.call(toServerEventName) === '[object String]'){ socket.on(toServerEventName, data => {
        if(this.objDef[objIndx].cipherFlg){
          console.log('  --- objDef[objIndx].cipherFlg ',this.objDef[objIndx]);
        }else{ this.writeCmd({cmd:data},objIndx); }
      }); }
      else{socket.on(name0 + 'toServer', data => {
        if(this.objDef[objIndx].cipherFlg){
          console.log('  --- objDef[objIndx].cipherFlg ',this.objDef[objIndx]);
        }else{ this.writeCmd({cmd:data},objIndx); }
      }); }
    });
    if({}.toString.call(toClientEventName) === '[object String]') { this.on(name0,(val)=>{ this.io.of('/'+name0).emit(toClientEventName, val); }); }
    else{ this.on(name0,(val)=>{
      console.log('toClientEventName ',this.objDef[objIndx]);
      if(this.objDef[objIndx].cipherFlg){
        this.socketEncrypt(val.chunkD).then(resv=>{
          console.log('resv ',resv);
          this.io.of('/'+name0).emit(name0+'toClient', resv.data);
        });
      }else{ this.io.of('/'+name0).emit(name0+'toClient', val); }
    }); 
    }
  }
  updateRoute(params){ if(params && this.httpAPP){ this.httpAPP.use(params.uri, require(params.routerFilePath).router); } }
  httpProto(status){
    if(this.httpAPP===undefined){
      this.httpAPP = this.express();
      this.httpRouter = this.express.Router();
      this.httpAPP.get('/', function (req, res) {
        res.send('Hello World');
      });
      this.httpAPP.listen(this.httpPort)
      console.log('HTTP listening at port ',this.httpPort);
    }
  }
  initRSA(publicPEM,privateKeyPEM){
    return new Promise(result=>{
      let resulttmp = {rsaDecryptObj:false,rsaEncryptObj:false};
      if({}.toString.call(privateKeyPEM) === '[object String]'){
        this.rsaDecryptObj = this.npm_forge.pki.privateKeyFromPem(privateKeyPEM);
        resulttmp.rsaDecryptObj = true;
      }
      if({}.toString.call(publicPEM) === '[object String]'){
        if(publicPEM.indexOf('BEGIN CERTIFICATE')!==-1){ this.rsaEncryptObj = this.npm_forge.pki.certificateFromPem(publicPEM).publicKey;}
        else{ this.rsaEncryptObj = this.npm_forge.pki.publicKeyFromPem(publicPEM); }
        resulttmp.rsaEncryptObj = true;
      }
      setTimeout(()=>{ result (resulttmp); },1000);
    });
  }
  rsaEncrypt(data,schemeAlgo,schemeJsonOption){
      if(this.rsaEncryptObj===undefined){result([undefined,'rsaEncryptObj = undefined'])}
      if(schemeAlgo===undefined){schemeAlgo = 'RSA-OAEP'}
      if(schemeJsonOption===undefined){schemeJsonOption = { md: this.npm_forge.md.sha256.create() }}
      return this.rsaEncryptObj.encrypt(data,schemeAlgo,schemeJsonOption);
  }
  rsaDecrypt(data,schemeAlgo,schemeJsonOption){
      if(this.rsaDecryptObj===undefined){result([undefined,'rsaDecryptObj = undefined'])}
      if(schemeAlgo===undefined){schemeAlgo = 'RSA-OAEP'}
      if(schemeJsonOption===undefined){schemeJsonOption = { md: this.npm_forge.md.sha256.create() }}
      return this.rsaDecryptObj.decrypt(data,schemeAlgo,schemeJsonOption);
  }
  trimRSAKeys(certValue,filterStr){
    function trimRSAKeysFN(inputKeys,filter){
        let keyflg = false;
        let keyvartmp = 'KEY';
        let char10markflg = false;
        let char10markvartmp = '--\n'
        let endmarker = '\n---'
        let flterFlg = true;
        if(filter!==undefined){ flterFlg = (inputKeys.indexOf(filter)!==-1) }
        if(inputKeys.indexOf('BEGIN')!==-1 && inputKeys.indexOf('KEY')!==-1 && inputKeys.indexOf('---')!==-1 && flterFlg){
            let chartmp3 = '';
            let charflg = false;
            let i = 0;
            let keystmp = '';
            for (;i<inputKeys.length;i++){
                if(charflg || inputKeys.toLocaleUpperCase().charCodeAt(i)===keyvartmp.charCodeAt(0) || inputKeys.toLocaleUpperCase().charCodeAt(i)===char10markvartmp.charCodeAt(0)){
                    charflg =true;
                    chartmp3 +=inputKeys.charAt(i);
                    if(keyflg && chartmp3 == char10markvartmp){
                        char10markflg = true  
                    }else if(chartmp3 == keyvartmp){  keyflg = true; }
                }
                if(char10markflg){ break;}
                if(chartmp3.length==keyvartmp.length){
                    chartmp3 = '';
                    charflg = false; 
                }
            }
            if(char10markflg){
                chartmp3 = '';
                charflg = false;
                for (let j = i; j<inputKeys.length;j++){
                    if(charflg || inputKeys.charCodeAt(j)===endmarker.charCodeAt(0)){
                    charflg =true;
                    if(!(chartmp3.length == 1 && chartmp3 == inputKeys.charAt(j))){ chartmp3 +=inputKeys.charAt(j); }  
                    if(chartmp3 == endmarker){ break; }
                    }else { keystmp += inputKeys.charAt(j); }
                    if(chartmp3.length==endmarker.length){
                        keystmp += chartmp3;
                        charflg = false;
                        chartmp3 = '';
                    }
                }            
                if(charflg){
                    if(chartmp3.length<endmarker.length){ return 'invalid format'; }
                    else if(keystmp.length >20){ return String(keystmp).trim(); }
                }
            }
            return null;
        }
        return 'invalid format';
    }
    if(filterStr!==undefined){ return trimRSAKeysFN('BEGIN ' + String(certValue).substring(String(certValue).search(filterStr),certValue.length),filterStr); }
    let restmp = [undefined,undefined];
    if(certValue.indexOf('PRIVATE')!==-1){ restmp[1] = trimRSAKeysFN('BEGIN ' + String(certValue).substring(String(certValue).search('PRIVATE'),certValue.length),'PRIVATE') }
    if(certValue.indexOf('PUBLIC')!==-1){ restmp[0] = trimRSAKeysFN('BEGIN ' + String(certValue).substring(String(certValue).search('PUBLIC'),certValue.length),'PUBLIC') }
    return restmp;
  }
  socketEncrypt(data){
    if(this.cipher){
      console.log('data ',data);
      return new Promise(result=>{
        this.cipher.start({iv:this.cipherIv})
        this.cipher.update(this.npm_forge.util.createBuffer(data));
        this.cipher.finish();
        result(this.cipher.output)
      });
    }else {return false;}
  }
  socketDecrypt(data){
    if(this.cipher){
      return new Promise(result=>{
        this.decipher.start({iv:this.cipherIv})
        this.decipher.update(data);
        this.decipher.finish();
        result(this.decipher.output);
      });
    }else {return false;}
  }
  initCipher(passphrase,keysize,numIterations,cipherAlgo,key,iv){
    if(this.cipher === undefined){
      if (!keysize) { keysize = 24}
      return new Promise(result=>{
        if(iv){this.cipherIv = iv}
        else if(iv===false){this.cipherIv = '0000000000000000'}
        else{this.cipherIv = this.npm_forge.random.getBytesSync(keysize);}
        let objTmp = {iv:this.cipherIv,keysize:keysize}
        if ({}.toString.call(passphrase) == '[object String]'){
          if (!numIterations){numIterations=4}
          objTmp.numIterations = numIterations;
          objTmp.salt = this.npm_forge.random.getBytesSync(64);
          if (String(passphrase).length>3){ objTmp.key = this.npm_forge.pkcs5.pbkdf2(passphrase, objTmp.salt, numIterations, keysize) }
          else { objTmp.key = this.npm_forge.pkcs5.pbkdf2(this.pbkdf2Pass, objTmp.salt, numIterations, keysize)}
        }else if (!key) { objTmp.key = this.npm_forge.random.getBytesSync(keysize)}
        else { objTmp.key = key}
        if(cipherAlgo){
          this.cipher = this.npm_forge.cipher.createCipher(cipherAlgo, objTmp.key);
          this.decipher = this.npm_forge.cipher.createDecipher(cipherAlgo, objTmp.key);
          objTmp.cipherAlgo = cipherAlgo;
        }else{
          this.cipher = this.npm_forge.cipher.createCipher(this.cipherAlgo, objTmp.key);
          this.decipher = this.npm_forge.cipher.createDecipher(this.cipherAlgo, objTmp.key);
          objTmp.cipherAlgo = this.cipherAlgo;
        }
        result(objTmp);
      });
    }else {return false;} 
  }
  socketAuthentication(){
    this.io.use((socket, next) => {
      if (checkRequest(socket.request)) {
        next();
      } else {
        next(new Error("invalid"));
      }
    });
  }
  socketProto(){
    this.io.of('/authenticate').on('connection', async (socket) => {
      console.log('Id ',socket.id);
      console.log('handshake referer',socket.handshake.headers.referer);
      console.log('time ',socket.handshake.time);
      console.log(' _connections ',socket.server.httpServer._connections);
    });
    this.io.on('connection', client => {
      console.log('client ',client.handshake.headers)
      client.on('Authenticate', data => { 
        console.log('Authenticate ',data); });

      client.on('event', data => {
        console.log('data ',data); });
      client.on('disconnect', () => { 
        console.log('Client got disconnected!');
      });
    });

    //---------------------
    this.io.of('/socketSearch').on('connection', async (socket) => {
      console.log('socketSearch Id ',socket.id);
      console.log('handshake referer',socket.handshake.headers.referer);
      console.log('time ',socket.handshake.time);
      console.log('socketSearch connections ',socket.server.httpServer._connections);
      this.ctrv++;
      socket.join('room1');
      //socket.on('serversending', msg => {
      //  io.of('/socketSearch').emit('chat message', msg);
      //});
      socket.on('clientsending',(vmsg)=>{
        console.log('clientsending ++++++++++++++++++ ',vmsg);
      });
      setInterval(()=>{
        console.log('--------------------- socketSearch serversending 1');
        this.io.of('/socketSearch').emit('serversending', 'hi');
      },5000);
      
    });
    this.io.of('/socketSearch').adapter.on('create-room',(room)=>{
      console.log(`socketSearch room ${room} was created.`,'  ---\n');
    })
    this.io.of('/socketSearch').adapter.on('join-room',(room,id)=>{
      console.log(`socketSearch socket ${id} has joined room ${room} .`,'  ---\n');
    })

    this.server.listen(this.socketPort);
    console.log('Socket listening at port ',this.socketPort);
  }
  checkRequest(reqObj){
    console.log('reqObj ',reqObj);
    return true;
  }
}
module.exports = {HttpSocketClassAPI:httpSocketClassAPI,ChildProcAPI:ChildProcAPIdev}
