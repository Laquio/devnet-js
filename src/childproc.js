//Code for free written by:louielaquio May 13, 2022.
const Devnet1c = require('../index').Defaultclass;
const { Writable } = require('stream');
let devtmp = new Devnet1c({id:'0'});
let sshobj = undefined;
let sshStream = undefined;
let activeFlg = false;
let loopFN = undefined;
let idleTimerFN = undefined;
let loopDly = undefined;
let chunkdly = 5000;
let chunkflg = false;
let tempData = '';
let logtimer = false;
let loopflg = true;
function sleepFN(msec) { return new Promise((res) => { setTimeout(res, msec); }); }
const outStreamtmp = new Writable({
    write(chunk, enc, callback) {
        process.send({ chunkD: chunk.toString() });
        if(chunkflg===false){
            chunkflg = true;
            setTimeout(() => { chunkflg = false; },chunkdly);
            if(loopflg===true){ loopOff(); }
            clearTimeout(idleTimerFN);
            idleTimer();
        }
        tempData = tempData + chunk.toString();
        callback();
    }
});
process.on('message', (msg) => {
    if(msg.loginparam){
        sshobj = devtmp.openSshShell(msg.loginparam).on('ready',()=>{
            process.send({ status: 'ready' });
            activeFlg = true;
            sshobj.shell((err,stream)=>{
                if (err) {process.send({ error: err });}
                if(stream){
                    stream.setEncoding('utf-8');
                    sshStream = stream;
                    loopDly = msg.loginparam.loopDelay || 30000;
                    sshStream.write(' \n');
                    process.send({ status: 'running' });
                    startOutStream();
                }
            });
        });
        return true;
    }
     if(activeFlg === true){
        if(msg.cmd ){
            loopOff();
            sshStream.write(msg.cmd);
        }else if(msg.tempData===true || msg.tempData===false){
            process.send({ tempData: tempData });
            if(msg.tempData){ tempData = ''; }
        }else if(msg.isIdle) {
            if(msg.isIdle===true){ devtmp.isIdle().then((val)=>{ process.send({ isIdle: val }); }); }
            else{devtmp.isIdle(msg.isIdle).then((val)=>{ process.send({ isIdle: val }); });}
        }
        else if(msg.loopflag===true || msg.loopflag===false){
            loopflg = msg.loopflag;
            process.send({ status: 'event loopflag changed to '+loopflg });
            if(msg.loopflag===false){
                loopOff();
                process.send({ status: 'Keepalive loop stopped.' });
            }else{
                loopOn();
                process.send({ status: 'Keepalive loop started.' });
            }
        }else if(msg.loopDelay){
            loopDly = msg.loopDelay;
            process.send({ status: 'loopDelay changed to: '+loopDly });
        }
        else if(msg.logtimer===true || msg.logtimer===false){
            logtimer = msg.logtimer;
            process.send({ status: 'logtimer changed to: '+logtimer });
        }
        else if(msg.chunkdly>2000 && msg.chunkdly<10000){
            chunkdly = msg.chunkdly;
            process.send({ status: 'chunkdly changed to: '+chunkdly });
        }
        else if(msg.chunkflg){ process.send({ chunkflg: chunkflg }); }
        else if(msg.stopOutStream) {
            sshStream.unpipe(outStreamtmp);
            process.send({ status: 'OutStream stopped' });
        }
        else if(msg.startOutStream) {
            startOutStream();
            process.send({ status: 'OutStream started' });
        }else if(msg.end === true){
            process.send({ status: 'Ending command sent'});
            sshobj.end();
            sshobj = undefined;
            sshStream = undefined;
        }else if(msg.init === true){
            devtmp = undefined;
            devtmp = new Devnet1c({id:'0'});
            sshobj = undefined;
            sshStream = undefined;
            activeFlg = false;
            loopFN = undefined;
            idleTimerFN = undefined;
            loopDly = undefined;
            chunkdly = 5000;
            chunkflg = false;
            tempData = '';
            logtimer = false;
            loopflg = true;
            process.send({ status: 'Done resetting values'});
        }
        else{process.send({ status: 'ignore command',error:'invalid command',cmd:msg });}
    }else{ process.send({ status: 'Sub proccess not yet ready',error:'not accepted',cmd:msg }); }
    
});
function idleTimer(){
    idleTimerFN = setTimeout( async () => {
        if(activeFlg){
            await loopOff();
            await sleepFN(200);
            await loopOn();
        }
    }, loopDly + 1500);
}
function startOutStream(){ if(activeFlg === true){ sshStream.pipe(outStreamtmp); } }
function loopOn(){
    if(activeFlg === true){
        if(loopFN===undefined){
            loopFN = setInterval(() => {
                if(loopflg===false){ loopOff();}
                else {
                  sshStream.write('\n');
                  if(logtimer===true){process.send({ status: 'Keepalive sent' });}
                }
            }, loopDly);
        }
        else{
            loopOff();
            loopFN = setInterval(() => {
                if(loopflg===false){ loopOff();}
                else {
                  sshStream.write('\n');
                  if(logtimer===true){process.send({ status: 'Keepalive sent' });}
                }
            }, loopDly);
        }
    }
    return activeFlg;
}
function loopOff(){
    clearInterval(loopFN);
    loopFN = undefined;
}
