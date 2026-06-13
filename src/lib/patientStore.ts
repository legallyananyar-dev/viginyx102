import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type PatientStatus = "active" | "flagged" | "completed";

export interface Answer {
  q: string;
  a: string;
  flag: boolean;
}

export interface PatientRecord {
  id: string;
  ownerEmail: string;
  code: string;
  name: string;
  age: string;
  drug: string;
  phone?: string;
  registeredAt: string;
  status: PatientStatus;
  answers: Answer[];
  summary?: string;
  updatedAt?: string;
}

type PatientPayload = Omit<PatientRecord, "id">;

const PATIENTS_COLLECTION = "patient_records";

function toIsoString(value: Timestamp | Date | string | undefined): string {
  if (!value) return new Date().toISOString();
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  return value.toDate().toISOString();
}

function normalizeRecord(id: string, data: Record<string, unknown>): PatientRecord {
  return {
    id,
    ownerEmail: String(data.ownerEmail || ""),
    code: String(data.code || ""),
    name: String(data.name || ""),
    age: String(data.age || ""),
    drug: String(data.drug || ""),
    phone: typeof data.phone === "string" ? data.phone : undefined,
    registeredAt: toIsoString(
      data.registeredAt as Timestamp | Date | string | undefined,
    ),
    status: (data.status as PatientStatus) || "active",
    answers: Array.isArray(data.answers) ? (data.answers as Answer[]) : [],
    summary: typeof data.summary === "string" ? data.summary : undefined,
    updatedAt: toIsoString(data.updatedAt as Timestamp | Date | string | undefined),
  };
}

function sortByNewest(patients: PatientRecord[]) {
  return [...patients].sort(
    (first, second) =>
      new Date(second.registeredAt).getTime() - new Date(first.registeredAt).getTime(),
  );
}

export async function fetchPatients(ownerEmail: string): Promise<PatientRecord[]> {
  const snapshot = await getDocs(
    query(collection(db, PATIENTS_COLLECTION), where("ownerEmail", "==", ownerEmail)),
  );

  return sortByNewest(
    snapshot.docs.map((entry) => normalizeRecord(entry.id, entry.data())),
  );
}

export function subscribeToPatients(
  ownerEmail: string,
  onChange: (patients: PatientRecord[]) => void,
) {
  return onSnapshot(
    query(collection(db, PATIENTS_COLLECTION), where("ownerEmail", "==", ownerEmail)),
    (snapshot) => {
      onChange(
        sortByNewest(
          snapshot.docs.map((entry) => normalizeRecord(entry.id, entry.data())),
        ),
      );
    },
  );
}

export async function createPatientRecord(
  ownerEmail: string,
  data: Omit<PatientPayload, "id" | "ownerEmail">,
) {
  const payload = {
    ...data,
    ownerEmail,
    answers: data.answers || [],
    registeredAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const ref = await addDoc(collection(db, PATIENTS_COLLECTION), payload);
  return ref.id;
}

export async function updatePatientRecord(
  ownerEmail: string,
  code: string,
  updates: Partial<Omit<PatientPayload, "id" | "ownerEmail">>,
) {
  const snapshot = await getDocs(
    query(collection(db, PATIENTS_COLLECTION), where("ownerEmail", "==", ownerEmail)),
  );
  const target = snapshot.docs.find((entry) => entry.data().code === code);

  if (!target) return null;

  await updateDoc(doc(db, PATIENTS_COLLECTION, target.id), {
    ...updates,
    updatedAt: serverTimestamp(),
  });

  return target.id;
}
