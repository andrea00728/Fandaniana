export class CreateActivityTypeDto {
  nom!: string;
  description?: string;
  icon?: string;
}

export class UpdateActivityTypeDto {
  nom?: string;
  description?: string;
  icon?: string;
}
