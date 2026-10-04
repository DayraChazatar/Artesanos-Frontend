// Client ID de Google (público por diseño). Se puede cambiar sin tocar código
// con VITE_GOOGLE_CLIENT_ID; debe coincidir con GOOGLE_CLIENT_ID del backend.
export const GOOGLE_CLIENT_ID: string =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '488911224398-v38b4s2o8317bu2j6jkia4e2i8vqh6i5.apps.googleusercontent.com';
