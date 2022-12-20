import { Injectable } from '@angular/core';
import { mergeMap, Observable, of, throwError } from 'rxjs';
import {
  TransactionStateReviewUpdatePayload,
  TransactionStateUpdatePayload,
  TransactionTallyUnitCreatePayload
} from '@services/data-layer/http-api/base-api/swagger-gen';
import { first, map } from 'rxjs/operators';
import { BaseApiService } from '@app/services/data-layer/http-api/base-api/base-api.service';
import {
  TransactionEntity,
  CostDataEntity,
  CostDataCostOfGood,
  TallyEntity,
  TrackingDataEntity,
  OnlineBuyerDataEntity,
  CrmBuyerDataEntity,
  MilestoneEntity,
  PrivateDataEntity,
  JournalItemEntity,
  CrmSellerDataEntity,
  SelectedTransportMethod
} from '../entities/transaction';
import {
  OrderTypeEnum,
  RoleInTransaction,
  StockSubTypeEnum,
  TransactionStateReviewUpdateEnum,
  TransactionStateUpdateEnum
} from '../app-layer.enums';
import { SearchService } from '@services/app-layer/search/search.service';

@Injectable({
  providedIn: 'root'
})
export class TransactionsService {
  constructor(private baseApi: BaseApiService, private searchService: SearchService) {}
  /*
   * loaders
   * */

  public loadTransactionById(id: string): Observable<TransactionEntity> {
    const payload = { filters: { value: { comparisonOperator: 'eq', field: 'id', fieldValue: id } } };
    return this.searchService.fetchTransactionData(payload).pipe(
      mergeMap(txs => {
        if (txs?.length) {
          return of(new TransactionEntity().init(txs[0]));
        }
        return throwError(() => new Error('not available'));
      })
    );
  }

  public loadTrackingData(transaction: TransactionEntity) {
    return this.getTransactionTrackingData(transaction.id).pipe(
      map(trackingData => (transaction.trackingData = trackingData))
    );
  }

  public loadMilestones(transaction: TransactionEntity) {
    return this.getTransactionMilestones(transaction.id).pipe(map(milestones => (transaction.milestones = milestones)));
  }

  public loadCostData(transaction: TransactionEntity) {
    return this.getTransactionCostData(transaction.id).pipe(map(costData => (transaction.costData = costData)));
  }

  public loadPrivateData(transaction: TransactionEntity) {
    return this.getTransactionPrivateData(transaction.id).pipe(
      map(privateData => (transaction.trackingData.privateData = privateData))
    );
  }

  public createTransaction(transactionPayload: {
    type: OrderTypeEnum;
    subtype: StockSubTypeEnum;
  }): Observable<TransactionEntity> {
    return this.baseApi.transactions.addTransaction(transactionPayload as any).pipe(
      first(),
      map(data => new TransactionEntity().init(data))
    );
  }

  public deleteTransaction(transactionId: string): Observable<any> {
    return this.baseApi.transactions.deleteTransaction(transactionId).pipe(first());
  }

  public getTransactionCostData(transactionId: string): Observable<CostDataEntity> {
    return this.baseApi.transactions.getTransactionCostData(transactionId).pipe(
      first(),
      map(data => new CostDataEntity().init(data))
    );
  }

  public AddTransactionCostDataCog(
    id: string,
    data: { value: number; label: string },
    role: RoleInTransaction
  ): Observable<CostDataCostOfGood> {
    return role === RoleInTransaction.Seller ? this.AddCostDataCogs(id, data) : this.AddCostDataCogp(id, data);
  }

  public AddCostDataCogs(
    transactionId: string,
    data: { value: number; label: string }
  ): Observable<CostDataCostOfGood> {
    return this.baseApi.transactions.addTransactionCostDataCogs(transactionId, data).pipe(
      first(),
      map(c => new CostDataCostOfGood().init(c))
    );
  }

  public AddCostDataCogp(
    transactionId: string,
    data: { value: number; label: string }
  ): Observable<CostDataCostOfGood> {
    return this.baseApi.transactions.addTransactionCostDataCogp(transactionId, data).pipe(
      first(),
      map(c => new CostDataCostOfGood().init(c))
    );
  }

  public updateTransactionCostDataCog(
    id: string,
    cogId: string,
    cogValue: { value: number },
    role: RoleInTransaction
  ): Observable<CostDataCostOfGood> {
    return role === RoleInTransaction.Seller
      ? this.updateCostDataCogs(id, cogId, cogValue)
      : this.updateCostDataCogp(id, cogId, cogValue);
  }

  public updateCostDataCogs(
    transactionId: string,
    cogId: string,
    cogValue: { value: number }
  ): Observable<CostDataCostOfGood> {
    return this.baseApi.transactions.updateTransactionCostDataCogs(transactionId, cogId, cogValue as any).pipe(
      first(),
      map(data => new CostDataCostOfGood().init(data))
    );
  }

  public updateCostDataCogp(
    transactionId: string,
    cogId: string,
    cogValue: { value: number }
  ): Observable<CostDataCostOfGood> {
    return this.baseApi.transactions.updateTransactionCostDataCogp(transactionId, cogId, cogValue as any).pipe(
      first(),
      map(data => new CostDataCostOfGood().init(data))
    );
  }

  public updateTransactionState(
    transactionId: string,
    payload: { state: TransactionStateUpdateEnum }
  ): Observable<TransactionStateUpdatePayload> {
    return this.baseApi.transactions.updateTransactionState(transactionId, payload).pipe(first());
  }

