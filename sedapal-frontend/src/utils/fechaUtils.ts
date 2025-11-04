/**
 * Obtiene el último día de un trimestre en el año actual
 */
export function getUltimoDiaTrimestre(trimestre: number): Date {
  const year = new Date().getFullYear();
  
  switch (trimestre) {
    case 1:
      return new Date(year, 2, 31); // 31 de marzo
    case 2:
      return new Date(year, 5, 30); // 30 de junio
    case 3:
      return new Date(year, 8, 30); // 30 de septiembre
    case 4:
      return new Date(year, 11, 31); // 31 de diciembre
    default:
      throw new Error('Trimestre inválido');
  }
}

/**
 * Calcula la fecha máxima basada en múltiples trimestres y días hábiles
 * Retorna el último día del último trimestre + los días hábiles especificados
 */
export function calcularFechaMaxima(trimestres: number[], diasHabiles: number): Date {
  if (trimestres.length === 0) {
    throw new Error('Debe seleccionar al menos un trimestre');
  }
  
  // Encontrar el trimestre más alto
  const ultimoTrimestre = Math.max(...trimestres);
  
  // Obtener el último día del último trimestre
  let fecha = getUltimoDiaTrimestre(ultimoTrimestre);
  
  // Agregar días hábiles (saltando sábados y domingos)
  let diasAgregados = 0;
  while (diasAgregados < diasHabiles) {
    fecha.setDate(fecha.getDate() + 1);
    const diaSemana = fecha.getDay();
    
    // Si no es sábado (6) ni domingo (0), contar como día hábil
    if (diaSemana !== 0 && diaSemana !== 6) {
      diasAgregados++;
    }
  }
  
  return fecha;
}

/**
 * Convierte una fecha a formato string YYYY-MM-DD
 */
export function formatearFechaISO(fecha: Date): string {
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, '0');
  const day = String(fecha.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
