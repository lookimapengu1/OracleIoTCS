/**
 * Copyright (c) 2017, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * StorageObject provides information about content in cloud storage.
 * For creation use {@link iotcs.device.util.DirectlyConnectedDevice#createStorageObject}
 *
 * @param {?String} uri - the full URI of the object in the Storage Cloud
 * @param {?String} name - name of the object used in the Storage Cloud
 * @param {?String} type - type of the object, if <code>null</code> then {@link iotcs.StorageObject.MIME_TYPE}
 * @param {?String} encoding - encoding of the object, or <code>null</code> if none
 * @param {?Date} date - last-modified date of the object
 * @param {number} [length = -1] - length of the object
 *
 * @class
 * @memberOf iotcs
 * @alias StorageObject
 * @extends iotcs.ExternalObject
 */
lib.StorageObject = function (uri, name, type, encoding, date, length) {
    _optionalArg(uri, 'string');
    _optionalArg(name, 'string');
    _optionalArg(type, 'string');
    _optionalArg(encoding, 'string');
    _optionalArg(date, Date);
    _optionalArg(length, 'number');

    lib.ExternalObject.call(this, uri);

    var spec = {
        name: name || null,
        type: type || lib.StorageObject.MIME_TYPE,
        encoding: encoding || null,
        date: date || null,
        length: length || -1
    };
    var self = this;

    Object.defineProperties(this._.internal, {
        name: {
            value: spec.name,
            enumerable: true,
            writable: true
        },
        type: {
            value: spec.type,
            enumerable: true,
            writable: true
        },
        inputStream: {
            value: null,
            enumerable: true,
            writable: true
        },
        outputStream: {
            value: null,
            enumerable: true,
            writable: true
        },
        encoding: {
            value: spec.encoding,
            enumerable: true,
            writable: true
        },
        date: {
            value: spec.date,
            enumerable: true,
            writable: true
        },
        length: {
            value: spec.length,
            enumerable: true,
            writable: true
        },
        progress_state: {
            value: lib.StorageDispatcher.Progress.State.INITIATED,
            enumerable: true,
            writable: true
        }
    });

    Object.defineProperty(this._, 'dcd',{
        enumerable: false,
        configurable: false,
        writable: true,
        value: null
    });

    Object.defineProperty(this._, 'setDevice',{
        enumerable: false,
        configurable: false,
        writable: true,
        value: function (device) {
            if (device instanceof lib.device.util.DirectlyConnectedDevice) {
                self._.dcd = device;
            } else {
                lib.error("Invalid device type");
            }
        }
    });

    Object.defineProperty(this._, 'setMetadata',{
        enumerable: false,
        configurable: false,
        writable: false,
        value: function (date, length) {
            self._.internal.date = date;
            self._.internal.length = length;
        }
    });

    Object.defineProperty(this._, 'setURI',{
        enumerable: false,
        configurable: false,
        writable: false,
        value: function (uri) {
            self._.internal.uri = uri;
        }
    });

    Object.defineProperty(this._, 'setProgressState',{
        enumerable: false,
        configurable: false,
        writable: false,
        value: function (state) {
            self._.internal.progress_state = state;
        }
    });

    Object.defineProperty(this._, 'isCancelled',{
        enumerable: false,
        configurable: false,
        writable: false,
        value: function () {
            return (self._.internal.progress_state === lib.StorageDispatcher.Progress.State.CANCELLED);
        }
    });
};

lib.StorageObject.prototype = Object.create(lib.ExternalObject.prototype);
lib.StorageObject.constructor = lib.StorageObject;

/**
 * Set an input stream for content to be uploaded.
 * The implementation allows for either the input stream to be set,
 * or the output stream to be set, but not both.
 * If the input stream parameter is not null, the output stream will be set to null.
 *
 * @param {stream.Readable} stream - readable stream to which the content will be read.
 *
 * @memberof iotcs.StorageObject.prototype
 * @function setInputStream
 */
lib.StorageObject.prototype.setInputStream = function (stream) {
    _mandatoryArg(stream, require('stream').Readable);
    switch (this._.internal.progress_state) {
        case lib.StorageDispatcher.Progress.State.QUEUED:
        case lib.StorageDispatcher.Progress.State.IN_PROGRESS:
            lib.error("Can't set input stream during transfer process.");
            return;
        case lib.StorageDispatcher.Progress.State.COMPLETED:
            this._.internal.progress_state = lib.StorageDispatcher.Progress.INITIATED;
    }
    this._.internal.inputStream = stream;
    this._.internal.outputStream = null;
};

