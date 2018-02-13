noble = require('noble');
var io_pref = 'e95d';
var io_suff = '251d470aa062fa1922dfa9a8';
var io_serv_id = io_pref + '127b' + io_suff;
var io_chio_id = io_pref + 'b9fe' + io_suff;
var io_chad_id = io_pref + '5899' + io_suff;
var io_data_id = io_pref + '8d00' + io_suff;

var io_serv = null;
var io_io = null;
var io_ad = null;
var io_data = null;

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
		    console.log(s[i].uuid == io_serv_id);
		    if(s[i].uuid == io_serv_id) {
			console.log('found service id! ' + s[i].uuid);
			var piniosvc = s[i];
			//console.log(piniosvc);
			for(var j in piniosvc.characteristics){
			    var cha = piniosvc.characteristics[j];
			    if (cha.uuid == io_chio_id) {
				cha.write(new Buffer([0x04],[0x00],[0x00],[0x00]), true, function(error) {
				    console.log('ouput mode set!');
				});
				//console.log(cha.read());
			    } else if (cha.uuid == io_chad_id) {
				cha.write(new Buffer([0x04],[0x00],[0x00],[0x00]), true, function(error) {
				    console.log('analog mode set!');
				});
			    } else if (cha.uuid == io_data_id) {
				//cha.read(function(err, data) {
				    
				//});
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

