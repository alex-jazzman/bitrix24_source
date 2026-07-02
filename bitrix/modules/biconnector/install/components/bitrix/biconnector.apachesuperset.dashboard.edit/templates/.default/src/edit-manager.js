import { ajax as Ajax, Dom, Loc, Tag, Text, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { DashboardParametersSelector } from 'biconnector.dashboard-parameters-selector';
import { ApacheSupersetAnalytics } from 'biconnector.apache-superset-analytics';
import { ButtonManager, type Button } from 'ui.buttons';
import {
	TitleField,
	DescriptionField,
	GroupsField,
	ParametersField,
	PeriodField,
	CoverField,
	GalleryField,
} from './fields';

type DefaultValues = {
	title: string,
	description: string,
	coverImageId: ?number,
	coverImageSrc: string,
	galleryImageIds: number[],
	galleryImages: Object[],
	groups: number[],
	scopes: string[],
	params: string[],
	filterPeriod: string,
	dateFilterStart: string,
	dateFilterEnd: string,
};

type PeriodItem = {
	value: string,
	name: string,
	isDefault?: boolean,
	prefixText?: string,
	valueText?: string,
	suffixText?: string,
};

type Props = {
	nodeId: string,
	componentName: string,
	signedParameters: string,
	dashboardId: number,
	emptyCoverIconPath: string,
	defaultValues: DefaultValues,
	periodList: PeriodItem[],
	paramList: Object,
	requiredParamList: Object,
	groupIds: number[],
	activeUrlParamsSelector: boolean,
	isAllowedClearGroups: boolean,
	isEditMode: boolean,
};

export class SupersetDashboardEditManager
{
	#props: Props;
	#node: HTMLElement;
	#paramsSelector: ?DashboardParametersSelector;
	#saveButton: ?Button;
	#titleField: TitleField;
	#descriptionField: DescriptionField;
	#groupsField: GroupsField;
	#parametersField: ParametersField;
	#periodField: PeriodField;
	#coverField: CoverField;
	#galleryField: GalleryField;

	constructor(props: Props)
	{
		this.#props = props;
		this.#node = document.querySelector(`#${this.#props.nodeId}`);
		this.#paramsSelector = null;
		this.#saveButton = null;
		this.#titleField = new TitleField(this.#props?.defaultValues?.title ?? '');
		this.#descriptionField = new DescriptionField(this.#props?.defaultValues?.description ?? '');
		this.#groupsField = new GroupsField(this.#props?.defaultValues ?? {});
		this.#parametersField = new ParametersField(this.#props?.defaultValues ?? {});
		this.#periodField = new PeriodField({
			periodList: this.#props?.periodList ?? [],
			defaultValues: this.#props?.defaultValues ?? {},
		});
		this.#coverField = new CoverField(
			{
				...(this.#props?.defaultValues ?? {}),
				emptyIconPath: this.#props?.emptyCoverIconPath ?? '',
			},
			this.#props?.dashboardId ?? 0,
		);
		this.#galleryField = new GalleryField(
			this.#props?.defaultValues ?? {},
			this.#props?.dashboardId ?? 0,
		);

		if (!Type.isDomNode(this.#node))
		{
			return;
		}

		this.#render();
		this.#saveButton = ButtonManager.createFromNode(document.querySelector('#dashboard-button-save'));
		this.#saveButton?.setDisabled(true);

		EventEmitter.subscribe('BIConnector.DashboardParamsSelector:initCompleted', this.#onParamSelectorInit.bind(this));
		EventEmitter.subscribe('BIConnector.DashboardParamsSelector:onChange', this.#onSelectorChange.bind(this));
	}

	#render(): void
	{
		const mainSection = this.#getMainSection();
		Dom.append(mainSection, this.#node);

		this.#titleField.bind(this.#node);
		this.#periodField.bind(this.#node);
		this.#coverField.bind(this.#node);

		this.#paramsSelector = new DashboardParametersSelector({
			groups: new Set(this.#groupsField.getDefaultValue()),
			scopes: new Set(this.#parametersField.getDefaultScopes()),
			params: new Set(this.#parametersField.getDefaultParams()),
			paramList: this.#props.paramList,
			requiredParamList: this.#props.requiredParamList,
			activeUrlParamsSelector: this.#props.activeUrlParamsSelector,
			isAllowedClearGroups: this.#props.isAllowedClearGroups,
			isNewDashboard: !this.#props.isEditMode,
		});
		const parametersContainer = mainSection.querySelector('[data-role="dashboard-main-parameters"]');
		if (Type.isDomNode(parametersContainer))
		{
			Dom.append(this.#paramsSelector.getLayout(), parametersContainer);
		}

		Dom.append(this.#getDescriptionSection(), this.#node);
		this.#descriptionField.bind(this.#node);

		Dom.append(this.#getGallerySection(), this.#node);
		this.#galleryField.bind(this.#node);
	}

	#getTopBlock(): HTMLElement
	{
		return Tag.render`
			<div class="dashboard-edit-top-block">
				<div class="dashboard-edit-top-block-text">
					${Loc.getMessage('DASHBOARD_EDIT_TOP_BLOCK')}
				</div>
			</div>
		`;
	}

	#getDescriptionSection(): HTMLElement
	{
		return Tag.render`
			<div class="ui-entity-editor-section-edit dashboard-edit-description-section">
				<div class="ui-entity-editor-section-header">
					<div class="ui-entity-editor-header-title">
						<div class="ui-entity-editor-header-title-text dashboard-edit-section-title">
							<span class="ui-icon-set --o-info-circle dashboard-edit-section-title-icon"></span>
							<span>${Loc.getMessage('DASHBOARD_EDIT_DESCRIPTION_SECTION_TITLE') ?? ''}</span>
						</div>
					</div>
				</div>
				<div class="ui-entity-editor-section-content">
					<div class="dashboard-edit-description-alert">
						${Loc.getMessage('DASHBOARD_EDIT_DESCRIPTION_SECTION_HINT') ?? ''}
					</div>
					<div class="ui-entity-editor-content-block">
						${this.#descriptionField.render()}
					</div>
				</div>
			</div>
		`;
	}

	#getMainSection(): HTMLElement
	{
		return Tag.render`
			<div class="ui-entity-editor-section-edit dashboard-edit-main-section">
				<div class="ui-entity-editor-section-header">
					<div class="ui-entity-editor-header-title">
						<div class="ui-entity-editor-header-title-text dashboard-edit-section-title">
							<span class="ui-icon-set --o-file dashboard-edit-section-title-icon"></span>
							<span>${Loc.getMessage('DASHBOARD_EDIT_MAIN_SECTION_TITLE') ?? ''}</span>
						</div>
					</div>
				</div>
				<div class="ui-entity-editor-section-content">
					<div class="ui-entity-editor-content-block dashboard-edit-main-top-block">
						${this.#getTopBlock()}
					</div>
					<div class="ui-entity-editor-content-block">
						${this.#titleField.render()}
					</div>
					<div class="ui-entity-editor-content-block" data-role="dashboard-main-parameters"></div>
					<div class="ui-entity-editor-content-block">
						${this.#periodField.render()}
					</div>
					<div class="ui-entity-editor-content-block">
						${this.#coverField.render()}
					</div>
				</div>
			</div>
		`;
	}

	#getGallerySection(): HTMLElement
	{
		return Tag.render`
			<div class="ui-entity-editor-section-edit dashboard-edit-gallery-section">
				<div class="ui-entity-editor-section-header">
					<div class="ui-entity-editor-header-title">
						<div class="ui-entity-editor-header-title-text dashboard-edit-section-title">
							<span class="ui-icon-set --o-image dashboard-edit-section-title-icon"></span>
							<span>${Loc.getMessage('DASHBOARD_EDIT_GALLERY_SECTION_TITLE') ?? ''}</span>
						</div>
					</div>
				</div>
				<div class="ui-entity-editor-section-content">
					<div class="dashboard-edit-gallery-alert">
						${Loc.getMessage('DASHBOARD_EDIT_GALLERY_SECTION_HINT') ?? ''}
					</div>
					<div class="ui-entity-editor-content-block">
						${this.#galleryField.render()}
					</div>
				</div>
			</div>
		`;
	}

	#onParamSelectorInit(): void
	{
		this.#updateSaveButtonState();
	}

	#onSelectorChange(): void
	{
		this.#updateSaveButtonState();
	}

	#updateSaveButtonState(): void
	{
		if (!this.#saveButton)
		{
			return;
		}

		const selectorData = this.#paramsSelector?.getValues();
		const hasGroups = this.#groupsField.hasValue(selectorData);
		const isDisabled = !hasGroups && (!this.#props.isEditMode || !this.#props.isAllowedClearGroups);
		this.#saveButton.setDisabled(isDisabled);
	}

	// noinspection JSUnusedGlobalSymbols
	onClickSave(): void
	{
		if (!this.#saveButton)
		{
			return;
		}

		const selectorData = this.#paramsSelector?.getValues() ?? {
			groups: new Set(),
			scopes: new Set(),
			params: new Set(),
		};

		if (this.#galleryField.hasPendingUploads())
		{
			BX.UI.Notification.Center.notify({
				content: Text.encode(Loc.getMessage('DASHBOARD_EDIT_GALLERY_UPLOAD_IN_PROGRESS') ?? ''),
			});

			return;
		}

		const currentTitle = this.#titleField.getValue();
		const currentDescription = this.#descriptionField.getValue();
		const currentGroups = this.#groupsField.getValue(selectorData);
		const currentPeriod = this.#periodField.getValue();
		const currentGalleryIds = this.#galleryField.getValue();

		const saveData = {
			title: currentTitle,
			description: currentDescription,
			coverImage: {
				id: this.#coverField.getValue(),
				tempFileId: this.#coverField.getTempFileId(),
			},
			galleryImage: {
				ids: currentGalleryIds,
				tempFileIds: this.#galleryField.getTempFileIds(),
			},
			period: currentPeriod,
			groups: currentGroups,
			...this.#parametersField.getValue(selectorData),
		};

		this.#saveButton.setWaiting(true);

		Ajax.runComponentAction(
			this.#props.componentName,
			'save',
			{
				mode: 'class',
				signedParameters: this.#props.signedParameters,
				data: {
					data: saveData,
				},
			},
		)
			.then((response) => {
				const dashboard = response?.data?.dashboard;
				if (!dashboard)
				{
					BX.UI.Notification.Center.notify({
						content: Text.encode(Loc.getMessage('DASHBOARD_EDIT_SAVE_RESPONSE_ERROR') ?? ''),
					});
					this.#saveButton?.setWaiting(false);

					return;
				}

				if (!this.#props.isEditMode)
				{
					ApacheSupersetAnalytics.sendAnalytics('new', 'report_new', {
						type: 'custom',
						c_element: 'new_button',
					});
					window.open(dashboard.detailUrl, '_blank')?.focus();
				}
				else
				{
					this.#sendEditAnalytics(
						currentTitle,
						currentDescription,
						currentGroups,
						currentPeriod,
						currentGalleryIds,
					);
				}

				parent.BX.Event.EventEmitter.emit('BIConnector.CreateForm:onDashboardCreated', {
					dashboard,
				});
				parent.BX.Event.EventEmitter.emit('BIConnector.CreateForm:onDashboardSaved', {
					dashboard,
					isEditMode: this.#props.isEditMode,
				});
				BX.SidePanel.Instance.getTopSlider().close();
			})
			.catch((response) => {
				const message = Type.isStringFilled(response?.errors?.[0]?.message)
					? response.errors[0].message
					: (
						Type.isStringFilled(response?.message)
							? response.message
							: Loc.getMessage('DASHBOARD_EDIT_SAVE_RESPONSE_ERROR')
					)
				;

				BX.UI.Notification.Center.notify({
					content: Text.encode(message),
				});
				this.#saveButton?.setWaiting(false);
			})
		;
	}

	#sendEditAnalytics(
		currentTitle: string,
		currentDescription: string,
		currentGroups: number[],
		currentPeriod: Object,
		currentGalleryIds: number[],
	): void
	{
		const defaults = this.#props.defaultValues ?? {};
		const analyticsBase = {
			type: 'custom',
			c_element: 'edit_card_report',
		};

		if (currentTitle !== (defaults.title ?? ''))
		{
			ApacheSupersetAnalytics.sendAnalytics('edit', 'change_name', {
				...analyticsBase,
				status: 'success',
			});
		}

		const defaultGroups = (defaults.groups ?? []).map(Number).sort().join(',');
		const newGroups = currentGroups.map(Number).sort().join(',');
		if (newGroups !== defaultGroups)
		{
			ApacheSupersetAnalytics.sendAnalytics('edit', 'change_group', {
				...analyticsBase,
				status: 'success',
			});
		}

		const defaultPeriod = defaults.filterPeriod ?? 'default';
		const defaultDateStart = defaults.dateFilterStart ?? '';
		const defaultDateEnd = defaults.dateFilterEnd ?? '';
		if (
			(currentPeriod.filterPeriod ?? 'default') !== defaultPeriod
			|| (currentPeriod.dateFilterStart ?? '') !== defaultDateStart
			|| (currentPeriod.dateFilterEnd ?? '') !== defaultDateEnd
		)
		{
			ApacheSupersetAnalytics.sendAnalytics('edit', 'change_period', {
				...analyticsBase,
				status: 'success',
			});
		}

		if (currentDescription !== (defaults.description ?? ''))
		{
			ApacheSupersetAnalytics.sendAnalytics('edit', 'change_description', {
				...analyticsBase,
				status: 'success',
			});
		}

		const defaultGalleryIds = (defaults.galleryImageIds ?? []).map(Number).sort().join(',');
		const newGalleryIds = currentGalleryIds.map(Number).sort().join(',');
		if (newGalleryIds !== defaultGalleryIds)
		{
			ApacheSupersetAnalytics.sendAnalytics('edit', 'change_files', {
				...analyticsBase,
				status: 'success',
			});
		}
	}
}
