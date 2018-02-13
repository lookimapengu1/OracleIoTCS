/**
 * Copyright (c) 2015, 2017, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * The Data is an object that represents a set of custom data fields (key/value pairs)
 * defined in the formats section of the device model. Data can be used
 * to send these fields to the server.
 * <p>
 * The Data API is specific to the device client library and the data fields
 * can be created by the VirtualDevice objects or using them.
 * For setting the fields of the data object as defined in the model, the fields
 * property of the data object will be used e.g.:<br>
 * <code>data.fields.temp = 50;</code>
 * <p>
 * The constructor of the Data object should not be used directly but the
 * {@link iotcs.device.VirtualDevice#createData} method should be used
 * for creating data objects.
 *
 * @memberOf iotcs.device
 * @alias Data
 * @class
 *
 * @param {iotcs.device.VirtualDevice} virtualDevice - the virtual device that has
 * in it's device model the custom format specification
 * @param {string} formatUrn - the urn format of the custom data fields spec
 *
 * @see {@link iotcs.device.VirtualDevice#createData}
 */
lib.device.Data = function (virtualDevice, formatUrn) {
    _mandatoryArg(virtualDevice, lib.device.VirtualDevice);
    _mandatoryArg(formatUrn, 'string');

    var dataSpec = virtualDevice[formatUrn];

    if (!dataSpec.urn || (dataSpec.type !== 'DATA')) {
        lib.error('data specification in device model is invalid');
        return;
    }

    this.device = virtualDevice;

    var spec = {
        urn: dataSpec.urn,
        description: (dataSpec.description || ''),
        name: (dataSpec.name || null)
    };

    if (dataSpec.value && dataSpec.value.fields && Array.isArray(dataSpec.value.fields)) {
        Object.defineProperty(this, 'fields', {
            enumerable: true,
            configurable: false,
            writable: false,
            value: {}
        });

        Object.defineProperty(this, '_', {
            enumerable: false,
            configurable: false,
            writable: false,
            value: {}
        });

        var self = this;

        dataSpec.value.fields.forEach(function (field) {
            self._[field.name] = {};
            self._[field.name].type = field.type.toUpperCase();
            self._[field.name].optional = field.optional;
            self._[field.name].name = field.name;
            self._[field.name].value = null;
            Object.defineProperty(self.fields, field.name, {
                enumerable: false,
                configurable: false,
                get: function () {
                    return self._[field.name].value;
                },
                set: function (newValue) {

                    if (!self._[field.name].optional && ((typeof newValue === 'undefined') || (newValue === null))) {
                        lib.error('trying to unset a mandatory field in the data object');
                        return;
                    }

                    newValue = _checkAndGetNewValue(newValue, self._[field.name]);

                    if (typeof newValue === 'undefined') {
                        lib.error('trying to set an invalid type of field in the data object');
                        return;
                    }

                    self._[field.name].value = newValue;
                }
            });

        });
    }

    // public members
    Object.defineProperty(this, 'urn', {
        enumerable: true,
        configurable: false,
        writable: false,
        value: spec.urn
    });

    Object.defineProperty(this, 'name', {
        enumerable: true,
        configurable: false,
        writable: false,
        value: spec.name
    });

    Object.defineProperty(this, 'description', {
        enumerable: true,
        configurable: false,
        writable: false,
        value: spec.description
    });
};

/**
 * This method is used to actually send the custom data fields to the server.
 * All mandatory fields (according to the device model definition)
 * must be set before sending, otherwise an error will be thrown.
 * Any error that can arise while sending will be handled by the
 * VirtualDevice.onError handler, if set.
 * <p>
 * After a successful send all the values are reset so to send
 * again the values must be first set.
 *
 * @see {@link iotcs.device.VirtualDevice}
 * @memberOf iotcs.device.Data.prototype
 * @function submit
 */
lib.device.Data.prototype.submit = function () {
    var message = new lib.message.Message();
    message
        .type(lib.message.Message.Type.DATA)
        .source(this.device.getEndpointId())
        .format(this.urn);

    var messageDispatcher = new lib.device.util.MessageDispatcher(this.device.client._.internalDev);
    var storageObjects = [];
    for (var key in this._) {
        var field = this._[key];
        if (!field.optional && ((typeof field.value === 'undefined') || (field.value === null))) {
            lib.error('all mandatory fields not set');
            return;
        }
        if ((typeof field.value !== 'undefined') && (field.value !== null)) {
            if ((field.type === "URI") && (field.value instanceof lib.StorageObject)) {
                var syncStatus = field.value.getSyncStatus();
                if (syncStatus === lib.device.StorageObject.SyncStatus.NOT_IN_SYNC ||
                    syncStatus === lib.device.StorageObject.SyncStatus.SYNC_PENDING) {
                    storageObjects.push(field.value);
                }
                field.value._.setSyncEventInfo(key, this.device);
                field.value.sync();
            }
            message.dataItem(key, field.value);
        }
    }

    storageObjects.forEach(function (storageObject) {
        messageDispatcher._.addStorageDependency(storageObject, message._.internalObject.clientId);
    });
    messageDispatcher.queue(message);
    for (var key1 in this._) {
        this._[key1].value = null;
    }
};
