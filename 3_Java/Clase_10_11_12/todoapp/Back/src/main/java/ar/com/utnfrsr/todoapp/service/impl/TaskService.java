package ar.com.utnfrsr.todoapp.service.impl;

import ar.com.utnfrsr.todoapp.exceptions.ToDoExceptions;
import ar.com.utnfrsr.todoapp.model.dto.TaskRequestDTO;
import ar.com.utnfrsr.todoapp.model.dto.TaskResponseDTO;
import ar.com.utnfrsr.todoapp.model.entity.Task;
import ar.com.utnfrsr.todoapp.model.mapper.TaskMapper;
import ar.com.utnfrsr.todoapp.repository.TaskRepository;
import ar.com.utnfrsr.todoapp.service.ITaskService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service //Le dice al contenedor bin de spring, que cree un bin y lo guarde en ese contenedo, para luego ser identado
@RequiredArgsConstructor
public class TaskService implements ITaskService {

    //en el service se va toda la lógica necesaria para el programa
    private final TaskRepository repository;
    private final TaskMapper mapper;

    //Crea la tarea
    @Override
    public TaskResponseDTO createTask(TaskRequestDTO taskRequestDTO){
        Task task = mapper.toTask(taskRequestDTO);
        return mapper.toDTO(repository.save(task));
    }

    //Muestra la lista de tareas
    @Override
    public List<TaskResponseDTO> findAll() {return mapper.toDTOList(repository.findAll());}

    //Actualiza el estado de la tarea
    @Override
    @Transactional
    public void updateTaskAsFinished(Long id, boolean finished) {
        Optional<Task> optionalTask = this.repository.findById(id);
        if (optionalTask.isEmpty()){ //Si no hay tarea
            throw new ToDoExceptions("Task not found", HttpStatus.NOT_FOUND);
        }
        if(finished){
            finished = false;
        }else{
            finished = true;
        }
        this.repository.markTaskAsFinished(id, finished);
    }

    @Override
    public void deleteById(Long id) {
        Optional<Task> optionalTask = this.repository.findById(id);
        if (optionalTask.isEmpty()){
            throw new ToDoExceptions("Task not found", HttpStatus.NOT_FOUND);
        }
        this.repository.deleteById(id);
    }
}
