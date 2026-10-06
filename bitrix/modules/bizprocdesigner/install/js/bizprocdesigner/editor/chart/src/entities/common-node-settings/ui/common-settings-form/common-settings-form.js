import 'window';
import { BitrixVue, markRaw } from 'ui.vue3';
import { Dom, Tag, Type, Event, Loc, ajax, Text } from 'main.core';
import { MenuManager, type MenuItem } from 'main.popup';
import { EventEmitter, type BaseEvent } from 'main.core.events';
import { MessageBox } from 'ui.dialogs.messagebox';
import { BIcon, Outline } from 'ui.icon-set.api.vue';

import { FeatureCode } from 'bizprocdesigner.feature';

import { editorAPI } from '../../../../shared/api';
import {
	documentFieldsCache,
	handleResponseError,
	hasVisibleFieldLabel,
	isRequiredField,
} from '../../../../shared/utils';
import { usePropertyDialog, useFeature } from '../../../../shared/composables';
import { diagramStore } from '../../../../entities/blocks';
import { isReadableExpressionsAvailable } from '../../../../entities/node-settings/utils/readable-expressions';
import { DataViewsSection } from '../../../../features/node-settings/ui/data-views-section/data-views-section';
import {
	closeExpressionBuilder,
	mountExpressionBuilders,
} from '../../../../features/node-settings/utils/expression-builder-mount';
import { unmountFormVeneers } from '../../../../features/node-settings/utils/readable-expressions-veneer';
import { useCommonNodeSettingsStore } from '../../stores/common-node-settings';
import { ValueSelector } from './value-selector';

import { type Block, type SettingsControls } from '../../../../shared/types';
import { TITLE_FIELD_NAME, isDataViewsAllowedBlockType } from '../../../../shared/constants';

import './style.css';

