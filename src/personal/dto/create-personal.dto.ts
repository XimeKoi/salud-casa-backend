import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreatePersonalDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  apellidoPaterno: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  apellidoMaterno?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(12)
  telefonoPrincipal: string;

  @IsString()
  @IsOptional()
  @MaxLength(12)
  telefonoSecundario?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  domicilio: string;
}
