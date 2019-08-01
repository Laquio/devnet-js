var devnet = require('../index');
let ciscodev1 = new devnet.CiscoRouter({id:"sample-id-1"});
var loginparam = {
    credential:{  //see ssh2 documentation for other option
      host: '<hostname or IP>',
      port: 22,
      username: '<your-username-here>',
      password: '<pwd>'
    }
  }
ciscodev1.openSshShell(loginparam,function(stream){  // interactive shell
  if(stream){   // stream instance
    console.log('Session Ready');
    stream.on('close', function() {
      console.log('Stream :: close');
      ciscodev1.sshconn.end();
    }).on('data', function(data) {
      console.log('OUTPUT: ' + data);
    });
    stream.end('dir\nexit\n');
  }
});
