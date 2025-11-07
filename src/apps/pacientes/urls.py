from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'pacientes', views.PacienteViewSet, basename='paciente')

urlpatterns = [
    # Rotas da API REST
    path('api/', include(router.urls)),
    path('api/login/', views.LoginApiView.as_view(), name='api-login'),   
    path('api/logout/', views.LogoutApiView.as_view(), name='api-logout'), 

    # Rotas do Frontend (HTML)
    path('dashboard/', views.DashboardView.as_view(), name='dashboard'),
    path('pacientes/', views.PacientesView.as_view(), name='pacientes'),
    path('login/', views.LoginView.as_view(), name='login'),
    
    path('', views.LoginView.as_view(), name='home'),
]       