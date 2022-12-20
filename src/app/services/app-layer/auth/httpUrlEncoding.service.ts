import { HttpParameterCodec } from '@angular/common/http';

export class HttpUrlEncodingCodec implements HttpParameterCodec {
  encodeKey(k: string): string {
    return standardEncoding(k);
  }
  encodeValue(v: string): string {
    return standardEncoding(v);
  }
  decodeKey(k: string): string {
    return decodeURIComponent(k);
  }
  decodeValue(v: string) {
    return decodeURIComponent(v);
  }
}

function standardEncoding(v: string): string {
  return encodeURIComponent(v);
}
