import { describe, it, expect } from 'vitest';
import {
  isValidName,
  isReservedWord,
  assertSafeIdentifier,
  quotePg,
  quoteMysql,
} from '../../src/sql/identifier.util.js';

describe('isValidName', () => {
  it('accepts lowercase names', () => {
    expect(isValidName('users')).toBe(true);
    expect(isValidName('order_items')).toBe(true);
    expect(isValidName('_private')).toBe(true);
    expect(isValidName('a')).toBe(true);
  });

  it('accepts names up to 63 characters', () => {
    expect(isValidName('a'.repeat(63))).toBe(true);
  });

  it('rejects names starting with a digit', () => {
    expect(isValidName('1users')).toBe(false);
  });

  it('rejects uppercase names', () => {
    expect(isValidName('Users')).toBe(false);
    expect(isValidName('ORDER_ITEMS')).toBe(false);
  });

  it('rejects names with spaces', () => {
    expect(isValidName('user name')).toBe(false);
  });

  it('rejects names with special characters', () => {
    expect(isValidName('users;')).toBe(false);
    expect(isValidName('users--')).toBe(false);
    expect(isValidName('users"')).toBe(false);
    expect(isValidName("users'")).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidName('')).toBe(false);
  });

  it('rejects names longer than 63 characters', () => {
    expect(isValidName('a'.repeat(64))).toBe(false);
  });
});

describe('isReservedWord', () => {
  it('detects SQL reserved words (case-insensitive)', () => {
    expect(isReservedWord('select')).toBe(true);
    expect(isReservedWord('SELECT')).toBe(true);
    expect(isReservedWord('table')).toBe(true);
    expect(isReservedWord('insert')).toBe(true);
    expect(isReservedWord('drop')).toBe(true);
  });

  it('accepts non-reserved words', () => {
    expect(isReservedWord('users')).toBe(false);
    expect(isReservedWord('orders')).toBe(false);
    expect(isReservedWord('products')).toBe(false);
  });
});

describe('assertSafeIdentifier', () => {
  it('passes for safe names', () => {
    expect(() => assertSafeIdentifier('users')).not.toThrow();
    expect(() => assertSafeIdentifier('order_items')).not.toThrow();
  });

  it('throws for invalid pattern', () => {
    expect(() => assertSafeIdentifier('1bad')).toThrow('unsafe_identifier');
    expect(() => assertSafeIdentifier('has space')).toThrow('unsafe_identifier');
  });

  it('throws for reserved words', () => {
    expect(() => assertSafeIdentifier('select')).toThrow('reserved_word');
    expect(() => assertSafeIdentifier('table')).toThrow('reserved_word');
  });
});

describe('quotePg', () => {
  it('quotes a simple name', () => {
    expect(quotePg('users')).toBe('"users"');
  });

  it('escapes double quotes', () => {
    expect(quotePg('na"me')).toBe('"na""me"');
  });
});

describe('quoteMysql', () => {
  it('quotes a simple name', () => {
    expect(quoteMysql('users')).toBe('`users`');
  });

  it('escapes backticks', () => {
    expect(quoteMysql('na`me')).toBe('`na``me`');
  });
});
