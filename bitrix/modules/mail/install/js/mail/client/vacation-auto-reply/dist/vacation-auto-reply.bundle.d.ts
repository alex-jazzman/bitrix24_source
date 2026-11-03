/* eslint-disable */
/** Parameters the screen application is started with. */
type ScreenParams = {
	containerId: string;
	mailboxId: number | null;
	timezoneId: string;
	editorId: string;
	mailboxListPath: string;
};

declare namespace BX.Mail.Client.VacationAutoReply {
	/**
	 * The screen of the vacation auto-reply: public facade, state owner and common lifecycle owner.
	 */
	class Screen {
		static init(params: ScreenParams): void;
		/** Entry point of the save button of the slider. */
		static save(): void;
		constructor(params: ScreenParams, container: HTMLElement);
		save(): void;
		destroy(): void;
	}
}
