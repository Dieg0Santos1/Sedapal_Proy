import { useState, useEffect } from 'react';
import { Download, File, CheckCircle, XCircle, Calendar, User } from 'lucide-react';
import Modal from './Modal';
import type { Entregable } from '../services/api';
import confetti from 'canvas-confetti';

interface ViewEntregablesModalProps {
  isOpen: boolean;
  onClose: () => void;
  entregables: Entregable[];
  activityName?: string;
  activityStatus?: string;
  onDownload: (rutaArchivo: string, nombreArchivo: string) => Promise<void>;
  onChangeStatus: (status: 'conforme' | 'rechazado') => Promise<void>;
  isAdmin?: boolean;
}

export default function ViewEntregablesModal({ 
  isOpen, 
  onClose, 
  entregables, 
  activityName,
  activityStatus,
  onDownload,
  onChangeStatus,
  isAdmin = true
}: ViewEntregablesModalProps) {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [changingStatus, setChangingStatus] = useState(false);
  const [error, setError] = useState('');

  const handleDownload = async (entregable: Entregable) => {
    setDownloading(entregable.ruta_archivo);
    setError('');
    
    try {
      await onDownload(entregable.ruta_archivo, entregable.nombre_archivo);
    } catch (err: any) {
      setError('Error al descargar: ' + err.message);
    } finally {
      setDownloading(null);
    }
  };

  const handleStatusChange = async (status: 'conforme' | 'rechazado') => {
    setChangingStatus(true);
    setError('');

    try {
      await onChangeStatus(status);
      
      if (status === 'conforme') {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10B981', '#34D399', '#6EE7B7']
        });
      }
      
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

  const formatFileSize = (bytes?: number): string => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Entregables de la Actividad">
      <div className="space-y-4">
        {activityName && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Actividad:</strong> {activityName}
            </p>
            {activityStatus && (
              <p className="text-sm text-blue-800 mt-1">
                <strong>Estado Actual:</strong> {
                  activityStatus === 'conforme' ? '✅ Conforme' :
                  activityStatus === 'rechazado' ? '❌ Rechazado' :
                  '⏳ Pendiente'
                }
              </p>
            )}
          </div>
        )}

        {/* Lista de entregables */}
        {entregables.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <File className="mx-auto mb-3 text-gray-300" size={48} />
            <p>No hay entregables subidos aún</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {entregables.map((entregable) => (
              <div 
                key={entregable.id} 
                className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <File className="text-sedapal-lightBlue mt-1" size={24} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {entregable.nombre_archivo}
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {formatDate(entregable.fecha_subida)}
                        </span>
                        {entregable.tamaño_archivo && (
                          <span>{formatFileSize(entregable.tamaño_archivo)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(entregable)}
                    disabled={downloading === entregable.ruta_archivo}
                    className="ml-3 text-sedapal-lightBlue hover:text-sedapal-blue transition flex items-center gap-1 px-3 py-2 rounded hover:bg-blue-50 disabled:opacity-50"
                    title="Descargar"
                  >
                    {downloading === entregable.ruta_archivo ? (
                      <span className="animate-spin">⏳</span>
                    ) : (
                      <>
                        <Download size={18} />
                        <span className="text-xs font-medium">Descargar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Acciones del administrador */}
        {isAdmin && entregables.length > 0 && activityStatus !== 'conforme' && activityStatus !== 'rechazado' && (
          <div className="border-t border-gray-200 pt-4 mt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">
              Evaluar entregables:
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleStatusChange('conforme')}
                disabled={changingStatus}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50 font-medium"
              >
                <CheckCircle size={20} />
                Marcar como Conforme
              </button>
              <button
                onClick={() => handleStatusChange('rechazado')}
                disabled={changingStatus}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50 font-medium"
              >
                <XCircle size={20} />
                Marcar como Rechazado
              </button>
            </div>
          </div>
        )}

        {/* Botón cerrar */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
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
