import 'window';
import { Dom, Tag, Type, Event, Loc, ajax, Text } from 'main.core';
import { MenuManager, type MenuItem } from 'main.popup';
import { EventEmitter, BaseEvent } from 'main.core.events';
import { MessageBox } from 'ui.dialogs.messagebox';
import { BIcon, Outline } from 'ui.icon-set.api.vue';

import { editorAPI } from '../../../../shared/api';
import { IconButton } from '../../../../shared/ui';
import { BLOCK_TYPES, ACTIVATION_STATUS } from '../../../../shared/constants';
import { handleResponseError } from '../../../../shared/utils';
import { usePropertyDialog } from '../../../../shared/composables';
import { diagramStore, BlockHeader, BlockIcon } from '../../../../entities/blocks';
import { ValueSelector } from './value-selector';

import type { Block, SettingsControls } from '../../../../shared/types';

import './style.css';

const SCROLL_ZONE = 50;
const SCROLL_SPEED = 10;

// @vue/component
export const CommonNodeSettingsForm = {
	name: 'CommonNodeSettingsForm',
	components: {
		BIcon,
		BlockHeader,
		BlockIcon,
		IconButton,
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
	},
	emits: ['showPreview'],
	setup(): Object
	{
		const store: diagramStore = diagramStore();

		return {
			iconSet: Outline,
			store,
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
		nodeControls: Array<any> | null,
		inputListeners: [],
		shouldShowWithTransition: boolean,
		isDragging: boolean,
		dragMouseY: number,
		autoScrollFrameId: number,
		scrollBoundaries: { top: number, bottom: number } | null,
		rendererInstance: ?Object,
		entitySelectorDialogs: Set<Object>,
		lastRenderRequestId: number,
		}
	{
		return {
			isLoading: false,
			isVisible: this.panelAlreadyOpened,
			hasErrors: false,
			isSubmitting: false,
			hasSettings: false,
			useDocumentContext: false,
			settingsForm: null,
			nodeControls: null,
			inputListeners: [],
			shouldShowWithTransition: false,
			isDragging: false,
			dragMouseY: 0,
			autoScrollFrameId: null,
			scrollBoundaries: null,
			rendererInstance: null,
			entitySelectorDialogs: new Set(),
			lastRenderRequestId: 0,
		};
	},
	computed:
	{
		icon(): string
		{
			if (this.block.node?.type === BLOCK_TYPES.TOOL)
			{
				const mcpLettersKey = 'MCP_LETTERS';

				return Outline[this.block.node.icon] === Outline.DATABASE
					? this.block.node.icon
					: mcpLettersKey;
			}

			return this.block.node?.icon;
		},
		colorIndex(): number
		{
			return this.block.node?.type === BLOCK_TYPES.TOOL ? 0 : this.block.node?.colorIndex;
		},
		isSubIcon(): boolean
		{
			return this.block.node?.type === BLOCK_TYPES.TOOL
			&& this.block.node?.icon && Outline[this.block.node.icon] !== Outline.DATABASE;
		},
		activationIcon(): string
		{
			return this.block.activity.Activated === ACTIVATION_STATUS.ACTIVE
				? this.iconSet.PAUSE_L
				: this.iconSet.PLAY_L;
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
	},
	async mounted()
	{
		this.isVisible = true;
		this.currentBlock = this.block;
		await this.$nextTick();
		await this.renderControls();
		Event.bind(document, 'mousedown', this.multiSelectMouseHandler);
		Event.bind(this.$refs.scrollContainer, 'scroll', this.handleScroll);
		EventEmitter.subscribe('BX.Bizproc:setuptemplateactivity:preview', this.showPreview);
		EventEmitter.subscribe('Bizproc.SetupTemplate:Draggable:start', this.onDragStart);
		EventEmitter.subscribe('Bizproc.SetupTemplate:Draggable:move', this.onDragMove);
		EventEmitter.subscribe('Bizproc.SetupTemplate:Draggable:end', this.onDragEnd);
		EventEmitter.subscribe('BX.UI.EntitySelector.Dialog:onShow', this.onEntitySelectorShow);
		EventEmitter.subscribe('Bizproc.NodeSettings:askShowValueSelector', this.onAskShowValueSelector);

		window.BPAShowSelector = this.showSelector;
		window.HideShow = this.hideShow;
		this.blurActiveElementIfNeeded();
	},
	unmounted(): void
	{
		this.stopAutoScroll();

		this.cleanupFormResources();

		Event.unbind(document, 'mousedown', this.multiSelectMouseHandler);
		Event.unbind(this.$refs.scrollContainer, 'scroll', this.handleScroll);

		EventEmitter.unsubscribe('BX.Bizproc:setuptemplateactivity:preview', this.showPreview);
		EventEmitter.unsubscribe('Bizproc.SetupTemplate:Draggable:start', this.onDragStart);
		EventEmitter.unsubscribe('Bizproc.SetupTemplate:Draggable:move', this.onDragMove);
		EventEmitter.unsubscribe('Bizproc.SetupTemplate:Draggable:end', this.onDragEnd);
		EventEmitter.emit('BX.Bizproc.Activity.unmount');
		EventEmitter.unsubscribe('BX.UI.EntitySelector.Dialog:onShow', this.onEntitySelectorShow);
		EventEmitter.unsubscribe('Bizproc.NodeSettings:askShowValueSelector', this.onAskShowValueSelector);

		this.destroyEntitySelectorDialogs();
		this.destroyRendererInstance();
	},
	methods: {
		isRenderCancelled(requestId: number): boolean
		{
			return this.lastRenderRequestId !== requestId || !this.$refs.contentContainer;
		},
		loc(phraseCode: string, replacements: { [p: string]: string } = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
		multiSelectMouseHandler(event: MouseEvent): void
		{
			if (!event.isTrusted || event.button !== 0)
			{
				return;
			}

			const opt = event.target;
			const select = opt.parentElement;
			if (opt.tagName === 'OPTION' && select?.multiple)
			{
				event.preventDefault();
				const scroll = select.scrollTop;
				opt.selected = !opt.selected;
				setTimeout(() => {
					select.scrollTop = scroll;
				}, 0);
			}
		},
		showPreview(event: boolean): void
		{
			this.$emit('showPreview', event.data);
		},
		async showSettings(node: Block, shouldShowWithTransition: boolean): Promise<void>
		{
			this.isVisible = true;
			this.currentBlock = node;
			this.shouldShowWithTransition = shouldShowWithTransition;
			await this.$nextTick();
			await this.renderControls();
		},
		extractFormData(form: HTMLElement): { [key: string]: any }
		{
			const formData = ajax.prepareForm(form).data;

			formData.documentType = this.documentType;
			formData.activityType = this.currentBlock.activity?.Type ?? '';
			formData.id = this.currentBlock.activity?.Name ?? '';
			formData.arWorkflowTemplate = JSON.stringify([this.currentBlock.activity]);

			return formData;
		},
		async submitForm(formData: { [key: string]: any }): Promise<void>
		{
			this.isSubmitting = true;

			try
			{
				this.validateForm(formData);
				if (this.hasErrors)
				{
					return;
				}

				EventEmitter.emit('Bizproc.NodeSettings:nodeSettingsSaving', { formData });

				const preparedSettingsData = { ...formData };
				preparedSettingsData.arWorkflowConstants = JSON.stringify(this.store.template.CONSTANTS ?? {});

				const compatibleTemplate = [{ Type: 'NodeWorkflowActivity', Children: [], Name: 'Template' }];
				compatibleTemplate[0].Children.push(
					this.currentBlock.activity,
					...this.store.getAllBlockAncestors(this.currentBlock).map((b) => b.activity),
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

					this.store.publicDraft();

					this.handleFormCancel();
				}
			}
			catch (error)
			{
				if (error.errors && error.errors[0] && error.errors[0].message)
				{
					MessageBox.alert(error.errors[0].message);
				}
			}
			finally
			{
				this.isSubmitting = false;
			}
		},
		handleFormSave(): void
		{
			if (this.isSubmitting)
			{
				return;
			}

			if (!this.settingsForm)
			{
				return;
			}

			const formData = this.extractFormData(this.settingsForm);
			this.submitForm(formData);
		},
		handleFormCancel(): void
		{
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
				    <div class="node-settings-edit-caption">${field.property.Name}</div>
				    <div class="field-row">
				        ${control}
				        ${field.fieldName === 'title' ? `
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
		async renderControls(): void
		{
			const requestId = ++this.lastRenderRequestId;
			window.BPAShowSelector = this.showSelector;
			window.HideShow = this.hideShow;

			this.isLoading = true;
			const id = this.currentBlock.activity.Name ?? '';
			const activity = this.currentBlock.activity.Type ?? '';
			const compatibleTemplate = [{ Type: 'NodeWorkflowActivity', Children: [], Name: 'Template' }];
			compatibleTemplate[0].Children.push(
				this.currentBlock?.activity,
				...this.store.getAllBlockAncestors(this.currentBlock).map((b) => b.activity),
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

			const { createFormData } = usePropertyDialog();
			const formData = createFormData({
				id,
				documentType: this.documentType,
				activity,
				workflow: {
					parameters: workflowParameters,
					variables: workflowVariables,
					template: compatibleTemplate,
					constants: workflowConstants,
				},
			});

			this.isLoading = true;

			if (this.$refs.contentContainer)
			{
				this.$refs.contentContainer.innerHTML = '';
			}
			this.hasErrors = false;
			this.nodeControls = [];

			let settingControls = null;
			try
			{
				settingControls = await editorAPI.getNodeSettingsControls({
					documentType: this.documentType,
					activity: this.currentBlock?.activity,
					workflow: {
						workflowParameters: JSON.stringify(workflowParameters),
						workflowVariables: JSON.stringify(workflowVariables),
						workflowTemplate: JSON.stringify(compatibleTemplate),
						workflowConstants: JSON.stringify(workflowConstants),
					},
				});
				if (this.isRenderCancelled(requestId))
				{
					return;
				}
			}
			catch (error)
			{
				if (this.isRenderCancelled(requestId))
				{
					return;
				}
				handleResponseError(error);

				return;
			}

			this.useDocumentContext = Boolean(settingControls?.useDocumentContext);
			if (settingControls && Type.isArray(settingControls.controls))
			{
				await this.renderNodeControls(settingControls, requestId);
			}
			else
			{
				await this.renderPropertyDialog(formData);
			}
		},
		renderNodeControls(settingControls: SettingsControls, requestId: number): void
		{
			this.nodeControls = Type.isArray(settingControls.controls) ? settingControls.controls : [];
			const brokenLinks = Type.isPlainObject(settingControls.brokenLinks)
				? settingControls.brokenLinks
				: {}
			;
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

			return new Promise((resolve) => {
				if (this.isRenderCancelled(requestId))
				{
					resolve();

					return;
				}

				const form = Tag.render`<form id="form-settings"></form>`;
				this.settingsForm = form;

				if (Type.isObject(brokenLinks) && Object.keys(brokenLinks).length > 0)
				{
					const brokenLinksAlert = this.renderBrokenLinksAlert(brokenLinks);
					Dom.append(brokenLinksAlert, form);
				}

				const activityTypeName = this.currentBlock.activity?.Type ?? '';
				const rendererName = `${activityTypeName}Renderer`;
				const RendererClass = Type.isFunction(window[rendererName]) ? window[rendererName] : null;

				let customRenderers = null;
				let instance = null;
				if (RendererClass)
				{
					instance = RendererClass ? new RendererClass() : null;
					this.rendererInstance = instance;
					customRenderers = (instance && Type.isFunction(instance.getControlRenderers))
						? instance.getControlRenderers()
						: null;
				}

				this.nodeControls.forEach((field) => {
					let control = renderedControls[field.controlId];

					if (field.property.Type === 'custom' && instance && customRenderers)
					{
						const renderer = customRenderers?.[field?.property?.CustomType];
						if (Type.isFunction(renderer))
						{
							control = renderer(field);
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

						Dom.append(row, form);
					}
				});

				if (this.isRenderCancelled(requestId))
				{
					resolve();

					return;
				}

				this.$refs.contentContainer.innerHTML = '';
				Dom.append(form, this.$refs.contentContainer);

				Event.EventEmitter.subscribeOnce(eventName, () => {
					if (this.isRenderCancelled(requestId))
					{
						resolve();

						return;
					}

					if (instance && Type.isFunction(instance.afterFormRender))
					{
						const activityFields = this.nodeControls.reduce((acc, field) => {
							acc[field.fieldName] = field;

							return acc;
						}, {});
						instance.afterFormRender(form, activityFields);
					}

					this.hasSettings = true;
					this.isLoading = false;
					resolve();
				});
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
		async renderPropertyDialog(formData: FormData): Promise<void>
		{
			const { renderPropertyDialog } = usePropertyDialog();
			const form = await renderPropertyDialog(this.$refs.contentContainer, formData);
			if (!form)
			{
				this.isLoading = false;
				this.hasSettings = false;

				return;
			}

			this.settingsForm = form;
			this.hasSettings = true;
			this.isLoading = false;
		},
		getDocuments(): [{ id: string, text: string }]
		{
			return this.store.getAllBlockAncestors(this.currentBlock).reduce((acc, block: Block) => {
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
			if (this.hasErrors)
			{
				Dom.removeClass(event.target, 'has-error');
			}
		},

		isUrl(value: string): boolean
		{
			if (!value || !Type.isString(value))
			{
				return false;
			}

			try
			{
				const u = new URL(value);

				return u.protocol === 'https:';
			}
			catch
			{
				return false;
			}
		},

		getSafeUrl(url: string): string
		{
			if (!url || !Type.isString(url))
			{
				return '';
			}

			try
			{
				const u = new URL(url.trim());
				if (u.protocol !== 'https:')
				{
					return '';
				}

				return u.href;
			}
			catch
			{
				return '';
			}
		},

		getBackgroundImage(url: string): Object
		{
			const safeUrl = this.getSafeUrl(url);
			if (!safeUrl)
			{
				return {};
			}

			return {
				'background-image': `url('${safeUrl}')`,
			};
		},

		toggleActivation(event: MouseEvent): void
		{
			this.store.toggleBlockActivation(this.currentBlock.id, true);
		},

		syncActivatedField(): void
		{
			const activatedInput = document.getElementsByName('activated')[0];
			if (activatedInput)
			{
				activatedInput.value = activatedInput.value === 'Y' ? 'N' : 'Y';
			}
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
		onEntitySelectorShow(event: BaseEvent): void
		{
			const dialog = event.getTarget();
			if (dialog)
			{
				this.entitySelectorDialogs.add(dialog);
			}
		},
		destroyEntitySelectorDialogs(): void
		{
			this.entitySelectorDialogs.forEach((dialog) => {
				if (dialog && Type.isFunction(dialog.destroy))
				{
					dialog.destroy();
				}
			});
			this.entitySelectorDialogs.clear();
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
		cleanupFormResources(): void
		{
			if (this.inputListeners && this.handleFieldInput)
			{
				this.inputListeners.forEach((input) => {
					Event.unbind(input, 'input', this.handleFieldInput);
				});
				this.inputListeners = [];
			}

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
				onSelect.call(
					null,
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
				class="node-settings-panel"
				:class="{ '--loading': isLoading }"
				ref="settingsPanel"
			>
				<div class="node-settings-header">
					<h3 class="node-settings-title">{{loc('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_TITLE')}}</h3>
					<span class="node-settings-title-close-icon" @click="handleFormCancel"></span>
				</div>
				<div class="node-settings-form__node-brief">
					<BlockHeader :block="block" :subIconExternal="isUrl(block.node?.icon)">
						<template #icon>
							<BlockIcon
								:iconName="icon"
								:iconColorIndex="colorIndex"
							/>
						</template>
						<template #subIcon
								  v-if="isSubIcon">
							<div
								v-if="isUrl(block.node.icon)"
								:style="getBackgroundImage(block.node.icon)"
								class="ui-selector-item-avatar"
							/>
							<BlockIcon
								v-else
								:iconName="block.node.icon"
								:iconColorIndex="7"
								:iconSize="24"
							/>
						</template>
					</BlockHeader>
					<IconButton
						:icon-name="activationIcon"
						@click="toggleActivation"
					/>
				</div>
				<div class="node-settings-form__section-delimeter"></div>
				<Transition
					:css="shouldShowWithTransition"
					name="node-settings-transition"
				>
					<div v-show="!isLoading" class="node-settings-content" ref="scrollContainer">
						<div class="temp-block" v-show="!hasSettings">
							<div class="node-settings-content_empty-block"></div>
							<p>{{loc('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_TEXT')}}</p>
						</div>
						<div ref="contentContainer"></div>
					</div>
				</Transition>
				<div
					v-show="isLoading || hasSettings"
					class="node-settings-footer"
				>
					<template v-if="hasSettings">
						<button 
							class="ui-btn --air ui-btn-lg --style-outline-fill-accent ui-btn-no-caps"
							@click="handleFormSave"
						>
							{{loc('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_SAVE')}}
						</button>
						<button
							class="ui-btn --air ui-btn-lg --style-outline ui-btn-no-caps"
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
