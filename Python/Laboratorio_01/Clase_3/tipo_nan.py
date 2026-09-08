import math
from decimal import Decimal 

#Tipo NaN: Puede ser el resultado de una operacion matematica, similar al manejo de valores infinitos. (Not a number)
a = float('NaN')
print(f'a: {a}')

#Modulo math
a = float('nan')
print(f' ¿Es de tipo Nan (Not a number)?: {math.isnan(a)}')

#Modulo decimal
a = Decimal('Nan')
print(f' ¿Es de tipo Nan (Not a number)?: {math.isnan(a)}')