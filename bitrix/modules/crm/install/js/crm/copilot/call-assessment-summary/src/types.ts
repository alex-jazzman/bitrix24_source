export type SituationCode = 'badStreak' | 'goodStreak' | 'ratingDropped' | 'ratingRaised';

export type SituationItem = {
	enabled: boolean;
	threshold: number;
};

export type Situations = Record<SituationCode, SituationItem>;

export type Settings = {
	isEnabled: boolean;
	recipientUserIds: number[];
	scheduleWeekdays: number[];
	situations: Situations;
	sendSelfDigest: boolean;
};

export type Recipient = {
	id: number;
	name: string;
	avatar?: string | null;
};

export type ThresholdBounds = {
	min: number;
	max: number;
};

export type SituationConfigItem = {
	code: SituationCode;
	titleCode: string;
	descriptionCode: string;
	thresholdCode?: string;
};

export type WeekdayItem = {
	value: number;
	labelCode: string;
};
