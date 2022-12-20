import { LabelSet } from '../app-layer.enums';

export class LabelEntity {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  name: string;
  description: string;
  color: string;
  companyId?: string;
  labelSet: LabelSet;
  isSelected: boolean;

  init(dto) {
    Object.assign(this, dto);
    return this;
  }
}

export class LabelGroups {
  accountIndustryTags: LabelEntity[];
  accountCategoryTags: LabelEntity[];
  accountTags: LabelEntity[];
  locationTags: LabelEntity[];
  contactRoleTags: LabelEntity[];
  contactTags: LabelEntity[];
}
