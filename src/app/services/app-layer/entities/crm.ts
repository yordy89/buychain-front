import {
  CrmAccount,
  CrmAccountBasePopulated,
  CrmAccountContact,
  CrmAccountContactBasePopulated,
  CrmAccountLocation,
  CrmAccountLocationBasePopulated,
  CrmAccountSalesInfo,
  CrmAccountCreditInfo,
  CrmAccountContactSalesInfo,
  CrmAccountLocationSalesInfo,
  CrmAccountBaseWithLabelsPopulated,
  CrmAccountContactBaseWithLabelsPopulated,
  CrmAccountLabelsPopulated,
  CrmAccountContactLabelsPopulated,
  CrmAccountLocationBaseWithLabelsPopulated,
  CrmAccountLocationLabelsPopulated
} from '@app/services/data-layer/http-api/base-api/swagger-gen';
import { CrmTypeEnum, CrmLinkStatusEnum } from '@services/app-layer/app-layer.enums';
import { Environment } from '@services/app-layer/app-layer.environment';
import { AccessControlScope } from '@services/app-layer/permission/permission.interface';
import { CrmAccountPaymentInfo } from '@services/data-layer/http-api/base-api/swagger-gen/model/crmAccountPaymentInfo';

export class CrmAccountEntity {
  readonly id?: string;
  archived?: boolean;
  link?: any;
  name?: string;
  website?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  logoUrl?: string;
  salesTeam?: Array<string> = [];
  readonly companyId?: string;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
  contacts?: Array<CrmContactEntity>;
  locations?: Array<CrmLocationEntity>;
  labels: CrmAccountLabelsPopulated;
  defaultBillToContact?: string;
  defaultBillToLocation?: string;

  archivedString: string;

  fullName: string;
  description?: string;
  type = CrmTypeEnum.ACCOUNT;
  icon = 'store_mall_directory';
  accountName: string;
  linkStatus: CrmLinkStatusEnum;
  canUpdate: boolean;

  init(
    dto: CrmAccount | CrmAccountBasePopulated | CrmAccountBaseWithLabelsPopulated | CrmAccountEntity
  ): CrmAccountEntity {
    Object.assign(this, dto);

    this.fullName = dto.name;
    this.description = dto.website;

    this.archivedString = this.archived ? 'Yes' : 'No';
    this.accountName = this.name;
    this.linkStatus = this.getLinkStatus();
    this.canUpdate = this.checkIfCanUpdate();

    return this;
  }

  private checkIfCanUpdate(): boolean {
    const currentUser = Environment.getCurrentUser();
    const updatePermission =
      currentUser.normalizedAccessControlRoles.CRM_ACCOUNT.CRMSection.sectionGroup.updateEntry.value;

    return (
      updatePermission === AccessControlScope.Company ||
      (updatePermission === AccessControlScope.Owner && this.salesTeam.some(seller => seller === currentUser.id))
    );
  }

  private getLinkStatus(): CrmLinkStatusEnum {
    return this.link ? CrmLinkStatusEnum.LINKED : CrmLinkStatusEnum.CAN_BE_LINKED;
  }
}

const canUpdateCrmLocationContactEntity = self => {
  const currentUser = Environment.getCurrentUser();
  const updatePermission =
    currentUser.normalizedAccessControlRoles.CRM_ACCOUNT.CRMSection.sectionGroup.updateEntry.value;

  return (
    updatePermission === AccessControlScope.Company ||
    (updatePermission === AccessControlScope.Owner &&
      self.crmAccount &&
      self.crmAccount.salesTeam.some(seller => seller === currentUser.id))
  );
};

const getLinkStatusLocationContact = (self): CrmLinkStatusEnum => {
  return self.isAccountLinked
    ? self.link
      ? CrmLinkStatusEnum.LINKED
      : CrmLinkStatusEnum.CAN_BE_LINKED
    : CrmLinkStatusEnum.CAN_NOT_BE_LINKED;
};

export class CrmContactEntity {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  crmAccount?: CrmAccountEntity;
  companyId?: string;
  crmAccountId: string;
  link?: any;
  firstName: string;
  lastName: string;
  username: string;
  profilePictureUrl: string;
  title: string;
  callingCode: string;
  workPhone: string;
  labels: CrmAccountContactLabelsPopulated;
  archived: boolean;

