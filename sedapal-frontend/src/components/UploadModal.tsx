import { useState, useRef, DragEvent } from 'react';
import { Upload, X, File, CheckCircle } from 'lucide-react';
import Modal from './Modal';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
  activityName?: string;
}

export default function UploadModal({ isOpen, onClose, onUpload, activityName }: UploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
      setError('');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
      setError('');
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError('Por favor selecciona un archivo');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      await onUpload(selectedFile);
      setUploadSuccess(true);
      
      // Esperar un momento para mostrar el mensaje de éxito
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Error al subir el archivo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setError('');
    setUploadSuccess(false);
    setIsDragging(false);
    onClose();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Subir Entregable">
      <form onSubmit={handleSubmit} className="space-y-4">
        {activityName && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Actividad:</strong> {activityName}
            </p>
          </div>
        )}

        {/* Área de drag & drop */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleUploadClick}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition
            ${isDragging 
              ? 'border-sedapal-lightBlue bg-blue-50' 
              : 'border-gray-300 hover:border-sedapal-lightBlue hover:bg-gray-50'
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <Upload className="mx-auto mb-4 text-gray-400" size={48} />
          
          <p className="text-gray-700 font-medium mb-2">
            {isDragging ? 'Suelta el archivo aquí' : 'Arrastra y suelta tu archivo aquí'}
          </p>
          <p className="text-sm text-gray-500 mb-4">
            o haz clic para seleccionar un archivo
          </p>
          <p className="text-xs text-gray-400">
            Todos los formatos son permitidos (PDF, Word, Excel, etc.)
          </p>
        </div>

        {/* Archivo seleccionado */}
        {selectedFile && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <File className="text-sedapal-lightBlue mt-1" size={24} />
                <div>
                  <p className="font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                }}
                className="text-gray-400 hover:text-red-500 transition"
                title="Quitar archivo"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Mensaje de éxito */}
        {uploadSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
            <CheckCircle className="text-green-600" size={24} />
            <p className="text-green-800 font-medium">¡Archivo subido exitosamente!</p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Botones */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={isUploading}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!selectedFile || isUploading || uploadSuccess}
            className="px-4 py-2 bg-sedapal-lightBlue text-white rounded-lg hover:bg-sedapal-blue transition disabled:opacity-50 flex items-center space-x-2"
          >
            {isUploading ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>Subiendo...</span>
              </>
            ) : (
              <>
                <Upload size={18} />
                <span>Subir Archivo</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
