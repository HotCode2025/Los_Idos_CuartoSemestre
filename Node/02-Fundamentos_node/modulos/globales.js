// this === global = true

//Mostrar algo en consola
// console.log();

//Mostrar un mensaje en forma de error
//console.error();

//Ejecutar un código de intervalo de tiempo
//setTimeout(() => {});

//Ejecuta un código de intervalo de tiempo
//setInterval(() => {});

//Da prioridad de ejecución a una función asincronica
// setImmediate(() => {});

// console.log(setInterval);

let i = 0;
let intervalo = setInterval(() => {
    console.log('Hola');
    if (i === 3) {
        clearInterval(intervalo); //detenemos la funcion
    }
    i++;
}, 1000);

setImmediate(() => {
    console.log('Saludo inmediato');
});

//require();

console.log(__filename);
// console.log(__dirname);

global.miVariable = 'Mi variable global';
console.log(miVariable);