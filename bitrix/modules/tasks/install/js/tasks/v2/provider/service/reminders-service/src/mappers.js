import { Type } from 'main.core';
import type { ReminderModel } from 'tasks.v2.model.reminders';
import type { ReminderDto } from './types';

export function mapModelToDto(reminder: ReminderModel): ReminderDto
{
	return {
		id: reminder.id,
		taskId: reminder.taskId,
		userId: reminder.userId,
		nextRemindTs: mapValue(reminder.nextRemindTs, Math.floor(reminder.nextRemindTs / 1000)),
		remindBy: reminder.remindBy,
		remindVia: reminder.remindVia,
		recipient: reminder.recipient,
		before: mapValue(reminder.before, Math.floor(reminder.before / 1000)),
	};
}

export function mapDtoToModel(reminderDto: ReminderDto): ReminderModel
{
	return {
		id: reminderDto.id,
		taskId: reminderDto.taskId,
		userId: reminderDto.userId,
		nextRemindTs: mapValue(reminderDto.nextRemindTs, reminderDto.nextRemindTs * 1000),
		remindBy: reminderDto.remindBy,
		remindVia: reminderDto.remindVia,
		recipient: reminderDto.recipient,
		before: mapValue(reminderDto.before ?? undefined, reminderDto.before * 1000),
	};
}

function mapValue(value: any, mappedValue: any): any | undefined
{
	return Type.isUndefined(value) ? undefined : mappedValue;
}
