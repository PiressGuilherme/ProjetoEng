from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views  # Importa o views.py (agora com as TemplateViews)

# --- Configuração do Router da API ---
router = DefaultRouter()
router.register(r'pacientes', views.PacienteViewSet, basename='paciente')

# --- Padrões de URL ---
urlpatterns = [
    # 1. Rotas da API
    # (ex: /api/pacientes/ e /api/pacientes/1/)
    path('api/', include(router.urls)),

    # 2. Rotas do Frontend (HTML)
    path('dashboard/', views.DashboardView.as_view(), name='dashboard'),
    path('pacientes/', views.PacientesView.as_view(), name='pacientes'),
    path('login/', views.LoginView.as_view(), name='login'),
    
    # 3. Rota Raiz (página inicial)
    # Vamos fazer a raiz (/) redirecionar para o dashboard
    path('', views.DashboardView.as_view(), name='home'),
]