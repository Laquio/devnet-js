//Code for free written by:louielaquio May 14, 2022.
const EventEmitter = require('events');
const { Writable, Transform , Readable} = require('stream');
class ChildProcAPIdev extends EventEmitter {
  constructor(_model){
    if(_model){
      super(_model);
      this.forkArry = [];
      this.forkArryCtr = 0;
      this.multiple = false;
      this.inStreamArry = [];
      this.writeStreamArry = [];
      if (_model.id) { this.id = _model.id; }
      if (_model.multiple) { this.multiple = _model.multiple || false }
      if (_model.childprocfilePath) { this.childprocfilePath = _model.childprocfilePath }
      else{this.childprocfilePath = __dirname +'\\childproc.js';}
    }else{}
    this.ioStream = new Transform ({
      transform(chunk, encoding, callback) {
        this.push(chunk.toString());
        callback();
      }
    });
  }
  login(loginparam,eventName){
    const { fork } = require('child_process');
    loginparam.lean=true;
    let tmpCtr = this.forkArryCtr;
    
    if(this.multiple===true){
      this.forkArry[this.forkArryCtr] = fork(this.childprocfilePath);
      let pid = this.forkArry[this.forkArryCtr].pid
      this.forkArry[this.forkArryCtr].send({loginparam:loginparam,pid:pid});
      this.emit('event-log',Date.now() + ' forkArry[' +tmpCtr+'] created. processID: '+pid);
      this.forkArry[this.forkArryCtr].on('message',(valtemp)=>{
        if({}.toString.call(eventName) === '[object String]'){
          this.emit(eventName,valtemp);
        }else if(eventName){ throw(' login(  ,EventName) must be string!'); }
        else{ this.emit('child-msg',valtemp);}
      });
      this.forkArryCtr ++;
    }
    else{
      this.forkArry[0] = fork(this.childprocfilePath);
      let pid = this.forkArry[this.forkArryCtr].pid
      this.forkArry[0].send({loginparam:loginparam,pid:this.forkArry[0].pid});
      this.emit('event-log',Date.now() + ' forkArry[0] created. processID: '+pid);
      this.forkArry[0].on('message',(valtemp)=>{
        if({}.toString.call(eventName) === '[object String]'){
          this.emit(eventName,valtemp);
        }else if(eventName){ throw(' login(  ,EventName) must be string!'); }
        else{ this.emit('child-msg',valtemp);}
      });
    }
    return tmpCtr;
  }
  writeCmd(cmdObj,forkArryIndx){
    if (forkArryIndx==undefined){forkArryIndx = 0};
    if(this.forkArry[forkArryIndx]){ this.forkArry[forkArryIndx].send(cmdObj); }
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
    }
    this.objDef = [];
    this.httpAPP=undefined;
    this.server = require('http').createServer();
    this.io = require('socket.io')(this.server);
    this.express = require('express');
    this.bodyParser = require('body-parser');
  }
  createChildProc(loginparams,httpParams,socketsParams){
    objDef.push({lp:loginparams,hp:httpParams,sp:socketsParams});
    this.login(loginparams);
  }
  httpAddRoute(params){ if(params && this.httpAPP){ this.httpAPP.use(params.uri, require(params.routerFilePath).router); } }
  httpOn(){
    if(this.httpAPP==undefined){
      this.httpAPP = this.express();
      this.httpRouter = this.express.Router();
      this.httpAPP.get('/', function (req, res) {
        res.send('Hello World');
      });
      this.httpAPP.listen(this.httpPort)
      console.log('listening at port ',this.httpPort);
    }
  }
  socketON(){
    this.io.on('connection', client => {
      client.on('event', data => { /* … */ });
      client.on('disconnect', () => { /* … */ });
    });
    this.server.listen(3001);
  }
}
module.exports = {HttpSocketClassAPI:httpSocketClassAPI,ChildProcAPI:ChildProcAPIdev}
