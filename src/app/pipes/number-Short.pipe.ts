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
      const thousands = Math.floor(value / 1000);
      return `${thousands}K`;
    }

    if (value < 1000000000) {
      const millions = Math.floor(value / 1000000);
      return `${millions}M`;
    }

    const billions = Math.floor(value / 1000000000);
    return `${billions}B`;
  }
}
