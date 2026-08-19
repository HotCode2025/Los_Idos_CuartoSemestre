package UTN.datos;

import UTN.dominio.Estudiante;

import javax.xml.transform.Result;

import static UTN.conexion.Conexion.getConnection;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;

public class EstudianteDAO {
    // Metodo listar
    public List<Estudiante> listarEstudiantes(){
        List<Estudiante> estudiantes = new ArrayList<>();
        // Creamos algunos objetos que son necesarios para comunicarnos con la BD
        PreparedStatement ps;   // Este objeto permite manejar las queries a la BD
        ResultSet rs;   // Este objeto permite almacenar el resultado de la BD
        // Creamos un objeto de tipo Connection
        Connection con = getConnection();
        String sql = "SELECT * FROM estudiantes2026";
        try{
            ps = con.prepareStatement(sql);
            rs = ps.executeQuery();
            while(rs.next()){
                var estudiante = new Estudiante();
                estudiante.setIdEstudiante(rs.getInt("idestudiante"));
                estudiante.setNombre(rs.getString("nombre"));
                estudiante.setApellido(rs.getString("apellido"));
                estudiante.setTelefono(rs.getString("telefono"));
                estudiante.setEmail(rs.getString("email"));

                //Falta agregarlo a la lista
                estudiantes.add(estudiante);
            }
        } catch (Exception e){
            System.out.println("Ocurrió un error al seleccionar datos"+e.getMessage());
        }
        finally{
            try{
                con.close();
            }catch (Exception e){
                System.out.println("Ocurrió un error al cerrar la conexión"+e.getMessage());

            }
        }   // Fin finally
        return estudiantes;
    }   // Fin metodo listar();

    //  Metodo buscar por id > find by id
    public boolean buscarEstudiantePorId(Estudiante estudiante){
        PreparedStatement ps;
        ResultSet rs;
        Connection con = getConnection();
        String sql = "SELECT * FROM estudiantes2026 WHERE idestudiante=?";
        try{
            ps = con.prepareStatement(sql);
            ps.setInt(1, estudiante.getIdEstudiante());
            rs = ps.executeQuery();
            if(rs.next()){
                estudiante.setNombre(rs.getString("nombre"));
                estudiante.setApellido(rs.getString("apellido"));
                estudiante.setTelefono(rs.getString("telefono"));
                estudiante.setEmail(rs.getString("email"));
                return true;    // Se encontró un registro
            }   // Fin if
        }catch (Exception e){
            System.out.println("Ocurrió un error al buscar estudiante por id: "+e.getMessage());
        }
        finally{
            try{
                con.close();
            } catch (Exception e){
                System.out.println("Ocurrió un error al cerrar conexión "+e.getMessage());
            }   // Fin catch
        }   // Fin finally
        return false;
    }

    // Metodo para agregar un nuevo estudiante
    public boolean agregarEstudiante(Estudiante estudiante){
        PreparedStatement ps;
        Connection con = getConnection();
        String sql = "INSERT INTO estudiantes2026 (nombre, apellido, telefono, email) VALUES (?, ?, ?, ?)";
        try{
            ps = con.prepareStatement(sql);
            ps.setString(1, estudiante.getNombre());
            ps.setString(2, estudiante.getApellido());
            ps.setString(3, estudiante.getTelefono());
            ps.setString(4, estudiante.getEmail());
            ps.execute();
            return true;
        }catch (Exception e){
            System.out.println("Ocurrió un error al agregar el estudiante: "+e.getMessage());
        }   // Fin catch
        finally{
            try{
                con.close();
            }catch (Exception e){
                System.out.println("Ocurrió un error al cerrar la conexión: "+e.getMessage());
            }
        }   // Fin finally
        return false;
    }   // Fin metodo agregarEstudiante();

    // Metodo para modificar estudiante
    public boolean modificarEstudiante(Estudiante estudiante){
        PreparedStatement ps;
        Connection con = getConnection();
        String sql = "UPDATE estudiantes2026 SET nombre=?, apellido=?, telefono=?, email=? WHERE idestudiante=?";
        try{
            ps =con.prepareStatement(sql);
            ps.setString(1, estudiante.getNombre());
            ps.setString(2, estudiante.getApellido());
            ps.setString(3, estudiante.getTelefono());
            ps.setString(4, estudiante.getEmail());
            ps.setInt(5, estudiante.getIdEstudiante());
            ps.execute();
            return true;
        }catch (Exception e){
            System.out.println("Ocurrió un error al modificar el estudiante: "+e.getMessage());
        }   // Fin catch
        finally{
            try{
                con.close();
            }catch (Exception e){
                System.out.println("Error al cerrar la conexión: "+e.getMessage());
            }   // Fin catch.
        }   // Fin finally.
        return false;
    }

    // Metodo para eliminar estudiante
    public boolean eliminarEstudiante (Estudiante estudiante) {
        PreparedStatement ps;
        Connection con = getConnection();
        String sql = "DELETE FROM estudiantes2026 WHERE idestudiante=?";
        try {
            ps = con.prepareStatement(sql);
            ps.setInt(1, estudiante.getIdEstudiante());
            ps.execute();
            return true;
        } catch (Exception e) {
            System.out.println("Error al eliminar estudiante: " + e.getMessage());
        } finally {
            try {
                con.close();
            } catch (Exception e) {
                System.out.println("Ocurrió un error al cerrar la conexión:" + e.getMessage());
            }
        }
        return false;
    }   // Fin del metodo eliminarEstudiante

    // Agregamos un main para ejecutar.
    public static void main(String[] args) {

        var estudianteDao = new EstudianteDAO();

        // Modificar estudiante
//        var estudianteModificado = new Estudiante(1, "Juan Carlos", "Juarez", "54926354526", "jjuarez@email.com");
//        var modificado = estudianteDao.modificarEstudiante(estudianteModificado);
//        if(modificado)
//            System.out.println("Estudiante modificado: "+estudianteModificado);
//        else
//            System.out.println("No se modificó el estudiante: "+estudianteModificado);

        // Agregar estudiante
//        var nuevoEstudiante = new Estudiante("Carlos", "Lara", "54926343434", "clara@email.com");
//        var agregado = estudianteDao.agregarEstudiante(nuevoEstudiante);
//        if(agregado)
//            System.out.println("Estudiante agregado: "+nuevoEstudiante);
//        else
//            System.out.println("No se ha agregado estudiante: "+nuevoEstudiante);

//        // Eliminar estudiante con id = 3
//        var estudianteEliminar = new Estudiante(3);
//        var eliminado = estudianteDao.eliminarEstudiante(estudianteEliminar);
//        if (eliminado)
//            System.out.println("Estudiante eliminado: "+estudianteEliminar);
//        else
//            System.out.println("No se eliminó estudiante: "+estudianteEliminar);
//
//        // Listar los estudiantes
//        System.out.println("Listado de estudiantes: ");
//        List<Estudiante> estudiantes = estudianteDao.listarEstudiantes();
//        estudiantes.forEach(System.out::println);   // Función lambda para imprmir

        // Buscar por id
//        var estudiante1 = new Estudiante(1);
//        System.out.println("Estudiantes antes de la busqueda: "+estudiante1);
//        var encontrado = estudianteDao.buscarEstudiantePorId(estudiante1);
//        if(encontrado)
//            System.out.println("Estudiante encontrado: "+estudiante1);
//        else
//            System.out.println("No se encontro el estudiante: "+estudiante1.getIdEstudiante());


    }
}
