import { useParams, Link } from "react-router-dom";
import { useQueue } from "@/contexts/QueueContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Clock, Hash, CheckCircle2, PhoneCall, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";

const PatientQueue = () => {
  const { id } = useParams<{ id: string }>();
  const { patients, getPatientPosition, getPatientETA, currentPatient } = useQueue();
  const [, setTick] = useState(0);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(interval);
  }, []);

  const patient = patients.find((p) => p.id === id);

  if (!patient) {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4">
        <Card className="max-w-md text-center shadow-soft">
          <CardContent className="p-8">
            <p className="text-lg text-muted-foreground">Patient not found</p>
            <Link to="/">
              <Button variant="outline" className="mt-4"><ArrowLeft className="mr-2 h-4 w-4" /> Back to booking</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isCalled = patient.status === "called";
  const isDone = patient.status === "done";
  const position = getPatientPosition(patient.id);
  const eta = getPatientETA(patient.id);

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-md">
        <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to booking
        </Link>

        {isCalled && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-6 rounded-2xl gradient-primary p-6 text-center text-primary-foreground shadow-soft"
          >
            <PhoneCall className="mx-auto mb-3 h-10 w-10 animate-pulse" />
            <h2 className="text-2xl font-bold">It's Your Turn!</h2>
            <p className="mt-1 opacity-90">Please proceed to the doctor's office</p>
          </motion.div>
        )}

        {isDone && (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mb-6 rounded-2xl bg-success p-6 text-center text-success-foreground shadow-soft">
            <CheckCircle2 className="mx-auto mb-3 h-10 w-10" />
            <h2 className="text-2xl font-bold">Visit Complete</h2>
            <p className="mt-1 opacity-90">Thank you for visiting MediQueue</p>
          </motion.div>
        )}

        <Card className="shadow-soft">
          <CardContent className="p-6">
            <div className="mb-4 text-center">
              <h2 className="text-xl font-semibold text-foreground">{patient.name}</h2>
              <p className="text-sm text-muted-foreground">{patient.reason}</p>
            </div>

            {!isDone && !isCalled && (
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-accent p-4 text-center">
                  <Hash className="mx-auto mb-1 h-5 w-5 text-accent-foreground" />
                  <p className="text-3xl font-bold text-foreground">{position}</p>
                  <p className="text-xs text-muted-foreground">Queue Position</p>
                </div>
                <div className="rounded-xl bg-accent p-4 text-center">
                  <Clock className="mx-auto mb-1 h-5 w-5 text-accent-foreground" />
                  <p className="text-3xl font-bold text-foreground">~{eta}</p>
                  <p className="text-xs text-muted-foreground">Minutes ETA</p>
                </div>
              </div>
            )}

            {!isDone && !isCalled && (
              <p className="mt-4 text-center text-xs text-muted-foreground">
                This page updates automatically every 5 seconds
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default PatientQueue;
