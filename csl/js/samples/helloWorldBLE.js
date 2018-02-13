 /*
 * This sample changes a message attribute on virtual device and triggers a message 
 * to the Cloud Service with the updated attribute value.
 *
 * The client is a directly connected device using the virtual device API.
 */

dcl = require("device-library.node");
dcl = dcl({debug: true});
var noble = require('noble');

dcl.oracle.iot.tam.store = (process.argv[2]);
//console.log(dcl.oracle.iot.tam.store);
dcl.oracle.iot.tam.storePassword = (process.argv[3]);
//console.log(dcl.oracle.iot.tam.storePassword);

var myModel;
var virtualDev;

function startVirtualHWDevice(device, id) {
    var virtualDev = device.createVirtualDevice(id, myModel);
    console.log(virtualDev);
    var count = 0;
    
    var newValues = {
       "message": "Hello World!"
    };
            
    var send = function () {
        count += 1;
        newValues.message = "Hello World " + count;
        virtualDev.update(newValues);
        if (count > 5) {
            virtualDev.close();
            clearInterval(timer);
        }
    };

    timer = setInterval(send, 10000);
    clearInterval(timer);

}

function startPhysicalHWDevice(device, id) {
    var vd = device.createVirtualDevice(id, myModel);

    var pre = 'e95d';
    var suf = '251d470aa062fa1922dfa9a8';
    var serv_id = pre + '93af' + suf;
    var cliReq_id = pre + '23c4' + suf;
    var cliEvt_id = pre + '9775' + suf;

    noble.on('stateChange', function(state) {
	if(state==='poweredOn') {
	    console.log('starting scan...');
	    noble.startScanning();
	} else {
	    console.log('stopping scan...');
	    noble.stopScanning();
	}
    });

    noble.on('discover', function(p) {
	if(p.address === 'db:d1:4b:a8:7c:03') {
	    console.log('found device ' + p.advertisement.localName);

	    p.connect(function(err) {
		console.log('connected!');

		p.discoverAllServicesAndCharacteristics(function(err,s,c) {
		    console.log('looking for services...');
		    var svc = null;
		    for (var i in s) {
			console.log(i + ": " + s[i].uuid);
			if(s[i].uuid == serv_id) {
			    svc = s[i];
			    console.log('service set!');
			}
		    }

		    for (var i in svc.characteristics) {
			var cha = svc.characteristics[i];
			console.log('looking for ' + cliReq_id);
			console.log(i + ': ' + cha.uuid);
			if(cha.uuid == cliReq_id) {
			    cha.write(new Buffer([0x32],[0x23],[0x00],[0x00]), true, function(err) {
				console.log('event id set!');
			    });
			} else if (cha.uuid == cliEvt_id) {
			    cha.on('data', function(data, isNotify) {
				console.log(data.toString('hex'));
				var newValues = {
				    "message":data.toString('hex')
				};
				
				var send = function(){
				    vd.update(newValues);
				}
				timer = setInterval(send, 10000);
			    });
			    cha.subscribe(function(err) {
				console.log('notifications on!');
			    });
			}
		    }
		});
	    });
	}
    });
	
}
            
function getHWModel(device){
    device.getDeviceModel('urn:test:helloworld', function (response) {
        console.log('-----------------MY DEVICE MODEL----------------------------');
        console.log(JSON.stringify(response,null,4));
        console.log('------------------------------------------------------------');
        myModel = response;
        startPhysicalHWDevice(device, device.getEndpointId());
    });
}


var dcd = new dcl.device.DirectlyConnectedDevice();
if (dcd.isActivated()) {
    getHWModel(dcd);
} else {
    dcd.activate(['urn:test:helloworld'], function (device) {
        dcd = device;
        console.log(dcd.isActivated());
        if (dcd.isActivated()) {
            getHWModel(dcd);
        }
    });
}
