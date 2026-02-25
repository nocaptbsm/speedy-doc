import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueue } from "@/contexts/QueueContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarPlus, Clock, Users, ArrowRight, UserPlus, RotateCcw } from "lucide-react";

const reasons = ["Follow up", "Consultation", "Lab reports", "Others"];

const Index = () => {
  const { addPatient, patients, findPatientByPatientId } = useQueue();
  const navigate = useNavigate();

  // Visit type selection
  const [visitType, setVisitType] = useState<"" | "first" | "followup">("");

  // First visit fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");

  // Follow-up fields
  const [followUpPatientId, setFollowUpPatientId] = useState("");
  const [followUpError, setFollowUpError] = useState("");
  const [followUpReason, setFollowUpReason] = useState("");

  const waitingCount = patients.filter((p) => p.status === "waiting").length;

  const handleFirstVisitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !reason) return;
    const patient = addPatient({
      name,
      phone,
      reason,
      age: age ? parseInt(age) : undefined,
      height: height ? parseFloat(height) : undefined,
      weight: weight ? parseFloat(weight) : undefined,
    });
    alert(`Your Patient ID is: ${patient.patientId}\nPlease note it down for reference.`);
    navigate(`/queue/${patient.id}`);
  };

  const handleFollowUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpPatientId || !followUpReason) return;
    const existing = findPatientByPatientId(followUpPatientId.toUpperCase());
    if (!existing) {
      setFollowUpError("Patient ID not found. Please check and try again.");
      return;
    }
    setFollowUpError("");
    const patient = addPatient({
      name: existing.name,
      phone: existing.phone,
      reason: followUpReason,
      age: existing.age,
      height: existing.height,
      weight: existing.weight,
    });
    alert(`Your Patient ID is: ${patient.patientId}\nPlease note it down for reference.`);
    navigate(`/queue/${patient.id}`);
  };

  const resetSelection = () => {
    setVisitType("");
    setName("");
    setPhone("");
    setReason("");
    setAge("");
    setHeight("");
    setWeight("");
    setFollowUpPatientId("");
    setFollowUpError("");
    setFollowUpReason("");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-xl"
      >
        {/* Hero */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary shadow-soft">
            <CalendarPlus className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Book Your Appointment</h1>
          <p className="mt-2 text-muted-foreground">Schedule your consultation and receive real-time updates</p>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-card">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
              <Users className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{waitingCount}</p>
              <p className="text-xs text-muted-foreground">In queue</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-card">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
              <Clock className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">~{waitingCount * 10} min</p>
              <p className="text-xs text-muted-foreground">Est. wait</p>
            </div>
          </div>
        </div>

        {/* Visit Type Selection */}
        <AnimatePresence mode="wait">
          {!visitType && (
            <motion.div key="selection" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle>Are you here for?</CardTitle>
                  <CardDescription>Select your visit type to proceed</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="flex h-24 flex-col items-center justify-center gap-2 rounded-xl border-2 hover:border-primary hover:bg-primary/5"
                    onClick={() => setVisitType("first")}
                  >
                    <UserPlus className="h-6 w-6 text-primary" />
                    <span className="font-semibold">First Visit</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex h-24 flex-col items-center justify-center gap-2 rounded-xl border-2 hover:border-primary hover:bg-primary/5"
                    onClick={() => setVisitType("followup")}
                  >
                    <RotateCcw className="h-6 w-6 text-primary" />
                    <span className="font-semibold">Follow-up Visit</span>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* First Visit Form */}
          {visitType === "first" && (
            <motion.div key="first" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <Card className="shadow-soft">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>New Patient Registration</CardTitle>
                      <CardDescription>Fill in your details to join the queue</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={resetSelection} className="text-muted-foreground">
                      ← Back
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleFirstVisitSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" placeholder="Enter your full name" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" placeholder="Enter your phone number" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="age">Age</Label>
                        <Input id="age" type="number" placeholder="Years" value={age} onChange={(e) => setAge(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="height">Height (cm)</Label>
                        <Input id="height" type="number" placeholder="cm" value={height} onChange={(e) => setHeight(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="weight">Weight (kg)</Label>
                        <Input id="weight" type="number" placeholder="kg" value={weight} onChange={(e) => setWeight(e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Reason for Visit</Label>
                      <Select value={reason} onValueChange={setReason} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select reason" />
                        </SelectTrigger>
                        <SelectContent>
                          {reasons.map((r) => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" className="w-full gradient-primary text-primary-foreground" size="lg" disabled={!name || !phone || !reason}>
                      Join Queue <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Follow-up Visit Form */}
          {visitType === "followup" && (
            <motion.div key="followup" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <Card className="shadow-soft">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Follow-up Visit</CardTitle>
                      <CardDescription>Enter your Patient ID to book quickly</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={resetSelection} className="text-muted-foreground">
                      ← Back
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleFollowUpSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="followUpId">Patient ID</Label>
                      <Input
                        id="followUpId"
                        placeholder="e.g. MQ-001"
                        value={followUpPatientId}
                        onChange={(e) => { setFollowUpPatientId(e.target.value); setFollowUpError(""); }}
                        required
                      />
                      {followUpError && <p className="text-sm text-destructive">{followUpError}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Reason for Visit</Label>
                      <Select value={followUpReason} onValueChange={setFollowUpReason} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select reason" />
                        </SelectTrigger>
                        <SelectContent>
                          {reasons.map((r) => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" className="w-full gradient-primary text-primary-foreground" size="lg" disabled={!followUpPatientId || !followUpReason}>
                      Book Follow-up <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Index;
