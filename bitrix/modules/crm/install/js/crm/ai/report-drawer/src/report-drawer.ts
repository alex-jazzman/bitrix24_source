import { ajax as Ajax, Dom, Loc, Tag, Text, Type } from 'main.core';
import { type BaseEvent } from 'main.core.events';
import { DateTimeFormat } from 'main.date';
import { Popup } from 'main.popup';
import { SidePanel } from 'main.sidepanel';
import { Router } from 'crm.router';
import { DatetimeConverter } from 'crm.timeline.tools';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';
import { Dialog } from 'ui.entity-selector';
import { TextSm } from 'ui.system.typography.vue';
import 'crm_common';

import { type App as VueApp, BitrixVue } from 'ui.vue3';
import { locMixin } from 'ui.vue3.mixins.loc-mixin';

import { App } from './components/app';
import { Pull } from './pull';

import {
	type AppParams,
	type AssessmentSettingData,
	type ViewData,
	type ResponseData, ResponseError,
	type CallScoringPullData, DrawerRequest,
} from './types';

import 'ui.buttons.icons';
import 'ui.typography';
import 'ui.design-tokens';
import 'ui.icons.b24';
import 'ui.icon-set.crm';
import 'ui.icon-set.outline';
import 'ui.forms';

const SCENARIO = {
	CALL_ASSESSMENT: {
		ajaxAction: 'crm.timeline.aireportdrawer.loadCallAssessmentDrawer',
		code: 'call-assessment',
	},
	SUMMARY_HISTORY: {
		ajaxAction: 'crm.timeline.aireportdrawer.loadSummaryHistoryDrawer',
		code: 'summary-history',
	},
};

export class ReportDrawer
{
	private app: null | VueApp = null;
	private viewData: null | ViewData = null;
	private container: null | Element = null;
	private pull: null | Pull = null;
	private scriptSelectorDialog: null | Dialog = null;
	private confirmationPopup: null | Popup = null;
	private isDestroyed: boolean = false;
	private isReloading: boolean = false;
	private isAssessmentInProgress: boolean = false;
	private pendingAssessmentSettingsId: null | number = null;
	private readonly sliderId: string;

	public constructor(
		private params: AppParams,
	)
	{
		this.sliderId = `crm-ai-report-drawer-slider-${Text.getRandom()}`;
	}

	public async open(): Promise<void>
	{
		const newWindowUrl = this.getSliderLink();

		SidePanel.Instance.open(
			this.sliderId,
			{
				width: 800,
				contentCallback: (): Promise<Element> => Promise.resolve(this.createApp()),
				containerClassName: 'crm-ai-report-drawer-slider',
				cacheable: false,
				allowChangeHistory: false,
				copyLinkLabel: Type.isStringFilled(newWindowUrl),
				newWindowLabel: false,
				newWindowUrl: newWindowUrl ?? undefined,
				events: {
					onOpenComplete: () => {
						void this.reloadData();
					},
					onCloseComplete: () => {
						this.destroy();
					},
					onDestroyComplete: () => {
						this.destroy();
					},
				},
			},
		);
	}

	public async renderTo(container: Element): Promise<void>
	{
		if (!Type.isDomNode(container))
		{
			return;
		}

		Dom.addClass(container, 'crm-ai-report-drawer__slider-wrapper');
		this.container = container;
		this.syncContentVisibility();

		if (!Type.isNull(this.viewData))
		{
			this.mountApp(this.viewData);
		}

		await this.reloadData();
	}

	public destroy(): void
	{
		if (this.isDestroyed)
		{
			return;
		}

		this.isDestroyed = true;

		this.destroyScriptSelectorDialog();
		this.destroyConfirmationPopup();

		this.pull?.unsubscribe();
		this.pull = null;

		this.app?.unmount();
		this.app = null;
		this.viewData = null;
		this.container = null;
	}

	private createApp(): Element
	{
		const container = Tag.render`<div id="crm-ai-report-drawer" class="crm-ai-report-drawer__slider-wrapper"></div>`;
		this.container = container;
		this.syncContentVisibility();

		if (Type.isNull(this.viewData))
		{
			return container;
		}

		this.mountApp(this.viewData);

		return container;
	}

