import { Injectable } from '@angular/core';
import { startOfDay, subDays, subYears } from 'date-fns';
import { HistoricalPrice } from '../entities/historical-price';

@Injectable({
  providedIn: 'root'
})
export class HistoricalPriceService {
  public getHistoricalPrice(productLot): HistoricalPrice[] {
    return this.generateMockDataSet(productLot.askPricePerUnit);
  }

  private generateMockDataSet(basePrice: number) {
    const result: HistoricalPrice[] = [];

    const today = startOfDay(new Date());
    const oneYearFromNow = startOfDay(subYears(new Date(), 1));

    let previousMedian = basePrice;

    for (
      let currentDate = today;
      currentDate.getTime() > oneYearFromNow.getTime();
      currentDate = subDays(currentDate, 1)
    ) {
      const direction = Math.random() < 0.5 ? -1 : 1;
      let delta = Math.random() * previousMedian * 0.2;
      delta = delta * direction;
      const range = delta + delta * Math.random() * 0.25;

      const dto = new HistoricalPrice();
      dto.date = currentDate.toISOString();
      dto.open = previousMedian + delta;
      dto.close = dto.open + range * direction;
      dto.high = dto.close;
      dto.low = dto.open;

      result.push(dto);

      previousMedian = dto.open;
    }

    return result;
  }
}
