/* eslint-disable */
type Params = {
	settings: Settings;
	recipients?: Recipient[];
};

type Settings = {
	isEnabled: boolean;
	recipientUserIds: number[];
	scheduleWeekdays: number[];
	situations: Situations;
	sendSelfDigest: boolean;
};

type Situations = Record<SituationCode, SituationItem>;

type SituationCode = 'badStreak' | 'goodStreak' | 'ratingDropped' | 'ratingRaised';

type SituationItem = {
	enabled: boolean;
	threshold: number;
};

type Recipient = {
	id: number;
	name: string;
	avatar?: string | null;
};

declare namespace BX.Crm.Copilot {
	class CallAssessmentSummary {
		constructor(containerId: string, params: Params);
	}
}
