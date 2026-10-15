import { Authenticated, Refine } from "@refinedev/core";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";
import { BrowserRouter, Outlet, Route, Routes } from "react-router";
import routerProvider, {
  CatchAllNavigate,
  NavigateToResource,
  UnsavedChangesNotifier,
  DocumentTitleHandler,
} from "@refinedev/react-router";
import { dataProvider } from "./backend/data";
import { authProvider } from "./backend/auth";
import { useNotificationProvider } from "./frontend/components/refine-ui/notification/use-notification-provider";
import { Toaster } from "./frontend/components/refine-ui/notification/toaster";
import { ThemeProvider } from "./frontend/components/refine-ui/theme/theme-provider";
import "./App.css";
import Dashboard from "./frontend/pages/dashboard";
import Orders from "./frontend/pages/orders";
import Products from "./frontend/pages/products";
import Records from "./frontend/pages/records";
import Analytics from "./frontend/pages/analytics";
import Settings from "./frontend/pages/settings";
import { SignInForm } from "./frontend/components/refine-ui/form/sign-in-form";
import { SignUpForm } from "./frontend/components/refine-ui/form/sign-up-form";
import { Home, Package, Tag, Table, BarChart3 } from "lucide-react";
import { Layout } from "./frontend/components/refine-ui/layout/layout";

function App() {
  return (
    <BrowserRouter>
      <RefineKbarProvider>
        <ThemeProvider>
          <Refine
            dataProvider={dataProvider}
            authProvider={authProvider}
            notificationProvider={useNotificationProvider()}
            routerProvider={routerProvider}
              options={{
                syncWithLocation: true,
                warnWhenUnsavedChanges: true,
                projectId: "qLedav-z4lJY5-ly2aJh",
              }}
              resources={[
                {
                  name: "dashboard",
                  list: "/",
                  meta: { label: "Dashboard", icon: <Home /> },
                },
                {
                  name: "orders",
                  list: "/orders",
                  meta: { label: "Order Queue", icon: <Package /> },
                },
                {
                  name: "products",
                  list: "/products",
                  meta: { label: "Products", icon: <Tag /> },
                },
                {
                  name: "records",
                  list: "/records",
                  meta: { label: "Records", icon: <Table /> },
                },
                {
                  name: "analytics",
                  list: "/analytics",
                  meta: { label: "Analytics", icon: <BarChart3 /> },
                },
              ]}
            >
              <Routes>

                <Route
                  element={
                    <Authenticated
                      key="authenticated-routes"
                      fallback={<CatchAllNavigate to="/login" />}
                    >
                      <Layout>
                        <Outlet />
                      </Layout>
                    </Authenticated>
                  }
                >
                  <Route index element={<Dashboard />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/records" element={<Records />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>


                <Route
                  element={
                    <Authenticated
                      key="auth-pages"
                      fallback={<Outlet />}
                    >
                      <NavigateToResource resource="dashboard" />
                    </Authenticated>
                  }
                >
                  <Route path="/login" element={<SignInForm />} />
                  <Route path="/register" element={<SignUpForm />} />
                </Route>
              </Routes>

              <Toaster />
              <RefineKbar />
              <UnsavedChangesNotifier />
              <DocumentTitleHandler />
            </Refine>
        </ThemeProvider>
      </RefineKbarProvider>
    </BrowserRouter>
  );
}

export default App;
