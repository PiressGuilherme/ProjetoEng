from rest_framework import serializers
from .models import Paciente  # Importa o modelo da mesma app
from datetime import date
from dateutil.relativedelta import relativedelta # Biblioteca que instalamos

class PacienteSerializer(serializers.ModelSerializer):
    """
    Serializa o modelo Paciente para JSON e vice-versa,
    incluindo campos calculados (status e proxima_consulta).
    """

    # Estes são campos extras, "read-only", que nosso frontend espera.
    # O SerializerMethodField() diz ao DRF para chamar as funções
    # get_status() e get_proxima_consulta() para obter os valores.
    status = serializers.SerializerMethodField()
    proxima_consulta = serializers.SerializerMethodField()

    class Meta:
        model = Paciente
        # Lista de campos que serão expostos na API
        fields = [
            'id', 
            'nome', 
            'cpf', 
            'data_nascimento', 
            'telefone',
            'comorbidade', 
            'data_consulta',  # Esta é a 'dataUltimaConsulta' do seu mock
            'observacoes',
            'status',           # Campo calculado
            'proxima_consulta'  # Campo calculado
        ]

    def _calcular_status_info(self, obj):
        """
        Função de lógica de negócios, movida do 'script.js'.
        Calcula o status e a próxima consulta com base na comorbidade.
        """
        intervalos = {
            'Hipertensão': 3,
            'Diabetes': 6,
            'Gestante': 1
        }
        # Pega o intervalo em meses ou usa 6 meses como padrão
        intervalo_meses = intervalos.get(obj.comorbidade, 6)
        
        # Usa a data da última consulta como base.
        data_base = obj.data_consulta if obj.data_consulta else date.today()
        
        # Calcula a data da próxima consulta
        data_proxima = data_base + relativedelta(months=intervalo_meses)
        
        hoje = date.today()
        # Calcula os dias restantes (pode ser negativo se estiver atrasado)
        dias_restantes = (data_proxima - hoje).days

        status = ''
        if dias_restantes < 0:
            status = 'Urgente'
        elif dias_restantes <= 15:
            status = 'Vermelho'
        elif dias_restantes <= 45:
            status = 'Amarelo'
        else:
            status = 'Verde'
        
        return status, data_proxima

    def get_status(self, obj):
        """Função chamada pelo 'status = SerializerMethodField()'"""
        status, _ = self._calcular_status_info(obj)
        return status

    def get_proxima_consulta(self, obj):
        """Função chamada pelo 'proxima_consulta = SerializerMethodField()'"""
        _, data_proxima = self._calcular_status_info(obj)
        return data_proxima