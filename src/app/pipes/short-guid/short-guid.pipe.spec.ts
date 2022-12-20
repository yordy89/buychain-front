import { ShortGuidPipe } from './short-guid.pipe';

describe('ShortGuidPipe', () => {
  it('create an instance', () => {
    const pipe = new ShortGuidPipe();

    expect(pipe).toBeTruthy();
  });
});
