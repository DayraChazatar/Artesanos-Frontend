import { MessageCircle } from 'lucide-react';
import { Button } from './ui/button';

export function WhatsAppButton() {
  const handleWhatsAppClick = () => {
    const phoneNumber = '573001234567'; // Número de WhatsApp del negocio
    const message = encodeURIComponent('¡Hola! Estoy interesado en sus productos artesanales.');
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  return (
    <Button
      onClick={handleWhatsAppClick}
      className="fixed bottom-6 right-6 rounded-full h-14 w-14 shadow-lg bg-green-500 hover:bg-green-600 z-50"
      size="icon"
    >
      <MessageCircle className="h-6 w-6" />
    </Button>
  );
}
