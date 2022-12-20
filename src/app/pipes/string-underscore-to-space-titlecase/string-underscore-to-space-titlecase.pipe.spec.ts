import { StringUnderscoreToSpaceTitleCasePipe } from '@pipes/string-underscore-to-space-titlecase/string-underscore-to-space-titlecase.pipe';

describe('StringUnderscoreToSpaceTitleCasePipe', () => {
  it('create an instance', () => {
    const pipe = new StringUnderscoreToSpaceTitleCasePipe();

    expect(pipe).toBeTruthy();
  });
});
