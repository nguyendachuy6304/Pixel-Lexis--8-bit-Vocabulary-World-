// --- js/firebase-init.js ---

// 1. Import App
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

// 2. Import Firestore (Database)
// LƯU Ý: Đã thêm 'deleteDoc' vào danh sách bên dưới
import { 
    getFirestore, 
    collection, 
    doc, 
    setDoc, 
    getDocs, 
    getDoc, 
    deleteDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 3. Import Authentication (Đăng nhập/Đăng ký)
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 4. Cấu hình kết nối
// (Hãy đảm bảo apiKey này là Key MỚI nếu bạn đã đổi key ở bước bảo mật trước đó)
const firebaseConfig = {
    apiKey: "AIzaSyBEotuUiHCAnZXMLCqXWhHnqFdwSZnhYZo", 
    authDomain: "pixel-lexis.firebaseapp.com",
    projectId: "pixel-lexis",
    storageBucket: "pixel-lexis.firebasestorage.app",
    messagingSenderId: "586903726877",
    appId: "1:586903726877:web:9349de9179140ee543cff4"
};

// 5. Khởi động Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

console.log("🔥 Firebase đã sẵn sàng (Đã bật chức năng Xóa)!");

// 6. Xuất các hàm ra để dùng ở nơi khác
export { 
    db, 
    auth, 
    collection, 
    doc, 
    setDoc, 
    getDocs, 
    getDoc, 
    deleteDoc,
    updateDoc,
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
};