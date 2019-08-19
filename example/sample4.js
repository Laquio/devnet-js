var devnet = require('../index');
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
