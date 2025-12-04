from django.db import models

class Paciente(models.Model):
    """
    Representa um paciente na UBS, com seus dados pessoais,
    histórico de consulta e necessidade específica.
    """
    
    COMORBIDADE_CHOICES = [
        ('Hipertensão', 'Hipertensão'),
        ('Diabetes', 'Diabetes'),
        ('Gestante', 'Gestante'),
    ]

    # Campos do banco de dados
    nome = models.CharField(max_length=255, help_text="Nome completo do paciente")
    cpf = models.CharField(max_length=14, unique=True, help_text="CPF no formato 000.000.000-00")
    data_nascimento = models.DateField()
    telefone = models.CharField(max_length=20, blank=True, null=True, help_text="Telefone com DDD (opcional)")
    
    comorbidade = models.CharField(
        max_length=50, 
        choices=COMORBIDADE_CHOICES,
        verbose_name="Necessidade Específica", # ALTERADO: Define o rótulo visível no Admin
        help_text="Necessidade específica principal do paciente" # ALTERADO: Texto de ajuda
    )
    
    data_consulta = models.DateField(help_text="Data da consulta mais recente registrada.")
    
    observacoes = models.TextField(blank=True, null=True, help_text="Observações adicionais (opcional)")
    endereco = models.CharField(max_length=255, help_text="Endereço completo do paciente")

    class Meta:
        ordering = ['nome'] # Ordenar listas de pacientes por nome por padrão

    def __str__(self):
        # Isso define como o objeto será exibido no admin do Django (ex: "Maria Silva Santos")
        return self.nome