//Code for free, use at you own risk!
//by: louie.laquio@gmail.com
//created: July 2019
//lastmod: August 2019
//version: 1.0
const SSH2C = require('ssh2').Client;
var ciscotemplate = require('./src/ciscotemplate');
class Devnetclass {
  constructor(data){
    this.hostname = data.hostname;
    this.devID = data.devID;
    this.comment = data.comment;
    this.config = data.config;
    if (data.error === undefined || data.error){ this.error = []}
    else{ this.error = data.error }
    this.hardware = data.hardware;
    this.log = data.log;
    this.status = data.status;
    this.system = data.system;
    this.sshconn = {active:false};
    this.t1 = data.t1 || 150;
    this.t2 = data.t2 || 5;
    this.bsBuff = data.bsBuff || Buffer.from([8]);
  }
    streamcli(options,cb){
      if(this.sshconn.active!==true || !this.sshconn.stream){ return false;}
      const bsconst = this.bsBuff;
      const psobj = process.stdin;
      var varthis = this;
      var tmpinput  = '';
      var bufftmp;
      var sctr=0;
      var cbflg = {}.toString.call(cb) === '[object Function]';
      options = options || {psobj:{}};
      options.psobj.resume = options.psobj.resume || true;
      options.psobj.setEncoding = options.psobj.setEncoding || 'utf-8';
      options.psobj.setRawMode = options.psobj.setRawMode || true;
    //  options.exitstring = options.exitstring
      psobj.setRawMode(options.psobj.setRawMode);
      psobj.setEncoding(options.psobj.setEncoding);
      if(options.psobj.stoptoken){
        if ({}.toString.call(options.psobj.stoptoken)==="[object Number]"){ options.psobj.stoptoken = Buffer.from([options.psobj.stoptoken]); }
        else if ({}.toString.call(options.psobj.stoptoken)==="[object String]"){ options.psobj.stoptoken = Buffer.from([options.psobj.stoptoken.charCodeAt(0)]); }
      }
      options.psobj.stoptoken = options.psobj.stoptoken || Buffer.from([27]);
      options.psobj.stopctr = options.psobj.stopctr || 2;
      if(options.hide!==true){
        varthis.sshconn.stream.on('data', function(data) {
          process.stdout.write(data);
        });
        varthis.sshconn.stream.on('close', function(data) {
          process.stdout.write("\n")
          process.exit();
        });
      }
      if(options.psobj.resume){psobj.resume();}
      psobj.on("data",function(input){
        bufftmp = Buffer.from(input,options.psobj.setEncoding);
        if(Buffer.compare(options.psobj.stoptoken,bufftmp) == 0){
          sctr++;
          if(sctr>=options.psobj.stopctr){
            process.stdout.write("\n");
            process.exit();
          }
        }else{sctr=0;}
        if(options.raw==true && cbflg){ cb(input); }
        else{
          if(options.live==true || options.realtime==true){
            if(cbflg){
              new Promise((res1)=>{
                res1(cb(input));
              }).then((res2)=>{
                if(res2!==false){
                  varthis.streamSendkeys(input,{autoenter:false});
                }else if(options.revertComm==true){
                  if(res2===true){res2 = tmpinput.length}
                  for (i = 0;i<res2 && i<70;i++){
                    varthis.sshconn.stream.write(bsconst);
                  }
                }
              });
            }else{
              varthis.streamSendkeys(tmpinput,{autoenter:false});
            }
          }else{
            if(input.charCodeAt(0)==10||input.charCodeAt(0)==13){
              if(cbflg){
                new Promise((res1)=>{
                  res1(cb(tmpinput));
                }).then((res2)=>{
                  if(res2!==false){
                    varthis.streamSendkeys(tmpinput,{autoenter:true});
                  }else if(options.revertComm==true){
                    if(res2==true){res2 = tmpinput.length}
                    for (i = 0;i<res2 && i<70;i++){
//                      process.stdout.write(bsconst);
                      varthis.sshconn.stream.write(bsconst);
                    }
                  }
                });
              }else{
                if(tmpinput.length==1){ varthis.streamSendkeys(tmpinput,{autoenter:false}); }
                else{ varthis.streamSendkeys(tmpinput,{autoenter:true}); }
                tmpinput="";
              }
            }else{
              process.stdout.write(input);
              if(input=='\b'){ process.stdout.write(' '+input); }
              tmpinput+=input;
            }
          }
        }
      });
    }
    end(){
      try {
        if(this.sshconn.stream) { this.sshconn.stream.end(); }
        this.sshconn.end();
        this.sshconn.active = false;
        return true;
      } catch (e) {
        this.error.push(e);
        return false;
      }
    }
    streamSendkeys(value,option){
      try {
        if(this.sshconn.active!==true || !this.sshconn.stream){ return false;}
      } catch (e) { return false; }
      if(!option){
        option = {};
        if(typeof this.sshconn.simplify == undefined){ option.autoenter = true; }
        else {option.autoenter = this.sshconn.simplify};
      }
      if(option.autoenter!==false){
        this.sshconn.stream.write(value+"\n");
      }else { this.sshconn.stream.write(value); }
      if (option.emit){ return this.sshconn.stream; }
      else{return true;}
    }
    execute(params,sshcb,datacb){
      if ( typeof params == undefined || !params ){ return(false); }
      if(!params.endActiveStream || this.sshconn.active==true ){ return "There is an active ssh stream for this session. Set endActiveStream = true, instead."; }
      if(!params.command){ return(false); }
      if (!params.credential && !this.sshconn.credential) { return(false); }
      else if (this.sshconn.credential) { params.credential = this.sshconn.credential; }
      else { return(false); }
      if(!typeof this.sshconn == undefined || !typeof this.sshconn.stream == undefined){
        this.sshconn.stream.end();
        this.sshconn.end();
        this.sshconn.active = false;
      }
      var sessparam = {
        credential:params.credential,
        shell:false
      }
      if (params.setEncoding !=="" && params.setEncoding !== null){sessparam.setEncoding = params.setEncoding || 'utf-8'}
      var objerr = this.error ||[];
      var tmpdata = [];
      var t1 = this.t1;
      var t2 = this.t2;
      var vtest = {}.toString.call(datacb) === '[object Function]';
      this.openSshShell(sessparam,function(resconn){
          resconn.exec(params.command, function(err, stream) {
            if (err) {
              objerr.push(err);
              throw err;
            }
            if(sessparam.setEncoding){stream.setEncoding(sessparam.setEncoding);}
            stream.on('close', function(code, signal) {
              setTimeout(function(){
                resconn.end();
                if({}.toString.call(sshcb) === '[object Function]'){sshcb(tmpdata);}
              },t1);
            });
            stream.on('data', function(data) {
              tmpdata.push(data);
              if (vtest){
                setTimeout(function(){datacb(data);},t2);
              }
            }).stderr.on('data', function(data) {
              objerr.push(data);
              throw 'Error';
            });
          });//-resconn.exec
    });//-this.openSshShell
    }//-execute
    openSshShell(sesParams,sshcb){
    if (this.sshconn.active){
      this.error.push("This Device (" + this.sshconn.credential.host + ") has an active session!");
      return this.error[0];
    }else{
      var objerr = this.error;
      var objconn = this.sshconn;
      (new Promise((res)=>{ checkCred(sesParams.credential,function(cb){ res(cb); }); })).then((_res) => {
          return new Promise((res)=>{
            if (!_res){ res(false); } else {
              try {
                objconn = new SSH2C();
                objconn.on('ready',function(){
                  if(sesParams.shell==false){
                    res(true);
                  }else{
                    objconn.shell(function(err, stream) {
                      if (err) throw err;
                      objconn.stream = stream;
                      res(true);
                    });
                  }
                }).connect(sesParams.credential);
              } catch (e) {
                objerr.push(e);
                res(false);
              }
            }
          });
      }).then((result) => {
        const sshcbflg = {}.toString.call(sshcb) === '[object Function]';
        this.error = objerr;
        if (result) {
          this.sshconn = objconn;
          this.sshconn.credential = sesParams.credential;
          this.sshconn.active = true;
          if(sesParams.shell==false && sshcbflg ){sshcb(objconn);}
          else if (sshcbflg){ sshcb(objconn.stream); }
        }else {
          this.sshconn.active = false;
          if(sshcbflg){ sshcb(false); }
        }
      });
    }
  }//-openSshShell
}//-Devnetclass
class Defaultclass extends Devnetclass{
  constructor(_model){
    if(_model){
      super(_model);
      if (_model.id) { this.id = _model.id; }
    }
  }
}
//Cisco Router Device Class Template Definition
class CiscoRouterdev extends Devnetclass{ //under construction.
  constructor(_model){
    if(_model){
      super(_model);
      if (_model.id) { this.id = _model.id; }
    }
  }
}//-CiscoRouterdev class

