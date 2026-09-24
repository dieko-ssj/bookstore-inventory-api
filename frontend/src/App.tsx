/**
 * Componente raíz de la aplicación.
 * Por ahora solo tiene una página (inventario), pero está
 * preparado para agregar routing si se necesita.
 */

import InventoryPage from './pages/inventory/InventoryPage';

function App() {
  return <InventoryPage />;
}

export default App;
