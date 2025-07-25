type Event = {
	id: number,
	parentId: number,
	fullDay: boolean,
	calType: string,
	ownerId: number,
	dateFromFormatted: string,
	dateFromTs: number,
	dateToTs: number,
	timezone: string,
	timezoneOffset: number,
	isDaylightSavingTimezone: string,
	sectionId: number,
	name: string,
	description: string,
	location: string,
	color: string,
	eventType: string,
	meetingStatus: string,
	meetingHost: number,
	recurrenceRule: object,
	recurrenceRuleDescription: string,
	recurrenceId: number,
	excludedDates: string,
	eventLength: number,
	attendees: object[],
	reminders: object[],
	accessibility: string,
	importance: string,
	privateEvent: number,
	permissions: object,
	files: object[],
	collabId: number,
	chatId: number,
};
