import { useState, useEffect } from 'react';
import { CheckCircle, FileText } from 'lucide-react';
import Modal from './Modal';
import confetti from 'canvas-confetti';

interface ViewEntregablesModalProps {
  isOpen: boolean;
  onClose: () => void;
  entregableNombre?: string;
  entregablesNombres?: string[];
  // Nuevo: lista detallada (id y nombre) para numerar y permitir quitar
  entregablesDetalle?: { id: number; nombre: string }[];
  onRemoveEntregable?: (id: number) => Promise<void>;
  activityName?: string;
  activityMaxDate?: string | null;
  activityCompletionStatus?: 'pendiente' | 'reprogramado' | 'completado' | null;
  userFulfillmentStatus?: 'cumple' | 'no_cumple' | 'pendiente' | null;
  onChangeStatus: (status: 'conforme') => Promise<void>;
  isAdmin?: boolean;
  canApprove?: boolean;
  // Admin: añadir/editar entregables
  addOptions?: { id: number; nombre: string }[];
  onAddEntregable?: (id: number) => Promise<void>;
  canModifyEntregables?: boolean;
}

export default function ViewEntregablesModal({ 
  isOpen, 
  onClose, 
  entregableNombre,
  entregablesNombres,
  entregablesDetalle,
  onRemoveEntregable,
  activityName,
  activityMaxDate,
  activityCompletionStatus,
  userFulfillmentStatus,
  onChangeStatus,
  isAdmin = true,
  canApprove = true,
  addOptions,
  onAddEntregable,
  canModifyEntregables = true
}: ViewEntregablesModalProps) {
  const [addId, setAddId] = useState<number | undefined>(undefined);
  useEffect(() => {
    if (addOptions && addOptions.length > 0) {
      setAddId(addOptions[0].id);
    } else {
      setAddId(undefined);
    }
  }, [addOptions]);
  const [changingStatus, setChangingStatus] = useState(false);
  const [error, setError] = useState('');

  const handleStatusChange = async () => {
    setChangingStatus(true);
    setError('');

    try {
      await onChangeStatus('conforme');
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10B981', '#34D399', '#6EE7B7']
      });
      
      // Cerrar modal después de cambiar estado
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setError('Error al cambiar estado: ' + err.message);
    } finally {
      setChangingStatus(false);
    }
  };

  // Determinar el estado del entregable
  const getEstadoEntregable = (): { color: string; texto: string; bgColor: string; borderColor: string } => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // 1) Cerrado por el admin
    if (activityCompletionStatus === 'completado') {
      return { 
        color: 'text-green-700', 
        texto: '✅ Cumplió (Conforme)', 
        bgColor: 'bg-green-50', 
        borderColor: 'border-green-500' 
      };
    }

    // 2) Usuario marcó Cumplió pero aún sin conformidad
    if (!isAdmin && userFulfillmentStatus === 'cumple') {
      return {
        color: 'text-blue-700',
        texto: '🕓 En revisión',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-500'
      };
    }

    // 3) Si la fecha ya pasó sin completarse, es "No cumplió"
    if (activityMaxDate) {
      const fechaMaxima = new Date(activityMaxDate + 'T00:00:00');
      if (hoy > fechaMaxima) {
        return { 
          color: 'text-red-700', 
          texto: '❌ No cumplió', 
          bgColor: 'bg-red-50', 
          borderColor: 'border-red-500' 
        };
      }
    }

    // 4) Pendiente
    return { 
      color: 'text-yellow-700', 
      texto: '⌛ Pendiente', 
      bgColor: 'bg-yellow-50', 
      borderColor: 'border-yellow-500' 
    };
  };

  const estado = getEstadoEntregable();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Información del Entregable">
      <div className="space-y-4">
        {/* Información de la actividad */}
        {activityName && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Actividad:</strong> {activityName}
            </p>
            {activityMaxDate && (
              <p className="text-sm text-blue-800 mt-1">
                <strong>Fecha Máxima:</strong> {(() => {
                  const fecha = new Date(activityMaxDate + 'T00:00:00');
                  return fecha.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
                })()}
              </p>
            )}
          </div>
        )}

        {/* Entregables (estilo tabla simple, solo bordes celestes) */}
        <div className="border-2 border-sedapal-lightBlue rounded-lg">
          <div className="flex items-center justify-between px-4 py-3 border-b-2 border-sedapal-lightBlue">
            <div className="flex items-center gap-2 text-sedapal-lightBlue font-semibold">
              <FileText size={18} />
              <span>Entregables</span>
            </div>
            {/* Badge de Estado */}
            <div className={`px-3 py-1 rounded border ${estado.borderColor}`}>
              <span className={`text-xs font-bold ${estado.color}`}>{estado.texto}</span>
            </div>
          </div>
          <div className="divide-y divide-sedapal-lightBlue/40">
            {Array.isArray(entregablesDetalle) && entregablesDetalle.length > 0 ? (
              entregablesDetalle.map((e, i) => (
                <div key={e.id} className="px-4 py-2 text-sm text-gray-800 flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <span className="font-semibold mr-2 text-sedapal-blue">{i + 1}.</span>
                    <span>{e.nombre}</span>
                  </div>
                  {isAdmin && onRemoveEntregable && canModifyEntregables && (
                    <button
                      onClick={() => onRemoveEntregable(e.id)}
                      className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                      title="Quitar entregable"
                    >
                      Quitar
                    </button>
                  )}
                </div>
              ))
            ) : Array.isArray(entregablesNombres) && entregablesNombres.length > 0 ? (
              entregablesNombres.map((n, i) => (
                <div key={i} className="px-4 py-2 text-sm text-gray-800">
                  <span className="font-semibold mr-2 text-sedapal-blue">{i + 1}.</span>
                  {n}
                </div>
              ))
            ) : (
              <div className="px-4 py-2 text-sm text-gray-800">{entregableNombre || 'No especificado'}</div>
            )}
          </div>

          {/* Admin: añadir entregable */}
          {isAdmin && canModifyEntregables && onAddEntregable && (addOptions && addOptions.length > 0) && (
            <div className="px-4 py-3 border-t-2 border-sedapal-lightBlue">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <span className="text-sm text-gray-700 shrink-0">Añadir entregable:</span>
                <select
                  className="flex-1 min-w-0 w-full sm:w-96 max-w-full px-2 py-1 border rounded"
                  value={addId ?? ''}
                  onChange={(e) => setAddId(parseInt(e.target.value))}
                >
                  {addOptions.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.nombre}</option>
                  ))}
                </select>
                <button
                  onClick={async () => { if (addId) await onAddEntregable(addId); }}
                  disabled={!addId}
                  className="px-3 py-1 bg-sedapal-lightBlue text-white rounded hover:bg-sedapal-blue text-sm disabled:opacity-50"
                >
                  Agregar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Botón Conforme (admin) o Completado (usuario) */}
        {activityCompletionStatus !== 'completado' && (
          <div className="border-t border-gray-200 pt-4">
            <button
              onClick={handleStatusChange}
              disabled={changingStatus || (isAdmin && !canApprove)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg"
            >
              <CheckCircle size={22} />
              {changingStatus ? 'Procesando...' : (isAdmin ? 'Marcar como Conforme' : "Marcar 'Cumplió'")}
            </button>
            {isAdmin && !canApprove && (
              <p className="text-xs text-gray-500 mt-2">
                Esperando que el usuario marque <strong>“Cumplió”</strong> para habilitar la validación.
              </p>
            )}
          </div>
        )}

        {/* Botón cerrar */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}