  public updateTransactionStateReview(
    transactionId: string,
    payload: { state: TransactionStateReviewUpdateEnum }
  ): Observable<TransactionStateReviewUpdatePayload> {
    return this.baseApi.transactions.updateTransactionStateReview(transactionId, payload).pipe(first());
  }

  public updateTransactionStateChangePending(transactionId: string, payload: any): Observable<{ state?: string }> {
    return this.baseApi.transactions.addTransactionStateChangePending(transactionId, payload).pipe(first());
  }

  public updateTransactionStateFromChangePending(
    transactionId: string,
    payload: { status: boolean }
  ): Observable<{ state?: string }> {
    return this.baseApi.transactions.updateTransactionStateChangePending(transactionId, payload).pipe(first());
  }

  public getTransactionTally(transactionId: string): Observable<TallyEntity> {
    return this.baseApi.transactions.getTransactionTally(transactionId).pipe(
      first(),
      map(data => new TallyEntity().init(data))
    );
  }

  public updateTransactionTally(
    transactionId: string,
    tallyData: { contentDescription: string }
  ): Observable<TallyEntity> {
    return this.baseApi.transactions.updateTransactionTally(transactionId, tallyData).pipe(
      first(),
      map(data => new TallyEntity().init(data))
    );
  }

  public addTransactionTallyUnit(
    transactionId: string,
    tallyUnitData: TransactionTallyUnitCreatePayload
  ): Observable<any> {
    return this.baseApi.transactions.addTransactionTallyUnit(transactionId, tallyUnitData).pipe(first());
  }

  public makeOfferForTransactionTallyUnit(
    transactionId: string,
    tallyUnitId: string,
    offerData: { offer: number }
  ): Observable<any> {
    return this.baseApi.transactions.updateTransactionTallyUnit(transactionId, tallyUnitId, offerData).pipe(first());
  }

  public deleteTransactionTallyUnit(transactionId: string, unitId: string): Observable<TallyEntity> {
    // :ToDo api endpoint name should be 'deleteTransactionTallyUnit'
    return this.baseApi.transactions.deleteTransactionTally(transactionId, unitId).pipe(first());
  }

  public getTransactionTrackingData(transactionId: string): Observable<TrackingDataEntity> {
    return this.baseApi.transactions.getTransactionTrackingData(transactionId).pipe(
      first(),
      map(data => new TrackingDataEntity().init(data))
    );
  }

  public updateTransactionTrackingData(transactionId: string, trackingData: any): Observable<TrackingDataEntity> {
    return this.baseApi.transactions.updateTransactionTrackingData(transactionId, trackingData).pipe(
      first(),
      map(data => new TrackingDataEntity().init(data))
    );
  }

  public updateTransportMethod(
    transactionId: string,
    transportMethodPayload: any
  ): Observable<SelectedTransportMethod> {
    return this.baseApi.transactions
      .updateTransactionTrackingDataTransportMethod(transactionId, transportMethodPayload)
      .pipe(
        first(),
        map(data => new SelectedTransportMethod().init(data))
      );
  }

  public updateTransactionBuyerOnlineData(transactionId: string, buyerData: any): Observable<OnlineBuyerDataEntity> {
    return this.baseApi.transactions.updateTransactionTrackingDataBuyerDataOnlineData(transactionId, buyerData).pipe(
      first(),
      map(data => new OnlineBuyerDataEntity().init(data))
    );
  }

  public updateTransactionBuyerCrmData(transactionId: string, buyerData: any): Observable<CrmBuyerDataEntity> {
    return this.baseApi.transactions.updateTransactionTrackingDataBuyerDataCrmData(transactionId, buyerData).pipe(
      first(),
      map(data => new CrmBuyerDataEntity().init(data))
    );
  }

  public updateTransactionSellerCrmData(transactionId: string, sellerData: any): Observable<CrmSellerDataEntity> {
    return this.baseApi.transactions.updateTransactionTrackingDataSellerDataCrmData(transactionId, sellerData).pipe(
      first(),
      map(data => new CrmSellerDataEntity().init(data))
    );
  }

  public getTransactionMilestones(transactionId: string): Observable<MilestoneEntity[]> {
    return this.baseApi.transactions.getTransactionMilestones(transactionId).pipe(
      first(),
      map(data => data.map(item => new MilestoneEntity().init(item)))
    );
  }

  public addTransactionMilestone(transactionId: string, milestoneData): Observable<MilestoneEntity> {
    return this.baseApi.transactions.addTransactionMilestone(transactionId, milestoneData).pipe(
      first(),
      map(data => new MilestoneEntity().init(data))
    );
  }

  public getTransactionPrivateData(transactionId: string): Observable<PrivateDataEntity> {
    return this.baseApi.transactions.getTransactionTrackingDataPrivateData(transactionId).pipe(first());
  }

  public updateTransactionPrivateData(
    transactionId: string,
    privateData: { notes: string }
  ): Observable<PrivateDataEntity> {
    return this.baseApi.transactions.updateTransactionTrackingDataPrivateData(transactionId, privateData).pipe(first());
  }

  public getTransactionalJournal(transactionId: string): Observable<JournalItemEntity[]> {
    return this.baseApi.transactions.getTransactionTransactionalJournal(transactionId).pipe(
      first(),
      map(data => data.map(item => new JournalItemEntity().init(item)))
    );
  }

  public addTransactionalJournal(transactionId: string, journal: { message: string }): Observable<JournalItemEntity> {
    return this.baseApi.transactions.addTransactionTransactionalJournal(transactionId, journal).pipe(
      first(),
      map(data => new JournalItemEntity().init(data))
    );
  }
}
