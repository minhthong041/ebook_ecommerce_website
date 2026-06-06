from rest_framework.permissions import BasePermission

from accounts.permissions import is_staff_manager


class IsCatalogStaff(BasePermission):
    message = "Only staff members with catalog management access can upload books."

    def has_permission(self, request, view):
        return is_staff_manager(request.user)