	private getSliderLink(): string | null
	{
		const scenario = this.getScenario();
		if (!Type.isStringFilled(scenario))
		{
			return null;
		}

		const uri = Router.Instance.getAiReportDrawerUrl(scenario, this.params.drawerRequest);

		if (!uri)
		{
			return null;
		}

		return new URL(uri.toString(), window.location.origin).toString();
	}

	private getScenario(): string | null
	{
		switch (this.params.ajaxAction)
		{
			case SCENARIO.CALL_ASSESSMENT.ajaxAction:
				return SCENARIO.CALL_ASSESSMENT.code;

			case SCENARIO.SUMMARY_HISTORY.ajaxAction:
				return SCENARIO.SUMMARY_HISTORY.code;

			default:
				return null;
		}
	}

	private mountApp(data: ViewData): void
	{
		if (Type.isNull(this.container))
		{
			return;
		}

		this.app?.unmount();

		this.app = BitrixVue.createApp(
			App,
			{
				viewData: data,
				shareLink: this.getSliderLink(),
				onShowReassessmentPopup: this.onShowReassessmentPopup.bind(this),
				onChooseNewScript: this.onChooseNewScript.bind(this),
			},
		);
		this.app.mixin(locMixin);
		this.app.mount(this.container);
	}

	private onShowReassessmentPopup(assessmentSetting: AssessmentSettingData): void
	{
		if (
			this.isDestroyed
			|| this.isAssessmentInProgress
			|| this.isReloading
			|| !Type.isInteger(assessmentSetting?.id)
		)
		{
			return;
		}

		this.destroyConfirmationPopup();
		this.destroyScriptSelectorDialog();
		this.showConfirmationPopup(assessmentSetting);
	}

	private onChooseNewScript(bindElement: HTMLElement): void
	{
		if (
			this.isDestroyed
			|| this.isAssessmentInProgress
			|| this.isReloading
			|| !Type.isDomNode(bindElement)
		)
		{
			return;
		}

		this.destroyConfirmationPopup();
		this.destroyScriptSelectorDialog();

		const preselectedItems: ItemId[] = [];
		const currentAssessmentSettingsId = this.getCurrentAssessmentSettingsId();
		const scriptSelectorEntityId = 'copilot_call_script';
		if (Type.isInteger(currentAssessmentSettingsId))
		{
			preselectedItems.push([scriptSelectorEntityId, currentAssessmentSettingsId]);
		}

		this.scriptSelectorDialog = new Dialog({
			targetNode: bindElement,
			context: 'CRM_AI_REPORT_DRAWER_CALL_SCRIPT_SELECTOR',
			multiple: false,
			dropdownMode: true,
			enableSearch: true,
			showAvatars: true,
			preselectedItems,
			entities: [{
				id: scriptSelectorEntityId,
				dynamicLoad: true,
				dynamicSearch: true,
			}],
			events: {
				'Item:onSelect': (event: BaseEvent) => {
					void this.onScriptSelected(event);
				},
				'Item:onDeselect': (event: BaseEvent) => {
					void this.onScriptSelected(event);
				},
				onHide: () => {
					this.destroyScriptSelectorDialog();
				},
			},
		});
		this.scriptSelectorDialog.show();
	}

	private async onScriptSelected(event: BaseEvent): Promise<void>
	{
		const { item } = event.getData();
		if (!Type.isFunction(item?.getId) || !Type.isFunction(item?.getTitle))
		{
			return;
		}

		this.scriptSelectorDialog?.hide();

		const assessmentSettingsId = item.getId();
		if (!Type.isInteger(assessmentSettingsId))
		{
			return;
		}

		const assessmentSetting = this.prepareAssessmentSettingFromItem(item);
		if (assessmentSetting === null || this.isDestroyed)
		{
			return;
		}

		this.showConfirmationPopup(assessmentSetting);
	}