const SCROLL_ZONE = 50;
const SCROLL_SPEED = 10;
const MULTI_SELECT_SCROLLBAR_WIDTH_PROPERTY = '--bizprocdesigner-multi-select-scrollbar-width';
const RULE_FORM_ID = 'form-settings-rule';
const SETTINGS_FIELDS_IDS = new Set([
	'row_title',
	'row_activity_editor_comment',
]);

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
		activeMultiSelectScrollbarSelectionCleanup: ?Function,
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
			activeMultiSelectScrollbarSelectionCleanup: null,
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
		Event.bind(document, 'mousedown', this.handleMultiSelectScrollbarMouseDown, true);
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
		this.cleanupMultiSelectScrollbarSelectionGuard();

		this.cleanupFormResources();

		Event.unbind(document, 'mousedown', this.handleMultiSelectScrollbarMouseDown, true);
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
		cleanupMultiSelectScrollbarSelectionGuard(): void
		{
			this.activeMultiSelectScrollbarSelectionCleanup?.();
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
		handleMultiSelectScrollbarMouseDown(event: MouseEvent): void
		{
			if (!event.isTrusted || event.button !== 0 || !(event.target instanceof HTMLElement))
			{
				return;
			}

			const select = event.target instanceof HTMLSelectElement
				? event.target
				: event.target.closest('select[multiple]')
			;
			if (!(select instanceof HTMLSelectElement) || !this.$el.contains(select))
			{
				return;
			}
			this.cleanupMultiSelectScrollbarSelectionGuard();

			const toggleOption = () => {
				const option = event.target instanceof HTMLOptionElement ? event.target : null;
				if (!option || !select.contains(option))
				{
					return;
				}

				event.preventDefault();
				const scrollTop = select.scrollTop;
				option.selected = !option.selected;
				setTimeout(() => {
					select.scrollTop = scrollTop;
				}, 0);
			};

			const rect = select.getBoundingClientRect();
			const computedStyle = window.getComputedStyle(select);
			const borderLeftWidth = parseFloat(computedStyle.borderLeftWidth) || 0;
			const borderRightWidth = parseFloat(computedStyle.borderRightWidth) || 0;
			const borderWidth = borderLeftWidth + borderRightWidth;
			const layoutScrollbarWidth = Math.max(select.offsetWidth - select.clientWidth - borderWidth, 0);
			const styledScrollbarWidth = Math.max(
				parseFloat(computedStyle.getPropertyValue(MULTI_SELECT_SCROLLBAR_WIDTH_PROPERTY)) || 0,
				0,
			);
			const scrollbarWidth = Math.max(layoutScrollbarWidth, styledScrollbarWidth);
			if (scrollbarWidth <= 0 || select.scrollHeight <= select.clientHeight)
			{
				toggleOption();
				return;
			}

			const isRtl = computedStyle.direction === 'rtl';
			const isScrollbarHit = isRtl
				? event.clientX <= rect.left + borderLeftWidth + scrollbarWidth
				: event.clientX >= rect.right - borderRightWidth - scrollbarWidth
			;
			if (!isScrollbarHit)
			{
				toggleOption();
				return;
			}

			const selectedState = Array.from(select.options, (option) => option.selected);
			const restoreSelection = () => {
				Array.from(select.options).forEach((option, index) => {
					option.selected = selectedState[index] ?? false;
				});
			};
			const handleSelectionChange = (selectionEvent: Event) => {
				selectionEvent.stopImmediatePropagation();
				restoreSelection();
			};
			let cleanupTimeoutId = null;
			const restoreTimeoutId = setTimeout(restoreSelection, 0);
			let isCleanedUp = false;
			const cleanup = () => {
				if (isCleanedUp)
				{
					return;
				}

				isCleanedUp = true;
				clearTimeout(restoreTimeoutId);
				if (cleanupTimeoutId !== null)
				{
					clearTimeout(cleanupTimeoutId);
				}
				restoreSelection();
				Event.unbind(select, 'input', handleSelectionChange, true);
				Event.unbind(select, 'change', handleSelectionChange, true);
				Event.unbind(document, 'mouseup', scheduleCleanup, true);
				Event.unbind(window, 'blur', cleanup);
				if (this.activeMultiSelectScrollbarSelectionCleanup === cleanup)
				{
					this.activeMultiSelectScrollbarSelectionCleanup = null;
				}
			};
			const scheduleCleanup = () => {
				cleanupTimeoutId = setTimeout(cleanup, 0);
			};

			this.activeMultiSelectScrollbarSelectionCleanup = cleanup;
			Event.bind(select, 'input', handleSelectionChange, true);
			Event.bind(select, 'change', handleSelectionChange, true);
			Event.bind(document, 'mouseup', scheduleCleanup, true);
			Event.bind(window, 'blur', cleanup);
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

					await this.store.publicDraft();
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
				className += ' hidden';
			}

			return Tag.render`
				<div class="${className}" id="row_${field.fieldName}">
					${this.shouldShowFieldCaption(field) ? `
						<div class="node-settings-edit-caption${this.shouldShowRequiredMark(field) ? ' --required' : ''}">
							${field.property.Name}
						</div>
					` : ''}
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

			let request = null;

			try
			{
				const settingsControls = await editorAPI.getNodeSettingsControls(
					{
						documentType: this.documentType,
						activity: this.currentBlock?.activity,
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
				this.nodeControls.filter((field) => field.property.Type !== 'custom'),
				'designer',
			);

			// eslint-disable-next-line max-lines-per-function
			return new Promise((resolve) => {
				if (this.isRenderCancelled(requestId))
				{
					resolve();

					return;
				}

				if (Type.isObject(brokenLinks) && Object.keys(brokenLinks).length > 0)
				{
					const brokenLinksAlert = this.renderBrokenLinksAlert(brokenLinks);
					Dom.append(brokenLinksAlert, this.settingsForm);
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
				this.nodeControls.forEach((field) => {
					let control = renderedControls[field.controlId];

					if (field.property.Type === 'custom' && instance && customRenderers)
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

						if (SETTINGS_FIELDS_IDS.has(row.id))
						{
							Dom.append(row, settingsFragment);
						}
						else
						{
							Dom.append(row, rulesFragment);
						}
					}
				});

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
		renderBrokenLinksAlert(brokenLinks: { [key: string]: string }): HTMLElement
		{
			const linksArray = Object.values(brokenLinks);
			const detailContent = linksArray
				.map((link) => Text.encode(link))
				.join('<br>')
			;

			const alert = Tag.render`
				<div class="ui-alert ui-alert-warning ui-alert-icon-info">
					<div class="ui-alert-message">
						<div>
							<span>
								${Text.encode(Loc.getMessage('BIZPROCDESIGNER_EDITOR_BROKEN_LINK_ERROR') ?? '')}
							</span> <span ref="showMoreBtn" class="bizprocdesigner-activity-broken-link-show-more">
								${Text.encode(Loc.getMessage('BIZPROCDESIGNER_EDITOR_MESSAGE_SHOW_LINKS') ?? '')}
							</span>
						</div>
						<div ref="detailBlock" class="bizprocdesigner-activity-broken-link-detail">
							${detailContent}
						</div>
					</div>
					<span ref="closeBtn" class="ui-alert-close-btn"></span>
				</div>
			`;

			Event.bind(alert.showMoreBtn, 'click', () => {
				Dom.style(alert.detailBlock, 'height', `${alert.detailBlock.scrollHeight}px`);
				Dom.remove(alert.showMoreBtn);
			});

			Event.bind(alert.closeBtn, 'click', () => {
				Dom.remove(alert.root);
			});

			return alert.root;
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
			const form = await renderPropertyDialog(this.$refs.ruleContainer, formData);
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
			EventEmitter.emit('Bizproc.NodeSettings:onScroll');
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
			closeExpressionBuilder();
			unmountFormVeneers(this.$refs.contentContainer);
			unmountFormVeneers(this.$refs.ruleContainer);
			this.cancelPendingCollectionRender();

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
				:data-testid="$testId('bizprocdesigner-common-node-settings')"
				ref="settingsPanel"
			>
				<div class="node-settings-header">
					<h3 class="node-settings-title">
						{{loc('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_TITLE')}}
					</h3>
					<span
						class="node-settings-title-close-icon"
						:data-testid="$testId('bizprocdesigner-common-node-settings-close')"
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
							<slot
								name="common-node-settings-preview"
								:title="settingsFormTitle"
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
							:data-testid="$testId('bizprocdesigner-common-node-settings-cancel')"
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
