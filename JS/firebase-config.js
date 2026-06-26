import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

// Nama project Firebase: Brilianz-Warehouse
// Project ID (untuk koneksi): brillianz-warehouse
export const firebaseConfig = {
  apiKey: "AIzaSyDfy3OkjKIJBSLjI3bnZqbG_tOJzy0xFgk",
  authDomain: "brillianz-warehouse.firebaseapp.com",
  databaseURL: "https://brillianz-warehouse-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "brillianz-warehouse",
  storageBucket: "brillianz-warehouse.firebasestorage.app",
  messagingSenderId: "38352202942",
  appId: "1:38352202942:web:12fa3174791f99d8c802ef"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);
