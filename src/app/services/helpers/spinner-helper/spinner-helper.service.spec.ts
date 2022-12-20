import { TestBed, inject } from '@angular/core/testing';
import { SpinnerHelperService } from '@services/helpers/spinner-helper/spinner-helper.service';
import { EventGeneralHandlerService } from '@services/helpers/event-general-handler/event-general-handler.service';

describe('SpinnerHelperService', () => {
  let spinnerHelperService: SpinnerHelperService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SpinnerHelperService]
    });
  });

  beforeEach(() => {
    spinnerHelperService = new SpinnerHelperService(new EventGeneralHandlerService());
  });

  afterEach(() => {
    spinnerHelperService = null;
  });

  it('should be created', inject([SpinnerHelperService], (service: SpinnerHelperService) => {
    expect(service).toBeTruthy();
  }));

  it('spinner should not be active if not activated previously', function () {
    spinnerHelperService.isActive().subscribe(status => {
      expect(status).toEqual(false);
    });
  });

  it('should be activated if we set status to be true', function () {
    spinnerHelperService.setStatus(true);
    spinnerHelperService.isActive().subscribe(status => {
      expect(status).toEqual(true);
    });
  });

  it('should be deactivated when we set status to be false', function () {
    spinnerHelperService.setStatus(true);
    setTimeout(() => {
      spinnerHelperService.setStatus(false);
      spinnerHelperService.isActive().subscribe(status => {
        expect(status).toEqual(false);
      });
    }, 2000);
  });
});
