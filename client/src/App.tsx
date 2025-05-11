import { Switch, Route } from "wouter";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import CreatePage from "@/pages/CreatePage";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import InstallPrompt from "@/components/InstallPrompt";
import FooterLinks from "@/components/FooterLinks";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();

  return (
    <>
      <Router />
      <OfflineIndicator />
      <InstallPrompt />
      {!isMobile && <FooterLinks />}
    </>
  );
}

export default App;
