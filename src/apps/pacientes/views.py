from django.contrib.auth import authenticate, login, logout
from rest_framework import viewsets, permissions, status, views
from rest_framework.response import Response
from .models import Paciente
from .serializers import PacienteSerializer
from django.views.generic import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin

class PacienteViewSet(viewsets.ModelViewSet):
    """
    API endpoint protegida para pacientes.
    """
    queryset = Paciente.objects.all().order_by('nome')
    serializer_class = PacienteSerializer
    permission_classes = [permissions.IsAuthenticated]

class LoginApiView(views.APIView):
    """
    API para realizar login e criar sessão.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        
        username = request.data.get('username')
        password = request.data.get('password')
        
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            if user.is_active:
                login(request, user)
                return Response({'detail': 'Login realizado com sucesso!'})
            else:
                 return Response(
                    {'detail': 'Conta desativada.'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
        else:
            return Response(
                {'detail': 'Login ou senha inválidos.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

class LogoutApiView(views.APIView):
    """
    API para realizar logout e destruir a sessão.
    """
    def post(self, request):
        logout(request)
        return Response({'detail': 'Logout realizado com sucesso!'})

# --- Views de Template (HTML) ---

class DashboardView(LoginRequiredMixin, TemplateView):
    template_name = "dashboard.html"
    login_url = '/login/'  # Redireciona para cá se não estiver logado

class PacientesView(LoginRequiredMixin, TemplateView):
    template_name = "pacientes.html"
    login_url = '/login/'  # Redireciona para cá se não estiver logado

class LoginView(TemplateView):
    template_name = "login.html"
    # Não precisa de LoginRequiredMixin, senão ninguém entra!