	private prepareAssessmentSettingFromItem(item: any): AssessmentSettingData | null
	{
		const assessmentSettingsId = item.getId();
		if (!Type.isInteger(assessmentSettingsId))
		{
			return null;
		}

		const customData = Type.isFunction(item.getCustomData)
			? Object.fromEntries(item.getCustomData())
			: {}
		;

		const currentAssessmentSetting = this.viewData?.assessmentSetting ?? null;
		if (Type.isNull(currentAssessmentSetting))
		{
			return null;
		}

		return {
			id: assessmentSettingsId,
			title: Type.isStringFilled(item.getTitle()) ? item.getTitle() : currentAssessmentSetting.title,
			promptUpdatedAt: Type.isStringFilled(customData.promptUpdatedAt)
				? customData.promptUpdatedAt
				: (
					currentAssessmentSetting.id === assessmentSettingsId
						? currentAssessmentSetting.promptUpdatedAt
						: ''
				),
			shouldShowReassessmentBadge:
				currentAssessmentSetting.id === assessmentSettingsId
					? currentAssessmentSetting.shouldShowReassessmentBadge
					: false,
		};
	}

	private showConfirmationPopup(assessmentSetting: AssessmentSettingData): void
	{
		this.destroyConfirmationPopup();

		const buttons = [
			new Button(({
				text: Loc.getMessage('CRM_AI_REPORT_DRAWER_CONFIRM_SCRIPT_BUTTON_CONFIRM') ?? '',
				size: ButtonSize.MEDIUM,
				useAirDesign: true,
				style: AirButtonStyle.FILLED,
				onclick: () => {
					popup.close();
					void this.doAssessment(assessmentSetting.id);

					return {};
				},
			}) as any),
			new Button(({
				text: Loc.getMessage('CRM_AI_REPORT_DRAWER_CONFIRM_SCRIPT_BUTTON_CANCEL') ?? '',
				size: ButtonSize.MEDIUM,
				useAirDesign: true,
				style: AirButtonStyle.OUTLINE_NO_ACCENT,
				onclick: () => {
					popup.close();

					return {};
				},
			}) as any),
		];

		const popup = new Popup({
			id: `crm-ai-report-drawer-confirm-script-popup-${Text.getRandom()}`,
			targetContainer: document.body,
			cacheable: false,
			autoHide: false,
			closeByEsc: true,
			closeIcon: true,
			fixed: true,
			width: 400,
			overlay: true,
			className: 'crm-ai-report-drawer__confirm-popup-wrapper',
			contentBackground: 'none',
			titleBar: Loc.getMessage(
				'CRM_AI_REPORT_DRAWER_CONFIRM_SCRIPT_TITLE',
				{
					'#SCRIPT_NAME#': assessmentSetting.title,
				},
			) ?? '',
			content: this.renderConfirmationPopupContent(assessmentSetting),
			events: {
				onClose: () => {
					if (this.confirmationPopup === popup)
					{
						this.confirmationPopup = null;
					}
				},
				onDestroy: () => {
					if (this.confirmationPopup === popup)
					{
						this.confirmationPopup = null;
					}
				},
			},
		});
		popup.setButtons(buttons as any);

		this.confirmationPopup = popup;
		popup.show();
	}

	private renderConfirmationPopupContent(assessmentSetting: AssessmentSettingData): HTMLElement
	{
		const lastUpdatedMsg = Loc.getMessage(
			'CRM_AI_REPORT_DRAWER_CONFIRM_SCRIPT_LAST_UPDATED',
			{
				'#LAST_UPDATED#': this.formatScriptUpdatedAt(assessmentSetting.promptUpdatedAt),
			},
		);

		return Tag.render`
			<div class="crm-ai-report-drawer__confirm-popup">
				<div class="crm-ai-report-drawer__confirm-popup-description ui-typography-text-md">
					${lastUpdatedMsg}
				</div>
			</div>
		`;
	}

