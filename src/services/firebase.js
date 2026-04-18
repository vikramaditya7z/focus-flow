import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBoq4Pr7QU21it9YrvHs7oTeDi6864kqLc",
  authDomain: "focusflow-15781.firebaseapp.com",
  projectId: "focusflow-15781",
  storageBucket: "focusflow-15781.firebasestorage.app",
  messagingSenderId: "411996073078",
  appId: "1:411996073078:web:72180aca6985f7c94c0357"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
