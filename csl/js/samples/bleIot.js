noble = require('noble');
var preffix = 'e95d';
var suffix = '251d470aa062fa1922dfa9a8';
var serv_id = preffix + '93af' + suffix;
var cliReq_id = preffix + '234c' + suffix;
var cliEvt_id = preffix + '9775' + suffix;
//var io_data_id = io_pref + '8d00' + io_suff;

noble.on('stateChange', function(state) {
    if(state === 'poweredOn') {
	console.log('starting scan...');
	noble.startScanning();
    } else {
	console.log('stopping scan...');
	noble.stopScanning();
    }
});

noble.on('discover', function(peripheral) {
    if(peripheral.address === 'db:d1:4b:a8:7c:03'){
	console.log('name: ' + peripheral.advertisement.localName);
	console.log('addr: ' + peripheral.address);
	console.log('RSSI: ' + peripheral.rssi);

	peripheral.connect(function(err) {
	    console.log('connected!');

	    peripheral.discoverAllServicesAndCharacteristics(function(err,s,c) {
		console.log('looking for all services and characteristics...');
		for (var i in s) {
		    console.log(i + ': ' + s[i].uuid);
		    //console.log(s[i].uuid == io_serv_id);
		    if(s[i].uuid == serv_id) {
			console.log('found service id! ' + s[i].uuid);
			var svc = s[i];
			//console.log(piniosvc);
			for(var j in svc.characteristics){
			    var cha = svc.characteristics[j];
			    if (cha.uuid == cliReq_id) {
				cha.write(new Buffer([0x32],[0x23],[0x00],[0x00]), true, function(error) {
				    //console.log('ouput mode set!');
				});
			    /*} else if (cha.uuid == io_chad_id) {
				cha.write(new Buffer([0x04],[0x00],[0x00],[0x00]), true, function(error) {
				    console.log('analog mode set!');
				});*/
			    } else if (cha.uuid == cliEvt_id) {
				cha.on('data', function(data, isNotify) {
				    console.log(data);
				});
				cha.subscribe(function(err) {
				    console.log('notifications on!');
				});
			    }
			}
		    }
		}
	    });
	});
    }
});

