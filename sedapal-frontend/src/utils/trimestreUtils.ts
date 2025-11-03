/**
 * Utilidades para validación de trimestres y fechas
 */

/**
 * Obtiene el rango de fechas de un trimestre específico
 * @param trimestre Número del trimestre (1-4)
 * @param year Año (opcional, por defecto el año actual)
 * @returns Objeto con fecha de inicio y fin del trimestre
 */
export function getRangoTrimestre(trimestre: number, year?: number): { inicio: Date; fin: Date } {
  const anio = year || new Date().getFullYear();
  
  const rangos = {
    1: { inicio: new Date(anio, 0, 1), fin: new Date(anio, 2, 31) },   // Enero - Marzo
    2: { inicio: new Date(anio, 3, 1), fin: new Date(anio, 5, 30) },   // Abril - Junio
    3: { inicio: new Date(anio, 6, 1), fin: new Date(anio, 8, 30) },   // Julio - Septiembre
    4: { inicio: new Date(anio, 9, 1), fin: new Date(anio, 11, 31) }  // Octubre - Diciembre
  };
  
  return rangos[trimestre as keyof typeof rangos] || rangos[1];
}

/**
 * Valida si una fecha está dentro del rango de un trimestre
 * @param fecha Fecha a validar (string en formato YYYY-MM-DD)
 * @param trimestre Número del trimestre (1-4)
 * @returns true si la fecha está dentro del trimestre, false en caso contrario
 */
export function validarFechaEnTrimestre(fecha: string, trimestre: number): boolean {
  if (!fecha) return false;
  
  const fechaObj = new Date(fecha + 'T00:00:00');
  const { inicio, fin } = getRangoTrimestre(trimestre, fechaObj.getFullYear());
  
  return fechaObj >= inicio && fechaObj <= fin;
}

/**
 * Obtiene el nombre del mes de un trimestre
 * @param trimestre Número del trimestre (1-4)
 * @returns String con el rango de meses
 */
export function getNombreMesesTrimestre(trimestre: number): string {
  const meses = {
    1: 'Enero - Marzo',
    2: 'Abril - Junio',
    3: 'Julio - Septiembre',
    4: 'Octubre - Diciembre'
  };
  
  return meses[trimestre as keyof typeof meses] || 'Trimestre inválido';
}

/**
 * Obtiene el mensaje de error al intentar ingresar una fecha fuera del trimestre
 * @param trimestre Número del trimestre
 * @returns Mensaje de error
 */
export function getMensajeErrorFechaTrimestre(trimestre: number): string {
  return `La fecha debe estar dentro del ${getNombreMesesTrimestre(trimestre)} (Trimestre ${trimestre})`;
}
