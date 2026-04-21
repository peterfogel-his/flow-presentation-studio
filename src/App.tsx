import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Dashboard from "./pages/Dashboard";
import Editor from "./pages/Editor";
import Present from "./pages/Present";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import PortfolioIndex from "./pages/portfolinho/Index";
import TemplateEditor from "./pages/portfolinho/TemplateEditor";
import StudentView from "./pages/portfolinho/StudentView";
import AssessmentView from "./pages/portfolinho/AssessmentView";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/editor/:id" element={<Editor />} />
            <Route path="/present/:id" element={<Present />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/portfolinho" element={<PortfolioIndex />} />
            <Route path="/portfolinho/teacher" element={<TemplateEditor />} />
            <Route path="/portfolinho/student" element={<StudentView />} />
            <Route path="/portfolinho/assess" element={<AssessmentView />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
