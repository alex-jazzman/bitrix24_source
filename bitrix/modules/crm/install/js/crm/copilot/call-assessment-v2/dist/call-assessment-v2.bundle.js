/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, main_core, ui_vue3, ui_vue3_mixins_locMixin, main_core_events, ui_notification, ui_vue3_components_button, ui_system_typography_vue, ui_entitySelector, ui_iconSet_api_vue, ui_system_input_vue, crm_ai_nameService, ui_switcher, ui_vue3_directives_hint, ui_vue3_components_switcher, ui_draganddrop_draggable, ui_vue3_components_hint, main_date, ui_vue3_components_richLoc) {
	'use strict';

	const ActionBar = ui_vue3.defineComponent({
		name: 'CrmCopilotCallAssessmentV2ActionBar',
		components: {
			UiButton: ui_vue3_components_button.Button
		},
		props: {
			variant: {
				type: String,
				default: 'edit',
				validator: value => ['edit', 'create', 'view'].includes(value)
			},
			generateDisabled: {
				type: Boolean,
				default: false
			}
		},
		emits: ['save', 'cancel', 'generate', 'edit'],
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize
			};
		},
		template: `
		<div class="crm-call-assessment-v2-action-bar">
			<template v-if="variant === 'create'">
				<UiButton
					:text="loc('CRM_CALL_ASSESSMENT_V2_CREATE_GENERATE_BUTTON')"
					:size="ButtonSize.LARGE"
					:style="AirButtonStyle.FILLED_BITRIX_GPT"
					:disabled="generateDisabled"
					@click="$emit('generate')"
				/>
				<UiButton
					:text="loc('CRM_CALL_ASSESSMENT_V2_BUTTON_CANCEL')"
					:size="ButtonSize.LARGE"
					:style="AirButtonStyle.PLAIN_NO_ACCENT"
					@click="$emit('cancel')"
				/>
			</template>
			<template v-else-if="variant === 'view'">
				<UiButton
					:text="loc('CRM_CALL_ASSESSMENT_V2_BUTTON_EDIT')"
					:size="ButtonSize.EXTRA_LARGE"
					:style="AirButtonStyle.OUTLINE"
					@click="$emit('edit')"
				/>
			</template>
			<template v-else>
				<UiButton
					:text="loc('CRM_CALL_ASSESSMENT_V2_BUTTON_SAVE')"
					:size="ButtonSize.LARGE"
					:style="AirButtonStyle.FILLED"
					@click="$emit('save')"
				/>
				<UiButton
					:text="loc('CRM_CALL_ASSESSMENT_V2_BUTTON_CANCEL')"
					:size="ButtonSize.LARGE"
					:style="AirButtonStyle.PLAIN_NO_ACCENT"
					@click="$emit('cancel')"
				/>
			</template>
		</div>
	`
	});

	const ENTITY_ID_PREFIX = 'CRM_CALL_ASSESSMENT_V2_FILTER_';
	const FilterTagSelector = ui_vue3.defineComponent({
		name: 'CrmCopilotCallAssessmentV2FilterTagSelector',
		props: {
			modelValue: {
				type: [Array, Number, Object],
				default: null
			},
			options: {
				type: Array,
				required: true
			},
			multi: {
				type: Boolean,
				default: false
			},
			entityIdSuffix: {
				type: String,
				required: true
			},
			highlightValues: {
				type: Array,
				default: () => []
			},
			highlightStyle: {
				type: Object,
				default: null
			},
			minSelected: {
				type: Number,
				default: 0
			}
		},
		emits: ['update:modelValue'],
		data() {
			return {
				tagSelector: null,
				isInSelectFlow: false
			};
		},
		computed: {
			entityId() {
				return ENTITY_ID_PREFIX + this.entityIdSuffix.toUpperCase();
			},
			selectedIds() {
				if (this.multi) {
					return Array.isArray(this.modelValue) ? this.modelValue : [];
				}
				const value = this.modelValue;
				return value ? [value] : [];
			}
		},
		mounted() {
			this.renderTagSelector();
		},
		beforeUnmount() {
			if (this.tagSelector !== null) {
				const dialog = this.tagSelector.getDialog?.();
				dialog?.destroy?.();
			}
			this.tagSelector = null;
		},
		methods: {
			buildDialogItems() {
				return this.options.map(option => {
					const styling = this.getStylingFor(option.value);
					return {
						id: option.value,
						entityId: this.entityId,
						title: option.label,
						tabs: 'recents',
						selected: this.selectedIds.includes(option.value),
						...(styling === null ? {} : {
							tagOptions: styling
						})
					};
				});
			},
			getStylingFor(value) {
				if (this.highlightStyle === null || !this.highlightValues.includes(value)) {
					return null;
				}
				return this.highlightStyle;
			},
			renderTagSelector() {
				const dialogItems = this.buildDialogItems();
				this.tagSelector = ui_vue3.markRaw(new ui_entitySelector.TagSelector({
					multiple: this.multi,
					addButtonCaption: main_core.Loc.getMessage('CRM_CALL_ASSESSMENT_V2_FILTER_ADD_BUTTON') ?? '',
					dialogOptions: {
						context: this.entityId,
						items: dialogItems,
						entities: [{
							id: this.entityId
						}],
						hideOnSelect: false,
						events: {
							'Item:onBeforeSelect': () => {
								this.isInSelectFlow = true;
							},
							'Item:onSelect': () => {
								this.isInSelectFlow = false;
							},
							'Item:onBeforeDeselect': event => this.handleBeforeDeselect(event)
						}
					},
					events: {
						onBeforeTagRemove: event => this.handleBeforeTagRemove(event),
						onTagAdd: () => this.handleChange(),
						onTagRemove: () => this.handleChange()
					}
				}));
				const container = this.$refs.container;
				if (container) {
					this.tagSelector.renderTo(container);
				}
			},
			handleBeforeDeselect(event) {
				if (this.minSelected <= 0 || this.isInSelectFlow) {
					return;
				}
				const tags = this.tagSelector?.getTags?.() ?? [];
				if (tags.length <= this.minSelected) {
					event.preventDefault();
				}
			},
			handleBeforeTagRemove(event) {
				if (this.minSelected <= 0 || this.isInSelectFlow) {
					return;
				}
				const tags = this.tagSelector?.getTags?.() ?? [];
				if (tags.length <= this.minSelected) {
					event.preventDefault();
				}
			},
			handleChange() {
				const tags = this.tagSelector?.getTags?.() ?? [];
				const ids = tags.map(tag => Number(tag.getId()));
				if (this.multi) {
					this.$emit('update:modelValue', ids);
				} else {
					this.$emit('update:modelValue', ids[0] ?? null);
				}
			}
		},
		template: `
		<div ref="container" class="crm-call-assessment-v2-filter-tag-selector"></div>
	`
	});

	const ClientTypesCard = ui_vue3.defineComponent({
		name: 'CrmCopilotCallAssessmentV2ClientTypesCard',
		components: {
			FilterTagSelector,
			HeadlineSm: ui_system_typography_vue.HeadlineSm,
			TextXs: ui_system_typography_vue.TextXs
		},
		props: {
			filters: {
				type: Array,
				required: true
			},
			minSelected: {
				type: Number,
				default: 0
			}
		},
		emits: ['update:filters'],
		data() {
			return {
				highlightStyle: {
					bgColor: 'var(--ui-color-design-tinted-success-bg)',
					textColor: 'var(--ui-color-design-tinted-success-content)'
				}
			};
		},
		computed: {
			clientFilter() {
				const filter = this.filters.find(f => f.code === 'clients');
				return filter && filter.multi ? filter : null;
			},
			callFilter() {
				const filter = this.filters.find(f => f.code === 'calls');
				return filter && !filter.multi ? filter : null;
			}
		},
		methods: {
			handleClientsChange(values) {
				const next = this.filters.map(filter => filter.code === 'clients' && filter.multi ? {
					...filter,
					values
				} : filter);
				this.$emit('update:filters', next);
			},
			handleCallChange(value) {
				const next = this.filters.map(filter => filter.code === 'calls' && !filter.multi ? {
					...filter,
					value: value ?? filter.value
				} : filter);
				this.$emit('update:filters', next);
			}
		},
		template: `
		<section class="crm-call-assessment-v2-client-types-card">
			<HeadlineSm class="crm-call-assessment-v2-client-types-card__heading" tag="h2" accent>
				{{ loc('CRM_CALL_ASSESSMENT_V2_AUDIENCE_HEADING') }}
			</HeadlineSm>
			<div class="crm-call-assessment-v2-client-types-card__row">
				<div class="crm-call-assessment-v2-client-types-card__field" v-if="clientFilter">
					<TextXs class="crm-call-assessment-v2-client-types-card__label">
						{{ loc('CRM_CALL_ASSESSMENT_V2_CLIENT_TYPES_LABEL') }}
					</TextXs>
					<FilterTagSelector
						multi
						entityIdSuffix="clients"
						:modelValue="clientFilter.values"
						:options="clientFilter.options"
						:highlightValues="clientFilter.highlightValues ?? []"
						:highlightStyle="highlightStyle"
						:minSelected="minSelected"
						@update:modelValue="handleClientsChange"
					/>
				</div>
				<div class="crm-call-assessment-v2-client-types-card__field" v-if="callFilter">
					<TextXs class="crm-call-assessment-v2-client-types-card__label">
						{{ loc('CRM_CALL_ASSESSMENT_V2_CALL_TYPES_LABEL') }}
					</TextXs>
					<FilterTagSelector
						entityIdSuffix="calls"
						:modelValue="callFilter.value"
						:options="callFilter.options"
						:minSelected="minSelected"
						@update:modelValue="handleCallChange"
					/>
				</div>
			</div>
		</section>
	`
	});

	function adjustTextareaHeight(input, maxHeight) {
		const textarea = input?.$el?.querySelector('textarea');
		if (!textarea) {
			return;
		}
		main_core.Dom.style(textarea, 'height', 'auto');
		const next = Math.min(textarea.scrollHeight, maxHeight);
		main_core.Dom.style(textarea, 'height', `${next}px`);
		main_core.Dom.style(textarea, 'overflowY', textarea.scrollHeight > maxHeight ? 'auto' : 'hidden');
	}

	const DRAFT_TEXTAREA_MIN_HEIGHT = 178;
	const DRAFT_TEXTAREA_MAX_HEIGHT = 480;
	const DraftCard = ui_vue3.defineComponent({
		name: 'CrmCopilotCallAssessmentV2DraftCard',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			BInput: ui_system_input_vue.BInput,
			HeadlineSm: ui_system_typography_vue.HeadlineSm,
			UiButton: ui_vue3_components_button.Button
		},
		props: {
			modelValue: {
				type: String,
				required: true
			}
		},
		emits: ['update:modelValue'],
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize,
				InputDesign: ui_system_input_vue.InputDesign,
				InputSize: ui_system_input_vue.InputSize,
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		computed: {
			isPasteDisabled() {
				return this.modelValue.trim() !== '';
			}
		},
		watch: {
			modelValue() {
				void this.$nextTick(() => this.adjustHeight());
			}
		},
		mounted() {
			const textarea = this.findTextarea();
			if (textarea) {
				main_core.Dom.style(textarea, 'minHeight', `${DRAFT_TEXTAREA_MIN_HEIGHT}px`);
			}
			void this.$nextTick(() => this.adjustHeight());
		},
		methods: {
			findTextarea() {
				const inputComponent = this.$refs.input;
				return inputComponent?.$el?.querySelector('textarea') ?? null;
			},
			adjustHeight() {
				adjustTextareaHeight(this.$refs.input, DRAFT_TEXTAREA_MAX_HEIGHT);
			},
			async handlePasteFromClipboard() {
				if (!navigator.clipboard?.readText) {
					ui_notification.UI.Notification.Center.notify({
						content: this.loc('CRM_CALL_ASSESSMENT_V2_CREATE_PASTE_UNSUPPORTED'),
						autoHideDelay: 5000
					});
					return;
				}
				try {
					const text = await navigator.clipboard.readText();
					if (text) {
						this.$emit('update:modelValue', text);
					}
				} catch (error) {
					ui_notification.UI.Notification.Center.notify({
						content: this.loc('CRM_CALL_ASSESSMENT_V2_CREATE_PASTE_FAILED'),
						autoHideDelay: 5000
					});
				}
			}
		},
		template: `
		<section class="crm-call-assessment-v2-draft-card">
			<HeadlineSm class="crm-call-assessment-v2-draft-card__heading" tag="h2" accent>
				{{ loc('CRM_CALL_ASSESSMENT_V2_CREATE_DRAFT_HEADING') }}
			</HeadlineSm>
			<div class="crm-call-assessment-v2-draft-card__inner">
				<UiButton
					class="crm-call-assessment-v2-draft-card__paste"
					:text="loc('CRM_CALL_ASSESSMENT_V2_CREATE_PASTE_BUTTON')"
					:size="ButtonSize.LARGE"
					:style="AirButtonStyle.FILLED"
					:leftIcon="Outline.COPY"
					:disabled="isPasteDisabled"
					@click="handlePasteFromClipboard"
				/>
				<BInput
					ref="input"
					class="crm-call-assessment-v2-draft-card__input"
					:modelValue="modelValue"
					:design="InputDesign.Primary"
					:size="InputSize.Lg"
					:rowsQuantity="6"
					resize="none"
					:placeholder="loc('CRM_CALL_ASSESSMENT_V2_CREATE_DRAFT_PLACEHOLDER')"
					stretched
					@update:modelValue="$emit('update:modelValue', $event)"
				/>
			</div>
		</section>
	`
	});

	const EditableTitle = ui_vue3.defineComponent({
		name: 'CrmCopilotCallAssessmentV2EditableTitle',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			HeadlineXl: ui_system_typography_vue.HeadlineXl,
			UiButton: ui_vue3_components_button.Button
		},
		props: {
			modelValue: {
				type: String,
				default: ''
			},
			isEditable: {
				type: Boolean,
				default: false
			}
		},
		emits: ['update:modelValue'],
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline,
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize
			};
		},
		data() {
			return {
				isEditing: false,
				draft: ''
			};
		},
		watch: {
			isEditable(value) {
				if (!value) {
					this.isEditing = false;
				}
			}
		},
		methods: {
			startEdit() {
				this.draft = this.modelValue;
				this.isEditing = true;
				void this.$nextTick(() => {
					const input = this.$refs.input;
					if (!input) {
						return;
					}
					input.focus();
					const length = input.value.length;
					input.setSelectionRange(length, length);
				});
			},
			finishEdit() {
				if (!this.isEditing) {
					return;
				}
				const trimmed = this.draft.trim();
				if (trimmed !== '' && trimmed !== this.modelValue) {
					this.$emit('update:modelValue', trimmed);
				}
				this.isEditing = false;
			},
			cancelEdit() {
				this.isEditing = false;
			},
			handleKeydown(event) {
				if (event.key === 'Enter') {
					event.preventDefault();
					this.finishEdit();
				} else if (event.key === 'Escape') {
					event.preventDefault();
					this.cancelEdit();
				}
			}
		},
		template: `
		<div class="crm-call-assessment-v2-editable-title">
			<div v-if="isEditing" class="crm-call-assessment-v2-editable-title__edit">
				<input
					ref="input"
					type="text"
					class="crm-call-assessment-v2-editable-title__input"
					v-model="draft"
					@keydown="handleKeydown"
				/>
				<UiButton
					class="crm-call-assessment-v2-editable-title__button"
					:size="ButtonSize.EXTRA_SMALL"
					:style="AirButtonStyle.FILLED"
					:leftIcon="Outline.CHECK_M"
					@click="finishEdit"
				/>
				<UiButton
					class="crm-call-assessment-v2-editable-title__button"
					:size="ButtonSize.EXTRA_SMALL"
					:style="AirButtonStyle.OUTLINE_NO_ACCENT"
					:leftIcon="Outline.CROSS_M"
					@click="cancelEdit"
				/>
			</div>
			<template v-else>
				<HeadlineXl class="crm-call-assessment-v2-editable-title__text" tag="h1">
					{{ modelValue }}
				</HeadlineXl>
				<button
					v-if="isEditable"
					type="button"
					class="crm-call-assessment-v2-editable-title__pencil"
					:aria-label="loc('CRM_CALL_ASSESSMENT_V2_EDITABLE_TITLE_EDIT')"
					@click="startEdit"
				>
					<BIcon :name="Outline.EDIT_M" :size="20"/>
				</button>
			</template>
		</div>
	`
	});

	const HINT_MAX_WIDTH = 479;
	function createCalloutHint(params) {
		const title = main_core.Text.encode(params.title);
		const description = main_core.Text.encode(params.description);
		return {
			html: `
			<div class="crm-call-assessment-v2-callout-hint__body">
				<div class="crm-call-assessment-v2-callout-hint__icon" aria-hidden="true"></div>
				<div class="crm-call-assessment-v2-callout-hint__text">
					<div class="crm-call-assessment-v2-callout-hint__title">${title}</div>
					<div class="crm-call-assessment-v2-callout-hint__desc">${description}</div>
				</div>
			</div>
		`,
			popupOptions: {
				className: `crm-call-assessment-v2-callout-hint --variant-${params.variant}`,
				maxWidth: HINT_MAX_WIDTH
			}
		};
	}

	const EditorToolbar = ui_vue3.defineComponent({
		name: 'CrmCopilotCallAssessmentV2EditorToolbar',
		directives: {
			hint: ui_vue3_directives_hint.hint
		},
		components: {
			EditableTitle,
			TextSm: ui_system_typography_vue.TextSm,
			Switcher: ui_vue3_components_switcher.Switcher
		},
		props: {
			isEditMode: {
				type: Boolean,
				default: false
			},
			isCreateMode: {
				type: Boolean,
				default: false
			},
			isLoadingMode: {
				type: Boolean,
				default: false
			},
			isAiToggleEnabled: {
				type: Boolean,
				required: true
			},
			canToggleAi: {
				type: Boolean,
				default: false
			},
			title: {
				type: String,
				default: ''
			}
		},
		emits: ['aiToggleChanged', 'update:title'],
		setup() {
			return {
				airSwitcherStyle: ui_switcher.AirSwitcherStyle.SOLID
			};
		},
		computed: {
			showAiToggle() {
				return !this.isLoadingMode && this.canToggleAi;
			},
			displayedTitle() {
				if (this.isCreateMode || this.isLoadingMode) {
					return this.loc('CRM_CALL_ASSESSMENT_V2_PAGE_TITLE');
				}
				return this.title;
			},
			aiHintOptions() {
				const copilotReplacement = {
					'#COPILOT_NAME#': crm_ai_nameService.NameService.copilotName()
				};
				return createCalloutHint({
					variant: 'ai-update',
					title: this.loc('CRM_CALL_ASSESSMENT_V2_AI_HINT_TITLE'),
					description: this.loc('CRM_CALL_ASSESSMENT_V2_AI_HINT_DESCRIPTION', copilotReplacement)
				});
			}
		},
		methods: {
			handleToggleAi(value) {
				this.$emit('aiToggleChanged', value);
			},
			handleTitleUpdate(value) {
				this.$emit('update:title', value);
			}
		},
		template: `
		<div class="crm-call-assessment-v2-toolbar">
			<EditableTitle
				:modelValue="displayedTitle"
				:isEditable="isEditMode"
				@update:modelValue="handleTitleUpdate"
			/>
			<div class="crm-call-assessment-v2-toolbar__controls">
				<div v-if="showAiToggle" class="crm-call-assessment-v2-toolbar__ai-pill" v-hint="aiHintOptions">
					<TextSm class="crm-call-assessment-v2-toolbar__ai-label">
						{{ loc('CRM_CALL_ASSESSMENT_V2_TOGGLE_AUTOFILL') }}
					</TextSm>
					<span class="crm-call-assessment-v2-toolbar__ai-divider" aria-hidden="true"></span>
					<span class="crm-call-assessment-v2-toolbar__ai-toggle">
						<Switcher
							:isChecked="isAiToggleEnabled"
							:options="{ size: 'extra-small', useAirDesign: true, style: airSwitcherStyle }"
							@check="handleToggleAi(true)"
							@uncheck="handleToggleAi(false)"
						/>
					</span>
				</div>
			</div>
		</div>
	`
	});

	const LoadingState = ui_vue3.defineComponent({
		name: 'CrmCopilotCallAssessmentV2LoadingState',
		components: {
			HeadlineLg: ui_system_typography_vue.HeadlineLg
		},
		computed: {
			copilotNameReplacement() {
				return {
					'#COPILOT_NAME#': crm_ai_nameService.NameService.copilotName()
				};
			}
		},
		template: `
		<section class="crm-call-assessment-v2-loading-state">
			<video class="crm-call-assessment-v2-loading-state__mascot" autoplay loop muted playsinline>
				<source src="/bitrix/js/crm/copilot/call-assessment-v2/images/loading-mascot.webm" type="video/webm"/>
			</video>
			<HeadlineLg accent class="crm-call-assessment-v2-loading-state__text" tag="p">
				{{ loc('CRM_CALL_ASSESSMENT_V2_CREATE_LOADING_TEXT', copilotNameReplacement) }}
			</HeadlineLg>
		</section>
	`
	});

	const DESCRIPTION_MAX_HEIGHT = 200;
	const ScenarioStepEdit = ui_vue3.defineComponent({
		name: 'CrmCopilotCallAssessmentV2ScenarioStepEdit',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			BInput: ui_system_input_vue.BInput
		},
		props: {
			criterionKey: {
				type: String,
				required: true
			},
			title: {
				type: String,
				required: true
			},
			description: {
				type: String,
				default: ''
			}
		},
		emits: ['update:title', 'update:description', 'remove'],
		setup() {
			return {
				InputDesign: ui_system_input_vue.InputDesign,
				InputSize: ui_system_input_vue.InputSize,
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		watch: {
			description() {
				void this.$nextTick(() => this.adjustDescriptionHeight());
			}
		},
		mounted() {
			void this.$nextTick(() => this.adjustDescriptionHeight());
		},
		methods: {
			adjustDescriptionHeight() {
				adjustTextareaHeight(this.$refs.descriptionInput, DESCRIPTION_MAX_HEIGHT);
			}
		},
		template: `
		<div class="crm-call-assessment-v2-step-edit" :data-criterion-key="criterionKey">
			<button
				type="button"
				class="crm-call-assessment-v2-step-edit__handle"
				:title="loc('CRM_CALL_ASSESSMENT_V2_DRAG_HINT')"
			>
				<BIcon :name="Outline.DRAG_M" :size="24"/>
			</button>
			<div class="crm-call-assessment-v2-step-edit__card">
				<BInput
					class="crm-call-assessment-v2-step-edit__title-input"
					:modelValue="title"
					:design="InputDesign.Naked"
					:size="InputSize.Lg"
					:placeholder="loc('CRM_CALL_ASSESSMENT_V2_STEP_TITLE_PLACEHOLDER')"
					stretched
					@update:modelValue="$emit('update:title', $event)"
				/>
				<BInput
					ref="descriptionInput"
					class="crm-call-assessment-v2-step-edit__description-input"
					:modelValue="description"
					:design="InputDesign.Naked"
					:size="InputSize.Md"
					:rowsQuantity="2"
					resize="none"
					:placeholder="loc('CRM_CALL_ASSESSMENT_V2_STEP_DESCRIPTION_PLACEHOLDER')"
					stretched
					@update:modelValue="$emit('update:description', $event)"
				/>
			</div>
			<button
				type="button"
				class="crm-call-assessment-v2-step-edit__remove"
				:title="loc('CRM_CALL_ASSESSMENT_V2_REMOVE_CRITERION')"
				@click="$emit('remove')"
			>
				<BIcon :name="Outline.TRASHCAN" :size="24" color="var(--ui-color-accent-main-alert)"/>
			</button>
		</div>
	`
	});

	const ScenarioStepView = ui_vue3.defineComponent({
		name: 'CrmCopilotCallAssessmentV2ScenarioStepView',
		components: {
			HeadlineXs: ui_system_typography_vue.HeadlineXs,
			TextXs: ui_system_typography_vue.TextXs
		},
		props: {
			index: {
				type: Number,
				required: true
			},
			title: {
				type: String,
				required: true
			},
			description: {
				type: String,
				default: ''
			}
		},
		template: `
		<div class="crm-call-assessment-v2-step-view">
			<div class="crm-call-assessment-v2-step-view__bullet">
				<span class="crm-call-assessment-v2-step-view__bullet-number">
					{{ index }}
				</span>
			</div>
			<div class="crm-call-assessment-v2-step-view__body">
				<HeadlineXs class="crm-call-assessment-v2-step-view__title" tag="div">
					{{ title }}
				</HeadlineXs>
				<TextXs v-if="description" class="crm-call-assessment-v2-step-view__description" tag="div">
					{{ description }}
				</TextXs>
			</div>
		</div>
	`
	});

	const SORT_STEP = 100;
	let newCriterionCounter = 0;
	const getCriterionKey = criterion => criterion.id !== null ? `id-${criterion.id}` : `tmp-${criterion.tempKey}`;
	const ScenarioCard = ui_vue3.defineComponent({
		name: 'CrmCopilotCallAssessmentV2ScenarioCard',
		directives: {
			hint: ui_vue3_directives_hint.hint
		},
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			HeadlineSm: ui_system_typography_vue.HeadlineSm,
			Hint: ui_vue3_components_hint.Hint,
			ScenarioStepEdit,
			ScenarioStepView,
			TextMd: ui_system_typography_vue.TextMd,
			TransitionGroup: ui_vue3.TransitionGroup,
			UiButton: ui_vue3_components_button.Button
		},
		props: {
			isEditMode: {
				type: Boolean,
				default: false
			},
			criteria: {
				type: Array,
				required: true
			}
		},
		emits: ['update:criteria'],
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize,
				Outline: ui_iconSet_api_vue.Outline,
				getCriterionKey
			};
		},
		data() {
			return {
				draggable: null
			};
		},
		computed: {
			sortedCriteria() {
				return [...this.criteria].sort((a, b) => a.sort - b.sort);
			},
			headingHint() {
				const copilotReplacement = {
					'#COPILOT_NAME#': crm_ai_nameService.NameService.copilotName()
				};
				return createCalloutHint({
					variant: 'step',
					title: this.loc('CRM_CALL_ASSESSMENT_V2_CRITERIA_HINT_TITLE'),
					description: this.loc('CRM_CALL_ASSESSMENT_V2_CRITERIA_HINT_DESCRIPTION', copilotReplacement)
				});
			}
		},
		watch: {
			isEditMode(value) {
				if (value) {
					void this.$nextTick(() => this.initDraggable());
				} else {
					this.destroyDraggable();
				}
			}
		},
		mounted() {
			if (this.isEditMode) {
				void this.$nextTick(() => this.initDraggable());
			}
		},
		beforeUnmount() {
			this.destroyDraggable();
		},
		methods: {
			initDraggable() {
				const container = this.$refs.list;
				if (this.draggable || !container) {
					return;
				}
				this.draggable = ui_vue3.markRaw(new ui_draganddrop_draggable.Draggable({
					container,
					draggable: '.crm-call-assessment-v2-step-edit',
					dragElement: '.crm-call-assessment-v2-step-edit__handle',
					type: ui_draganddrop_draggable.Draggable.MOVE
				}));
				this.draggable.subscribe('end', () => this.handleDrop());
			},
			destroyDraggable() {
				this.draggable?.destroy();
				this.draggable = null;
			},
			handleDrop() {
				const list = this.$refs.list;
				if (!list) {
					return;
				}
				const nodes = Array.from(list.querySelectorAll('[data-criterion-key]'));
				const next = nodes.map((node, index) => {
					const key = node.dataset.criterionKey;
					const criterion = this.criteria.find(item => getCriterionKey(item) === key);
					if (!criterion) {
						return null;
					}
					return {
						...criterion,
						sort: (index + 1) * SORT_STEP
					};
				}).filter(item => item !== null);
				this.$emit('update:criteria', next);
			},
			handleStepUpdate(key, patch) {
				const next = this.criteria.map(item => getCriterionKey(item) === key ? {
					...item,
					...patch
				} : item);
				this.$emit('update:criteria', next);
			},
			handleStepRemove(key) {
				if (this.criteria.length <= 1) {
					ui_notification.UI.Notification.Center.notify({
						content: main_core.Loc.getMessage('CRM_CALL_ASSESSMENT_V2_MIN_CRITERIA_NOTICE') ?? '',
						autoHideDelay: 5000
					});
					return;
				}
				const next = this.criteria.filter(item => getCriterionKey(item) !== key);
				this.$emit('update:criteria', next);
			},
			handleAddCriterion(position = 'bottom') {
				let nextSort;
				if (this.criteria.length === 0) {
					nextSort = SORT_STEP;
				} else if (position === 'top') {
					nextSort = Math.min(...this.criteria.map(item => item.sort)) - SORT_STEP;
				} else {
					nextSort = Math.max(...this.criteria.map(item => item.sort)) + SORT_STEP;
				}
				newCriterionCounter += 1;
				this.$emit('update:criteria', [...this.criteria, {
					id: null,
					tempKey: `new-${newCriterionCounter}`,
					title: '',
					description: '',
					sort: nextSort
				}]);
			}
		},
		template: `
		<section class="crm-call-assessment-v2-scenario-card">
			<header v-if="isEditMode" class="crm-call-assessment-v2-scenario-card__header">
				<div class="crm-call-assessment-v2-scenario-card__header-text">
					<div class="crm-call-assessment-v2-scenario-card__heading-row">
						<HeadlineSm class="crm-call-assessment-v2-scenario-card__heading" tag="h2" accent>
							{{ loc('CRM_CALL_ASSESSMENT_V2_CRITERIA_HEADING') }}
						</HeadlineSm>
						<BIcon
							class="crm-call-assessment-v2-scenario-card__heading-info"
							:name="Outline.INFO_CIRCLE"
							:size="20"
							v-hint="headingHint"
						/>
					</div>
					<TextMd class="crm-call-assessment-v2-scenario-card__subtitle" tag="p">
						{{ loc('CRM_CALL_ASSESSMENT_V2_CRITERIA_SUBTITLE') }}
					</TextMd>
				</div>
				<UiButton
					v-if="isEditMode"
					class="crm-call-assessment-v2-scenario-card__add"
					:text="loc('CRM_CALL_ASSESSMENT_V2_ADD_CRITERION')"
					:size="ButtonSize.MEDIUM"
					:style="AirButtonStyle.OUTLINE"
					:leftIcon="Outline.PLUS_M"
					@click="handleAddCriterion('top')"
				/>
			</header>
			<div v-if="isEditMode" ref="list" class="crm-call-assessment-v2-scenario-card__list">
				<TransitionGroup name="crm-call-assessment-v2-scenario-card-step">
					<ScenarioStepEdit
						v-for="criterion in sortedCriteria"
						:key="getCriterionKey(criterion)"
						:criterionKey="getCriterionKey(criterion)"
						:title="criterion.title"
						:description="criterion.description"
						@update:title="handleStepUpdate(getCriterionKey(criterion), { title: $event })"
						@update:description="handleStepUpdate(getCriterionKey(criterion), { description: $event })"
						@remove="handleStepRemove(getCriterionKey(criterion))"
					/>
				</TransitionGroup>
				<UiButton
					class="crm-call-assessment-v2-scenario-card__add-bottom"
					:text="loc('CRM_CALL_ASSESSMENT_V2_ADD_CRITERION')"
					:size="ButtonSize.LARGE"
					:style="AirButtonStyle.OUTLINE"
					:leftIcon="Outline.PLUS_M"
					@click="handleAddCriterion('bottom')"
				/>
			</div>
			<div v-else class="crm-call-assessment-v2-scenario-card__list">
				<ScenarioStepView
					v-for="(criterion, index) in sortedCriteria"
					:key="getCriterionKey(criterion)"
					:index="index + 1"
					:title="criterion.title"
					:description="criterion.description"
				/>
			</div>
		</section>
	`
	});

	const ScriptInfoCard = ui_vue3.defineComponent({
		name: 'CrmCopilotCallAssessmentV2ScriptInfoCard',
		directives: {
			hint: ui_vue3_directives_hint.hint
		},
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			HeadlineMd: ui_system_typography_vue.HeadlineMd,
			Hint: ui_vue3_components_hint.Hint,
			RichLoc: ui_vue3_components_richLoc.RichLoc,
			TextSm: ui_system_typography_vue.TextSm,
			TextXs: ui_system_typography_vue.TextXs
		},
		props: {
			isEditMode: {
				type: Boolean,
				default: false
			},
			assessmentId: {
				type: Number,
				default: null
			},
			description: {
				type: String,
				required: true
			},
			filters: {
				type: Array,
				required: true
			},
			updatedAt: {
				type: Number,
				default: null
			},
			processedCallsCount: {
				type: Number,
				default: 0
			},
			isGeneratedByCopilot: {
				type: Boolean,
				default: false
			}
		},
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		data() {
			return {
				isClientTypesTruncated: false
			};
		},
		computed: {
			copilotReplacement() {
				return {
					'#COPILOT_NAME#': crm_ai_nameService.NameService.copilotName()
				};
			},
			clientFilter() {
				const filter = this.filters.find(f => f.code === 'clients');
				return filter && filter.multi ? filter : null;
			},
			callFilter() {
				const filter = this.filters.find(f => f.code === 'calls');
				return filter && !filter.multi ? filter : null;
			},
			clientTypesText() {
				if (!this.clientFilter || this.clientFilter.values.length === 0) {
					return '';
				}
				return this.clientFilter.options.filter(option => this.clientFilter.values.includes(option.value)).map(option => option.label).join(', ');
			},
			callTypeText() {
				if (!this.callFilter) {
					return '';
				}
				const option = this.callFilter.options.find(entry => entry.value === this.callFilter.value);
				return option ? option.label : '';
			},
			processedCallsText() {
				if (!this.processedCallsCount) {
					return '';
				}
				return main_core.Loc.getMessagePlural('CRM_CALL_ASSESSMENT_V2_INFO_PROCESSED_CALLS', this.processedCallsCount, {
					'#COUNT#': String(this.processedCallsCount)
				}) ?? '';
			},
			updatedAtLabel() {
				if (!this.updatedAt) {
					return '';
				}
				const relative = main_date.DateTimeFormat.formatLastActivityDate(this.updatedAt);
				return this.loc('CRM_CALL_ASSESSMENT_V2_INFO_UPDATED', {
					'#DATE#': relative
				});
			},
			clientTypesHint() {
				return this.isClientTypesTruncated ? {
					text: this.clientTypesText
				} : null;
			},
			attributionHint() {
				return createCalloutHint({
					variant: 'attribution',
					title: this.loc('CRM_CALL_ASSESSMENT_V2_INFO_GENERATED_HINT_TITLE', this.copilotReplacement),
					description: this.loc('CRM_CALL_ASSESSMENT_V2_INFO_GENERATED_HINT_DESCRIPTION')
				});
			},
			callsListUrl() {
				if (!this.assessmentId || this.assessmentId <= 0) {
					return '';
				}
				return `/crm/copilot-call-assessment/${this.assessmentId}/calls/`;
			}
		},
		watch: {
			isEditMode(value) {
				if (value) {
					this.isClientTypesTruncated = false;
				} else {
					void this.$nextTick(() => this.checkClientTypesTruncation());
				}
			},
			clientTypesText() {
				void this.$nextTick(() => this.checkClientTypesTruncation());
			}
		},
		mounted() {
			if (!this.isEditMode) {
				void this.$nextTick(() => this.checkClientTypesTruncation());
			}
		},
		methods: {
			handleCallsListClick(event) {
				if (!this.callsListUrl) {
					return;
				}
				event.preventDefault();
				const sidePanel = top?.BX?.SidePanel?.Instance;
				sidePanel?.open(this.callsListUrl, {
					width: 1215,
					cacheable: false,
					allowChangeHistory: false
				});
			},
			checkClientTypesTruncation() {
				const el = this.$refs.clientTypesTextRef;
				if (!el) {
					this.isClientTypesTruncated = false;
					return;
				}
				this.isClientTypesTruncated = el.scrollWidth > el.clientWidth;
			}
		},
		template: `
		<section class="crm-call-assessment-v2-info-card">
			<template v-if="!isEditMode">
				<div class="crm-call-assessment-v2-info-card__title-row">
					<BIcon class="crm-call-assessment-v2-info-card__title-icon" :name="Outline.AI_STARS" :size="24"/>
					<HeadlineMd class="crm-call-assessment-v2-info-card__title" tag="h2">
						{{ loc('CRM_CALL_ASSESSMENT_V2_SCRIPT_SECTION_TITLE') }}
					</HeadlineMd>
				</div>
				<TextSm class="crm-call-assessment-v2-info-card__description">
					{{ description }}
				</TextSm>
				<div class="crm-call-assessment-v2-info-card__info-chips">
					<span
						v-if="isGeneratedByCopilot"
						v-hint="attributionHint"
						class="crm-call-assessment-v2-info-card__info-chip --attribution"
					>
						<BIcon
							class="crm-call-assessment-v2-info-card__info-chip-icon --gradient"
							:name="Outline.INFO_CIRCLE"
							:size="20"
						/>
						<span class="crm-call-assessment-v2-info-card__info-chip-text --gradient">
							{{ loc('CRM_CALL_ASSESSMENT_V2_INFO_GENERATED', copilotReplacement) }}
						</span>
					</span>
					<span v-if="processedCallsCount > 0" class="crm-call-assessment-v2-info-card__info-chip">
						<BIcon class="crm-call-assessment-v2-info-card__info-chip-icon" :name="Outline.CRM" :size="20"/>
						<RichLoc
							class="crm-call-assessment-v2-info-card__info-chip-text"
							tag="span"
							:text="processedCallsText"
							placeholder="[link]"
						>
							<template #link="{ text }">
								<a
									v-if="callsListUrl"
									class="crm-call-assessment-v2-info-card__info-chip-link"
									:href="callsListUrl"
									@click="handleCallsListClick"
								>{{ text }}</a>
								<span v-else class="crm-call-assessment-v2-info-card__info-chip-link">{{ text }}</span>
							</template>
						</RichLoc>
					</span>
					<span v-if="updatedAt" class="crm-call-assessment-v2-info-card__info-chip">
						<BIcon class="crm-call-assessment-v2-info-card__info-chip-icon" :name="Outline.REFRESH" :size="20"/>
						<span class="crm-call-assessment-v2-info-card__info-chip-text">
							{{ updatedAtLabel }}
						</span>
					</span>
					<span
						v-if="clientTypesText"
						v-hint="clientTypesHint"
						class="crm-call-assessment-v2-info-card__info-chip --truncate"
					>
						<BIcon class="crm-call-assessment-v2-info-card__info-chip-icon" :name="Outline.THREE_PERSONS" :size="20"/>
						<span ref="clientTypesTextRef" class="crm-call-assessment-v2-info-card__info-chip-text">
							{{ clientTypesText }}
						</span>
					</span>
					<span v-if="callTypeText" class="crm-call-assessment-v2-info-card__info-chip">
						<BIcon class="crm-call-assessment-v2-info-card__info-chip-icon" :name="Outline.PHONE_UP" :size="20"/>
						<span class="crm-call-assessment-v2-info-card__info-chip-text">
							{{ callTypeText }}
						</span>
					</span>
				</div>
			</template>
		</section>
	`
	});

	const MIN_USER_TEXT_LENGTH = 100;
	const App = ui_vue3.defineComponent({
		name: 'CrmCopilotCallAssessmentV2App',
		components: {
			ActionBar,
			ClientTypesCard,
			DraftCard,
			EditorToolbar,
			LoadingState,
			ScenarioCard,
			ScriptInfoCard
		},
		props: {
			initialData: {
				type: Object,
				required: true
			},
			settings: {
				type: Object,
				required: true
			},
			events: {
				type: Object,
				default: () => ({})
			}
		},
		data() {
			const isCopy = this.settings.isCopy;
			let initialEditMode = 'edit';
			if (!isCopy) {
				initialEditMode = this.settings.isNewScript ? 'create' : 'view';
			}
			const initialMode = this.settings.isPendingGeneration ? 'loading' : initialEditMode;
			const data = this.cloneData(this.initialData);
			if (isCopy) {
				data.id = null;
			}
			return {
				mode: initialMode,
				data,
				snapshot: this.cloneData(data),
				userText: '',
				isGenerating: this.settings.isPendingGeneration,
				isSaving: false
			};
		},
		computed: {
			title() {
				return this.data.title;
			},
			description() {
				return this.data.description;
			},
			filters() {
				return this.data.filters;
			},
			criteria() {
				return this.data.criteria;
			},
			isEditMode() {
				return this.mode === 'edit';
			},
			isCreateMode() {
				return this.mode === 'create';
			},
			isLoadingMode() {
				return this.mode === 'loading';
			},
			hasUserText() {
				return this.userText.trim() !== '';
			},
			canToggleAi() {
				return Boolean(this.data.id) && !this.settings.readOnly;
			}
		},
		mounted() {
			if (this.settings.isNewScript || this.settings.isPendingGeneration) {
				main_core_events.EventEmitter.subscribe('onPullEvent-crm', this.handlePullEvent);
			}
		},
		beforeUnmount() {
			main_core_events.EventEmitter.unsubscribe('onPullEvent-crm', this.handlePullEvent);
		},
		methods: {
			cloneData(source) {
				return JSON.parse(JSON.stringify(source));
			},
			handlePullEvent(event) {
				const data = event?.data;
				if (!Array.isArray(data) || data.length < 2) {
					return;
				}
				const [command, payload] = data;
				if (command !== 'call_assessment_create_complete') {
					return;
				}
				const assessmentId = Number(payload?.assessmentId);
				if (!Number.isFinite(assessmentId) || assessmentId <= 0) {
					return;
				}
				const expectedId = Number(this.data.id);
				if (!Number.isFinite(expectedId) || expectedId <= 0 || assessmentId !== expectedId) {
					return;
				}
				void this.loadGeneratedScript(assessmentId);
			},
			loadGeneratedScript(assessmentId) {
				return main_core.ajax.runAction('crm.copilot.callassessment.getScriptData', {
					data: {
						id: assessmentId
					}
				}).then(response => {
					const next = response?.data?.data;
					if (!next) {
						throw new Error('Empty response');
					}
					this.data = this.cloneData(next);
					this.snapshot = this.cloneData(next);
					this.userText = '';
					this.isGenerating = false;
					this.mode = 'view';
				}).catch(() => {
					this.isGenerating = false;
					this.mode = 'view';
					ui_notification.UI.Notification.Center.notify({
						content: main_core.Loc.getMessage('CRM_CALL_ASSESSMENT_V2_CREATE_LOAD_GENERATED_ERROR') ?? '',
						autoHideDelay: 5000
					});
				});
			},
			handleEnterEdit() {
				this.snapshot = this.cloneData(this.data);
				this.mode = 'edit';
			},
			handleSave() {
				if (this.isSaving) {
					return;
				}
				const nonEmptyCriteria = this.data.criteria.filter(criterion => criterion.title.trim() !== '' && criterion.description.trim() !== '');
				if (nonEmptyCriteria.length === 0) {
					ui_notification.UI.Notification.Center.notify({
						content: main_core.Loc.getMessage('CRM_CALL_ASSESSMENT_V2_MIN_CRITERIA_NOTICE') ?? '',
						autoHideDelay: 5000
					});
					return;
				}
				const clientFilter = this.data.filters.find(f => f.code === 'clients');
				const callFilter = this.data.filters.find(f => f.code === 'calls');
				const clientTypeIds = clientFilter && clientFilter.multi ? clientFilter.values : [];
				const callTypeId = callFilter && !callFilter.multi ? callFilter.value : null;
				if (clientTypeIds.length === 0) {
					ui_notification.UI.Notification.Center.notify({
						content: main_core.Loc.getMessage('CRM_CALL_ASSESSMENT_V2_CLIENT_TYPES_REQUIRED') ?? '',
						autoHideDelay: 5000
					});
					return;
				}
				const payload = {
					id: this.data.id,
					data: {
						title: this.data.title,
						description: this.data.description,
						clientTypeIds,
						callTypeId,
						isAiImprovementEnabled: this.data.isAiImprovementEnabled
					},
					criteria: nonEmptyCriteria.map(criterion => ({
						id: criterion.id,
						title: criterion.title,
						description: criterion.description,
						sort: criterion.sort
					}))
				};
				this.isSaving = true;
				main_core.ajax.runAction('crm.copilot.callassessment.save', {
					data: payload
				}).then(response => {
					const next = response?.data?.data;
					if (next) {
						this.data = this.cloneData(next);
						this.snapshot = this.cloneData(next);
					} else {
						this.snapshot = this.cloneData(this.data);
					}
					this.mode = 'view';
					this.isSaving = false;
					this.events.onSave?.(this.cloneData(this.data));
				}).catch(() => {
					this.isSaving = false;
					ui_notification.UI.Notification.Center.notify({
						content: main_core.Loc.getMessage('CRM_CALL_ASSESSMENT_V2_SAVE_ERROR') ?? '',
						autoHideDelay: 5000
					});
				});
			},
			handleCancel() {
				this.data = this.cloneData(this.snapshot);
				this.mode = 'view';
				this.events.onCancel?.();
			},
			handleAiToggleChanged(value) {
				const previous = this.data.isAiImprovementEnabled;
				this.data.isAiImprovementEnabled = value;
				this.snapshot.isAiImprovementEnabled = value;
				if (!this.data.id) {
					return;
				}
				main_core.ajax.runAction('crm.copilot.callassessment.toggleAutofill', {
					data: {
						id: this.data.id,
						isEnabled: value ? 1 : 0
					}
				}).catch(() => {
					this.data.isAiImprovementEnabled = previous;
					this.snapshot.isAiImprovementEnabled = previous;
					ui_notification.UI.Notification.Center.notify({
						content: main_core.Loc.getMessage('CRM_CALL_ASSESSMENT_V2_AI_TOGGLE_ERROR') ?? '',
						autoHideDelay: 5000
					});
				});
			},
			handleClose() {
				const sidePanel = top?.BX?.SidePanel?.Instance;
				sidePanel?.close();
			},
			handleGenerate() {
				if (this.isGenerating) {
					return;
				}
				if (this.userText.trim().length < MIN_USER_TEXT_LENGTH) {
					ui_notification.UI.Notification.Center.notify({
						content: main_core.Loc.getMessage('CRM_CALL_ASSESSMENT_V2_CREATE_VALIDATION_MIN_LENGTH', {
							'#MIN#': String(MIN_USER_TEXT_LENGTH)
						}) ?? '',
						autoHideDelay: 5000
					});
					return;
				}
				const filters = this.data.filters;
				const clientFilter = filters.find(f => f.code === 'clients');
				const callFilter = filters.find(f => f.code === 'calls');
				const clientTypeIds = clientFilter && clientFilter.multi ? clientFilter.values : [];
				if (clientTypeIds.length === 0) {
					ui_notification.UI.Notification.Center.notify({
						content: main_core.Loc.getMessage('CRM_CALL_ASSESSMENT_V2_CLIENT_TYPES_REQUIRED') ?? '',
						autoHideDelay: 5000
					});
					return;
				}
				const callTypeId = callFilter && !callFilter.multi ? callFilter.value : null;
				this.isGenerating = true;
				main_core.ajax.runAction('crm.copilot.callassessment.generateFromDialog', {
					data: {
						userText: this.userText,
						scriptName: this.data.title,
						clientTypeIds,
						callTypeId
					}
				}).then(response => {
					const assessmentId = Number(response?.data?.assessmentId);
					if (Number.isFinite(assessmentId) && assessmentId > 0) {
						this.data.id = assessmentId;
					}
					this.mode = 'loading';
				}).catch(() => {
					this.isGenerating = false;
					ui_notification.UI.Notification.Center.notify({
						content: main_core.Loc.getMessage('CRM_CALL_ASSESSMENT_V2_CREATE_GENERATE_ERROR') ?? '',
						autoHideDelay: 5000
					});
				});
			}
		},
		template: `
		<div class="crm-call-assessment-v2">
			<EditorToolbar
				:isEditMode="isEditMode"
				:isCreateMode="isCreateMode"
				:isLoadingMode="isLoadingMode"
				:isAiToggleEnabled="data.isAiImprovementEnabled"
				:canToggleAi="canToggleAi"
				v-model:title="data.title"
				@aiToggleChanged="handleAiToggleChanged"
			/>
			<div class="crm-call-assessment-v2__body">
				<template v-if="isLoadingMode">
					<LoadingState/>
				</template>
				<template v-else-if="isCreateMode">
					<DraftCard v-model="userText"/>
					<ClientTypesCard v-model:filters="data.filters" :minSelected="1"/>
				</template>
				<template v-else>
					<div class="crm-call-assessment-v2__card">
						<ScriptInfoCard
							:isEditMode="isEditMode"
							:assessmentId="data.id"
							:description="data.description"
							:updatedAt="data.updatedAt"
							:processedCallsCount="data.processedCallsCount"
							:isGeneratedByCopilot="data.isGeneratedByCopilot"
							:filters="data.filters"
						/>
						<ScenarioCard
							:isEditMode="isEditMode"
							v-model:criteria="data.criteria"
						/>
					</div>
					<template v-if="isEditMode">
						<ClientTypesCard v-model:filters="data.filters"/>
					</template>
				</template>
			</div>
			<ActionBar
				v-if="isEditMode"
				variant="edit"
				@save="handleSave"
				@cancel="handleCancel"
			/>
			<ActionBar
				v-else-if="isCreateMode"
				variant="create"
				:generateDisabled="!hasUserText"
				@generate="handleGenerate"
				@cancel="handleClose"
			/>
			<ActionBar
				v-else-if="!isLoadingMode && !settings.readOnly"
				variant="view"
				@edit="handleEnterEdit"
			/>
		</div>
	`
	});

	class CallAssessmentV2 {
		#container;
		#app = null;
		constructor(containerId, params) {
			const container = document.getElementById(containerId);
			if (!main_core.Type.isDomNode(container)) {
				throw new Error(`CallAssessmentV2: container "${containerId}" not found`);
			}
			this.#container = container;
			this.#mount(params);
		}
		#mount(params) {
			const settings = {
				readOnly: params.config?.readOnly ?? true,
				isEnabled: params.config?.isEnabled ?? true,
				isCopy: params.config?.isCopy ?? false,
				isNewScript: params.config?.isNewScript ?? false,
				isPendingGeneration: params.config?.isPendingGeneration ?? false
			};
			this.#app = ui_vue3.BitrixVue.createApp(App, {
				initialData: params.data,
				settings,
				events: params.events ?? {}
			});
			this.#app.mixin(ui_vue3_mixins_locMixin.locMixin);
			this.#app.mount(this.#container);
		}
		destroy() {
			this.#app?.unmount();
			this.#app = null;
		}
	}

	exports.CallAssessmentV2 = CallAssessmentV2;
	exports.ScenarioStepView = ScenarioStepView;

})(this.BX.Crm.Copilot = this.BX.Crm.Copilot || {}, BX, BX.Vue3, BX.Vue3.Mixins, BX.Event, BX.UI.Notification, BX.Vue3.Components, BX.UI.System.Typography.Vue, BX.UI.EntitySelector, BX.UI.IconSet, BX.UI.System.Input.Vue, BX.Crm.AI, BX.UI, BX.Vue3.Directives, BX.UI.Vue3.Components, BX.UI.DragAndDrop, BX.Vue3.Components, BX.Main, BX.UI.Vue3.Components);
//# sourceMappingURL=call-assessment-v2.bundle.js.map
