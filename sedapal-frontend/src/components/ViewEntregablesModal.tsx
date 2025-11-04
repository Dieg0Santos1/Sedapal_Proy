import { useState } from 'react';
import { CheckCircle, FileText } from 'lucide-react';
import Modal from './Modal';
import confetti from 'canvas-confetti';

interface ViewEntregablesModalProps {
  isOpen: boolean;
  onClose: () => void;
  entregableNombre?: string; // Nombre del tipo de entregable
  activityName?: string;
  activityMaxDate?: string | null; // Fecha máxima de sustento (fecha_sustento)
  activityCompletionStatus?: 'pendiente' | 'reprogramado' | 'completado' | null; // Estado de la actividad
  onChangeStatus: (status: 'conforme') => Promise<void>;
  isAdmin?: boolean;
}

export default function ViewEntregablesModal({ 
  isOpen, 
  onClose, 
  entregableNombre,
  activityName,
  activityMaxDate,
  activityCompletionStatus,
  onChangeStatus,
  isAdmin = true
}: ViewEntregablesModalProps) {
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

    // Si la actividad está completada, es "Cumplió"
    if (activityCompletionStatus === 'completado') {
      return { 
        color: 'text-green-700', 
        texto: '✅ Cumplió', 
        bgColor: 'bg-green-50', 
        borderColor: 'border-green-500' 
      };
    }

    // Si la fecha ya pasó sin completarse, es "No cumplió"
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

    // De lo contrario, está pendiente
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

        {/* Tipo de Entregable con Estado */}
        <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <FileText className="text-sedapal-lightBlue mt-1" size={32} />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Tipo de Entregable
                </h3>
                <p className="text-sm text-gray-700">
                  {entregableNombre || 'No especificado'}
                </p>
              </div>
            </div>
            
            {/* Badge de Estado */}
            <div className={`px-4 py-2 rounded-lg border-2 ${estado.bgColor} ${estado.borderColor} flex items-center gap-2`}>
              <span className={`text-sm font-bold ${estado.color}`}>
                {estado.texto}
              </span>
            </div>
          </div>
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
              disabled={changingStatus}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg"
            >
              <CheckCircle size={22} />
              {changingStatus ? 'Procesando...' : (isAdmin ? 'Marcar como Conforme' : 'Marcar como Completado')}
            </button>
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
