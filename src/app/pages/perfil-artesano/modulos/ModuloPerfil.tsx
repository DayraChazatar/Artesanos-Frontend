import { useState, useEffect } from 'react';

const inputCls = 'px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 text-base text-stone-800 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition';

const Alert = ({ msg, type }: { msg: string; type: 'success' | 'error' }) => {
  const colors = { success: 'bg-green-100 text-green-800 border-green-200', error: 'bg-red-100 text-red-800 border-red-200' };
  return <div className={`mb-4 p-3 rounded-lg border text-sm font-medium ${colors[type]}`}>{msg}</div>;
};

export function ModuloPerfil() {
  const artesanoId = Number(localStorage.getItem('usuario_id') ?? 1);

  const [perfil, setPerfil] = useState({
    nombre: '', correo: '', telefono: '',
    especialidad: '', biografia: '', foto_url: '',
  });
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [editando, setEditando] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [password, setPassword] = useState({
    password_actual: '', password_nueva: '', password_confirmar: '',
  });
  const [loadingPass, setLoadingPass] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:8000/api/perfil/artesano/${artesanoId}/`)
      .then(r => r.json())
      .then(data => setPerfil({
        nombre: data.nombre ?? '', correo: data.correo ?? '',
        telefono: data.telefono ?? '', especialidad: data.especialidad ?? '',
        biografia: data.biografia ?? '', foto_url: data.foto_url ?? '',
      }));
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
      const res = await fetch(`http://localhost:8000/api/perfil/cambiar-password/${artesanoId}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  const handleGuardar = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('telefono', perfil.telefono);
      formData.append('especialidad', perfil.especialidad);
      formData.append('biografia', perfil.biografia);
      if (fotoFile) formData.append('foto', fotoFile);
      const res = await fetch(`http://localhost:8000/api/perfil/artesano/${artesanoId}/`, {
        method: 'PATCH', body: formData,
      });
      const data = await res.json();
      setPerfil(prev => ({ ...prev, foto_url: data.foto_url ?? prev.foto_url }));
      setEditando(false);
      setFotoFile(null);
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
      <div className="bg-white rounded-2xl shadow-sm p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-serif text-2xl text-amber-800">👤 Perfil del Artesano</h2>
          <button onClick={() => setEditando(!editando)}
            className="px-4 py-2 rounded-xl bg-amber-100 text-amber-800 text-sm font-semibold hover:bg-amber-200 transition">
            {editando ? '✕ Cancelar' : '✏️ Editar'}
          </button>
        </div>

        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <div className="w-36 h-36 rounded-full border-4 border-amber-200 overflow-hidden bg-amber-50 flex items-center justify-center">
              {preview || perfil.foto_url
                ? <img src={preview || perfil.foto_url} className="w-full h-full object-cover" />
                : <span className="text-5xl">👤</span>}
            </div>
            {editando && (
              <button onClick={() => document.getElementById('input-foto')?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center text-white text-sm hover:bg-amber-700 transition">
                📷
              </button>
            )}
          </div>
          <input id="input-foto" type="file" accept="image/*" className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) { setFotoFile(file); setPreview(URL.createObjectURL(file)); }
            }} />
          <p className="mt-3 font-serif text-2xl font-bold text-stone-800">{perfil.nombre}</p>
          <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-3 py-1 rounded-full mt-1">🧵 Artesano</span>
        </div>

        <div className="space-y-4">
          {[
            { label: 'Correo', field: 'correo', editable: false },
            { label: 'Teléfono', field: 'telefono', editable: true, placeholder: 'Ej: 3001234567' },
            { label: 'Especialidad', field: 'especialidad', editable: true, placeholder: 'Ej: Cerámica, Joyería, Tejidos...' },
          ].map(({ label, field, editable, placeholder }) => (
            <div key={field} className="bg-amber-50 rounded-xl p-4 border border-amber-100">
              <p className="text-xs uppercase tracking-wider font-bold text-amber-700 mb-1">{label}</p>
              {editando && editable
                ? <input className={inputCls} value={perfil[field as keyof typeof perfil]}
                    onChange={e => setPerfil({ ...perfil, [field]: e.target.value })}
                    placeholder={placeholder} />
                : <p className="text-stone-700">{perfil[field as keyof typeof perfil] || '—'}</p>}
            </div>
          ))}

          <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
            <p className="text-xs uppercase tracking-wider font-bold text-amber-700 mb-1">Biografía</p>
            {editando
              ? <textarea className={`${inputCls} min-h-[100px] resize-y`} value={perfil.biografia}
                  onChange={e => setPerfil({ ...perfil, biografia: e.target.value })}
                  placeholder="Cuéntanos sobre ti y tu arte..." />
              : <p className="text-stone-700 leading-relaxed">{perfil.biografia || '—'}</p>}
          </div>

          {editando && (
            <button onClick={handleGuardar} disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-700 to-amber-500 text-white font-semibold shadow hover:shadow-md transition disabled:opacity-60">
              {loading ? 'Guardando...' : '✓ Guardar cambios'}
            </button>
          )}
        </div>
      </div>

      {/* CAMBIAR CONTRASEÑA */}
      <div className="bg-white rounded-2xl shadow-sm p-8">
        <h2 className="font-serif text-xl text-amber-800 mb-6">🔐 Cambiar contraseña</h2>
        <div className="space-y-4">
          {[
            { label: 'Contraseña actual', field: 'password_actual' },
            { label: 'Nueva contraseña', field: 'password_nueva' },
            { label: 'Confirmar nueva contraseña', field: 'password_confirmar' },
          ].map(({ label, field }) => (
            <div key={field} className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-amber-900/70">{label}</label>
              <input type="password" className={inputCls}
                value={password[field as keyof typeof password]}
                onChange={e => setPassword({ ...password, [field]: e.target.value })}
                placeholder="••••••••" />
            </div>
          ))}
          <button onClick={handleCambiarPassword} disabled={loadingPass}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-700 to-amber-500 text-white font-semibold shadow hover:shadow-md transition disabled:opacity-60">
            {loadingPass ? 'Actualizando...' : '✓ Cambiar contraseña'}
          </button>
        </div>
      </div>
    </div>
  );
}