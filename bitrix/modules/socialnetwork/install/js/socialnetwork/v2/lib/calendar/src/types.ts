export type CalendarSettings = {
	HOURS: {
		START: Time;
		END: Time;
	};
	HOLIDAYS: Day[];
	WEEKEND: string[];
	WEEK_START: string;
	SERVER_OFFSET: number;
};

type Time = {
	H: number;
	M: number;
	S: number;
};

type Day = {
	M: number;
	D: number;
};

export type FormatDateTimeOptions = {
	forceYear: boolean;
	removeOffset: boolean;
}
