package utn.estudiantes.servicio;

import utn.estudiantes.modelo.Estudiantes2022;

import java.util.List;

public interface IEstudianteServicio {
    public List<Estudiantes2022> ListarEstudiantes();
    public Estudiantes2022 buscarEstudiantePorId(Integer idestudiantes2022);
    public void guardaEstudiante(Estudiantes2022 estudiante);
    public void eliminarEstudiante(Estudiantes2022 estudiante);
}