package ar.com.utnfrsr.todoapp.service;

import ar.com.utnfrsr.todoapp.model.dto.TaskRequestDTO;
import ar.com.utnfrsr.todoapp.model.dto.TaskResponseDTO;

import java.util.List;

public interface ITaskService {

    TaskResponseDTO createTask(TaskRequestDTO taskRequestDTO); // Info que devuelve el método
    List<TaskResponseDTO> findAll(); // Trae una lista de todas las tareas
    void updateTaskAsFinished(Long id, boolean finished); // Actualización de tarea
    void deleteById(Long id); // Para eliminar la tarea
}
