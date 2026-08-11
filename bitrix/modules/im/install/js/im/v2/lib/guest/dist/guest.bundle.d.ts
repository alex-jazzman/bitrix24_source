/* eslint-disable */
declare namespace BX.Messenger.v2.Lib {
	class GuestManager {
		static getInstance(): GuestManager;
		setGuestNamePopupState(value: boolean): void;
		getGuestNamePopupState(): boolean;
		isGuestLinkAvailable(dialogId: string): boolean;
		setTermsOfServiceUrl(value: string): void;
		getTermsOfServiceUrl(): string;
	}
}
