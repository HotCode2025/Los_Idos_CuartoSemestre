

#Tipo bool: Contiene true or false
#Los tipos numeros, es falsae apra el 0, true para los demás valores.
valor = 0.0
resultado = bool (valor)
print(f'valor: {valor}, Resultado: {resultado}')

valor = 0.1
resultado = bool (valor)
print(f'valor: {valor}, Resultado: {resultado}')

#Tipo strig -> False'' , True -> demás valores
valor = ''
resultado = bool (valor)
print(f'valor: {valor}, Resultado: {resultado}')

valor = 'Hola'
resultado = bool (valor)
print(f'valor: {valor}, Resultado: {resultado}')

#Tipo colecciones -> False: para colecciones vacias / True -> para todas las demás
#Lista:
valor = []
resultado = bool (valor)
print(f'valor de una lista vacia: {valor}, Resultado: {resultado}')

valor = [2,3,4]
resultado = bool (valor)
print(f'valor de una lista con elementos: {valor}, Resultado: {resultado}')

#Tupla:
valor = ()
resultado = bool (valor)
print(f'valor de una tupla vacia: {valor}, Resultado: {resultado}')

valor = (5,6,7)
resultado = bool (valor)
print(f'valor de una tupla con elementos : {valor}, Resultado: {resultado}')

#Diccionario:
valor = {}
resultado = bool (valor)
print(f'valor de un diccionario vacio: {valor}, Resultado: {resultado}')

valor = {'Nombre': 'Juan', 'Apellido':'Pérez' }
resultado = bool (valor)
print(f'valor de un diccionario con elementos: {valor}, Resultado: {resultado}')


#Sentencias de control con bool
if'':
    print('Regresa verdadero')
else:
    print('Regresa falso')


#Ciclos:
variable = 3
while variable:
    print('Regresa verdadero')
    break
else:
    print('Regresa falso')

