//Code for free, use at you own risk!
//by: louie.laquio@gmail.com
//created: July 2019
//lastmod: Nov 2020
//version: 2.0
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
  getCommOpt(commx,option){
    if(typeof option=='undefined'){ option = {} }
    if(option.token === undefined || option.token === ''){ option.token = '?' }
    if(this.sshconn.active){
      let varstream =this.sshconn.stream;
      let comm = commx.replace(/(\n)/g,'');
      return new Promise(retval=>{
        new Promise(res=>{
          if(varstream){
            varstream.write('\n');
            setTimeout(()=>{ res(true) },25);
          }else{ res(false); }
        }).then((val2)=>{
          let lflg = true;
          if(!val2){ retval(false); }
          else{
            let strtmp = "";
            let cflg = false;
            let endflg = false;
            function _vstrmfn(ds){
              if(endflg==false){
                strtmp = strtmp + String(ds);
                if(cflg){
                  if(strtmp.indexOf(comm)!==-1 && (strtmp.indexOf('<cr>')!==-1 || strtmp.indexOf(']')!==-1 || strtmp.indexOf('\r\n\r\n')!==-1) ){ 
                    cflg = false;
                    endflg = true;
                    retval(strtmp);
                  }
                }else if(strtmp.indexOf(comm)!==-1){
                  lflg = false;
                  strtmp = "";
                }else{ lflg = false; }
              }else if(varstream !==null){
                  varstream.removeListener('data',_vstrmfn);
                  varstream = null;
              }
            }
            varstream.on('data',_vstrmfn);
            if(commx){
              setTimeout(()=>{
                lflg = true;
                varstream.write(comm);
                setTimeout(()=>{ lflg = false},5000);
                let sIntloop = setInterval(()=>{
                  if(endflg){ clearInterval(sIntloop);}
                  else if(!lflg){
                    clearInterval(sIntloop);
                    if(!cflg){
                      strtmp = "";
                      varstream.write(option.token);
                    }
                    cflg = true;
                  }
                },100);
              },100);
            }else{
              varstream.write(option.token);
              setTimeout(()=>{ retval(strtmp); },450);
            }
          }
        });
      });
    }
  }
  isIdle(charcheck){
    if(this.sshconn.active){
      charcheck = charcheck ||'\n\n';
      return new Promise(res=>{
        let hoststrtmp="";
        let ctr = 1;
        let tmp = "";
        let flg=true;
        let dstmp = "";
        let vthis = this;
        let tmpstream = vthis.streamSendkeys(charcheck,{autoenter:false,emit:true});
        function tmpstreamfn(ds){
          if(flg){
            dstmp = String(ds).trim();
            if(dstmp.length>4 && dstmp.length<100){
              if(hoststrtmp==dstmp){
                flg = false;
                if(String(charcheck).length>2){
                  if(ctr==String(charcheck).length||(ctr+1)==String(charcheck).length){ res(hoststrtmp); }
                }else{ res(hoststrtmp); }
              }else{ hoststrtmp = dstmp; }
              ctr++;
              if(ctr>String(charcheck).length+1){
                flg = false;
                res(false);
              }else if(dstmp.length>=35 && dstmp.indexOf('\n')!==-1){
                flg = false;
                let tmp0 = dstmp.split("\n");
                let retv = tmp0[0].trim();
                if(charcheck.length>2 && retv == tmp0[1].trim()){ res(retv); }
                else{res(false);}
              }
            }else if(charcheck.charCodeAt(0)==32){
              flg = false;
              tmp+=dstmp;
              if(charcheck.length==tmp.length){
                if(charcheck==tmp){res(true);}
                else{res(false);}
              }
            }else if(dstmp.length>120){ vthis.streamSendkeys('\n\n\n',{autoenter:false,emit:false}); }
          }else{ tmpstream.removeListener('data',tmpstreamfn); }
        };//-vthis.streamSendkeys
        tmpstream.on('data',tmpstreamfn);
      });
    }else{ return new Promise(res=>{res(false)});}
  }
    streamcli(options,cb){
      if(this.sshconn.active!==true || !this.sshconn.stream){ return false;}
      const psobj = process.stdin;
      let varthis = this;
      let tmpinput  = '';
      let bufftmp;
      let sctr=0;
      let cbflg = {}.toString.call(cb) === '[object Function]';
      let hideFlg = false;
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
      let tmpStreamLoc = varthis.sshconn.stream;
      function tmpStdWrFn(data) { 
        if(hideFlg){ tmpStreamLoc.removeListener('data',tmpStdWrFns); }
        else{process.stdout.write(data);}}
      if(options.hide!==true){
        hideFlg = true;
        tmpStreamLoc.on('data', tmpStdWrFn);
        tmpStreamLoc.on('close', function(data) {
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
            }else{ varthis.streamSendkeys(input,{autoenter:false}); }
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
      let varthis = this;
      try { if(varthis.sshconn.active!==true || !varthis.sshconn.stream){ return false;} }
      catch (e) { return false; }
      if(!option){
        option = {};
        if(typeof varthis.sshconn.simplify == undefined){ option.autoenter = true; }
        else {option.autoenter = this.sshconn.simplify};
      }
      if(option.autoenter!==false){ varthis.sshconn.stream.write(value+"\n"); }
      else{ varthis.sshconn.stream.write(value); }
      if (option.emit){ return varthis.sshconn.stream; }
      else{ return true; }
    }
    execute(params,sshcb,datacb){
      if ( typeof params == undefined || !params ){ return(false); }
      if(!params.endActiveStream || this.sshconn.active==true ){ return "There is an active ssh stream for this session. Set endActiveStream = true, instead."; }
      if(!params.command){ return(false); }
      if (!params.credential && !this.sshconn.credential) { return(false); }
      else if (this.sshconn.credential) { params.credential = this.sshconn.credential; }
      else if (!params.credential) { return(false); }
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
      let objerr = this.error ||[];
      let tmpdata = [];
      let t1 = this.t1;
      let t2 = this.t2;
      let vtest = {}.toString.call(datacb) === '[object Function]';
      let errx = '';
      new Promise(resv1=>{
        this.openSshShell(sessparam,function(resconn){
          try {
            if (this.sshconn.active==false){throw resconn}
            resconn.exec(params.command,{pty: true}, function(err, stream) { //.exec(params.command, {pty: true} ,function(err, stream)
              if (err) { throw err; }
              if(sessparam.setEncoding){stream.setEncoding(sessparam.setEncoding);}
              stream.on('close', function(code, signal) {
                setTimeout(function(){
                  resconn.end();
                  resv1(true);
                },t1);
              });
              stream.on('data', function(data) {
                tmpdata.push(data);
                if (vtest){ setTimeout(function(){datacb(data);},t2); }
              }).stderr.on('data', function(data) {
                objerr.push(data);
                throw 'Stream Error';
              });
            });//-resconn.exec
          } catch (error) {
            objerr.push(error);
            resv1(false);
          }
        });//-this.openSshShell  
      }).then(resv2=>{
        if({}.toString.call(sshcb) === '[object Function]' && resv2){sshcb(tmpdata);}
        else{ sshcb (["Session encountered error"]); }
      });
    }//-execute
    openSshShell(sesParams,sshcb){
      if (this.sshconn.active){
        this.error.push("This Device (" + this.sshconn.credential.host + ") has an active session!");
        return this.error[0];
      }else{
        let objerr = this.error;
        let objconn = this.sshconn;
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
                      if (err) {
                        objerr.push(err);
                        res(err);
                      }else{
                        objconn.stream = stream;
                        res(true);
                      }
                    });
                  }
                }).on('error',function(err) {
                  objerr.push(err);               
                  res(err);
                }).connect(sesParams.credential);
              } catch (e) {
                objerr.push(e);
                res(e);
              }
            }
          });
        }).then((result) => {
          let sshcbflg = {}.toString.call(sshcb) === '[object Function]';
          this.error = objerr;
          if (result===true) { 
            this.sshconn = objconn;
            this.sshconn.credential = sesParams.credential;
            this.sshconn.active = true;
            if(sesParams.shell==false && sshcbflg ){sshcb(objconn);}
            else if (sshcbflg){ sshcb(objconn.stream); }
          }else {
            this.sshconn.active = false;
            if(sshcbflg){ 
              sshcb(undefined,result); }
          }
        }).catch(e=>{
          sshcb(undefined,e);
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
  listif(option){
    let _datav = {
      input:"show ip int br\n",
      output:' '
    }
    if(typeof option=='undefined'){ option = { nextmarkerflg:true } }
    _datav.classobj = this;
    if(option.include){ if(option.include.length >= 2){_datav.input = _datav.input.replace(/(\n)/g, "") + ' | inc ' +option.include + '\n'} }
    return new Promise(res=>{
      fngetdata(_datav).then(_res=>{
        let tmp=[];
        if(option.json){ for(elem of raw2arry(_res)){if(String(elem[0]).length>=6 && elem[1] !==undefined && elem[2] !==undefined){tmp.push({ int:elem[0],ip:elem[1],ok:elem[2],method:elem[3],status:elem[4],proto:elem[5]});} } }
        else {
          tmp = raw2arry(_res);
        }
        res(tmp);
      });
    });
  }
  parseMAC(option){
    var _datav = {
      input:"show arp\n",
      output:' '
    }
    if(typeof option=='undefined'){ option = { nextmarkerflg:true } }
    _datav.classobj = this;
    if(typeof option.format=='undefined'){ option.format = "xxxx-xxxx-xxxx"}
    if(option.include){ if(option.include.length >= 2){_datav.input = _datav.input.replace(/(\n)/g, "") + ' | inc ' +option.include + '\n'} }
    return new Promise(res=>{
      fngetdata(_datav).then(_res=>{
        var tmp=[];
        for(elem of raw2arry(_res)){if(String(elem[3]).length>=12){tmp.push({ mac:formatMAC(elem[3],option.format),ip:elem[1],int:elem[5],age:elem[2] });} }
        res(tmp);
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
        hide:false,
        nextmarkerflg:true
      }
    }
    if (typeof option.fileref === "undefined"){ this.localtemplate = this.ciscotemplate }
    else if({}.toString.call( option.fileref)==='[object Object]'){this.localtemplate = option.fileref}
    else{ this.localtemplate = require(option.fileref); }
    return fnver(_datav,option,this.localtemplate.getversion);
  }
  getFirmware(option){
    var _datav = {
      input:["show bootvar\n",'show runn | s boot\n'],
      output:[' ',' ']
    }
    _datav.classobj = this;
    if(typeof option=='undefined'){
      option = {
        hide:false,
        nextmarkerflg:true
      }
    }
     return fnver(_datav,option,[['boot','variable'],'BOOTLDR','CONFIG_FILE','flash','system','register']);
  }
  dir(option){
    var _datav = {
      input:"dir\n",
      output:' '
    }
    _datav.classobj = this;
    if(typeof option=='undefined'){
      option = {
        hide:false,
        nextmarkerflg:true
      }
    }
    return fnver(_datav,option,[['lic','_'],'core','universal','rommon','bin','pkg','drwx','bytes total',(new Date()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric'}).replace(/,/g, '').split(' ')]);
  }
  getftp(option){
    var _datav = {
      input:"show runn | i ftp\n",
      output:' '
    }
    _datav.classobj = this;
    if(typeof option=='undefined'){
      option = {
        hide:false,
        nextmarkerflg:true
      }
    }
     return fnver(_datav,option,[['ip','ftp'],'username','password']);
  }
  uploadFirmware(srcHost,srcfileName,option){
    var comm = {
      input:"copy ftp://"+ srcHost + "/"+srcfileName+" flash:\n",
      output:'filename',
      lookforArry:['Destination|filename','?']
    }
    var comm2 = {
      input:srcfileName+"\n",
      output:' ',
      lookforArry:['[OK -','bytes','copied']
    }
    return new Promise( async res1=>{
      let temp = await seqCmds(this,[comm,comm2],option);
      if(temp.status == false && temp.error == false){
        confirmSeq(this,temp.arry,'[OK -').then(res2=>{
          temp.status = true;
          temp.last = [res2,'[confirm]'];
          res1(temp);
        });
      }else{ res1(temp); }
    });
  }
  getUsers(){
    var _datav = {
      input:"show users\n",
      output:' '
    }
    _datav.classobj = this;
    return new Promise(res=>{
      fnver(_datav,{json:true},['vty','con','aux']).then(res1=>{
        let tmp = [];
        for( let prop in res1 ){
          let tmp2 = raw2arry(res1[prop]);
          tmp.push({line:tmp2.slice(0, 3),line_num:tmp2[0].replace('*',''),line_type:tmp2[1],line_index:tmp2[2],user:tmp2[3],host:tmp2[4],idle:tmp2[5],location:tmp2[6]})
        } 
        res(tmp);        
      }).catch(e=>{
        res({error:true,errormsg:e})
      });
    });
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
  listif(option){
    let _datav = {
      input:"show ip int br\n",
      output:' '
    }
    if(typeof option=='undefined'){ option = { nextmarkerflg:true } }
    _datav.classobj = this;
    if(option.include){ if(option.include.length >= 2){_datav.input = _datav.input.replace(/(\n)/g, "") + ' | inc ' +option.include + '\n'} }
    return new Promise(res=>{
      fngetdata(_datav).then(_res=>{
        let tmp=[];
        if(option.json){ for(elem of raw2arry(_res)){if(String(elem[0]).length>=6 && elem[1] !==undefined && elem[2] !==undefined){tmp.push({ int:elem[0],ip:elem[1],ok:elem[2],method:elem[3],status:elem[4],proto:elem[5]});} } }
        else {
          tmp = raw2arry(_res);
        }
        res(tmp);
      });
    });
  }
  parsePOE(option){
    let _datav = {
      input:'show power inline\n',
      output:' '
    }
    _datav.classobj = this;
    if(typeof option.format=='undefined'){ option.format = "xxxx-xxxx-xxxx"}
    if (this.ciscotemplate.JSONparsePOE){
      var outputFormat = this.ciscotemplate.JSONparsePOE || {key:['int','admin','op','power','device','class','max'],indxv:[0,1,2,3,4,5,6]}
    }
    if(option.include){ if(option.include.length >= 2){_datav.input = _datav.input.replace(/(\n)/g, "") + ' | inc ' +option.include + '\n'} }
    return new Promise(res=>{
      fngetdata(_datav,{nextmarkerflg:true}).then(_res=>{
        var tmp=[];
        for(elem of arrym2s(raw2arry(_res,{clean:true,filter:'-'}),1)){ if(String(elem[0]).length>=5 && elem[0].indexOf('/')!==-1 && elem[3]!==undefined && elem[5]!==undefined){tmp.push({ [outputFormat.key[0]]:elem[outputFormat.indxv[0]],[outputFormat.key[1]]:elem[outputFormat.indxv[1]],[outputFormat.key[2]]:elem[outputFormat.indxv[2]],[outputFormat.key[3]]:elem[outputFormat.indxv[3]],[outputFormat.key[4]]:elem[outputFormat.indxv[4]],[outputFormat.key[5]]:elem[outputFormat.indxv[5]],[outputFormat.key[6]]:elem[outputFormat.indxv[6]] });} }
        res(tmp);
      });
    });
  }
  parseMAC(option){
    let _datav = {
      input:["show arp\n","show mac add\n"],
      output:[' ',' ']
    }
    _datav.classobj = this;
    if(typeof option=='undefined'){option = {json:true}}
    if(typeof option.format=='undefined'){ option.format = "xxxx-xxxx-xxxx"}
    return new Promise(res=>{
      fngetdata(_datav,{nextmarkerflg:true}).then(_res=>{
        if(option.json){
          let tmp=[];
          for(elem of arrym2s(raw2arry(_res[0],{clean:true,filter:'-'}),1)){if(String(elem[3]).length>=12){tmp.push({ mac:formatMAC(elem[3],option.format),ip:elem[1],int:elem[5],age:elem[2] });} }
          let tmp2=[];
          for(elem2 of arrym2s(raw2arry(_res[1],{clean:true,filter:'-'}),1)){
            if(String(elem2[1]).length>=14 && elem2[0]!==undefined) { tmp2.push({ mac:formatMAC(elem2[1],option.format),int:elem2[3],vlan:elem2[0],type:elem2[2]});} }
          res({arp:tmp,mac:tmp2});
        }else{res(_res);}
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
        hide:false,
        nextmarkerflg:true
      }
    }
    if (typeof option.fileref === "undefined"){ this.localtemplate = this.ciscotemplate }
    else if({}.toString.call( option.fileref)==='[object String]'){ this.localtemplate = require(option.fileref); }
    else{
      if (option.fileref.getversion){ this.localtemplate = option.fileref }
      else{ this.localtemplate = { getversion:option.fileref } }
    }
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
    this.hpswtemplate = require('./src/hpswtemplate');
  }
  listif(option){
    let _datav = {
      input:['display ip int br\n','display interface brief\n'],
      output:[' ',' ']
    }
    _datav.classobj = this;
    if(typeof option=='undefined'){ option = {}}
    option.isidle = "\n\n\n";
    option.isidle2 = "\n\n\n";
    option.nextmarker='--- More ---';
    option.nextmarkerflg=true;
    option.dump=true;
    option.getrawflag=true;
    if(typeof option.format=='undefined'){ option.format = "xxxx-xxxx-xxxx"}
    if(option.include){ if(option.include.length >= 2){_datav.input = _datav.input.replace(/(\n)/g, "") + ' | inc ' +option.include + '\n'} }
    if (typeof option.fileref === "undefined"){ this.localtemplate = this.hpswtemplate }
    else if({}.toString.call( option.fileref)==='[object String]'){ this.localtemplate = require(option.fileref); }
    else{
      if (option.fileref.getversion){ this.localtemplate = option.fileref }
      else{ this.localtemplate = {getversion:option.fileref} }
    }
   let outputFormat = this.hpswtemplate.dispIPintbr || {key:['int','physical','proto','ip','desc'],indxv:[0,1,2,3,4]} 
    return new Promise(res=>{
      fngetdata(_datav,option).then(_res=>{
        if(option.json==false){ res({ipint:raw2arry(_res[0].dumpdata,{clean:true,filter:'-'}),int:raw2arry(_res[1].dumpdata,{clean:true,filter:'-'})}); }
        else{
          let tmp=[];
          for(elem of raw2arry(_res[0].dumpdata,{clean:true,filter:'-'})){ if(String(elem[0]).length>=5 && elem[0].indexOf('lan')!==-1 && elem[1]!==undefined && elem[3]!==undefined){tmp.push({ [outputFormat.key[0]]:elem[outputFormat.indxv[0]],[outputFormat.key[1]]:elem[outputFormat.indxv[1]],[outputFormat.key[2]]:elem[outputFormat.indxv[2]],[outputFormat.key[3]]:elem[outputFormat.indxv[3]],[outputFormat.key[4]]:elem[outputFormat.indxv[4]] });} }
          outputFormat = this.hpswtemplate.JSONdispBridgeBr || {key:['int','link','speed','duplex','type','pvid','desc'],indxv:[0,1,2,3,4,5,6]}
          for(elem of raw2arry(_res[1].dumpdata,{clean:true,filter:'-'})){
            let tmp2 = String(elem[0]);
            let desc = '';
            desc = elem[6] || '';
            if(elem[7]){ desc = desc + ' ' + elem[7] };
            if(elem[8]){ desc = desc + ' ' + elem[8] };
            if(elem[9]){ desc = desc + ' ' + elem[9] };
            desc = desc.replace(/(")/g, '');
            if(tmp2=='More'){ tmp.push({ [outputFormat.key[0]]:elem[outputFormat.indxv[0]+1],[outputFormat.key[1]]:elem[outputFormat.indxv[1]+1],[outputFormat.key[2]]:elem[outputFormat.indxv[2]+1],[outputFormat.key[3]]:elem[outputFormat.indxv[3]+1],[outputFormat.key[4]+1]:elem[outputFormat.indxv[4]],[outputFormat.key[5]]:elem[outputFormat.indxv[5]+1],[outputFormat.key[6]]:desc });
            }else if(tmp2.length>=5 && elem[3]!==undefined && elem[5]!==undefined){ tmp.push({ [outputFormat.key[0]]:elem[outputFormat.indxv[0]],[outputFormat.key[1]]:elem[outputFormat.indxv[1]],[outputFormat.key[2]]:elem[outputFormat.indxv[2]],[outputFormat.key[3]]:elem[outputFormat.indxv[3]],[outputFormat.key[4]]:elem[outputFormat.indxv[4]],[outputFormat.key[5]]:elem[outputFormat.indxv[5]],[outputFormat.key[6]]:desc }); } 
          }
          res(tmp);
        }
      });
    });
  }//-listif
  parseVersion(option){
    var _datav = {
      input:"disp version\n",
      output:" "
    }
    _datav.classobj = this;
    option = {
      hide:true,
      nextmarkerflg:true,
      isidle : "\n\n\n",
      isidle2 : "\n\n\n",
      dump:true,
      getrawflag:true,
      nextmarkerflg:true,
      nextmarker:'--- More ---',
      fileref:option.fileref
    }
    if (typeof option.fileref === "undefined"){ this.localtemplate = this.hpswtemplate }
    else if({}.toString.call( option.fileref)==='[object String]'){ this.localtemplate = require(option.fileref); }
    else{
      if (option.fileref.getversion){ this.localtemplate = option.fileref }
      else{ this.localtemplate = {getversion:option.fileref} }
    }
    return fnver(_datav,option,this.localtemplate.getversion);
  }
  parseMAC(option){
    var _datav = {
      input:["disp arp\n","disp mac-add\n"],
      output:[' ',' ']
    }
    _datav.classobj = this;
    if(typeof option.format=='undefined'){ option.format = "XXXX-XXXX-XXXX"}
    if(typeof option.json=='undefined'){ option.json = true}
    option.isidle = "\n\n\n";
    option.isidle2 = "\n\n\n";
    option.nextmarker='--- More ---';
    option.nextmarkerflg=true;
    option.dump=true;
    option.getrawflag=true;
    return new Promise(res=>{
      fngetdata(_datav,option).then(_res=>{
        if(option.json==true){
          var tmp=quickipcheck(_res[0].dumpdata);//raw2arry(_res[0].dumpdata);
          let tmp2 = [];
          for (elem3 of tmp){
            if(elem3.c>1){
                var tmp3 = [];
                var cflg = false;
                var elem4;
                var ctx = 0;
                 for(elem4 of elem3.a){
                   if(elem4.indexOf(elem3.b[ctx])!==-1){
                     if(tmp3.length>0){ tmp2.push({a:tmp3,b:elem3.b[ctx],c:-1})}
                     tmp3 = [];
                     cflg = true
                     ctx++;
                   }
                   if(cflg && String(elem4).trim().length>0){ tmp3.push(elem4); }
                 }
                 if(tmp3.length>0){ tmp2.push({a:tmp3,b:elem3.b[ctx],c:-1})}
            }else{
              if(elem3.a.length>6){
                var tmp3 = [];
                var cflg = false;
                var elem4;
                for(elem4 of elem3.a){
                  if(elem4.indexOf(elem3.b[0])!==-1){
                      tmp3.push(elem3.b[0]);
                      tmp3.push(elem4.replace(new RegExp(elem3.b[0], "g"), ""));
                    cflg = true;
                  }else if(cflg){
                    tmp3.push(elem4);
                  }
                }
                tmp2.push({a:tmp3,b:elem3.b,c:elem3.c});
              }else{ tmp2.push(elem3); }
            }
          }
          let tmp4 = [];
          try {
            for(elem of tmp2){
              if(elem.a.length==6){
                tmp4.push({ mac:formatMAC(elem.a[1],option.format),ip:elem.a[0],int:elem.a[3],age:elem.a[4],vid:elem.a[2],type:elem.a[5]});
              }else{
                if(elem.a[6]=='----' && elem.a[7]=='More'){
                  tmp4.push({ mac:formatMAC(elem.a[1],option.format),ip:elem.a[0],int:elem.a[3],age:elem.a[4],vid:elem.a[2],type:elem.a[5]});
                }else{
                  let x = {};
                  x.others=[];
                  for(elem2 of elem.a){
                    if(elem2.indexOf('.')!==-1){ x.ip = elem2; }
                    else if(elem2.indexOf('/')!==-1){ x.int = elem2 }
                    else if(elem2.length>12 && elem2.indexOf('-')!==-1){ x.mac = formatMAC(elem2,option.format); }
                    else{ x.others.push(elem2); }
                  }
                  tmp4.push(x);
                }
              }
            }
          } catch (e) { tmp4 = tmp2; }
          let tmp5 = [];
          for(elem2 of raw2arry(_res[1].dumpdata)){ if(String(elem2[0]).length>=14 && elem2[2]!==undefined) { tmp5.push({ mac:formatMAC(elem2[0],option.format),int:elem2[3],vlan:elem2[1]});} }
          res({arp:tmp4,mac:tmp5});
        }else{ res(_res); }
      });
    });
  } //-parseMAC
  parsePOE(option){
    let _datav = {
      input:'display poe interface\n',
      output:' '
    }
    _datav.classobj = this;
    if(typeof option=='undefined'){ option = {}}
    option.isidle = "\n\n\n";
    option.isidle2 = "\n\n\n";
    option.nextmarker='--- More ---';
    option.nextmarkerflg=true;
    option.dump=true;
    option.getrawflag=true;
    if(typeof option.format=='undefined'){ option.format = "xxxx-xxxx-xxxx"}
    if(option.include){ if(option.include.length >= 2){_datav.input = _datav.input.replace(/(\n)/g, "") + ' | inc ' +option.include + '\n'} }
    if (typeof option.fileref === "undefined"){ this.localtemplate = this.hpswtemplate }
    else if({}.toString.call( option.fileref)==='[object String]'){ this.localtemplate = require(option.fileref); }
    else{
      if (option.fileref.getversion){ this.localtemplate = option.fileref }
      else{ this.localtemplate = {getversion:option.fileref} }
    }
    if (this.hpswtemplate.JSONparsePOE){ var outputFormat = this.hpswtemplate.JSONparsePOE || {key:['int','Poe','Priority','CurPower','Op','class','Status'],indxv:[0,1,2,3,4,5,6]} }
    return new Promise(res=>{
      fngetdata(_datav,option).then(_res=>{
        if(option.json==false){ res(raw2arry(_res.dumpdata,{clean:true,filter:'-'})); }
        else{
          let tmp=[];
          for(elem of raw2arry(_res.dumpdata,{clean:true,filter:'-'})){ if(String(elem[0]).length>=5 && elem[0].indexOf('/')!==-1 && elem[3]!==undefined && elem[5]!==undefined){tmp.push({ [outputFormat.key[0]]:elem[outputFormat.indxv[0]],[outputFormat.key[1]]:elem[outputFormat.indxv[1]],[outputFormat.key[2]]:elem[outputFormat.indxv[2]],[outputFormat.key[3]]:elem[outputFormat.indxv[3]],[outputFormat.key[4]]:elem[outputFormat.indxv[4]],[outputFormat.key[5]]:elem[outputFormat.indxv[5]],[outputFormat.key[6]]:elem[outputFormat.indxv[6]] });} }
          res(tmp);
        }
      });
    });
  }//-parsePOE
  displayBridgeBrief(option){//display interface bridg brief
    let _datav = {
      input:'display interface bridg brief\n',
      output:' '
    }
    _datav.classobj = this;
    if(typeof option=='undefined'){ option = {}}
    option.isidle = "\n\n\n";
    option.isidle2 = "\n\n\n";
    option.nextmarker='--- More ---';
    option.nextmarkerflg=true;
    option.dump=true;
    option.getrawflag=true;
    if(typeof option.format=='undefined'){ option.format = "xxxx-xxxx-xxxx"}
    if(option.include){ if(option.include.length >= 2){_datav.input = _datav.input.replace(/(\n)/g, "") + ' | inc ' +option.include + '\n'} }
    if (typeof option.fileref === "undefined"){ this.localtemplate = this.hpswtemplate }
    else if({}.toString.call( option.fileref)==='[object String]'){ this.localtemplate = require(option.fileref); }
    else{
      if (option.fileref.getversion){ this.localtemplate = option.fileref }
      else{ this.localtemplate = {getversion:option.fileref} }
    }
    if (this.hpswtemplate.JSONdispBridgeBr){ var outputFormat = this.hpswtemplate.JSONdispBridgeBr || {key:['int','link','speed','duplex','type','pvid','desc'],indxv:[0,1,2,3,4,5,6]} }
    return new Promise(res=>{
      fngetdata(_datav,option).then(_res=>{
        if(option.json==false){ res(raw2arry(_res.dumpdata,{clean:true,filter:'-'})); }
        else{
          let tmp=[];
          for(elem of raw2arry(_res.dumpdata,{clean:true,filter:'-'})){ if(String(elem[0]).length>=5 && elem[0].indexOf('AGG')!==-1 && elem[3]!==undefined && elem[5]!==undefined){ tmp.push({ [outputFormat.key[0]]:elem[outputFormat.indxv[0]],[outputFormat.key[1]]:elem[outputFormat.indxv[1]],[outputFormat.key[2]]:elem[outputFormat.indxv[2]],[outputFormat.key[3]]:elem[outputFormat.indxv[3]],[outputFormat.key[4]]:elem[outputFormat.indxv[4]],[outputFormat.key[5]]:elem[outputFormat.indxv[5]],[outputFormat.key[6]]:elem[outputFormat.indxv[6]] }); } }
          res(tmp);
        }
      });
    });
  }//-displayBridgeBrief
 async lldpneighbor(option){
    let _datav = {
      input:'display lldp neighbor-information \n',
      output:' '
    }
    _datav.classobj = this;
    await _datav.classobj.getCommOpt(_datav.input).then((val)=>{
      /*
      for(let chre in _datav.input){
        _datav.classobj.sshconn.stream.write(Buffer.from([8]));
      }
      */
      if(val.indexOf('verbose')!==-1){
        _datav.input = 'display lldp neighbor-information verbose\n'
      }
    });
    await new Promise(fnres=>{    //check device is Idle
      let wintfn = setInterval(()=>{
        _datav.classobj.isIdle('\n').then((rv)=>{
          if(rv && rv.length>7){
            clearInterval(wintfn);
            fnres();
          }
        });
      },500);
    });
    if(typeof option=='undefined'){ option = {}}
    option.isidle = option.isidle || "\n\n\n";
    option.isidle2 = option.isidle2 || "\n\n\n";
    option.nextmarker = option.nextmarker || '--- More ---';
    option.nextmarkerflg = true;
    option.dump = true;
    option.getrawflag = true;
    option.stoptokens = option.stoptokens || false;
    option.startinglines = option.startinglines || ['information of '];
    option.endinglines = option.endinglines || ['information of '];
    if(option.include){ if(option.include.length >= 2){_datav.input = _datav.input.replace(/(\n)/g, "") + ' | inc ' +option.include + '\n'} }
    
    if (typeof option.fileref === "undefined"){ this.localtemplate = this.hpswtemplate }
    else if({}.toString.call( option.fileref)==='[object String]'){ this.localtemplate = require(option.fileref); }
    else{
      if (option.fileref.JSONlldpneighbor){ this.localtemplate = option.fileref }
      else{ this.localtemplate = {JSONlldpneighbor:option.fileref} }
    }
    if(typeof option.refarry == 'undefined' && option.json){ option.refarry = this.hpswtemplate.JSONlldpneighbor }
    //if (this.hpswtemplate.JSONdispBridgeBr){ var outputFormat = this.hpswtemplate.JSONdispBridgeBr || {key:['link','speed','duplex','type','pvid','desc'],indxv:[0,1,2,3,4,5]} }
    
    return new Promise(res=>{
      fngetdata(_datav,option).then(_res=>{
        let rtmp = readtext(_res.dumpdata,option);
        if(option.json){
          let rval = [];
          for(let entry of rtmp){ rval.push(jsonmerge(entry)); }
          res(rval);
        }else{ res(rtmp);}
      });
    });
  }//-lldpneighbor
  async dhcpSnooping(option){
    let _datav = {
      input:'display dhcp',
      output:' '
    }
    _datav.classobj = this;
    await _datav.classobj.getCommOpt(_datav.input).then((val)=>{
      if(val.indexOf('dhcp-snooping')!==-1){ _datav.input = 'display dhcp-snooping\n' }
    })
    await new Promise(fnres=>{    //check device is Idle
      let wintfn = setInterval(()=>{
        _datav.classobj.isIdle('\n').then((rv)=>{
          if(rv && rv.length>7){
            clearInterval(wintfn);
            fnres();
          }
        });
      },500);
    });
    
    if(typeof option=='undefined'){ option = {}}
    option.isidle = option.isidle || "\n\n\n";
    option.isidle2 = option.isidle2 || "\n\n\n";
    option.nextmarker = option.nextmarker || '--- More ---';
    option.nextmarkerflg = true;
    option.dump = true;
    option.getrawflag = true;
    option.stoptokens = option.stoptokens || false;
    option.startinglines = option.startinglines || ['display dhcp'];
    option.endinglines = option.endinglines || [''];
    if(option.include){ if(option.include.length >= 2){_datav.input = _datav.input.replace(/(\n)/g, "") + ' | inc ' +option.include + '\n'} }
    
    if (typeof option.fileref === "undefined"){ this.localtemplate = this.hpswtemplate }
    else if({}.toString.call( option.fileref)==='[object String]'){ this.localtemplate = require(option.fileref); }
    else{
      if (option.fileref.JSONlldpneighbor){ this.localtemplate = option.fileref }
      else{ this.localtemplate = {JSONlldpneighbor:option.fileref} }
    }
    if(typeof option.refarry == 'undefined' && option.json){ option.refarry = this.hpswtemplate.JSONdhcpSnooping }
    return new Promise(res=>{
      fngetdata(_datav,option).then(_res=>{
        let rtmp = readtext(_res.dumpdata,option);
        if(option.json){
          let rval = [];
          for(let entry of rtmp){
            if(entry.length>0){ rval.push(jsonmerge(entry)); }
          }
          res(rval);
        }else{ res(rtmp);}
      });
    });
    
  }//-dhcpSnooping
}
//Aruba Device Class Template Definition
class ArubaIAPdev extends Devnetclass{
  constructor(_model){
    if(_model){
      super(_model);
      if (_model.id) { this.id = _model.id; }
    }
    this.arubaIAPtemplate = require('./src/arubaIAPtemplate');
  }
  listif(option){
    var _datav = {
      input:"show ip int br\n",
      output:' '
    }
    _datav.classobj = this;
    if(typeof option.format=='undefined'){ option.format = "xxxx-xxxx-xxxx"}
    if(option.include){ if(option.include.length >= 2){_datav.input = _datav.input.replace(/(\n)/g, "") + ' | inc ' +option.include + '\n'} }
    return new Promise(res=>{
      fngetdata(_datav,{isidle:'\n\n\n',isidle2 : "\n\n\n",dump:true,multiemit:true}).then(_res=>{
        if(option.json){
          var tmp=[];
          let kk = raw2arry(_res.dumpdata);
          for(elem of raw2arry(_res.dumpdata)){ if(String(elem[1]).length>=7 && String(elem[1]).indexOf('.')!==-1 && String(elem[3]).indexOf('.')!==-1){tmp.push({ int:elem[0],ip:elem[1],mask:elem[3],admin:elem[4],proto:elem[5] });} }
          res(tmp);
        }else{ res(raw2arry(_res.dumpdata)); }
      });
    });
  }
  parseMAC(option){
    var _datav = {
      input:"show arp\n",
      output:' '
    }
    _datav.classobj = this;
    if(typeof option.format=='undefined'){ option.format = "xxxx-xxxx-xxxx"}
    if(option.include){ if(option.include.length >= 2){_datav.input = _datav.input.replace(/(\n)/g, "") + ' | inc ' +option.include + '\n'} }
    return new Promise(res=>{
      fngetdata(_datav,{isidle:'\n\n\n',isidle2 : "\n\n\n",dump:true,multiemit:true}).then(_res=>{
        if(option.json){
          var tmp=[];
          for(elem of raw2arry(_res.dumpdata)){if(String(elem[3]).length>=12){tmp.push({ mac:formatMAC(elem[3],option.format),ip:elem[0],int:elem[5],flags:elem[2] });} }
          res(tmp);
        }else{ res(raw2arry(_res.dumpdata)); }
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
        hide:false,
        nextmarkerflg:true
      }
    }
    option.isidle = "\n\n\n";
    option.isidle2 = "\n\n\n";
    if (typeof option.fileref === "undefined"){ this.localtemplate = this.arubaIAPtemplate }
    else if({}.toString.call( option.fileref)==='[object Object]'){this.localtemplate = option.fileref}
    else{ this.localtemplate = require(option.fileref); }
    return fnver(_datav,option,this.localtemplate.getversion);
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
        return new Promise(res2=>{
          if(option.getrawflag){ res2(extractstr(res.dumpdata,val)); }
          else{ res2(extractstr(res,val)); }
        });
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
    if(!{}.toString.call(datastr.output)=== '[object Array]'){ return console.log('Error! Output variable must be an array of values. \n',datastr.output)}
    else if(inptlen!== datastr.output.length){ return console.log('Error! Input and output variables must be in the same length. \n',datastr.output) }
    else {
      var tempvar = [];
      for(i =0;i<inptlen;i++){
        await new Promise(next=> {
          let otmp = datastr.output[i] || ' ';
          objtmp={
            input:datastr.input[i],
            output:otmp,
            classobj:datastr.classobj
          }
          fngetdata(objtmp,option,morecb).then(result=>{
            tempvar.push(result);
            next();
          });
        })
      }
      return tempvar;
    }
}
const confirmSeq = (classObjtmp,arryIn,strOut,preSearchOpt)=>{
  let textSearchVal = preSearchOpt || ['want','write?','[confirm]'];
  if(typeof classObjtmp == 'undefined' || typeof arryIn == 'undefined' || typeof strOut == 'undefined'){ return console.log('Error','\ntypeof classObjtmp == undefined || typeof arryIn == undefined || typeof strOut == undefined'); }
  return new Promise(res1 =>{
    let matchflg = false;
    if(typeof arryIn == 'boolean'){matchflg = true }
    else{
      for (let j = arryIn.length; j>=0;j--){
        if(textSearchX(String(arryIn[j]),textSearchVal)){
          matchflg =true
          break;
        }
      }
    }
    if (matchflg){
      var dtmp = ' ';
      var timerflg = false;
      var setTHndlr = undefined;
      var cSeqFN = (ds1)=>{
        dtmp+=String(ds1);
        if (dtmp.indexOf(strOut)!==-1){
          if(timerflg){clearTimeout(setTHndlr);} 
          clssObjS.removeListener('data',cSeqFN);
          res1(true)
        }else{
          if(timerflg){clearTimeout(setTHndlr);}
          setTHndlr = setTimeout(()=>{
            timerflg = false;
            clssObjS.removeListener('data',cSeqFN);
            clssObjS = undefined;
            res1(false);
          },12000);
          timerflg = true;
        }
      }
      let clssObjS = classObjtmp.streamSendkeys('\n',{autoenter:false,emit:true});
      clssObjS.on('data',cSeqFN);
    }else{res1(console.log(['%Warning','Pre text search condition not matching. from -->',arryIn],textSearchVal));}
  });
}
const seqCmds = async (classObj,arryIO,option)=>{
  var brkflg = false;
  let result = [true];
  let arryResult  = [];
  let _datav = {classobj: classObj}
  let errormsg = undefined;
    for (elemIO of arryIO){
      if(brkflg){break;}
      else if(!result[0]){break;}
      _datav.input = elemIO.input;
      _datav.output = elemIO.output;
      if(typeof option=='undefined'){ option = { hide:true } }
      option.nextmarkerflg=false;
      if(typeof option.safereturn=='undefined'){option.safereturn=true; }
      if(typeof option.ignorewarning=='undefined'){option.ignorewarning=false}
      let datadump = '';
      await fngetdata(_datav,option,d=>{
        if(!brkflg){
          datadump += '\n' + d;
          if(datadump.indexOf('%Error')!==-1){
            console.log('Device %Error string found!\nStopping sequence now. ',datadump);
            brkflg = true;
            errormsg = ['Error ',datadump];
            result = [undefined,datadump,'Error'];
          }else if(datadump.indexOf('%Warning')!==-1){
            if(option.ignorewarning){
              result = [true,datadump];
              arryResult.push(datadump);
            }else{
              console.log('Function seqCmds option.ignorewarning == false \n Stopping sequence now. ',datadump);
              brkflg = true;
              result = [undefined,datadump,'Warning'];
              arryResult.push(datadump);
            }
          }else{
            if(textSearchX(datadump,elemIO.lookforArry)[0]){ 
              arryResult.push(datadump);
              result = [true,datadump];
            }
          }
        }
      }).then(res=>{
        if(textSearchX(res,elemIO.lookforArry)[0]){
          arryResult.push(res);
          result = [true,res];
        }
        else{
          brkflg = true;
          arryResult.push(res);
          if(! option.safereturn || !result[0]){ result = [false,res]; } 
        }
      });
    }
    if(result[0]){ return {status:true,last:result,arry:arryResult,error:false}; }
    else{ 
      let retobj =  {status:false,last:result,arry:arryResult};
      if(errormsg){retobj.errormsg=errormsg,retobj.error=true};
      return retobj;
    }
}
const textSearchX = (strv,lookforArry) =>{
  let ctrm = 0;
  if(typeof strv !== 'string'){return([false,ctrm,strv,lookfor]);}
  for (lookfor of lookforArry){
    try{
      if(strv.search( new RegExp(lookfor,'g'))==-1){ return([false,ctrm,strv,lookfor]); }
      else{ctrm++;}
    }catch(e){
      if(strv.indexOf(lookfor)==-1){ return([false,ctrm,strv,lookfor]);}
      else{ctrm++;}
    }
  }
  if(elemIO.lookforArry.length===ctrm){ return([true,ctrm]); }
  else{ return([false,ctrm,strv,lookfor]); }
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
    if ({}.toString.call(datastr.input)=== '[object Array]'){
      res(fngetdata2(datastr,option,morecb)); }
    else{
      if (typeof option.nextmarker === "undefined"){option.nextmarker = '--More--'}
      if (typeof option.hide === "undefined"){option.hide = true}
      if (typeof option.nextmarkerflg === "undefined"){option.nextmarkerflg = false}
      if (typeof option.nextmarkercomm === "undefined"){option.nextmarkercomm = ' '}
      if(typeof option.isidle === "undefined"){option.isidle = '\n\n'}
      if(typeof option.isidle2 === "undefined"){option.isidle2 = '\n\n'}
      if(typeof option.delay === "undefined"){option.delay = 0}
      if(typeof option.dump === "undefined"){option.dump = false}
      if(typeof option.getrawflag === "undefined"){option.getrawflag = option.dump}
      if(typeof option.safereturn === "undefined"){option.safereturn = false}
      var tmpstr = "";
      var endflg=true;
      var fnflg = true;
      var rawdata = ""
      classobj.sshconn.busy = true;
      classobj.isIdle(option.isidle).then(hostind=>{
        if(hostind!==false){
          setTimeout(()=>{
            let tmpclssObjStream = classobj.streamSendkeys(datastr.input,{autoenter:false,emit:true}); 
            function fngetdata_def(ds){
              if(fnflg){
                tmpstr = String(ds).trim();
                if(tmpstr.length>2 && tmpstr.indexOf('\u001b[16D')==-1){
                    if(option.getrawflag){rawdata+=String(ds)}
                    else{ dumptmp.push(ds); }
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
                        if(option.dump==true){
                          if(option.multiemit==true){ if(tmpstr.indexOf(hostind)!==-1){ classobj.streamSendkeys(' \n',{autoenter:false,emit:false}); } }
                          else{
                            if(option.getrawflag){ res({data:ds,dumpdata:rawdata}); }
                            else{res({data:ds,dumpdata:dumptmp});}
                          }
                        }else{ res(ds); }
                      }
                    }else if(option.uppercase==true){
                      if(tmpstr.toUpperCase().indexOf(datastr.output.toUpperCase())!==-1){
                        endflg=false;
                        if(option.nextmarkerflg==true){
                          dumptmp2.push(tmpstr);
                          if(tmpstr.indexOf(hostind)!==-1){ classobj.streamSendkeys(option.nextmarkercomm+'\n',{autoenter:false,emit:false}); }
                        }else{
                          if(option.dump==true){
                            if(option.getrawflag){
                              res({data:ds,dumpdata:rawdata});
                            }else{res({data:ds,dumpdata:dumptmp});}
                          }else{ res(ds); }
                        }
                      }
                    }else if(tmpstr.indexOf(hostind)!==-1 && endflg==false){
                      fnflg = false;
                      endflg = true;
                      classobj.isIdle(option.isidle2).then(teststr=>{
                        classobj.sshconn.busy = false;
                        if(hostind==teststr){
                          if(option.dump==true){
                            if(option.getrawflag){
                              classobj.sshconn.prevlog = {data:dumptmp2,dumpdata:rawdata,date:Date.now()};
                              res({data:ds,dumpdata:rawdata});
                            }else{
                              classobj.sshconn.prevlog = {data:dumptmp2,dumpdata:dumptmp,date:Date.now()};
                              res({data:ds,dumpdata:dumptmp});
                            }
                          }else{
                            classobj.sshconn.prevlog = {data:dumptmp2,date:Date.now()};
                            if(dumptmp2){ res(dumptmp2);}
                          }
                        }else{
                          classobj.sshconn.prevlog = {data:false,date:Date.now()};
                          res(false);
                        }
                      });
                    }
                    if(morecbflg){ morecb(ds); }
                }else if(option.getrawflag && tmpstr.indexOf('\u001b[16D')==-1 ){rawdata+=String(ds)}
              }else{
                tmpclssObjStream.removeListener('data',fngetdata_def);
                tmpclssObjStream = null;
              }
            }//fngetdata_def
            tmpclssObjStream.on('data',fngetdata_def);//-classobj.streamSendkeys
          },option.delay);
        }else if(option.safereturn){
          if(typeof tmpclssObjStream!== 'undefined'){
            tmpclssObjStream.removeListener('data',fngetdata_def);
            tmpclssObjStream = null;
          }
          res(hostind);
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
    for (elem of val){
      if(elem.trim()!==""){ tmp.push(raw2arry(elem,option)); }
    }
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
      var tmp2 = val.replace(/(\t)/g, " ").replace(/(   )/g, " ").replace(/(  )/g, " ").replace(/(  )/g, " ");
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
    strdata = String(strdata).replace(/[\x00-\x08]/g, "").replace(/(\n\n)/g,'\n');
    var arry2 = [];
    if(strdata.trim().indexOf(dchar)!==-1){
      tmparry = strdata.split(dchar);
    }else if(strdata.trim().indexOf('\n')!==-1){
      tmparry = strdata.replace(/(\r)/gm, "").split("\n");
    }else{
      arry2.push(strdata);
      return arry2;
    }
    for (val of tmparry) { if (String(val).trim().length>2){ arry2.push(String(val).replace(/(\r)/g,'').trim()); } }
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
function formatMAC(val,format){
  if ({}.toString.call(val)==='[object String]' && {}.toString.call(format)==='[object String]'){
    var tmp = "";
    var ctr=-1;
    for (c of format){
      if(c=='x'||c=='X'){
        var x="";
        do{
          ctr++;
          x = val.charAt(ctr);
        }while((x =='.' || x=='-' || x==':')&&ctr<val.length);
        if(c=='x'){ tmp+=x; }
        else{ tmp+=x.toUpperCase(); }
      }else{ tmp+=c }
    }
    return tmp;
  }else{ return val; }
}
function quickipcheck(objstr){
  if ({}.toString.call(objstr)!=='[object String]'){return null}
  let arrytmp = [];
  for (elem of raw2arry(objstr)){
    let ctr = 0;
    let iplist = [];
    let etype = {}.toString.call(elem);
    if(etype=='[object String]'){
      if(elem.length<7){continue;}
      else{
        let tval0 = String(elem).match(/(.|..|...)\.(.|..|...)\.(.|..|...)\.(...|..|.)/g);
        if(tval0!==null){arrytmp.push({a:elem,b:tval0,c:1});}
      }
    }else if(etype=='[object Array]'){
      for (elem2 of elem){
        let tval = String(elem2).match(/(.|..|...)\.(.|..|...)\.(.|..|...)\.(...|..|.)/g);
        if(elem2==tval){
          ctr++;
          iplist.push(elem2);
        }else if(tval!==null){
          ctr++;
          iplist.push(String(tval));
        }
      }
    }
    if(ctr>0){arrytmp.push({a:elem,b:iplist,c:ctr});}
  }
  return arrytmp;
}
function arrym2s(arry,lvl){
  if(typeof lvl =='undefined'){ lvl = -1}
  if ({}.toString.call(arry)=='[object Array]'){
    let tmp1 = [];
    for (let elem of arry){
      if ({}.toString.call(elem)=='[object Array]' && lvl !== 0 && lvl !== -10000 ){
         tmp1 = tmp1.concat(arrym2s(elem,lvl - 1));
      }else{ tmp1.push(elem); }
    }
    return tmp1;
  }else{return arry}
}
function readtext(text, params){
  if (!params || !text) return null;
  let stoptokens = params.stoptokens || false;
  let startinglines = params.startinglines || ['lldp'];
  let endinglines = params.endinglines || ['#'];
  if (typeof stoptokens == 'string'){  stoptokens = [stoptokens]};
  if (typeof startinglines == 'string'){  startinglines = [startinglines]};
  if (typeof endinglines == 'string'){  endinglines = [endinglines]};
  if (typeof params.incEnding =='undefined'){params.incEnding = true;}
  let tmparry1 = [];
  let tmparry2 = [];
  let flg = false;
  l1:for (let elem of text.replace(/(\n\n\n)/g, '\n').replace(/(\r)/g, '').split('\n')){
    if(String(elem).trim().length<=1){ continue;};
    l2a:if(flg){
    l2b:for(let elval of endinglines){
        if(elem.indexOf(elval)!==-1){
          if(params.refarry){ 
            tmparry1.push(arrym2s(extractstr(tmparry2,params.refarry),params.lvl)) }
          else if(tmparry2!=={}){ tmparry1.push(tmparry2);}
          flg = false;
          if(params.incEnding){break l2b;}
          else{break l2a;}
        }
      }
      tmparry2.push(elem);
    }
    l3:for(let slval of startinglines){
      if(elem.indexOf(slval)!==-1){
        flg = true;
        tmparry2 = [elem];
        break l3;
      }
    }
    if(stoptokens){for (let stval of stoptokens){ if(elem.indexOf(stval)!==-1){ break l1;} };}
  }
  if(tmparry2.length>=1){
    if(params.refarry){ tmparry1.push(arrym2s(extractstr(tmparry2,params.refarry),params.lvl)) }
    else{ tmparry1.push(tmparry2);}
  }
  return tmparry1;
}
function jsonmerge(j1,j2){
  let typev = {}.toString.call(j1);
  if(typev=='[object Object]'){
    for (let key in j2){
      if(j1.hasOwnProperty(key)){
        let y = Object.keys(j1).length;
        fl1:for(let indx=1;indx<=y;indx++){
          if(j1.hasOwnProperty(key+indx)==false){
            j1[key+indx] = j2[key];
            break fl1;
          }
        }
      }
      else{ j1[key] = j2[key] }
    }
    return j1;
  }else if(typev=='[object Array]'){
    let tmp = {};
    for (let elem of j1){ tmp = Object.assign(tmp,jsonmerge(tmp,elem)); }
    if({}.toString.call(j2)=='[object Object]'){ return jsonmerge(tmp,j2); }
    else { return tmp; }
  }else { return j1; }
}
function getroute(obj){
  if({}.toString.call(obj)==='[object String]'){
    if(obj.indexOf('\n')!==-1){
      let tmp2 = [];
      for(indobj of spltdt(obj)){ tmp2.push(getroute(indobj)); }
      return tmp2;
    }else{
      let arry = quickipcheck(obj);
      let tmp = {dst:arry[0].b}
      if(arry[1]){
        if(String(arry[1].b).indexOf('255')!==-1 || String(arry[1].b).indexOf('0.0.0.0')!==-1){ tmp.mask = arry[1].b }
        else if(arry.length==2 && obj.indexOf('via')!==-1){ tmp.gw = arry[1].b; }
      }
      if(arry[2]){
        let rate = 0;
        for(let strtmp of arry[2].a){
          let _strtmp = String(strtmp).toUpperCase();
          if(_strtmp.indexOf('DEF')!==-1){ rate +=4; }
          if(_strtmp.indexOf(':')!==-1){ rate +=2; }
          if(_strtmp.indexOf('IP')!==-1){ rate +=2; }
          if(_strtmp.indexOf('GW')!==-1){ rate +=4; }
          if(_strtmp.indexOf('GATEWAY')!==-1){ rate +=7; }
        }
        if(rate>5 || arry.length>=3 ){ tmp.gw = arry[2].b; }
      }
      if(arry[3]){
        if(String(arry[3].b).length>7 && String(arry[3].b).indexOf('.')!==-1){ tmp.src = arry[3].b; }
      }
      return tmp;
    }
  }
}
function getSubnetInfo(subnet, netmask){
  let resultv = {};
  if(subnet.indexOf('/')!==-1){
      let stmp = subnet.split('/');
      resultv.nm = stmp[1];
      resultv.ip = stmp[0];
      let resNM = getNetmaskDetails(stmp[1]);
      resultv.maxh = resNM.u
      resultv.i = resNM.i
      resultv.nn = resNM.nn
      resultv.nm = resNM.nm
      resultv.arry = resNM.arry
      let octet = Number(stmp[0].split('.')[resNM.i]);
      let incNum = Math.pow(2,resNM.ii);
      if(incNum==1){
          resultv.lrange=NaN;
          resultv.urange=NaN;
      }
      else{
          resultv.lrange =parseInt(octet/incNum)*incNum;
          resultv.urange =(parseInt(octet/incNum)*incNum)+incNum-1;
      }
  }else if({}.toString.call(netmask)=='[object Undefined]'){ return getSubnetInfo(subnet+'/32'); }
  else{ return getSubnetInfo(subnet+'/'+netmask); }
  return resultv;
}
function getNetmaskDetails(netmask,opt){
if(netmask==0||netmask==='/0'){netmask='32'}
let cNM = quickipcheck(String(netmask))[0];
if (cNM!== undefined){
   if(cNM.c === 1){
      let tmpV = String(cNM.a).match(/((255|254|252|248|240|224|192|128)\.(0)\.(0)\.(0))|((255)\.(255|254|252|248|240|224|192|128)\.(0)\.(0))|((255)\.(255)\.(255|254|252|248|240|224|192|128)\.(0))|((255)\.(255)\.(255)\.(255|254|252|248|240|224|192|128))/g);
      if(tmpV!== null) {
          let arryt = tmpV[0].split('.');
          let ctrnn = 0;
          for (elem of arryt){ ctrnn = ctrnn +  convDec2Bin(elem)[3]; }
          if({}.toString.call(opt)=='[object Undefined]'){
              return getNetmaskDetails (ctrnn);
          }else{
              opt[0] = arryt;
              opt.nn = ctrnn;
              return opt;
          }
      }else{ return null;}
   }else{return null;}
}else if(String(netmask).length <=3){
   let val = 0
   try { val = Number(String(netmask).match(/((\/[0-2][0-9]|30|31|32)|[0-2][0-9]|[1-9])/g)[0].replace('/','')); } catch (error) { return null;}
   let val2 = convNNtoOCT(val);
   return getNetmaskDetails(val2.nm,val2);
}else{ return null}
}
function convNNtoOCT(nn){
  let restmp = '';
  let restmp2 = [];
  let restmp3 = '';
  let restmp4 = '';
  let iictr = 0;
  let indxOCT = 0;
  if(nn>=24){ indxOCT = 3;
  }else if(nn>=16){ indxOCT = 2;
  }else if(nn>=8){ indxOCT = 1; }
  try {
      for(i=0;i<32;i++){
          if(i>0 && i%8==0){ restmp+='.' }
          if(i<Number(nn)){ restmp +='1'; }
          else{
              if(((3-indxOCT)*8)<(32-i)){ iictr++; }
              restmp4+='1';
              restmp +='0'; }
      }
  } catch (error) { return null; }
  for (elemtmp of restmp.split('.')){
      let vv = parseInt(elemtmp, 2);
      restmp2.push(vv);
      restmp3+=(vv+'.');
  }
  restmp3 = restmp3.substring(0,restmp3.length-1);
  return {raw:restmp,arry:restmp2,i:indxOCT,nm:restmp3,h:restmp4,u:parseInt(restmp4, 2),ii:iictr};
}
function convDec2Bin(x) {
  let bin = 0;
  let rem, i = 1;
  let resArry = [undefined,'',undefined];
  let inZ = false;
  let prevRem = 0;
  let ctrxtmp = 0;
  while (x != 0) {
      rem = x % 2;
      if(rem === 1){ctrxtmp++;}
      resArry[1] = resArry[1] + rem;
      if(prevRem==1 && rem==0){ inZ = true;}
      prevRem = rem;
      x = parseInt(x / 2);
      bin = bin + rem * i;
      i = i * 10;
  }
  resArry[0]=bin;
  resArry[2]=inZ;
  resArry[3]=ctrxtmp;
  return resArry;
}
module.exports = {CiscoRouter:CiscoRouterdev,CiscoSwitch:CiscoSWdev,Mikrotik:Mikrotikdev,HpSwitch:HpSWdev,ArubaIAP:ArubaIAPdev,Talari:Talaridev,Defaultclass:Defaultclass,tools:{str2Arry:spltdt,extractstr:extractstr,keyval:keyvalfn,arry2json:arry2json,raw2arry:raw2arry,formatMAC:formatMAC,quickipcheck:quickipcheck,arrym2s:arrym2s,jsonmerge:jsonmerge,getroute:getroute,getNetmaskDetails:getNetmaskDetails,getSubnetInfo:getSubnetInfo}};