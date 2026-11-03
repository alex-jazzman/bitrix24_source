/* eslint-disable */
this.BX = this.BX || {};
this.BX.Bizprocdesigner = this.BX.Bizprocdesigner || {};
(function (exports, main_core, ui_a11y, ui_system_alert, ui_system_alert_vue, ui_system_dialog, ui_system_input_vue, ui_system_skeleton_vue, ui_vue3, ui_vue3_components_button, bizprocdesigner_editor_chart, ui_buttons, ui_iconSet_api_vue, ui_system_checkbox) {
	'use strict';

	function purposeLabel(purpose) {
		return main_core.Loc.getMessage(`BIZPROCDESIGNER_EDITOR_PROCESS_DATA_PURPOSE_${purpose.toUpperCase()}`) ?? '';
	}

	// A template older than the window may carry a type the form does not offer; its own name says more
	// than an empty cell.
	function typeLabel(type) {
		if (!main_core.Type.isStringFilled(type)) {
			return '';
		}
		return main_core.Loc.getMessage(`BIZPROCDESIGNER_EDITOR_PROCESS_DATA_FORM_TYPE_${type.toUpperCase()}`) ?? type;
	}

	const SKELETON_LINES$1 = [0, 1, 2];
	const ElementUsages = ui_vue3.defineComponent({
		name: 'BizprocDesignerProcessDataElementUsages',
		components: {
			BLine: ui_system_skeleton_vue.BLine
		},
		props: {
			usages: {
				type: Array,
				default: () => []
			},
			isLoading: {
				type: Boolean,
				default: false
			}
		},
		computed: {
			loadingText() {
				return main_core.Loc.getMessage('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_USAGES_LOADING') ?? '';
			},
			emptyText() {
				return main_core.Loc.getMessage('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_USAGES_EMPTY') ?? '';
			},
			skeletonLines: () => SKELETON_LINES$1
		},
		template: `
		<div class="bizprocdesigner-process-data-usages" data-testid="bizprocdesigner-process-data-usages">
			<div
				v-if="isLoading"
				class="bizprocdesigner-process-data-usages__skeleton"
				role="status"
				:aria-label="loadingText"
				aria-busy="true"
				data-testid="bizprocdesigner-process-data-usages-skeleton"
			>
				<BLine v-for="line in skeletonLines" :key="line"/>
			</div>
			<p
				v-else-if="usages.length === 0"
				class="bizprocdesigner-process-data-usages__empty"
				data-testid="bizprocdesigner-process-data-usages-empty"
			>
				{{ emptyText }}
			</p>
			<ul v-else class="bizprocdesigner-process-data-usages__items">
				<li
					v-for="usage in usages"
					:key="usage.activityName"
					class="bizprocdesigner-process-data-usages__item"
					:data-testid="'bizprocdesigner-process-data-usage-' + usage.activityName"
				>
					{{ usage.title }}
				</li>
			</ul>
		</div>
	`
	});

	/** Purposes an element of a template may take: a global value is not one of them (DTO-01). */
	const TEMPLATE_PURPOSES = ['input', 'internal', 'constant'];

	/** Storage a global value of the purpose lives in (SC-009): the portal keeps variables and constants. */
	const GLOBAL_STORAGE_OF_PURPOSE = {
		internal: 'GlobalVar',
		constant: 'GlobalConst'
	};

	/** Purpose a global value stands for in the form of a template: the portal keeps no parameters. */
	const PURPOSE_OF_GLOBAL = {
		GlobalVar: 'internal',
		GlobalConst: 'constant'
	};

	/** Scopes an element is kept in: the template of the process or the portal. */
	const SCOPES = ['local', 'global'];

	/** Types the legacy field bridge renders — the set `BX.Bizproc.FieldType.isBaseType` answers for. */
	const TYPES = ['string', 'text', 'int', 'double', 'bool', 'date', 'datetime', 'time', 'select', 'user'];
	const DEFAULT_TYPE = 'string';
	const SELECT_TYPE = 'select';

	/** Identifier prefixes of the legacy designer: a generated identifier stays familiar to the developer. */
	const KEY_PREFIXES = {
		input: 'Parameter',
		internal: 'Variable',
		constant: 'Constant'
	};
	const HAS_WRITERS_CODE = 'PROCESS_DATA_HAS_WRITERS';
	const IN_USE_CODE = 'PROCESS_DATA_IN_USE';
	let formInstanceCounter = 0;
	function valueToText(value) {
		if (main_core.Type.isNil(value)) {
			return '';
		}
		return main_core.Type.isArray(value) ? value.join('\n') : String(value);
	}
	function textToLines(text) {
		return text.split('\n').map(line => line.trim()).filter(line => line !== '');
	}
	function optionsToText(options) {
		if (!main_core.Type.isPlainObject(options)) {
			return '';
		}
		return Object.entries(options).map(([value, name]) => `${value}=${String(name)}`).join('\n');
	}
	function textToOptions(text) {
		const entries = text.split('\n').map(line => line.trim()).filter(line => line !== '').map(line => {
			const separator = line.indexOf('=');
			return separator === -1 ? [line, line] : [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
		});
		return entries.length === 0 ? null : Object.fromEntries(entries);
	}

	/** A global value answers `shared`, so its purpose in the template is taken from its storage. */
	function templatePurposeOf(element) {
		// A pair answers `internal`, but the form edits the purpose the user picks, and the filling at the start
		// is exactly what `input` stands for: otherwise a pair could never be turned back into a plain variable.
		if (element?.acceptsStartValue === true) {
			return 'input';
		}
		const purpose = element?.purpose;
		if (TEMPLATE_PURPOSES.includes(purpose)) {
			return purpose;
		}
		return PURPOSE_OF_GLOBAL[element?.sourceType] ?? TEMPLATE_PURPOSES[0];
	}
	function draftOf(element, defaultVisibility) {
		const property = element?.property ?? null;
		return {
			key: element?.key ?? '',
			name: property?.Name ?? '',
			purpose: templatePurposeOf(element),
			scope: element?.purpose === 'shared' ? SCOPES[1] : SCOPES[0],
			type: property?.Type ?? DEFAULT_TYPE,
			multiple: property?.Multiple === true,
			required: property?.Required === true,
			defaultValue: valueToText(property?.Default),
			description: property?.Description ?? '',
			options: optionsToText(property?.Options),
			visibility: element?.visibility ?? defaultVisibility
		};
	}
	const ElementForm = ui_vue3.defineComponent({
		name: 'BizprocDesignerProcessDataElementForm',
		components: {
			Alert: ui_system_alert_vue.Alert,
			BIcon: ui_iconSet_api_vue.BIcon,
			BInput: ui_system_input_vue.BInput,
			Checkbox: ui_system_checkbox.Vue.Checkbox,
			ElementUsages,
			UiButton: ui_vue3_components_button.Button
		},
		props: {
			/**
			 * Element the form edits; nothing means the form creates a new one.
			 * @type {ProcessDataElement | null}
			 */
			element: {
				type: Object,
				default: null
			}
		},
		emits: ['close'],
		setup() {
			return {
				store: bizprocdesigner_editor_chart.useProcessDataStore(),
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				AlertDesign: ui_system_alert.AlertDesign,
				ButtonSize: ui_vue3_components_button.ButtonSize,
				InputDesign: ui_system_input_vue.InputDesign,
				InputSize: ui_system_input_vue.InputSize,
				checkboxSize: ui_system_checkbox.CheckboxSize.Sm,
				iconSet: ui_iconSet_api_vue.Outline,
				types: TYPES
			};
		},
		data() {
			return {
				draft: draftOf(this.element, Object.keys(this.store.sharedAccess.visibility)[0] ?? ''),
				usages: [],
				// The request the answer on screen belongs to: an answer of any older one is dropped.
				usagesRequest: 0,
				isLoadingUsages: false,
				isUsagesShown: false,
				isSaving: false,
				isSaved: false,
				isRemoving: false,
				fieldUid: `bizprocdesigner-process-data-form-${++formInstanceCounter}`
			};
		},
		computed: {
			isCreating() {
				return this.element === null;
			},
			isReadOnly() {
				return this.store.isReadOnly;
			},
			isShared() {
				return this.element?.purpose === 'shared';
			},
			/** Purpose the draft asks for: the scope decides between the portal and the blocks of the template. */
			targetPurpose() {
				return this.draft.scope === SCOPES[1] ? 'shared' : this.draft.purpose;
			},
			/** Purpose the element stands at now: an element of the legacy designer carries no label of its own. */
			currentPurpose() {
				return this.isShared ? 'shared' : templatePurposeOf(this.element);
			},
			isPurposeChanged() {
				return !this.isCreating && this.targetPurpose !== this.currentPurpose;
			},
			isSharedDraft() {
				return this.targetPurpose === 'shared';
			},
			/**
			 * The type, the multiplicity, the requirement and the visibility of a shared value are set when it is
			 * created: the portal refuses to change them on an existing one.
			 */
			isSchemaLocked() {
				return this.isShared && this.isSharedDraft;
			},
			/** Storage of a global value follows its purpose: the developer picks a purpose, not a table. */
			storage() {
				return GLOBAL_STORAGE_OF_PURPOSE[this.draft.purpose] ?? GLOBAL_STORAGE_OF_PURPOSE.internal;
			},
			canDelete() {
				return !this.isCreating && (this.isShared ? this.store.sharedAccess.canDelete : true);
			},
			canSave() {
				if (this.isSharedDraft) {
					return this.store.sharedAccess.canUpsert;
				}

				// Taking a value back into the template removes it from the portal, so it is asked of who may delete.
				return this.isShared ? this.store.sharedAccess.canDelete : true;
			},
			purposes: () => TEMPLATE_PURPOSES,
			scopes: () => SCOPES,
			/**
			 * A scope is offered to who may write shared values. A value already global shows its scope locked:
			 * other templates may answer to it, so the way back into the template is not offered.
			 */
			isScopeOffered() {
				return this.isShared || this.store.sharedAccess.canUpsert;
			},
			/** The portal keeps variables and constants: an input value is passed at start and stays local, so
			 * the scope is not asked of it at all. */
			isScopeLocked() {
				return this.draft.purpose === 'input';
			},
			/** Each hint speaks for its own select: what globality means is told by the scope hint below. */
			purposeHint() {
				return this.loc(`BIZPROCDESIGNER_EDITOR_PROCESS_DATA_GROUP_${this.draft.purpose.toUpperCase()}_HINT`);
			},
			scopeHint() {
				return this.loc(`BIZPROCDESIGNER_EDITOR_PROCESS_DATA_FORM_SCOPE_${this.draft.scope.toUpperCase()}_HINT`);
			},
			visibilityOptions() {
				return Object.entries(this.store.sharedAccess.visibility).map(([code, name]) => ({
					code,
					name: String(name)
				}));
			},
			title() {
				if (this.isCreating) {
					return this.loc('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_FORM_TITLE_CREATE');
				}
				return this.draft.name === '' ? this.draft.key : this.draft.name;
			},
			writers() {
				const error = this.store.errors.find(item => item.code === HAS_WRITERS_CODE);
				const activities = error?.customData?.activities;
				return main_core.Type.isArray(activities) ? activities : [];
			},
			// The identifier has no field of its own: its errors join the common ones of the form.
			formError() {
				return this.store.errors.map(item => item.message).filter(message => message !== '').join(' ');
			},
			hasOptions() {
				return this.draft.type === SELECT_TYPE;
			},
			defaultValueText() {
				return textToLines(this.draft.defaultValue).join(', ');
			},
			saveText() {
				return this.isCreating ? this.loc('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_FORM_CREATE') : this.loc('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_FORM_SAVE');
			}
		},
		watch: {
			// The window stays open after a save, so the answer holds only until the next edit.
			draft: {
				deep: true,
				handler() {
					this.isSaved = false;
				}
			},
			element() {
				this.draft = draftOf(this.element, this.draft.visibility);
				this.refreshGeneratedKey();
				this.isUsagesShown = false;
				this.resetUsages();
			},
			'draft.purpose'() {
				if (this.isScopeLocked) {
					this.draft.scope = 'local';
				}
				this.refreshGeneratedKey();
			}
		},
		created() {
			this.refreshGeneratedKey();
			this.confirmDialog = null;
		},
		beforeUnmount() {
			this.confirmDialog?.hide();
			this.confirmDialog = null;
		},
		methods: {
			loc(code, params = null) {
				return main_core.Loc.getMessage(code, params) ?? '';
			},
			purposeLabel,
			typeLabel,
			scopeLabel(scope) {
				return this.loc(`BIZPROCDESIGNER_EDITOR_PROCESS_DATA_FORM_SCOPE_${scope.toUpperCase()}`);
			},
			/**
			 * A new element gets its identifier by itself: the developer names it, not identifies it.
			 * The stamp of the moment is what the legacy form of global values takes it from — an identifier
			 * free of any element the portal keeps out of sight of this template.
			 */
			refreshGeneratedKey() {
				if (!this.isCreating) {
					return;
				}
				this.draft.key = `${KEY_PREFIXES[this.draft.purpose]}${Date.now()}`;
			},
			resetUsages() {
				this.usagesRequest += 1;
				this.usages = [];
				this.isLoadingUsages = false;
			},
			/** The nodes an element is written and read in are asked for when the panel is opened, and not before. */
			async loadUsages() {
				this.resetUsages();
				if (this.isCreating) {
					return;
				}
				const request = this.usagesRequest;
				this.isLoadingUsages = true;
				try {
					const usages = await this.store.usages(this.element.sourceType, this.element.key);
					if (request === this.usagesRequest) {
						this.usages = usages;
					}
				} finally {
					if (request === this.usagesRequest) {
						this.isLoadingUsages = false;
					}
				}
			},
			showSettings() {
				this.isUsagesShown = false;
			},
			showUsages() {
				this.isUsagesShown = true;
				this.loadUsages();
			},
			buildProperty() {
				const property = {
					Name: this.draft.name,
					Description: this.draft.description,
					Type: this.draft.type,
					Multiple: this.draft.multiple,
					Required: this.draft.required,
					Options: this.hasOptions ? textToOptions(this.draft.options) : null,
					Default: this.draft.multiple ? textToLines(this.draft.defaultValue) : this.draft.defaultValue
				};

				// Visibility belongs to the portal alone, and it is read here: the move replaces the draft.
				return this.isSharedDraft ? {
					...property,
					Visibility: this.draft.visibility
				} : property;
			},
			/**
			 * Nothing is written and nothing is asked until the save: the selects only hold what the developer
			 * intends. The edited property travels with the move, so one intent of the developer is one change of
			 * the server and a refused save leaves no half of it behind.
			 */
			async save() {
				if (this.isSaving) {
					return;
				}
				let isMoving = this.isPurposeChanged;
				const purpose = this.targetPurpose;

				// A refused move leaves the element where it is, but the rest of the edits still stand.
				if (isMoving && !(await this.confirm(this.purposeConfirmationText(purpose)))) {
					this.resetPurpose();
					isMoving = false;
				}
				const property = this.buildProperty();
				this.isSaving = true;
				try {
					if (isMoving) {
						if (!(await this.store.changePurpose(this.element.sourceType, this.element.key, purpose, property, this.storage))) {
							this.resetPurpose();
							return;
						}
					} else if (!(await this.submit(this.isCreating ? null : this.element, property))) {
						return;
					}
					if (this.isCreating) {
						this.$emit('close');
						return;
					}

					// The saved element replaces the draft, and that edit of its own must not eat the answer.
					await this.$nextTick();
					this.isSaved = true;
				} finally {
					this.isSaving = false;
				}
			},
			submit(target, property) {
				if (target === null) {
					return this.isSharedDraft ? this.store.upsertShared(this.storage, this.draft.key, property) : this.store.create({
						key: this.draft.key,
						purpose: this.draft.purpose,
						property
					});
				}
				return target.purpose === 'shared' ? this.store.upsertShared(target.sourceType, target.key, property) : this.store.update(target.sourceType, target.key, property);
			},
			/** A refused move has to leave the selects showing what the element still is. */
			resetPurpose() {
				this.draft.purpose = templatePurposeOf(this.element);
				this.draft.scope = this.isShared ? SCOPES[1] : SCOPES[0];
			},
			purposeConfirmationText(purpose) {
				if (purpose === 'shared') {
					return this.loc('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_CONFIRM_PURPOSE_TO_SHARED');
				}
				if (this.currentPurpose === 'internal' && purpose === 'input') {
					return this.loc('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_CONFIRM_PURPOSE_PAIR');
				}
				return this.loc('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_CONFIRM_PURPOSE');
			},
			async requestDelete() {
				if (this.isRemoving) {
					return;
				}
				const text = this.loc('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_CONFIRM_DELETE', {
					'#KEY#': this.element.key
				});
				if (!(await this.confirm(text))) {
					return;
				}
				this.isRemoving = true;
				try {
					await this.remove();
				} finally {
					this.isRemoving = false;
				}
			},
			async remove() {
				const isDone = this.isShared ? await this.store.removeShared(this.element.sourceType, this.element.key) : await this.store.remove(this.element.sourceType, this.element.key);
				if (isDone) {
					this.$emit('close');
					return;
				}

				// What holds the element is the answer to the refusal, so it replaces the tab it belongs to.
				const inUse = this.store.errors.find(item => item.code === IN_USE_CODE);
				if (inUse) {
					const activities = inUse.customData?.activities;
					this.usages = main_core.Type.isArray(activities) ? activities : this.usages;
					this.isUsagesShown = true;
				}
			},
			/** A hidden dialog destroys its popup, so every confirmation is asked by a dialog of its own. */
			confirm(subtitle) {
				return new Promise(resolve => {
					let isConfirmed = false;
					const confirmButton = new ui_buttons.Button({
						text: this.loc('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_CONFIRM_OK'),
						useAirDesign: true,
						style: ui_buttons.AirButtonStyle.FILLED,
						dataset: {
							testid: 'bizprocdesigner-process-data-confirm-ok'
						}
					});
					const cancelButton = new ui_buttons.Button({
						text: this.loc('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_CONFIRM_CANCEL'),
						useAirDesign: true,
						style: ui_buttons.AirButtonStyle.OUTLINE,
						dataset: {
							testid: 'bizprocdesigner-process-data-confirm-cancel'
						}
					});
					const dialog = new ui_system_dialog.Dialog({
						title: this.loc('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_CONFIRM_TITLE'),
						subtitle,
						centerButtons: [cancelButton, confirmButton],
						width: 420,
						events: {
							onHide: () => {
								this.confirmDialog = null;
								resolve(isConfirmed);
							}
						}
					});

					// The answer is remembered before the hide: hiding the dialog is what carries it out.
					confirmButton.bindEvent('click', () => {
						isConfirmed = true;
						dialog.hide();
					});
					cancelButton.bindEvent('click', () => dialog.hide());
					this.confirmDialog = dialog;
					dialog.show();
				});
			}
		},
		template: `
		<div class="bizprocdesigner-process-data-form" data-testid="bizprocdesigner-process-data-form">
			<div class="bizprocdesigner-process-data-form__head">
				<h3
					class="bizprocdesigner-process-data-form__title"
					data-testid="bizprocdesigner-process-data-form-title"
				>{{ title }}</h3>
				<div v-if="!isCreating" class="bizprocdesigner-process-data-form__tabs">
					<button
						type="button"
						class="bizprocdesigner-process-data-form__tab"
						:class="{ '--selected': !isUsagesShown }"
						:aria-pressed="isUsagesShown ? 'false' : 'true'"
						data-testid="bizprocdesigner-process-data-form-tab-settings"
						@click="showSettings"
					>{{ loc('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_FORM_TAB_SETTINGS') }}</button>
					<button
						type="button"
						class="bizprocdesigner-process-data-form__tab"
						:class="{ '--selected': isUsagesShown }"
						:aria-pressed="isUsagesShown ? 'true' : 'false'"
						data-testid="bizprocdesigner-process-data-form-tab-usages"
						@click="showUsages"
					>{{ loc('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_FORM_TAB_USAGES') }}</button>
				</div>
			</div>
			<Alert
				v-if="formError !== ''"
				class="bizprocdesigner-process-data-form__error"
				:design="AlertDesign.tintedAlert"
				role="alert"
				data-testid="bizprocdesigner-process-data-form-error"
			>{{ formError }}</Alert>
			<div
				v-if="writers.length > 0"
				class="bizprocdesigner-process-data-form__writers"
				data-testid="bizprocdesigner-process-data-form-writers"
			>
				<p class="bizprocdesigner-process-data-form__writers-title">
					{{ loc('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_FORM_WRITERS') }}
				</p>
				<ElementUsages :usages="writers"/>
			</div>
			<ElementUsages
				v-if="isUsagesShown"
				:usages="usages"
				:isLoading="isLoadingUsages"
			/>
			<dl
				v-else-if="isReadOnly"
				class="bizprocdesigner-process-data-form__view"
				data-testid="bizprocdesigner-process-data-form-view"
			>
				<dt>{{ loc('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_FORM_NAME') }}</dt>
				<dd>{{ draft.name }}</dd>
				<dt>{{ loc('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_FORM_PURPOSE') }}</dt>
				<dd>{{ purposeLabel(draft.purpose) }}</dd>
				<dt>{{ loc('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_FORM_SCOPE') }}</dt>
				<dd>{{ scopeLabel(draft.scope) }}</dd>
				<dt>{{ loc('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_FORM_TYPE') }}</dt>
				<dd>{{ typeLabel(draft.type) }}</dd>
				<dt>{{ loc('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_FORM_DEFAULT') }}</dt>
				<dd>{{ defaultValueText }}</dd>
				<dt>{{ loc('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_FORM_DESCRIPTION') }}</dt>
				<dd>{{ draft.description }}</dd>
			</dl>
			<div v-else class="bizprocdesigner-process-data-form__fields">
				<div class="bizprocdesigner-process-data-form__field">
					<label class="bizprocdesigner-process-data-form__label" :for="fieldUid + '-name'">
						{{ loc('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_FORM_NAME') }}
					</label>
					<BInput
						v-model="draft.name"
						:id="fieldUid + '-name'"
						:ariaLabel="loc('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_FORM_NAME')"
						:size="InputSize.Sm"
						:design="InputDesign.Grey"
						stretched
						data-testid="bizprocdesigner-process-data-form-name"
					/>
				</div>
				<div class="bizprocdesigner-process-data-form__field">
					<label class="bizprocdesigner-process-data-form__label" :for="fieldUid + '-purpose'">
						{{ loc('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_FORM_PURPOSE') }}
					</label>
					<select
						v-model="draft.purpose"
						:id="fieldUid + '-purpose'"
						class="bizprocdesigner-process-data-form__select"
						:disabled="isShared"
						:aria-describedby="fieldUid + '-purpose-hint'"
						data-testid="bizprocdesigner-process-data-form-purpose"
					>
						<option v-for="purpose in purposes" :key="purpose" :value="purpose">
							{{ purposeLabel(purpose) }}
						</option>
					</select>
					<p
						:id="fieldUid + '-purpose-hint'"
						class="bizprocdesigner-process-data-form__field-hint"
						data-testid="bizprocdesigner-process-data-form-purpose-hint"
					>
						<BIcon :name="iconSet.INFO_CIRCLE" :size="16" aria-hidden="true"/>
						<span>{{ purposeHint }}</span>
					</p>
				</div>
				<div v-if="isScopeOffered && !isScopeLocked" class="bizprocdesigner-process-data-form__field">
					<label class="bizprocdesigner-process-data-form__label" :for="fieldUid + '-scope'">
						{{ loc('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_FORM_SCOPE') }}
					</label>
					<select
						v-model="draft.scope"
						:id="fieldUid + '-scope'"
						class="bizprocdesigner-process-data-form__select"
						:disabled="isShared"
						:aria-describedby="fieldUid + '-scope-hint'"
						data-testid="bizprocdesigner-process-data-form-scope"
					>
						<option v-for="scope in scopes" :key="scope" :value="scope">
							{{ scopeLabel(scope) }}
						</option>
					</select>
					<p
						:id="fieldUid + '-scope-hint'"
						class="bizprocdesigner-process-data-form__field-hint"
						data-testid="bizprocdesigner-process-data-form-scope-hint"
					>
						<BIcon :name="iconSet.INFO_CIRCLE" :size="16" aria-hidden="true"/>
						<span>{{ scopeHint }}</span>
					</p>
				</div>
				<div v-if="isSharedDraft && visibilityOptions.length > 1" class="bizprocdesigner-process-data-form__field">
					<label class="bizprocdesigner-process-data-form__label" :for="fieldUid + '-visibility'">
						{{ loc('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_FORM_VISIBILITY') }}
					</label>
					<select
						v-model="draft.visibility"
						:id="fieldUid + '-visibility'"
						class="bizprocdesigner-process-data-form__select"
						:disabled="isSchemaLocked"
						:aria-describedby="fieldUid + '-visibility-hint'"
						data-testid="bizprocdesigner-process-data-form-visibility"
					>
						<option v-for="option in visibilityOptions" :key="option.code" :value="option.code">
							{{ option.name }}
						</option>
					</select>
					<p
						:id="fieldUid + '-visibility-hint'"
						class="bizprocdesigner-process-data-form__field-hint"
						data-testid="bizprocdesigner-process-data-form-visibility-hint"
					>
						<BIcon :name="iconSet.INFO_CIRCLE" :size="16" aria-hidden="true"/>
						<span>{{ loc('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_FORM_VISIBILITY_HINT') }}</span>
					</p>
				</div>
				<div class="bizprocdesigner-process-data-form__field">
					<label class="bizprocdesigner-process-data-form__label" :for="fieldUid + '-type'">
						{{ loc('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_FORM_TYPE') }}
					</label>
					<select
						v-model="draft.type"
						:id="fieldUid + '-type'"
						class="bizprocdesigner-process-data-form__select"
						:disabled="isSchemaLocked"
						data-testid="bizprocdesigner-process-data-form-type"
					>
						<option v-for="type in types" :key="type" :value="type">{{ typeLabel(type) }}</option>
					</select>
				</div>
				<div v-if="hasOptions" class="bizprocdesigner-process-data-form__field">
					<label class="bizprocdesigner-process-data-form__label" :for="fieldUid + '-options'">
						{{ loc('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_FORM_OPTIONS') }}
					</label>
					<textarea
						v-model="draft.options"
						:id="fieldUid + '-options'"
						class="bizprocdesigner-process-data-form__textarea"
						:aria-describedby="fieldUid + '-options-hint'"
						data-testid="bizprocdesigner-process-data-form-options"
					></textarea>
					<p :id="fieldUid + '-options-hint'" class="bizprocdesigner-process-data-form__field-hint">
						{{ loc('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_FORM_OPTIONS_HINT') }}
					</p>
				</div>
				<div class="bizprocdesigner-process-data-form__checks">
					<span class="bizprocdesigner-process-data-form__check">
						<Checkbox
							v-model="draft.multiple"
							:id="fieldUid + '-multiple'"
							:size="checkboxSize"
							:disabled="isSchemaLocked"
							data-testid="bizprocdesigner-process-data-form-multiple"
						/>
						<label :for="fieldUid + '-multiple'">
							{{ loc('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_FORM_MULTIPLE') }}
						</label>
					</span>
					<span class="bizprocdesigner-process-data-form__check">
						<Checkbox
							v-model="draft.required"
							:id="fieldUid + '-required'"
							:size="checkboxSize"
							:disabled="isSchemaLocked"
							data-testid="bizprocdesigner-process-data-form-required"
						/>
						<label :for="fieldUid + '-required'">
							{{ loc('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_FORM_REQUIRED') }}
						</label>
					</span>
				</div>
				<div class="bizprocdesigner-process-data-form__field">
					<label class="bizprocdesigner-process-data-form__label" :for="fieldUid + '-default'">
						{{ loc('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_FORM_DEFAULT') }}
					</label>
					<textarea
						v-if="draft.multiple"
						v-model="draft.defaultValue"
						:id="fieldUid + '-default'"
						class="bizprocdesigner-process-data-form__textarea"
						:aria-describedby="fieldUid + '-default-hint'"
						data-testid="bizprocdesigner-process-data-form-default"
					></textarea>
					<BInput
						v-else
						v-model="draft.defaultValue"
						:id="fieldUid + '-default'"
						:ariaLabel="loc('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_FORM_DEFAULT')"
						:size="InputSize.Sm"
						:design="InputDesign.Grey"
						stretched
						data-testid="bizprocdesigner-process-data-form-default"
					/>
					<p
						v-if="draft.multiple"
						:id="fieldUid + '-default-hint'"
						class="bizprocdesigner-process-data-form__field-hint"
					>
						{{ loc('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_FORM_DEFAULT_MULTIPLE_HINT') }}
					</p>
				</div>
				<div class="bizprocdesigner-process-data-form__field">
					<label class="bizprocdesigner-process-data-form__label" :for="fieldUid + '-description'">
						{{ loc('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_FORM_DESCRIPTION') }}
					</label>
					<textarea
						v-model="draft.description"
						:id="fieldUid + '-description'"
						class="bizprocdesigner-process-data-form__textarea"
						data-testid="bizprocdesigner-process-data-form-description"
					></textarea>
				</div>
			</div>
			<div v-if="!isReadOnly" class="bizprocdesigner-process-data-form__actions">
				<UiButton
					v-if="!isUsagesShown && canSave"
					:text="saveText"
					:size="ButtonSize.MEDIUM"
					:style="AirButtonStyle.FILLED"
					:loading="isSaving"
					:dataset="{ testid: 'bizprocdesigner-process-data-form-save' }"
					@click="save"
				/>
				<!-- Mounted empty and filled on save: a live region announces what appears inside it, not itself. -->
				<span
					role="status"
					class="bizprocdesigner-process-data-form__saved"
					data-testid="bizprocdesigner-process-data-form-saved"
				>{{ isSaved ? loc('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_FORM_SAVED') : '' }}</span>
				<UiButton
					v-if="canDelete"
					class="bizprocdesigner-process-data-form__delete"
					:text="loc('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_FORM_DELETE')"
					:size="ButtonSize.MEDIUM"
					:style="AirButtonStyle.OUTLINE"
					:loading="isRemoving"
					:dataset="{ testid: 'bizprocdesigner-process-data-form-delete' }"
					@click="requestDelete"
				/>
			</div>
		</div>
	`
	});

	const ProcessDataList = ui_vue3.defineComponent({
		name: 'BizprocDesignerProcessDataList',
		props: {
			groups: {
				type: Array,
				default: () => []
			},
			selectedId: {
				type: String,
				default: null
			}
		},
		emits: ['select'],
		computed: {
			acceptsStartValueText() {
				return main_core.Loc.getMessage('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_ACCEPTS_START_VALUE') ?? '';
			}
		},
		methods: {
			itemId(item) {
				return bizprocdesigner_editor_chart.elementId(item.sourceType, item.key);
			},
			typeLabel,
			// An element may reach the list without a name: the identifier is what its author sees elsewhere.
			elementName(item) {
				return main_core.Type.isStringFilled(item.property?.Name) ? item.property.Name : item.key;
			},
			handleSelect(item) {
				this.$emit('select', item);
			}
		},
		template: `
		<div class="bizprocdesigner-process-data-list" data-testid="bizprocdesigner-process-data-list">
			<section
				v-for="group in groups"
				:key="group.id"
				class="bizprocdesigner-process-data-list__group"
				:data-testid="'bizprocdesigner-process-data-group-' + group.id"
			>
				<h3 class="bizprocdesigner-process-data-list__group-title">{{ group.title }}</h3>
				<p
					v-if="group.items.length === 0"
					class="bizprocdesigner-process-data-list__group-hint"
					:data-testid="'bizprocdesigner-process-data-group-hint-' + group.id"
				>
					{{ group.hint }}
				</p>
				<ul v-else class="bizprocdesigner-process-data-list__items">
					<li v-for="item in group.items" :key="itemId(item)">
						<button
							type="button"
							class="bizprocdesigner-process-data-item"
							:class="{ '--selected': itemId(item) === selectedId }"
							:aria-current="itemId(item) === selectedId ? 'true' : null"
							:data-testid="'bizprocdesigner-process-data-item-' + itemId(item)"
							@click="handleSelect(item)"
						>
							<span class="bizprocdesigner-process-data-item__main">
								<span class="bizprocdesigner-process-data-item__name">{{ elementName(item) }}</span>
								<span class="bizprocdesigner-process-data-item__type">{{ typeLabel(item.property.Type) }}</span>
							</span>
							<span
								v-if="item.acceptsStartValue || item.visibilityName"
								class="bizprocdesigner-process-data-item__meta"
							>
								<span
									v-if="item.acceptsStartValue"
									:data-testid="'bizprocdesigner-process-data-item-start-value-' + itemId(item)"
								>
									{{ acceptsStartValueText }}
								</span>
								<span
									v-if="item.visibilityName"
									:data-testid="'bizprocdesigner-process-data-item-visibility-' + itemId(item)"
								>
									{{ item.visibilityName }}
								</span>
							</span>
						</button>
					</li>
				</ul>
			</section>
		</div>
	`
	});

	const PURPOSE_ORDER = ['input', 'internal', 'constant', 'shared'];
	const SKELETON_LINES = [0, 1, 2, 3, 4];

	// ui.system.dialog fixes the width (it passes width as both minWidth and maxWidth) and the popup only
	// shifts a box that does not fit, so the viewport cap has to be applied here. Same size as the history
	// of the process: both windows stand over the scheme and are read next to it.
	const DIALOG_WIDTH = 700;
	const DIALOG_VIEWPORT_GAP = 32;
	const POPUP_CLASS = 'bizprocdesigner-process-data-popup';

	// The whole list is filtered and re-rendered on every applied term, so it follows the typing instead
	// of every keystroke of it.
	const SEARCH_DEBOUNCE_MS = 200;
	const ProcessDataWindow = ui_vue3.defineComponent({
		name: 'BizprocDesignerProcessDataWindow',
		components: {
			Alert: ui_system_alert_vue.Alert,
			BInput: ui_system_input_vue.BInput,
			BLine: ui_system_skeleton_vue.BLine,
			ElementForm,
			ProcessDataList,
			UiButton: ui_vue3_components_button.Button
		},
		setup() {
			return {
				store: bizprocdesigner_editor_chart.useProcessDataStore(),
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				AlertDesign: ui_system_alert.AlertDesign,
				ButtonSize: ui_vue3_components_button.ButtonSize,
				InputDesign: ui_system_input_vue.InputDesign,
				InputSize: ui_system_input_vue.InputSize
			};
		},
		data() {
			return {
				query: '',
				// The term the list stands on: the typed one reaches it when the typing stops.
				needle: '',
				isCreating: false,
				instance: null,
				// Read before the window opens: the element that called it takes the focus back on close.
				opener: ui_a11y.FocusNavigator.getActiveElement()
			};
		},
		computed: {
			title() {
				return main_core.Loc.getMessage('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_TITLE') ?? '';
			},
			purposeGroups() {
				return PURPOSE_ORDER.map(purpose => ({
					id: purpose,
					title: main_core.Loc.getMessage(`BIZPROCDESIGNER_EDITOR_PROCESS_DATA_GROUP_${purpose.toUpperCase()}`),
					hint: main_core.Loc.getMessage(`BIZPROCDESIGNER_EDITOR_PROCESS_DATA_GROUP_${purpose.toUpperCase()}_HINT`),
					items: this.matching(this.store.byPurpose(purpose))
				}))
				// While a search is on, a group with nothing found is noise, not an invitation to fill it.
				.filter(group => this.needle === '' || group.items.length > 0);
			},
			isFormShown() {
				return this.isCreating || this.store.selected !== null;
			},
			// A refusal of the catalog itself has no form to land in, so the window itself has to name it.
			loadError() {
				if (this.store.isLoading || this.isFormShown || this.store.errors.length === 0) {
					return '';
				}
				const named = this.store.errors.map(error => error.message).find(message => message !== '');
				return named ?? main_core.Loc.getMessage('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_LOAD_ERROR') ?? '';
			},
			hasResults() {
				return this.purposeGroups.some(group => group.items.length > 0);
			},
			isSearchEmpty() {
				return this.needle !== '' && !this.hasResults;
			},
			readOnlyNotice() {
				if (this.store.mechanics === 'legacy') {
					return main_core.Loc.getMessage('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_READONLY_LEGACY') ?? '';
				}
				if (!this.store.canEdit) {
					return main_core.Loc.getMessage('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_READONLY_NO_RIGHTS') ?? '';
				}
				return main_core.Loc.getMessage('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_READONLY_LOCKED') ?? '';
			},
			// The header is the one part of the window that never scrolls away, so the mode of the whole
			// window is read there instead of eating a line above the list.
			subtitle() {
				return this.store.isLoading || !this.store.isReadOnly ? '' : this.readOnlyNotice;
			},
			runningInstancesNotice() {
				return main_core.Loc.getMessage('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_RUNNING_INSTANCES', {
					'#COUNT#': String(this.store.runningInstances)
				}) ?? '';
			},
			searchPlaceholder() {
				return main_core.Loc.getMessage('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_SEARCH_PLACEHOLDER') ?? '';
			},
			addText() {
				return main_core.Loc.getMessage('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_ADD') ?? '';
			},
			backText() {
				return main_core.Loc.getMessage('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_BACK') ?? '';
			},
			emptySearchText() {
				return main_core.Loc.getMessage('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_EMPTY_SEARCH') ?? '';
			},
			loadingText() {
				return main_core.Loc.getMessage('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_LOADING') ?? '';
			},
			skeletonLines: () => SKELETON_LINES
		},
		watch: {
			// The window is not modal and its header is the only place a state of the whole window is read.
			subtitle(value) {
				this.instance?.setSubtitle(value);
				this.dressPopup();
			},
			query() {
				this.applyQuery();
			}
		},
		created() {
			this.applyQuery = main_core.Runtime.debounce(() => {
				this.needle = this.query.trim().toLowerCase();
			}, SEARCH_DEBOUNCE_MS, this);
		},
		mounted() {
			this.getDialog().setContent(this.$refs.content);
			this.getDialog().show();
			// The window is added to the end of the body, so without the focus taken into it a person
			// tabbing from the menu it was opened from walks the whole editor to reach it. It lands on the
			// window itself and not on its first control: the window is read before it is acted upon.
			this.dressPopup()?.focus({
				preventScroll: true
			});
		},
		unmounted() {
			this.instance?.hide();
			this.opener?.focus({
				preventScroll: true
			});
		},
		methods: {
			getDialog() {
				if (!this.instance) {
					this.instance = ui_vue3.markRaw(this.createDialog());
				}
				return this.instance;
			},
			createDialog() {
				return new ui_system_dialog.Dialog({
					title: this.title,
					subtitle: this.subtitle,
					events: {
						onHide: this.handleClose
					},
					width: Math.min(DIALOG_WIDTH, window.innerWidth - DIALOG_VIEWPORT_GAP),
					// The window is meant to stay open while a person edits the scheme, and every click on
					// the scheme lands outside it. Closing is left to the close button, the cross and Esc.
					closeByClickOutside: false
				});
			},
			/**
			 * Every setter of the dialog re-renders the header, the content and the footer, so the popup is
			 * dressed again after each of them. The class is what hides the footer left without buttons, and
			 * the tabindex is what lets the window itself take the focus when it opens.
			 *
			 * The window is meant to stay open over the scheme, so it must not hold the focus either: the trap
			 * the popup arms by default loops Tab inside the window, and dropping the loop is what a non-modal
			 * window needs. Nothing outside it is isolated in the first place.
			 */
			dressPopup() {
				const popup = bizprocdesigner_editor_chart.makeDialogDraggable(this.$refs.content);
				if (!popup) {
					return null;
				}
				const container = popup.getPopupContainer();
				main_core.Dom.addClass(container, POPUP_CLASS);
				main_core.Dom.attr(container, 'aria-label', this.title);
				main_core.Dom.attr(container, 'tabindex', '-1');
				popup.getFocusTrap()?.setLooped(false);
				return container;
			},
			matching(elements) {
				if (this.needle === '') {
					return elements;
				}
				return elements.filter(element => {
					const name = main_core.Type.isStringFilled(element.property?.Name) ? element.property.Name : '';
					return element.key.toLowerCase().includes(this.needle) || name.toLowerCase().includes(this.needle);
				});
			},
			handleSelect(element) {
				this.store.selectedId = bizprocdesigner_editor_chart.elementId(element.sourceType, element.key);
				this.isCreating = false;
			},
			handleAdd() {
				this.store.selectedId = null;
				this.isCreating = true;
			},
			handleClose() {
				this.store.close();
			},
			handleFormClose() {
				this.isCreating = false;
				this.store.selectedId = null;
			}
		},
		template: `
		<div
			ref="content"
			class="bizprocdesigner-process-data"
			data-testid="bizprocdesigner-process-data-window"
		>
			<Alert
				v-if="loadError !== ''"
				class="bizprocdesigner-process-data__notice"
				:design="AlertDesign.tintedAlert"
				role="alert"
				data-testid="bizprocdesigner-process-data-error"
			>
				{{ loadError }}
			</Alert>
			<Alert
				v-if="!store.isLoading && store.runningInstances > 0"
				class="bizprocdesigner-process-data__notice"
				:design="AlertDesign.tintedWarning"
				data-testid="bizprocdesigner-process-data-running-instances"
			>
				{{ runningInstancesNotice }}
			</Alert>
			<div v-if="isFormShown" class="bizprocdesigner-process-data__toolbar">
				<UiButton
					:text="backText"
					:size="ButtonSize.SMALL"
					:style="AirButtonStyle.PLAIN"
					:dataset="{ testid: 'bizprocdesigner-process-data-back' }"
					@click="handleFormClose"
				/>
			</div>
			<div v-else class="bizprocdesigner-process-data__toolbar">
				<BInput
					v-model="query"
					class="bizprocdesigner-process-data__search"
					type="search"
					:size="InputSize.Sm"
					:design="InputDesign.Grey"
					:placeholder="searchPlaceholder"
					:ariaLabel="searchPlaceholder"
					stretched
					data-testid="bizprocdesigner-process-data-search"
				/>
				<UiButton
					v-if="!store.isReadOnly"
					class="bizprocdesigner-process-data__add"
					:text="addText"
					:size="ButtonSize.SMALL"
					:style="AirButtonStyle.FILLED"
					:dataset="{ testid: 'bizprocdesigner-process-data-add' }"
					@click="handleAdd"
				/>
			</div>
			<div class="bizprocdesigner-process-data__body">
				<div
					v-if="store.isLoading"
					class="bizprocdesigner-process-data__skeleton"
					role="status"
					:aria-label="loadingText"
					aria-busy="true"
					data-testid="bizprocdesigner-process-data-skeleton"
				>
					<BLine v-for="line in skeletonLines" :key="line"/>
				</div>
				<ElementForm
					v-else-if="isFormShown"
					:element="store.selected"
					@close="handleFormClose"
				/>
				<p
					v-else-if="isSearchEmpty"
					class="bizprocdesigner-process-data__empty"
					data-testid="bizprocdesigner-process-data-empty-search"
				>
					{{ emptySearchText }}
				</p>
				<ProcessDataList
					v-else
					:groups="purposeGroups"
					:selectedId="store.selectedId"
					@select="handleSelect"
				/>
			</div>
		</div>
	`
	});

	exports.ProcessDataWindow = ProcessDataWindow;

})(this.BX.Bizprocdesigner.Editor = this.BX.Bizprocdesigner.Editor || {}, BX, BX.UI.Accessibility, BX.UI.System.Alert, BX.UI.System.Alert.Vue, BX.UI.System, BX.UI.System.Input.Vue, BX.UI.System.Skeleton.Vue, BX.Vue3, BX.Vue3.Components, BX.Bizprocdesigner.Editor, BX.UI, BX.UI.IconSet, BX.UI.System.Checkbox);
//# sourceMappingURL=process-data.bundle.js.map
