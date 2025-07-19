import { BrowserRouter, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/dashboard";
import { QueryProvider } from "./providers/query-provider";

function App() {
  return (
    <QueryProvider>
      <BrowserRouter>
        <div className="bg-background text-foreground min-h-screen">
          <main>
            <Routes>
              <Route path="/" element={<Dashboard />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </QueryProvider>
  );
}
export default App;
