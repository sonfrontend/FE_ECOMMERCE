import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// TODO: Thay thế các giá trị dưới đây bằng thông tin lấy từ Firebase Console của bạn
const firebaseConfig = {
  apiKey: "AIzaSyAY0cA5JitPJfL5fMq5vTQaLxHZYFOmjIg",
  authDomain: "ecommerce-11edd.firebaseapp.com",
  projectId: "ecommerce-11edd",
  storageBucket: "ecommerce-11edd.firebasestorage.app",
  messagingSenderId: "939924001534",
  appId: "1:939924001534:web:0d4a2a9901c021d9630baf",
  measurementId: "G-B3KY9MPS4V"
};
// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);

// Lấy Auth instance
export const auth = getAuth(app);

// Khởi tạo Google Provider
export const googleProvider = new GoogleAuthProvider();


