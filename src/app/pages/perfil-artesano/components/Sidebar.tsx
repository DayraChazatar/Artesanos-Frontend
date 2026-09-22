import { Tab } from '../types';

const NAV_ITEMS: { tab: Tab; icon: string; label: string }[] = [
  { tab: 'productos', icon: '🛍️', label: 'Productos' },
  { tab: 'inventario', icon: '📊', label: 'Inventario' },
  { tab: 'catalogo', icon: '📋', label: 'Catálogo' },
  { tab: 'pedidos', icon: '🛒', label: 'Pedidos' },
  { tab: 'reportes', icon: '📈', label: 'Reportes' },
];

interface SidebarProps {
  active: Tab;
  onChange: (t: Tab) => void;
}

export function Sidebar({ active, onChange }: SidebarProps) {
  return (
    <>
      {/* Escritorio: columna fija a la izquierda */}
      <aside className="hidden md:flex fixed top-16 left-0 bottom-0 z-20 w-40 bg-white border-r border-amber-100 flex-col items-center py-8 gap-4 shadow-sm overflow-y-auto">
        {NAV_ITEMS.map(({ tab, icon, label }) => (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            title={label}
            className={`flex flex-col items-center gap-2 w-24 py-4 rounded-2xl text-center transition
              ${active === tab ? 'bg-amber-600 text-white shadow-md' : 'text-amber-800 hover:bg-amber-50'}`}
          >
            <span className="text-4xl leading-none">{icon}</span>
            <span className={`text-sm font-semibold leading-tight ${active === tab ? 'text-white' : 'text-stone-500'}`}>
              {label}
            </span>
          </button>
        ))}
      </aside>

      {/* Celular: barra de pestañas fija abajo, como una app */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-amber-100 shadow-[0_-2px_8px_rgba(0,0,0,0.04)] flex items-stretch">
        {NAV_ITEMS.map(({ tab, icon, label }) => (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition
              ${active === tab ? 'text-amber-700' : 'text-stone-400'}`}
          >
            <span className="text-xl leading-none">{icon}</span>
            <span className="text-[10px] font-semibold leading-tight">{label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}