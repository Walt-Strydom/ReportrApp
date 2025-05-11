import { Switch, Route } from "wouter";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import CreatePage from "@/pages/CreatePage";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import InstallPrompt from "@/components/InstallPrompt";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/create" component={CreatePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <>
      <Router />
      <OfflineIndicator />
      <InstallPrompt />
    </>
  );
}

export default App;
