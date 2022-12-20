import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-letter-logo',
  templateUrl: './letter-logo.component.html',
  styleUrls: ['./letter-logo.component.scss']
})
export class LetterLogoComponent implements OnInit {
  @Input() value: string;
  @Input() name: string;
  @Input() isSmall = false;

  public nameLetter: string;

  ngOnInit(): void {
    this.nameLetter = this.name ? this.name.charAt(0) : '';
  }
}
