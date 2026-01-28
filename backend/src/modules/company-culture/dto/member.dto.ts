export class CreateMemberDto {
  name: string;
  title?: string;
  tag?: string;
  avatar?: string;
  sortOrder?: number;
}

export class UpdateMemberDto {
  name?: string;
  title?: string;
  tag?: string;
  avatar?: string;
  sortOrder?: number;
}


