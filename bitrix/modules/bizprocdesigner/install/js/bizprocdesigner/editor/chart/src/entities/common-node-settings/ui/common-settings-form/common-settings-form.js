import './style.css';
import 'window';

import { Dom, Tag, Type, Event, Loc, ajax } from 'main.core';
import { MenuManager, type MenuItem } from 'main.popup';
import { EventEmitter } from 'main.core.events';
import { MessageBox } from 'ui.dialogs.messagebox';
import { editorAPI } from '../../../../shared/api';
import { BIcon, Outline } from 'ui.icon-set.api.vue';

import { IconButton } from '../../../../shared/ui';
import { BLOCK_TYPES } from '../../../../shared/constants';
import { handleResponseError } from '../../../../shared/utils';
import { useActivationMenu, usePropertyDialog } from '../../../../shared/composables';

import type { Block } from '../../../../shared/types';

import { diagramStore, BlockHeader, BlockIcon } from '../../../../entities/blocks';
import { ValueSelector } from './value-selector';

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
		activationMenuHelper: useActivationMenu | null,
		}
	{
		return {
			isLoading: false,
			isVisible: false,
			hasErrors: false,
			isSubmitting: false,
			hasSettings: false,
			useDocumentContext: false,
			settingsForm: null,
			nodeControls: null,
			inputListeners: [],
			shouldShowWithTransition: false,
			activationMenuHelper: null,
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
			return this.block.activity.Activated === 'Y'
				? this.iconSet.PAUSE_L
				: this.iconSet.PLAY_L;
		},
	},
	async mounted()
	{
		this.isVisible = true;
		this.currentBlock = this.block;
		await this.$nextTick();
		await this.renderControls();
		Event.bind(document, 'mousedown', this.multiSelectMouseHandler);

		EventEmitter.subscribe('BX.Bizproc:setuptemplateactivity:preview', this.showPreview);

		window.BPAShowSelector = this.showSelector;
		window.HideShow = this.hideShow;
	},
	unmounted(): void
	{
		if (this.inputListeners && this.handleFieldInput)
		{
			this.inputListeners.forEach((input) => {
				Event.unbind(input, 'input', this.handleFieldInput);
			});
			this.inputListeners = [];
		}
		Event.unbind(document, 'mousedown', this.multiSelectMouseHandler);

		EventEmitter.unsubscribe('BX.Bizproc:setuptemplateactivity:preview', this.showPreview);
		EventEmitter.emit('BX.Bizproc.Activity.unmount');
		// console.log('UNMOUNT');
	},
	created() {
		this.activationMenuHelper = useActivationMenu(this.store);
	},
	methods: {
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
				setTimeout(() => select.scrollTop = scroll, 0);
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

			window.BPAShowSelector = this.showSelector;
			window.HideShow = this.hideShow;
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

			this.$refs.contentContainer.innerHTML = '';
			this.hasErrors = false;
			this.nodeControls = [];

			let settingControls = null;
			try
			{
				settingControls = await editorAPI.getNodeSettingsControls({
					documentType: this.documentType,
					activity: this.currentBlock?.activity,
				});
			}
			catch (error)
			{
				handleResponseError(error);
			}

			this.useDocumentContext = Boolean(settingControls?.useDocumentContext);
			if (settingControls && Type.isArray(settingControls.controls))
			{
				await this.renderNodeControls(settingControls.controls);
			}
			else
			{
				await this.renderPropertyDialog(formData);
			}
		},
		renderNodeControls(settingControls: Array): void
		{
			this.nodeControls = settingControls;
			const eventName = 'BX.Bizproc.FieldType.onCollectionRenderControlFinished';

			this.nodeControls = this.nodeControls.map((property) => ({
				...property,
				controlId: property.fieldName.toLowerCase(),
			}));

			const renderedControls = BX.Bizproc.FieldType.renderControlCollection(
				this.documentType,
				this.nodeControls.filter((field) => field.property.Type !== 'Custom'),
				'designer',
			);

			return new Promise((resolve) => {
				Event.EventEmitter.subscribeOnce(eventName, () => {
					const form = Tag.render`<form id="form-settings"></form>`;
					this.settingsForm = form;
					const activityTypeName = this.currentBlock.activity?.Type ?? '';
					const rendererName = `${activityTypeName}Renderer`;
					const RendererClass = Type.isFunction(window[rendererName]) ? window[rendererName] : null;

					let customRenderers = null;
					let instance = null;
					if (RendererClass)
					{
						instance = RendererClass ? new RendererClass() : null;
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
							const escapedFieldName = field.fieldName.replace(/[!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~]/g, '\\$&');
							const input = row.querySelector(`[name^="${escapedFieldName}"]`);
							Event.bind(input, 'input', this.handleFieldInput);
							this.inputListeners.push(input);

							if (field.property.Type !== 'custom' && input?.tagName === 'SELECT')
							{
								Dom.addClass(input, 'ui-ctl-element');
								const wrapper = Tag.render`
									<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown ui-ctl-w100${field.property.Multiple === true ? ' ui-ctl-multiple-select' : ''}">
										<div class="ui-ctl-after ui-ctl-icon-angle"></div>
										${input}
									</div>
								`;
								Dom.append(wrapper, row);
							}

							const selectorInput = row.querySelector('input[data-role="bp-selector-button"]');
							if (selectorInput)
							{
								const span = document.createElement('span');
								span.className = 'node-settings-select-dotted';

								for (const attr of selectorInput.attributes)
								{
									const attrName = attr.name;
									const attrValue = attr.value;
									span.setAttribute(attrName, attrValue);
								}

								Dom.replace(selectorInput, span);
							}

							Dom.append(row, form);
						}
					});

					this.$refs.contentContainer.innerHTML = '';
					Dom.append(form, this.$refs.contentContainer);
					this.hasSettings = true;
					this.isLoading = false;
					resolve();
				});
			});
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
				const escapedFieldName = field.fieldName.replace(/[!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~]/g, '\\$&');
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

		showActivationMenu(event: MouseEvent): void
		{
			this.activationMenuHelper.showActivationMenu(
				event,
				this.currentBlock,
				() => this.syncActivatedField(),
			);
		},

		syncActivatedField(): void
		{
			const activatedInput = document.getElementsByName('activated')[0];
			if (activatedInput)
			{
				activatedInput.value = activatedInput.value === 'Y' ? 'N' : 'Y';
			}
		},
	},
	template: `
		<transition name="slide-fade">
			<div v-if="isVisible" class="node-settings-panel" ref="settingsPanel">
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
						@click="showActivationMenu"
					/>
				</div>
				<div class="node-settings-form__section-delimeter"></div>
				<Transition
					:css="shouldShowWithTransition"
					name="node-settings-transition"
				>
					<div v-show="!isLoading" class="node-settings-content">
						<div class="temp-block" v-show="!hasSettings">
							<svg width="330" height="162" viewBox="0 0 330 162" fill="none" xmlns="http://www.w3.org/2000/svg">
								<g opacity="0.8">
									<g opacity="0.8" filter="url(#filter0_d_348_93445)">
										<path d="M87.0298 24.5516C87.0298 15.9188 93.507 9.42059 101.372 10.041L225.88 19.8304C231.526 20.272 236.027 26.4233 236.027 33.5839V117.788C236.027 124.938 231.516 131.079 225.88 131.499L101.372 140.752C93.507 141.341 87.0298 134.822 87.0298 126.179V24.5516Z" fill="#C4E6FF"/>
									</g>
								</g>
								<path opacity="0.05" fill-rule="evenodd" clip-rule="evenodd" d="M107.155 46.8539C107.155 46.4964 106.893 46.1915 106.556 46.1809C106.22 46.1704 105.957 46.4543 105.957 46.8118V56.5592L96.9034 56.3384C96.5669 56.3384 96.2935 56.6223 96.2935 56.9798C96.2935 57.3373 96.5669 57.6422 96.9034 57.6528L105.957 57.8631V77.3683H96.9034C96.5669 77.3683 96.2935 77.6627 96.2935 78.0307C96.2935 78.3988 96.5669 78.6827 96.9034 78.6827H105.957V98.1669L96.9034 98.3877C96.5669 98.3877 96.2935 98.6926 96.2935 99.0606C96.2935 99.4287 96.5669 99.7126 96.9034 99.702L105.957 99.4602V118.965L96.9034 119.407C96.5669 119.428 96.2935 119.733 96.2935 120.091C96.2935 120.448 96.5669 120.732 96.9034 120.721L105.957 120.259V130.006C105.957 130.364 106.22 130.637 106.556 130.616C106.893 130.595 107.155 130.29 107.155 129.933V120.196L124.663 119.312V128.849C124.663 129.196 124.915 129.47 125.231 129.449C125.546 129.428 125.798 129.133 125.798 128.776V119.249L142.549 118.398V127.724C142.549 128.071 142.791 128.334 143.096 128.313C143.4 128.292 143.642 127.998 143.642 127.661V118.345L159.688 117.535V126.673C159.688 127.009 159.919 127.272 160.214 127.251C160.508 127.23 160.74 126.946 160.74 126.61V117.483L176.123 116.705V125.653C176.123 125.979 176.344 126.231 176.628 126.221C176.912 126.21 177.132 125.926 177.132 125.59V116.652L191.895 115.906V124.675C191.895 125.001 192.116 125.243 192.379 125.232C192.642 125.222 192.863 124.938 192.863 124.622V115.864L207.037 115.149V123.739C207.037 124.055 207.247 124.297 207.5 124.286C207.752 124.275 207.962 124.002 207.962 123.687V115.106L221.59 114.412V122.835C221.59 123.14 221.789 123.382 222.031 123.371C222.273 123.361 222.473 123.087 222.473 122.782V114.37L228.214 114.076C228.456 114.065 228.656 113.803 228.656 113.498C228.656 113.193 228.456 112.951 228.214 112.961L222.473 113.245V96.4214L228.214 96.2742C228.456 96.2742 228.656 96.0113 228.656 95.7064C228.656 95.4014 228.456 95.1596 228.214 95.1596L222.473 95.2963V78.4724H228.214C228.456 78.4724 228.656 78.2095 228.656 77.9045C228.656 77.5996 228.456 77.3473 228.214 77.3473H222.473V60.5233L228.214 60.6495C228.456 60.6495 228.656 60.4077 228.656 60.1027C228.656 59.7978 228.456 59.5454 228.214 59.5349L222.473 59.3982V50.9863C222.473 50.6813 222.273 50.4185 222.031 50.408C221.789 50.3974 221.59 50.6393 221.59 50.9547V59.3772L207.962 59.0407V50.4605C207.962 50.1451 207.752 49.8822 207.5 49.8717C207.247 49.8612 207.037 50.1135 207.037 50.429V59.0197L192.863 58.6727V49.9138C192.863 49.5878 192.642 49.3249 192.379 49.3144C192.116 49.3039 191.895 49.5562 191.895 49.8822V58.6517L177.132 58.2942V49.3565C177.132 49.0305 176.912 48.7571 176.628 48.7466C176.344 48.7361 176.123 48.999 176.123 49.3249V58.2731L160.74 57.8946V48.7676C160.74 48.4311 160.508 48.1472 160.214 48.1367C159.919 48.1262 159.688 48.3891 159.688 48.7256V57.8631L143.642 57.474V48.1578C143.642 47.8108 143.4 47.5269 143.096 47.5163C142.791 47.5058 142.549 47.7792 142.549 48.1157V57.4425L125.798 57.0324V47.5058C125.798 47.1588 125.546 46.8644 125.231 46.8539C124.915 46.8434 124.663 47.1168 124.663 47.4638V57.0008L107.155 56.5802V46.8434V46.8539ZM221.6 113.287V96.4424L207.973 96.7999V113.96L221.6 113.287ZM207.047 114.002V96.8209L192.873 97.189V114.696L207.047 114.002ZM191.906 114.738V97.21L177.143 97.5991V115.464L191.906 114.738ZM176.134 115.517V97.6201L160.75 98.0197V116.263L176.134 115.506V115.517ZM159.699 116.326V98.0617L143.653 98.4823V117.115L159.699 116.326ZM142.559 117.167V98.5033L125.809 98.945V117.988L142.559 117.167ZM124.663 118.04V98.966L107.155 99.4287V118.902L124.663 118.04ZM124.663 97.7042L107.155 98.1353V78.6616L124.663 78.6301V97.7042ZM142.559 97.2626L125.809 97.6727V78.6301L142.559 78.5985V97.2626ZM159.699 96.842L143.653 97.2416V78.6091L159.699 78.5775V96.842ZM176.134 96.4319L160.75 96.8104V78.567L176.134 78.546V96.4424V96.4319ZM191.906 96.0428L177.143 96.4109V78.546L191.906 78.5249V96.0534V96.0428ZM207.047 95.6748L192.873 96.0218V78.5144L207.047 78.4934V95.6748ZM221.6 95.3173L207.973 95.6538V78.4934L221.6 78.4724V95.3173ZM221.6 77.3367V60.4918L207.973 60.1763V77.3367H221.6ZM207.047 77.3473V60.1658L192.873 59.8399V77.3473H207.047ZM191.906 77.3473V59.8188L177.143 59.4824V77.3473H191.906ZM176.134 77.3473V59.4508L160.75 59.1038V77.3473H176.134ZM159.699 77.3473V59.0828L143.653 58.7148V77.3473H159.699ZM142.559 77.3578V58.6937L125.809 58.3152V77.3578H142.559ZM124.663 77.3578V58.2837L107.155 57.8841V77.3578H124.663Z" fill="#1F86FF"/>
								<path fill-rule="evenodd" clip-rule="evenodd" d="M225.88 20.9239L101.372 11.3238C94.1694 10.7665 88.2495 16.718 88.2495 24.6252V126.116C88.2495 134.023 94.18 139.995 101.372 139.469L225.88 130.395C231.053 130.017 235.196 124.391 235.196 117.83V33.5314C235.196 26.97 231.053 21.3235 225.88 20.9239ZM101.372 10.041C93.507 9.42059 87.0298 15.9188 87.0298 24.5516V126.189C87.0298 134.822 93.507 141.341 101.372 140.763L225.88 131.51C231.526 131.089 236.027 124.959 236.027 117.798V33.5839C236.027 26.4338 231.516 20.272 225.88 19.8304L101.372 10.041Z" fill="#9BD4FF" fill-opacity="0.8"/>
								<path opacity="0.1" d="M87.0298 24.867C87.0298 16.0555 93.507 9.43103 101.372 10.0409L225.88 19.8303C231.526 20.2719 236.027 26.5494 236.027 33.8467V42.6583L87.0298 35.4976V24.867Z" fill="#0075FF"/>
								<path d="M96.9034 54.3721C96.9034 50.0189 100.174 46.6015 104.169 46.7487L147.459 48.2944C151.024 48.4206 153.894 51.8169 153.894 55.8862V119.68C153.894 123.75 151.024 127.22 147.459 127.44L104.169 130.132C100.174 130.385 96.9034 127.051 96.9034 122.698V54.3721Z" fill="white"/>
								<path d="M122.949 61.1113C122.949 59.881 123.843 58.9031 124.957 58.9242L144.473 59.3553C145.525 59.3763 146.376 60.3647 146.376 61.5634C146.376 62.7621 145.525 63.719 144.473 63.6979L124.957 63.372C123.853 63.351 122.949 62.3415 122.949 61.1113Z" fill="#DFE0E3" fill-opacity="0.68"/>
								<path opacity="0.8" d="M101.761 57.1054C101.761 54.2243 103.917 51.9425 106.567 52.0267L113.664 52.237C116.251 52.3106 118.333 54.6659 118.333 57.505V65.1914C118.333 68.0199 116.251 70.3017 113.664 70.2806L106.567 70.2175C103.928 70.1965 101.761 67.8412 101.761 64.9495V57.1054Z" fill="#59FBB0" fill-opacity="0.74"/>
								<path opacity="0.3" d="M96.9037 75.3916L153.884 75.5178V119.681C153.884 123.75 151.014 127.22 147.449 127.441L104.159 130.132C100.163 130.385 96.8932 127.052 96.8932 122.698V75.3916H96.9037Z" fill="#D7EFFF" fill-opacity="0.8"/>
								<path d="M134.274 90.5539C134.274 89.3342 135.146 88.3458 136.219 88.3247L144.473 88.2091C145.525 88.1986 146.376 89.1554 146.376 90.3541C146.376 91.5528 145.525 92.5412 144.473 92.5623L136.219 92.72C135.146 92.741 134.274 91.7736 134.274 90.5539Z" fill="#DFE0E3" fill-opacity="0.68"/>
								<path d="M134.274 113.171C134.274 111.952 135.146 110.932 136.219 110.89L144.473 110.553C145.525 110.511 146.376 111.447 146.376 112.646C146.376 113.844 145.525 114.854 144.473 114.896L136.219 115.274C135.146 115.327 134.274 114.381 134.274 113.161V113.171Z" fill="#DFE0E3" fill-opacity="0.68"/>
								<path fill-rule="evenodd" clip-rule="evenodd" d="M129.08 90.2276L123.612 85.9375C123.486 85.8323 123.317 85.8218 123.17 85.9164C123.033 86.0006 122.939 86.1688 122.949 86.3581V95.1275C122.949 95.3168 123.033 95.4745 123.17 95.5586C123.307 95.6428 123.475 95.6217 123.612 95.5166L129.08 91.0477C129.195 90.9531 129.258 90.8059 129.258 90.6376C129.258 90.4694 129.185 90.3222 129.08 90.2381V90.2276Z" fill="#0075FF" fill-opacity="0.78"/>
								<path fill-rule="evenodd" clip-rule="evenodd" d="M110.583 90.5222L104.863 86.1374C104.727 86.0323 104.548 86.0218 104.401 86.1059C104.253 86.19 104.159 86.3688 104.169 86.558V95.5273C104.169 95.7165 104.253 95.8848 104.401 95.9689C104.548 96.053 104.727 96.032 104.863 95.9269L110.583 91.3528C110.699 91.2582 110.773 91.1005 110.773 90.9323C110.773 90.764 110.699 90.6168 110.583 90.5222Z" fill="#DFE0E3" fill-opacity="0.68"/>
								<path fill-rule="evenodd" clip-rule="evenodd" d="M129.08 112.993L123.612 108.85C123.486 108.755 123.317 108.745 123.17 108.839C123.033 108.934 122.939 109.102 122.949 109.292V118.061C122.949 118.25 123.033 118.408 123.17 118.492C123.307 118.576 123.475 118.555 123.612 118.44L129.08 113.813C129.195 113.718 129.258 113.561 129.258 113.403C129.258 113.245 129.185 113.087 129.08 113.003V112.993Z" fill="#0075FF" fill-opacity="0.78"/>
								<path fill-rule="evenodd" clip-rule="evenodd" d="M110.583 113.792L104.863 109.565C104.727 109.459 104.548 109.459 104.401 109.554C104.253 109.649 104.159 109.827 104.169 110.017V118.986C104.169 119.175 104.253 119.344 104.401 119.428C104.548 119.512 104.727 119.491 104.863 119.375L110.583 114.643C110.699 114.549 110.773 114.391 110.773 114.223C110.773 114.054 110.699 113.907 110.583 113.813V113.792Z" fill="#DFE0E3" fill-opacity="0.68"/>
								<path d="M171.581 63.5515C171.581 60.2393 173.852 57.6105 176.638 57.6841L223.829 58.8723C226.269 58.9354 228.235 61.4695 228.235 64.5504V75.6857C228.235 78.7561 226.269 81.2586 223.829 81.2797L176.638 81.5425C173.852 81.5531 171.581 78.8823 171.581 75.5701V63.5725V63.5515Z" fill="white"/>
								<path d="M193.347 69.7651C193.347 68.64 194.104 67.7357 195.029 67.7462L217.794 68.0301C218.667 68.0406 219.371 68.9344 219.371 70.0174C219.371 71.1005 218.667 71.9837 217.794 71.9732L195.029 71.8155C194.104 71.8155 193.347 70.8902 193.347 69.7651Z" fill="#DFE0E3" fill-opacity="0.68"/>
								<path opacity="0.3" d="M175.629 66.0119C175.629 63.3727 177.427 61.2697 179.635 61.3223L185.566 61.4484C187.732 61.4905 189.477 63.625 189.477 66.2222V73.2567C189.477 75.8434 187.732 77.9464 185.566 77.9464H179.635C177.427 77.9464 175.629 75.8224 175.629 73.1831V66.0224V66.0119Z" fill="#44B0FF" fill-opacity="0.74"/>
								<path d="M177.638 93.4241C177.638 90.1329 179.877 87.4411 182.611 87.4095L220.255 86.9153C222.715 86.8838 224.702 89.3653 224.702 92.4462V103.634C224.702 106.725 222.715 109.312 220.255 109.417L182.611 111.068C179.867 111.184 177.638 108.618 177.638 105.338V93.4346V93.4241Z" fill="white"/>
								<path d="M199.077 98.7659C199.077 97.6513 199.824 96.726 200.728 96.6944L216.889 96.2738C217.762 96.2528 218.467 97.115 218.467 98.2086C218.467 99.3021 217.762 100.206 216.889 100.227L200.728 100.732C199.813 100.764 199.077 99.8804 199.077 98.7553V98.7659Z" fill="#DFE0E3" fill-opacity="0.68"/>
								<path opacity="0.3" d="M181.633 95.706C181.633 93.0878 183.41 90.9322 185.576 90.9007L191.422 90.7956C193.557 90.7535 195.271 92.8144 195.271 95.3801V102.362C195.271 104.928 193.557 107.083 191.422 107.167L185.576 107.399C183.4 107.483 181.633 105.432 181.633 102.814V95.706Z" fill="#FAA72C" fill-opacity="0.78"/>
								<path d="M213.03 113.14C213.03 107.493 216.689 102.783 221.158 102.635L243.524 101.857C247.677 101.71 251 105.948 251 111.3V139.154C251 144.516 247.667 149.196 243.524 149.616L221.158 151.887C216.689 152.34 213.03 148.134 213.03 142.487V113.129V113.14Z" fill="#1BCE7B" fill-opacity="0.78"/>
								<path fill-rule="evenodd" clip-rule="evenodd" d="M243.524 102.94L221.158 103.75C217.194 103.897 213.945 108.072 213.945 113.087V142.403C213.945 147.419 217.194 151.162 221.158 150.762L243.524 148.523C247.214 148.155 250.18 143.991 250.18 139.217V111.331C250.18 106.557 247.214 102.804 243.524 102.94ZM221.158 102.625C216.689 102.783 213.03 107.483 213.03 113.129V142.487C213.03 148.134 216.689 152.34 221.158 151.887L243.524 149.616C247.677 149.196 251 144.506 251 139.154V111.3C251 105.937 247.667 101.71 243.524 101.857L221.158 102.635V102.625Z" fill="white" fill-opacity="0.18"/>
								<path fill-rule="evenodd" clip-rule="evenodd" d="M224.082 136.314L222.368 136.451C221.558 136.514 220.896 135.736 220.896 134.716C220.896 133.696 221.558 132.813 222.368 132.75L224.082 132.624C224.681 130.426 226.301 128.765 228.204 128.628C230.107 128.491 231.684 129.911 232.273 132.003L241 131.341C241.768 131.278 242.399 132.045 242.399 133.034C242.399 134.022 241.779 134.884 241 134.948L232.273 135.652C231.684 137.829 230.086 139.5 228.204 139.658C226.322 139.816 224.692 138.417 224.082 136.314ZM231.327 122.908L222.357 123.476C221.548 123.528 220.885 122.74 220.885 121.709C220.885 120.679 221.548 119.817 222.357 119.764L231.327 119.249C231.916 117.083 233.503 115.474 235.364 115.369C237.226 115.264 238.782 116.704 239.36 118.776L241 118.681C241.768 118.639 242.399 119.406 242.399 120.405C242.399 121.404 241.779 122.245 241 122.298L239.36 122.403C238.782 124.548 237.215 126.168 235.364 126.294C233.514 126.42 231.916 125 231.327 122.908ZM235.364 122.645C236.143 122.592 236.784 121.741 236.784 120.742C236.784 119.743 236.153 118.965 235.364 119.007C234.576 119.049 233.945 119.911 233.945 120.91C233.945 121.909 234.586 122.698 235.364 122.645ZM228.193 135.978C228.992 135.915 229.634 135.042 229.634 134.022C229.634 133.002 228.992 132.235 228.193 132.298C227.394 132.361 226.742 133.234 226.742 134.254C226.742 135.273 227.394 136.041 228.193 135.978Z" fill="white" fill-opacity="0.9"/>
								<path fill-rule="evenodd" clip-rule="evenodd" d="M165.945 70.1017C164.515 70.0912 163.358 71.4371 163.358 73.109V86.442C163.358 88.7868 161.728 90.7111 159.709 90.7426L153.895 90.8372V89.607L159.709 89.5123C161.15 89.4913 162.328 88.1139 162.328 86.442V73.088C162.328 70.7432 163.958 68.861 165.955 68.882L171.591 68.9451V70.1438L165.955 70.0912L165.945 70.1017Z" fill="#44B0FF" fill-opacity="0.74"/>
								<path fill-rule="evenodd" clip-rule="evenodd" d="M168.784 100.227C167.364 100.269 166.218 101.657 166.218 103.319V108.156C166.218 110.49 164.599 112.456 162.59 112.54L153.905 112.929V111.699L162.59 111.321C164.02 111.258 165.188 109.859 165.188 108.187V103.35C165.188 101.016 166.807 99.0708 168.794 99.0182L177.658 98.7764V99.9646L168.794 100.227H168.784Z" fill="#44B0FF" fill-opacity="0.74"/>
								<defs>
									<filter id="filter0_d_348_93445" x="79.4698" y="4.6" width="164.117" height="145.909" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
										<feFlood flood-opacity="0" result="BackgroundImageFix"/>
										<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
										<feOffset dy="2.16"/>
										<feGaussianBlur stdDeviation="3.78"/>
										<feComposite in2="hardAlpha" operator="out"/>
										<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.02 0"/>
										<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_348_93445"/>
										<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_348_93445" result="shape"/>
									</filter>
								</defs>
							</svg>
							<p>{{loc('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_TEXT')}}</p>
						</div>
						<div ref="contentContainer"></div>
					</div>
				</Transition>
				<div v-if="isLoading" class="loader-spinner node-settings-content">
					<span class="dot dot1"></span>
					<span class="dot dot2"></span>
					<span class="dot dot3"></span>
				</div>
				<div class="node-settings-footer" v-show="hasSettings">
					<button class="ui-btn --air ui-btn-lg --style-outline-fill-accent ui-btn-no-caps" @click="handleFormSave">
						{{loc('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_SAVE')}}
					</button>
					<button class="ui-btn --air ui-btn-lg --style-outline ui-btn-no-caps" @click="handleFormCancel">
						{{loc('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CANCEL')}}
					</button>

					<div class="node-settings-document-selector" v-show="useDocumentContext">
						<BIcon
							name="document"
							:size="24"
							@click="handleDocumentSelector"
						/>
					</div>
				</div>
			</div>
		</transition>
	`,
};
