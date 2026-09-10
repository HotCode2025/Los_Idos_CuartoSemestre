
#Split: Signifca separar o dividir

#help(str.split)

cursos = 'Java JavaScript Node Python Diseno'
lista_cursos = cursos.split()
print(f'Lista de cursos: {lista_cursos}')
print(type(lista_cursos))

cursos_separados_comas = 'Java,JavaScript,Node,Python,Diseno'
lista_cursos = cursos_separados_comas.split(',', 2) #Nos dice que va a buscar una coma, no un espacio que trae por default, delimitamos la búsqueda
print(f'Lista de cursos: {lista_cursos}')
print(len(lista_cursos))
#Número de veces que se separa la cadena

