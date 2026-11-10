# Profundizando en el tipo float
a = 3.0



# Constructor de tipo float -> puede recibir int y str (numérico) y convertir a float

a = float(10) # Le pasamos un tipo entero
print (f'Constructor float recibiendo int: {a:.2f}')
a = float('10')
print (f'Constructor float recibiendo string: {a:.2f}')

# Notación exponencial (valores positivos o negativos)
a = 3e5
print (f'a = : {a:.2f}')

a = 3e-5
print (f'a = : {a:.5f}')

# Cualquier cálculo que incluya un float, toda la operación pasa a float.

a = 4.0 + 5
print(a)
print(type(a))