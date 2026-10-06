declare module 'crm.ai.name-service' {
	export class NameService {
		static copilotName(): string;
		static copilotNameReplacement(): Record<string, string>;
	}
}

declare module 'ui.notification' {
	type NotifyOptions = {
		content: string,
		autoHideDelay?: number,
		category?: string,
		actions?: Array<{ title: string, events?: { click?: () => void } }>,
	};

	export const UI: {
		Notification: {
			Center: {
				notify(options: NotifyOptions): void,
			},
		},
	};
}
