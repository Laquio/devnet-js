var devnet = require('../index');
let sampledev1 = new devnet.CiscoRouter({id:"any string here"});   //Defaultclass intended for generic devices.
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
new Promise(_res=>{
  sampledev1.openSshShell(loginparam,function(stream){    //ctrl+c to end process
    if(stream){   // stream instance
      stream.setEncoding("utf-8");
      console.log('Session Ready.');
      _res(true);
    }
  });
}).then(res=>{
  if(res){
    var option={
      json:true,        //Select between Array or JSON
      fileref:__dirname+'/ciscotemplate-cust' //Absolute path
    }
    sampledev1.parseVersion(option).then(res=>{     //example function
      console.log("output:\n",res);
    });
  }
});
