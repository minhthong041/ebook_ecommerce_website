from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("payments", "0001_initial"),
        ("orders", "0002_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="shoporder",
            name="payment_type",
            field=models.ForeignKey(
                blank=True,
                db_column="payment_type_id",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="orders",
                to="payments.paymenttype",
            ),
        ),
    ]
