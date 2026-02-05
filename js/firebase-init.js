// --- js/firebase-init.js ---

// 1. Import các hàm cần thiết từ Firebase (Dùng CDN phiên bản Web Modular)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, doc, setDoc, getDocs, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// QUAN TRỌNG: Đã thêm 'createUserWithEmailAndPassword' vào dòng import bên dưới
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 2. Cấu hình kết nối (Thông tin Project của bạn)
const firebaseConfig = {
    apiKey: "AIzaSyCMijcU214ZDrDvNPZHEOZD7Y9d4qGfprM",
    authDomain: "pixel-lexis.firebaseapp.com",
    projectId: "pixel-lexis",
    storageBucket: "pixel-lexis.firebasestorage.app",
    messagingSenderId: "586903726877",
    appId: "1:586903726877:web:9349de9179140ee543cff4"
};

// 3. Khởi động Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app); // Cơ sở dữ liệu
const auth = getAuth(app);    // Hệ thống xác thực (Đăng nhập/Đăng ký)

console.log("🔥 Firebase (Auth + DB) đã sẵn sàng!");

// 4. Xuất các hàm ra để các file khác (login.html, admin.html) sử dụng
export { 
    db, 
    auth, 
    collection, 
    doc, 
    setDoc, 
    getDocs, 
    getDoc, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, // <-- Hàm mới để đăng ký
    signOut, 
    onAuthStateChanged 
};