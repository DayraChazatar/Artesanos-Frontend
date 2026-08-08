import { useState, useEffect, useCallback } from 'react';
import { getProductos, getCategorias, getKardex, type Producto, type Categoria, type Kardex } from '../data/artesanoApi';

import { Tab } from './perfil-artesano/types';
import { useNotificaciones } from './perfil-artesano/hooks/useNotificaciones';
import { Topbar } from './perfil-artesano/components/Topbar';
import { Sidebar } from './perfil-artesano/components/Sidebar';
import { SidebarNotificaciones } from './perfil-artesano/components/SidebarNotificaciones';
import { ModuloCatalogo } from './perfil-artesano/modulos/ModuloCatalogo';
import { ModuloContable } from './perfil-artesano/modulos/ModuloContable';
import { ModuloProductos } from './perfil-artesano/modulos/ModuloProductos';
import { ModuloInventario } from './perfil-artesano/modulos/ModuloInventario';
import { ModuloPedidos } from './perfil-artesano/modulos/ModuloPedidos';
import { ModuloReportes } from './perfil-artesano/modulos/ModuloReportes';
import { ModuloPerfil } from './perfil-artesano/modulos/ModuloPerfil';

const ARTESANO_ID = Number(localStorage.getItem('usuario_id') ?? 1);

const Alert = ({ msg, type }: { msg: string; type: 'success' | 'info' | 'error' }) => {
  const colors = {
    success: 'bg-green-100 text-green-800 border-green-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    error: 'bg-red-100 text-red-800 border-red-200',
  };
  return <div className={`mb-4 p-3 rounded-lg border text-sm font-medium ${colors[type]}`}>{msg}</div>;
};

export default function PerfilArtesano() {
  const [tab, setTab] = useState<Tab>('catalogo');
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [kardex, setKardex] = useState<Kardex[]>([]);
  const [imagenes, setImagenes] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtroInventarioProd, setFiltroInventarioProd] = useState<string>('todos');

  const { notificaciones, marcarLeida, marcarTodasLeidas } = useNotificaciones();

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const [prods, cats, kard] = await Promise.all([
        getProductos(ARTESANO_ID),
        getCategorias(ARTESANO_ID),
        getKardex(),
      ]);
      setProductos(prods);
      setCategorias(cats);
      setKardex(kard);
      const imgs: Record<number, string> = {};
      prods.forEach((p: any) => { if (p.id && p.imagen_url) imgs[p.id] = p.imagen_url; });
      setImagenes(imgs);
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  return (
    <div className="min-h-screen bg-amber-50/60 font-sans text-base">
      <Topbar noLeidas={notificaciones.filter(n => !n.leida).length} onVerPerfil={() => setTab('perfil')} />
      <Sidebar active={tab} onChange={setTab} />
      <SidebarNotificaciones
        notificaciones={notificaciones}
        marcarLeida={marcarLeida}
        marcarTodasLeidas={marcarTodasLeidas}
        onNavegar={(t, productoId) => {
          if (productoId) setFiltroInventarioProd(String(productoId));
          setTab(t);
        }}
      />
      <main className="pt-16 pl-40 pr-64 min-h-screen text-base">
        <div className="max-w-7xl mx-auto px-8 py-8">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-amber-700 text-sm gap-3">
              <span className="animate-spin text-xl">⏳</span>
              Cargando datos del servidor...
            </div>
          ) : error ? (
            <Alert msg={error} type="error" />
          ) : (
            <>
              {tab === 'perfil' && <ModuloPerfil />}
              {tab === 'catalogo' && <ModuloCatalogo productos={productos} imagenes={imagenes} setProductos={setProductos} />}
              {tab === 'contable' && <ModuloContable productos={productos} />}
              {tab === 'productos' && (
                <ModuloProductos
                  productos={productos} setProductos={setProductos}
                  categorias={categorias} setCategorias={setCategorias}
                  imagenes={imagenes} setImagenes={setImagenes}
                  onIrAInventario={(productoId) => { setFiltroInventarioProd(String(productoId)); setTab('inventario'); }}
                />
              )}
              {tab === 'inventario' && (
                <ModuloInventario
                  productos={productos} kardex={kardex}
                  setKardex={setKardex} setProductos={setProductos}
                  filtroProductoInicial={filtroInventarioProd}
                  onFiltroUsado={() => setFiltroInventarioProd('todos')}
                />
              )}
              {tab === 'pedidos' && (
                <ModuloPedidos productos={productos} setProductos={setProductos} setKardex={setKardex} />
              )}
              {tab === 'reportes' && <ModuloReportes productos={productos} kardex={kardex} />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}