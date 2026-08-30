import { Decimal } from '@prisma/client/runtime/library';
import { AppError } from './helpers';

/** Overlap rule: existingCheckIn < newCheckOut AND existingCheckOut > newCheckIn */
export function datesOverlap(
  existingCheckIn: Date,
  existingCheckOut: Date,
  newCheckIn: Date,
  newCheckOut: Date,
): boolean {
  return existingCheckIn < newCheckOut && existingCheckOut > newCheckIn;
}

export function parseDateParam(value: string, fieldName: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(400, `Invalid ${fieldName} date`);
  }
  return date;
}

export function assertValidStayRange(checkIn: Date, checkOut: Date): void {
  if (checkOut <= checkIn) {
    throw new AppError(400, 'checkOut must be after checkIn');
  }
}

/** Whole nights between check-in and check-out (UTC calendar days). */
export function calculateNights(checkIn: Date, checkOut: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / msPerDay);
  if (nights < 1) {
    throw new AppError(400, 'Stay must be at least 1 night');
  }
  return nights;
}

export function calculateTotalPrice(basePrice: Decimal | number | string, nights: number): Decimal {
  return new Decimal(basePrice.toString()).mul(nights);
}

export function decimalToNumber(value: Decimal | number | string): number {
  return Number(new Decimal(value.toString()).toFixed(2));
}
