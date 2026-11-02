package ar.com.utnfrsr.todoapp.repository;

import ar.com.utnfrsr.todoapp.model.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TaskRepository extends JpaRepository <Task, Long> {  //<nombre de la entidad, tipo del identificador>
     /**
     * Update task to status (true or falsE)
     * @param id recibe el ide para pasarlo a la query nativa
     * @param finished recibe el estado para pasarlo a la query nativa
     */

    @Modifying //demuestra que la query es de actualizacion
    @Query(value = "UPDATE TASK SET FINISHED=:finished WHERE ID=:id", nativeQuery = true)
    public void markTaskAsFinished(@Param("id") Long id, @Param("finished") boolean finished);
}
