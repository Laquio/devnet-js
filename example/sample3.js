var devnet = require('../index');
let ciscodev1 = new devnet.Defaultclass({id:"any string here"});
var loginparam = {
    credential:{  //see ssh2 documentation for other option
      host: '<hostname or IP>',
      port: 22,
      username: '<your-username-here>',
      password: '<pwd>'
    }
  }
ciscodev1.openSshShell(loginparam);

setTimeout(function(){ //Writing stream in a simple way some delay is required none common method; moments after openSshShell function.
  ciscodev1.streamSendkeys("show ip int br",{autoenter:true,emit:true}).on('data',function(data) {  //other style
    process.stdout.write(data);
  });
}, 3000);
/*
setTimeout(testfn, 2000);
function testfn(){  //-simple stright forward style
    ciscodev1.sshconn.simplify = false;
    ciscodev1.streamSendkeys("show ip int br"); // or ciscodev1.streamSendkeys("show version",{autoenter:true});
    ciscodev1.sshconn.stream.on('data', function(data) {
      process.stdout.write(data);
    });
    ciscodev1.sshconn.stream.on('close', function() {
      console.log('\n--- stream closed');
      ciscodev1.sshconn.end();
    });

    setTimeout(function(){
      process.stdout.write("   - Enter Key!");
      ciscodev1.streamSendkeys("\n")
    }, 3000);
}//-testfn
*/
setTimeout(function(){  //terminate ssh session after 12 seconds
  ciscodev1.end();
}, 12000);
