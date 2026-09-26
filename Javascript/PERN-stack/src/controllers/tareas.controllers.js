export const listarTareas = (req, res) => res.send("obteniendo tareas");

export const listarTarea = (req, res) =>
  res.send("obteniendo tarea específica");

export const crearTarea = (req, res) => res.send("creando tarea");

export const actualizarTarea = (req, res) => res.send("actualizando tarea");

export const eliminarTarea = (req, res) => res.send("eliminando tarea");
