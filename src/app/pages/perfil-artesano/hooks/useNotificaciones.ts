import { useState, useEffect, useCallback } from 'react';
import { Notificacion } from '../types';

import { API_BASE } from '../../../utils/config';

const BASE = API_BASE;

const getAuthHeaders = () => ({
  Authorization: `Token ${localStorage.getItem('token')}`,
});

export function useNotificaciones() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);

  const cargar = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/notificaciones/`, { headers: getAuthHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      const lista = Array.isArray(data) ? data : (data?.results ?? []);
      setNotificaciones(lista.map((n: Notificacion) => ({
        ...n,
        fecha: new Date(n.fecha).toLocaleString('es-CO', {
          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
        }),
      })));
    } catch (e) {
      console.error('Error cargando notificaciones', e);
    }
  }, []);

  useEffect(() => {
    // Antes las notificaciones se guardaban en localStorage y se compartían
    // entre cuentas del mismo navegador; ahora vienen solo del servidor.
    localStorage.removeItem('notificaciones');
    cargar();
    const interval = setInterval(cargar, 30_000);
    return () => clearInterval(interval);
  }, [cargar]);

  const marcarLeida = async (id: number) => {
    await fetch(`${BASE}/notificaciones/${id}/leer/`, { method: 'PATCH', headers: getAuthHeaders() });
    setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
  };

  const marcarTodasLeidas = async () => {
    await fetch(`${BASE}/notificaciones/leer-todas/`, { method: 'PATCH', headers: getAuthHeaders() });
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
  };

  return {
    notificaciones,
    setNotificaciones,
    marcarLeida,
    marcarTodasLeidas,
    recargar: cargar,
  };
}