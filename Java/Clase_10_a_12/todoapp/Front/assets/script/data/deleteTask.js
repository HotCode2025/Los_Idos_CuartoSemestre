import { path } from "../data/path.js";

export const deleteTask = async (id) => {
  const confirmation = await Swal.fire({
    title: "¿Desea eliminar esta tarea?",
    text: "Esta acción no se puede deshacer.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar",
  });

  if (!confirmation.isConfirmed) {
    return;
  }

  const url = path + "delete/" + id;
  fetch(url, {
    method: "DELETE",
  })
    .then((res) => {
      if (res.ok) {
        Swal.fire({
          position: "center",
          icon: "success",
          title: "Tarea eliminada",
          showConfirmButton: false,
          timer: 2500,
        });
        setTimeout(() => {
          window.location.href = "index.html";
        }, 2500);
      } else {
        Swal.fire({
          position: "center",
          icon: "error",
          title: "No se eliminó correctamente",
          showConfirmButton: false,
          timer: 1500,
        });
      }
    })
    .catch((error) => {
      Swal.fire({
        position: "center",
        icon: "error",
        title: "Error en la solicitud:" + error,
        showConfirmButton: false,
        timer: 1500,
      });
    });
};
