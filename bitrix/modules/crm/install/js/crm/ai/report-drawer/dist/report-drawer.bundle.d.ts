/* eslint-disable */
type AppParams = {
	drawerRequest: DrawerRequest;
	ajaxAction: string;
};

type DrawerRequest = {
	activityId: number;
	ownerTypeId: number;
	ownerId: number;
	jobId: null | number;
	assessmentSettingsId: null | number;
};

declare namespace BX.Crm.AI {
	class ReportDrawer {
		private params;
		private app;
		private viewData;
		private container;
		private pull;
		private scriptSelectorDialog;
		private confirmationPopup;
		private isDestroyed;
		private isReloading;
		private isAssessmentInProgress;
		private pendingAssessmentSettingsId;
		private readonly sliderId;
		constructor(params: AppParams);
		open(): Promise<void>;
		renderTo(container: Element): Promise<void>;
		destroy(): void;
		private createApp;
		private getSliderLink;
		private getScenario;
		private mountApp;
		private onShowReassessmentPopup;
		private onChooseNewScript;
		private onScriptSelected;
		private prepareAssessmentSettingFromItem;
		private showConfirmationPopup;
		private renderConfirmationPopupContent;
		private formatScriptUpdatedAt;
		private doAssessment;
		private onCallScoringPull;
		private reloadData;
		private initializePull;
		private closeSliderOnInitialLoadError;
		private mountNotFoundPlaceholder;
		private getResponseErrors;
		private getCurrentAssessmentSettingsId;
		private finishAssessmentWithError;
		private syncContentVisibility;
		private showRequestError;
		private destroyScriptSelectorDialog;
		private destroyConfirmationPopup;
		private loadData;
		private parseData;
	}
}
