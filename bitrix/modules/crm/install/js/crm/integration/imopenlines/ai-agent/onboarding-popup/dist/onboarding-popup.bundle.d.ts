/* eslint-disable */
type OnboardingPopupOptions = {
	closeOptionCategory: string;
	closeOptionName: string;
	templateId: number;
};

declare namespace BX.Crm.Integration.Imopenlines.AiAgent {
	class OnboardingPopup {
		private readonly closeOptionCategory;
		private readonly closeOptionName;
		private readonly templateId;
		private bannerDispatcher;
		private popup;
		constructor(options: OnboardingPopupOptions);
		show(): void;
		private getPopup;
		private createPopup;
		private getPopupOptions;
		private getPopupContent;
		private getIcon;
		private getConfigureButton;
		private getHelpDeskButton;
		private getPreviewVideo;
	}
}
