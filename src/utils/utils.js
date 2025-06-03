const hashCode = (str) => {
    let hash = 0;
    for (let i = 0, len = str.length; i < len; i++) {
        let chr = str.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};

const buffer = {};
function runActionAfterTimeOut(value, action, { timeout = 300 } = {}) {
    if (buffer._clearBufferId) {
        clearTimeout(buffer._clearBufferId);
    }
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    buffer._clearBufferId = setTimeout(() => {
        action(value);
    }, timeout);
    return buffer._clearBufferId;
}

const isNotUndefinedOrNull = (value) => {   
    return value !== undefined && value !== null;
};

const isEmpty = (value) => {
    return value === undefined || value === null || value === '';
};

/**
 * Returns a promise that resolves or rejects with the given promise, or rejects with a timeout error after the specified ms.
 * @param {Promise} promise - The promise to race against the timeout.
 * @param {number} ms - Timeout in milliseconds.
 * @param {string} [errorMessage] - Optional error message for timeout.
 * @returns {Promise}
 */
function promiseWithTimeout(promise, ms, errorMessage = 'Timeout exceeded') {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
            reject(new Error(errorMessage));
        }, ms);
    });
    return Promise.race([
        promise.finally(() => clearTimeout(timeoutId)),
        timeoutPromise
    ]);
}

function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }

    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

module.exports = { hashCode, runActionAfterTimeOut, isNotUndefinedOrNull, isEmpty, promiseWithTimeout,guid };
