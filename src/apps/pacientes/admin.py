from django.contrib import admin
from .models import Paciente

@admin.register(Paciente)
class PacienteAdmin(admin.ModelAdmin):
    # Campos que aparecerão na lista de pacientes no admin
    list_display = ('nome', 'cpf', 'comorbidade', 'data_consulta', 'endereco') # --- 'endereco' ADICIONADO ---
    # Filtros que aparecerão na barra lateral
    list_filter = ('comorbidade',)
    # Campos que permitirão busca
    search_fields = ('nome', 'cpf', 'endereco') # --- 'endereco' ADICIONADO ---