import type { UseEtiquetas } from '../../hooks/useEtiquetas.js';
import { TaxonomyManager } from '../taxonomia/TaxonomyManager.js';

export function TagManager({ coleccion }: { coleccion: UseEtiquetas }): React.JSX.Element {
  return (
    <TaxonomyManager
      titulo="Etiquetas"
      coleccion={coleccion}
      colorPorDefecto="#95a5a6"
      emptyText="Sin etiquetas todavía."
    />
  );
}
