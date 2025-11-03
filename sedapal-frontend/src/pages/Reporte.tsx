import { FileBarChart, Download } from 'lucide-react';
import { useState, useEffect } from 'react';
import { actividadesService, sistemasService } from '../services/api';
import type { ActividadConSistema, Sistema } from '../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReporteSistema {
  sistema: string;
  sistemaAbrev: string;
  pendiente: number;
  completado: number;
  cumplimiento: number;
  estado: 'Cumple' | 'No Cumple';
}

export default function Reporte() {
  const [trimestreSeleccionado, setTrimestreSeleccionado] = useState(1);
  const [actividades, setActividades] = useState<ActividadConSistema[]>([]);
  const [sistemas, setSistemas] = useState<Sistema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportes, setReportes] = useState<ReporteSistema[]>([]);

  const trimestres = [
    { num: 1, label: '1er Trimestre' },
    { num: 2, label: '2do Trimestre' },
    { num: 3, label: '3er Trimestre' },
    { num: 4, label: '4to Trimestre' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (actividades.length > 0 && sistemas.length > 0) {
      calcularReportes();
    }
  }, [trimestreSeleccionado, actividades, sistemas]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [actData, sisData] = await Promise.all([
        actividadesService.getAll(),
        sistemasService.getAll()
      ]);
      setActividades(actData);
      setSistemas(sisData);
      setError('');
    } catch (err: any) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const calcularReportes = () => {
    // Filtrar actividades del trimestre seleccionado
    const actividadesTrimestre = actividades.filter(
      act => act.trimestre === trimestreSeleccionado
    );

    // Agrupar por sistema
    const sistemaMap = new Map<string, {
      sistema: string;
      sistemaAbrev: string;
      pendiente: number;
      completado: number;
    }>();

    actividadesTrimestre.forEach(act => {
      const sistemaAbrev = act.sistema_abrev || 'N/A';
      const sistema = sistemas.find(s => s.abrev === sistemaAbrev);
      const sistemaNombre = sistema?.desc_sistema || sistemaAbrev;

      if (!sistemaMap.has(sistemaAbrev)) {
        sistemaMap.set(sistemaAbrev, {
          sistema: sistemaNombre,
          sistemaAbrev: sistemaAbrev,
          pendiente: 0,
          completado: 0
        });
      }

      const datos = sistemaMap.get(sistemaAbrev)!;
      
      // Contar pendientes (estados: pendiente y reprogramado)
      if (act.estado_actividad === 'pendiente' || act.estado_actividad === 'reprogramado') {
        datos.pendiente++;
      }
      // Contar completados
      else if (act.estado_actividad === 'completado') {
        datos.completado++;
      }
    });

    // Convertir a array y calcular cumplimiento
    const reportesCalculados: ReporteSistema[] = Array.from(sistemaMap.values())
      .map(datos => {
        const total = datos.pendiente + datos.completado;
        const cumplimiento = total > 0 ? Math.round((datos.completado / total) * 100) : 0;
        
        return {
          sistema: datos.sistema,
          sistemaAbrev: datos.sistemaAbrev,
          pendiente: datos.pendiente,
          completado: datos.completado,
          cumplimiento: cumplimiento,
          estado: cumplimiento === 100 ? 'Cumple' : 'No Cumple'
        };
      })
      // Solo mostrar sistemas que tienen actividades en este trimestre
      .filter(reporte => (reporte.pendiente + reporte.completado) > 0);

    setReportes(reportesCalculados);
  };

  const descargarPDF = () => {
    const doc = new jsPDF();
    
    // Configuración de fuentes y colores
    const primaryColor: [number, number, number] = [41, 128, 185]; // Azul SEDAPAL
    const successColor: [number, number, number] = [34, 197, 94]; // Verde
    const errorColor: [number, number, number] = [239, 68, 68]; // Rojo
    
    // Título
    doc.setFontSize(18);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('Reporte Plan de los Sistemas', 14, 20);
    
    // Subtítulo con trimestre
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    const trimestreLabel = trimestres.find(t => t.num === trimestreSeleccionado)?.label || '';
    doc.text(trimestreLabel, 14, 28);
    
    // Información de fecha
    const fecha = new Date();
    const fechaStr = fecha.toLocaleDateString('es-PE');
    const horaStr = fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    doc.setFontSize(10);
    doc.text(`Fecha: ${fechaStr} - Hora: ${horaStr}`, 14, 35);
    
    // Preparar datos para la tabla
    const tableData = reportes.map((reporte, index) => [
      (index + 1).toString(),
      reporte.sistema,
      trimestreLabel,
      reporte.pendiente.toString(),
      reporte.completado.toString(),
      `${reporte.cumplimiento}%`,
      reporte.estado
    ]);
    
    // Generar tabla
    autoTable(doc, {
      startY: 42,
      head: [[
        'N',
        'SISTEMA',
        'TRIMESTRE',
        'PENDIENTE',
        'COMPLETADO',
        'CUMPLIMIENTO',
        'ESTADO'
      ]],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [50, 50, 50]
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { cellWidth: 50 },
        2: { halign: 'center', cellWidth: 30 },
        3: { halign: 'center', cellWidth: 25 },
        4: { halign: 'center', cellWidth: 25 },
        5: { halign: 'center', cellWidth: 28 },
        6: { halign: 'center', cellWidth: 22 }
      },
      didParseCell: function(data) {
        // Colorear la columna de ESTADO
        if (data.column.index === 6 && data.section === 'body') {
          const estado = data.cell.raw as string;
          if (estado === 'Cumple') {
            data.cell.styles.fillColor = successColor;
            data.cell.styles.textColor = [255, 255, 255];
            data.cell.styles.fontStyle = 'bold';
          } else if (estado === 'No Cumple') {
            data.cell.styles.fillColor = errorColor;
            data.cell.styles.textColor = [255, 255, 255];
            data.cell.styles.fontStyle = 'bold';
          }
        }
        // Negrita para columna de cumplimiento
        if (data.column.index === 5 && data.section === 'body') {
          data.cell.styles.fontStyle = 'bold';
        }
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { top: 42 }
    });
    
    // Guardar PDF
    const nombreArchivo = `Reporte_${trimestreLabel.replace(' ', '_')}_${fechaStr.replace(/\//g, '-')}.pdf`;
    doc.save(nombreArchivo);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-gray-600">Cargando reporte...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <FileBarChart className="text-sedapal-lightBlue mr-3" size={32} />
          <h1 className="text-3xl font-bold text-sedapal-lightBlue">Reporte Plan de los Sistemas</h1>
        </div>
        <button 
          onClick={descargarPDF}
          className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
        >
          <Download className="mr-2" size={16} />
          Descargar
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Filtros de trimestre */}
      <div className="mb-6 flex space-x-3">
        {trimestres.map((trimestre) => (
          <button
            key={trimestre.num}
            onClick={() => setTrimestreSeleccionado(trimestre.num)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              trimestreSeleccionado === trimestre.num
                ? 'bg-sedapal-cyan text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {trimestre.label}
          </button>
        ))}
      </div>

      {/* Tabla de reporte */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sistema</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trimestre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pendiente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cumplimiento</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reportes.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No hay actividades registradas para este trimestre
                </td>
              </tr>
            ) : (
              reportes.map((reporte, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{reporte.sistema}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {trimestres.find(t => t.num === trimestreSeleccionado)?.label}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{reporte.pendiente}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{reporte.completado}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{reporte.cumplimiento}%</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded ${
                      reporte.estado === 'Cumple' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                      {reporte.estado}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Información del usuario */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-1 text-sm">
          <p className="text-gray-600">Fecha: {new Date().toLocaleDateString('es-PE')}</p>
          <p className="text-gray-600">Hora: {new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      </div>
    </div>
  );
}
