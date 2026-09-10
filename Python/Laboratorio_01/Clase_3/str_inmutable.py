
#help(str.capitalize) #Metodo para cambiar a mayuscula el primer caracter

mensaje1 = 'hola mundo'
mensaje2 = mensaje1.capitalize()
print(f'mensaje 1: {mensaje1}, id: {id(mensaje1)}')
print(f'mensaje 2: {mensaje2}, id: {id(mensaje2)}') #Cambia la primer letra a mayuscula

mensaje1 += ' Adios'
print(f'mensaje 1: {mensaje1}, id: {id(mensaje1)}') #Crea una nueva cadena, es un nuevo objeto

#CONCLUSIÓN:
# Las cadenas o de tipo string inmutables. Cada vez que queremos modificar una cadena se esta creando un nuevo objeto 