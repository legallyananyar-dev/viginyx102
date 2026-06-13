import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

function pickConfigValue(envValue: string | undefined, fallbackValue: string) {
  const trimmedValue = envValue?.trim();

  if (!trimmedValue) return fallbackValue;

  return trimmedValue;
}

const firebaseConfig = {
  apiKey: pickConfigValue(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    "AIzaSyAjMCDAeujRLdQJwnCgZrl9hePeJYJ-3UM",
  ),
  authDomain: pickConfigValue(
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    "viginyx-21488.firebaseapp.com",
  ),
  projectId: pickConfigValue(
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    "viginyx-21488",
  ),
  storageBucket: pickConfigValue(
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    "viginyx-21488.firebasestorage.app",
  ),
  messagingSenderId: pickConfigValue(
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    "172611303385",
  ),
  appId: pickConfigValue(
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    "1:172611303385:web:402b8bfe968321fc8f8bc8",
  ),
  measurementId: pickConfigValue(
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    "G-XVXE9WRV7W",
  ),
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
