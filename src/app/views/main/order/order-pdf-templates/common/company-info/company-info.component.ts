import { Component, OnInit, Input } from '@angular/core';
import { CompanyDetails } from '@app/services/data-layer/http-api/base-api/swagger-gen';

@Component({
  selector: 'app-company-info',
  templateUrl: './company-info.component.html',
  styleUrls: ['./company-info.component.scss']
})
export class CompanyInfoComponent implements OnInit {
  @Input() company: CompanyDetails;

  public imageUrl: string;

  ngOnInit() {
    this.imageUrl = this.company.logoUrl ? this.appendNoCache(this.company.logoUrl) : '';
  }

  appendNoCache(url: string) {
    return `${url}?no-cache=${new Date().getTime()}`;
  }
}
