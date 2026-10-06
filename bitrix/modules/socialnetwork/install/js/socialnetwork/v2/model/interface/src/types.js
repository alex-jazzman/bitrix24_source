export type InterfaceModel = {
	action?: string;
	currentUserId: number;
	isOldPortal: boolean;
	isAccessRestricted: boolean;
	loading: boolean;
	scrollToStartupTool: boolean;
	validation: {
		title: {
			invalid: boolean;
			required?: boolean;
			uniq?: boolean;
		}
	},
	copyOptions?: {
		tasks?: {
			enabled?: boolean,
			robots?: boolean,
		},
		disk?: {
			enabled?: boolean,
			withFiles?: boolean,
		},
	},
};
