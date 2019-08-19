//Code for free, use at you own risk!
//by: louie.laquio@gmail.com
//created: July 2019
//lastmod: August 2019
//version: 1.0
const SSH2C = require('ssh2').Client;
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
    isIdle(charcheck){

      if(this.sshconn.active){
        charcheck = charcheck ||'\n\n';
        return new Promise(res=>{
          var hoststrtmp="";
          var ctr = 0;
          var tmp = "";
          var flg=true;
            this.streamSendkeys(charcheck,{autoenter:false,emit:true}).on('data',(ds)=>{
              if(String(ds).length>3 && flg){
                if(hoststrtmp==String(ds).trim()){
                  if(String(charcheck).length>2){
                    if(ctr==String(charcheck).length){
                      flg = false;
                      res(hoststrtmp);
                    }
                  }else{ res(hoststrtmp); }
                }else{ hoststrtmp = String(ds).trim(); }
                ctr++;
                if(ctr>String(charcheck).length+1){
                  flg = false;
                  res(false);
                }
              }else if(charcheck.charCodeAt(0)==32){
                tmp+=String(ds);
                if(charcheck.length==tmp.length){
                  if(charcheck==tmp){res(true);}
                  else{res(false);}
                }
              }
            });//-this.streamSendkeys
        });
      }else{ return false; }
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
      if (!options.psobj){options.psobj = {}};
      options.psobj.resume = options.psobj.resume || true;
      options.psobj.setEncoding = options.psobj.setEncoding || 'utf-8';
      options.psobj.setRawMode = options.psobj.setRawMode || true;
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
                }
              });
            }else{
              varthis.streamSendkeys(input,{autoenter:false});
            }
          }else{
            if(input.charCodeAt(0)==10||input.charCodeAt(0)==13){
              if(cbflg){
                new Promise((res1)=>{
                  res1(cb(tmpinput));
                }).then((res2)=>{
                  if(res2!==false){
                    varthis.streamSendkeys(tmpinput,{autoenter:true});
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
    this.ciscotemplate = require('./src/ciscotemplate');
  }
  parseVersion(option){
    var _datav = {
      input:"show version\n",
      output:" "
    }
    _datav.classobj = this;
    if(typeof option=='undefined'){
      option = {
        hide:true,
        nextmarkerflg:true
      }
    }
    if (typeof option.fileref === "undefined"){ this.localtemplate = this.ciscotemplate }
    else if({}.toString.call( option.fileref)==='[object Object]'){this.localtemplate = option.fileref}
    else{ this.localtemplate = require(option.fileref); }
    return fnver(_datav,option,this.localtemplate.getversion);
  }
}//-CiscoRouterdev class
//Cisco Switch Device Class Template Definition
class CiscoSWdev extends Devnetclass{ //under construction.
  constructor(_model){
    if(_model){
      super(_model);
      if (_model.id) { this.id = _model.id; }
    }
    this.ciscotemplate = require('./src/ciscotemplate');
  }
  parseMAC(option){
    var _datav = {
      input:["show arp\n","show mac\n"],
      output:[' ',' ']
    }
    if(typeof option=='undefined'){ option = { nextmarkerflg:true } }
    _datav.classobj = this;
    return new Promise(res=>{
      fngetdata(_datav).then(_res=>{
        console.log(raw2arry(_res[0]));
        console.log(raw2arry(_res[1],{filter:'-'}));
        res(true);
      });
    });
  }
  parseVersion(option){
    var _datav = {
      input:"show version\n",
      output:" "
    }
    _datav.classobj = this;
    if(typeof option=='undefined'){
      option = {
        hide:true,
        nextmarkerflg:true
      }
    }
    if (typeof option.fileref === "undefined"){ this.localtemplate = this.ciscotemplate }
    else if({}.toString.call( option.fileref)==='[object Object]'){this.localtemplate = option.fileref}
    else{ this.localtemplate = require(option.fileref); }
    return fnver(_datav,option,this.localtemplate.getversion);
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
function fnver(_datav,option,val){
  return new Promise(res0=>{
    if (typeof option.json === "undefined"){option.json = true}
    if (typeof option.nextmarkerflg === "undefined"){option.nextmarkerflg = true}
      fngetdata(_datav,option).then(res=>{
        return new Promise(res2=>{ res2(extractstr(res,val)); });
      }).then(res3=>{
        if(option.json==true){
          var tmpv = arry2json(res3);
          _datav.classobj.sshconn.log = {version:tmpv,date:Date.now()}
          res0(tmpv);
        }else{
          _datav.classobj.sshconn.log = {version:res3,date:Date.now()}
          res0(res3);
        }
      });
  });
}
async function fngetdata2(datastr,option,morecb){
    var inptlen =  datastr.input.length;
    var objtmp = {};
    if(!{}.toString.call(datastr.output)=== '[object Array]'){ res('Output variable must be an array of values.')}
    else if(inptlen   !== datastr.output.length){ res('Input and output variables must be in the same length.') }
    else {
      var tempvar = [];
      for(i =0;i<inptlen;i++){
        await new Promise(next=> {
          objtmp={
            input:datastr.input[i],
            output:datastr.output[i],
            classobj:datastr.classobj
          }
          fngetdata(objtmp,option).then(result=>{
            tempvar.push(result);
            next();
          });
        })
      }
      return tempvar;
    }
}
function fngetdata(datastr,option,morecb){
  return new Promise(res=>{
    if (typeof datastr === undefined) {res(false)}
    var classobj = datastr.classobj || false;
    if (!classobj){res(false)}
    if (!datastr.input || !datastr.output){ res(false) }
    if (typeof option === "undefined"){ option = {uppercase:false} }
    if (typeof option.uppercase === "undefined"){option.uppercase = false}
    var dumptmp = [];
    var dumptmp2 = [];
    var morecbflg = {}.toString.call(morecb)==='[object Function]';
    if ({}.toString.call(datastr.input)=== '[object Array]'){ res(fngetdata2(datastr,option,morecb)); }
    else{
      if (typeof option.nextmarker === "undefined"){option.nextmarker = '--More--'}
      if (typeof option.hide === "undefined"){option.hide = true}
      if (typeof option.nextmarkerflg === "undefined"){option.nextmarkerflg = false}
      if (typeof option.nextmarkercomm === "undefined"){option.nextmarkercomm = ' '}
      var tmpstr = "";
      var endflg=true;
      classobj.sshconn.busy = true;
      classobj.isIdle().then(hostind=>{
          if(hostind!==false){
          classobj.streamSendkeys(datastr.input,{autoenter:false,emit:true}).on('data',(ds)=>{
            tmpstr = String(ds).trim();
            if(tmpstr.length>2){
                dumptmp.push(ds);
                if(!option.hide){process.stdout.write(ds);}
                if(tmpstr.indexOf(option.nextmarker)!==-1 && option.nextmarkerflg){
                  endflg=false;
                  dumptmp2.push(tmpstr);
                  if(morecbflg){ morecb(ds); }
                  classobj.streamSendkeys(option.nextmarkercomm,{autoenter:false,emit:false});
                }else if(tmpstr.indexOf(datastr.output)!==-1){
                  endflg=false;
                  if(option.nextmarkerflg==true){
                    dumptmp2.push(tmpstr);
                    if(tmpstr.indexOf(hostind)!==-1){ classobj.streamSendkeys(option.nextmarkercomm+'\n',{autoenter:false,emit:false}); }
                  }else{
                    if(option.dump==true){ res({data:ds,dumpdata:dumptmp}) }
                    else{ res(ds); }
                  }
                }else if(option.uppercase==true){
                  if(tmpstr.toUpperCase().indexOf(datastr.output.toUpperCase())!==-1){
                    endflg=false;
                    if(option.nextmarkerflg==true){
                      dumptmp2.push(tmpstr);
                      if(tmpstr.indexOf(hostind)!==-1){ classobj.streamSendkeys(option.nextmarkercomm+'\n',{autoenter:false,emit:false}); }
                    }else{
                      if(option.dump==true){
                        res({data:ds,dumpdata:dumptmp})
                      }else{ res(ds); }
                    }
                  }
                }else if(tmpstr.indexOf(hostind)!==-1 && endflg==false){
                  endflg=true;
                  classobj.isIdle().then(teststr=>{
                    classobj.sshconn.busy = false;
                    if(hostind==teststr){
                      if(option.dump==true){
                        classobj.sshconn.prevlog = {data:dumptmp2,dumpdata:dumptmp,date:Date.now()};
                        res({data:dumptmp2,dumpdata:dumptmp})
                      }else{
                        classobj.sshconn.prevlog = {data:dumptmp2,date:Date.now()};
                        res(dumptmp2);
                      }
                    }else{
                      classobj.sshconn.prevlog = {data:false,date:Date.now()};
                      res(false);
                    }
                  });
                }
                if(morecbflg){ morecb(ds); }
            }
          });//-classobj.streamSendkeys
        }
      });//-classobj.isIdle().then(hostind
    }
  });//-Promise
}//-fngetdata
function raw2arry(val,option){
  var valtype = {}.toString.call(val);
  if(typeof option==='undefined'){option = {clean:true}}
  else if(typeof option.clean==='undefined'){option.clean=true}
  if(valtype === '[object Array]'){
    var tmp = [];
    for (elem of val){ if(elem.trim()!==""){ tmp.push(raw2arry(elem,option)) } }
    return tmp;
  }else if(valtype === '[object String]'){
    if(val.indexOf('\n')!==-1){
      if(option.clean){
        var tmp4 = [];
        for(elem3 of raw2arry(spltdt(val),option)){ if(String(elem3).trim().length>1){tmp4.push(elem3)}}
        return tmp4;
      }else{return raw2arry(spltdt(val),option);}
    }
    else{
      var tmp2 = val.replace(/(\t)/g, " ").replace(/(   )/g, "").replace(/(  )/g, " ").replace(/(  )/g, " ");
      if(typeof option.filter=='string'){tmp2 = tmp2.replace(new RegExp(option.filter, "g"), "");}
      if(option.clean){
        var tmp3 = [];
        for(elem2 of tmp2.split(' ')) { if(elem2.length>=1){ tmp3.push(elem2)} }
        return tmp3;
      }else{ return tmp2.split(' '); }
    }
  }
}
function spltdt(strdata,dchar){
  if(typeof dchar ==='undefined'){dchar='\r\n';}
  var tmparry = "";
  try {
    strdata = String(strdata).replace(/[\x00-\x08]/g, "");
    var arry2 = [];
    if(strdata.trim().indexOf(dchar)!==-1){
      tmparry = strdata.split(dchar);
    }else if(strdata.trim().indexOf('\n')!==-1){
      tmparry = strdata.replace(/(\r)/gm, "").split("\n");
    }else{
      arry2.push(strdata);
      return arry2;
    }
    for (val of tmparry) { if (String(val).trim().length>2){ arry2.push(String(val).trim()); } }
    return arry2;
  } catch (e) { return null; }
}
function extractstr(refarry,objstr){
  var output=[];
  var arry1 = [];
  if ({}.toString.call(refarry) === '[object Array]'){
    var tmpstr;
    for (tmpstr of refarry){ arry1 = arry1.concat(spltdt(tmpstr)); }
  }else{ arry1=spltdt(refarry); }
  var strflg = {}.toString.call(objstr) === '[object Array]';
  var elem;
  for (elem of arry1){
    if(strflg){
      var elem2;
      var suboutput = [];
      for(elem2 of objstr){
        var str = '":"' + elem.replace(/"/gm, '`')  + '"}';
        if({}.toString.call(elem2) === '[object String]'){
          if(elem.indexOf(elem2)!==-1){
            if(elem2.indexOf(' ')!==-1){ str = '{"' + elem2.replace(/(   )/g, "").replace(/(  )/g, "").replace(/( )/g, "_") + str; }else { str = '{"' + elem2 + str; }
            suboutput.push(JSON.parse(str));
          }
        }else if({}.toString.call(elem2) === '[object Array]'){
          var bflg = true;
          for(elem3 of elem2){
            if(elem.indexOf(elem3)==-1){
              bflg = false;
              break;
            }
          }
          if(bflg){
            var keystr =  elem2[0];
            if (elem2[1]){ keystr+= ' '+elem2[1]}
            if(keystr.indexOf(' ')!==-1){ str = '{"' + keystr.replace(/(   )/g, "").replace(/(  )/g, "").replace(/( )/g, "_") + str; }else { str = '{"' + keystr + str; }
            suboutput.push(JSON.parse(str));
          }
        }
      }
      if(suboutput.length>0){ output.push(suboutput); }
    }else{ output.push(elem); }
  }
  return output;
}
function keyvalfn(key,val){
  var valtype = {}.toString.call(val);
  if ( valtype === '[object String]'){return JSON.parse('{"' + key.replace(/(   )/g, "").replace(/(  )/g, "").replace(/( )/g, "_") + '":"' + val.replace(/"/gm, '`')  + '"}');}
  else{
    var keytmp =  key.replace(/(   )/g, "").replace(/(  )/g, "").replace(/( )/g, "_");
    var tmp = JSON.parse('{"' + keytmp + '":0"}');
    tmp[keytmp] = val;
    return tmp;
  }
}
function arry2json(obj,id){
  if ({}.toString.call(obj) !== '[object Array]') {return obj};
  var ctr=0;
  var result={};
  for (elem1 of obj){
    ctr++;
    if ({}.toString.call(elem1) === '[object Array]') {
      if(id){
        var objt1 = arry2json(elem1, id+'_'+ctr );
        Object.keys(objt1).forEach(key => {
          if(result.hasOwnProperty(key)){
            result[key+'_'+ctr] = objt1[key]
          }else{
            result[key] = objt1[key]
          }
        });
      }else{
        var objt2 = arry2json(elem1,ctr);
        Object.keys(objt2).forEach(key => {
          if(result.hasOwnProperty(key)){
            result[key+'_'+ctr] = objt2[key]
          }else{
            result[key] = objt2[key]
          }
        });
      }
    }else if({}.toString.call(elem1) === '[object Object]'){
      Object.keys(elem1).forEach(key => {
        if(result.hasOwnProperty(key)){
          result[key+id] = elem1[key]
        }else { result[key] = elem1[key] }
      });
    }
    else{
      if(id){ result[id] = elem1; }
      else{ result['_'] = elem1; }
    }
  }
  return result;
}
module.exports = {CiscoRouter:CiscoRouterdev,CiscoSwitch:CiscoSWdev,Mikrotik:Mikrotikdev,HpSwitch:HpSWdev,ArubaIAP:ArubaIAPdev,Talari:Talaridev,Defaultclass:Defaultclass,tools:{str2Arry:spltdt,extractstr:extractstr,keyval:keyvalfn,arry2json:arry2json,raw2arry:raw2arry}};
