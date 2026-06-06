from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("orders", "0004_copy_payment_type_and_order_statuses"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="shoporder",
            name="payment_method",
        ),
    ]
