## Backend

### How to Run the Backend Server


1. Đầu tiên thì đi tới core directory:

    ```
    cd core
    ```

2. AE nên sử dụng môi trường ảo để khi có tải bất cứ gì về thì chỉ có trên môi trường ảo này thôi, ae FE skip tới bước 5 cũng được, còn BE bắt buộc:

   ```
   python -m venv env # Tạo môi trường ảo
   ```
3. Để activate môi trường ảo thì:

    bash
    ```
    source env/Scripts/activate
    ```

    terminal
    ```
    .\env\Scripts\activate
    ```

4. Để rời khỏi môi trường ảo:

    ```
    deactivate
    ```

5. Tải thư viện cần thiết, xài máy ảo thì activate rồi install: (nếu thấy báo thiếu lỗi thì chạy lại)

    ```
    pip install -r requirements.txt
    ```

6.Tạo database (mỗi lần vào đều nên làm lại để cập nhật backend)

    ```
    python manage.py makemigrations
    python manage.py migrate
    ```


7. Chạy server backend:

    ```
    python manage.py runserver
    ```

### Cách tạo tài khoản admin - superuser:

```
python manage.py createsuperuser
```

### IMPORT DỮ LIỆU DATABASE

xong 5,6 thì sẽ làm được

```
    python manage.py import_books imported_data
```

### Cách vào đọc trang docs API

chắc chắn chạy lại bước 5,6,7 để cập nhật backend
```
    pip install -r requirements.txt
    python manage.py makemigrations
    python manage.py migrate
    python manage.py runserver
```
truy cập vào link:

- http://127.0.0.1:8000/api/schema/redoc/ để xem docs chi tiết về API (nên đọc cái này) 
- http://127.0.0.1:8000/api/schema/swagger-ui/ để xem API dạng swagger

- Để test thử API, hãy vào http://127.0.0.1:8000/api/user/login/ để đăng nhập.
- Để logout hãy vào http://127.0.0.1:8000/api/user/logout/ để logout. Đây là logout theo SessionID cùng server nên chỉ dùng để test API. Frontend không cần gọi.

- Sau đó, muốn test API nào thì hãy cứ quăng API đó vào trình duyệt, sẽ có giao diện cho AE xem.

### Trang Admin:

Dùng tài khoản superuser ở trên để đăng nhập.
Để vào trang admin: chạy server backend rồi vào link http://127.0.0.1:8000/admin/ để đăng nhập.

## Frontend
### How to Run the Frontend Server
1. Đầu tiên thì đi tới frontend directory:

    ```
    cd frontend
    ```
2. Cài đặt các dependencies cần thiết:

    ```
    npm install
    ```
3. Chạy server frontend:

    ```
    npm start
    ```
4. Truy cập vào ứng dụng:

    ```
    http://localhost:3000
    ```
5. Để vào trang admin của frontend, truy cập:

    ```
    http://localhost:3000/admin
    ```
