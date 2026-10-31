import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Estos datos son públicos por diseño; la seguridad la dan las reglas de Firestore.
const firebaseConfig = {
  apiKey: "AIzaSyCnkQRGYRWXm9VntrpbaOg7GW6LS-Q7H2Q",
  authDomain: "control-subsidios.firebaseapp.com",
  projectId: "control-subsidios",
  storageBucket: "control-subsidios.firebasestorage.app",
  messagingSenderId: "167310043705",
  appId: "1:167310043705:web:dd61b1f11d7542e4787be8",
};

export const db = getFirestore(initializeApp(firebaseConfig));
