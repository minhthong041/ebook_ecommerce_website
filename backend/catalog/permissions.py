from rest_framework.permissions import BasePermission

from accounts.permissions import is_staff_manager


class IsCatalogStaff(BasePermission):
    message = "Only admin or employee accounts can manage catalog resources."

    def has_permission(self, request, view):
        return is_staff_manager(request.user)
