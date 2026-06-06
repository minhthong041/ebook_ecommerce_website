from django.db import migrations


def copy_order_payment_type(apps, schema_editor):
    ShopOrder = apps.get_model("orders", "ShopOrder")
    Transaction = apps.get_model("payments", "Transaction")
    PaymentMethod = apps.get_model("payments", "PaymentMethod")

    for order in ShopOrder.objects.all():
        payment_type_id = None
        transaction = (
            Transaction.objects.filter(order_id=order.pk)
            .order_by("created_at", "pk")
            .first()
        )
        if transaction:
            payment_type_id = transaction.payment_type_id

        if not payment_type_id and order.payment_method_id:
            payment_method = PaymentMethod.objects.filter(
                pk=order.payment_method_id
            ).first()
            if payment_method:
                payment_type_id = payment_method.payment_type_id

        if payment_type_id:
            order.payment_type_id = payment_type_id
            order.save(update_fields=["payment_type"])


def normalize_order_statuses(apps, schema_editor):
    OrderStatus = apps.get_model("orders", "OrderStatus")
    ShopOrder = apps.get_model("orders", "ShopOrder")

    legacy_map = {
        "Pending": "pending",
        "Paid": "completed",
        "Completed": "completed",
        "Cancelled": "cancelled",
        "Failed": "failed",
        "Refunded": "refunded",
    }

    for old_name, new_name in legacy_map.items():
        old_status = OrderStatus.objects.filter(name=old_name).first()
        if not old_status:
            continue

        target_status, _ = OrderStatus.objects.get_or_create(name=new_name)
        if old_status.pk != target_status.pk:
            ShopOrder.objects.filter(order_status=old_status).update(
                order_status=target_status
            )
            old_status.delete()

    for name in ["pending", "completed", "cancelled", "failed", "refunded"]:
        OrderStatus.objects.get_or_create(name=name)


class Migration(migrations.Migration):
    dependencies = [
        ("payments", "0001_initial"),
        ("orders", "0003_shoporder_payment_type_order_statuses"),
    ]

    operations = [
        migrations.RunPython(copy_order_payment_type, migrations.RunPython.noop),
        migrations.RunPython(normalize_order_statuses, migrations.RunPython.noop),
    ]
