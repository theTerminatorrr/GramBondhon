import Decimal from 'decimal.js';

export type DecimalInput = string | number | bigint | Decimal | { toString(): string };

export const DECIMAL_PRECISION = 30;
export const DEFAULT_DECIMAL_SCALE = 4;
export const MONEY_SCALE = 4;
export const ACREAGE_SCALE = 2;

export const ZERO = '0.0000';

Decimal.set({ precision: DECIMAL_PRECISION, rounding: Decimal.ROUND_HALF_UP });

export function toDecimal(value: unknown): Decimal {
  if (value instanceof Decimal) {
    return value;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? new Decimal(value) : new Decimal(0);
  }
  if (typeof value === 'string') {
    return value.trim() ? new Decimal(value.trim()) : new Decimal(0);
  }
  if (typeof value === 'bigint') {
    return new Decimal(value);
  }
  if (
    value !== null &&
    value !== undefined &&
    typeof (value as { toString?: unknown }).toString === 'function'
  ) {
    try {
      const str = String((value as { toString(): string }).toString()).trim();
      return str ? new Decimal(str) : new Decimal(0);
    } catch {
      return new Decimal(0);
    }
  }
  return new Decimal(0);
}

export function add(a: DecimalInput, b: DecimalInput): string {
  return toDecimal(a).plus(toDecimal(b)).toFixed(DEFAULT_DECIMAL_SCALE);
}

export function subtract(a: DecimalInput, b: DecimalInput): string {
  return toDecimal(a).minus(toDecimal(b)).toFixed(DEFAULT_DECIMAL_SCALE);
}

export function multiply(a: DecimalInput, b: DecimalInput): string {
  return toDecimal(a).times(toDecimal(b)).toFixed(DEFAULT_DECIMAL_SCALE);
}

export function divide(a: DecimalInput, b: DecimalInput): string {
  const divisor = toDecimal(b);
  if (divisor.isZero()) {
    throw new Error('Decimal division by zero is not allowed');
  }
  return toDecimal(a).div(divisor).toFixed(DEFAULT_DECIMAL_SCALE);
}

export function round(value: DecimalInput, scale = DEFAULT_DECIMAL_SCALE): string {
  return toDecimal(value).toFixed(scale);
}

export function floor(value: DecimalInput, scale = DEFAULT_DECIMAL_SCALE): string {
  return toDecimal(value).toDecimalPlaces(scale, Decimal.ROUND_FLOOR).toFixed(scale);
}

export function ceil(value: DecimalInput, scale = DEFAULT_DECIMAL_SCALE): string {
  return toDecimal(value).toDecimalPlaces(scale, Decimal.ROUND_CEIL).toFixed(scale);
}

export function abs(value: DecimalInput): string {
  return toDecimal(value).abs().toFixed(DEFAULT_DECIMAL_SCALE);
}

export function compare(a: DecimalInput, b: DecimalInput): number {
  return toDecimal(a).comparedTo(toDecimal(b));
}

export function isEqualTo(a: DecimalInput, b: DecimalInput): boolean {
  return compare(a, b) === 0;
}

export function equals(a: DecimalInput, b: DecimalInput): boolean {
  return isEqualTo(a, b);
}

export function isGreaterThan(a: DecimalInput, b: DecimalInput): boolean {
  return compare(a, b) > 0;
}

export function greaterThan(a: DecimalInput, b: DecimalInput): boolean {
  return isGreaterThan(a, b);
}

export function isGreaterThanOrEqualTo(a: DecimalInput, b: DecimalInput): boolean {
  return compare(a, b) >= 0;
}

export function greaterThanOrEqual(a: DecimalInput, b: DecimalInput): boolean {
  return isGreaterThanOrEqualTo(a, b);
}

export function isLessThan(a: DecimalInput, b: DecimalInput): boolean {
  return compare(a, b) < 0;
}

export function lessThan(a: DecimalInput, b: DecimalInput): boolean {
  return isLessThan(a, b);
}

