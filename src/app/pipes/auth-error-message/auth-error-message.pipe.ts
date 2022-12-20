import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'authErrorMessage'
})
export class AuthErrorMessagePipe implements PipeTransform {
  transform(message: string): string {
    const regex = /^"body\.(\w+)"/gi;

    if (regex.test(message)) {
      return message.replace('body.', '');
    }

    return message;
  }
}
