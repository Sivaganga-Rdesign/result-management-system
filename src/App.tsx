import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Layout } from "@/components/Layout";
import { PublicLayout } from "@/components/PublicLayout";
import { AdminRoute } from "@/components/AdminRoute";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Subjects from "./pages/Subjects";
import Results from "./pages/Results";
import SearchResult from "./pages/SearchResult";
import Analytics from "./pages/Analytics";
import Rankings from "./pages/Rankings";
import AdminLogin from "./pages/AdminLogin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes - students can search results */}
            <Route path="/" element={<PublicLayout><SearchResult /></PublicLayout>} />
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Admin routes - protected by password */}
            <Route path="/admin/dashboard" element={<AdminRoute><Layout><Dashboard /></Layout></AdminRoute>} />
            <Route path="/admin/students" element={<AdminRoute><Layout><Students /></Layout></AdminRoute>} />
            <Route path="/admin/subjects" element={<AdminRoute><Layout><Subjects /></Layout></AdminRoute>} />
            <Route path="/admin/results" element={<AdminRoute><Layout><Results /></Layout></AdminRoute>} />
            <Route path="/admin/analytics" element={<AdminRoute><Layout><Analytics /></Layout></AdminRoute>} />
            <Route path="/admin/rankings" element={<AdminRoute><Layout><Rankings /></Layout></AdminRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
