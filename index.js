//Code for free, use at you own risk!
//by: louie.laquio@gmail.com
//created: July 2019
//lastmod: August 2019
//version: 1.0
var SSH2C = require('ssh2').Client;
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
  }
    execute(params,sshcb,datacb){
      if ( typeof params == undefined || !params ){ return(false); }
      if(!params.endActiveStream || this.sshconn.active==true ){ return "There is an active ssh stream for this session. Set endActiveStream = true, instead."; }
      if(!params.command || !params.credential){ return(false);}
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
      var defsshconn = this.sshconn
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
                setTimeout(function(){
                    datacb(data);
                },t2);
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
        if (result) {
          this.sshconn = objconn;
          this.sshconn.credential = sesParams.credential;
          this.sshconn.active = true;
          if(sesParams.shell==false){sshcb(objconn);}
          else{sshcb(objconn.stream);}
        }else {
          this.sshconn.active = false;
          sshcb(false);
        }
      });
    }
  }//-openSshShell
}//-Devnetclass
//Cisco Router Device Class Template Definition
class CiscoRouterdev extends Devnetclass{ //under construction.
  constructor(_model){
    if(_model){
      super(_model);
      if (_model.id) { this.id = _model.id; }
    }
  }
}//-CiscoRouterdev class

//HP Switch Device Class Template Definition
class HpSWdev extends Devnetclass{

}

//Aruba Device Class Template Definition
class ArubaIAPdev extends Devnetclass{

}

//Talari Device Class Template Definition
class Talaridev extends Devnetclass{

}
function checkCred(_cred,cb){
  var tmpvar = {}
  if ( typeof _cred == 'undefined' || !_cred ){ cb(false); }
  else if(_cred.username){
    var username = _cred.username.trim();
    if(!username=="" && username.length >=2){ tmpvar.username = username; }
    if(_cred.password){
      checkpasswd(function(cbpwd){
        cb(cbpwd);
      });
    }else{ cb(false); }
  }else { cb(false); }
  function checkpasswd(cb){
    var password = _cred.password.trim();
    if(!password=="" && password.length >=5){
      tmpvar.password = password;
      cb(true);
    }
    cb(false);
  }
}
module.exports = {CiscoRouter:CiscoRouterdev,HpSw:HpSWdev,ArubaIAP:ArubaIAPdev,Talari:Talaridev};
