import { createBrowserRouter } from "react-router";
import { Root } from "./pages/Root";
import { Home } from "./pages/Home";
import { Register } from "./pages/Register";
import { Login } from "./pages/Login";
import { ForgotPassword } from "./pages/ForgotPassword";
import { Profile } from "./pages/PerfilCliente";
import { Catalog } from "./pages/Catalog";
import { ProductDetail } from "./pages/ProductDetail";
import { ProductEdit } from "./pages/ProductEdit";
import { Cart } from "./pages/Cart";
import { Checkout } from "./pages/Checkout";
import { Dashboard } from "./pages/Dashboard";
import { NotFound } from "./pages/NotFound";
import PerfilArtesano from "./pages/PerfilArtesano";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "registro", Component: Register },
      { path: "login", Component: Login },
      { path: "recuperar-contraseña", Component: ForgotPassword },
      { path: "perfil", Component: Profile },
      { path: "perfil-artesano", Component: PerfilArtesano },
      { path: "catalogo", Component: Catalog },
      { path: "producto/:id", Component: ProductDetail },
      { path: "producto/editar/:id", Component: ProductEdit },
      { path: "carrito", Component: Cart },
      { path: "checkout", Component: Checkout },
      { path: "dashboard", Component: Dashboard },
      { path: "*", Component: NotFound },
    ],
  },
]);