	private formatScriptUpdatedAt(promptUpdatedAt: null | string): string
	{
		if (!Type.isStringFilled(promptUpdatedAt))
		{
			return Loc.getMessage('CRM_AI_REPORT_DRAWER_CONFIRM_SCRIPT_UPDATED_AT_EMPTY') ?? '';
		}

		const date = new Date(promptUpdatedAt);
		if (Number.isNaN(date.getTime()))
		{
			return Loc.getMessage('CRM_AI_REPORT_DRAWER_CONFIRM_SCRIPT_UPDATED_AT_EMPTY') ?? '';
		}

		return DateTimeFormat.format(DatetimeConverter.getSiteDateTimeFormat(), date);
	}

	private async doAssessment(assessmentSettingsId: number): Promise<void>
	{
		if (this.isDestroyed || this.isAssessmentInProgress)
		{
			return;
		}

		const {
			activityId,
			ownerTypeId,
			ownerId,
		} = this.params.drawerRequest;

		this.isAssessmentInProgress = true;
		this.pendingAssessmentSettingsId = assessmentSettingsId;
		this.params.drawerRequest.jobId = null;
		this.syncContentVisibility();

		const drawer = SidePanel.Instance.getSlider(this.sliderId);
		drawer?.showLoader();

		try
		{
			const response = await Ajax.runAction(
				'crm.copilot.callqualityassessment.doAssessment',
				{
					data: {
						activityId,
						ownerTypeId,
						ownerId,
						assessmentSettingsId,
					},
				},
			);

			if (response?.status !== 'success')
			{
				this.finishAssessmentWithError(response, 'ReportDrawer doAssessment failed');

				return;
			}

			this.params.drawerRequest.jobId = Type.isInteger(response?.data?.jobId)
				? response.data.jobId
				: null
			;
		}
		catch (error)
		{
			this.finishAssessmentWithError(error, 'ReportDrawer doAssessment error');
		}
	}

	private onCallScoringPull(params: CallScoringPullData): void
	{
		if (this.isDestroyed || this.params.drawerRequest.activityId !== params.activityId)
		{
			return;
		}

		if (params.status === 'error')
		{
			this.finishAssessmentWithError(null, 'ReportDrawer pull returned error');

			return;
		}

		const expectedAssessmentSettingsId = this.pendingAssessmentSettingsId
			?? this.params.drawerRequest.assessmentSettingsId
		;
		if (
			Type.isInteger(expectedAssessmentSettingsId)
			&& Type.isInteger(params.assessmentSettingsId)
			&& expectedAssessmentSettingsId !== params.assessmentSettingsId
		)
		{
			return;
		}

		this.params.drawerRequest.jobId = Type.isInteger(params.jobId) ? params.jobId : null;
		if (Type.isInteger(params.assessmentSettingsId))
		{
			this.params.drawerRequest.assessmentSettingsId = params.assessmentSettingsId;
		}

		this.pendingAssessmentSettingsId = null;

		void this.reloadData();
	}

	private async reloadData(): Promise<void>
	{
		if (this.isDestroyed || this.isReloading || Type.isNull(this.container))
		{
			return;
		}

		const drawer = SidePanel.Instance.getSlider(this.sliderId);
		drawer?.showLoader();
		this.isReloading = true;

		try
		{
			const response: ResponseData = await this.loadData(this.params.drawerRequest);
			const errors: ResponseError[] = Type.isArray(response.errors) ? response.errors : [];

			if (errors.length !== 0)
			{
				if (this.mountNotFoundPlaceholder(response))
				{
					return;
				}

				this.showRequestError(response, 'Errors while reloading data for ReportDrawer');
				this.closeSliderOnInitialLoadError();

				return;
			}

			this.viewData = this.parseData(response);
			this.initializePull();
			this.mountApp(this.viewData);
		}
		catch (error)
		{
			if (this.mountNotFoundPlaceholder(error))
			{
				return;
			}

			this.showRequestError(error, 'ReportDrawer reload error');
			this.closeSliderOnInitialLoadError();
		}
		finally
		{
			this.isReloading = false;
			if (this.isAssessmentInProgress)
			{
				this.isAssessmentInProgress = false;
				this.syncContentVisibility();
			}
			drawer?.closeLoader();
		}
	}

