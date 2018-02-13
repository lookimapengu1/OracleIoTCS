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
            //var alert = virtualDev.createAlert('urn:test:js:helloworld:count:over5');
            //alert.raise();
            virtualDev.close();
            clearInterval(timer);
        }
    };

    timer = setInterval(send, 1000);

}
            
function getHWModel(device){
    device.getDeviceModel('urn:test:helloworld', function (response) {
        console.log('-----------------MY DEVICE MODEL----------------------------');
        console.log(JSON.stringify(response,null,4));
        console.log('------------------------------------------------------------');
        myModel = response;
        startVirtualHWDevice(device, device.getEndpointId());
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
