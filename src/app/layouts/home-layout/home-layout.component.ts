import { Component, OnInit, Renderer2 } from '@angular/core';
import { Environment } from '@app/services/app-layer/app-layer.environment';
import { SkinService } from '@services/app-layer/skin/skin.service';
import { AuthService } from '@services/app-layer/auth/auth.service';
import { User } from '@services/app-layer/entities/user';

@Component({
  selector: 'app-home-layout',
  templateUrl: './home-layout.component.html',
  styleUrls: ['./home-layout.component.scss']
})
export class HomeLayoutComponent implements OnInit {
  Environment = Environment;
  user: User;

  constructor(private skinService: SkinService, private renderer: Renderer2, private authService: AuthService) {}

  ngOnInit() {
    this.user = Environment.getCurrentUser();
    this.skinService.setSkinColors(this.skinService.getDefaultSkin());
    this.renderer.addClass(document.body, 'use-large-scroll-bars');
  }

  public signOut() {
    this.authService.signOut(false);
  }
}
