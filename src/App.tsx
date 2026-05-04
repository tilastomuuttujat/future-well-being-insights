import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TopNav } from "@/components/TopNav";
import Lukija from "./pages/Lukija";
import Navigaattori from "./pages/Navigaattori";
import NavigaattoriKartta from "./pages/NavigaattoriKartta";
import NavigaattoriKeha from "./pages/NavigaattoriKeha";
import Reseptit from "./pages/Reseptit";
import ReseptiDetail from "./pages/ReseptiDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min — reseptidatat ovat hitaasti muuttuvia
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider delayDuration={150}>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <div className="min-h-screen flex flex-col">
          <TopNav />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Lukija />} />
              <Route path="/navigaattori" element={<Navigaattori />} />
              <Route path="/navigaattori/kartta" element={<NavigaattoriKartta />} />
              <Route path="/navigaattori/keha" element={<NavigaattoriKeha />} />
              <Route path="/reseptit" element={<Reseptit />} />
              <Route path="/reseptit/:id" element={<ReseptiDetail />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
