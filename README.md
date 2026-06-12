# Pinterest Mini Backend API

Dự án Backend API cho website thư viện ảnh / Pinterest mini sử dụng Node.js, Express.js, MySQL và Prisma ORM.

## 🚀 Tính năng nổi bật

* **Authentication**: Đăng ký, đăng nhập bảo mật bằng JWT và Hash mật khẩu bằng `bcrypt`.
* **Phân quyền người dùng**: Phân chia chi tiết 2 vai trò `USER` và `ADMIN`.
* **Quản lý danh mục & hình ảnh**:
  * User có thể tải lên ảnh (ở trạng thái `PENDING`), tự quản lý danh mục và ảnh của mình.
  * Admin kiểm duyệt ảnh (`APPROVED` / `REJECTED`), quản lý người dùng và nội dung toàn hệ thống.
* **Upload ảnh bằng Multer**: Giới hạn file 5MB, lọc định dạng, đặt tên ngẫu nhiên tránh trùng lặp.
* **Kiểm soát file vật lý**: Tự động xóa file vật lý tương ứng trên ổ đĩa khi xóa hình ảnh khỏi Database.
* **Kiểm tra dữ liệu đầu vào**: Xác thực dữ liệu chặt chẽ bằng `Zod`.
* **Hỗ trợ tìm kiếm & phân trang**: Hỗ trợ phân trang, tìm kiếm chữ tương tự và lọc nâng cao ở các API danh sách ảnh công khai và admin.

---

## 🛠️ Yêu cầu cài đặt & Khởi động dự án

### Bước 1: Cài đặt thư viện
```bash
npm install
```

### Bước 2: Thiết lập môi trường `.env`
Sao chép tệp mẫu để tạo `.env`:
```bash
cp .env.example .env
```
Mở tệp `.env` và thiết lập kết nối Database (ví dụ với XAMPP):
```env
PORT=5000
DATABASE_URL="mysql://root:MAT_KHAU_CUA_BAN@localhost:3306/pinterest_mini_db"
JWT_SECRET="your_jwt_secret"
JWT_EXPIRES_IN="7d"
UPLOAD_DIR="uploads/images"
```
*(Lưu ý: Thay thế `MAT_KHAU_CUA_BAN` bằng mật khẩu MySQL của bạn nếu có. Nếu MySQL của XAMPP không đặt mật khẩu, hãy giữ nguyên cấu hình mặc định: `mysql://root:@localhost:3306/pinterest_mini_db`)*

### Bước 3: Tạo Database trong MySQL
Truy cập **phpMyAdmin** (thông qua XAMPP) và tạo một database mới với tên:
```sql
pinterest_mini_db
```

### Bước 4: Chạy Migrations và Tạo Client Prisma
Thực thi các lệnh sau để tự động khởi tạo các bảng MySQL và Schema Prisma:
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### Bước 5: Seed tài khoản Admin mẫu
Chạy lệnh sau để thêm tài khoản quản trị mặc định:
```bash
npm run seed
```
Tài khoản Admin được khởi tạo thành công:
* **Email**: `admin@example.com`
* **Mật khẩu**: `Admin@123`

### Bước 6: Khởi động Server môi trường Dev
```bash
npm run dev
```
Server sẽ chạy tại địa chỉ: `http://localhost:5000`

---

## 📂 Cấu trúc thư mục dự án

```
├── prisma/
│   ├── schema.prisma       # Database schema models
│   └── seed.js             # Script tạo tài khoản Admin
├── src/
│   ├── config/
│   │   └── prisma.js       # Prisma client instance
│   ├── controllers/        # Điều hướng request và trả response
│   ├── middlewares/        # Auth, upload, validations, error handlers
│   ├── routes/             # Định tuyến URL cho các module
│   ├── services/           # Xử lý logic nghiệp vụ chính
│   ├── utils/              # Các hàm bổ trợ (response, slugify, file cleanup)
│   ├── validations/        # Định nghĩa các schema kiểm tra Zod
│   ├── app.js              # Cấu hình Express application
│   └── server.js           # Khởi chạy cổng server
├── uploads/
│   └── images/             # Nơi lưu trữ tệp ảnh vật lý tải lên
├── .env.example
├── package.json
└── README.md
```

---

## 📡 Danh sách API Endpoints chi tiết

Tất cả các API yêu cầu xác thực cần gửi JWT token kèm theo header:
`Authorization: Bearer <JWT_ACCESS_TOKEN>`

### 1. API Authentication (`/api/auth`)

| Phương thức | Endpoint | Yêu cầu | Body / Params | Mô tả |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | `{ name, email, password }` | Đăng ký tài khoản người dùng mới (Role `USER`) |
| `POST` | `/api/auth/login` | Public | `{ email, password }` | Đăng nhập và nhận JWT token |
| `GET` | `/api/auth/me` | Đăng nhập | Header Bearer Token | Lấy thông tin tài khoản hiện tại |

