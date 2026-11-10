package UTN.conexion;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class Conexion {
    public static java.sql.Connection getConnection(){
        java.sql.Connection conexion = null;
        //Vars para conectarnos a la db
        var baseDatos = "estudiantes";
        var url = "jdbc:mysql://localhost:3306/"+baseDatos;
        var usuario = "root";
        var password = "admin";

        //Cargamos la clase del driver de mysql en memoria
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            conexion = DriverManager.getConnection(url, usuario, password);
        }catch(ClassNotFoundException | SQLException e) {
            System.out.println("Ocurrió un error en la conexión." + e.getMessage());
            };
        return conexion;
    }
}
