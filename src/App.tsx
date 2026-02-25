import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueueProvider } from "@/contexts/QueueContext";
import Header from "@/components/Header";
import Index from "./pages/Index";
import PatientQueue from "./pages/PatientQueue";
import PatientsDashboard from "./pages/PatientsDashboard";
import PatientRecords from "./pages/PatientRecords";
import DoctorDashboard from "./pages/DoctorDashboard";
import NotFound from "./pages/NotFound";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <QueueProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Header />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/queue/:id" element={<PatientQueue />} />
            <Route path="/patients" element={<PatientsDashboard />} />
            <Route path="/records" element={<PatientRecords />} />
            <Route path="/doctor" element={<DoctorDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </QueueProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
