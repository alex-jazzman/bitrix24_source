import { mapModelToDto, mapDtoToModel } from './mappers';
import { TimeTrackingService } from './time-tracking-service';

export const timeTrackingService = new TimeTrackingService();
export const TimeTrackingMappers = { mapModelToDto, mapDtoToModel };
