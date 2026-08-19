let ataqueJugador;
let ataqueEnemigo;
let vidasJugador = 3;
let vidasEnemigo = 3;

function iniciarJuego() {
  // Ocultar secciones que no deben verse al inicio
  document.getElementById("seleccionar-ataque").style.display = "none";
  document.getElementById("reiniciar").style.display = "none";
  document.getElementById("reglas").style.display = "none";

  // Botón para mostrar/ocultar reglas
  document.getElementById("boton-reglas").addEventListener("click", alternarReglas);

  document.getElementById("boton-personaje").addEventListener("click", seleccionarPersonajeJugador);

  document.getElementById("boton-punio").addEventListener("click", ataquePunio);
  document.getElementById("boton-patada").addEventListener("click", ataquePatada);
  document.getElementById("boton-barrida").addEventListener("click", ataqueBarrida);

  document.getElementById("boton-reiniciar").addEventListener("click", reiniciarJuego);

  seleccionarPersonajeEnemigo();
}

function alternarReglas() {
  let reglas = document.getElementById("reglas");
  let boton = document.getElementById("boton-reglas");

  if (reglas.style.display === "none") {
    reglas.style.display = "block";
    boton.innerHTML = "📜 Ocultar reglas";
  } else {
    reglas.style.display = "none";
    boton.innerHTML = "📜 Mostrar reglas";
  }
}

function seleccionarPersonajeJugador() {
  let inputZuko   = document.getElementById("zuko");
  let inputKatara = document.getElementById("katara");
  let inputAang   = document.getElementById("aang");
  let inputToph   = document.getElementById("toph");

  if (!inputZuko.checked && !inputKatara.checked && !inputAang.checked && !inputToph.checked) {
    let mensajeError = document.createElement("p");
    mensajeError.innerHTML = "Selecciona un personaje";
    mensajeError.style.color = "red";

    let seccionSeleccionarPersonaje = document.getElementById("seleccionar-personaje");
    seccionSeleccionarPersonaje.appendChild(mensajeError);

    setTimeout(() => {
      seccionSeleccionarPersonaje.removeChild(mensajeError);
    }, 2000);

    return; 
  }

  // Mostrar el nombre del personaje elegido
  let spanPersonajeJugador = document.getElementById("personaje-jugador");

  if (inputZuko.checked) {
    spanPersonajeJugador.innerHTML = "Zuko";
  } else if (inputKatara.checked) {
    spanPersonajeJugador.innerHTML = "Katara";
  } else if (inputAang.checked) {
    spanPersonajeJugador.innerHTML = "Aang";
  } else if (inputToph.checked) {
    spanPersonajeJugador.innerHTML = "Toph";
  }

  // Ocultar selección de personaje y mostrar selección de ataque
  document.getElementById("seleccionar-personaje").style.display = "none";
  document.getElementById("seleccionar-ataque").style.display = "block";
}

function seleccionarPersonajeEnemigo() {
  let personajeAleatorio = aleatoria(1, 4);
  let spanPersonajeEnemigo = document.getElementById("personaje-enemigo");

  if (personajeAleatorio === 1) {
    spanPersonajeEnemigo.innerHTML = "Zuko";
  } else if (personajeAleatorio === 2) {
    spanPersonajeEnemigo.innerHTML = "Katara";
  } else if (personajeAleatorio === 3) {
    spanPersonajeEnemigo.innerHTML = "Aang";
  } else {
    spanPersonajeEnemigo.innerHTML = "Toph";
  }
}

function ataquePunio() {
  ataqueJugador = "Punio";
  ataqueAleatorioEnemigo();
}

function ataquePatada() {
  ataqueJugador = "Patada";
  ataqueAleatorioEnemigo();
}

function ataqueBarrida() {
  ataqueJugador = "Barrida";
  ataqueAleatorioEnemigo();
}

function ataqueAleatorioEnemigo() {
  let ataqueAleatorio = aleatoria(1, 3);

  if (ataqueAleatorio === 1) {
    ataqueEnemigo = "Punio";
  } else if (ataqueAleatorio === 2) {
    ataqueEnemigo = "Patada";
  } else {
    ataqueEnemigo = "Barrida";
  }

  combate();
}

function combate() {
  let spanVidasJugador = document.getElementById("vidas-jugador");
  let spanVidasEnemigo = document.getElementById("vidas-enemigo");

  if (ataqueJugador === ataqueEnemigo) {
    crearMensaje("EMPATE");
  } else if (ataqueJugador === "Punio"   && ataqueEnemigo === "Barrida") {
    crearMensaje("GANASTE ✊🏼 > 🦵🏼");
    vidasEnemigo--;
    spanVidasEnemigo.innerHTML = vidasEnemigo;
  } else if (ataqueJugador === "Patada"  && ataqueEnemigo === "Punio") {
    crearMensaje("GANASTE 🦶🏼 > ✊🏼");
    vidasEnemigo--;
    spanVidasEnemigo.innerHTML = vidasEnemigo;
  } else if (ataqueJugador === "Barrida" && ataqueEnemigo === "Patada") {
    crearMensaje("GANASTE 🦵🏼 > 🦶🏼");
    vidasEnemigo--;
    spanVidasEnemigo.innerHTML = vidasEnemigo;
  } else {
    crearMensaje("PERDISTE");
    vidasJugador--;
    spanVidasJugador.innerHTML = vidasJugador;
  }

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
  // Mostrar botón de reinicio
  document.getElementById("reiniciar").style.display = "block";

  // Agregar mensaje final
  let parrafo = document.createElement("p");
  parrafo.innerHTML = resultado;
  document.getElementById("mensajes").appendChild(parrafo);

  // Deshabilitar botones de ataque
  document.getElementById("boton-punio").disabled   = true;
  document.getElementById("boton-patada").disabled  = true;
  document.getElementById("boton-barrida").disabled = true;
}

function crearMensaje(resultado) {
  let sectionMensaje = document.getElementById("mensajes");
  let parrafo = document.createElement("p");

  parrafo.innerHTML =
    "Tu ataque: " + ataqueJugador +
    " | Ataque enemigo: " + ataqueEnemigo +
    " → " + resultado;

  sectionMensaje.appendChild(parrafo);
}

function reiniciarJuego() {
  location.reload();
}

function aleatoria(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

window.addEventListener("load", iniciarJuego);