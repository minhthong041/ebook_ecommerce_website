from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models


class Role(models.Model):
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = "roles"

    def __str__(self):
        return self.name


class AppPermission(models.Model):
    module = models.CharField(max_length=100)
    code = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    class Meta:
        db_table = "permissions"

    def __str__(self):
        return f"{self.module}.{self.code}"


class RolePermission(models.Model):
    role = models.ForeignKey(
        Role,
        on_delete=models.CASCADE,
        db_column="role_id",
        related_name="role_permissions",
    )
    permission = models.ForeignKey(
        AppPermission,
        on_delete=models.CASCADE,
        db_column="permission_id",
        related_name="role_permissions",
    )

    class Meta:
        db_table = "role_permissions"
        unique_together = ("role", "permission")

    def __str__(self):
        return f"{self.role} - {self.permission}"


class User(AbstractUser):
    full_name = models.CharField(max_length=100)
    role = models.ForeignKey(
        Role,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column="role_id",
        related_name="users",
    )
    dob = models.DateField(null=True, blank=True)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=50, unique=True, null=True, blank=True)
    date_joined = models.DateTimeField(auto_now_add=True, db_column="date_join")

    REQUIRED_FIELDS = ["email", "full_name"]

    class Meta:
        db_table = "users"

    def __str__(self):
        return self.username


class Customer(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        primary_key=True,
        db_column="id",
        related_name="customer",
    )
    loyalty_points = models.IntegerField(default=0)

    class Meta:
        db_table = "customers"

    def __str__(self):
        return self.user.username
