import { Pipe, type PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeAgo',
  standalone: true,
  pure: false // Para que se actualice automáticamente
})
export class TimeAgoPipe implements PipeTransform {
  transform(value: string | Date): string {
    if (!value) return '';

    // Convertir el valor a objeto Date
    const date = value instanceof Date ? value : new Date(value);

    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) {
      return 'Fecha inválida';
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    // Determinar el formato adecuado según la diferencia de tiempo
    if (diffSecs < 60) {
      return diffSecs <= 1 ? 'Hace un momento' : `Hace ${diffSecs} segundos`;
    } else if (diffMins < 60) {
      return diffMins === 1 ? 'Hace un minuto' : `Hace ${diffMins} minutos`;
    } else if (diffHours < 24) {
      return diffHours === 1 ? 'Hace una hora' : `Hace ${diffHours} horas`;
    } else if (diffDays < 7) {
      return diffDays === 1 ? 'Hace un día' : `Hace ${diffDays} días`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return weeks === 1 ? 'Hace una semana' : `Hace ${weeks} semanas`;
    } else if (diffMonths < 12) {
      return diffMonths === 1 ? 'Hace un mes' : `Hace ${diffMonths} meses`;
    } else {
      return diffYears === 1 ? 'Hace un año' : `Hace ${diffYears} años`;
    }
  }
}
