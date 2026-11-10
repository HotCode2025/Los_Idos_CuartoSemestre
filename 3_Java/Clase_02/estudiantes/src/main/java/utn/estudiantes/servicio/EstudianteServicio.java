package utn.estudiantes.servicio;

import utn.estudiantes.modelo.Estudiante;
import utn.estudiantes.repositorio.EstudianteRepositorio;

import java.util.List;

public class EstudianteServicio implements IEstudianteServicio {
    public List<Estudiante> listarEstudiantes();
    public Estudiante buscarEstudiantePorId(Integer id);
    public void guardarEstudiante(Estudiante estudiante);
    public void eliminarEstudiante(Estudiante estudiante);
}
