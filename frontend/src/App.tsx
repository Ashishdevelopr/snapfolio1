import { Switch, Route } from "wouter";
import Dashboard from "./pages/dashboard";
import Auth from "./pages/auth";
import NotFound from "./pages/not-found";
import Profile from "./pages/profile";
import IndexDetail from "./pages/index-detail";
import HomePage from "./pages/home";
import MyIndexesPage from "./pages/myindexes";
import CreateAndPreviewIndex from "./pages/create-and-preview-index";
// import MyIndexes from "./pages/myindexes";

function App() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={Auth} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/create-index" component={CreateAndPreviewIndex} />
      <Route path="/indexes" component={MyIndexesPage} />
      {/* <Route path="/myindexes" component={MyIndexes} /> */}
      <Route path="/profile" component={Profile} />
      <Route path="/index/:id" component={IndexDetail} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default App;
