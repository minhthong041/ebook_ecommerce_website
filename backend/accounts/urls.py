from django.urls import path
from .views import RegisterView, LoginView, RefreshTokenView, MeView, LogoutView, LogoutAllView

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/refresh/', RefreshTokenView.as_view(), name='refresh'),
    path('auth/me/', MeView.as_view(), name='me'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/logout-all/', LogoutAllView.as_view(), name='logout_all'),
]
