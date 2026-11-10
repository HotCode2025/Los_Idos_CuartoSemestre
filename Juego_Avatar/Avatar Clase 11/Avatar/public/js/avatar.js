class Personaje {
  // Propiedades ESTATICAS: pertenecen a la clase, no a cada instancia
  static ATAQUES = ["Punio", "Patada", "Barrida"];
  static ATAQUE_VENCEDOR = {
    Punio: "Barrida",
    Patada: "Punio",
    Barrida: "Patada",
  };
  static ELEMENTOS = ["Fuego", "Agua", "Tierra", "Aire"];
  // Mismos colores que las variables --color-fuego, --color-agua, etc. del CSS:
  // se usan como borde del circulo del personaje dentro del mapa.
  static COLOR_ELEMENTO = {
    Fuego: "#e1592c",
    Agua: "#2c6e91",
    Tierra: "#6b8e4e",
    Aire: "#e8a93b",
  };

  // Permite crear objetos a partir de esta clase
  constructor({ id, nombre, foto = null, elemento = null, vidas = 3 } = {}) {
    this.id = id ?? nombre?.toLowerCase(); // se utiliza this siempre para acceder a un atributo o metodo dentro de la clase
    this.nombre = nombre;
    this.foto = foto; // ruta de la imagen que se mostrara en la tarjeta
    this.elemento = elemento;
    this.vidasIniciales = vidas; // para poder reiniciar sin recargar la pagina
    this.vidas = vidas;
    this.ataqueActual = null;

    // ---- Propiedades para el MAPA (canvas) ----
    this.x = 0;           // posicion horizontal dentro del canvas
    this.y = 0;           // posicion vertical dentro del canvas
    this.ancho = 80;      // tamano con el que se dibuja
    this.alto = 80;
    this.velocidadX = 0;  // pixeles que avanza en cada "tick" (negativo = izquierda)
    this.velocidadY = 0;  // negativo = arriba, positivo = abajo
    // Cada personaje carga su propia imagen UNA sola vez, no en cada dibujo
    this.imagenMapa = new Image();
    if (foto) this.imagenMapa.src = foto;
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

  // ---------- Comportamiento en el mapa ----------
  // Dibuja al personaje en su posicion actual, recortado en un circulo y con
  // un borde del color de su elemento (igual que en las tarjetas de seleccion).
  // Si la imagen aun no cargo (o fallo), no se dibuja nada y se reintenta
  // en el siguiente "tick".
  pintar(lienzo) {
    const imagen = this.imagenMapa;
    if (!imagen.complete || imagen.naturalWidth === 0) return;

    const radio = this.ancho / 2;
    const centroX = this.x + radio;
    const centroY = this.y + this.alto / 2;
    const grosorBorde = 4;

    // 1) Se recorta el lienzo con forma de circulo. save()/restore() hacen que
    //    el recorte afecte SOLO a este personaje y no a lo que se dibuje despues.
    lienzo.save();
    lienzo.beginPath();
    lienzo.arc(centroX, centroY, radio, 0, Math.PI * 2);
    lienzo.clip();

    // 2) Se toma de la foto un cuadrado centrado (equivale a object-fit: cover)
    //    para que no se deforme si la imagen no es cuadrada.
    const lado = Math.min(imagen.naturalWidth, imagen.naturalHeight);
    const origenX = (imagen.naturalWidth - lado) / 2;
    const origenY = (imagen.naturalHeight - lado) / 2;
    lienzo.drawImage(imagen, origenX, origenY, lado, lado, this.x, this.y, this.ancho, this.alto);
    lienzo.restore();

    // 3) Borde del color de su elemento, dibujado hacia adentro del circulo
    lienzo.beginPath();
    lienzo.arc(centroX, centroY, radio - grosorBorde / 2, 0, Math.PI * 2);
    lienzo.lineWidth = grosorBorde;
    lienzo.strokeStyle = Personaje.COLOR_ELEMENTO[this.elemento] ?? "#ffffff";
    lienzo.stroke();
  }

  // Suma la velocidad a la posicion, sin salirse de los bordes del canvas.
  moverEnMapa(anchoMapa, altoMapa) {
    this.x = Math.min(Math.max(0, this.x + this.velocidadX), anchoMapa - this.ancho);
    this.y = Math.min(Math.max(0, this.y + this.velocidadY), altoMapa - this.alto);
  }

  detenerMovimiento() {
    this.velocidadX = 0;
    this.velocidadY = 0;
  }

  // Colision entre circulos: se tocan cuando la distancia entre sus centros
  // es menor que la suma de sus radios. Asi el choque coincide con lo que se ve
  // (con rectangulos, las esquinas "invisibles" activaban el combate antes de tiempo).
  colisionaCon(otro) {
    const radio = this.ancho / 2;
    const radioOtro = otro.ancho / 2;
    const distanciaX = this.x + radio - (otro.x + radioOtro);
    const distanciaY = this.y + this.alto / 2 - (otro.y + otro.alto / 2);
    return Math.hypot(distanciaX, distanciaY) < radio + radioOtro;
  }

  // Crea una copia independiente con las vidas en su valor inicial.
  // Evita que "jugador" y "enemigo" terminen apuntando al MISMO
  // objeto (y compartiendo vidas) cuando coinciden en personaje.
  clonar() {
    return new Personaje({
      id: this.id,
      nombre: this.nombre,
      foto: this.foto, // el clon conserva la foto
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
  // Sirve tanto para 4 como para 100, o los que se necesiten.
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

// Roster de los personajes jugables.
// Cada uno lleva su "foto": el HTML de las tarjetas no se escribe a mano,
// se genera a partir de este array.
const ROSTER_JUGABLE = [
  new Personaje({ id: "zuko",   nombre: "Zuko",   foto: "./img/zuko.webp.jfif",   elemento: "Fuego"  }),
  new Personaje({ id: "katara", nombre: "Katara", foto: "./img/katara.webp.jfif", elemento: "Agua"   }),
  new Personaje({ id: "aang",   nombre: "Aang",   foto: "./img/aang.webp.jfif",   elemento: "Aire"   }),
  new Personaje({ id: "toph",   nombre: "Toph",   foto: "./img/toph.webp.jfif",   elemento: "Tierra" }),
  // Nuevos personajes
  new Personaje({ id: "sokka",  nombre: "Sokka",  foto: "./img/sokka.webp.jfif",  elemento: "Agua"   }),
  new Personaje({ id: "azula",  nombre: "Azula",  foto: "./img/azula.webp.jfif",  elemento: "Fuego"  }),
  // PARA AGREGAR OTRO PERSONAJE, SOLO SE SUMA UNA LINEA MAS ACA:
  // LA TARJETA APARECE SOLA EN EL HTML Y TOMA EL COLOR DE SU ELEMENTO.
];

// Variables que cambian durante la partida: los objetos jugador y enemigo
let jugador;
let enemigo;

// DECLARACION LENTA: los inputs de los personajes todavia no existen en este
// punto (los crea renderizarPersonajes()). Por eso se declaran aca con let
// y se asignan en iniciarJuego(), justo despues de crear las tarjetas.
let inputsPersonaje;

// Variables globales: se buscan una sola vez y se reutilizan en las funciones,
// ademas se evitan busquedas repetidas del DOM.
const seccionSeleccionarPersonaje = document.getElementById("seleccionar-personaje");
const seccionSeleccionarAtaque = document.getElementById("seleccionar-ataque");
const seccionReiniciar = document.getElementById("reiniciar");
const seccionReglas = document.getElementById("reglas");
const seccionMensajes = document.getElementById("mensajes");

// NUEVO: seccion del mapa y el canvas donde se dibuja
const seccionVerMapa = document.getElementById("ver-mapa");
const mapa = document.getElementById("mapa");

// NUEVO: el "contexto 2d" es el lienzo: con el dibujamos dentro del canvas.
// Trabajamos en 2 dimensiones: x crece hacia la derecha, y crece hacia abajo,
// con el origen (0,0) en la esquina superior izquierda.
let lienzo = mapa.getContext("2d");

// NUEVO: imagen de fondo del mapa. Se crea una sola vez y se redibuja en cada
// "tick" antes que los personajes, para que ellos queden por encima.
const imagenFondoMapa = new Image();
imagenFondoMapa.src = "./img/world_map.webp";

const botonReglas = document.getElementById("boton-reglas");
const botonPersonaje = document.getElementById("boton-personaje");
const botonReiniciar = document.getElementById("boton-reiniciar");
const botonesAtaque = document.querySelectorAll("[data-ataque]");
const botonesMovimiento = document.querySelectorAll("[data-direccion]");

const spanPersonajeJugador = document.getElementById("personaje-jugador");
const spanPersonajeEnemigo = document.getElementById("personaje-enemigo");
const spanVidasJugador = document.getElementById("vidas-jugador");
const spanVidasEnemigo = document.getElementById("vidas-enemigo");

// Contenedor donde se insertan las tarjetas de los personajes
const contenedorTarjetas = document.getElementById("contenedor-tarjetas");

// Recorre el roster y se crea una tarjeta (input + label) por personaje.
// data-elemento permite que el CSS coloree cada tarjeta segun su nacion.
// El HTML se arma completo y se escribe en el DOM UNA sola vez: con += dentro
// del forEach cada iteracion destruiria y recrearia los nodos anteriores.
function renderizarPersonajes() {
  let tarjetas = "";

  ROSTER_JUGABLE.forEach((personaje) => {
    tarjetas += `
      <input type="radio" name="personaje" id="${personaje.id}" data-elemento="${personaje.elemento}">
      <label for="${personaje.id}">
        <img src="${personaje.foto}" alt="${personaje.nombre}">
        <span>${personaje.nombre}</span>
      </label>
    `;
  });

  contenedorTarjetas.innerHTML = tarjetas;
}

function iniciarJuego() {
  // 1) Primero se crean las tarjetas...
  renderizarPersonajes();

  // 2) ...y recien ahora los inputs existen y se pueden capturar
  inputsPersonaje = Array.from(document.querySelectorAll('input[name="personaje"]'));

  mostrarElemento(seccionSeleccionarPersonaje);
  ocultarElemento(seccionSeleccionarAtaque);
  ocultarElemento(seccionVerMapa); // NUEVO: el mapa arranca oculto
  ocultarElemento(seccionReiniciar);
  ocultarElemento(seccionReglas);

  botonReglas.addEventListener("click", alternarReglas);
  botonPersonaje.addEventListener("click", seleccionarPersonajeJugador);
  botonReiniciar.addEventListener("click", reiniciarJuego);

  botonesAtaque.forEach((boton) => {
    boton.addEventListener("click", seleccionarAtaqueJugador);
  });

  // Botones de movimiento del mapa: al presionar se fija la velocidad y al
  // soltar se detiene. Se usan "pointer events" (en vez de mousedown/mouseup)
  // porque funcionan igual con mouse, dedo o lapiz. "pointerleave" y
  // "pointercancel" cubren el caso de arrastrar fuera del boton sin soltar.
  botonesMovimiento.forEach((boton) => {
    const mover = MOVIMIENTOS[boton.dataset.direccion];
    boton.addEventListener("pointerdown", mover);
    boton.addEventListener("pointerup", detenerMovimiento);
    boton.addEventListener("pointerleave", detenerMovimiento);
    boton.addEventListener("pointercancel", detenerMovimiento);
  });
  // El enemigo ya no se elige aqui: se elige en seleccionarPersonajeJugador(),
  // justo antes de abrir el mapa (asi siempre existe cuando el mapa lo necesita).
}

// "tipo" permite elegir como se muestra: "block" por defecto, o "flex"
// para las secciones que se centran con flexbox (como el mapa).
function mostrarElemento(elemento, tipo = "block") {
  elemento.style.display = tipo;
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
  // Se usa la variable capturada en iniciarJuego(), sin volver a buscar en el DOM
  const personajeSeleccionado = inputsPersonaje.find((input) => input.checked);

  if (!personajeSeleccionado) {
    mostrarErrorSeleccionPersonaje();
    return;
  }

  const plantilla = ROSTER_JUGABLE.find((p) => p.id === personajeSeleccionado.id);
  jugador = plantilla.clonar(); // clon: nunca comparte estado con el roster ni con el enemigo

  spanPersonajeJugador.textContent = jugador.nombre;

  ocultarElemento(seccionSeleccionarPersonaje);

  // Primero el enemigo y despues el mapa: iniciarMapa() necesita que
  // "enemigo" ya exista para ubicarlo y dibujarlo (si no, seria undefined).
  seleccionarPersonajeEnemigo();

  // Tras elegir personaje se pasa al mapa. El combate (seccionSeleccionarAtaque)
  // se muestra mas adelante, cuando el jugador alcanza al enemigo: ver iniciarCombate().
  iniciarMapa();
}

// ---------- MAPA: movimiento con las flechas ----------
const ANCHO_MAPA = 800;         // tamano del canvas (clase 11: 800 x 600)
const ALTO_MAPA = 600;
const VELOCIDAD_MAPA = 6;       // pixeles por "tick"
const INTERVALO_MAPA_MS = 50;   // cada cuanto se redibuja el canvas (20 veces por segundo)
let intervaloMapa = null;       // guarda el setInterval para poder detenerlo

// Devuelve un entero aleatorio entre min y max (ambos incluidos)
function enteroAleatorio(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Muestra el mapa, ubica a los dos personajes y activa teclado + dibujo continuo.
function iniciarMapa() {
  // Primero se define el tamano del canvas: lo que sigue (fondo, posicion
  // inicial del enemigo, limites de movimiento) usa mapa.width y mapa.height.
  mapa.width = ANCHO_MAPA;
  mapa.height = ALTO_MAPA;

  mostrarElemento(seccionVerMapa, "flex");

  // El jugador aparece arriba a la izquierda
  jugador.x = 20;
  jugador.y = 40;
  jugador.detenerMovimiento();

  // El enemigo aparece en un punto al azar, pero nunca encima del jugador
  do {
    enemigo.x = enteroAleatorio(0, mapa.width - enemigo.ancho);
    enemigo.y = enteroAleatorio(0, mapa.height - enemigo.alto);
  } while (jugador.colisionaCon(enemigo));

  window.addEventListener("keydown", presionarTecla);
  window.addEventListener("keyup", soltarTecla);

  pintarCanvas(); // primer dibujo inmediato
  intervaloMapa = setInterval(pintarCanvas, INTERVALO_MAPA_MS);
}

// Dibuja el fondo ajustado al tamano del canvas. Si la imagen aun no cargo
// (o no se encuentra), el mapa queda sin fondo y el juego sigue funcionando.
function pintarFondoMapa() {
  if (imagenFondoMapa.complete && imagenFondoMapa.naturalWidth > 0) {
    lienzo.drawImage(imagenFondoMapa, 0, 0, mapa.width, mapa.height);
  }
}

// Se ejecuta en cada "tick": mueve, limpia el lienzo, redibuja y revisa el choque.
function pintarCanvas() {
  jugador.moverEnMapa(mapa.width, mapa.height);

  lienzo.clearRect(0, 0, mapa.width, mapa.height); // borra el cuadro anterior
  pintarFondoMapa();                               // primero el fondo...
  enemigo.pintar(lienzo);                          // ...y encima los personajes
  jugador.pintar(lienzo);

  if (jugador.colisionaCon(enemigo)) {
    iniciarCombate();
  }
}

// ---------- Funciones de movimiento ----------
// Estas funciones NO dibujan: solo cambian la velocidad del personaje.
// El dibujo lo hace pintarCanvas() en cada tick del setInterval, y es ahi
// donde la velocidad se suma a la posicion. Asi el movimiento es continuo
// mientras el boton (o la tecla) siga presionado.
function moverArriba() {
  jugador.velocidadY = -VELOCIDAD_MAPA; // negativo: el eje y crece hacia abajo
}

function moverAbajo() {
  jugador.velocidadY = VELOCIDAD_MAPA;
}

function moverIzquierda() {
  jugador.velocidadX = -VELOCIDAD_MAPA;
}

function moverDerecha() {
  jugador.velocidadX = VELOCIDAD_MAPA;
}

// Pasa la velocidad a cero: el personaje se queda quieto
function detenerMovimiento() {
  jugador?.detenerMovimiento(); // "?." evita error si aun no hay jugador
}

// Relaciona el data-direccion de cada boton con su funcion de movimiento
const MOVIMIENTOS = {
  arriba: moverArriba,
  abajo: moverAbajo,
  izquierda: moverIzquierda,
  derecha: moverDerecha,
};

// Al presionar una flecha se llama a la misma funcion que usa el boton
// correspondiente; el personaje sigue moviendose hasta que se suelta la tecla.
function presionarTecla(evento) {
  switch (evento.key) {
    case "ArrowUp":
      moverArriba();
      break;
    case "ArrowDown":
      moverAbajo();
      break;
    case "ArrowLeft":
      moverIzquierda();
      break;
    case "ArrowRight":
      moverDerecha();
      break;
    default:
      return; // otras teclas: no se hace nada
  }
  evento.preventDefault(); // evita que la pagina haga scroll con las flechas
}

// Al soltar la tecla, solo se detiene el eje correspondiente
function soltarTecla(evento) {
  switch (evento.key) {
    case "ArrowUp":
    case "ArrowDown":
      jugador.velocidadY = 0;
      break;
    case "ArrowLeft":
    case "ArrowRight":
      jugador.velocidadX = 0;
      break;
  }
}

// Detiene el mapa (intervalo + teclado) y vuelve al juego principal de ataques.
function iniciarCombate() {
  clearInterval(intervaloMapa);
  window.removeEventListener("keydown", presionarTecla);
  window.removeEventListener("keyup", soltarTecla);
  jugador.detenerMovimiento();

  ocultarElemento(seccionVerMapa);
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