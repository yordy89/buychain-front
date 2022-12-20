import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ContractEntity } from '@services/app-layer/entities/contract';
import { BaseApiService } from '@services/data-layer/http-api/base-api/base-api.service';
import { TransactionTallyUnitContract } from '@services/data-layer/http-api/base-api/swagger-gen';
import { Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ContractsApiService {
  constructor(private httpClient: HttpClient, private baseApi: BaseApiService) {}

  addTransactionContract(
    transactionId: string,
    tallyUnitId: string,
    payload: TransactionTallyUnitContract
  ): Observable<ContractEntity> {
    return this.baseApi.transactions.addTransactionTallyUnitContract(transactionId, tallyUnitId, payload).pipe(
      first(),
      map(data => new ContractEntity().init(data))
    );
  }

  updateTransactionContract(
    transactionId: string,
    tallyUnitId: string,
    payload: TransactionTallyUnitContract
  ): Observable<ContractEntity> {
    return this.baseApi.transactions.updateTransactionTallyUnitContract(transactionId, tallyUnitId, payload).pipe(
      first(),
      map(data => new ContractEntity().init(data))
    );
  }

  deleteTransactionContract(transactionId: string, tallyUnitId: string) {
    return this.baseApi.transactions.deleteTransactionTallyContract(transactionId, tallyUnitId);
  }
}
