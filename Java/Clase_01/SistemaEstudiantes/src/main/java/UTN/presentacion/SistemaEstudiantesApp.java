package UTN.presentacion;

import UTN.datos.EstudianteDAO;
import UTN.dominio.Estudiante;

import java.util.Scanner;

public class SistemaEstudiantesApp {
    public static void main(String[] args) {
        var salir = false;
        var consola = new Scanner(System.in);   // Para leer la info de la consola.
        // Se crea una instancia de la clase servicio (fuera del ciclo)
        var estudianteDao = new EstudianteDAO();
        while(!salir){
            try{
                mostrarMenu();  // Mostramos el menu.
                //Metodo ejecutarOpciones que devuelve un booleano.
                salir = ejecutarOpciones(consola, estudianteDao);
            }catch (Exception e){
                System.out.println("Ocurrió un error al ejecutar la operación: "+e.getMessage());
            }
        }   // Fin while
    }   // Fin main


    // Metodo Mostrar Menu
    private static void mostrarMenu(){
        System.out.println("""
                ******** Sistema de Estudiantes ********
                1. Listar Estudiantes
                2. Buscar Estudiantes
                3. Agregar Estudiante
                4. Modificar Estudiante
                5. Eliminar Estudiante
                6. Salir
                Elige una opción:
                """);
    }

    // Metodo Ejecutar Opciones
    private static boolean ejecutarOpciones(Scanner consola, EstudianteDAO estudianteDAO) {
        var opcion = Integer.parseInt(consola.nextLine());
        var salir = false;
        switch (opcion) {
            case 1 -> { // Listar Estudiantes
                System.out.println("Listado de Estudiantes: ");
                // No muestra la información, sólo la recupera y regresa una lista.
                var estudiantes = estudianteDAO.listarEstudiantes();    // Recibe el listado.
                // Iteramos cada objeto de tipo estudiante:
                estudiantes.forEach(System.out::println);   // Para imprimir la lista
            }   // Fin case 1
            case 2 -> { // Buscar Estudiante por id
                System.out.println("Introduce el id del estudiante a buscar: ");
                var idEstudiante = Integer.parseInt(consola.nextLine());
                var estudiante = new Estudiante(idEstudiante);
                var encontrado = estudianteDAO.buscarEstudiantePorId(estudiante);
                if (encontrado)
                    System.out.println("Estudiante encontrado: " + estudiante);
                else
                    System.out.println("Estudiante NO encontrado: " + estudiante);
            }   // Fin case 2
            case 3 -> { // Agregar Estudiante
                System.out.println("Agregar Estudiante: ");
                System.out.println("Nombre: ");
                var nombre = consola.nextLine();
                System.out.println("Apellido: ");
                var apellido = consola.nextLine();
                System.out.println("Telefono: ");
                var telefono = consola.nextLine();
                System.out.println("Email: ");
                var email = consola.nextLine();
                // Creamos el objeto estudiante a agregar (sin id)
                var estudiante = new Estudiante(nombre, apellido, telefono, email);
                var agregado = estudianteDAO.agregarEstudiante(estudiante);
                if (agregado)
                    System.out.println("Estudiante agregado: " + estudiante);
                else
                    System.out.println("Estudiante NO agregado: " + estudiante);
            } // Fin case 3
            case 4 -> { // Modificar Estudiante:
                System.out.println("Modificar Estudiante");
                //  Especificamos el id del objeto a modificar
                System.out.println("Id del Estudiante: ");
                var idEstudiante = Integer.parseInt(consola.nextLine());
                System.out.println("Nombre: ");
                var nombre = consola.nextLine();
                System.out.println("Apellido: ");
                var apellido = consola.nextLine();
                System.out.println("Telefono: ");
                var telefono = consola.nextLine();
                System.out.println("Email: ");
                var email = consola.nextLine();
            }   // Fin case 4
            case 5 -> { // Eliminar Estudiante
                System.out.println("Eliminar Estudiante: ");
                System.out.println("Id del Estudiante: ");
                var idEstudiante = Integer.parseInt(consola.nextLine());
                var estudiante = new Estudiante(idEstudiante);
                var eliminado = estudianteDAO.eliminarEstudiante(estudiante);
                if (eliminado)
                    System.out.println("Estudiante eliminado: " + estudiante);
                else
                    System.out.println("Estudiante NO eliminado: " + estudiante);
            }   // Fin case 5
            case 6 -> { // Salir
                System.out.println("Hasta pronto!!");
                salir = true;
            }   // Fin caso 6
            default -> System.out.println("Opción no reconocida, ingrese otra opción: ");
        }   // Fin switch
        return salir;
    }
}
