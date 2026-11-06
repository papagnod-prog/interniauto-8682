import { Route, Switch } from "wouter";
import { AgentFeedback } from "@runablehq/website-runtime";
import { Provider } from "./components/provider";
import { SiteLayout } from "./components/site-layout";
import { AdminLayout } from "./components/admin-layout";
import HomePage from "./pages/home";
import CatalogPage from "./pages/catalog";
import ProductPage from "./pages/product";
import CartPage from "./pages/cart";
import CheckoutPage from "./pages/checkout";
import OrderPage from "./pages/order";
import AssistancePage from "./pages/assistance";
import NotFoundPage from "./pages/not-found";
import AdminLoginPage from "./pages/admin/login";
import AdminOverviewPage from "./pages/admin/overview";
import AdminProductsPage from "./pages/admin/products";
import AdminProductEditPage from "./pages/admin/product-edit";
import AdminCategoriesPage from "./pages/admin/categories";
import { AdminOrderDetailPage, AdminOrdersPage } from "./pages/admin/orders";
import AdminSettingsPage from "./pages/admin/settings";

function AdminRoutes() {
  return (
    <AdminLayout>
      <Switch>
        <Route path="/admin" component={AdminOverviewPage} />
        <Route path="/admin/prodotti" component={AdminProductsPage} />
        <Route path="/admin/prodotti/nuovo">
          <AdminProductEditPage id={null} />
        </Route>
        <Route path="/admin/prodotti/:id">
          {(params) => {
            const id = Number.parseInt(params.id, 10);
            return Number.isInteger(id) && id > 0 ? (
              <AdminProductEditPage id={id} />
            ) : (
              <p className="bp-error">Prodotto non trovato.</p>
            );
          }}
        </Route>
        <Route path="/admin/categorie" component={AdminCategoriesPage} />
        <Route path="/admin/ordini" component={AdminOrdersPage} />
        <Route path="/admin/ordini/:id">{(params) => <AdminOrderDetailPage id={params.id} />}</Route>
        <Route path="/admin/impostazioni" component={AdminSettingsPage} />
        <Route>
          <p className="bp-error">Sezione non trovata.</p>
        </Route>
      </Switch>
    </AdminLayout>
  );
}

function PublicRoutes() {
  return (
    <SiteLayout>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/catalogo" component={CatalogPage} />
        <Route path="/prodotto/:slug" component={ProductPage} />
        <Route path="/carrello" component={CartPage} />
        <Route path="/checkout" component={CheckoutPage} />
        <Route path="/ordine/:token" component={OrderPage} />
        <Route path="/assistenza" component={AssistancePage} />
        <Route>
          <NotFoundPage />
        </Route>
      </Switch>
    </SiteLayout>
  );
}

function App() {
  return (
    <Provider>
      <Switch>
        <Route path="/admin/login" component={AdminLoginPage} />
        <Route path="/admin/*?" component={AdminRoutes} />
        <Route component={PublicRoutes} />
      </Switch>
      {/* Do not remove — off by default, activated by parent iframe via postMessage */}
      {import.meta.env.DEV && <AgentFeedback />}
    </Provider>
  );
}

export default App;
