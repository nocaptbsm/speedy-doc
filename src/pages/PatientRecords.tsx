import { useState } from "react";
import { useQueue } from "@/contexts/QueueContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { motion } from "framer-motion";
import { ClipboardList, Printer, Search, CalendarIcon, X, Lock, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const VALID_CREDENTIALS = [
  { id: "1234", password: "1234" },
  { id: "DRSK", password: "Sandeep1234" },
];

const formatDate = (ts: number) => {
  const d = new Date(ts);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const formatTime = (ts: number) => {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
};

const PatientRecords = () => {
  const { patients, deletePatient, deleteAllPatients } = useQueue();
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [doctorId, setDoctorId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (VALID_CREDENTIALS.some((c) => c.id === doctorId && c.password === password)) {
      setIsAuthenticated(true);
      setError("");
    } else {
      setError("Invalid ID or password");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="w-full max-w-sm shadow-soft">
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Records Access</CardTitle>
              <CardDescription>Enter your credentials to view patient records</CardDescription>
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

  const sorted = [...patients].reverse();

  // Filter
  const filtered = sorted.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.phone.includes(q) ||
      (p.patientId && p.patientId.toLowerCase().includes(q));

    const bookedDate = new Date(p.bookedAt);
    const matchesFrom = !dateFrom || bookedDate >= new Date(dateFrom.setHours(0, 0, 0, 0));
    const matchesTo = !dateTo || bookedDate <= new Date(new Date(dateTo).setHours(23, 59, 59, 999));

    return matchesSearch && matchesFrom && matchesTo;
  });

  const getVisitNumber = (patient: typeof patients[0], index: number) => {
    const allPatients = [...patients];
    const patientIndex = patients.length - 1 - index;
    let count = 0;
    for (let i = 0; i <= patientIndex; i++) {
      if (allPatients[i].phone === patient.phone) count++;
    }
    return count;
  };

  const clearFilters = () => {
    setSearchQuery("");
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const hasFilters = searchQuery || dateFrom || dateTo;

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const rows = filtered
      .map((p, i) => {
        const visitNum = getVisitNumber(p, sorted.indexOf(p));
        const consultMins =
          p.status === "done" && p.calledAt && p.doneAt
            ? Math.max(1, Math.round((p.doneAt - p.calledAt) / 60000))
            : null;

        return `<tr>
          <td>${p.patientId || "—"}</td>
          <td>${p.name}</td>
          <td>${p.phone}</td>
          <td>${p.reason}</td>
          <td>${visitNum > 1 ? `Follow-up (Visit #${visitNum})` : "First Visit"}</td>
          <td>${formatDate(p.bookedAt)}</td>
          <td>${formatTime(p.bookedAt)}</td>
          <td>${p.status === "done" ? "Visited" : p.status === "called" ? "In Consultation" : "Waiting"}</td>
          <td>${p.calledAt ? formatTime(p.calledAt) : "—"}</td>
          <td>${p.doneAt ? formatTime(p.doneAt) : "—"}</td>
          <td>${consultMins ? `${consultMins} min` : "—"}</td>
          <td>${p.doctorNotes || "—"}</td>
        </tr>`;
      })
      .join("");

    printWindow.document.write(`<!DOCTYPE html><html><head><title>Patient Records - MediQueue</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { text-align: center; margin-bottom: 5px; }
        p.sub { text-align: center; color: #666; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
        th { background: #f5f5f5; font-weight: 600; }
        @media print { body { padding: 0; } }
      </style></head><body>
      <h1>MediQueue - Patient Records</h1>
      <p class="sub">Generated on ${new Date().toLocaleString("en-IN")}</p>
      <table>
        <thead><tr>
          <th>Patient ID</th><th>Name</th><th>Phone</th><th>Reason</th><th>Type</th>
          <th>Date</th><th>Time</th><th>Status</th><th>Called</th><th>Completed</th><th>Duration</th><th>Doctor Notes</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table></body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary shadow-soft">
            <ClipboardList className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Patient Records</h1>
          <p className="mt-2 text-muted-foreground">Complete history of all patient bookings</p>
        </div>

        {/* Search & Filters */}
        <Card className="mb-4 shadow-soft">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[200px] space-y-1">
                <Label className="text-xs text-muted-foreground">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, phone, or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">From</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-[140px] justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, "dd MMM yyyy") : "Start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">To</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-[140px] justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, "dd MMM yyyy") : "End date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
              </div>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                  <X className="mr-1 h-4 w-4" /> Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>All Records</span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{filtered.length} of {patients.length}</Badge>
                <Button size="sm" variant="outline" onClick={handlePrint} disabled={filtered.length === 0}>
                  <Printer className="mr-1 h-4 w-4" /> Print / PDF
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive" disabled={patients.length === 0}>
                      <Trash2 className="mr-1 h-4 w-4" /> Delete All
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete All Records</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete all {patients.length} patient records? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={deleteAllPatients} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete All</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                {hasFilters ? "No records match your filters" : "No patient records yet"}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Booking Date</TableHead>
                      <TableHead>Booking Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Called At</TableHead>
                      <TableHead>Completed At</TableHead>
                      <TableHead>Consultation</TableHead>
                      <TableHead>Doctor Notes</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((p) => {
                      const sortedIdx = sorted.indexOf(p);
                      const visitNum = getVisitNumber(p, sortedIdx);
                      const consultMins =
                        p.status === "done" && p.calledAt && p.doneAt
                          ? Math.max(1, Math.round((p.doneAt - p.calledAt) / 60000))
                          : null;

                      return (
                        <TableRow key={p.id}>
                          <TableCell className="font-mono text-sm font-semibold text-primary">{p.patientId || "—"}</TableCell>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell>{p.phone}</TableCell>
                          <TableCell>{p.reason}</TableCell>
                          <TableCell>
                            <Badge
                              variant={visitNum > 1 ? "outline" : "default"}
                              className={`text-xs ${visitNum > 1 ? "border-orange-400 bg-orange-100 text-orange-700 dark:border-orange-500 dark:bg-orange-950 dark:text-orange-300" : ""}`}
                            >
                              {visitNum > 1 ? `Follow-up #${visitNum}` : "First Visit"}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(p.bookedAt)}</TableCell>
                          <TableCell>{formatTime(p.bookedAt)}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                p.status === "done" ? "secondary" : p.status === "called" ? "default" : "outline"
                              }
                              className="text-xs"
                            >
                              {p.status === "done" ? "Visited" : p.status === "called" ? "In Consultation" : "Waiting"}
                            </Badge>
                          </TableCell>
                          <TableCell>{p.calledAt ? formatTime(p.calledAt) : "—"}</TableCell>
                          <TableCell>{p.doneAt ? formatTime(p.doneAt) : "—"}</TableCell>
                          <TableCell>{consultMins ? `${consultMins} min` : "—"}</TableCell>
                          <TableCell className="max-w-[200px] truncate text-xs">{p.doctorNotes || "—"}</TableCell>
                          <TableCell>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Record</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete the record for {p.patientId} ({p.name})? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deletePatient(p.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      );
                    })}

                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default PatientRecords;
