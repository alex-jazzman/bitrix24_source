export type ChangeTariffParams = {
	tariffRestrictions: {
		fullChatHistory: {
			isAvailable: boolean,
			limitDays: number | null,
		},
		collab: {
			isAvailable: boolean,
			isCopyAvailable: boolean
		},
	},
};
