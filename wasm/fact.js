

const importObject = { imports: { imported_func: (arg) => console.log(arg) } };

fast = {}

WebAssembly.instantiateStreaming(fetch("fact.wasm"), importObject).then(
  (obj) => fast = obj
).then(() => {

    console.log('hello world', fast.instance.exports.fac(10)); 

});

