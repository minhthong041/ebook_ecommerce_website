from django.urls import path
from .views import (
    AdminRoleListView,
    AdminUserDetailView,
    AdminUserListView,
    ChangePasswordView,
    RegisterView,
    LoginView,
    RefreshTokenView,
    MeView,
    LogoutView,
    LogoutAllView,
)

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/refresh/', RefreshTokenView.as_view(), name='refresh'),
    path('auth/me/', MeView.as_view(), name='me'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/logout-all/', LogoutAllView.as_view(), name='logout_all'),
    path('admin/roles/', AdminRoleListView.as_view(), name='admin-role-list'),
    path('admin/users/', AdminUserListView.as_view(), name='admin-user-list'),
    path('admin/users/<int:pk>/', AdminUserDetailView.as_view(), name='admin-user-detail'),
]