	private initializePull(): void
	{
		if (
			this.pull === null
			&& this.params.ajaxAction === 'crm.timeline.aireportdrawer.loadCallAssessmentDrawer'
		)
		{
			this.pull = new Pull(this.onCallScoringPull.bind(this));
		}
	}

	private closeSliderOnInitialLoadError(): void
	{
		if (this.viewData === null)
		{
			SidePanel.Instance.getSlider(this.sliderId)?.close();
		}
	}

	private mountNotFoundPlaceholder(response: unknown): boolean
	{
		const error = this.getResponseErrors(response).find((item) => item.code === 'NOT_FOUND');
		if (!error || Type.isNull(this.container))
		{
			return false;
		}

		this.app?.unmount();
		this.app = BitrixVue.createApp(
			{
				components: { TextSm },
				props: {
					message: {
						type: String,
						required: true,
					},
				},
				template: '<TextSm tag="div" className="crm-ai-report-drawer__not-found">{{ message }}</TextSm>',
			},
			{ message: error.message },
		);
		this.app.mount(this.container);

		return true;
	}

	private getResponseErrors(response: unknown): ResponseError[]
	{
		if (!Type.isObjectLike(response))
		{
			return [];
		}

		const errors = (response as { errors?: unknown }).errors;
		if (!Type.isArray(errors))
		{
			return [];
		}

		return errors.filter(
			(error): error is ResponseError => (
				Type.isObjectLike(error)
				&& Type.isString(error.message)
				&& (Type.isUndefined(error.code) || Type.isString(error.code))
			),
		);
	}

	private getCurrentAssessmentSettingsId(): null | number
	{
		const currentId = this.viewData?.assessmentSetting?.id ?? this.params.drawerRequest.assessmentSettingsId;
		if (Type.isInteger(currentId))
		{
			return currentId;
		}

		return null;
	}

	private finishAssessmentWithError(error: any, logMessage: string): void
	{
		this.pendingAssessmentSettingsId = null;
		this.isAssessmentInProgress = false;
		this.syncContentVisibility();
		SidePanel.Instance.getSlider(this.sliderId)?.closeLoader();

		this.showRequestError(error, logMessage);
	}

	private syncContentVisibility(): void
	{
		if (Type.isNull(this.container))
		{
			return;
		}

		if (this.isAssessmentInProgress)
		{
			Dom.addClass(this.container, '--content-hidden');

			return;
		}

		Dom.removeClass(this.container, '--content-hidden');
	}

	private showRequestError(error: any, logMessage: string): void
	{
		if (error !== null)
		{
			console.error(logMessage, error);
		}
		else
		{
			console.error(logMessage);
		}

		const message = error?.errors?.[0]?.message ?? null;
		if (Type.isStringFilled(message))
		{
			const topWindow = window.top ?? window;
			(topWindow as any).BX?.UI?.Notification?.Center?.notify?.({
				content: message,
				autoHideDelay: 5000,
			});
		}
	}

	private destroyScriptSelectorDialog(): void
	{
		const dialog = this.scriptSelectorDialog;
		this.scriptSelectorDialog = null;
		dialog?.hide();
	}

	private destroyConfirmationPopup(): void
	{
		const popup = this.confirmationPopup;
		this.confirmationPopup = null;
		popup?.destroy();
	}

	private loadData(params: DrawerRequest): Promise<ResponseData>
	{
		const data = {
			data: params,
		};

		return Ajax.runAction(this.params.ajaxAction, data);
	}

	private parseData(response: ResponseData): ViewData
	{
		const data = response.data;

		return {
			title: data.title ?? '',
			subtitle: data.subtitle ?? null,
			settings: data.settings ?? [],
			record: data.record ?? null,
			infoPopup: data.infoPopup ?? null,
			anchors: data.anchors ?? [],
			assessmentBlocks: data.assessmentBlocks ?? [],
			blocks: data.blocks ?? [],
			aiDisclaimer: data.aiDisclaimer ?? '',
			assessmentSetting: data.assessmentSetting ?? null,
		};
	}
}