//Cisco Switch Device Class Template Definition
class CiscoSWdev extends Devnetclass{ //under construction.
  constructor(_model){
    if(_model){
      super(_model);
      if (_model.id) { this.id = _model.id; }
    }
  }
}//-CiscoSWdev class

//HP Switch Device Class Template Definition
class HpSWdev extends Devnetclass{
  constructor(_model){
    if(_model){
      super(_model);
      if (_model.id) { this.id = _model.id; }
    }
  }
}

//Aruba Device Class Template Definition
class ArubaIAPdev extends Devnetclass{
  constructor(_model){
    if(_model){
      super(_model);
      if (_model.id) { this.id = _model.id; }
    }
  }
}

//Talari Device Class Template Definition
class Talaridev extends Devnetclass{
  constructor(_model){
    if(_model){
      super(_model);
      if (_model.id) { this.id = _model.id; }
    }
  }
}

//Mikrotik Device Class Template Definition
class Mikrotikdev extends Devnetclass{
  constructor(_model){
    if(_model){
      super(_model);
      if (_model.id) { this.id = _model.id; }
    }
  }
}

function checkCred(_cred,cb){
  if ( typeof _cred == 'undefined' || !_cred ){ cb(false); }
  else if(_cred.username){
    if(_cred.password){
      checkpasswd(function(cbpwd){
        cb(cbpwd);
      });
    }else{ cb(false); }
  }else { cb(false); }
  function checkpasswd(cb){
    var password = _cred.password.trim();
    if(!password=="" && password.length >=5){
      cb(true);
    }else{cb(false);}
  }
}
module.exports = {CiscoRouter:CiscoRouterdev,CiscoSwitch:CiscoSWdev,Mikrotik:Mikrotikdev,HpSwitch:HpSWdev,ArubaIAP:ArubaIAPdev,Talari:Talaridev,Defaultclass:Defaultclass};
