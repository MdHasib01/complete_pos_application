import { CartProvider } from '../context/CartContext';
import POSPage from './POSPage';

export default function POSPageWrapper() {
  return (
    <CartProvider>
      <POSPage />
    </CartProvider>
  );
}
