/* eslint-disable */
type FormatDateTimeOptions = {
	forceYear: boolean;
	removeOffset: boolean;
};

declare namespace BX.Socialnetwork.V2.Lib {
	class Calendar {
		static get weekStart(): string;
		static get workdayDuration(): number;
		static get workdayStart(): {
			H: number;
			M: number;
		};
		static get dayStartTime(): string;
		static get dayEndTime(): string;
		static formatDateTime(timestamp: number, options?: FormatDateTimeOptions | null): string;
		static formatDate(timestamp: number, options?: Pick<FormatDateTimeOptions, 'forceYear'> | null): string;
		static formatTime(timestamp: number): string;
		static calculateDuration(startTs: number, end: number): number;
		static isWorkDay(timestamp: number): boolean;
		static setHours(timestamp: number, hours: number, minutes: number): number;
		static createDateFromUtc(date: Date): Date;
		static isToday(timestamp: number): boolean;
	}
}
