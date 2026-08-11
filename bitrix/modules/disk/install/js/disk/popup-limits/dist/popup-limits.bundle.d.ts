/* eslint-disable */
type PopupLimitsOptions = {
	popupId: string;
	isLimitEdit?: boolean;
	submitButtonCallback?: ButtonCallback;
	increaseLimitRequestButtonCallback?: ButtonCallback;
	isCloud: boolean;
};

type ButtonCallback = (button: BX.UI.BaseButton, event: MouseEvent) => {};

declare namespace BX.Disk {
	class PopupLimits {
		private readonly popupId;
		private readonly isLimitEdit;
		private readonly submitButton;
		private popup;
		private increaseLimitRequestButton;
		private readonly partnerButtonId;
		private isCloud;
		constructor(options: PopupLimitsOptions);
		getPopupId(): string;
		getPopup(): BX.Main.Popup | null;
		private renderPopupContent;
		private getText;
		private createPopup;
		private initSubmitButton;
		private getSubmitButtonText;
		private initIncreaseLimitRequestButton;
		private initPartnerButton;
		show(bindElement: HTMLElement): void;
		hide(): void;
	}
}
