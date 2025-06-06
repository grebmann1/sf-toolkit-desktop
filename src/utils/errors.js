const encodeError = (errors) => {
    // we only handle 1 error for now !! (we could send an array, that's not a problem !)
    console.error(errors);
    let e = [].concat(errors)[0];
    let res = { name: e.name, message: e.message };
    
    return res;
};

module.exports = { encodeError };
