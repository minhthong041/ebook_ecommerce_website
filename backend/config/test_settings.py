from .settings import *


DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]


class DisableMigrations:
    def __contains__(self, app_label):
        return True

    def __getitem__(self, app_label):
        return None


MIGRATION_MODULES = DisableMigrations()
