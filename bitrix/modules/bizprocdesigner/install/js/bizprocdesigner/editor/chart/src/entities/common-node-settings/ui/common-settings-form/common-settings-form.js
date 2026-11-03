import 'window';
import { BitrixVue, markRaw } from 'ui.vue3';
import { Dom, Tag, Type, Event, Loc, ajax, Text } from 'main.core';
import { MenuManager, type MenuItem } from 'main.popup';
import { EventEmitter, type BaseEvent } from 'main.core.events';
import { MessageBox } from 'ui.dialogs.messagebox';
import { Icon } from 'ui.icon-set.api.core';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { LiveAnnouncer } from 'ui.a11y';

import { FeatureCode } from 'bizprocdesigner.feature';

import { editorAPI } from '../../../../shared/api';
import {
	documentFieldsCache,
	handleResponseError,
	hasVisibleFieldLabel,
	isRequiredField,
	resolveBrokenLinkOwners,
	resolveBrokenLinksMessage,
	settingsControlsMemory,
} from '../../../../shared/utils';
import { usePropertyDialog, useFeature } from '../../../../shared/composables';
import { diagramStore } from '../../../../entities/blocks';
import { EVENT_NAMES } from '../../../../entities/node-settings/constants';
import { isReadableExpressionsAvailable } from '../../../../entities/node-settings/utils/readable-expressions';
import { DataViewsSection } from '../../../../features/node-settings/ui/data-views-section/data-views-section';
import {
	closeExpressionBuilder,
	mountExpressionBuilders,
} from '../../../../features/node-settings/utils/expression-builder-mount';
import { bindMultipleSelectBehavior } from '../../../../features/node-settings/utils/multiple-select-behavior';
import {
	getDeletedProjectIds,
	hasDeletedProjectTag,
	isDeletedProjectField,
	syncDeletedProjectCaption,
	syncDeletedProjectField,
	watchDeletedProjectField,
} from '../../../../features/node-settings/utils/project-field-state';
import { unmountFormVeneers } from '../../../../features/node-settings/utils/readable-expressions-veneer';
import { useCommonNodeSettingsStore } from '../../stores/common-node-settings';
import { ValueSelector } from './value-selector';

import { type Block, type SettingsControls } from '../../../../shared/types';
import {
	BLOCK_TYPES,
	NODE_SETTINGS_TABS,
	TITLE_FIELD_NAME,
	isDataViewsAllowedBlockType,
} from '../../../../shared/constants';

import './style.css';

const SCROLL_ZONE = 50;
const SCROLL_SPEED = 10;
const RULE_FORM_ID = 'form-settings-rule';
const SETTINGS_FIELDS_IDS = new Set([
	'row_title',
	'row_activity_editor_comment',
]);
const BROKEN_LINK_HIGHLIGHT_CLASS = '--broken-link-target';
// Same length as the `2.5s` of the `--broken-link-target` accent in `style.css`: the class is taken
// off exactly when its animation ends. Changing one side alone leaves the accent either cut short or
// stuck on the row, so both records name each other.
const BROKEN_LINK_HIGHLIGHT_DURATION = 2500;
// The class the panel folds a row with, both from the caption links of the title row and from the
// jump to a folded row.
const HIDDEN_ROW_CLASS = 'hidden';
/**
 * Rows the panel keeps on the screen even though the server marks their control hidden: the
 * stylesheet excludes the description of a node from the rule that hides `.hidden`
 * (`.hidden:not(#row_activity_editor_comment)` in `style.css`), so the row always has a box of its
 * own and a reference written in the description does have a place to lead to.
 *
 * Read off the id of the row and not off its box: at the moment a candidate is built the rows still
 * live in a detached fragment, where every row would measure as having no place on the screen.
 */
const ROWS_SHOWN_DESPITE_HIDDEN = new Set(['row_activity_editor_comment']);
// Keeps the row clear of the top edge of the scrolled area, so the caption of the field is read
// together with the control the user was led to.
const BROKEN_LINK_SCROLL_OFFSET = 20;
// A control that draws itself: the values shown to the user arrive in the Options of its property.
const CUSTOM_CONTROL_TYPE = 'custom';
// The only keys of `Options` that hold values written by the user: `currentFieldValues` of the
// `writeFields` control and `conditions` of the `filterFields` one
// ({@see \CBPWriteDataStorageActivity::getPropertiesDialog},
// {@see \CBPReadDataStorageActivity::getPropertiesDialog}). The rest of `Options` is the settings
// of the control - dictionaries, captions, maps of available fields - and an expression met there
// is not a use of the reference in this field.
const CUSTOM_CONTROL_VALUE_OPTIONS = ['currentFieldValues', 'conditions'];
// Which of the two forms an alert belongs to: it narrows the test id of the alert to that block.
const BROKEN_LINK_SCOPE_GENERAL = 'general';
const BROKEN_LINK_SCOPE_RULE = 'rule';

type BrokenLinkTarget = {
	row: HTMLElement,
	isGeneral: boolean,
	fieldTitle: string,
};

// A control of the settings panel, in the shape the server sends it in.
type NodeSettingsControl = {
	fieldName: string,
	controlId: string,
	value: mixed,
	property: {
		Name?: string,
		FieldName?: string,
		Type?: string,
		CustomType?: string,
		Hidden?: boolean,
		Options?: { [string]: mixed },
	},
};

// A row of the panel offered to the matching as a holder of a reference.
type BrokenLinkCandidate = {
	ownerId: HTMLElement,
	value: mixed,
	isGeneral: boolean,
	isNavigable: boolean,
	title: string,
};

// A line of the opened list: the reference itself and the row it leads to, if there is one.
type BrokenLinkItem = {
	link: string,
	target: ?BrokenLinkTarget,
};

