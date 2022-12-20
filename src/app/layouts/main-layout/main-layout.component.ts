import { Component, ElementRef, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { ViewportHelperService } from '@services/helpers/viewport-helper.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  Layout,
  LayoutHelperService,
  MenuChildItem,
  MenuItem,
  MenuTabItem,
  SideBarNavigationViewMode
} from '@services/helpers/layout-helper/layout-helper.service';
import { Environment } from '@app/services/app-layer/app-layer.environment';
import { UserService } from '@services/app-layer/user/user.service';
import { SkinService } from '@services/app-layer/skin/skin.service';
import { Skin } from '@services/app-layer/entities/skin';
import { User } from '@services/app-layer/entities/user';
import { ProfileCompletionState } from '@services/app-layer/app-layer.enums';
import { AuthService } from '@services/app-layer/auth/auth.service';
import { InventorySearchHelperService } from '@views/main/common/inventory/inventory-search/inventory-search.helper.service';
import { OrdersOverviewHelperService } from '@views/main/order/orders-overview/orders-overview.helper.service';
import { NavigationHelperService } from '@services/helpers/navigation-helper/navigation-helper.service';

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  @ViewChild('sidenavElement') sideNav: ElementRef;
  menuItems: MenuItem[] = [];
  SideBarNavigationViewMode = SideBarNavigationViewMode;
  ProfileCompletionState = ProfileCompletionState;
  viewMode: SideBarNavigationViewMode;
  requestToRotate = false;
  isSupportedResolution = false;
  Environment = Environment;
  activeMainRouteItem: MenuItem = null;
  activeProfileRoute: boolean;
  mainRouteWithActiveChildItem: MenuItem = null;
  activeChildRouteItem: MenuChildItem = null;
  tabs: MenuTabItem[] = [];
  user: User;

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private inventorySearchHelperService: InventorySearchHelperService,
    private ordersOverviewHelperService: OrdersOverviewHelperService,
    private navigationHelperService: NavigationHelperService,
    private layoutHelperService: LayoutHelperService,
    private userService: UserService,
    private skinService: SkinService,
    private renderer: Renderer2,
    private viewportHelperService: ViewportHelperService,
    private router: Router
  ) {}

  ngOnInit() {
    this.menuItems = this.layoutHelperService.getMenuItem();
    this.computeRoutesState();
    this.handleViewportChange();

    this.setUser(Environment.getCurrentUser());
    Environment.currentUserUpdated.pipe(takeUntil(this.destroy$)).subscribe(user => this.setUser(user));

    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.computeRoutesState();
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  private computeRoutesState() {
    this.activeMainRouteItem = this.menuItems.find(item => this.isActiveMainRoute(item));

    this.activeProfileRoute = this.isActiveRoute(Layout.Profile);

    if (!this.activeMainRouteItem) {
      this.mainRouteWithActiveChildItem = this.menuItems.find(item => this.isMainRouteHasActiveChild(item));
    } else {
      this.mainRouteWithActiveChildItem = null;
    }

    if (this.mainRouteWithActiveChildItem) {
      this.activeChildRouteItem = this.mainRouteWithActiveChildItem.children.find(childItem => {
        if (childItem.mainRoute) {
          return this.isActiveRoute(childItem.mainRoute);
        }
        return childItem.tabs.some(tab => this.isActiveRoute(tab.route));
      });
    } else {
      this.activeChildRouteItem = null;
    }

    if (this.activeChildRouteItem?.tabs?.length) {
      this.tabs = this.activeChildRouteItem?.tabs || [];
    } else {
      this.tabs = [];
    }
  }

  isActiveRoute(path: string) {
    return this.router.isActive(path, {
      paths: 'subset',
      fragment: 'ignored',
      queryParams: 'ignored',
      matrixParams: 'ignored'
    });
  }

  private isActiveMainRoute(item: MenuItem) {
    if (!item.children?.length) {
      return this.isActiveRoute(item.state);
    }
    return this.isActiveRoute(item.state) && !this.hasActiveChildRoute(item);
  }

  private isMainRouteHasActiveChild(item: MenuItem) {
    if (!item.children?.length) {
      return false;
    }

    return this.hasActiveChildRoute(item);
  }

  private hasActiveChildRoute(item: MenuItem) {
    return (
      item?.children.some(child => {
        if (child.mainRoute) {
          return this.isActiveRoute(child.mainRoute);
        }
        return child.tabs.some(tab => this.isActiveRoute(tab.route));
      }) || false
    );
  }

  get isFullMode() {
    return this.viewMode === SideBarNavigationViewMode.Full;
  }

  get isIconMode() {
    return this.viewMode === SideBarNavigationViewMode.Icon;
  }

  toggleSidebarMode(mode?: SideBarNavigationViewMode) {
    if (this.viewMode !== mode) {
      this.viewMode = mode;
    }
  }

  private handleViewportChange() {
    this.viewportHelperService
      .observeRequestToRotateChange()
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.requestToRotate = value;
      });

    this.viewportHelperService
      .observeSupportedResolution()
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.isSupportedResolution = value;
      });

    this.viewportHelperService.isTablet$.pipe(takeUntil(this.destroy$)).subscribe(value => {
      this.viewMode = value ? SideBarNavigationViewMode.Icon : SideBarNavigationViewMode.Full;
    });
  }

  private setSkinVariables(skin: Skin) {
    this.skinService.setSkinColors(skin);

    if (skin.useLargeScrollBars) {
      this.renderer.addClass(document.body, 'use-large-scroll-bars');
    } else {
      this.renderer.removeClass(document.body, 'use-large-scroll-bars');
    }
  }

  public goToUserProfile(): void {
    this.navigationHelperService.navigateUserProfile();
  }

  public signOut() {
    this.inventorySearchHelperService.resetCachedData();
    this.ordersOverviewHelperService.resetCachedData();
    this.authService.signOut(false);
  }

  private setUser(user: User) {
    this.user = user;
    if (this.user.profilePictureUrl) {
      this.user.profilePictureUrl = `${user.profilePictureUrl}?${new Date().getTime()}`;
    }
    this.setSkinVariables(this.skinService.getCurrentSkin());
  }
}
