
#dar formato a un string 

nombre = 'Ariel'
edad = 28
mensaje_con_formato = 'Mi nombre es %s y tengo %d años'%(nombre, edad)

# Creamos una tupla
persona = ('Carla', 'Gomez', 5000.00)
mensaje_con_formato = 'Hola %s %s. Tu sueldo es de %.2f' # %(persona) # Aqui le pasamos el objeto que es tupla
#print(mensaje_con_formato % persona)


nombre = 'Juan'
edad = 19
sueldo = 3000
#mensaje_con_formato = 'Nombre {}, edad {}, sueldo {:.2f}'.format(nombre, edad, sueldo)
# print(mensaje_con_formato)

#mensaje = 'Nombre {0}, edad {1}, sueldo {2:.2f}'.format(nombre, edad, sueldo)
#print(mensaje)

mensaje = 'Nombre {n} edad {e} sueldo {s:.2f}'.format(n=nombre, e=edad, s=sueldo)
#print(mensaje)

diccionario = {'nombre':'Ivan', 'edad':35, 'sueldo':8000.00}
mensaje = 'Nombre {dic[nombre]} edad {dic[edad]} sueldo {dic[sueldo]:.2f}'.format(dic=diccionario)
print(mensaje)

