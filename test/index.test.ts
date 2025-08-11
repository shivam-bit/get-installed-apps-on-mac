import { sum } from '../src/index';

describe('sum', () => {
  it('adds two numbers together', async () => {
    const result = await sum(1, 1);
    expect(result).toEqual(2);
  }, 30000); // 30 second timeout
});
