enableEventListeners = (methods, namespace, ipcMainManager) => {
    Object.keys(methods).forEach((key) => ipcMainManager.handle(`${namespace}-${key}`, methods[key]));
};

module.exports = {
    enableEventListeners,
};
