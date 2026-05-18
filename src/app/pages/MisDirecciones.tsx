import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { ArrowLeft, MapPin, Plus, Pencil, Trash2, Star, X } from 'lucide-react';

interface Address {
  id: string;
  alias: string;
  recipientName: string;
  phone: string;
  department: string;
  city: string;
  neighborhood: string;
  street: string;
  reference: string;
  isPrimary: boolean;
}

const EMPTY_FORM: Omit<Address, 'id' | 'isPrimary'> = {
  alias: '',
  recipientName: '',
  phone: '',
  department: '',
  city: '',
  neighborhood: '',
  street: '',
  reference: '',
};

const ALIAS_OPTIONS = ['Casa', 'Trabajo', 'Familiar', 'Otro'];

const DEPARTMENTS = [
  'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bolívar', 'Boyacá',
  'Caldas', 'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba',
  'Cundinamarca', 'Guainía', 'Guaviare', 'Huila', 'La Guajira', 'Magdalena',
  'Meta', 'Nariño', 'Norte de Santander', 'Putumayo', 'Quindío', 'Risaralda',
  'San Andrés', 'Santander', 'Sucre', 'Tolima', 'Valle del Cauca',
  'Vaupés', 'Vichada',
];

// ─── Modal agregar / editar ───────────────────────────────────────────────
function AddressModal({
  initial,
  onClose,
  onSave,
}: {
  initial?: Address;
  onClose: () => void;
  onSave: (data: Omit<Address, 'id' | 'isPrimary'>) => void;
}) {
  const [form, setForm] = useState<Omit<Address, 'id' | 'isPrimary'>>(
    initial ? {
      alias: initial.alias,
      recipientName: initial.recipientName,
      phone: initial.phone,
      department: initial.department,
      city: initial.city,
      neighborhood: initial.neighborhood,
      street: initial.street,
      reference: initial.reference,
    } : EMPTY_FORM
  );

  const set = (field: keyof typeof form, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = () => {
    if (!form.recipientName.trim() || !form.street.trim() || !form.city.trim() || !form.department.trim()) {
      toast.error('Nombre, dirección, ciudad y departamento son obligatorios');
      return;
    }
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {initial ? 'Editar dirección' : 'Nueva dirección'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Alias */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Tipo de dirección
            </Label>
            <div className="flex gap-2 flex-wrap">
              {ALIAS_OPTIONS.map(a => (
                <button
                  key={a}
                  onClick={() => set('alias', a)}
                  className={`px-4 py-1.5 rounded-full text-sm border transition ${
                    form.alias === a
                      ? 'bg-orange-600 text-white border-orange-600'
                      : 'border-gray-200 text-gray-600 hover:border-orange-300'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Nombre destinatario */}
          <div className="space-y-1.5">
            <Label htmlFor="recipientName" className="text-sm font-medium text-gray-700">
              Nombre del destinatario <span className="text-red-500">*</span>
            </Label>
            <Input
              id="recipientName"
              value={form.recipientName}
              onChange={e => set('recipientName', e.target.value)}
              placeholder="Ej: Teresita Lopez"
            />
          </div>

          {/* Teléfono */}
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
              Teléfono de contacto
            </Label>
            <Input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={e => set('phone', e.target.value)}
              placeholder="+57 300 123 4567"
            />
          </div>

          {/* Departamento y ciudad */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="department" className="text-sm font-medium text-gray-700">
                Departamento <span className="text-red-500">*</span>
              </Label>
              <select
                id="department"
                value={form.department}
                onChange={e => set('department', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Seleccionar</option>
                {DEPARTMENTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="city" className="text-sm font-medium text-gray-700">
                Ciudad / Municipio <span className="text-red-500">*</span>
              </Label>
              <Input
                id="city"
                value={form.city}
                onChange={e => set('city', e.target.value)}
                placeholder="Ej: Pasto"
              />
            </div>
          </div>

          {/* Barrio */}
          <div className="space-y-1.5">
            <Label htmlFor="neighborhood" className="text-sm font-medium text-gray-700">
              Barrio
            </Label>
            <Input
              id="neighborhood"
              value={form.neighborhood}
              onChange={e => set('neighborhood', e.target.value)}
              placeholder="Ej: El Centro"
            />
          </div>

          {/* Dirección */}
          <div className="space-y-1.5">
            <Label htmlFor="street" className="text-sm font-medium text-gray-700">
              Dirección <span className="text-red-500">*</span>
            </Label>
            <Input
              id="street"
              value={form.street}
              onChange={e => set('street', e.target.value)}
              placeholder="Ej: Calle 18 #24-35"
            />
          </div>

          {/* Referencia */}
          <div className="space-y-1.5">
            <Label htmlFor="reference" className="text-sm font-medium text-gray-700">
              Referencia adicional
            </Label>
            <Input
              id="reference"
              value={form.reference}
              onChange={e => set('reference', e.target.value)}
              placeholder="Ej: Casa azul, portón negro, junto al parque..."
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={handleSave}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {initial ? 'Guardar cambios' : 'Agregar dirección'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────
export function MisDirecciones() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | undefined>();

  const storageKey = `addresses_${user?.email}`;

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
    setAddresses(saved);
  }, [storageKey]);

  const save = (updated: Address[]) => {
    setAddresses(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const handleAdd = (data: Omit<Address, 'id' | 'isPrimary'>) => {
    const newAddress: Address = {
      ...data,
      id: Date.now().toString(),
      isPrimary: addresses.length === 0, // primera dirección es principal por defecto
    };
    save([...addresses, newAddress]);
    setShowModal(false);
    toast.success('Dirección agregada');
  };

  const handleEdit = (data: Omit<Address, 'id' | 'isPrimary'>) => {
    const updated = addresses.map(a =>
      a.id === editingAddress?.id ? { ...a, ...data } : a
    );
    save(updated);
    setEditingAddress(undefined);
    toast.success('Dirección actualizada');
  };

  const handleDelete = (id: string) => {
    const updated = addresses.filter(a => a.id !== id);
    // si se borra la principal y quedan más, la primera pasa a ser principal
    if (updated.length > 0 && !updated.find(a => a.isPrimary)) {
      updated[0].isPrimary = true;
    }
    save(updated);
    toast.success('Dirección eliminada');
  };

  const handleSetPrimary = (id: string) => {
    const updated = addresses.map(a => ({ ...a, isPrimary: a.id === id }));
    save(updated);
    toast.success('Dirección principal actualizada');
  };

  return (
    <div className="py-8 bg-gray-50 min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto px-4 max-w-3xl">

        {/* Header */}
        <div className="mb-4">
          <Link to="/perfil">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Volver al perfil
            </Button>
          </Link>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Mis Direcciones</h1>
            <p className="text-gray-500">Gestiona tus direcciones de entrega</p>
          </div>
          <Button
            onClick={() => { setEditingAddress(undefined); setShowModal(true); }}
            className="bg-orange-600 hover:bg-orange-700 text-white gap-2"
          >
            <Plus className="h-4 w-4" /> Nueva dirección
          </Button>
        </div>

        {/* Lista de direcciones */}
        <div className="space-y-4">
          {addresses.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
              <MapPin className="h-10 w-10 mx-auto mb-3 text-gray-200" />
              <p className="text-gray-500 text-sm mb-4">No tienes direcciones guardadas</p>
              <Button
                onClick={() => setShowModal(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                Agregar primera dirección
              </Button>
            </div>
          ) : (
            addresses.map(address => (
              <div
                key={address.id}
                className={`bg-white rounded-2xl border shadow-sm p-5 transition ${
                  address.isPrimary
                    ? 'border-orange-200'
                    : 'border-gray-100'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`mt-0.5 p-2 rounded-xl ${
                      address.isPrimary ? 'bg-orange-100' : 'bg-gray-100'
                    }`}>
                      <MapPin className={`h-4 w-4 ${
                        address.isPrimary ? 'text-orange-600' : 'text-gray-400'
                      }`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {address.alias && (
                          <span className="text-sm font-semibold text-gray-800">
                            {address.alias}
                          </span>
                        )}
                        {address.isPrimary && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                            <Star className="h-3 w-3 fill-orange-500 text-orange-500" /> Principal
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-700">
                        {address.recipientName}
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {address.street}
                        {address.neighborhood ? `, ${address.neighborhood}` : ''}
                      </p>
                      <p className="text-sm text-gray-500">
                        {address.city}, {address.department}
                      </p>
                      {address.reference && (
                        <p className="text-xs text-gray-400 mt-1 italic">
                          Ref: {address.reference}
                        </p>
                      )}
                      {address.phone && (
                        <p className="text-xs text-gray-400 mt-1">
                          📞 {address.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <div className="flex gap-1">
                      <button
                        onClick={() => { setEditingAddress(address); setShowModal(true); }}
                        title="Editar"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(address.id)}
                        title="Eliminar"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {!address.isPrimary && (
                      <button
                        onClick={() => handleSetPrimary(address.id)}
                        className="text-xs text-orange-600 hover:text-orange-700 font-medium transition"
                      >
                        Usar como principal
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <AddressModal
          initial={editingAddress}
          onClose={() => { setShowModal(false); setEditingAddress(undefined); }}
          onSave={editingAddress ? handleEdit : handleAdd}
        />
      )}
    </div>
  );
}