import { ThemeProvider } from "@/components/theme-provider";
import { AuthContextProvider } from "./context/AuthContext";
import List from "./pages/List";

function App() {
  return (
    <AuthContextProvider>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <List />
      </ThemeProvider>
    </AuthContextProvider>
  )
}

export default App
