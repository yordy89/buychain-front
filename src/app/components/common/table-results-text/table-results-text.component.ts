import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, Input, OnInit } from '@angular/core';
import { ViewportHelperService } from '@services/helpers/viewport-helper.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-table-results-text',
  templateUrl: 'table-results-text.component.html'
})
export class TableResultsTextComponent implements OnInit {
  @Input() results: number;
  @Input() visibleRows: number;

  isTablet$: Observable<any>;

  constructor(private breakpointObserver: BreakpointObserver, private viewportHelperService: ViewportHelperService) {}

  ngOnInit() {
    this.isTablet$ = this.viewportHelperService.listenViewportMatching('(max-width: 1500px)');
  }
}