/**
 * Set an output stream for content to be downloaded.
 * The implementation allows for either the output stream to be set,
 * or the input stream to be set, but not both.
 * If the output stream parameter is not null, the input stream will be set to null.
 *
 * @param {stream.Writable} stream - writable stream to which the content will be written.
 *
 * @memberof iotcs.StorageObject.prototype
 * @function setOutputStream
 */
lib.StorageObject.prototype.setOutputStream = function (stream) {
    _mandatoryArg(stream, require('stream').Writable);
    switch (this._.internal.progress_state) {
        case lib.StorageDispatcher.Progress.State.QUEUED:
        case lib.StorageDispatcher.Progress.State.IN_PROGRESS:
            lib.error("Can't set output stream during transfer process.");
            return;
        case lib.StorageDispatcher.Progress.State.COMPLETED:
            this._.internal.progress_state = lib.StorageDispatcher.Progress.INITIATED;
    }
    this._.internal.outputStream = stream;
    this._.internal.inputStream = null;
};

/**
 * Get the the name of this object in the storage cloud.
 * This is name and path of the file that was uploaded to the storage cloud.
 *
 * @returns {String} name
 * @memberof iotcs.StorageObject.prototype
 * @function getName
 */
lib.StorageObject.prototype.getName = function () {
    return this._.internal.name;
};

/**
 * Get the mime-type of the content.
 *
 * @returns {String} type
 * @see {@link http://www.iana.org/assignments/media-types/media-types.xhtml|IANA Media Types}
 * @memberof iotcs.StorageObject.prototype
 * @function getType
 */
lib.StorageObject.prototype.getType = function () {
    return this._.internal.type;
};

/**
 * Get the date and time the content was created or last modified in cloud storage.
 *
 * @returns {?Date} date the content was last modified in cloud storage,
 * or <code>null</code> if the content has not been uploaded
 * @memberof iotcs.StorageObject.prototype
 * @function getDate
 */
lib.StorageObject.prototype.getDate = function () {
    return this._.internal.date;
};

/**
 * Get the length of the content in bytes.
 * This is the number of bytes required to upload or download the content.
 *
 * @returns {number} the length of the content in bytes, or <code>-1</code> if unknown
 * @memberof iotcs.StorageObject.prototype
 * @function getLength
 */
lib.StorageObject.prototype.getLength = function () {
    return this._.internal.length;
};

/**
 * Get the compression scheme of the content.
 *
 * @returns {?String} the compression scheme of the content,
 * or <code>null</code> if the content is not compressed
 * @memberof iotcs.StorageObject.prototype
 * @function getEncoding
 */
lib.StorageObject.prototype.getEncoding = function () {
    return this._.internal.encoding;
};

/**
 * Get the URI value.
 *
 * @returns {?String} URI, or <code>null</code> if unknown
 * @memberof iotcs.StorageObject.prototype
 * @function getURI
 */
lib.StorageObject.prototype.getURI = function () {
    return this._.internal.uri;
};

/**
 * Get the input file path when uploading content.
 *
 * @returns {?stream.Readable} input stream, or <code>null</code> if not set
 * @memberof iotcs.StorageObject.prototype
 * @function getInputStream
 */
lib.StorageObject.prototype.getInputStream = function () {
    return this._.internal.inputStream;
};

/**
 * Get the output file path when downloading content.
 *
 * @returns {?stream.Writable} output stream, or <code>null</code> if not set
 * @memberof iotcs.StorageObject.prototype
 * @function getOutputStream
 */
lib.StorageObject.prototype.getOutputStream = function () {
    return this._.internal.outputStream;
};

/**
 * Synchronize content with the Storage Cloud Service.
 *
 * @param {function(storage, error)} callback - the callback function.
 *
 * @memberof iotcs.StorageObject.prototype
 * @function sync
 */
lib.StorageObject.prototype.sync = function (callback) {
    _mandatoryArg(callback, 'function');
    this._.dcd._.sync_storage(this, callback, callback);
};

/**
 * @constant MIME_TYPE
 * @memberOf iotcs.StorageObject
 * @type {String}
 * @default "application/octet-stream"
 */
Object.defineProperty(lib.StorageObject, 'MIME_TYPE',{
    enumerable: false,
    configurable: false,
    writable: false,
    value: "application/octet-stream"
});
