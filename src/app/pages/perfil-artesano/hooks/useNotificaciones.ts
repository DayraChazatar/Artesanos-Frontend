import { useState, useEffect, useCallback } from 'react';
import { Notificacion } from '../types';

import { API_BASE } from '../../../utils/config';

const BASE = API_BASE;

const getAuthHeaders = () => ({
  Authorization: `Token ${localStorage.getItem('token')}`,
});

export function useNotificaciones() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>(() => {
    const guardadas = localStorage.getItem('notificaciones');
    return guardadas ? JSON.parse(guardadas) : [];
  });

  const cargar = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/notificaciones/`, { headers: getAuthHeaders() });
      const data = await res.json();
      // setNotificaciones(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error cargando notificaciones', e);
    }
  }, []);

  useEffect(() => {
    cargar();
    const interval = setInterval(cargar, 30_000);
    return () => clearInterval(interval);
  }, [cargar]);

  useEffect(() => {
    localStorage.setItem('notificaciones', JSON.stringify(notificaciones));
  }, [notificaciones]);

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