  /* @deprecated Use displayName instead */
  fullName: string;
  description?: string;
  type = CrmTypeEnum.CONTACT;
  icon = 'account_circle';
  archivedString: string;
  displayName: string;
  accountName: string;
  isAccountLinked: boolean;
  canUpdate: boolean;
  linkStatus: CrmLinkStatusEnum;

  init(
    dto: CrmAccountContact | CrmAccountContactBasePopulated | CrmAccountContactBaseWithLabelsPopulated
  ): CrmContactEntity {
    Object.assign(this, dto);

    this.fullName = dto.firstName ? `${dto.firstName} ${dto.lastName}` : dto.username;
    this.description = dto.title || dto.username || '';

    this.archivedString = this.archived ? 'Yes' : 'No';
    this.displayName = this.getDisplayName();
    this.accountName = this.getAccountName();
    this.isAccountLinked = !!(this.crmAccount && this.crmAccount.link);
    this.canUpdate = canUpdateCrmLocationContactEntity(this);
    this.linkStatus = getLinkStatusLocationContact(this);

    return this;
  }

  private getDisplayName(): string {
    let displayName = '';

    if (this.firstName && this.lastName) {
      displayName = `${this.firstName} ${this.lastName}`;
    } else if (this.firstName) {
      displayName = this.firstName;
    } else if (this.lastName) {
      displayName = this.lastName;
    } else {
      displayName = this.username;
    }

    return displayName;
  }

  private getAccountName(): string {
    return this.crmAccount ? this.crmAccount.name : '';
  }
}

export class CrmLocationEntity {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  crmAccount?: CrmAccountEntity;
  companyId?: string;
  crmAccountId: string;
  link?: any;
  shortName: string;
  streetAddress: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  careOf?: string;
  labels: CrmAccountLocationLabelsPopulated;
  logoUrl: string;
  geolocation: Geolocation;
  loadingHours?: string;
  loadingNotes?: string;
  receivingHours?: string;
  receivingNotes?: string;
  archived: boolean;

  archivedString: string;

  fullName: string;
  description?: string;
  type = CrmTypeEnum.LOCATION;
  icon = 'location_on';
  accountName: string;
  canUpdate: boolean;
  isAccountLinked: boolean;
  linkStatus: CrmLinkStatusEnum;

  init(dto: CrmAccountLocation | CrmAccountLocationBasePopulated | CrmAccountLocationBaseWithLabelsPopulated): any {
    Object.assign(this, dto);

    this.fullName = dto.shortName;
    this.description = (dto.city || '') + ' ' + (dto.streetAddress || '');

    this.archivedString = this.archived ? 'Yes' : 'No';

    this.accountName = this.getAccountName();
    this.canUpdate = canUpdateCrmLocationContactEntity(this);
    this.isAccountLinked = !!(this.crmAccount && this.crmAccount.link);
    this.linkStatus = getLinkStatusLocationContact(this);

    return this;
  }

  private getAccountName(): string {
    return this.crmAccount ? this.crmAccount.name : '';
  }
}

export interface Geolocation {
  latitude: number;
  longitude: number;
}

export class CrmAccountSalesInfoEntity {
  notes?: string;

  init(dto: CrmAccountSalesInfo): CrmAccountSalesInfoEntity {
    return Object.assign(this, dto);
  }
}

export class CrmAccountCreditInfoEntity {
  maxCredit: number;
  creditTerms: string;

  init(dto: CrmAccountCreditInfo): CrmAccountCreditInfoEntity {
    return Object.assign(this, dto);
  }
}

export class CrmAccountPaymentInfoEntity {
  paymentTerms: string;

  init(dto: CrmAccountPaymentInfo): CrmAccountPaymentInfoEntity {
    return Object.assign(this, dto);
  }
}

export class CrmContactSalesInfoEntity {
  notes?: string;
  preferredContactMethod?: string;

  init(dto: CrmAccountContactSalesInfo): CrmContactSalesInfoEntity {
    return Object.assign(this, dto);
  }
}

export class CrmLocationSalesInfoEntity {
  notes?: string;

  init(dto: CrmAccountLocationSalesInfo): CrmLocationSalesInfoEntity {
    return Object.assign(this, dto);
  }
}

export class ContactLabels {
  roleTags: Label[];
  tags: Label[];
}

export class LocationLabels {
  tags: Label[];
}

export class Label {}
