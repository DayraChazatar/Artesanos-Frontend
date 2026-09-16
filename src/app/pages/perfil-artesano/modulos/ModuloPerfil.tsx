import { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { API_BASE } from '../../../utils/config';
 
const inputCls = 'px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 text-base text-stone-800 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition';
 
const Alert = ({ msg, type }: { msg: string; type: 'success' | 'error' }) => {
  const colors = { success: 'bg-green-100 text-green-800 border-green-200', error: 'bg-red-100 text-red-800 border-red-200' };
  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      className={`mb-4 p-3 rounded-lg border text-sm font-medium ${colors[type]}`}
    >
      {msg}
    </div>
  );
};
 
export function ModuloPerfil() {
  const artesanoId = Number(localStorage.getItem('usuario_id') ?? 1);
  const [perfil, setPerfil] = useState({ nombre: '', correo: '', telefono: '', especialidad: '', biografia: '', foto_url: '' });
  const [stats, setStats] = useState({ productos: 0, pedidos: 0 });
  const [preview, setPreview] = useState<string>('');
  const [editando, setEditando] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [password, setPassword] = useState({ password_actual: '', password_nueva: '', password_confirmar: '' });
  const [loadingPass, setLoadingPass] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [verCampo, setVerCampo] = useState({ password_actual: false, password_nueva: false, password_confirmar: false });
  const [modalFoto, setModalFoto] = useState(false);

  // ── Pago directo (transferencia/Nequi) — alternativa a Wompi ────────────
  const [showPagoDirecto, setShowPagoDirecto] = useState(false);
  const [pagoDirecto, setPagoDirecto] = useState({
    pago_directo_banco: '', pago_directo_tipo_cuenta: '', pago_directo_numero: '', pago_directo_titular: '',
  });
  const [loadingPagoDirecto, setLoadingPagoDirecto] = useState(false);
  const pagoDirectoActivo = !!(pagoDirecto.pago_directo_banco && pagoDirecto.pago_directo_tipo_cuenta
    && pagoDirecto.pago_directo_numero && pagoDirecto.pago_directo_titular);

  useEffect(() => {
    fetch(`${API_BASE}/perfil/artesano/${artesanoId}/`, {
  headers: { Authorization: `Token ${localStorage.getItem('token') ?? ''}` },
})
      .then(r => r.json())
      .then(data => {
        setPerfil({
          nombre: data.nombre ?? '', correo: data.correo ?? '',
          telefono: data.telefono ?? '', especialidad: data.especialidad ?? '',
          biografia: data.biografia ?? '', foto_url: data.foto_url ?? '',
        });
        setPagoDirecto({
          pago_directo_banco: data.pago_directo_banco ?? '',
          pago_directo_tipo_cuenta: data.pago_directo_tipo_cuenta ?? '',
          pago_directo_numero: data.pago_directo_numero ?? '',
          pago_directo_titular: data.pago_directo_titular ?? '',
        });
      });
 
    fetch(`${API_BASE}/productos/?artesano=${artesanoId}`, {
  headers: { Authorization: `Token ${localStorage.getItem('token') ?? ''}` },
})
      .then(r => r.json())
      .then(data => setStats(prev => ({ ...prev, productos: Array.isArray(data) ? data.length : 0 })));
 
    fetch(`${API_BASE}/inventario/pedidos/artesano/${artesanoId}/`, {
      headers: { Authorization: `Token ${localStorage.getItem('token') ?? ''}` }
    })
      .then(r => r.json())
      .then(data => setStats(prev => ({ ...prev, pedidos: Array.isArray(data) ? data.length : 0 })))
      .catch(() => {});
  }, [artesanoId]);
 
  const handleCambiarPassword = async () => {
    if (!password.password_actual || !password.password_nueva || !password.password_confirmar)
      return setAlert({ msg: 'Todos los campos son obligatorios', type: 'error' });
    if (password.password_nueva !== password.password_confirmar)
      return setAlert({ msg: 'Las contraseñas nuevas no coinciden', type: 'error' });
    if (password.password_nueva.length < 6)
      return setAlert({ msg: 'La contraseña debe tener al menos 6 caracteres', type: 'error' });
    setLoadingPass(true);
    try {
      const res = await fetch(`${API_BASE}/perfil/cambiar-password/${artesanoId}/`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Token ${localStorage.getItem('token') ?? ''}`,
  },
  body: JSON.stringify(password),
});
      const data = await res.json();
      if (!res.ok) return setAlert({ msg: data.error ?? 'Error al cambiar contraseña', type: 'error' });
      setPassword({ password_actual: '', password_nueva: '', password_confirmar: '' });
      setAlert({ msg: '✓ Contraseña actualizada correctamente', type: 'success' });
      setTimeout(() => setAlert(null), 3000);
    } catch {
      setAlert({ msg: 'Error de conexión', type: 'error' });
    } finally {
      setLoadingPass(false);
    }
  };
 
  const handleGuardarPagoDirecto = async () => {
    setLoadingPagoDirecto(true);
    try {
      const res = await fetch(`${API_BASE}/perfil/artesano/${artesanoId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${localStorage.getItem('token') ?? ''}`,
        },
        body: JSON.stringify(pagoDirecto),
      });
      if (!res.ok) throw new Error();
      setAlert({ msg: '✓ Datos de pago directo actualizados correctamente', type: 'success' });
      setTimeout(() => setAlert(null), 3000);
    } catch {
      setAlert({ msg: 'Error al guardar los datos de pago', type: 'error' });
    } finally {
      setLoadingPagoDirecto(false);
    }
  };

  const handleGuardar = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('telefono', perfil.telefono);
      formData.append('biografia', perfil.biografia);
      const res = await fetch(`${API_BASE}/perfil/artesano/${artesanoId}/`, {
  method: 'PATCH',
  headers: { Authorization: `Token ${localStorage.getItem('token') ?? ''}` },
  body: formData,
});
      const data = await res.json();
      setPerfil(prev => ({ ...prev, foto_url: data.foto_url ?? prev.foto_url }));
      setEditando(false);
      setAlert({ msg: '✓ Perfil actualizado correctamente', type: 'success' });
      setTimeout(() => setAlert(null), 3000);
    } catch {
      setAlert({ msg: 'Error al actualizar el perfil', type: 'error' });
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {alert && <Alert msg={alert.msg} type={alert.type} />}
 
      {/* ── TARJETA PRINCIPAL ── */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
 
        {/* Banner */}
        <div className="h-24 bg-gradient-to-r from-amber-600 to-amber-400" />
 
        <div className="px-8 pb-8">
 
          {/* Foto centrada */}
          <div className="flex flex-col items-center -mt-14 mb-4">
            <div className="relative">
              <button onClick={() => setModalFoto(true)} aria-label="Ver foto de perfil ampliada">
                <div className="w-28 h-28 rounded-full border-4 border-white shadow-md overflow-hidden bg-amber-50 flex items-center justify-center hover:opacity-90 transition">
                  {preview || perfil.foto_url
                    ? <img src={preview || perfil.foto_url} alt={`Foto de perfil de ${perfil.nombre}`} className="w-full h-full object-cover" />
                    : <span className="text-5xl" aria-hidden="true">👤</span>}
                </div>
              </button>
              <button
                onClick={() => document.getElementById('input-foto')?.click()}
                aria-label="Cambiar foto de perfil"
                className="absolute bottom-0 right-0 w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center text-white text-sm hover:bg-amber-700 transition shadow">
                <span aria-hidden="true">📷</span>
              </button>
              <input id="input-foto" type="file" accept="image/*" className="hidden"
                onChange={async e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setPreview(URL.createObjectURL(file));
                  setLoading(true);
                  try {
                    const formData = new FormData();
                    formData.append('foto', file);
                    const res = await fetch(`${API_BASE}/perfil/artesano/${artesanoId}/`, {
  method: 'PATCH',
  headers: { Authorization: `Token ${localStorage.getItem('token') ?? ''}` },
  body: formData,
});
                    const data = await res.json();
                    setPerfil(prev => ({ ...prev, foto_url: data.foto_url ?? prev.foto_url }));
                    setAlert({ msg: '✓ Foto actualizada correctamente', type: 'success' });
                    setTimeout(() => setAlert(null), 3000);
                  } catch {
                    setAlert({ msg: 'Error al subir la foto', type: 'error' });
                  } finally {
                    setLoading(false);
                  }
                }} />
            </div>
          </div>
 
          {/* Modal foto grande */}
          {modalFoto && (perfil.foto_url || preview) && (
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Foto de perfil ampliada"
              className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center"
              onClick={() => setModalFoto(false)}
              onKeyDown={e => { if (e.key === 'Escape') setModalFoto(false); }}>
              <div className="relative" onClick={e => e.stopPropagation()}>
                <img src={preview || perfil.foto_url} alt={`Foto de perfil de ${perfil.nombre}`} className="w-72 h-72 rounded-full object-cover border-4 border-white shadow-2xl" />
                <button onClick={() => setModalFoto(false)} autoFocus
                  aria-label="Cerrar imagen ampliada"
                  className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center text-stone-600 shadow hover:bg-stone-100 transition">
                  <span aria-hidden="true">✕</span>
                </button>
              </div>
            </div>
          )}
 
          {/* Nombre y badges */}
          <div className="text-center mb-6">
            <h2 className="font-serif text-2xl font-bold text-stone-800">{perfil.nombre}</h2>
            <div className="flex gap-2 justify-center mt-2">
              <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-3 py-1 rounded-full">🧵 Artesano</span>
              {perfil.especialidad && (
                <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1 rounded-full">🏷️ {perfil.especialidad}</span>
              )}
            </div>
          </div>
 
          {/* Estadísticas */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Productos', value: stats.productos, icon: '🛍️' },
              { label: 'Pedidos', value: stats.pedidos, icon: '🛒' },
              { label: 'Categoría', value: perfil.especialidad || '—', icon: '🏷️' },
            ].map(({ label, value, icon }) => (
              <div key={label} className="bg-amber-50 rounded-xl p-3 text-center border border-amber-100">
                <span className="text-xl">{icon}</span>
                <p className="text-lg font-bold text-stone-800 mt-1">{value}</p>
                <p className="text-xs text-stone-400">{label}</p>
              </div>
            ))}
          </div>
 
          {/* Botón editar */}
          <div className="flex justify-end mb-4">
            <button onClick={() => setEditando(!editando)}
              className="px-4 py-2 rounded-xl bg-amber-100 text-amber-800 text-sm font-semibold hover:bg-amber-200 transition">
              {editando ? '✕ Cancelar' : '✏️ Editar perfil'}
            </button>
          </div>
 
          {/* Campos en dos columnas */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
              <p className="text-xs uppercase tracking-wider font-bold text-amber-700 mb-1">Correo</p>
              <p className="text-stone-700 text-sm truncate">{perfil.correo}</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
              <label htmlFor="telefono" className="text-xs uppercase tracking-wider font-bold text-amber-700 mb-1 block">Teléfono</label>
              {editando
                ? <input id="telefono" className={inputCls} value={perfil.telefono}
                    onChange={e => setPerfil({ ...perfil, telefono: e.target.value })}
                    placeholder="Ej: 3001234567" />
                : <p className="text-stone-700 text-sm">{perfil.telefono || '—'}</p>}
            </div>
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
              <p className="text-xs uppercase tracking-wider font-bold text-amber-700 mb-1">Especialidad</p>
              <p className="text-stone-700 text-sm">{perfil.especialidad || '—'}</p>
            </div>
          </div>
 
          {/* Biografía */}
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 mb-4">
            <label htmlFor="biografia" className="text-xs uppercase tracking-wider font-bold text-amber-700 mb-1 block">Biografía</label>
            {editando
              ? <textarea id="biografia" className={`${inputCls} min-h-[100px] resize-y w-full`} value={perfil.biografia}
                  onChange={e => setPerfil({ ...perfil, biografia: e.target.value })}
                  placeholder="Cuéntanos sobre ti y tu arte..." />
              : <p className="text-stone-700 leading-relaxed text-sm">{perfil.biografia || '—'}</p>}
          </div>
 
          {editando && (
            <button onClick={handleGuardar} disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-700 to-amber-500 text-white font-semibold shadow hover:shadow-md transition disabled:opacity-60">
              {loading ? 'Guardando...' : '✓ Guardar cambios'}
            </button>
          )}
        </div>
      </div>
 
      {/* ── CAMBIAR CONTRASEÑA (colapsable) ── */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <button onClick={() => setShowPassword(!showPassword)}
          aria-expanded={showPassword}
          aria-controls="panel-cambiar-password"
          className="w-full px-8 py-5 flex items-center justify-between hover:bg-amber-50 transition">
          <div className="flex items-center gap-3">
            <span className="text-xl">🔐</span>
            <span className="font-serif text-lg text-amber-800">Cambiar contraseña</span>
          </div>
          <span className="text-stone-400 text-sm">{showPassword ? '▲ Cerrar' : '▼ Expandir'}</span>
        </button>
 
        {showPassword && (
          <div id="panel-cambiar-password" className="px-8 pb-8 space-y-4 border-t border-amber-100 pt-4">
            {[
              { label: 'Contraseña actual', field: 'password_actual' },
              { label: 'Nueva contraseña', field: 'password_nueva' },
              { label: 'Confirmar nueva contraseña', field: 'password_confirmar' },
            ].map(({ label, field }) => (
              <div key={field} className="flex flex-col gap-1">
                <label htmlFor={field} className="text-xs font-semibold uppercase tracking-wider text-amber-900/70">{label}</label>
                <div className="relative">
                  <input id={field} type={verCampo[field as keyof typeof verCampo] ? 'text' : 'password'} className={`${inputCls} w-full pr-10`}
                    value={password[field as keyof typeof password]}
                    onChange={e => setPassword({ ...password, [field]: e.target.value })}
                    placeholder="••••••••" />
                  <button type="button"
                    onClick={() => setVerCampo(v => ({ ...v, [field]: !v[field as keyof typeof verCampo] }))}
                    aria-label={verCampo[field as keyof typeof verCampo] ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                    {verCampo[field as keyof typeof verCampo] ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                  </button>
                </div>
              </div>
            ))}
            <button onClick={handleCambiarPassword} disabled={loadingPass}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-700 to-amber-500 text-white font-semibold shadow hover:shadow-md transition disabled:opacity-60">
              {loadingPass ? 'Actualizando...' : '✓ Cambiar contraseña'}
            </button>
          </div>
        )}
      </div>

      {/* ── PAGO DIRECTO (colapsable) ── */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <button onClick={() => setShowPagoDirecto(!showPagoDirecto)}
          aria-expanded={showPagoDirecto}
          aria-controls="panel-pago-directo"
          className="w-full px-8 py-5 flex items-center justify-between hover:bg-amber-50 transition">
          <div className="flex items-center gap-3">
            <span className="text-xl">💳</span>
            <div className="text-left">
              <span className="font-serif text-lg text-amber-800 block">Pago directo (transferencia)</span>
              <span className={`text-xs font-semibold ${pagoDirectoActivo ? 'text-green-600' : 'text-stone-400'}`}>
                {pagoDirectoActivo ? '✓ Activo — tus clientes ya ven esta opción al pagar' : 'Sin configurar — solo verán Wompi'}
              </span>
            </div>
          </div>
          <span className="text-stone-400 text-sm">{showPagoDirecto ? '▲ Cerrar' : '▼ Expandir'}</span>
        </button>

        {showPagoDirecto && (
          <div id="panel-pago-directo" className="px-8 pb-8 space-y-4 border-t border-amber-100 pt-4">
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700">
              💡 Alternativa gratuita a Wompi: el cliente ve estos datos, te transfiere directamente y sube el
              comprobante — tú confirmas el pago a mano desde "Pedidos". Llena los 4 campos para activarla; si
              dejas alguno vacío, tus clientes solo verán la opción de pagar con Wompi.
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="pd-banco" className="text-xs font-semibold uppercase tracking-wider text-amber-900/70">Banco (o "Nequi")</label>
                <input id="pd-banco" className={inputCls} value={pagoDirecto.pago_directo_banco}
                  onChange={e => setPagoDirecto({ ...pagoDirecto, pago_directo_banco: e.target.value })}
                  placeholder="Ej: Bancolombia, Nequi" />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="pd-tipo" className="text-xs font-semibold uppercase tracking-wider text-amber-900/70">Tipo de cuenta</label>
                <select id="pd-tipo" className={inputCls} value={pagoDirecto.pago_directo_tipo_cuenta}
                  onChange={e => setPagoDirecto({ ...pagoDirecto, pago_directo_tipo_cuenta: e.target.value })}>
                  <option value="">— Selecciona —</option>
                  <option value="Ahorros">Ahorros</option>
                  <option value="Corriente">Corriente</option>
                  <option value="Nequi">Nequi</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="pd-numero" className="text-xs font-semibold uppercase tracking-wider text-amber-900/70">Número de cuenta o celular Nequi</label>
                <input id="pd-numero" className={inputCls} value={pagoDirecto.pago_directo_numero}
                  onChange={e => setPagoDirecto({ ...pagoDirecto, pago_directo_numero: e.target.value })}
                  placeholder="Ej: 3001234567" />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="pd-titular" className="text-xs font-semibold uppercase tracking-wider text-amber-900/70">Nombre del titular</label>
                <input id="pd-titular" className={inputCls} value={pagoDirecto.pago_directo_titular}
                  onChange={e => setPagoDirecto({ ...pagoDirecto, pago_directo_titular: e.target.value })}
                  placeholder="Nombre completo tal como aparece en la cuenta" />
              </div>
            </div>

            <button onClick={handleGuardarPagoDirecto} disabled={loadingPagoDirecto}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-700 to-amber-500 text-white font-semibold shadow hover:shadow-md transition disabled:opacity-60">
              {loadingPagoDirecto ? 'Guardando...' : '✓ Guardar datos de pago'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}