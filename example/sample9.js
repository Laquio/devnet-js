var devnet = require('../index');
let sampledev1 = new devnet.ArubaIAP({id:"any string here"});
var loginparam = {
    credential:{  //see ssh2 documentation for other option
      host: '<hostname or IP>',
      port: 22,
      username: '<your-username-here>',
      password: '<pwd>',
      algorithms: {
        cipher: [ '3des-cbc' ],
        kex: [ "diffie-hellman-group1-sha1","diffie-hellman-group-exchange-sha256","diffie-hellman-group14-sha1" ]
      }
    }
  }
new Promise(_res=>{
  sampledev1.openSshShell(loginparam,function(stream){
    if(stream){   // stream instance
      stream.setEncoding("utf-8");
      console.log('Session Ready.');
      _res(true);
    }
  });
}).then(res=>{
  if(res){
    var option={
      json:true
    }
    sampledev1.listif(option).then(res=>{     //example function
      console.log("output:\n",res);
    });
  }
});
