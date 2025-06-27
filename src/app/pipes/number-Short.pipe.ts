import { Pipe, type PipeTransform } from '@angular/core';

@Pipe({
  name: 'numberShort',
})
export class NumberShortPipe implements PipeTransform {
  transform(value: number): string {
    if (value === null || value === undefined) return '';

    if (value < 1000) {
      return value.toString();
    }

    if (value < 1000000) {
      const thousands = value / 1000;
      // Si tiene decimales significativos, mostrarlos
      return thousands % 1 === 0 ? `${thousands}K` : `${thousands.toFixed(1)}K`;
    }

    if (value < 1000000000) {
      const millions = value / 1000000;
      return millions % 1 === 0 ? `${millions}M` : `${millions.toFixed(1)}M`;
    }

    const billions = value / 1000000000;
    return billions % 1 === 0 ? `${billions}B` : `${billions.toFixed(1)}B`;
  }
}
