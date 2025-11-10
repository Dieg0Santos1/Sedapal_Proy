import { AlertTriangle } from 'lucide-react';

export default function ExpiredScreen({ until }: { until: Date | null }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-lg w-full bg-white border border-gray-200 rounded-xl shadow p-6 text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-yellow-100 p-3 rounded-full">
            <AlertTriangle className="text-yellow-600" size={32} />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Sistema desactivado temporalmente</h1>
        <p className="text-gray-600 mb-4">
          Este sistema ha llegado a su fecha de expiración y se ha deshabilitado.
        </p>
        {until && (
          <p className="text-sm text-gray-500 mb-6">
            Expiró: {until.toLocaleString('es-PE', { hour12: false })}
          </p>
        )}
        <p className="text-sm text-gray-600">
          Si necesitas ampliar el periodo, por favor contacta al creador.
        </p>
      </div>
    </div>
  );
}
