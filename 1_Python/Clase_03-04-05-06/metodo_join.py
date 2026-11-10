

#help(str.join) 
#El método JOIN nos permite concatenar cualquier número de string
#Pueden estar almacenados en un iterable

tupla_str = ('hola','alumnos', 'tecnicatura', 'universitarios')
mensaje = ' '.join(tupla_str)
print(f'Mensaje: {mensaje}')

lista_cursos = ['Java', 'Python', 'Angular', 'Spring']
mensaje = ', '. join(lista_cursos)
print(f'Mensaje: {mensaje}') #Se imprime de manera ordenada


cadena = 'HolaMundo'
mensaje = '.'.join(cadena)
print(f'Mensaje: {mensaje}') #Agrega un punto en la cadena

diccionario= {'nombre': 'Juan', 'apellido': 'Perez', 'edad': '18'}
llaves = '-'.join(diccionario.keys())
valores = '-'.join(diccionario.values())
print(f'Llaves: {llaves}, Type: {type(llaves)}')
print(f'Valores: {valores}, Type: {type(valores)}')