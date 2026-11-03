/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, ui_vue3, ui_vue3_mixins_locMixin, ui_system_typography_vue, ui_vue3_components_switcher, ui_system_input_vue, ui_vue3_components_button, ui_iconSet_api_vue, ui_iconSet_outline, main_core, ui_switcher) {
	'use strict';

	const SUPPLY_STEP = 1;
	const DefaultControlType = Object.freeze({
		Toggle: 'toggle',
		Field: 'field',
		Text: 'text',
		Navigation: 'navigation'
	});

	function filterSectionRecords(records, sectionId, supplyStep) {
		return records.filter(record => record.sectionId === sectionId && record.availableFromStep <= supplyStep);
	}

	const CrmHubSection = ui_vue3.defineComponent({
		name: 'CrmHubSection',
		components: {
			HeadlineXs: ui_system_typography_vue.HeadlineXs
		},
		mixins: [ui_vue3_mixins_locMixin.locMixin],
		props: {
			sectionId: {
				type: String,
				required: true
			},
			title: {
				type: String,
				required: true
			},
			hideTitle: {
				type: Boolean,
				default: false
			}
		},
		computed: {
			titleId() {
				return `crm-settings-hub-section-${this.sectionId}-title`;
			},
			testId() {
				return `crm-settings-hub-section-${this.sectionId}`;
			}
		},
		template: `
		<section
			class="crm-settings-hub-section"
			tabindex="-1"
			role="region"
			:aria-labelledby="titleId"
			:data-testid="testId"
		>
			<HeadlineXs
				:id="titleId"
				class="crm-settings-hub-section__title"
				:class="{ '--visually-hidden': hideTitle }"
			>{{ loc(title) }}</HeadlineXs>
			<div class="crm-settings-hub-section__content">
				<slot/>
			</div>
		</section>
	`
	});

	function resolveControl(controlType, formControls, defaults) {
		const formControl = formControls === null ? undefined : formControls[controlType];
		return formControl ?? defaults[controlType] ?? null;
	}

	function resolveDisabled(descriptor, snapshot, readOnly) {
		const gate = descriptor.disabled;
		const backendDisabled = gate ? Boolean(snapshot[gate.condition]) : false;
		return {
			isDisabled: readOnly || backendDisabled,
			reason: backendDisabled && gate ? gate.reasonSource : ''
		};
	}

	function resolveDescription(descriptor) {
		return descriptor.kind === 'scalar' && descriptor.description ? descriptor.description : '';
	}

	function getToggleAriaState(isChecked) {
		return {
			role: 'switch',
			ariaChecked: isChecked ? 'true' : 'false'
		};
	}

	const CrmHubToggleControl = ui_vue3.defineComponent({
		name: 'CrmHubToggleControl',
		components: {
			Switcher: ui_vue3_components_switcher.Switcher,
			TextSm: ui_system_typography_vue.TextSm,
			TextXs: ui_system_typography_vue.TextXs
		},
		mixins: [ui_vue3_mixins_locMixin.locMixin],
		props: {
			descriptor: {
				type: Object,
				required: true
			},
			snapshot: {
				type: Object,
				required: true
			},
			disabled: {
				type: Boolean,
				default: false
			},
			reason: {
				type: String,
				default: ''
			},
			description: {
				type: String,
				default: ''
			}
		},
		emits: ['update'],
		computed: {
			isChecked() {
				return Boolean(this.snapshot[this.descriptor.valueKey]);
			},
			labelId() {
				return `crm-settings-hub-${this.descriptor.id}-label`;
			},
			hintId() {
				return `crm-settings-hub-${this.descriptor.id}-hint`;
			},
			descriptionId() {
				return `crm-settings-hub-${this.descriptor.id}-description`;
			},
			describedBy() {
				const ids = [];
				if (this.description) {
					ids.push(this.descriptionId);
				}
				if (this.reason) {
					ids.push(this.hintId);
				}
				return ids.length > 0 ? ids.join(' ') : null;
			},
			ariaState() {
				return getToggleAriaState(this.isChecked);
			}
		},
		methods: {
			handleCheck() {
				this.$emit('update', true);
			},
			handleUncheck() {
				this.$emit('update', false);
			},
			handleKeydown(event) {
				if (this.disabled || !['Enter', ' '].includes(event.key)) {
					return;
				}
				event.preventDefault();
				this.$emit('update', !this.isChecked);
			}
		},
		template: `
		<div
			class="crm-settings-hub-toggle-control"
			:class="{ '--disabled': disabled }"
			role="group"
			:aria-labelledby="labelId"
			:aria-describedby="describedBy"
		>
			<div class="crm-settings-hub-toggle-control__row">
				<TextSm :id="labelId" class="crm-settings-hub-toggle-control__label">{{ loc(descriptor.title) }}</TextSm>
				<div
					class="crm-settings-hub-toggle-control__switch"
					:class="{ '--disabled': disabled }"
					:tabindex="disabled ? -1 : 0"
					:role="ariaState.role"
					:aria-checked="ariaState.ariaChecked"
					:aria-labelledby="labelId"
					:aria-describedby="describedBy"
					data-testid="crm-settings-hub-toggle-control-switch"
					@keydown="handleKeydown"
				>
					<Switcher
						:is-checked="isChecked"
						:is-disabled="disabled"
						:options="{ size: 'small', showStateTitle: false }"
						aria-hidden="true"
						@check="handleCheck"
						@uncheck="handleUncheck"
					/>
				</div>
			</div>
			<TextXs v-if="description" :id="descriptionId" class="crm-settings-hub-toggle-control__description">{{ loc(description) }}</TextXs>
			<TextXs v-if="reason" :id="hintId" class="crm-settings-hub-toggle-control__hint">{{ loc(reason) }}</TextXs>
		</div>
	`
	});

	function resolveFieldInputType(descriptor) {
		return descriptor.field?.inputType ?? 'text';
	}

	const CrmHubFieldControl = ui_vue3.defineComponent({
		name: 'CrmHubFieldControl',
		components: {
			BInput: ui_system_input_vue.BInput,
			TextSm: ui_system_typography_vue.TextSm,
			TextXs: ui_system_typography_vue.TextXs
		},
		mixins: [ui_vue3_mixins_locMixin.locMixin],
		props: {
			descriptor: {
				type: Object,
				required: true
			},
			snapshot: {
				type: Object,
				required: true
			},
			disabled: {
				type: Boolean,
				default: false
			},
			reason: {
				type: String,
				default: ''
			}
		},
		emits: ['update'],
		computed: {
			value() {
				const raw = this.snapshot[this.descriptor.valueKey];
				return raw === null || raw === undefined ? '' : String(raw);
			},
			hintId() {
				return `crm-settings-hub-${this.descriptor.id}-hint`;
			},
			inputType() {
				return resolveFieldInputType(this.descriptor);
			}
		},
		methods: {
			handleInput(value) {
				this.$emit('update', value);
			}
		},
		template: `
		<div class="crm-settings-hub-field-control" :class="{ '--disabled': disabled }">
			<TextSm class="crm-settings-hub-field-control__label">{{ loc(descriptor.title) }}</TextSm>
			<BInput
				:model-value="value"
				:type="inputType"
				:aria-label="loc(descriptor.title)"
				:readonly="disabled"
				:aria-describedby="reason ? hintId : null"
				data-testid="crm-settings-hub-field-control-input"
				stretched
				@update:modelValue="handleInput"
			/>
			<TextXs v-if="reason" :id="hintId" class="crm-settings-hub-field-control__hint">{{ loc(reason) }}</TextXs>
		</div>
	`
	});

	const CrmHubTextControl = ui_vue3.defineComponent({
		name: 'CrmHubTextControl',
		components: {
			TextSm: ui_system_typography_vue.TextSm,
			TextXs: ui_system_typography_vue.TextXs
		},
		mixins: [ui_vue3_mixins_locMixin.locMixin],
		props: {
			descriptor: {
				type: Object,
				required: true
			},
			snapshot: {
				type: Object,
				required: true
			},
			reason: {
				type: String,
				default: ''
			}
		},
		computed: {
			value() {
				const raw = this.snapshot[this.descriptor.valueKey];
				return raw === null || raw === undefined ? '' : String(raw);
			},
			labelId() {
				return `crm-settings-hub-${this.descriptor.id}-label`;
			},
			hintId() {
				return `crm-settings-hub-${this.descriptor.id}-hint`;
			}
		},
		template: `
		<div
			class="crm-settings-hub-text-control"
			role="group"
			:aria-labelledby="labelId"
			:aria-describedby="reason ? hintId : null"
		>
			<TextSm :id="labelId" class="crm-settings-hub-text-control__label">{{ loc(descriptor.title) }}</TextSm>
			<TextSm class="crm-settings-hub-text-control__value" data-testid="crm-settings-hub-text-control-value">{{ value }}</TextSm>
			<TextXs v-if="reason" :id="hintId" class="crm-settings-hub-text-control__hint">{{ loc(reason) }}</TextXs>
		</div>
	`
	});

	const CrmHubNavigationControl = ui_vue3.defineComponent({
		name: 'CrmHubNavigationControl',
		components: {
			UiButton: ui_vue3_components_button.Button,
			TextSm: ui_system_typography_vue.TextSm,
			TextXs: ui_system_typography_vue.TextXs
		},
		mixins: [ui_vue3_mixins_locMixin.locMixin],
		props: {
			descriptor: {
				type: Object,
				required: true
			},
			disabled: {
				type: Boolean,
				default: false
			},
			reason: {
				type: String,
				default: ''
			}
		},
		emits: ['action'],
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize
			};
		},
		computed: {
			labelId() {
				return `crm-settings-hub-${this.descriptor.id}-label`;
			},
			hintId() {
				return `crm-settings-hub-${this.descriptor.id}-hint`;
			}
		},
		methods: {
			handleClick() {
				this.$emit('action');
			}
		},
		template: `
		<div
			class="crm-settings-hub-navigation-control"
			:class="{ '--disabled': disabled }"
			role="group"
			:aria-labelledby="labelId"
			:aria-describedby="reason ? hintId : null"
		>
			<div class="crm-settings-hub-navigation-control__row">
				<TextSm :id="labelId" class="crm-settings-hub-navigation-control__label">{{ loc(descriptor.title) }}</TextSm>
				<UiButton
					:text="loc(descriptor.title)"
					:size="ButtonSize.SMALL"
					:style="AirButtonStyle.OUTLINE"
					:disabled="disabled"
					:dataset="{ testid: 'crm-settings-hub-navigation-control-button' }"
					@click="handleClick"
				/>
			</div>
			<TextXs v-if="reason" :id="hintId" class="crm-settings-hub-navigation-control__hint">{{ loc(reason) }}</TextXs>
		</div>
	`
	});

	const DEFAULT_CONTROLS = {
		[DefaultControlType.Toggle]: CrmHubToggleControl,
		[DefaultControlType.Field]: CrmHubFieldControl,
		[DefaultControlType.Text]: CrmHubTextControl,
		[DefaultControlType.Navigation]: CrmHubNavigationControl
	};
	const CrmHubControlRenderer = ui_vue3.defineComponent({
		name: 'CrmHubControlRenderer',
		props: {
			descriptor: {
				type: Object,
				required: true
			},
			snapshot: {
				type: Object,
				required: true
			},
			readOnly: {
				type: Boolean,
				default: false
			},
			controls: {
				type: Object,
				default: null
			}
		},
		emits: ['update', 'action'],
		computed: {
			resolvedControl() {
				return resolveControl(this.descriptor.controlType, this.controls, DEFAULT_CONTROLS);
			},
			disabledState() {
				return resolveDisabled(this.descriptor, this.snapshot, this.readOnly);
			},
			isDisabled() {
				return this.disabledState.isDisabled;
			},
			reason() {
				return this.disabledState.reason;
			},
			description() {
				return resolveDescription(this.descriptor);
			},
			controlTestId() {
				return `crm-settings-hub-control-${this.descriptor.id}`;
			}
		},
		methods: {
			handleUpdate(value) {
				this.$emit('update', {
					id: this.descriptor.id,
					valueKey: this.descriptor.valueKey,
					value
				});
			},
			handleAction() {
				this.$emit('action', {
					id: this.descriptor.id,
					actionKey: this.descriptor.actionKey
				});
			}
		},
		template: `
		<component
			:is="resolvedControl"
			v-if="resolvedControl"
			:descriptor="descriptor"
			:snapshot="snapshot"
			:read-only="readOnly"
			:disabled="isDisabled"
			:reason="reason"
			:description="description"
			:data-testid="controlTestId"
			@update="handleUpdate"
			@action="handleAction"
		/>
	`
	});

	const CrmHubShell = ui_vue3.defineComponent({
		name: 'CrmHubShell',
		components: {
			CrmHubSection,
			CrmHubControlRenderer
		},
		props: {
			sections: {
				type: Array,
				required: true
			},
			records: {
				type: Array,
				default: () => []
			},
			snapshot: {
				type: Object,
				required: true
			},
			activeSectionId: {
				type: String,
				required: true
			},
			readOnly: {
				type: Boolean,
				default: false
			},
			isPanelFixed: {
				type: Boolean,
				default: false
			},
			controls: {
				type: Object,
				default: null
			}
		},
		emits: ['update', 'action'],
		watch: {
			activeSectionId() {
				this.$nextTick(() => {
					this.focusActiveSection();
				});
			}
		},
		methods: {
			recordsForSection(sectionId) {
				return filterSectionRecords(this.records, sectionId, SUPPLY_STEP);
			},
			focusActiveSection() {
				const node = this.$el?.querySelector?.(`.crm-settings-hub-section[data-section-id="${this.activeSectionId}"]`);
				node?.focus?.({
					preventScroll: true
				});
			},
			handleUpdate(payload) {
				this.$emit('update', payload);
			},
			handleAction(payload) {
				this.$emit('action', payload);
			}
		},
		template: `
		<div
			class="crm-settings-hub-shell"
			:class="{ '--panel-fixed': isPanelFixed }"
			data-testid="crm-settings-hub-shell"
		>
			<div v-if="$slots.passport" class="crm-settings-hub-shell__passport">
				<slot name="passport"/>
			</div>
			<div class="crm-settings-hub-shell__sections">
				<CrmHubSection
					v-for="section in sections"
					v-show="section.id === activeSectionId"
					:key="section.id"
					:data-section-id="section.id"
					:section-id="section.id"
					:title="section.title"
					:hide-title="section.hideTitle"
				>
					<slot :name="'section-' + section.id" :records="recordsForSection(section.id)">
						<CrmHubControlRenderer
							v-for="record in recordsForSection(section.id)"
							:key="record.id"
							:descriptor="record"
							:snapshot="snapshot"
							:read-only="readOnly"
							:controls="controls"
							@update="handleUpdate"
							@action="handleAction"
						/>
					</slot>
				</CrmHubSection>
			</div>
			<div v-if="$slots.panel" class="crm-settings-hub-shell__panel">
				<slot name="panel"/>
			</div>
		</div>
	`
	});

	const CrmHubPassportCard = ui_vue3.defineComponent({
		name: 'CrmHubPassportCard',
		components: {
			BInput: ui_system_input_vue.BInput,
			HeadlineMd: ui_system_typography_vue.HeadlineMd,
			TextXs: ui_system_typography_vue.TextXs
		},
		mixins: [ui_vue3_mixins_locMixin.locMixin],
		props: {
			title: {
				type: String,
				default: ''
			},
			titleLabel: {
				type: String,
				default: ''
			},
			placeholder: {
				type: String,
				default: ''
			},
			subtitle: {
				type: String,
				default: ''
			},
			readOnly: {
				type: Boolean,
				default: false
			}
		},
		emits: ['update:title'],
		methods: {
			handleTitleInput(value) {
				this.$emit('update:title', value);
			}
		},
		template: `
		<div class="crm-settings-hub-passport-card">
			<BInput
				v-if="!readOnly"
				:model-value="title"
				:label="titleLabel ? loc(titleLabel) : ''"
				:aria-label="titleLabel ? loc(titleLabel) : ''"
				:placeholder="placeholder"
				data-testid="crm-settings-hub-passport-input"
				stretched
				@update:modelValue="handleTitleInput"
			/>
			<HeadlineMd v-else class="crm-settings-hub-passport-card__title">{{ title }}</HeadlineMd>
			<TextXs v-if="subtitle" class="crm-settings-hub-passport-card__subtitle">{{ subtitle }}</TextXs>
		</div>
	`
	});

	function resolveEditableElement(target) {
		if (!target) {
			return null;
		}
		if (isElement(target)) {
			return target;
		}
		const host = target.$el;
		return isElement(host) ? host : null;
	}
	function focusEditable(target) {
		if (!target) {
			return;
		}
		if (!isElement(target) && main_core.Type.isFunction(target.focus)) {
			target.focus();
			return;
		}
		const element = resolveEditableElement(target);
		if (!element) {
			return;
		}
		element.focus();
		if (element.isContentEditable) {
			placeCaretAtEnd(element);
		}
	}
	function isElement(value) {
		return main_core.Type.isElementNode(value);
	}
	function placeCaretAtEnd(element) {
		const document = element.ownerDocument;
		const selection = document?.defaultView?.getSelection?.();
		if (!selection) {
			return;
		}
		const range = document.createRange();
		range.selectNodeContents(element);
		range.collapse(false);
		selection.removeAllRanges();
		selection.addRange(range);
	}

	const HUB_DESCRIPTION_MAX_LENGTH = 1000;
	const HIGH_SURROGATE_PATTERN = /^[\uD800-\uDBFF]$/;
	const EDGE_WHITESPACE_PATTERN = /^[\t-\r \u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]+|([^\t-\r \u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF])[\t-\r \u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]+$/g;
	function normalizeHubDescription(value) {
		if (value === null || value === undefined) {
			return '';
		}
		return String(value).replaceAll(/\r\n?/g, '\n').replaceAll(EDGE_WHITESPACE_PATTERN, '$1');
	}
	function countHubDescriptionChars(value) {
		return [...value].length;
	}
	function limitHubDescriptionEdit(previous, value, caret = value.length) {
		if (fitsHubDescriptionLimit(value)) {
			return {
				value,
				caret
			};
		}
		const end = Math.min(Math.max(caret, 0), value.length);
		const suffix = value.slice(end);
		let start = Math.min(commonPrefixLength(previous, value), end, Math.max(previous.length - suffix.length, 0));
		if (start > 0 && HIGH_SURROGATE_PATTERN.test(value[start - 1])) {
			start--;
		}
		const prefix = value.slice(0, start);
		const fragment = value.slice(start, end);
		const inserted = [...fragment];
		const compose = count => prefix + inserted.slice(0, count).join('') + suffix;
		let kept = 0;
		let over = inserted.length;
		while (over - kept > 1) {
			const middle = Math.floor((kept + over) / 2);
			if (fitsHubDescriptionLimit(compose(middle))) {
				kept = middle;
			} else {
				over = middle;
			}
		}
		const head = prefix + inserted.slice(0, kept).join('');
		return {
			value: head + suffix,
			caret: head.length
		};
	}
	function limitHubDescriptionInput(value) {
		return limitHubDescriptionEdit('', value).value;
	}
	function fitsHubDescriptionLimit(value) {
		return countHubDescriptionChars(normalizeHubDescription(value)) <= HUB_DESCRIPTION_MAX_LENGTH;
	}
	function commonPrefixLength(left, right) {
		const limit = Math.min(left.length, right.length);
		let length = 0;
		while (length < limit && left[length] === right[length]) {
			length++;
		}
		return length;
	}

	function shouldEndEditing(content, focused) {
		if (!content || !focused) {
			return true;
		}
		return !content.contains(focused);
	}

	const CrmHubPassportHero = ui_vue3.defineComponent({
		name: 'CrmHubPassportHero',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			BInput: ui_system_input_vue.BInput,
			UiButton: ui_vue3_components_button.Button,
			HeadlineXl: ui_system_typography_vue.HeadlineXl,
			TextXs: ui_system_typography_vue.TextXs
		},
		mixins: [ui_vue3_mixins_locMixin.locMixin],
		props: {
			title: {
				type: String,
				default: ''
			},
			titleLabel: {
				type: String,
				default: ''
			},
			description: {
				type: String,
				default: ''
			},
			descriptionPlaceholder: {
				type: String,
				default: ''
			},
			icon: {
				type: String,
				default: ui_iconSet_api_vue.Outline.SMART_PROCESS
			},
			locationTitle: {
				type: String,
				default: ''
			},
			locationIcon: {
				type: String,
				default: ui_iconSet_api_vue.Outline.LOCATION
			},
			readOnly: {
				type: Boolean,
				default: false
			},
			descriptionReadOnly: {
				type: Boolean,
				default: false
			},
			limitDescription: {
				type: Boolean,
				default: false
			}
		},
		emits: ['update:title', 'update:description'],
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize,
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		data() {
			return {
				isEditing: false
			};
		},
		computed: {
			titleText() {
				return this.title || (this.titleLabel ? this.loc(this.titleLabel) : '');
			}
		},
		methods: {
			startEdit() {
				this.openEditor('titleInput');
			},
			startEditDescription() {
				if (this.descriptionReadOnly) {
					return;
				}
				this.openEditor('descriptionInput');
			},
			openEditor(focusRef) {
				if (this.readOnly) {
					return;
				}
				this.isEditing = true;
				ui_vue3.nextTick(() => {
					this.primeTitleContent();
					focusEditable(this.$refs[focusRef]);
				});
			},
			primeTitleContent() {
				const element = resolveEditableElement(this.$refs.titleInput);
				if (element && element.textContent !== this.title) {
					element.textContent = this.title;
				}
			},
			stopEdit() {
				this.isEditing = false;
			},
			handleFocusOut() {
				setTimeout(() => {
					if (!this.isEditing) {
						return;
					}
					if (shouldEndEditing(this.$refs.content, document.activeElement)) {
						this.stopEdit();
					}
				}, 0);
			},
			handleTitleInput(event) {
				const element = event.target;
				this.$emit('update:title', element?.textContent ?? '');
			},
			handleTitlePaste(event) {
				event.preventDefault();
				const text = (event.clipboardData?.getData('text/plain') ?? '').replaceAll(/\s+/gu, ' ').trim();
				if (text === '') {
					return;
				}
				const element = event.target;
				element?.ownerDocument?.execCommand?.('insertText', false, text);
			},
			handleDescriptionInput(value) {
				if (!this.limitDescription) {
					this.$emit('update:description', value);
					return;
				}
				const field = this.resolveDescriptionField();
				const limited = limitHubDescriptionEdit(this.description, value, field?.selectionEnd ?? value.length);
				if (limited.value !== value) {
					this.writeBackDescription(limited);
				}
				this.$emit('update:description', limited.value);
			},
			resolveDescriptionField() {
				const host = resolveEditableElement(this.$refs.descriptionInput);
				return host?.querySelector('textarea') ?? null;
			},
			writeBackDescription(edit) {
				const field = this.resolveDescriptionField();
				if (!field) {
					return;
				}
				field.value = edit.value;
				field.setSelectionRange(edit.caret, edit.caret);
			},
			handleEditKeydown(event) {
				if (['Enter', 'Escape'].includes(event.key)) {
					event.preventDefault();
					this.stopEdit();
				}
			},
			handleDescriptionKeydown(event) {
				if (event.key === 'Escape') {
					event.preventDefault();
					this.stopEdit();
				}
			}
		},
		template: `
		<div class="crm-settings-hub-passport-hero" data-testid="crm-settings-hub-passport-hero">
			<div class="crm-settings-hub-passport-hero__top">
				<div class="crm-settings-hub-passport-hero__avatar">
					<BIcon class="crm-settings-hub-passport-hero__avatar-icon" :name="icon" :size="40"/>
					<span v-if="$slots.badge" class="crm-settings-hub-passport-hero__badge">
						<slot name="badge"/>
					</span>
				</div>
				<div
					ref="content"
					class="crm-settings-hub-passport-hero__content"
					@focusout="handleFocusOut"
				>
					<div class="crm-settings-hub-passport-hero__title-row">
						<HeadlineXl
							v-if="isEditing"
							ref="titleInput"
							accent
							tag="h2"
							class="crm-settings-hub-passport-hero__title --editable"
							contenteditable="true"
							role="textbox"
							aria-multiline="false"
							spellcheck="false"
							:aria-label="titleLabel ? loc(titleLabel) : ''"
							:data-placeholder="titleLabel ? loc(titleLabel) : ''"
							data-testid="crm-settings-hub-passport-hero-input"
							@input="handleTitleInput"
							@paste="handleTitlePaste"
							@keydown="handleEditKeydown"
						/>
						<template v-else>
							<HeadlineXl accent tag="h2" class="crm-settings-hub-passport-hero__title">{{ titleText }}</HeadlineXl>
							<UiButton
								v-if="!readOnly"
								class="crm-settings-hub-passport-hero__edit"
								:style="AirButtonStyle.PLAIN"
								:size="ButtonSize.SMALL"
								:left-icon="Outline.EDIT_M"
								:text="titleLabel ? loc(titleLabel) : titleText"
								collapsed
								:dataset="{ testid: 'crm-settings-hub-passport-hero-edit' }"
								@click="startEdit"
							/>
						</template>
					</div>
					<div
						v-if="isEditing || description || descriptionPlaceholder || $slots.description"
						class="crm-settings-hub-passport-hero__description"
					>
						<span
							v-if="descriptionReadOnly && (description || descriptionPlaceholder)"
							class="crm-settings-hub-passport-hero__description-text --read-only"
							data-testid="crm-settings-hub-passport-hero-description"
						>{{ description || loc(descriptionPlaceholder) }}</span>
						<BInput
							v-else-if="isEditing"
							ref="descriptionInput"
							:model-value="description"
							:placeholder="descriptionPlaceholder ? loc(descriptionPlaceholder) : ''"
							data-testid="crm-settings-hub-passport-hero-description-input"
							:rows-quantity="2"
							resize="vertical"
							stretched
							@update:modelValue="handleDescriptionInput"
							@keydown="handleDescriptionKeydown"
						/>
						<button
							v-else-if="description || descriptionPlaceholder"
							type="button"
							class="crm-settings-hub-passport-hero__description-text"
							:class="{ '--empty': !description }"
							:disabled="readOnly"
							data-testid="crm-settings-hub-passport-hero-description"
							@click="startEditDescription"
						>{{ description || loc(descriptionPlaceholder) }}</button>
						<slot v-else name="description"/>
					</div>
					<div v-if="$slots.meta" class="crm-settings-hub-passport-hero__meta">
						<slot name="meta"/>
					</div>
					<!--
						Placement lives in the content column, under the description, and not in the tinted
						__location row below: the wizard mockup gives it a plain button that lines up with the
						name and the description (432:99411).
					-->
					<div v-if="$slots.placement" class="crm-settings-hub-passport-hero__placement">
						<slot name="placement"/>
					</div>
				</div>
			</div>
			<div v-if="locationTitle || $slots.action" class="crm-settings-hub-passport-hero__location">
				<BIcon class="crm-settings-hub-passport-hero__location-icon" :name="locationIcon" :size="24"/>
				<TextXs accent class="crm-settings-hub-passport-hero__location-title">{{ loc(locationTitle) }}</TextXs>
				<div class="crm-settings-hub-passport-hero__location-action">
					<slot name="action"/>
				</div>
			</div>
			<div v-if="$slots.details" class="crm-settings-hub-passport-hero__details">
				<slot name="details"/>
			</div>
		</div>
	`
	});

	const CrmHubCard = ui_vue3.defineComponent({
		name: 'CrmHubCard',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			HeadlineSm: ui_system_typography_vue.HeadlineSm
		},
		mixins: [ui_vue3_mixins_locMixin.locMixin],
		props: {
			cardId: {
				type: String,
				required: true
			},
			title: {
				type: String,
				default: ''
			},
			icon: {
				type: String,
				default: ''
			},
			collapsible: {
				type: Boolean,
				default: false
			},
			defaultOpen: {
				type: Boolean,
				default: true
			}
		},
		data() {
			return {
				isOpen: true
			};
		},
		created() {
			this.isOpen = !this.collapsible || this.defaultOpen;
		},
		computed: {
			titleId() {
				return `crm-settings-hub-card-${this.cardId}-title`;
			},
			testId() {
				return `crm-settings-hub-card-${this.cardId}`;
			}
		},
		methods: {
			toggle() {
				if (this.collapsible) {
					this.isOpen = !this.isOpen;
				}
			},
			handleHeaderKeydown(event) {
				if (!this.collapsible || !['Enter', ' '].includes(event.key)) {
					return;
				}
				event.preventDefault();
				this.toggle();
			}
		},
		template: `
		<section
			class="crm-settings-hub-card"
			:class="{ '--collapsible': collapsible, '--open': collapsible && isOpen }"
			:aria-labelledby="title ? titleId : null"
			:data-testid="testId"
		>
			<header
				v-if="title"
				class="crm-settings-hub-card__header"
				:role="collapsible ? 'button' : null"
				:tabindex="collapsible ? 0 : null"
				:aria-expanded="collapsible ? String(isOpen) : null"
				@click="toggle"
				@keydown="handleHeaderKeydown"
			>
				<BIcon v-if="icon" class="crm-settings-hub-card__icon" :name="icon" :size="24"/>
				<HeadlineSm :id="titleId" tag="h3" class="crm-settings-hub-card__title">{{ loc(title) }}</HeadlineSm>
				<!--
					Action of the header (the mockup puts "Добавить представление" there). Clicks are
					stopped: the header itself is the collapse control, and a button inside it would
					fold the card as a side effect of its own action.
				-->
				<span
					v-if="$slots.action"
					class="crm-settings-hub-card__action"
					@click.stop
					@keydown.stop
				>
					<slot name="action"/>
				</span>
				<BIcon
					v-if="collapsible"
					class="crm-settings-hub-card__chevron"
					:name="isOpen ? 'chevron-top-m' : 'chevron-down-m'"
					:size="20"
				/>
			</header>
			<div v-show="isOpen" class="crm-settings-hub-card__content">
				<slot/>
			</div>
		</section>
	`
	});

	const CrmHubBanner = ui_vue3.defineComponent({
		name: 'CrmHubBanner',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			TextSm: ui_system_typography_vue.TextSm
		},
		props: {
			tone: {
				type: String,
				default: 'info'
			},
			testId: {
				type: String,
				default: ''
			}
		},
		computed: {
			isWarning() {
				return this.tone === 'warning';
			}
		},
		template: `
		<div
			class="crm-settings-hub-banner"
			:class="{ '--warning': isWarning }"
			:data-testid="testId || null"
		>
			<BIcon v-if="isWarning" class="crm-settings-hub-banner__icon" name="o-alert-accent" :size="18"/>
			<TextSm><slot/></TextSm>
		</div>
	`
	});

	const CrmHubFeatureCard = ui_vue3.defineComponent({
		name: 'CrmHubFeatureCard',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			Switcher: ui_vue3_components_switcher.Switcher,
			HeadlineSm: ui_system_typography_vue.HeadlineSm,
			TextSm: ui_system_typography_vue.TextSm,
			TextXs: ui_system_typography_vue.TextXs
		},
		mixins: [ui_vue3_mixins_locMixin.locMixin],
		props: {
			featureId: {
				type: String,
				required: true
			},
			title: {
				type: String,
				default: ''
			},
			titleText: {
				type: String,
				default: ''
			},
			description: {
				type: String,
				default: ''
			},
			descriptionText: {
				type: String,
				default: ''
			},
			icon: {
				type: String,
				default: ''
			},
			checked: {
				type: Boolean,
				default: false
			},
			disabled: {
				type: Boolean,
				default: false
			},
			reason: {
				type: String,
				default: ''
			}
		},
		emits: ['update'],
		setup() {
			return {
				AirSwitcherStyle: ui_switcher.AirSwitcherStyle
			};
		},
		computed: {
			headingText() {
				return this.titleText || (this.title ? this.loc(this.title) : '');
			},
			descriptionContent() {
				return this.descriptionText || (this.description ? this.loc(this.description) : '');
			},
			labelId() {
				return `crm-settings-hub-feature-${this.featureId}-label`;
			},
			descriptionId() {
				return `crm-settings-hub-feature-${this.featureId}-description`;
			},
			hintId() {
				return `crm-settings-hub-feature-${this.featureId}-hint`;
			},
			describedBy() {
				const ids = [];
				if (this.descriptionContent) {
					ids.push(this.descriptionId);
				}
				if (this.reason) {
					ids.push(this.hintId);
				}
				return ids.length > 0 ? ids.join(' ') : null;
			},
			ariaState() {
				return getToggleAriaState(this.checked);
			}
		},
		methods: {
			handleCheck() {
				this.$emit('update', true);
			},
			handleUncheck() {
				this.$emit('update', false);
			},
			handleKeydown(event) {
				if (event.currentTarget !== event.target || this.disabled || !['Enter', ' '].includes(event.key)) {
					return;
				}
				event.preventDefault();
				this.$emit('update', !this.checked);
			},
			handleRowClick(event) {
				const target = event.target;
				if (this.disabled || !(target instanceof Element)) {
					return;
				}
				const ownMeaning = target.closest(['.crm-settings-hub-feature-card__switch', '.crm-settings-hub-feature-card__control', 'a', 'button', 'input', 'textarea', 'select'].join(','));
				if (ownMeaning) {
					return;
				}
				this.$emit('update', !this.checked);
			}
		},
		template: `
		<div
			class="crm-settings-hub-feature-card"
			:class="{ '--off': !checked, '--disabled': disabled, '--clickable': !disabled }"
			:data-testid="'crm-settings-hub-feature-' + featureId"
			@click="handleRowClick"
		>
			<BIcon v-if="icon" class="crm-settings-hub-feature-card__icon" :name="icon" :size="27"/>
			<div class="crm-settings-hub-feature-card__aside">
				<!--
					The switch semantics live here and not on the row: aria-disabled inherits down the subtree,
					so from the root it would also reach the action button inside the row — a working button
					announced as disabled. The row still toggles on click (handleRowClick); the switcher inside
					is decoration, or the reader would get two switches for one setting.

					Placed before __body in DOM order (the CSS \`order\` restores the visual sequence) so the
					switch's tab stop precedes the action button's — Tab from the switch lands on this row's own
					button, not the next row's.

					The tab stop stays even when the row is disabled, as in ui.switcher's disable(): dropping it
					would hide the lock and its reason (aria-describedby → __hint) from keyboard users.
					Activation is still refused — handleKeydown returns early on \`disabled\`.
				-->
				<div
					class="crm-settings-hub-feature-card__switch"
					tabindex="0"
					:role="ariaState.role"
					:aria-checked="ariaState.ariaChecked"
					:aria-disabled="disabled ? 'true' : null"
					:aria-labelledby="labelId"
					:aria-describedby="describedBy"
					data-testid="crm-settings-hub-feature-card-switch"
					@keydown="handleKeydown"
				>
					<!-- 'large' is 40x19 in the AIR css — the size the mockup draws for the block's switcher. -->
					<Switcher
						:is-checked="checked"
						:is-disabled="disabled"
						:options="{
							size: 'large',
							showStateTitle: false,
							useAirDesign: true,
							style: AirSwitcherStyle.SOLID,
						}"
						aria-hidden="true"
						@check="handleCheck"
						@uncheck="handleUncheck"
					/>
				</div>
				<div v-if="$slots.control" class="crm-settings-hub-feature-card__control">
					<slot name="control"/>
				</div>
			</div>
			<div class="crm-settings-hub-feature-card__body">
				<HeadlineSm accent :id="labelId" class="crm-settings-hub-feature-card__title">{{ headingText }}</HeadlineSm>
				<TextSm
					v-if="descriptionContent"
					:id="descriptionId"
					class="crm-settings-hub-feature-card__description"
				>{{ descriptionContent }}</TextSm>
				<div v-if="$slots.note" class="crm-settings-hub-feature-card__note">
					<slot name="note"/>
				</div>
				<TextXs v-if="reason" :id="hintId" class="crm-settings-hub-feature-card__hint">{{ loc(reason) }}</TextXs>
				<!--
					Its place under the description comes from the CSS \`order\`, not from where it sits in the
					markup. The button carries its own meaning, so handleRowClick lets it through (the 'button'
					entry of the exclusion list) instead of toggling the setting under it.
				-->
				<div v-if="$slots.action" class="crm-settings-hub-feature-card__action">
					<slot name="action"/>
				</div>
				<!--
					Sub-options of the row: the chip groups of a relation. They take the description's place
					when the row is on — the caller simply stops passing a description, because with the
					options on screen the sentence about them is a second telling.
				-->
				<div v-if="$slots.details" class="crm-settings-hub-feature-card__details">
					<slot name="details"/>
				</div>
			</div>
		</div>
	`
	});

	const CrmHubOptionRow = ui_vue3.defineComponent({
		name: 'CrmHubOptionRow',
		components: {
			Switcher: ui_vue3_components_switcher.Switcher,
			TextSm: ui_system_typography_vue.TextSm,
			TextXs: ui_system_typography_vue.TextXs
		},
		mixins: [ui_vue3_mixins_locMixin.locMixin],
		props: {
			rowId: {
				type: String,
				required: true
			},
			title: {
				type: String,
				default: ''
			},
			description: {
				type: String,
				default: ''
			},
			titleText: {
				type: String,
				default: ''
			},
			descriptionText: {
				type: String,
				default: ''
			},
			checked: {
				type: Boolean,
				default: null
			},
			disabled: {
				type: Boolean,
				default: false
			},
			last: {
				type: Boolean,
				default: false
			},
			testId: {
				type: String,
				default: ''
			}
		},
		emits: ['update'],
		computed: {
			resolvedTitle() {
				return this.titleText || this.loc(this.title);
			},
			resolvedDescription() {
				return this.descriptionText || (this.description ? this.loc(this.description) : '');
			},
			hasToggle() {
				return this.checked !== null;
			},
			labelId() {
				return `crm-settings-hub-option-${this.rowId}-label`;
			},
			descriptionId() {
				return `crm-settings-hub-option-${this.rowId}-description`;
			},
			describedBy() {
				return this.resolvedDescription ? this.descriptionId : null;
			},
			ariaState() {
				return getToggleAriaState(Boolean(this.checked));
			}
		},
		methods: {
			handleRowClick() {
				if (this.disabled || this.checked === null) {
					return;
				}
				this.$emit('update', !this.checked);
			},
			handleKeydown(event) {
				if (this.disabled || this.checked === null || !['Enter', ' '].includes(event.key)) {
					return;
				}
				event.preventDefault();
				this.$emit('update', !this.checked);
			},
			handleCheck() {
				this.$emit('update', true);
			},
			handleUncheck() {
				this.$emit('update', false);
			}
		},
		template: `
		<div
			class="crm-settings-hub-option-row"
			:class="{ '--last': last, '--disabled': disabled, '--interactive': hasToggle && !disabled }"
			:data-testid="testId || null"
		>
			<div class="crm-settings-hub-option-row__main" @click="handleRowClick">
				<div
					v-if="hasToggle"
					class="crm-settings-hub-option-row__switch"
					:tabindex="disabled ? -1 : 0"
					:role="ariaState.role"
					:aria-checked="ariaState.ariaChecked"
					:aria-labelledby="labelId"
					:aria-describedby="describedBy"
					@keydown="handleKeydown"
					@click.stop
				>
					<Switcher
						:is-checked="Boolean(checked)"
						:is-disabled="disabled"
						:options="{ size: 'small', showStateTitle: false }"
						aria-hidden="true"
						@check="handleCheck"
						@uncheck="handleUncheck"
					/>
				</div>
				<div class="crm-settings-hub-option-row__body">
					<TextSm :id="labelId" class="crm-settings-hub-option-row__title">{{ resolvedTitle }}</TextSm>
					<TextXs
						v-if="resolvedDescription"
						:id="descriptionId"
						class="crm-settings-hub-option-row__description"
					>{{ resolvedDescription }}</TextXs>
				</div>
				<div v-if="$slots.action" class="crm-settings-hub-option-row__action" @click.stop>
					<slot name="action"/>
				</div>
			</div>
			<div v-if="$slots.details" class="crm-settings-hub-option-row__details">
				<slot name="details"/>
			</div>
		</div>
	`
	});

	function isSavePanelVisible(isDirty, readOnly) {
		return !readOnly && isDirty;
	}

	const CrmHubSavePanel = ui_vue3.defineComponent({
		name: 'CrmHubSavePanel',
		components: {
			UiButton: ui_vue3_components_button.Button
		},
		mixins: [ui_vue3_mixins_locMixin.locMixin],
		props: {
			isDirty: {
				type: Boolean,
				default: false
			},
			isWaiting: {
				type: Boolean,
				default: false
			},
			readOnly: {
				type: Boolean,
				default: false
			}
		},
		emits: ['save', 'cancel'],
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize
			};
		},
		computed: {
			isVisible() {
				return isSavePanelVisible(this.isDirty, this.readOnly);
			}
		},
		methods: {
			handleSave() {
				this.$emit('save');
			},
			handleCancel() {
				this.$emit('cancel');
			}
		},
		template: `
		<div v-if="isVisible" class="crm-settings-hub-save-panel">
			<UiButton
				:text="loc('CRM_SETTINGS_HUB_SAVE')"
				:size="ButtonSize.MEDIUM"
				:style="AirButtonStyle.FILLED"
				:loading="isWaiting"
				:disabled="isWaiting"
				:dataset="{ testid: 'crm-settings-hub-save-panel-save-btn' }"
				@click="handleSave"
			/>
			<UiButton
				:text="loc('CRM_SETTINGS_HUB_CANCEL')"
				:size="ButtonSize.MEDIUM"
				:style="AirButtonStyle.PLAIN"
				:disabled="isWaiting"
				:dataset="{ testid: 'crm-settings-hub-save-panel-cancel-btn' }"
				@click="handleCancel"
			/>
		</div>
	`
	});

	exports.CrmHubBanner = CrmHubBanner;
	exports.CrmHubCard = CrmHubCard;
	exports.CrmHubControlRenderer = CrmHubControlRenderer;
	exports.CrmHubFeatureCard = CrmHubFeatureCard;
	exports.CrmHubFieldControl = CrmHubFieldControl;
	exports.CrmHubNavigationControl = CrmHubNavigationControl;
	exports.CrmHubOptionRow = CrmHubOptionRow;
	exports.CrmHubPassportCard = CrmHubPassportCard;
	exports.CrmHubPassportHero = CrmHubPassportHero;
	exports.CrmHubSavePanel = CrmHubSavePanel;
	exports.CrmHubSection = CrmHubSection;
	exports.CrmHubShell = CrmHubShell;
	exports.CrmHubTextControl = CrmHubTextControl;
	exports.CrmHubToggleControl = CrmHubToggleControl;
	exports.DefaultControlType = DefaultControlType;
	exports.HUB_DESCRIPTION_MAX_LENGTH = HUB_DESCRIPTION_MAX_LENGTH;
	exports.SUPPLY_STEP = SUPPLY_STEP;
	exports.countHubDescriptionChars = countHubDescriptionChars;
	exports.limitHubDescriptionEdit = limitHubDescriptionEdit;
	exports.limitHubDescriptionInput = limitHubDescriptionInput;
	exports.normalizeHubDescription = normalizeHubDescription;

})(this.BX.Crm.SettingsHub = this.BX.Crm.SettingsHub || {}, BX.Vue3, BX.Vue3.Mixins, BX.UI.System.Typography.Vue, BX.UI.Vue3.Components, BX.UI.System.Input.Vue, BX.Vue3.Components, BX.UI.IconSet, window, BX, BX.UI);
//# sourceMappingURL=settings-hub.bundle.js.map
