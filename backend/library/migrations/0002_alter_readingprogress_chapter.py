from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("catalog", "0003_book_book_image"),
        ("library", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="readingprogress",
            name="chapter",
            field=models.ForeignKey(
                blank=True,
                db_column="chapter_id",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="reading_progress",
                to="catalog.bookchapter",
            ),
        ),
    ]
