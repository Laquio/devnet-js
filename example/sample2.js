var devnet = require('../index');
let ciscodev1 = new devnet.CiscoRouter({id:"sample-id-1"});
var loginparam = {
    credential:{  //see ssh2 documentation for other option
      host: '<hostname or IP>',
      port: 22,
      username: '<your-username-here>',
      password: '<pwd>',
      algorithms: {
        cipher: [
          '3des-cbc'
        ]
      }
    }
  }
console.log("show ip int br");
var param = {
  command:"show ip int br",
  endActiveStream:true,
  credential:loginparam.credential,
  setEncoding:"utf-8"
}
ciscodev1.execute(param,function(data){   //non interactive
    console.log('data arry',data);
});
/*
param = {
  command:"show arp",
  endActiveStream:true,
  credential:loginparam.credential,
  setEncoding:"utf-8"
}
ciscodev1.execute(param,function(data){
    console.log('data arry',data);
},function(data2){
    console.log(data2);
});
*/
