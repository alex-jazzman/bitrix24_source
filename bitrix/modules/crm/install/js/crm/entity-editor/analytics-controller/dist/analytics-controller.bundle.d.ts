/* eslint-disable */
declare namespace BX.Crm {
	class EntityEditorAnalyticsController extends BX.UI.EntityEditorController {
		ajaxForms: any[];
		formBeforeSubmitHandler: (ajaxForm: any, eventArgs: any) => void;
		postFormAnalytics: Record<string, any>;
		appendParamsFromCurrentUrl: boolean;
		constructor();
		doInitialize(): void;
		bindToAjaxForms(ajaxForms: any): void;
		unbindFromAjaxForms(): void;
		onAjaxFormBeforeSubmit(ajaxForm: any, eventArgs: any): void;
		release(): void;
		static create(id: string, settings: any): EntityEditorAnalyticsController;
	}

	const BX: any;
}
