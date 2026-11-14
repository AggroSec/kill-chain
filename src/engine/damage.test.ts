import { describe, expect, it } from 'vitest';
import { absorbWithBlock } from './damage';

describe('absorbWithBlock', () => {
  it('block fully absorbs smaller hits', () => {
    expect(absorbWithBlock(10, 4)).toEqual({ blockLeft: 6, damageThrough: 0 });
  });

  it('excess damage goes through once block is gone', () => {
    expect(absorbWithBlock(5, 8)).toEqual({ blockLeft: 0, damageThrough: 3 });
  });

  it('no block means all damage goes through', () => {
    expect(absorbWithBlock(0, 7)).toEqual({ blockLeft: 0, damageThrough: 7 });
  });

  it('negative damage is treated as zero', () => {
    expect(absorbWithBlock(3, -5)).toEqual({ blockLeft: 3, damageThrough: 0 });
  });
});
