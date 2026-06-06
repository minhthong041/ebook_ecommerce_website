from rest_framework.permissions import BasePermission


def get_role_name(user):
    role = getattr(user, "role", None)
    return role.name.strip().lower() if role else ""


def is_staff_manager(user):
    if not user or not user.is_authenticated:
        return False
    return bool(
        user.is_superuser
        or user.is_staff
        or get_role_name(user) in {"admin", "employee"}
    )


def is_system_admin(user):
    if not user or not user.is_authenticated:
        return False
    return bool(user.is_superuser or get_role_name(user) == "admin")


class IsStaffManager(BasePermission):
    message = "Only admin or employee accounts can access this resource."

    def has_permission(self, request, view):
        return is_staff_manager(request.user)


class IsSystemAdmin(BasePermission):
    message = "Only admin accounts can access this resource."

    def has_permission(self, request, view):
        return is_system_admin(request.user)
