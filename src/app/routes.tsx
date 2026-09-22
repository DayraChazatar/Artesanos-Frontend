import { createBrowserRouter } from "react-router-dom";
import { Root } from "./pages/Root";
import { Home } from "./pages/Home";
import { Register } from "./pages/Register";
import { Login } from "./pages/Login";
import { ForgotPassword } from "./pages/ForgotPassword";
import { RestablecerContrasena } from "./pages/RestablecerContrasena";
import { Profile } from "./pages/PerfilCliente";
import { Catalog } from "./pages/Catalog";
import { ProductDetail } from "./pages/ProductDetail";
import { ProductEdit } from "./pages/ProductEdit";
import { Cart } from "./pages/Cart";
import { Checkout } from "./pages/Checkout";
import { NotFound } from "./pages/NotFound";
import { ErrorPage } from "./pages/ErrorPage";
import PerfilArtesano from "./pages/PerfilArtesano";
import { MisPedidos } from "./pages/MisPedidos";
import Admin from "./pages/Admin";
import { RequireRole } from "./components/RequireRole";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    errorElement: <ErrorPage />,
    children: [
      { index: true, Component: Home },
      { path: "registro", Component: Register },
      { path: "login", Component: Login },
      { path: "recuperar-contraseña", Component: ForgotPassword },
      { path: "restablecer-contrasena/:token", Component: RestablecerContrasena },
      { path: "perfil", Component: Profile },
      {
        path: "perfil-artesano",
        element: (
          <RequireRole role="artisan">
            <PerfilArtesano />
          </RequireRole>
        ),
      },
      { path: "catalogo", Component: Catalog },
      { path: "producto/:id", Component: ProductDetail },
      { path: "producto/editar/:id", Component: ProductEdit },
      { path: "carrito", Component: Cart },
      { path: "checkout", Component: Checkout },
      { path: "mis-pedidos", Component: MisPedidos },
      {
        path: "admin",
        element: (
          <RequireRole role="admin">
            <Admin />
          </RequireRole>
        ),
      },
      { path: "*", Component: NotFound },
    ],
  },
]);
