import { Target, Search, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { useState, useEffect } from 'react';
import { adminSistemasService } from '../services/api';
import type { Sistema } from '../services/api';
import SistemaDetallesModal from '../components/SistemaDetallesModal';

interface MisSistemasAdminProps {
  idAdmin: number;
}

export default function MisSistemasAdmin({ idAdmin }: MisSistemasAdminProps) {
  const [sistemas, setSistemas] = useState<Sistema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Búsqueda y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Modal de detalles
  const [isDetallesModalOpen, setIsDetallesModalOpen] = useState(false);
  const [selectedSistema, setSelectedSistema] = useState<Sistema | null>(null);

  useEffect(() => {
    loadSistemas();
  }, [idAdmin]);

  const loadSistemas = async () => {
    try {
      setLoading(true);
      const data = await adminSistemasService.getSistemasByAdmin(idAdmin);
      setSistemas(data);
      setError('');
    } catch (err: any) {
      setError('Error al cargar sistemas: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar sistemas por búsqueda
  const sistemasFiltrados = sistemas.filter(sistema =>
    sistema.desc_sistema.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (sistema.abrev?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    (sistema.administrador?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    (sistema.suplente?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
  );

  // Calcular paginación
  const totalPages = Math.ceil(sistemasFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const sistemasPaginados = sistemasFiltrados.slice(startIndex, endIndex);

  // Resetear página cuando cambia la búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleOpenDetalles = (sistema: Sistema) => {
    setSelectedSistema(sistema);
    setIsDetallesModalOpen(true);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-gray-600">Cargando sistemas...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Target className="text-sedapal-lightBlue mr-3" size={32} />
          <h1 className="text-3xl font-bold text-sedapal-lightBlue">Mis Sistemas Delegados</h1>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Información */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          📋 <strong>Información:</strong> Estos son los sistemas que te han sido delegados. 
          No puedes añadir, editar o eliminar sistemas. Tu función es gestionar las actividades de estos sistemas.
        </p>
      </div>

      {/* Barra de búsqueda */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre, sigla, administrador o suplente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sedapal-lightBlue focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sistema</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sigla</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Administrador</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Suplente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sistemasPaginados.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  {searchTerm ? 'No se encontraron resultados' : 'No tienes sistemas delegados'}
                </td>
              </tr>
            ) : (
              sistemasPaginados.map((sistema, index) => (
                <tr key={sistema.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{startIndex + index + 1}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{sistema.desc_sistema}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-sedapal-cyan text-white">
                      {sistema.abrev || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{sistema.administrador || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{sistema.suplente || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleOpenDetalles(sistema)}
                      className="text-sedapal-lightBlue hover:text-sedapal-blue transition flex items-center gap-1 font-medium"
                      title="Ver Detalles"
                    >
                      <Eye size={18} />
                      <span>Ver Detalles</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-600">
            Mostrando {startIndex + 1} a {Math.min(endIndex, sistemasFiltrados.length)} de {sistemasFiltrados.length} resultados
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="flex items-center px-3 py-2 bg-sedapal-cyan text-white rounded-lg hover:bg-sedapal-lightBlue disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
            >
              <ChevronLeft size={20} />
              <span className="hidden sm:inline ml-1">Anterior</span>
            </button>
            <div className="flex items-center px-4 py-2 border-2 border-sedapal-cyan rounded-lg bg-white text-sedapal-blue font-semibold">
              Página {currentPage} de {totalPages}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center px-3 py-2 bg-sedapal-cyan text-white rounded-lg hover:bg-sedapal-lightBlue disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
            >
              <span className="hidden sm:inline mr-1">Siguiente</span>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Modal: Detalles del Sistema */}
      {selectedSistema && (
        <SistemaDetallesModal
          isOpen={isDetallesModalOpen}
          onClose={() => setIsDetallesModalOpen(false)}
          sistemaId={selectedSistema.id}
          sistemaNombre={selectedSistema.desc_sistema}
          sistemaAbrev={selectedSistema.abrev || 'N/A'}
        />
      )}
    </div>
  );
}
