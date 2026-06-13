import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAjMCDAeujRLdQJwnCgZrl9hePeJYJ-3UM",
  authDomain: "viginyx-21488.firebaseapp.com",
  projectId: "viginyx-21488",
  storageBucket: "viginyx-21488.firebasestorage.app",
  messagingSenderId: "172611303385",
  appId: "1:172611303385:web:402b8bfe968321fc8f8bc8",
  measurementId: "G-XVXE9WRV7W",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
