const PERSONAJES = ["Zuko", "Katara", "Aang", "Toph"];
const ATAQUES = ["Punio", "Patada", "Barrida"];
const ATAQUE_VENCEDOR = {
  Punio: "Barrida",
  Patada: "Punio",
  Barrida: "Patada",
};

let ataqueJugador;
let ataqueEnemigo;
let vidasJugador = 3;
let vidasEnemigo = 3;

// Referencias globales: se buscan una sola vez y se reutilizan en las funciones.
const seccionSeleccionarPersonaje = document.getElementById("seleccionar-personaje");
const seccionSeleccionarAtaque = document.getElementById("seleccionar-ataque");
const seccionReiniciar = document.getElementById("reiniciar");
const seccionReglas = document.getElementById("reglas");
const seccionMensajes = document.getElementById("mensajes");

const botonReglas = document.getElementById("boton-reglas");
const botonPersonaje = document.getElementById("boton-personaje");
const botonReiniciar = document.getElementById("boton-reiniciar");
const botonesAtaque = document.querySelectorAll("[data-ataque]");

const spanPersonajeJugador = document.getElementById("personaje-jugador");
const spanPersonajeEnemigo = document.getElementById("personaje-enemigo");
const spanVidasJugador = document.getElementById("vidas-jugador");
const spanVidasEnemigo = document.getElementById("vidas-enemigo");

function iniciarJuego() {
  ocultarElemento(seccionSeleccionarAtaque);
  ocultarElemento(seccionReiniciar);
  ocultarElemento(seccionReglas);

  botonReglas.addEventListener("click", alternarReglas);
  botonPersonaje.addEventListener("click", seleccionarPersonajeJugador);
  botonReiniciar.addEventListener("click", reiniciarJuego);

  botonesAtaque.forEach((boton) => {
    boton.addEventListener("click", seleccionarAtaqueJugador);
  });

  seleccionarPersonajeEnemigo();
}

//Se pueden utilizar para cualquier elemento, por eso se pasan como parámetro.
function mostrarElemento(elemento) {
  elemento.style.display = "block";
}

function ocultarElemento(elemento) {
  elemento.style.display = "none";
}

function alternarReglas() {
  const reglasOcultas = seccionReglas.style.display === "none";
  seccionReglas.style.display = reglasOcultas ? "block" : "none";
  botonReglas.textContent = reglasOcultas
    ? "📜 Ocultar reglas"
    : "📜 Mostrar reglas";
}

// Obtenemos el nombre del jugador con el querySelector, solo se hace 1 vez y con eso se reutiliza en las funciones, por eso tenemos el convertirPrimeraLetraEnMayuscula para que se vea en mayúsculas.
function seleccionarPersonajeJugador() {
  const personajeSeleccionado = document.querySelector('input[name="personaje"]:checked');

  if (!personajeSeleccionado) {
    mostrarErrorSeleccionPersonaje();
    return;
  }

  spanPersonajeJugador.textContent = convertirPrimeraLetraEnMayuscula(personajeSeleccionado.id);
  ocultarElemento(seccionSeleccionarPersonaje);
  mostrarElemento(seccionSeleccionarAtaque);
}

function mostrarErrorSeleccionPersonaje() {
  const mensajeError = document.createElement("p");
  mensajeError.textContent = "Selecciona un personaje";
  mensajeError.style.color = "red";
  seccionSeleccionarPersonaje.appendChild(mensajeError);

  setTimeout(() => mensajeError.remove(), 2000);
}

function convertirPrimeraLetraEnMayuscula(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function seleccionarPersonajeEnemigo() {
  spanPersonajeEnemigo.textContent = obtenerElementoAleatorio(PERSONAJES);
}

function seleccionarAtaqueJugador(evento) {
  ataqueJugador = evento.currentTarget.dataset.ataque;
  ataqueAleatorioEnemigo();
}

function ataqueAleatorioEnemigo() {
  ataqueEnemigo = obtenerElementoAleatorio(ATAQUES);
  combate();
}

function combate() {
  let resultado;

  if (ataqueJugador === ataqueEnemigo) {
    resultado = "EMPATE";
  } else if (ATAQUE_VENCEDOR[ataqueJugador] === ataqueEnemigo) {
    resultado = "GANASTE";
    vidasEnemigo--;
    spanVidasEnemigo.textContent = vidasEnemigo;
  } else {
    resultado = "PERDISTE";
    vidasJugador--;
    spanVidasJugador.textContent = vidasJugador;
  }

  crearMensaje(resultado);
  revisarVidas();
}

function revisarVidas() {
  if (vidasEnemigo === 0) {
    crearMensajeFinal("¡FELICITACIONES! ¡HAS GANADO! 🎉✨😁");
  } else if (vidasJugador === 0) {
    crearMensajeFinal("¡QUÉ PENA! HAS PERDIDO 😓");
  }
}

function crearMensajeFinal(resultado) {
  mostrarElemento(seccionReiniciar);
  agregarMensaje(resultado);

  botonesAtaque.forEach((boton) => {
    boton.disabled = true;
  });
}

function crearMensaje(resultado) {
  agregarMensaje(`Tu ataque: ${ataqueJugador} | Ataque enemigo: ${ataqueEnemigo} → ${resultado}`);
}

function agregarMensaje(texto) {
  const parrafo = document.createElement("p");
  parrafo.textContent = texto;
  seccionMensajes.appendChild(parrafo);
}

function reiniciarJuego() {
  location.reload();
}


// Función para obtener un elemento aleatorio de un array antes se usaba Math.random() directamente en dos funciones, pero se creó esta para reutilizarla para personajes y ataques aleatorios.
function obtenerElementoAleatorio(elementos) {
  const indiceAleatorio = Math.floor(Math.random() * elementos.length);
  return elementos[indiceAleatorio];
}

iniciarJuego();
