/**
 * Copyright (c) 2017, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * ExternalObject represents the value of a URI type in a device model.
 * The application is responsible for uploading/downloading the content referred to by the URI.
 *
 * @param {String} uri - the URI
 *
 * @class
 * @memberOf iotcs
 * @alias ExternalObject
 */
lib.ExternalObject = function (uri) {
    _optionalArg(uri, "string");

    Object.defineProperty(this, '_',{
        enumerable: false,
        configurable: false,
        writable: false,
        value: {}
    });

    Object.defineProperty(this._, 'internal',{
        enumerable: false,
        configurable: true,
        writable: false,
        value: {
            uri: uri || null
        }
    });
};

/**
 * Get the URI value.
 *
 * @returns {String} URI
 * @memberof iotcs.ExternalObject.prototype
 * @function getURI
 */
lib.ExternalObject.prototype.getURI = function () {
    return this._.internal.uri;
};
