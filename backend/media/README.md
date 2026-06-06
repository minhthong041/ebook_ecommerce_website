# Media Storage

Thu muc nay dung de luu file media khi chay local.

Khong commit file sach that len GitHub. Chi commit cau truc thu muc va cac file `.gitkeep`.

De xuat dat file:

```txt
backend/media/
  ebooks/
    pdf/
    epub/
    mobi/
  covers/
  avatars/
```

Vi du:

```txt
backend/media/ebooks/pdf/book-slug-or-uuid.pdf
backend/media/ebooks/epub/book-slug-or-uuid.epub
backend/media/covers/book-slug-or-uuid.jpg
backend/media/avatars/username-or-uuid.jpg
```

Django/PostgreSQL chi nen luu metadata hoac duong dan tuong doi, vi du `ebooks/epub/book-slug-or-uuid.epub`.
