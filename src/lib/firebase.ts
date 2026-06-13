import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAjMCDAeujRLdQJwnCgZrl9hePeYJZ-3UM",
  authDomain: "viginyx-21488.firebaseapp.com",
  projectId: "viginyx-21488",
  storageBucket: "viginyx-21488.firebasestorage.app",
  messagingSenderId: "172611303385",
  appId: "1:172611303385:web:402b8bfe968321fc8f8bc8",
  measurementId: "G-XVXE9WRV7W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

if (!firebaseConfig.apiKey || firebaseConfig.apiKey.length < 20) {
  throw new Error("Firebase is not configured with a valid API key.");
}

export const auth = getAuth(app);
export const db = getFirestore(app);
