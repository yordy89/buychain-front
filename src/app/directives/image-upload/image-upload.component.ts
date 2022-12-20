import {
  Component,
  forwardRef,
  Input,
  OnInit,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  OnDestroy
} from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ImageResourceType, MediaService } from '@services/app-layer/media/media.service';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TypeCheck } from '@services/helpers/utils/type-check';
import { UserService } from '@app/services/app-layer/user/user.service';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { CompaniesService } from '@services/app-layer/companies/companies.service';

@Component({
  selector: 'app-image-upload',
  templateUrl: './image-upload.component.html',
  styleUrls: ['./image-upload.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ImageUploadComponent),
      multi: true
    }
  ]
})
export class ImageUploadComponent implements OnInit, ControlValueAccessor, OnDestroy {
  @Input() imageResourceType: ImageResourceType;
  @Input() label: string;
  @Input() description: string;
  @Input() value: string;
  @Input() name: string;
  @Input() readonlyMode: boolean;
  @Input() allowReset = false;
  @Output() changed = new EventEmitter();
  @ViewChild('fileInput') fileInput: ElementRef;

  ImageResourceType = ImageResourceType;

  private onChange: (value) => void;
  private onTouch: () => void;

  public nameLetter: string;

  private destroy$ = new Subject<void>();

  constructor(
    private mediaService: MediaService,
    private userService: UserService,
    private companiesService: CompaniesService,
    private notificationHelperService: NotificationHelperService
  ) {}

  ngOnInit() {
    this.nameLetter = this.name ? this.name.charAt(0) : '';
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public fileChanged(event): void {
    const files = event.target.files;
    if (!files || !files.length) {
      event.target.value = '';
      return this.notificationHelperService.showValidation('Please chose a file properly');
    }
    if (Math.round(files[0].size / 1024) > 2048) {
      event.target.value = '';
      return this.notificationHelperService.showValidation('Please make sure the file size does not exceed 2 MB.');
    }

    if (!TypeCheck.hasImageFileExtension(files[0])) {
      event.target.value = '';
      return this.notificationHelperService.showValidation('Please make sure the file type is PNG, JPEG, JPG or GIF.');
    }
    if (this.imageResourceType === ImageResourceType.Profile) {
      this.mediaService
        .uploadProfilePicture(files[0])
        .pipe(takeUntil(this.destroy$))
        .subscribe(({ url }) => {
          if (TypeCheck.isFunction(this.onChange)) this.onChange(url);
          this.value = `${url}?${new Date().getTime()}`;
          this.changed.emit(this.value);
          this.userService.updateUserPartial({ profilePictureUrl: url }).pipe(takeUntil(this.destroy$)).subscribe();
        });
    } else if (this.imageResourceType === ImageResourceType.Logo) {
      this.mediaService
        .uploadLogo(files[0])
        .pipe(takeUntil(this.destroy$))
        .subscribe(({ url }) => {
          if (TypeCheck.isFunction(this.onChange)) this.onChange(url);
          this.value = url;
          this.changed.emit(this.value);
        });
    }
  }

  resetPhoto(): void {
    if (TypeCheck.isFunction(this.onChange)) this.onChange(null);
    this.value = null;
    this.fileInput.nativeElement.value = '';
    this.changed.emit(this.value);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }

  writeValue(value: string): void {
    this.value = value || '';
  }
}
