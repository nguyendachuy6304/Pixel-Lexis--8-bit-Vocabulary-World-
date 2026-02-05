# 🎮 Hướng Dẫn Thêm Ảnh Boss

## 📁 Cấu Trúc Thư Mục

Mỗi loại boss có một thư mục riêng. Hãy thêm file ảnh `images.png` vào từng thư mục:

```
boss/
├── demon/
│   └── images.png          (ảnh boss Demon)
├── dragon/
│   └── images.png          (ảnh boss Dragon)
├── skeleton/
│   └── images.png          (ảnh boss Skeleton)
├── werewolf/
│   └── images.png          (ảnh boss Werewolf)
├── zombie/
│   └── images.png          (ảnh boss Zombie)
├── robot/
│   └── images.png          (ảnh boss Robot)
├── witch/
│   └── images.png          (ảnh boss Witch)
└── README.md               (file này)
```

## 🖼️ Yêu Cầu Ảnh

- **Format**: PNG (nền trong suốt - transparency)
- **Kích thước**: 200x200px hoặc lớn hơn (khuyến khích 256x256px hoặc 300x300px)
- **Chất lượng**: Pixel art 8-bit hoặc stylized character
- **Nền**: Transparent (PNG với alpha channel)

## 📝 Hướng Dẫn Thêm Ảnh

1. **Chọn boss type**: `demon`, `dragon`, `skeleton`, `werewolf`, `zombie`, `robot`, hoặc `witch`
2. **Chuẩn bị ảnh PNG**: Đảm bảo nền transparent
3. **Lưu file vào thư mục tương ứng**: 
   - Ví dụ: `images/boss/dragon/images.png`
4. **Kiểm tra trong game**:
   - Khi chọn level với `bossType: "dragon"`, ảnh sẽ tự load

## 🔧 Sử Dụng Trong Firebase

Khi tạo level data trong Firebase Firestore, thêm trường `bossType`:

```json
{
  "id": 1,
  "name": "Dragon Trainer",
  "difficulty": 2,
  "levelDifficulty": 2,
  "bossType": "dragon",
  "isBoss": true,
  "questions": [...]
}
```

**Các giá trị bossType hợp lệ**:
- `demon` (mặc định nếu không chỉ định)
- `dragon`
- `skeleton`
- `werewolf`
- `zombie`
- `robot`
- `witch`

## 💡 Thêm Boss Mới

Nếu muốn thêm loại boss mới:

1. Tạo thư mục mới trong `images/boss/` (ví dụ: `images/boss/phoenix/`)
2. Thêm file `images.png` vào thư mục đó
3. Sử dụng tên thư mục làm `bossType` trong Firebase (ví dụ: `"phoenix"`)

Hệ thống sẽ tự động tìm ảnh nếu thư mục tồn tại!

## 🎨 Gợi Ý Trang Tạo Ảnh

- **Piskelapp**: https://www.piskelapp.com/ (Pixel art trực tuyến)
- **Aseprite**: https://www.aseprite.org/ (Pixel art professional)
- **LibreSprite**: https://libresprite.github.io/ (Open source)
- **Photoshop / GIMP**: Cho chỉnh sửa ảnh

## ❓ Lỗi Thường Gặp

| Lỗi | Nguyên Nhân | Giải Pháp |
|-----|-----------|-----------|
| Boss không hiển thị ảnh | File không tồn tại | Kiểm tra tên file chính xác là `images.png` |
| Ảnh bị trắng/tối | Nền không transparent | Chuyển sang PNG với alpha channel |
| Ảnh không vừa | Kích thước quá lớn/nhỏ | Resize ảnh về 256x256px |

---

**Chúc bạn tạo ra những boss độc đáo!** 🎮✨
