export class CreateAiLinkDto {
  title: string;
  url: string;
  description?: string;
  account?: string;
  password?: string;
  notes?: string;
  sortOrder?: number;
}

export class UpdateAiLinkDto {
  title?: string;
  url?: string;
  description?: string;
  account?: string;
  password?: string;
  notes?: string;
  sortOrder?: number;
}


