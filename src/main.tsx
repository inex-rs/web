/* @refresh reload */
import { render } from "solid-js/web";
import { Navigate, Route, Router, useParams } from "@solidjs/router";
import "./index.css";

import { Layout } from "./components/layout.tsx";
import { Home } from "./pages/home.tsx";
import { Saros } from "./pages/saros.tsx";
import { Docs } from "./pages/docs.tsx";
import { Authorize } from "./pages/authorize.tsx";
import { Account } from "./pages/account.tsx";
import { NotFound } from "./pages/notfound.tsx";
import { applyTheme, currentTheme } from "./lib/theme.ts";
import { applyThemedFavicon } from "./lib/favicon.ts";

applyTheme(currentTheme());
applyThemedFavicon();
addEventListener("inex-themechange", applyThemedFavicon);

render(
  () => (
    <Router root={Layout}>
      <Route path="/" component={Home} />
      <Route path="/saros/:device?/:version?" component={Saros} />
      <Route
        path="/registry/:device?/:set?/:version?"
        component={() => {
          const p = useParams();
          return (
            <Navigate
              href={["/saros", p.device, p.set, p.version].filter(Boolean)
                .join("/")}
            />
          );
        }}
      />
      <Route path="/docs/*slug" component={Docs} />
      <Route path="/authorize" component={Authorize} />
      <Route path="/account" component={Account} />
      <Route path="*" component={NotFound} />
    </Router>
  ),
  document.getElementById("root")!,
);
