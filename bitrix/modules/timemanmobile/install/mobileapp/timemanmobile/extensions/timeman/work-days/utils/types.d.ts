declare type DayMapEntry = {
	dayType: DayType | null,
	records: object[],
	reports: object[],
};

declare type DayMap = Map<string, DayMapEntry>;