### 2. API Public (`/api/public`)

*Lưu ý: API chỉ trả về danh mục hoạt động công khai (`isPublic = true`) và ảnh đã được duyệt (`status = APPROVED`, `isPublic = true`).*

| Phương thức | Endpoint | Yêu cầu | Query Params / Params | Mô tả |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/public/categories` | Public | Không | Lấy toàn bộ danh mục công khai |
| `GET` | `/api/public/categories/:slug` | Public | `:slug` (slug danh mục) | Lấy chi tiết một danh mục theo slug |
| `GET` | `/api/public/categories/:slug/images` | Public | `:slug` | Lấy danh sách hình ảnh đã duyệt trong danh mục |
| `GET` | `/api/public/images` | Public | `categoryId`, `categorySlug`, `search`, `page`, `limit` | Tìm kiếm, phân trang và xem danh sách ảnh |
| `GET` | `/api/public/images/:id` | Public | `:id` (ID ảnh) | Xem thông tin chi tiết một hình ảnh |

### 3. API dành cho User đã đăng nhập (`/api/categories` & `/api/images`)

#### Danh mục của User (`/api/categories`)
| Phương thức | Endpoint | Yêu cầu | Body / Params | Mô tả |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/categories/my` | Đăng nhập | Không | Xem các danh mục do chính User tạo |
| `POST` | `/api/categories` | Đăng nhập | `{ name, description, isPublic }` | Tạo một danh mục mới |
| `PUT` | `/api/categories/:id` | Đăng nhập | `:id`, `{ name, description, isPublic }` | Sửa danh mục cá nhân |
| `DELETE` | `/api/categories/:id` | Đăng nhập | `:id` | Xóa danh mục cá nhân (xóa cả các ảnh bên trong) |

#### Hình ảnh của User (`/api/images`)
| Phương thức | Endpoint | Yêu cầu | Body / Params (Multipart Form-Data) | Mô tả |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/images/my` | Đăng nhập | Không | Xem danh sách hình ảnh cá nhân kèm trạng thái duyệt |
| `POST` | `/api/images` | Đăng nhập | `{ image (file), title, description, categoryId, isPublic }` | Tải ảnh lên (Trạng thái mặc định: `PENDING`) |
| `DELETE` | `/api/images/:id` | Đăng nhập | `:id` | Xóa hình ảnh cá nhân (xóa tệp trên máy chủ) |

### 4. API dành cho Admin (`/api/admin`)

*Yêu cầu quyền: Người dùng đã đăng nhập và có vai trò `ADMIN`.*

#### Quản lý User
| Phương thức | Endpoint | Yêu cầu | Params | Mô tả |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/users` | Admin | Không | Xem toàn bộ tài khoản đăng ký trên hệ thống |

#### Quản lý Danh mục
| Phương thức | Endpoint | Yêu cầu | Body / Params | Mô tả |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/categories` | Admin | Không | Lấy toàn bộ danh mục hệ thống (bao gồm ẩn/hiện) |
| `POST` | `/api/admin/categories` | Admin | `{ name, description, isPublic }` | Admin tạo danh mục mới |
| `PUT` | `/api/admin/categories/:id` | Admin | `:id`, `{ name, description, isPublic }` | Sửa danh mục bất kỳ |
| `DELETE` | `/api/admin/categories/:id` | Admin | `:id` | Xóa danh mục và ảnh trực thuộc |
| `PATCH` | `/api/admin/categories/:id/toggle-public` | Admin | `:id` | Thay đổi nhanh trạng thái Công khai / Riêng tư |

#### Quản lý Hình ảnh
| Phương thức | Endpoint | Yêu cầu | Body / Params | Mô tả |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/images` | Admin | Query: `status`, `categoryId`, `uploadedById`, `search`, `page`, `limit` | Xem toàn bộ ảnh hệ thống kèm phân trang và bộ lọc |
| `POST` | `/api/admin/images` | Admin | Multipart: `{ image, title, description, categoryId, isPublic }` | Admin đăng ảnh trực tiếp (Mặc định trạng thái: `APPROVED`) |
| `PATCH` | `/api/admin/images/:id/approve` | Admin | `:id` | Phê duyệt hình ảnh của User |
| `PATCH` | `/api/admin/images/:id/reject` | Admin | `:id`, `{ rejectReason }` | Từ chối hình ảnh và lưu lý do từ chối |
| `PATCH` | `/api/admin/images/:id/toggle-public` | Admin | `:id` | Bật/tắt trạng thái hiển thị của ảnh |
| `DELETE` | `/api/admin/images/:id` | Admin | `:id` | Xóa hình ảnh bất kỳ khỏi hệ thống và ổ đĩa |
