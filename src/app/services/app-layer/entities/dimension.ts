export class DimensionEntity {
  id?: string;
  name: string;
  description: string;
  archived: boolean;
  status: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;

  init(dto) {
    Object.assign(this, dto);
    this.description = dto.description;
    this.status = this.archived ? 'Inactive' : 'Active';
    return this;
  }
}
