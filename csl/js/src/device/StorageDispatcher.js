/**
 * Copyright (c) 2017, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * The StorageDispatcher queues content for automatic upload to, or download from, the Oracle Storage Cloud Service.
 * <p>
 * There can be only one StorageDispatcher instance per DirectlyConnectedDevice at a time and it is created
 * at first use. To close an instance of a StorageDispatcher the DirectlyConnectedDevice.close method must be used.
 * <p>
 * The onProgress can be used to set handlers that are used for notifying as the transfer progresses:
 * <p>
 * <code>storageDispatcher.onProgress = function (progress, error);</code><br>
 * where {@link iotcs.device.util.StorageDispatcher.Progress} progress is an object represents the transfer progress
 * of storage object
 *
 * @param {iotcs.device.util.DirectlyConnectedDevice} device - the directly
 * connected device (Messaging API) associated with this storage dispatcher
 *
 * @class
 * @memberOf iotcs.device.util
 * @alias StorageDispatcher
 * @extends iotcs.StorageDispatcher
 */
lib.device.util.StorageDispatcher = function (device) {
    _mandatoryArg(device, lib.device.util.DirectlyConnectedDevice);

    if (device.storageDispatcher) {
        return device.storageDispatcher;
    }
    lib.StorageDispatcher.call(this, device);

    var self = this;
    var client = device;
    var poolingInterval = lib.oracle.iot.client.device.defaultMessagePoolingInterval;
    var startPooling = null;

    var processCallback = function (storage, state, bytes) {
        storage._.setProgressState(state);
        var progress = new lib.device.util.StorageDispatcher.Progress(storage);
        progress._.setBytesTransferred(bytes);
        self._.onProgress(progress);
    };

    var deliveryCallback = function (storage, error, bytes) {
        storage._.setProgressState(lib.StorageDispatcher.Progress.State.COMPLETED);
        var progress = new lib.device.util.StorageDispatcher.Progress(storage);
        progress._.setBytesTransferred(bytes);
        self._.onProgress(progress, error);
    };

    var errorCallback = function (storage, error, bytes) {
        storage._.setProgressState(lib.StorageDispatcher.Progress.State.FAILED);
        var progress = new lib.device.util.StorageDispatcher.Progress(storage);
        progress._.setBytesTransferred(bytes);
        self._.onProgress(progress, error);
    };

    var sendMonitor = new $impl.Monitor(function () {
        var currentTime = Date.now();
        if (currentTime >= (startPooling + poolingInterval)) {
            if (!device.isActivated() || device._.internalDev._.activating
                || device._.internalDev._.refreshing || device._.internalDev._.storage_refreshing) {
                startPooling = currentTime;
                return;
            }
            var storage = self._.queue.pop();
            while (storage !== null) {
                storage._.setProgressState(lib.StorageDispatcher.Progress.State.IN_PROGRESS);
                self._.onProgress(new lib.device.util.StorageDispatcher.Progress(storage));
                client._.sync_storage(storage, deliveryCallback, errorCallback, processCallback);
                storage = self._.queue.pop();
            }
            startPooling = currentTime;
        }
    });

    Object.defineProperty(this._, 'stop', {
        enumerable: false,
        configurable: false,
        writable: false,
        value: function () {
            sendMonitor.stop();
        }
    });

    startPooling = Date.now();
    sendMonitor.start();
};

lib.device.util.StorageDispatcher.prototype = Object.create(lib.StorageDispatcher);
lib.device.util.StorageDispatcher.constructor = lib.device.util.StorageDispatcher;

/**
 * Add a StorageObject to the queue to upload/download content to/from the Storage Cloud.
 *
 * @param {iotcs.StorageObject} storageObject - The content storageObject to be queued
 *
 * @memberof iotcs.device.util.StorageDispatcher.prototype
 * @function queue
 */
lib.device.util.StorageDispatcher.prototype.queue = function (storageObject) {
    _mandatoryArg(storageObject, lib.StorageObject);
    lib.StorageDispatcher.prototype.queue.call(this, storageObject);
};

/**
 * Cancel the transfer of content to or from storage.
 * This call has no effect if the transfer is completed, already cancelled, has failed, or the storageObject is not queued.
 *
 * @param {iotcs.StorageObject} storageObject - The content storageObject to be cancelled
 *
 * @memberof iotcs.device.util.StorageDispatcher.prototype
 * @function cancel
 */
lib.device.util.StorageDispatcher.prototype.cancel = function (storageObject) {
    _mandatoryArg(storageObject, lib.StorageObject);
    lib.StorageDispatcher.prototype.cancel.call(this, storageObject);
};

/**
 * An object for receiving progress via the ProgressCallback.
 *
 * @param {iotcs.StorageObject} storageObject - the storage object which progress will be tracked
 *
 * @class
 * @memberOf iotcs.device.util.StorageDispatcher
 * @alias Progress
 */
lib.device.util.StorageDispatcher.Progress = function (storageObject) {
    _mandatoryArg(storageObject, lib.StorageObject);
    lib.StorageDispatcher.Progress.call(this, storageObject);
};

lib.device.util.StorageDispatcher.Progress.prototype = Object.create(lib.StorageDispatcher.Progress);
lib.device.util.StorageDispatcher.Progress.constructor = lib.device.util.StorageDispatcher.Progress;

/**
 * Get the number of bytes transferred.
 * This can be compared to the length of content obtained by calling {@link iotcs.StorageObject#getLength}.
 *
 * @returns {number} the number of bytes transferred
 *
 * @memberof iotcs.device.util.StorageDispatcher.Progress.prototype
 * @function getBytesTransferred
 */
lib.device.util.StorageDispatcher.Progress.prototype.getBytesTransferred = function () {
    return lib.StorageDispatcher.Progress.prototype.getBytesTransferred.call(this);
};

/**
 * Get the state of the transfer
 *
 * @returns {iotcs.device.util.StorageDispatcher.Progress.State} the transfer state
 *
 * @memberof iotcs.device.util.StorageDispatcher.Progress.prototype
 * @function getState
 */
lib.device.util.StorageDispatcher.Progress.prototype.getState = function () {
    return lib.StorageDispatcher.Progress.prototype.getState.call(this);
};

/**
* Get the StorageObject that was queued for which this progress event pertains.
*
* @returns {iotcs.StorageObject} a StorageObject
*
* @memberof iotcs.device.util.StorageDispatcher.Progress.prototype
* @function getStorageObject
*/
lib.device.util.StorageDispatcher.Progress.prototype.getStorageObject = function () {
    return lib.StorageDispatcher.Progress.prototype.getStorageObject.call(this);
};

/**
 * Enumeration of progress state
 *
 * @memberOf iotcs.device.util.StorageDispatcher.Progress
 * @alias State
 * @readonly
 * @enum {String}
 */
lib.device.util.StorageDispatcher.Progress.State = {
    /** Up/download was cancelled before it completed */
    CANCELLED: "CANCELLED",
    /** Up/download completed successfully */
    COMPLETED: "COMPLETED",
    /** Up/download failed without completing */
    FAILED: "FAILED",
    /** Up/download is currently in progress */
    IN_PROGRESS: "IN_PROGRESS",
    /** Initial state */
    INITIATED: "INITIATED",
    /** Up/download is queued and not yet started */
    QUEUED: "QUEUED"
};

