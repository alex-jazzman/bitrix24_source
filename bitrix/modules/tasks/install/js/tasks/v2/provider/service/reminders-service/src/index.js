import { mapModelToDto, mapDtoToModel } from './mappers';
import { RemindersService } from './reminders-service';

export const remindersService = new RemindersService();
export const RemindersMappers = { mapModelToDto, mapDtoToModel };
