import { ErrorMessagePipe } from '@pipes/error-message/error-message.pipe';

describe('ErrorMessagePipe', () => {
  it('create an instance', () => {
    const pipe = new ErrorMessagePipe();

    expect(pipe).toBeTruthy();
  });
});
