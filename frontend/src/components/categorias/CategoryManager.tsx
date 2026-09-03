import type { UseCategorias } from '../../hooks/useCategorias.js';
import { TaxonomyManager } from '../taxonomia/TaxonomyManager.js';

export function CategoryManager({ coleccion }: { coleccion: UseCategorias }): React.JSX.Element {
  return (
    <TaxonomyManager
      titulo="Categorías"
      coleccion={coleccion}
      colorPorDefecto="#3498db"
      conDescripcion
      emptyText="Sin categorías. Crea la primera para organizar tus tareas."
    />
  );
}
