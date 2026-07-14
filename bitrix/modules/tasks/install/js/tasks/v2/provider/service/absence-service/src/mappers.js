import { calendar } from 'tasks.v2.lib.calendar';
import type { UserAbsence } from 'tasks.v2.model.absences';
import type { UserAbsenceDto } from './types';

export function mapDtoToModel(absenceDto: UserAbsenceDto): UserAbsence
{
	return {
		id: absenceDto.id,
		userId: absenceDto.userId,
		fromTs: calendar.parseDateTs(absenceDto.dateTimeFrom),
		toTs: calendar.parseDateTs(absenceDto.dateTimeTo),
		viewed: false,
	};
}
