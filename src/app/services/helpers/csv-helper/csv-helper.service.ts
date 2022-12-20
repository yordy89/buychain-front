import { Injectable } from '@angular/core';
import { parse, unparse } from 'papaparse';
import { saveAs } from 'file-saver';

@Injectable({
  providedIn: 'root'
})
export class CsvHelperService {
  public readFromFileAsync(file: File, header: boolean, skipEmptyLines = true): Promise<Array<any>> {
    return new Promise<Array<any>>(resolve => {
      parse(file, {
        header: header,
        skipEmptyLines: skipEmptyLines,
        complete: result => {
          resolve(result.data);
        }
      });
    });
  }

  public serializeToCSV(data, header: boolean) {
    return unparse(data, { header });
  }

  public saveAsFile(data, fileName) {
    const blob = new Blob([data], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, fileName);
  }
}
