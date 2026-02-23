import { useQueue } from "@/contexts/QueueContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { PhoneCall, UserCheck, Users, Clock, CheckCircle2, ArrowUp, ArrowDown, Lock } from "lucide-react";
import { useEffect, useState } from "react";

const DOCTOR_ID = "1234";
const DOCTOR_PASSWORD = "1234";

const DoctorDashboard = () => {
  const { patients, callNextPatient, callSpecificPatient, movePatient, markDone, currentPatient, avgMinutesPerPatient } = useQueue();
  const [, setTick] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [doctorId, setDoctorId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (doctorId === DOCTOR_ID && password === DOCTOR_PASSWORD) {
      setIsAuthenticated(true);
      setError("");
    } else {
      setError("Invalid ID or password");
    }
  };

  const waitingPatients = patients.filter((p) => p.status === "waiting");
  const doneToday = patients.filter((p) => p.status === "done").length;

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="w-full max-w-sm shadow-soft">
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Doctor Login</CardTitle>
              <CardDescription>Enter your credentials to access the dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="doctorId">Doctor ID</Label>
                  <Input id="doctorId" placeholder="Enter your ID" value={doctorId} onChange={(e) => setDoctorId(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full gradient-primary text-primary-foreground">Login</Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="mb-6 text-2xl font-bold text-foreground">Doctor Dashboard</h1>

        {/* Stats Row */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          <div className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-card">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
              <Users className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{waitingPatients.length}</p>
              <p className="text-xs text-muted-foreground">Waiting</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-card">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
              <Clock className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">~{waitingPatients.length * avgMinutesPerPatient}m</p>
              <p className="text-xs text-muted-foreground">Total Wait</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-card">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
              <CheckCircle2 className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{doneToday}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </div>
        </div>

        {/* Current Patient */}
        {currentPatient && (
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <Card className="mb-6 border-primary/30 shadow-soft">
              <CardHeader className="pb-3">
                <CardDescription>Currently Seeing</CardDescription>
                <CardTitle className="flex items-center gap-2">
                  <PhoneCall className="h-5 w-5 text-primary" />
                  {currentPatient.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{currentPatient.reason}</span>
                <Button size="sm" variant="outline" onClick={() => markDone(currentPatient.id)}>
                  <UserCheck className="mr-2 h-4 w-4" /> Mark Done
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Call Next */}
        <Button
          className="mb-6 w-full gradient-primary text-primary-foreground"
          size="lg"
          disabled={waitingPatients.length === 0}
          onClick={callNextPatient}
        >
          <PhoneCall className="mr-2 h-5 w-5" />
          Call Next Patient
          {waitingPatients.length > 0 && ` (${waitingPatients[0].name})`}
        </Button>

        {/* Waiting List */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Waiting List</CardTitle>
            <CardDescription>{waitingPatients.length} patients waiting</CardDescription>
          </CardHeader>
          <CardContent>
            {waitingPatients.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">No patients in queue</p>
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {waitingPatients.map((patient, idx) => (
                    <motion.div
                      key={patient.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-medium text-foreground">{patient.name}</p>
                          <p className="text-xs text-muted-foreground">{patient.reason}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" disabled={idx === 0} onClick={() => movePatient(patient.id, "up")}>
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" disabled={idx === waitingPatients.length - 1} onClick={() => movePatient(patient.id, "down")}>
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => callSpecificPatient(patient.id)}>
                          <PhoneCall className="mr-1 h-3 w-3" /> Call
                        </Button>
                        <span className="ml-1 text-sm text-muted-foreground">
                          ~{(idx + (currentPatient ? 1 : 0)) * avgMinutesPerPatient}m
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default DoctorDashboard;
