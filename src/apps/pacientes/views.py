from rest_framework import viewsets
from .models import Paciente
from .serializers import PacienteSerializer
from django.views.generic import TemplateView

class PacienteViewSet(viewsets.ModelViewSet):
    """
    API endpoint que permite aos pacientes serem vistos ou editados.
    
    Fornece automaticamente as ações:
    - .list()   (GET /api/pacientes/)
    - .create() (POST /api/pacientes/)
    - .retrieve() (GET /api/pacientes/<id>/)
    - .update() (PUT /api/pacientes/<id>/)
    - .partial_update() (PATCH /api/pacientes/<id>/)
    - .destroy() (DELETE /api/pacientes/<id>/)
    """
    
    # De onde vêm os dados
    queryset = Paciente.objects.all().order_by('nome')
    
    # Qual "tradutor" usar
    serializer_class = PacienteSerializer

class DashboardView(TemplateView):
    """Renderiza a página do dashboard."""
    template_name = "dashboard.html"

class PacientesView(TemplateView):
    """Renderiza a página de lista de pacientes."""
    template_name = "pacientes.html"

class LoginView(TemplateView):
    """Renderiza a página de login."""
    template_name = "login.html"