// @vue/component
export const CommonNodeSettingsForm = {
	name: 'CommonNodeSettingsForm',
	components: {
		BIcon,
		DataViewsSection,
	},
	props:
	{
		block:
		{
			type: Object,
			required: true,
		},
		documentType:
		{
			type: Array,
			required: true,
		},
		panelAlreadyOpened:
		{
			type: Boolean,
			default: false,
		},
		isSetupTemplateActivity:
		{
			type: Boolean,
			required: true,
		},
		selectedTabId:
		{
			type: String,
			required: true,
		},
		defaultTitle:
		{
			type: String,
			default: '',
		},
	},
	emits: ['showPreview', 'close'],
	setup(): {
		iconSet: typeof Outline,
		store: diagramStore,
		settingsStore: useCommonNodeSettingsStore,
		isFeatureAvailable: (code: string) => boolean,
		}
	{
		const store: diagramStore = diagramStore();
		const { isFeatureAvailable } = useFeature();

		return {
			iconSet: Outline,
			store,
			settingsStore: useCommonNodeSettingsStore(),
			isFeatureAvailable,
		};
	},
	data(): {
		isLoading: boolean,
		isVisible: boolean,
		hasErrors: boolean,
		isSubmitting: boolean,
		hasSettings: boolean,
		currentBlock: Block,
		settingsForm: HTMLElement | null,
		settingsFormTitle: string,
		nodeControls: Array<any> | null,
		inputListeners: [],
		isDragging: boolean,
		dragMouseY: number,
		autoScrollFrameId: number,
		scrollBoundaries: { top: number, bottom: number } | null,
		rendererInstance: ?Object,
		lastRenderRequestId: number,
		settingsControlsRequest: ?XMLHttpRequest,
		dynamicComponents: Object,
		customFieldsData: Object,
		childVueApps: Array<any>,
		collectionRenderFinishedHandler: ?Function,
		pendingCollectionRenderResolve: ?Function,
		multipleSelectBehaviorDisposer: ?Function,
		projectFieldStateObservers: Array<MutationObserver>,
		highlightedRow: HTMLElement | null,
		brokenLinkHighlightTimeoutId: ?number,
		ruleBrokenLinksAlert: HTMLElement | null,
		}
	{
		return {
			isLoading: true,
			isVisible: this.panelAlreadyOpened,
			hasErrors: false,
			isSubmitting: false,
			hasSettings: false,
			currentBlock: this.block,
			useDocumentContext: false,
			settingsForm: null,
			settingsFormTitle: '',
			nodeControls: null,
			inputListeners: [],
			isDragging: false,
			dragMouseY: 0,
			autoScrollFrameId: null,
			scrollBoundaries: null,
			rendererInstance: null,
			lastRenderRequestId: 0,
			settingsControlsRequest: null,
			dynamicComponents: {},
			customFieldsData: {},
			childVueApps: [],
			collectionRenderFinishedHandler: null,
			pendingCollectionRenderResolve: null,
			multipleSelectBehaviorDisposer: null,
			projectFieldStateObservers: [],
			highlightedRow: null,
			brokenLinkHighlightTimeoutId: null,
			ruleBrokenLinksAlert: null,
		};
	},
	computed:
	{
		// Only an agent-driven show asks for the fade; a user click must stay instant. The flag has
		// to reach Transition as a strict boolean: `css` defaults to true, so an absent one would
		// animate what nobody asked to animate.
		shouldShowWithTransition(): boolean
		{
			return this.settingsStore.shouldShowWithTransition === true;
		},
		isRuleHidden(): boolean
		{
			return this.selectedTabId === 'basic';
		},
		isDataViewsSectionShown(): boolean
		{
			return isDataViewsAllowedBlockType(this.block?.type)
				&& this.isFeatureAvailable(FeatureCode.dataTables);
		},
	},
	watch: {
		block(newBlock): void
		{
			this.cleanupFormResources();

			this.hasSettings = false;
			this.isLoading = true;
			this.currentBlock = newBlock;

			this.$nextTick(async () => {
				if (this.$refs.scrollContainer)
				{
					this.$refs.scrollContainer.scrollTop = 0;
				}
				await this.renderControls();
				window.BPAShowSelector = this.showSelector;
				window.HideShow = this.hideShow;
				this.blurActiveElementIfNeeded();
			});
		},
		isRuleHidden(isHidden: boolean): void
		{
			this.$nextTick(() => {
				// The rules section has been rebuilt - the warning goes back into its new container.
				this.mountRuleBrokenLinksAlert();

				if (!this.$refs.ruleContainer)
				{
					return;
				}

				const ruleSection = this.$refs.ruleContainer.parentElement;
				if (Dom.hasClass(ruleSection, '--empty'))
				{
					Dom.removeClass(ruleSection, '--empty');
				}

				if (!isHidden && this.$refs.ruleContainer.offsetHeight === 0)
				{
					Dom.addClass(ruleSection, '--empty');
				}
			});
		},
	},
	async mounted()
	{
		this.isVisible = true;
		this.currentBlock = this.block;
		await this.$nextTick();
		await this.renderControls();
		this.mountMultipleSelectBehavior();
		Event.bind(this.$refs.scrollContainer, 'scroll', this.handleScroll);
		EventEmitter.subscribe('BX.Bizproc:setuptemplateactivity:preview', this.showPreview);
		EventEmitter.subscribe('Bizproc.SetupTemplate:Draggable:start', this.onDragStart);
		EventEmitter.subscribe('Bizproc.SetupTemplate:Draggable:move', this.onDragMove);
		EventEmitter.subscribe('Bizproc.SetupTemplate:Draggable:end', this.onDragEnd);
		EventEmitter.subscribe('Bizproc.NodeSettings:askShowValueSelector', this.onAskShowValueSelector);

		window.BPAShowSelector = this.showSelector;
		window.HideShow = this.hideShow;
		this.blurActiveElementIfNeeded();
	},
	unmounted(): void
	{
		this.stopAutoScroll();

		this.cleanupFormResources();

		this.unmountMultipleSelectBehavior();
		Event.unbind(this.$refs.scrollContainer, 'scroll', this.handleScroll);

		EventEmitter.unsubscribe('BX.Bizproc:setuptemplateactivity:preview', this.showPreview);
		EventEmitter.unsubscribe('Bizproc.SetupTemplate:Draggable:start', this.onDragStart);
		EventEmitter.unsubscribe('Bizproc.SetupTemplate:Draggable:move', this.onDragMove);
		EventEmitter.unsubscribe('Bizproc.SetupTemplate:Draggable:end', this.onDragEnd);
		EventEmitter.emit('BX.Bizproc.Activity.unmount');
		EventEmitter.unsubscribe('Bizproc.NodeSettings:askShowValueSelector', this.onAskShowValueSelector);

		this.destroyRendererInstance();
	},
	methods: {
		// The fade belongs to the show that asked for it, so the flag goes down as soon as it has
		// played: a repeated render of the same node raises and drops isLoading again, and that is
		// not a show anybody asked to animate.
		onContentShown(): void
		{
			this.settingsStore.finishShowTransition();
		},
		isRenderCancelled(requestId: number): boolean
		{
			return this.lastRenderRequestId !== requestId || !this.$refs.contentContainer;
		},
		cancelSettingsControlsRequest(): void
		{
			// The id is bumped before the abort, so the rejection that follows is
			// dropped by isRenderCancelled instead of being reported as a failure.
			this.lastRenderRequestId += 1;

			if (this.settingsControlsRequest)
			{
				this.settingsControlsRequest.abort();
				this.settingsControlsRequest = null;
			}
		},
		loc(phraseCode: string, replacements: { [p: string]: string } = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
		mountMultipleSelectBehavior(): void
		{
			if (this.multipleSelectBehaviorDisposer || !this.$el)
			{
				return;
			}

			this.multipleSelectBehaviorDisposer = bindMultipleSelectBehavior({
				roots: [this.$el],
			});
		},
		unmountMultipleSelectBehavior(): void
		{
			if (this.multipleSelectBehaviorDisposer)
			{
				this.multipleSelectBehaviorDisposer();
				this.multipleSelectBehaviorDisposer = null;
			}
		},
		showPreview(event: boolean): void
		{
			this.$emit('showPreview', event.data);
		},
		extractFormData(): { [key: string]: any }
		{
			const settingsFormData = ajax.prepareForm(this.settingsForm).data;
			const ruleFormData = this.ruleSettingsForm
				? ajax.prepareForm(this.ruleSettingsForm).data
				: {};
			const title = Type.isStringFilled(settingsFormData.title)
				? settingsFormData.title
				: (this.defaultTitle || this.currentBlock?.activity?.Properties?.Title || '');
			const formData = this.isSetupTemplateActivity
				? { ...settingsFormData, title }
				: {
					...ruleFormData,
					title,
					activity_editor_comment: settingsFormData.activity_editor_comment ?? '',
				};

			formData.documentType = this.documentType;
			formData.activityType = this.currentBlock.activity?.Type ?? '';
			formData.id = this.currentBlock.activity?.Name ?? '';
			formData.arWorkflowTemplate = JSON.stringify([this.currentBlock.activity]);

			return formData;
		},
		async submitForm(formData: { [key: string]: any }): Promise<boolean>
		{
			this.isSubmitting = true;

			try
			{
				this.validateForm(formData);
				if (this.hasErrors)
				{
					return false;
				}

				EventEmitter.emit('Bizproc.NodeSettings:nodeSettingsSaving', { formData });

				const preparedSettingsData = { ...formData };
				preparedSettingsData.arWorkflowConstants = JSON.stringify(this.store.template.CONSTANTS ?? {});

				const compatibleTemplate = [{ Type: 'NodeWorkflowActivity', Children: [], Name: 'Template' }];
				compatibleTemplate[0].Children.push(
					this.currentBlock.activity,
					...this.store.getAllBlockAncestors(this.currentBlock).map(({ block }) => block.activity),
				);

				preparedSettingsData.arWorkflowTemplate = JSON.stringify(compatibleTemplate);

				preparedSettingsData.activated = this.currentBlock.activity.Activated;
				const settingControls = await editorAPI.saveNodeSettings(preparedSettingsData);
				if (settingControls)
				{
					this.store.updateBlockActivityField(this.currentBlock.id, settingControls);

					if (formData.activity_id !== this.currentBlock.id)
					{
						this.store.updateBlockId(this.currentBlock.id, preparedSettingsData.activity_id);
					}

					// The form closes right below, so a refusal that stayed inside the store would leave
					// the person with a closed dialog and nothing saved.
					await this.store.saveDraftWithStatus();
					this.handleFormCancel();

					return true;
				}

				return false;
			}
			catch (error)
			{
				if (error.errors && error.errors[0] && error.errors[0].message)
				{
					MessageBox.alert(error.errors[0].message);
				}

				return false;
			}
			finally
			{
				this.isSubmitting = false;
			}
		},
		handleFormSave(): void
		{
			if (this.isSubmitting || !this.settingsForm || this.store.isWriteLocked)
			{
				return;
			}

			const formData = this.extractFormData();
			this.submitForm(formData);
		},
		handleFormCancel(): void
		{
			closeExpressionBuilder();
			unmountFormVeneers(this.$refs.contentContainer);
			unmountFormVeneers(this.$refs.ruleContainer);
			this.$emit('close');
			this.isVisible = false;
			this.$refs.contentContainer.innerHTML = '';
		},
		handleDocumentSelector(event): void
		{
			const documents: MenuItem[] = [
				{
					id: '@',
					text: Loc.getMessage('BIZPROCDESIGNER_EDITOR_TEMPLATE_DOCUMENT'),
				},
				...this.getDocuments(),
			];

			const selectedDocument = this.currentBlock.activity?.Document ?? '@';
			const menuItems = documents.map((item: MenuItem) => {
				const text = item.id === selectedDocument ? `* ${item.text}` : item.text;
				const onclick = this.handleSelectDocument.bind(this);

				return { ...item, text, onclick };
			});

			MenuManager.show(
				'node-settings-document-selector',
				event.target,
				menuItems,
				{
					autoHide: true,
					cacheable: false,
				},
			);
		},
		handleSelectDocument(event, item: MenuItem): void
		{
			item.menuWindow.close();
			const selected = item.getId();
			if (selected === '@')
			{
				this.currentBlock.activity.Document = null;

				return;
			}

			this.currentBlock.activity.Document = selected;
		},
		hideShow(id: string = 'row_activity_id'): void
		{
			const formRow = BX(id);
			if (formRow)
			{
				Dom.toggleClass(formRow, 'hidden');
			}
		},
		showSelector(id: string, type: string): void
		{
			const selector = new ValueSelector(this.store, this.currentBlock);
			const targetElement = document.getElementById(id);
			selector
				.show(targetElement)
				.then((value) => {
					const beforePart = targetElement.selectionStart
						? targetElement.value.slice(0, targetElement.selectionStart)
						: targetElement.value
					;
					let middlePart = value;
					const afterPart = targetElement.selectionEnd
						? targetElement.value.slice(targetElement.selectionEnd)
						: ''
					;

					if (type === 'user')
					{
						if (beforePart.trim().length > 0 && beforePart.trim().slice(-1) !== ';')
						{
							middlePart = `; ${middlePart}`;
						}
						middlePart += '; ';
					}

					targetElement.value = beforePart + middlePart + afterPart;
					targetElement.selectionEnd = beforePart.length + middlePart.length;
					targetElement.focus();
					targetElement.dispatchEvent(new window.Event('change'));
				})
				.catch((error) => console.error(error));
		},
		shouldShowRequiredMark(field: Object): boolean
		{
			return (
				isRequiredField(field)
				&& field.fieldName !== TITLE_FIELD_NAME
				&& this.shouldShowFieldCaption(field)
			);
		},
		shouldShowFieldCaption(field: Object): boolean
		{
			return hasVisibleFieldLabel(field);
		},
		isDeletedProjectField(field: Object): boolean
		{
			return isDeletedProjectField(field);
		},
		getDeletedProjectIds(field: Object): Array<string>
		{
			return getDeletedProjectIds(field);
		},
		hasDeletedProjectTag(control: HTMLElement, field: Object): boolean
		{
			return hasDeletedProjectTag(control, field);
		},
		syncDeletedProjectCaption(row: ?HTMLElement, field: Object, isDeletedProjectSelected: boolean): void
		{
			syncDeletedProjectCaption(
				row,
				field,
				isDeletedProjectSelected,
				(projectField) => this.shouldShowRequiredMark(projectField),
			);
		},
		syncDeletedProjectField(control: HTMLElement, field: Object, row: ?HTMLElement = null): void
		{
			if (!control)
			{
				return;
			}

			syncDeletedProjectField(
				control,
				field,
				row,
				this.loc('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_PROJECT_DELETED_VALUE'),
				(projectField) => this.shouldShowRequiredMark(projectField),
			);
		},
		watchDeletedProjectField(control: HTMLElement, field: Object, row: HTMLElement): void
		{
			if (!control)
			{
				return;
			}

			const observer = watchDeletedProjectField(
				control,
				field,
				row,
				() => this.syncDeletedProjectField(control, field, row),
			);
			if (observer)
			{
				this.projectFieldStateObservers.push(observer);
			}
		},
		renderProjectDeletedWarning(): HTMLElement
		{
			const message = this.loc('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_PROJECT_DELETED_HINT');
			const icon = new Icon({
				icon: Outline.ALERT_ACCENT,
				size: 16,
				color: 'var(--ui-color-accent-main-warning)',
			}).render();

			return Tag.render`
				<span
					class="node-settings-project-warning"
					title="${message}"
					aria-label="${message}"
					role="img"
					data-test-id="bizproc-node-settings-project-deleted-warning"
				>${icon}</span>
			`;
		},
		renderFieldCaption(field: Object): ?HTMLElement
		{
			if (!this.shouldShowFieldCaption(field))
			{
				return null;
			}

			const isDeletedProject = this.isDeletedProjectField(field);
			const requiredMark = isDeletedProject && this.shouldShowRequiredMark(field)
				? Tag.render`<span class="node-settings-edit-caption-required">*</span>`
				: null
			;
			const projectDeletedWarning = isDeletedProject ? this.renderProjectDeletedWarning() : null;
			const captionClassName = `node-settings-edit-caption${
				this.shouldShowRequiredMark(field) && !isDeletedProject ? ' --required' : ''
			}${isDeletedProject ? ' --project-deleted' : ''}`;

			return Tag.render`
				<div class="${captionClassName}">
					<span>${Text.encode(field.property.Name)}</span>
					${requiredMark}
					${projectDeletedWarning}
				</div>
			`;
		},
		renderField(fieldProps: ?HTMLElement, field: Object): HTMLElement | null
		{
			const control = Type.isDomNode(fieldProps) ? fieldProps : null;
			if (!control)
			{
				return null;
			}

			const error = Tag.render`
				<div class="node-settings-alert-text">
					${this.loc(
				'BIZPROCDESIGNER_EDITOR_REQUIRED_FIELD_ERROR',
				{ '#FIELD#': field.property.Name },
			)}
				</div>
			`;
			Dom.append(error, control.parentNode);

			let className = 'node-settings-edit-box';
			if (field.property.Hidden)
			{
				className += ` ${HIDDEN_ROW_CLASS}`;
			}

			const row = Tag.render`
				<div class="${className}" id="row_${field.fieldName}">
					${this.renderFieldCaption(field)}
				    <div class="field-row">
				        ${control}
				        ${field.fieldName === TITLE_FIELD_NAME ? `
				        	<a href="#" onclick="HideShow('row_activity_id'); return false;">
				        		${this.loc('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ID')}
				        	</a>
				        			<a href="#" onclick="HideShow('row_activity_editor_comment'); return false;">
				        		${this.loc('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_COMMENT')}
				        	</a>
				        ` : null}
				    </div>
				</div>
			`;

			this.syncDeletedProjectField(control, field, row);
			this.watchDeletedProjectField(control, field, row);

			return row;
		},
		async getNodeSettingsControls(requestId: number): Promise<{...}>
		{
			window.BPAShowSelector = this.showSelector;
			window.HideShow = this.hideShow;

			const compatibleTemplate = [{ Type: 'NodeWorkflowActivity', Children: [], Name: 'Template' }];
			compatibleTemplate[0].Children.push(
				this.currentBlock?.activity,
				...this.store.getAllBlockAncestors(this.currentBlock).map(({ block }) => block.activity),
			);
			const workflowParameters = this.store.template.PARAMETERS;
			const workflowVariables = this.store.template.VARIABLES;
			const workflowConstants = this.store.template.CONSTANTS;

			if (window.CreateActivity)
			{
				window.arAllId = {};
				window.arWorkflowTemplate = compatibleTemplate;
				window.rootActivity = window.CreateActivity(compatibleTemplate[0]);
				window.arWorkflowParameters = workflowParameters;
				window.arWorkflowVariables = workflowVariables;
				window.arWorkflowConstants = workflowConstants;
			}

			// A trigger is upgraded server-side against its own node, so its response is not a function
			// of the action type and keeps out of the memory under a null key. The memory answers at all
			// only while the legacy dialog behind an empty response is available, so a hit can never
			// leave the user without a form.
			const memorableType = this.currentBlock?.type === BLOCK_TYPES.TRIGGER
				? null
				: this.currentBlock?.activity?.Type
			;
			const isFallbackAvailable = Type.isFunction(window.CreateActivity);

			if (isFallbackAvailable)
			{
				const remembered = settingsControlsMemory.get(memorableType, this.documentType);
				if (remembered)
				{
					return remembered;
				}
			}

			let request = null;

			try
			{
				const settingsControls = await editorAPI.getNodeSettingsControls(
					{
						documentType: this.documentType,
						activity: this.currentBlock?.activity,
						options: {
							templateId: this.store.templateId,
							draftId: this.store.draftId,
						},
						workflow: {
							workflowParameters: JSON.stringify(workflowParameters),
							workflowVariables: JSON.stringify(workflowVariables),
							workflowTemplate: JSON.stringify(compatibleTemplate),
							workflowConstants: JSON.stringify(workflowConstants),
						},
					},
					{
						onRequestStart: (xhr) => {
							request = markRaw(xhr);
							this.settingsControlsRequest = request;
						},
					},
				);
				settingsControlsMemory.remember(memorableType, this.documentType, settingsControls);

				if (this.isRenderCancelled(requestId))
				{
					return null;
				}

				return settingsControls;
			}
			catch (error)
			{
				if (this.isRenderCancelled(requestId))
				{
					return null;
				}

				handleResponseError(error);

				return null;
			}
			finally
			{
				if (this.settingsControlsRequest === request)
				{
					this.settingsControlsRequest = null;
				}
			}
		},
		createFormData(): FormData
		{
			const id = this.currentBlock.activity.Name ?? '';
			const activity = this.currentBlock.activity.Type ?? '';
			const compatibleTemplate = [{ Type: 'NodeWorkflowActivity', Children: [], Name: 'Template' }];
			compatibleTemplate[0].Children.push(
				this.currentBlock?.activity,
				...this.store.getAllBlockAncestors(this.currentBlock).map(({ block }) => block.activity),
			);
			const { createFormData } = usePropertyDialog();

			return createFormData({
				id,
				documentType: this.documentType,
				activity,
				workflow: {
					parameters: this.store.template.PARAMETERS,
					variables: this.store.template.VARIABLES,
					template: compatibleTemplate,
					constants: this.store.template.CONSTANTS,
				},
			});
		},
		clearDefaultTitleInput(form: ?HTMLElement): void
		{
			if (!form || !Type.isStringFilled(this.defaultTitle))
			{
				return;
			}
			const titleInput = form.querySelector('[name="title"]');
			if (titleInput && titleInput.value === this.defaultTitle)
			{
				titleInput.value = '';
			}
		},
		applyFieldPlaceholders(form: ?HTMLElement): void
		{
			if (!form)
			{
				return;
			}

			const titleInput = form.querySelector('[name="title"]');
			if (titleInput)
			{
				titleInput.placeholder = this.loc('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_NODE_NAME_PLACEHOLDER_MSGVER_1');
			}

			const commentInput = form.querySelector('[name="activity_editor_comment"]');
			if (commentInput)
			{
				commentInput.placeholder = this.loc('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_NODE_DESCRIPTION_PLACEHOLDER_MSGVER_1');
			}
		},
		async renderControls(): Promise<void>
		{
			// Warms the cache the readable layer resolves document fields from: the request is
			// memoized, so it costs nothing on repeated renders and nothing when the flag is off.
			if (isReadableExpressionsAvailable() && Type.isArrayFilled(this.documentType))
			{
				documentFieldsCache.fetchFields(this.documentType);
			}

			// The markup the open builder is bound to goes away right below.
			closeExpressionBuilder();
			unmountFormVeneers(this.$refs.contentContainer);
			unmountFormVeneers(this.$refs.ruleContainer);

			this.cancelSettingsControlsRequest();
			const requestId = this.lastRenderRequestId;
			this.isLoading = true;
			if (this.$refs.contentContainer)
			{
				this.$refs.contentContainer.innerHTML = '';
			}

			if (this.$refs.ruleContainer)
			{
				this.$refs.ruleContainer.innerHTML = '';
			}

			this.hasErrors = false;
			this.nodeControls = [];

			const settingControls = await this.getNodeSettingsControls(requestId);
			if (this.isRenderCancelled(requestId))
			{
				// A render superseded by a newer one leaves the loading state to it. A render
				// cancelled by the container going away has nobody to hand it over to, so the
				// skeleton has to come down here instead of standing forever.
				if (this.lastRenderRequestId === requestId)
				{
					this.isLoading = false;
				}

				return;
			}

			this.useDocumentContext = Boolean(settingControls?.useDocumentContext);
			if (settingControls && Type.isArray(settingControls.controls))
			{
				this.settingsForm = Tag.render`<form id="form-settings" class="node-settings-form__general-form"></form>`;
				Dom.append(this.settingsForm, this.$refs.contentContainer);
				this.ruleSettingsForm = Tag.render`<form></form>`;
				Dom.append(this.ruleSettingsForm, this.$refs.ruleContainer);
				await this.renderNodeControls(settingControls, requestId);
			}
			else
			{
				this.settingsForm = await this.renderPropertyDialog(requestId);
				if (this.settingsForm)
				{
					Dom.append(this.settingsForm, this.$refs.contentContainer);
					mountExpressionBuilders(this.settingsForm, { block: this.currentBlock });
					mountExpressionBuilders(this.ruleSettingsForm, { block: this.currentBlock });
				}

				this.isLoading = false;
				this.hasSettings = Boolean(this.settingsForm);
			}

			if (!this.hasSettings || this.isSetupTemplateActivity)
			{
				return;
			}

			this.settingsFormData = ajax.prepareForm(this.settingsForm).data;
			this.settingsFormTitle = this.settingsFormData.title ?? '';
			this.ruleSettingsForm.id = RULE_FORM_ID;
			Dom.addClass(this.ruleSettingsForm, RULE_FORM_ID);
		},
		// eslint-disable-next-line max-lines-per-function
		renderNodeControls(settingControls: SettingsControls, requestId: number): Promise<void>
		{
			this.nodeControls = Type.isArray(settingControls.controls) ? settingControls.controls : [];
			const brokenLinks = Type.isPlainObject(settingControls.brokenLinks)
				? settingControls.brokenLinks
				: {}
			;
			this.resetDynamicComponents();
			const eventName = 'BX.Bizproc.FieldType.onCollectionRenderControlFinished';

			this.nodeControls = this.nodeControls.map((property) => {
				const fieldName = property.property.FieldName || null;

				return ({
					...property,
					fieldName,
					controlId: fieldName,
				});
			});

			const renderedControls = BX.Bizproc.FieldType.renderControlCollection(
				this.documentType,
				this.nodeControls.filter((field) => field.property.Type !== CUSTOM_CONTROL_TYPE),
				'designer',
			);

			// eslint-disable-next-line max-lines-per-function
			return new Promise((resolve) => {
				if (this.isRenderCancelled(requestId))
				{
					resolve();

					return;
				}

				const activityTypeName = this.currentBlock.activity?.Type ?? '';
				const rendererName = `${activityTypeName}Renderer`;
				const RendererClass = Type.isFunction(window[rendererName]) ? window[rendererName] : null;

				let customRenderers = null;
				let instance = null;
				if (RendererClass)
				{
					instance = RendererClass ? markRaw(new RendererClass()) : null;
					this.rendererInstance = instance;
					customRenderers = (instance && Type.isFunction(instance.getControlRenderers))
						? instance.getControlRenderers()
						: null;
				}

				const settingsFragment = new DocumentFragment();
				const rulesFragment = new DocumentFragment();
				const brokenLinkCandidates = [];
				this.nodeControls.forEach((field) => {
					let control = renderedControls[field.controlId];

					if (field.property.Type === CUSTOM_CONTROL_TYPE && instance && customRenderers)
					{
						const rendererOrComponent = customRenderers?.[field?.property?.CustomType];

						if (rendererOrComponent)
						{
							const isVueComponent = (
								Type.isPlainObject(rendererOrComponent)
								&& (
									Type.isFunction(rendererOrComponent.render)
									|| Type.isFunction(rendererOrComponent.setup)
									|| Type.isStringFilled(rendererOrComponent.template)
								)
							);
							if (isVueComponent)
							{
								const componentKey = `${field.property.CustomType}_${field.controlId}`;
								const wrapper = Dom.create('div', {
									attrs: {
										class: 'vue-field-wrapper',
										'data-component-key': componentKey,
									},
								});
								this.dynamicComponents[componentKey] = { rendererOrComponent, wrapper };
								this.customFieldsData[componentKey] = field;

								control = wrapper;
							}
							else if (Type.isObject(rendererOrComponent) || Type.isFunction(rendererOrComponent))
							{
								control = rendererOrComponent(field);
							}
						}
					}

					if (control)
					{
						const row = this.renderField(control, field);
						const escapedFieldName = field.fieldName.replaceAll(/[!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~]/g, '\\$&');
						const input = row.querySelector(`[name^="${escapedFieldName}"]`);
						if (input)
						{
							Event.bind(input, 'input', this.handleFieldInput);
							this.inputListeners.push(input);
						}

						const isGeneralRow = SETTINGS_FIELDS_IDS.has(row.id);
						Dom.append(row, isGeneralRow ? settingsFragment : rulesFragment);
						brokenLinkCandidates.push(this.buildBrokenLinkCandidate(field, row, isGeneralRow));
					}
				});

				// Before the rows: the warning of a form stands above the fields it speaks about.
				this.renderBrokenLinksAlerts(brokenLinks, brokenLinkCandidates);
				Dom.append(settingsFragment, this.settingsForm);
				Dom.append(rulesFragment, this.ruleSettingsForm);
				if (this.isRenderCancelled(requestId))
				{
					resolve();

					return;
				}

				this.mountDynamicComponents();

				this.cancelPendingCollectionRender();
				this.pendingCollectionRenderResolve = resolve;
				this.collectionRenderFinishedHandler = async () => {
					this.unsubscribeCollectionRenderFinished();
					// A custom renderer may hand its own fields to the engine, which fills them asynchronously.
					await instance?.whenControlsRendered?.();

					if (this.isRenderCancelled(requestId))
					{
						resolve();

						return;
					}

					try
					{
						if (instance && Type.isFunction(instance.afterFormRender))
						{
							const activityFields = this.nodeControls.reduce((acc, field) => {
								if (field.controlId === 'title' || field.controlId === 'activity_editor_comment')
								{
									return acc;
								}

								acc[field.fieldName] = field;

								return acc;
							}, {});
							await instance.afterFormRender(this.ruleSettingsForm, activityFields);
						}
						EventEmitter.emit('BX.Bizproc.CommonNodeSettings:onBlocksReady', {
							blocks: this.store.blocks,
						});

						this.applyFieldPlaceholders(this.settingsForm);
						this.clearDefaultTitleInput(this.settingsForm);
						this.hasSettings = true;

						mountExpressionBuilders(this.settingsForm, { block: this.currentBlock });
						mountExpressionBuilders(this.ruleSettingsForm, { block: this.currentBlock });
					}
					catch (error)
					{
						console.error('afterFormRender failed:', error);
					}
					finally
					{
						this.isLoading = false;
						this.pendingCollectionRenderResolve = null;
						resolve();
					}
				};
				Event.EventEmitter.subscribe(eventName, this.collectionRenderFinishedHandler);
			});
		},
		/**
		 * An addressing candidate for a single control row.
		 *
		 * The value is not taken from `value` alone. A control with its own renderer (`custom`) keeps
		 * the values shown to the user in the `Options` of its property: storage fields arrive in
		 * `Options.currentFieldValues`, filter conditions in `Options.conditions`, while the `value`
		 * of such a control is empty. The server sees those values through a separate property of the
		 * activity, which either has no control at all or has a hidden service one - there is nowhere
		 * to lead the user. Without reading `Options`, a reference from a storage field would address
		 * only the hidden row and would stay in the list as plain text. Only those two keys are read:
		 * the rest of `Options` belongs to the renderer, and a reference met there is written in no
		 * field of the user.
		 *
		 * The row itself stands for the owner: an id of a row repeats across the controls the server
		 * left without a `FieldName`, and a repeated id would hand the reference to a foreign row.
		 */
		buildBrokenLinkCandidate(
			field: NodeSettingsControl,
			row: HTMLElement,
			isGeneral: boolean,
		): BrokenLinkCandidate
		{
			const options = field.property.Options;
			const value = field.property.Type === CUSTOM_CONTROL_TYPE && Type.isPlainObject(options)
				? [field.value, ...CUSTOM_CONTROL_VALUE_OPTIONS.map((key) => options[key])]
				: field.value
			;

			return {
				ownerId: row,
				value,
				isGeneral,
				// A row of a hidden control has no place on the screen to lead to, while the
				// reference written in it still belongs to this block. The panel shows some of the
				// rows the server hides, and those are led to as any other.
				isNavigable: !field.property.Hidden || ROWS_SHOWN_DESPITE_HIDDEN.has(row.id),
				title: field.property.Name ?? '',
			};
		},
		/**
		 * Puts the warning into the form the broken reference is written in: a reference no row of the
		 * node claims goes to the general block, as the only place able to speak for the node as a
		 * whole. The owner is read off the value the server sent with the control and not off the DOM -
		 * a control renders on its own schedule and may not be there to read yet.
		 */
		renderBrokenLinksAlerts(
			brokenLinks: { [key: string]: string },
			candidates: Array<BrokenLinkCandidate>,
		): void
		{
			const links = Object.values(brokenLinks);
			if (links.length === 0)
			{
				return;
			}

			const { owners } = resolveBrokenLinkOwners(
				links,
				candidates.map(({ ownerId, value }) => ({ ownerId, value })),
			);
			const candidateById = new Map(candidates.map((candidate) => [candidate.ownerId, candidate]));

			const generalItems = [];
			const ruleItems = [];
			links.forEach((link) => {
				// The utility answers with the very ids it was given, so every owner of a link is
				// found in the map built from the same candidates.
				const linkOwners = (owners.get(link) ?? []).map((ownerId) => candidateById.get(ownerId));

				if (linkOwners.length === 0)
				{
					generalItems.push({ link, target: null });

					return;
				}

				const generalOwners = linkOwners.filter((owner) => owner.isGeneral);
				if (generalOwners.length > 0)
				{
					generalItems.push({ link, target: this.buildBrokenLinkTarget(generalOwners, link) });
				}

				const ruleOwners = linkOwners.filter((owner) => !owner.isGeneral);
				if (ruleOwners.length > 0)
				{
					ruleItems.push({ link, target: this.buildBrokenLinkTarget(ruleOwners, link) });
				}
			});

			if (generalItems.length > 0 && this.settingsForm)
			{
				Dom.append(this.renderBrokenLinksAlert(generalItems, BROKEN_LINK_SCOPE_GENERAL), this.settingsForm);
			}

			// The rule warning lives in the rules section of the main tab, not in the action form: a node
			// is opened on the main tab, and a warning on the second one does not reach it.
			this.ruleBrokenLinksAlert = ruleItems.length > 0
				? this.renderBrokenLinksAlert(ruleItems, BROKEN_LINK_SCOPE_RULE)
				: null
			;
			this.mountRuleBrokenLinksAlert();
		},
		/**
		 * The rules section is declared through `v-if`, so Vue destroys it when leaving for the rules
		 * tab and builds it again on return. The warning node survives that on its own - it is not
		 * managed by Vue - and it is enough to append it to the new container with its live handlers.
		 */
		mountRuleBrokenLinksAlert(): void
		{
			const container = this.$refs.rulesAlertContainer;
			if (!this.ruleBrokenLinksAlert || !container)
			{
				return;
			}

			Dom.append(this.ruleBrokenLinksAlert, container);
		},
		// The rule warning node lies outside the forms, so clearing their containers does not take it
		// away: without this the warning of the previous node would stay in the section of the next
		// one. The only reset point is cleanupFormResources(): rebuilding the settings always runs it.
		dropRuleBrokenLinksAlert(): void
		{
			Dom.remove(this.ruleBrokenLinksAlert);
			this.ruleBrokenLinksAlert = null;
		},
		buildBrokenLinkTarget(owners: Array<BrokenLinkCandidate>, link: string): ?BrokenLinkTarget
		{
			const owner = owners.find(({ isNavigable }) => isNavigable);
			if (!owner)
			{
				return null;
			}

			return {
				// The owner of a reference is the row itself: the utility is given the row as the id.
				row: owner.ownerId,
				isGeneral: owner.isGeneral,
				// A field with no caption of its own is named by the reference itself: the announcement
				// has to name the place it leads to.
				fieldTitle: Type.isStringFilled(owner.title) ? owner.title : link,
			};
		},
		renderBrokenLinksAlert(items: Array<BrokenLinkItem>, scope: string): HTMLElement
		{
			const alert = Tag.render`
				<div
					class="ui-alert ui-alert-warning ui-alert-icon-info"
					data-testid="${this.$testId('bizprocdesigner-broken-links-alert', scope)}"
				>
					<div class="ui-alert-message">
						<div>
							<span>
								${Text.encode(this.getBrokenLinksMessage())}
							</span> <button
								type="button"
								ref="showMoreBtn"
								class="bizprocdesigner-activity-broken-link-show-more"
								data-testid="${this.$testId('bizprocdesigner-broken-links-alert-show-more', scope)}"
							>
								${Text.encode(Loc.getMessage('BIZPROCDESIGNER_EDITOR_MESSAGE_SHOW_LINKS') ?? '')}
							</button>
						</div>
						<div
							ref="detailBlock"
							class="bizprocdesigner-activity-broken-link-detail"
							data-testid="${this.$testId('bizprocdesigner-broken-links-alert-detail', scope)}"
						>
						</div>
					</div>
					<span ref="closeBtn" class="ui-alert-close-btn"></span>
				</div>
			`;

			items.forEach((item) => Dom.append(this.renderBrokenLinkItem(item), alert.detailBlock));

			// The collapsed block holds its height at zero, so its references are on the screen for
			// nobody: until it is opened they have to stay out of the keyboard path as well.
			Dom.attr(alert.detailBlock, 'inert', true);

			Event.bind(alert.showMoreBtn, 'click', (event: MouseEvent) => {
				Dom.attr(alert.detailBlock, 'inert', null);
				Dom.style(alert.detailBlock, 'height', `${alert.detailBlock.scrollHeight}px`);
				// A click of the mouse carries its count, a press of the keyboard carries none. Only the
				// keyboard is led into the list the button has opened: the mouse leaves the page as it was,
				// without a focus ring nobody asked for.
				if (event.detail === 0)
				{
					this.focusOpenedBrokenLinkList(alert.detailBlock);
				}

				Dom.remove(alert.showMoreBtn);
			});

			Event.bind(alert.closeBtn, 'click', () => {
				Dom.remove(alert.root);
				// A dismissed warning must not come back with the rebuilt rules section.
				if (this.ruleBrokenLinksAlert === alert.root)
				{
					this.ruleBrokenLinksAlert = null;
				}
			});

			return alert.root;
		},
		/**
		 * The button that opens the list leaves the DOM right away, and the focus standing on it would
		 * fall out of the warning. It is moved into the list the button has just opened: to the first
		 * reference, or to the list itself when the list has nowhere to lead.
		 */
		focusOpenedBrokenLinkList(detailBlock: HTMLElement): void
		{
			// Only an addressed reference is a button: an item with no row to lead to is plain text.
			const firstReference = detailBlock.querySelector('button');
			if (firstReference)
			{
				firstReference.focus({ preventScroll: true });

				return;
			}

			Dom.attr(detailBlock, 'tabindex', '-1');
			detailBlock.focus({ preventScroll: true });
			this.releaseSettingsRowFocus(detailBlock);
		},
		getBrokenLinksMessage(): string
		{
			return resolveBrokenLinksMessage();
		},
		/**
		 * A reference of the list is a button while the row holding it can be reached, and plain text
		 * otherwise - a row of a hidden control is named but never led to.
		 */
		renderBrokenLinkItem(item: BrokenLinkItem): HTMLElement
		{
			if (!item.target)
			{
				return Tag.render`
					<div
						class="bizprocdesigner-activity-broken-link-item"
						data-testid="${this.$testId('bizprocdesigner-broken-links-alert-text')}"
					>${Text.encode(item.link)}</div>
				`;
			}

			const goToFieldLabel = this.loc('BIZPROCDESIGNER_EDITOR_BROKEN_LINK_GO_TO_FIELD');
			const button = Tag.render`
				<button
					type="button"
					class="bizprocdesigner-activity-broken-link-item --clickable"
					title="${Text.encode(goToFieldLabel)}"
					aria-label="${Text.encode(`${goToFieldLabel}: ${item.link}`)}"
					data-testid="${this.$testId('bizprocdesigner-broken-links-alert-link')}"
				>${Text.encode(item.link)}</button>
			`;

			Event.bind(button, 'click', () => {
				this.goToBrokenLinkField(item.target);
			});

			return button;
		},
		/**
		 * Leads the user to the row the reference is written in: the block holding the row is opened
		 * first - a row of the rule form stands behind the preview of the rules - and only then, once
		 * the row has been rendered, the panel scrolls to it. A row still hidden has no height, and a
		 * scroll made before the render lands nowhere.
		 */
		async goToBrokenLinkField(target: BrokenLinkTarget): Promise<void>
		{
			const tabId = target.isGeneral ? NODE_SETTINGS_TABS.basic : NODE_SETTINGS_TABS.rules;
			if (this.settingsStore.selectedTabId !== tabId)
			{
				this.settingsStore.selectedTabId = tabId;
				await this.$nextTick();
			}

			const row = target.row;
			// A render that happened while the alert stood leaves its rows detached from the panel:
			// a row outside the document is nowhere to lead to, and there is nothing to say about it
			// either - the list it was pressed in belongs to a panel that is gone.
			if (!row.isConnected)
			{
				return;
			}

			// A row folded by the panel itself is unfolded before the jump: the reference is written in
			// it, and the fold is ours to undo. Rows folded by a renderer of their own stay as they are.
			if (!this.isSettingsRowReachable(row) && Dom.hasClass(row, HIDDEN_ROW_CLASS))
			{
				Dom.removeClass(row, HIDDEN_ROW_CLASS);
			}

			// Whatever keeps the row off the screen now, the press must not stay silent: it looks and
			// behaves as a button, so a jump that cannot happen is announced instead of being dropped.
			if (!this.isSettingsRowReachable(row))
			{
				LiveAnnouncer.announce(
					this.loc('BIZPROCDESIGNER_EDITOR_BROKEN_LINK_FIELD_HIDDEN_ANNOUNCE', {
						'#FIELD#': target.fieldTitle,
					}),
				);

				return;
			}

			LiveAnnouncer.announce(
				this.loc('BIZPROCDESIGNER_EDITOR_BROKEN_LINK_GO_TO_FIELD_ANNOUNCE', { '#FIELD#': target.fieldTitle }),
			);

			this.focusSettingsRow(row);
			this.scrollToSettingsRow(row);
			this.highlightSettingsRow(row);
		},
		// A folded row holds its height at zero and takes no box of its own: a scroll to it would land
		// nowhere.
		isSettingsRowReachable(row: HTMLElement): boolean
		{
			return row.getClientRects().length > 0;
		},
		/**
		 * The focus goes to the row itself and not to the control inside it: the value of the field and
		 * the state of the form stay untouched, while the focus stops dying together with the button -
		 * a reference of a rule is pressed in the section the tab switch destroys.
		 */
		focusSettingsRow(row: HTMLElement): void
		{
			Dom.attr(row, 'tabindex', '-1');
			row.focus({ preventScroll: true });
		},
		scrollToSettingsRow(row: HTMLElement): void
		{
			const container = this.$refs.scrollContainer;
			if (!container)
			{
				return;
			}

			// The panel scrolls itself: the row lives in a scrolled area of its own, and scrollIntoView
			// would move the page behind it as well.
			const top = row.getBoundingClientRect().top
				- container.getBoundingClientRect().top
				+ container.scrollTop
				- BROKEN_LINK_SCROLL_OFFSET
			;

			container.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
		},
		// A visual accent only: neither the value of the field nor the focus is touched.
		highlightSettingsRow(row: HTMLElement): void
		{
			this.clearSettingsRowHighlight();

			Dom.addClass(row, BROKEN_LINK_HIGHLIGHT_CLASS);
			this.highlightedRow = row;
			this.brokenLinkHighlightTimeoutId = setTimeout(
				this.clearSettingsRowHighlight,
				BROKEN_LINK_HIGHLIGHT_DURATION,
			);
		},
		clearSettingsRowHighlight(): void
		{
			if (this.brokenLinkHighlightTimeoutId)
			{
				clearTimeout(this.brokenLinkHighlightTimeoutId);
				this.brokenLinkHighlightTimeoutId = null;
			}

			if (this.highlightedRow)
			{
				Dom.removeClass(this.highlightedRow, BROKEN_LINK_HIGHLIGHT_CLASS);
				this.releaseSettingsRowFocus(this.highlightedRow);
				this.highlightedRow = null;
			}
		},
		/**
		 * A row that is no longer a target of a jump gives `tabindex` back, so that a click on its
		 * caption stops focusing a container nobody can act on. Taking the attribute off the row the
		 * focus stands on would drop the focus to the body, so such a row keeps it until it is left.
		 */
		releaseSettingsRowFocus(row: HTMLElement): void
		{
			if (document.activeElement === row)
			{
				Event.bindOnce(row, 'blur', () => Dom.attr(row, 'tabindex', null));

				return;
			}

			Dom.attr(row, 'tabindex', null);
		},
		createSettingsForm(form: HTMLElement, notRuleNodes: Array<HTMLElement>): HTMLElement
		{
			const settingsForm = form.cloneNode(true);
			const table = settingsForm.querySelector('.adm-detail-content-table');
			table.innerHTML = '';
			const tBody = Tag.render`<tbody></tbody>`;
			Dom.append(tBody, table);
			notRuleNodes.forEach((node) => Dom.append(node, tBody));

			return settingsForm;
		},
		async renderPropertyDialog(requestId: string): Promise<HTMLElement | null>
		{
			const { renderPropertyDialog } = usePropertyDialog();
			const formData = this.createFormData();
			const form = await renderPropertyDialog(this.$refs.ruleContainer, formData, this.store.isWriteLocked);
			if (this.isRenderCancelled(requestId))
			{
				if (form)
				{
					Dom.remove(form);
				}

				return null;
			}

			if (!form)
			{
				return null;
			}

			this.applyFieldPlaceholders(form);

			if (this.isSetupTemplateActivity)
			{
				this.clearDefaultTitleInput(form);
				// Whole dialog stays in one form here, so there is no separate rule form
				// to keep from a previously opened block.
				this.ruleSettingsForm = null;

				return form;
			}

			const settingsContainer = form.querySelector('.adm-detail-content-table > tbody:has(#bpastitle)');
			const notRuleNodes = settingsContainer.querySelectorAll('#id_activity_comment, :scope > tr:has(#bpastitle)');
			notRuleNodes.forEach((node) => Dom.remove(node));
			this.ruleSettingsForm = form;

			const settingsForm = this.createSettingsForm(form, notRuleNodes);
			settingsForm.name = `${settingsForm.name}_settings`;
			const brokenLinksAlert = this.ruleSettingsForm.querySelector('#bp_act_set_broken_link');
			if (brokenLinksAlert)
			{
				Dom.remove(brokenLinksAlert);
			}

			this.clearDefaultTitleInput(settingsForm);

			return settingsForm;
		},
		getDocuments(): [{ id: string, text: string }]
		{
			return this.store.getAllBlockAncestors(this.currentBlock).reduce((acc, { block }: Block) => {
				if (Type.isArrayFilled(block.activity.ReturnProperties))
				{
					block.activity.ReturnProperties.forEach((property) => {
						const id = `{=${block.id}:${property.Id}}`;

						if (property.Type === 'document')
						{
							acc.push({
								id,
								text: `${property.Name} (${block.activity.Properties.Title})`,
							});
						}
					});
				}

				return acc;
			}, []);
		},
		validateForm(formData: Object): void
		{
			if (!this.nodeControls)
			{
				return;
			}

			this.hasErrors = false;
			this.nodeControls.forEach((field) => {
				const value = formData[field.fieldName];
				const required = false; // field.property.Required;
				const escapedFieldName = field.fieldName.replaceAll(/[!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~]/g, '\\$&');
				const input = document.querySelector(`[name^="${escapedFieldName}"]`);

				if (!input)
				{
					return;
				}

				if (required && (!value || (Type.isString(value) && value.trim() === '')))
				{
					this.hasErrors = true;

					let highlightElement = input;
					if (input.type === 'hidden')
					{
						const wrapperDiv = input.closest(`div[id*="${escapedFieldName}"]`);
						if (wrapperDiv)
						{
							highlightElement = wrapperDiv;
						}
					}

					Dom.addClass(highlightElement, 'has-error');
					if (input.type !== 'hidden')
					{
						input.focus();
					}
				}
				else
				{
					Dom.removeClass(input, 'has-error');
				}
			});
		},
		handleFieldInput(event: InputEvent): void
		{
			if (!this.hasErrors)
			{
				return;
			}

			Dom.removeClass(event.target, 'has-error');
		},
		handleScroll(): void
		{
			EventEmitter.emit(EVENT_NAMES.SCROLL_EVENT);
		},
		onDragStart(): void
		{
			this.isDragging = true;
			if (this.$refs.scrollContainer)
			{
				const rect = this.$refs.scrollContainer.getBoundingClientRect();
				this.scrollBoundaries = {
					top: rect.top + SCROLL_ZONE,
					bottom: rect.bottom - SCROLL_ZONE,
				};
			}
			this.startAutoScroll();
		},
		onDragMove(event: BaseEvent): void
		{
			const { clientY } = event.getData();
			this.dragMouseY = clientY;
		},
		onDragEnd(): void
		{
			this.isDragging = false;
			this.scrollBoundaries = null;
			this.stopAutoScroll();
		},
		destroyRendererInstance(): void
		{
			if (this.rendererInstance && Type.isFunction(this.rendererInstance.destroy))
			{
				this.rendererInstance.destroy();
			}
			this.rendererInstance = null;
		},
		startAutoScroll(): void
		{
			this.autoScrollFrameId = requestAnimationFrame(this.processAutoScroll);
		},
		stopAutoScroll(): void
		{
			if (this.autoScrollFrameId)
			{
				cancelAnimationFrame(this.autoScrollFrameId);
				this.autoScrollFrameId = null;
			}
		},
		processAutoScroll(): void
		{
			if (!this.isDragging || !this.$refs.scrollContainer || !this.scrollBoundaries)
			{
				return;
			}

			const container = this.$refs.scrollContainer;
			const topScrollBoundary = this.scrollBoundaries.top;
			const bottomScrollBoundary = this.scrollBoundaries.bottom;

			let scrollDelta = 0;

			if (this.dragMouseY < topScrollBoundary)
			{
				scrollDelta = -SCROLL_SPEED;
			}
			else if (this.dragMouseY > bottomScrollBoundary)
			{
				scrollDelta = SCROLL_SPEED;
			}

			if (scrollDelta !== 0)
			{
				container.scrollTop += scrollDelta;
			}

			this.autoScrollFrameId = requestAnimationFrame(this.processAutoScroll);
		},
		mountDynamicComponents(): void
		{
			Object.entries(this.dynamicComponents).forEach(([componentKey, component]) => {
				const wrapper = component.wrapper;
				if (!wrapper || wrapper.children.length > 0)
				{
					return;
				}

				const field = this.customFieldsData[componentKey];
				if (field)
				{
					const app = BitrixVue.createApp(component.rendererOrComponent, { field });
					app.mount(wrapper);
					this.childVueApps.push(app);
				}
			});
		},
		resetDynamicComponents(): void
		{
			this.childVueApps.forEach((app) => {
				if (app && Type.isFunction(app.unmount))
				{
					app.unmount();
				}
			});
			this.childVueApps = [];
			this.dynamicComponents = {};
			this.customFieldsData = {};
		},
		unsubscribeCollectionRenderFinished(): void
		{
			if (this.collectionRenderFinishedHandler)
			{
				Event.EventEmitter.unsubscribe(
					'BX.Bizproc.FieldType.onCollectionRenderControlFinished',
					this.collectionRenderFinishedHandler,
				);
				this.collectionRenderFinishedHandler = null;
			}
		},
		cancelPendingCollectionRender(): void
		{
			this.unsubscribeCollectionRenderFinished();

			if (this.pendingCollectionRenderResolve)
			{
				this.pendingCollectionRenderResolve();
				this.pendingCollectionRenderResolve = null;
			}
		},
		cleanupFormResources(): void
		{
			this.cancelSettingsControlsRequest();
			this.clearSettingsRowHighlight();
			this.dropRuleBrokenLinksAlert();
			closeExpressionBuilder();
			unmountFormVeneers(this.$refs.contentContainer);
			unmountFormVeneers(this.$refs.ruleContainer);
			this.cancelPendingCollectionRender();

			this.projectFieldStateObservers.forEach((observer: MutationObserver) => {
				observer.disconnect();
			});
			this.projectFieldStateObservers = [];

			if (this.inputListeners && this.handleFieldInput)
			{
				this.inputListeners.forEach((input) => {
					Event.unbind(input, 'input', this.handleFieldInput);
				});
				this.inputListeners = [];
			}

			this.resetDynamicComponents();

			if (Type.isFunction(this.rendererInstance?.destroy))
			{
				this.rendererInstance.destroy();
			}
			this.rendererInstance = null;
			this.settingsForm = null;
		},
		blurActiveElementIfNeeded(): void
		{
			setTimeout(() => {
				const activeElement = document.activeElement;
				if (activeElement && this.$refs.settingsPanel?.contains(activeElement))
				{
					activeElement.blur();
				}
			}, 150);
		},
		async onAskShowValueSelector(event: BaseEvent): void
		{
			const target = event.getTarget();
			const selector = new ValueSelector(this.store, this.currentBlock);
			const showOptions = {
				showOnlyRealProperties: event.getData().showOnlyRealProperties ?? false,
			};
			const onSelect = event.getData().onSelect ?? null;
			const value = await selector.show(target, showOptions);

			if (onSelect && value)
			{
				onSelect(
					value,
					selector.selectedItem?.getCustomData().get('property'),
				);
			}
		},
	},
	template: `
		<transition name="slide-fade">
			<div
				v-if="isVisible"
				class="node-settings-panel --common"
				:class="{ '--loading': isLoading, '--setup-template-activity': isSetupTemplateActivity }"
				ref="settingsPanel"
				data-testid="bizprocdesigner-editor-common-node-settings-panel"
			>
				<div class="node-settings-header">
					<h3 class="node-settings-title">
						{{loc('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_TITLE')}}
					</h3>
					<span
						class="node-settings-title-close-icon"
					data-testid="bizprocdesigner-editor-common-node-settings-close"
						@click="handleFormCancel"
					></span>
				</div>
				<slot name="header"/>
				<div class="node-settings-form__controls">
					<slot name="tabs" />
					<slot name="data-inspector-toggle" />
				</div>
				<Transition
					:css="shouldShowWithTransition"
					name="node-settings-transition"
					@after-enter="onContentShown"
				>
					<div v-show="!isLoading" class="node-settings-content" ref="scrollContainer">
						<div class="temp-block" v-show="!hasSettings">
							<div class="node-settings-content_empty-block"></div>
							<p>{{loc('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_TEXT')}}</p>
						</div>
						<div
							class="node-settings-form__section"
							:hidden="!isRuleHidden"
						>
							<div class="node-settings-form__section-header">
								<div class="node-settings-form__section-header-main">
									<BIcon :name="iconSet.EDIT_M" :size="30"/>
									<span class="node-settings-form__section-title">
										{{ loc('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_GENERAL_SECTION_TITLE') }}
									</span>
								</div>
								<span class="node-settings-form__section-description">
									{{ loc('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_GENERAL_SECTION_DESCRIPTION') }}
								</span>
							</div>
							<div ref="contentContainer"></div>
						</div>
						<DataViewsSection v-if="isRuleHidden && isDataViewsSectionShown" :block="block"/>
						<div
							v-if="isRuleHidden"
							class="node-settings-form__section --rules"
							:data-testid="$testId('bizprocdesigner-node-settings-rules-section')"
						>
							<div class="node-settings-form__section-header">
								<div class="node-settings-form__section-header-main">
									<BIcon :name="iconSet.DATA_READING" :size="28"/>
									<span class="node-settings-form__section-title">
										{{ loc('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_RULE_SECTION_TITLE') }}
									</span>
								</div>
								<span class="node-settings-form__section-description">
									{{ loc('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_RULE_SECTION_DESCRIPTION_MSGVER_1') }}
								</span>
							</div>
							<div ref="rulesAlertContainer"></div>
							<!-- The representation of the block travels next to the title: the form does not
							decide what of it is drawn, and a block without one passes null just as well. -->
							<slot
								name="common-node-settings-preview"
								:title="settingsFormTitle"
								:contentBlock="currentBlock?.activity?.ContentBlock ?? null"
							/>
						</div>
						<div
							class="node-settings-content__rule"
							:hidden="isRuleHidden"
						>
							<div class="node-settings-content__rule_top">
								<span class="node-settings-content__rule_top-operator">
									{{ loc('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ACTION') }}
								</span>
								<span class="node-settings-content__rule_top-description">
									{{ loc('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ACTION_DESCRIPTION') }}
								</span>
							</div>
							<div ref="ruleContainer"></div>
						</div>
					</div>
				</Transition>
				<div
					v-show="isLoading || hasSettings"
					class="node-settings-footer"
				>
					<template v-if="hasSettings">
						<button
							v-if="!store.isWriteLocked"
							class="ui-btn --air ui-btn-lg --style-outline-fill-accent ui-btn-no-caps"
							:class="{ 'ui-btn-wait': isSubmitting }"
							:data-test-id="$testId('commonNodeSettingsSaveButton')"
							@click="handleFormSave"
						>
							{{loc('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_SAVE')}}
						</button>
						<button
							class="ui-btn ui-btn-lg ui-btn-link ui-btn-no-caps"
						data-testid="bizprocdesigner-editor-common-node-settings-cancel"
							@click="handleFormCancel"
						>
							{{loc('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CANCEL')}}
						</button>

						<div class="node-settings-document-selector" v-show="useDocumentContext">
							<BIcon
								name="document"
								:size="24"
								@click="handleDocumentSelector"
							/>
						</div>
					</template>
				</div>
			</div>
		</transition>
	`,
};
