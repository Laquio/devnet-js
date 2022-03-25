var devnet = require('../index');
let sampledev1 = new devnet.CiscoRouter({id:"any string here"});
var loginparam = {
    credential:{  //see ssh2 documentation for other option
      host: '',
      port: 22,
      username: '',
      password: '',
      algorithms: {
        cipher: [ '3des-cbc',"aes256-ctr","aes192-ctr","aes128-ctr"],
        kex: [ "diffie-hellman-group1-sha1","diffie-hellman-group14-sha1" ],
        hmac :['hmac-sha2-256','hmac-sha2-512']
      }
    }
  }
new Promise(_res=>{
  sampledev1.openSshShell(loginparam,(stream,err)=>{
    if(stream){   // stream instance
      stream.setEncoding("utf-8");
      console.log('Session Ready.');
      _res(true);
    }else{
      console.log('err ',err)
      _res(false);
    }
  });
}).then(res=>{
  if(res){
    sampledev1.dir().then(res=>{     //example function
      console.log("\ndone --- \n",res);
    });
  }
});