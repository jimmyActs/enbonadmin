export interface AlbumPhotoDto {
  url: string;
  caption?: string;
}

export class CreateAlbumDto {
  title: string;
  subtitle?: string;
  category?: string;
  tag?: string;
  pinned?: boolean;
  hidden?: boolean;
  layout?: string;
  sizeClass?: string;
  coverImage?: string;
  photos?: AlbumPhotoDto[];
}

export class UpdateAlbumDto {
  title?: string;
  subtitle?: string;
  category?: string;
  tag?: string;
  pinned?: boolean;
  hidden?: boolean;
  layout?: string;
  sizeClass?: string;
  coverImage?: string;
  photos?: AlbumPhotoDto[];
}


