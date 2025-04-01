import { Switch, Route } from "wouter";
import LandingPage from "@/pages/landing";
import ScoreboardPage from "@/pages/scoreboard";
import AdminLayout from "@/pages/admin/index";
import AdminLogin from "@/pages/admin/login";
import NotFound from "@/pages/not-found";
import ScoreManagement from "@/pages/admin/score-management";
import MedalManagement from "@/pages/admin/medal-management";
import TeamManagement from "@/pages/admin/team-management";
import EventManagement from "@/pages/admin/event-management";
import PublishScores from "@/pages/admin/publish-scores";
import { AuthProvider } from "./lib/auth";

function App() {
  return (
    <AuthProvider>
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/scoreboard" component={ScoreboardPage} />
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin">
          {(params) => (
            <AdminLayout>
              <Switch>
                <Route path="/admin" component={ScoreManagement} />
                <Route path="/admin/scores" component={ScoreManagement} />
                <Route path="/admin/medals" component={MedalManagement} />
                <Route path="/admin/teams" component={TeamManagement} />
                <Route path="/admin/events" component={EventManagement} />
                <Route path="/admin/publish" component={PublishScores} />
                <Route component={NotFound} />
              </Switch>
            </AdminLayout>
          )}
        </Route>
        <Route component={NotFound} />
      </Switch>
    </AuthProvider>
  );
}

export default App;
