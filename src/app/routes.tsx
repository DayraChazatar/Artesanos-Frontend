import { createBrowserRouter } from "react-router-dom";
import { Root } from "./pages/Root";
import { Home } from "./pages/Home";
import { NotFound } from "./pages/NotFound";
import { ErrorPage } from "./pages/ErrorPage";
import { RequireRole } from "./components/RequireRole";

// Solo la portada y el layout se cargan de entrada; el resto de páginas se
// descargan al visitarlas. Antes todo (panel de admin, gráficos del artesano,
// generación de PDF, etc.) viajaba en un solo archivo de 1.1 MB aunque el
// visitante solo viera la portada.
export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    errorElement: <ErrorPage />,
    HydrateFallback: () => (
      <div className="py-20 text-center text-gray-500">Cargando…</div>
    ),
    children: [
      { index: true, Component: Home },
      { path: "registro", lazy: async () => ({ Component: (await import("./pages/Register")).Register }) },
      { path: "login", lazy: async () => ({ Component: (await import("./pages/Login")).Login }) },
      { path: "recuperar-contraseña", lazy: async () => ({ Component: (await import("./pages/ForgotPassword")).ForgotPassword }) },
      { path: "restablecer-contrasena/:token", lazy: async () => ({ Component: (await import("./pages/RestablecerContrasena")).RestablecerContrasena }) },
      { path: "perfil", lazy: async () => ({ Component: (await import("./pages/PerfilCliente")).Profile }) },
      {
        path: "perfil-artesano",
        lazy: async () => {
          const PerfilArtesano = (await import("./pages/PerfilArtesano")).default;
          return {
            element: (
              <RequireRole role="artisan">
                <PerfilArtesano />
              </RequireRole>
            ),
          };
        },
      },
      { path: "catalogo", lazy: async () => ({ Component: (await import("./pages/Catalog")).Catalog }) },
      { path: "producto/:id", lazy: async () => ({ Component: (await import("./pages/ProductDetail")).ProductDetail }) },
      { path: "producto/editar/:id", lazy: async () => ({ Component: (await import("./pages/ProductEdit")).ProductEdit }) },
      { path: "carrito", lazy: async () => ({ Component: (await import("./pages/Cart")).Cart }) },
      { path: "checkout", lazy: async () => ({ Component: (await import("./pages/Checkout")).Checkout }) },
      { path: "mis-pedidos", lazy: async () => ({ Component: (await import("./pages/MisPedidos")).MisPedidos }) },
      { path: "politica-datos", lazy: async () => ({ Component: (await import("./pages/PoliticaDatos")).PoliticaDatos }) },
      { path: "terminos-condiciones", lazy: async () => ({ Component: (await import("./pages/TerminosCondiciones")).TerminosCondiciones }) },
      {
        path: "admin",
        lazy: async () => {
          const Admin = (await import("./pages/Admin")).default;
          return {
            element: (
              <RequireRole role="admin">
                <Admin />
              </RequireRole>
            ),
          };
        },
      },
      { path: "*", Component: NotFound },
    ],
  },
]);
