from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("orders", "0005_remove_shoporder_payment_method"),
        ("payments", "0001_initial"),
    ]

    operations = [
        migrations.DeleteModel(
            name="PaymentMethod",
        ),
    ]