export function isLessThanOrEqualTo(a: DecimalInput, b: DecimalInput): boolean {
  return compare(a, b) <= 0;
}

export function lessThanOrEqual(a: DecimalInput, b: DecimalInput): boolean {
  return isLessThanOrEqualTo(a, b);
}

export function isZero(value: DecimalInput): boolean {
  return toDecimal(value).isZero();
}

export function isPositive(value: DecimalInput): boolean {
  return toDecimal(value).isPositive();
}

export function isNegative(value: DecimalInput): boolean {
  return toDecimal(value).isNegative();
}

export function min(...values: DecimalInput[]): string {
  return Decimal.min(...values.map(toDecimal)).toFixed(DEFAULT_DECIMAL_SCALE);
}

export function max(...values: DecimalInput[]): string {
  return Decimal.max(...values.map(toDecimal)).toFixed(DEFAULT_DECIMAL_SCALE);
}

export function sum(values: DecimalInput[]): string {
  return values
    .reduce((acc: Decimal, value) => acc.plus(toDecimal(value)), toDecimal(0))
    .toFixed(DEFAULT_DECIMAL_SCALE);
}

export function percentageOf(value: DecimalInput, percent: DecimalInput): string {
  return toDecimal(value)
    .times(toDecimal(percent))
    .div(100)
    .toFixed(DEFAULT_DECIMAL_SCALE);
}

export function toFixed(value: DecimalInput, scale: number): string {
  return toDecimal(value).toFixed(scale);
}

export function toNumber(value: DecimalInput): number {
  return toDecimal(value).toNumber();
}

export class SafeDecimal {
  private readonly value: Decimal;

  constructor(value: DecimalInput, private readonly scale: number = DEFAULT_DECIMAL_SCALE) {
    this.value = toDecimal(value);
  }

  add(other: DecimalInput): SafeDecimal {
    return new SafeDecimal(this.value.plus(toDecimal(other)).toFixed(this.scale), this.scale);
  }

  plus(other: DecimalInput): SafeDecimal {
    return this.add(other);
  }

  subtract(other: DecimalInput): SafeDecimal {
    return new SafeDecimal(this.value.minus(toDecimal(other)).toFixed(this.scale), this.scale);
  }

  multiply(other: DecimalInput): SafeDecimal {
    return new SafeDecimal(this.value.times(toDecimal(other)).toFixed(this.scale), this.scale);
  }

  divide(other: DecimalInput): SafeDecimal {
    const divisor = toDecimal(other);
    if (divisor.isZero()) {
      throw new Error('Decimal division by zero is not allowed');
    }
    return new SafeDecimal(this.value.div(divisor).toFixed(this.scale), this.scale);
  }

  percentage(percent: DecimalInput): SafeDecimal {
    return new SafeDecimal(
      this.value.times(toDecimal(percent)).div(100).toFixed(this.scale),
      this.scale,
    );
  }

  round(): SafeDecimal {
    return new SafeDecimal(this.value.toFixed(this.scale), this.scale);
  }

  equals(other: DecimalInput): boolean {
    return this.value.eq(toDecimal(other));
  }

  greaterThan(other: DecimalInput): boolean {
    return this.value.gt(toDecimal(other));
  }

  greaterThanOrEqualTo(other: DecimalInput): boolean {
    return this.value.gte(toDecimal(other));
  }

  lessThan(other: DecimalInput): boolean {
    return this.value.lt(toDecimal(other));
  }

  lessThanOrEqualTo(other: DecimalInput): boolean {
    return this.value.lte(toDecimal(other));
  }

  isZero(): boolean {
    return this.value.isZero();
  }

  isPositive(): boolean {
    return this.value.isPositive();
  }

  isNegative(): boolean {
    return this.value.isNegative();
  }

  toFixed(): string {
    return this.value.toFixed(this.scale);
  }

  toString(): string {
    return this.value.toFixed(this.scale);
  }

  toNumber(): number {
    return this.value.toNumber();
  }

  toDecimalInstance(): Decimal {
    return this.value;
  }
}