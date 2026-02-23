import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

export interface Patient {
  id: string;
  name: string;
  phone: string;
  reason: string;
  bookedAt: number;
  calledAt?: number;
  doneAt?: number;
  status: "waiting" | "called" | "done";
  isFollowUp: boolean;
}

interface QueueContextType {
  patients: Patient[];
  addPatient: (patient: Omit<Patient, "id" | "bookedAt" | "status" | "isFollowUp">) => Patient;
  callNextPatient: () => Patient | null;
  callSpecificPatient: (id: string) => void;
  movePatient: (id: string, direction: "up" | "down") => void;
  markDone: (id: string) => void;
  getPatientPosition: (id: string) => number;
  getPatientETA: (id: string) => number;
  currentPatient: Patient | null;
  avgMinutesPerPatient: number;
  findPatientByPhone: (phone: string) => Patient | undefined;
}

const QueueContext = createContext<QueueContextType | null>(null);

const FIRST_VISIT_MINUTES = 10;
const FOLLOW_UP_MINUTES = 5;

export const QueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [patients, setPatients] = useState<Patient[]>(() => {
    const stored = localStorage.getItem("clinic-queue");
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem("clinic-queue", JSON.stringify(patients));
  }, [patients]);

  const addPatient = useCallback((data: Omit<Patient, "id" | "bookedAt" | "status" | "isFollowUp">) => {
    const hasVisitedBefore = patients.some((p) => p.phone === data.phone && p.status === "done");
    const newPatient: Patient = {
      ...data,
      id: crypto.randomUUID(),
      bookedAt: Date.now(),
      status: "waiting",
      isFollowUp: hasVisitedBefore,
    };
    setPatients((prev) => [...prev, newPatient]);
    return newPatient;
  }, [patients]);

  const callNextPatient = useCallback(() => {
    let calledPatient: Patient | null = null;
    setPatients((prev) => {
      const updated = prev.map((p) => (p.status === "called" ? { ...p, status: "done" as const, doneAt: Date.now() } : p));
      const nextIdx = updated.findIndex((p) => p.status === "waiting");
      if (nextIdx === -1) return updated;
      calledPatient = { ...updated[nextIdx], status: "called", calledAt: Date.now() };
      updated[nextIdx] = calledPatient;
      return [...updated];
    });
    return calledPatient;
  }, []);

  const callSpecificPatient = useCallback((id: string) => {
    setPatients((prev) => {
      const updated = prev.map((p) => (p.status === "called" ? { ...p, status: "done" as const, doneAt: Date.now() } : p));
      return updated.map((p) => (p.id === id ? { ...p, status: "called" as const, calledAt: Date.now() } : p));
    });
  }, []);

  const movePatient = useCallback((id: string, direction: "up" | "down") => {
    setPatients((prev) => {
      const waitingIds = prev.filter((p) => p.status === "waiting").map((p) => p.id);
      const idx = waitingIds.indexOf(id);
      if (idx === -1) return prev;
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= waitingIds.length) return prev;
      [waitingIds[idx], waitingIds[swapIdx]] = [waitingIds[swapIdx], waitingIds[idx]];
      // Rebuild: non-waiting stay in place, waiting reordered
      const nonWaiting = prev.filter((p) => p.status !== "waiting");
      const waitingMap = new Map(prev.filter((p) => p.status === "waiting").map((p) => [p.id, p]));
      const reorderedWaiting = waitingIds.map((wid) => waitingMap.get(wid)!);
      // Merge back preserving original interleaving positions
      const result: Patient[] = [];
      let wi = 0;
      for (const p of prev) {
        if (p.status === "waiting") {
          result.push(reorderedWaiting[wi++]);
        } else {
          result.push(p);
        }
      }
      return result;
    });
  }, []);

  const markDone = useCallback((id: string) => {
    setPatients((prev) => prev.map((p) => (p.id === id ? { ...p, status: "done", doneAt: Date.now() } : p)));
  }, []);

  const waitingPatients = patients.filter((p) => p.status === "waiting");
  const currentPatient = patients.find((p) => p.status === "called") || null;

  const getPatientPosition = useCallback(
    (id: string) => {
      const idx = waitingPatients.findIndex((p) => p.id === id);
      if (idx === -1) return -1;
      return idx + 1 + (currentPatient ? 1 : 0);
    },
    [waitingPatients, currentPatient]
  );

  const getPatientETA = useCallback(
    (id: string) => {
      const idx = waitingPatients.findIndex((p) => p.id === id);
      if (idx === -1) return 0;
      let eta = 0;
      // Add time for current patient if any
      if (currentPatient) {
        eta += currentPatient.isFollowUp ? FOLLOW_UP_MINUTES : FIRST_VISIT_MINUTES;
      }
      // Add time for each patient ahead in queue
      for (let i = 0; i < idx; i++) {
        eta += waitingPatients[i].isFollowUp ? FOLLOW_UP_MINUTES : FIRST_VISIT_MINUTES;
      }
      return eta;
    },
    [waitingPatients, currentPatient]
  );

  const findPatientByPhone = useCallback(
    (phone: string) => patients.find((p) => p.phone === phone),
    [patients]
  );

  return (
    <QueueContext.Provider
      value={{ patients, addPatient, callNextPatient, callSpecificPatient, movePatient, markDone, getPatientPosition, getPatientETA, currentPatient, avgMinutesPerPatient: FIRST_VISIT_MINUTES, findPatientByPhone }}
    >
      {children}
    </QueueContext.Provider>
  );
};

export const useQueue = () => {
  const ctx = useContext(QueueContext);
  if (!ctx) throw new Error("useQueue must be used within QueueProvider");
  return ctx;
};
