/**
 * Copyright (c) 2015, 2017, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * This represents a GatewayDevice in the Messaging API.
 * It has the exact same specifications and capabilities as
 * a directly connected device from the Messaging API and additionally
 * it has the capability to register indirectly connected devices.
 *
 * @param {string} [taStoreFile] - trusted assets store file path
 * to be used for trusted assets manager creation. This is optional.
 * If none is given the default global library parameter is used:
 * lib.oracle.iot.tam.store
 * @param {string} [taStorePassword] - trusted assets store file password
 * to be used for trusted assets manager creation. This is optional.
 * If none is given the default global library parameter is used:
 * lib.oracle.iot.tam.storePassword
 *
 * @memberOf iotcs.device.util
 * @alias GatewayDevice
 * @class
 * @extends iotcs.device.util.DirectlyConnectedDevice
 */
lib.device.util.GatewayDevice = function (taStoreFile, taStorePassword) {
    lib.device.util.DirectlyConnectedDevice.call(this, taStoreFile, taStorePassword, true);
};

lib.device.util.GatewayDevice.prototype = Object.create(lib.device.util.DirectlyConnectedDevice.prototype);
lib.device.util.GatewayDevice.constructor = lib.device.util.GatewayDevice;

/** @inheritdoc */
lib.device.util.GatewayDevice.prototype.activate = function (deviceModelUrns, callback) {
    if (this.isActivated()) {
        lib.error('cannot activate an already activated device');
        return;
    }

    _mandatoryArg(deviceModelUrns, 'array');
    _mandatoryArg(callback, 'function');

    deviceModelUrns.forEach(function (urn) {
        _mandatoryArg(urn, 'string');
    });

    var deviceModels = deviceModelUrns;
    deviceModels.push('urn:oracle:iot:dcd:capability:direct_activation');
    deviceModels.push('urn:oracle:iot:dcd:capability:indirect_activation');
    var self = this;
    this._.internalDev.activate(deviceModels, function(activeDev, error) {
        if (!activeDev || error) {
            callback(null, error);
            return;
        }
        callback(self);
    });
};

/**
 * Register an indirectly-connected device with the cloud service and specify whether
 * the gateway device is required to have the appropriate credentials for activating
 * the indirectly-connected device.
 *
 * The <code>restricted</code> parameter controls whether or not the client
 * library is <em>required</em> to supply credentials for activating
 * the indirectly-connected device. The client library will
 * <em>always</em> supply credentials for an indirectly-connected
 * device whose trusted assets have been provisioned to the client.
 * If, however, the trusted assets of the indirectly-connected device
 * have not been provisioned to the client, the client library can
 * create credentials that attempt to restrict the indirectly connected
 * device to this gateway device.
 *
 * Pass <code>true</code> for the <code>restricted</code> parameter
 * to ensure the indirectly-connected device cannot be activated
 * by this gateway device without presenting credentials. If <code>restricted</code>
 * is <code>true</code>, the client library will provide credentials to the server.
 * The server will reject the activation request if the indirectly connected
 * device is not allowed to roam to this gateway device.
 *
 * Pass <code>false</code> to allow the indirectly-connected device to be activated
 * without presenting credentials if the trusted assets of the
 * indirectly-connected device have not been provisioned to the client.
 * If <code>restricted</code> is <code>false</code>, the client library will provide
 * credentials if, and only if, the credentials have been provisioned to the
 * client. The server will reject the activation if credentials are required
 * but not supplied, or if the provisioned credentials do not allow the
 * indirectly connected device to roam to this gateway device.
 *
 * The <code>hardwareId</code> is a unique identifier within the cloud service
 * instance and may not be <code>null</code>. If one is not present for the device,
 * it should be generated based on other metadata such as: model, manufacturer,
 * serial number, etc.
 *
 * The <code>metaData</code> Object should typically contain all the standard
 * metadata (the constants documented in this class) along with any other
 * vendor defined metadata.
 *
 * @param {boolean} restricted - indicate whether or not credentials are required
 * for activating the indirectly connected device
 * @param {!string} hardwareId - an identifier unique within the Cloud Service instance
 * @param {Object} metaData - The metadata of the device
 * @param {string[]} deviceModelUrns - array of device model URNs
 * supported by the indirectly connected device
 * @param {function} callback - the callback function. This
 * function is called with the following argument: the endpoint id
 * of the indirectly-connected device is the registration was successful
 * or null and an error object as the second parameter: callback(id, error).
 * The reason can be retrieved from error.message and it represents
 * the actual response from the server or any other network or framework
 * error that can appear.
 *
 * @memberof iotcs.device.util.GatewayDevice.prototype
 * @function registerDevice
 */
lib.device.util.GatewayDevice.prototype.registerDevice = function (restricted, hardwareId, metaData, deviceModelUrns, callback) {
    if (!this.isActivated()) {
        lib.error('device not activated yet');
        return;
    }

    if (typeof (restricted) !== 'boolean') {
        lib.log('type mismatch: got '+ typeof (restricted) +' but expecting any of boolean)');
        lib.error('illegal argument type');
        return;
    }
    _mandatoryArg(hardwareId, 'string');
    _mandatoryArg(metaData, 'object');
    _mandatoryArg(callback, 'function');
    deviceModelUrns.forEach(function (urn) {
        _mandatoryArg(urn, 'string');
    });

    var payload = metaData;
    payload.hardwareId = hardwareId;
    payload.deviceModels = deviceModelUrns;

    var self = this;
    var data = self._.internalDev._.tam.getEndpointId();
    // If the ICD has been provisioned, use the shared secret to generate the
    // signature for the indirect activation request.
    // If this call return null, then the ICD has not been provisioned.
    var signature = self._.internalDev._.tam.signWithSharedSecret(data, "sha256", hardwareId);

    // If the signature is null, then the ICD was not provisioned. But if
    // the restricted flag is true, then we generate a signature which will
    // cause the ICD to be locked (for roaming) to the gateway
    if (restricted && (signature === null)) {
        signature = self._.internalDev._.tam.signWithPrivateKey(data, "sha256");
    }

    if (signature !== null) {
        if (typeof signature === 'object') {
            payload.signature = forge.util.encode64(signature.bytes());
        } else {
            payload.signature = forge.util.encode64(signature);
        }
    }

    var indirect_request;

    indirect_request = function () {
        var options = {
            path: $impl.reqroot + '/activation/indirect/device'
            + (lib.oracle.iot.client.device.allowDraftDeviceModels ? '' : '?createDraft=false'),
            method: 'POST',
            headers: {
                'Authorization': self._.internalDev._.bearer,
                'X-EndpointId': self._.internalDev._.tam.getEndpointId()
            },
            tam: self._.internalDev._.tam
        };
        $impl.protocolReq(options, JSON.stringify(payload), function (response_body, error) {

            if (!response_body || error || !response_body.endpointState) {
                callback(null, lib.createError('invalid response on indirect registration', error));
                return;
            }

            if(response_body.endpointState !== 'ACTIVATED') {
                callback(null, lib.createError('endpoint not activated: '+JSON.stringify(response_body)));
                return;
            }

            callback(response_body.endpointId);

        },indirect_request, self._.internalDev);
    };

    indirect_request();
};