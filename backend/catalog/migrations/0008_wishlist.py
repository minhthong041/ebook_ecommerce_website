from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0001_initial"),
        ("catalog", "0007_bookreview_statuses_not_null"),
    ]

    operations = [
        migrations.CreateModel(
            name="Wishlist",
            fields=[
                (
                    "id",
                    models.AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "book",
                    models.ForeignKey(
                        db_column="book_id",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="wishlisted_by",
                        to="catalog.book",
                    ),
                ),
                (
                    "customer",
                    models.ForeignKey(
                        db_column="customer_id",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="wishlists",
                        to="accounts.customer",
                    ),
                ),
            ],
            options={
                "db_table": "wishlists",
                "unique_together": {("customer", "book")},
            },
        ),
    ]
