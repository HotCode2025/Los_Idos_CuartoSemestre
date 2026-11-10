class Personaje {
  // Propiedades ESTATICAS: pertenecen a la clase, no a cada instancia
  static ATAQUES = ["Punio", "Patada", "Barrida"];
  static ATAQUE_VENCEDOR = {
    Punio: "Barrida",
    Patada: "Punio",
    Barrida: "Patada",
  };
  static ELEMENTOS = ["Fuego", "Agua", "Tierra", "Aire"];

  //Permite crear objetos a partir de esta clase
  constructor({ id, nombre, elemento = null, vidas = 3 } = {}) {
    this.id = id ?? nombre?.toLowerCase(); //se utiliza this siempre para acceder a un atributo o metodo dentro de la clase
    this.nombre = nombre;
    this.elemento = elemento;
    this.vidasIniciales = vidas; // para poder reiniciar sin recargar la pagina
    this.vidas = vidas;
    this.ataqueActual = null;
  }

  // Comportamiento (metodos de instancia)
  elegirAtaque(ataque) {
    this.ataqueActual = ataque;
    return this.ataqueActual;
  }

  elegirAtaqueAleatorio() {
    return this.elegirAtaque(Personaje.aleatorio(Personaje.ATAQUES));
  }

  // Mi ataque actual le gana al ataque actual de "otro"?
  venceA(otro) {
    return Personaje.ATAQUE_VENCEDOR[this.ataqueActual] === otro.ataqueActual;
  }

  recibirDano(cantidad = 1) {
    this.vidas = Math.max(0, this.vidas - cantidad);
    return this.vidas;
  }

  estaDerrotado() {
    return this.vidas <= 0;
  }

  // Crea una copia independiente con las vidas en su valor inicial.
  // Evita que "jugador" y "enemigo" terminen apuntando al MISMO
  // objeto (y compartiendo vidas) cuando coinciden en personaje.
  clonar() {
    return new Personaje({
      id: this.id,
      nombre: this.nombre,
      elemento: this.elemento,
      vidas: this.vidasIniciales,
    });
  }

  // ---------- Utilidades estaticas ----------
  static aleatorio(lista) {
    const indice = Math.floor(Math.random() * lista.length);
    return lista[indice];
  }

  // FABRICA: genera "cantidad" personajes distintos de una sola vez.
  // Sirve tanto para 4 como para 100, 1000 o los que se necesiten.
  static generarLote(cantidad, { vidasMin = 2, vidasMax = 5 } = {}) {
    const lote = [];
    for (let i = 1; i <= cantidad; i++) {
      lote.push(new Personaje({
        id: `npc-${i}`,
        nombre: `Guerrero #${i}`,
        elemento: Personaje.aleatorio(Personaje.ELEMENTOS),
        vidas: Math.floor(Math.random() * (vidasMax - vidasMin + 1)) + vidasMin,
      }));
    }
    return lote;
  }
}

// Roster de los 4 personajes jugables (mismos id que el HTML)
const ROSTER_JUGABLE = [
  new Personaje({ id: "zuko",   nombre: "Zuko",   elemento: "Fuego"  }),
  new Personaje({ id: "katara", nombre: "Katara", elemento: "Agua"   }),
  new Personaje({ id: "aang",   nombre: "Aang",   elemento: "Aire"   }),
  new Personaje({ id: "toph",   nombre: "Toph",   elemento: "Tierra" }),
  //Nuevos personajes
  new Personaje({ id: "sokka",  nombre: "Sokka",  elemento: "Agua"   }), // Nuevo personajes creado
  new Personaje({ id: "azula",  nombre: "Azula",  elemento: "Fuego"  }), // Nuevo personaje creado, y de esta manera 
  // se pueden crear tantos personajes como se quiera
  
];

// Ahora solo hay 2 variables que cambian durante la partida:
// los objetos jugador y enemigo, cada uno con su propio estado.
let jugador;
let enemigo;

// Variables globales: se buscan una sola vez y se reutilizan en las funciones,
// ademas se evitan busquedas repetidas del DOM.
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

  mostrarElemento(seccionSeleccionarPersonaje);
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

function seleccionarPersonajeJugador() {
  const personajeSeleccionado = document.querySelector('input[name="personaje"]:checked');

  if (!personajeSeleccionado) {
    mostrarErrorSeleccionPersonaje();
    return;
  }

  const plantilla = ROSTER_JUGABLE.find((p) => p.id === personajeSeleccionado.id);
  jugador = plantilla.clonar(); // clon: nunca comparte estado con el roster ni con el enemigo

  spanPersonajeJugador.textContent = jugador.nombre;

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

function seleccionarPersonajeEnemigo() {
  enemigo = Personaje.aleatorio(ROSTER_JUGABLE).clonar();
  spanPersonajeEnemigo.textContent = enemigo.nombre;
}

function seleccionarAtaqueJugador(evento) {
  jugador.elegirAtaque(evento.currentTarget.dataset.ataque);
  ataqueAleatorioEnemigo();
}

function ataqueAleatorioEnemigo() {
  enemigo.elegirAtaqueAleatorio();
  combate();
}

function combate() {
  let resultado;

  if (jugador.ataqueActual === enemigo.ataqueActual) {
    resultado = "EMPATE";
  } else if (jugador.venceA(enemigo)) {
    resultado = "GANASTE";
    enemigo.recibirDano();
    spanVidasEnemigo.textContent = enemigo.vidas;
  } else {
    resultado = "PERDISTE";
    jugador.recibirDano();
    spanVidasJugador.textContent = jugador.vidas;
  }

  crearMensaje(resultado);
  revisarVidas();
}

function revisarVidas() {
  if (enemigo.estaDerrotado()) {
    crearMensajeFinal("FELICITACIONES! HAS GANADO! 🎉✨😁");
  } else if (jugador.estaDerrotado()) {
    crearMensajeFinal("QUÉ PENA! HAS PERDIDO 😓");
  }
}

function crearMensajeFinal(resultado) {
  ocultarElemento(seccionSeleccionarAtaque);
  mostrarElemento(seccionReiniciar);
  agregarMensaje(resultado);

  // Se inhabilitan todos los botones anteriores para que no se pueda
  // seguir jugando la misma partida.
  botonesAtaque.forEach((boton) => {
    boton.disabled = true;
  });
  botonPersonaje.disabled = true;
  botonReglas.disabled = true;
}

function crearMensaje(resultado) {
  agregarMensaje(`Tu ataque: ${jugador.ataqueActual} | Ataque enemigo: ${enemigo.ataqueActual} → ${resultado}`);
}

function agregarMensaje(texto) {
  const parrafo = document.createElement("p");
  parrafo.textContent = texto;
  seccionMensajes.appendChild(parrafo);
}

function reiniciarJuego() {
  location.reload();
}

iniciarJuego();

/* ==========================================================
   Ejemplo de uso de la fabrica de personajes (POO):
   descomentar para generar un lote y verlo en consola.*/

   const cienPersonajes = Personaje.generarLote(100);
   const milPersonajes   = Personaje.generarLote(1000);
   console.log(cienPersonajes);
   
