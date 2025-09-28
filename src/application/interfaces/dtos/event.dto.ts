import { Type } from "class-transformer";
import {
  IsString,
  IsEmail,
  IsEnum,
  ValidateNested,
  IsObject,
} from "class-validator";
import { EventType } from "src/domain/event-payload";

class UserDto {
  @IsString()
  id: string;

  @IsString()
  name?: string;

  @IsEmail()
  email: string;
}

export class CreateEventDto {
  @IsString()
  eventId: string;

  @IsEnum(EventType)
  eventType: EventType;

  @IsString()
  timestamp: string;

  @ValidateNested()
  @Type(() => UserDto)
  user: UserDto;

  @IsObject()
  data: Record<string, any>;
}
