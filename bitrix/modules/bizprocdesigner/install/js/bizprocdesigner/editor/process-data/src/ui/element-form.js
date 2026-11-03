import { Loc, Type } from 'main.core';
import { AirButtonStyle as PopupButtonStyle, Button as PopupButton } from 'ui.buttons';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { AlertDesign } from 'ui.system.alert';
import { Alert } from 'ui.system.alert.vue';
import { Vue as CheckboxVue, CheckboxSize } from 'ui.system.checkbox';
import { Dialog } from 'ui.system.dialog';
import { BInput, InputDesign, InputSize } from 'ui.system.input.vue';
import { defineComponent } from 'ui.vue3';
import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';

import {
	type ProcessDataElement,
	type ProcessDataProperty,
	type ProcessDataUsage,
	type Purpose,
	useProcessDataStore,
} from 'bizprocdesigner.editor.chart';

import { purposeLabel, typeLabel } from '../labels';
import { ElementUsages } from './element-usages';

/** Purposes an element of a template may take: a global value is not one of them (DTO-01). */
const TEMPLATE_PURPOSES: Purpose[] = ['input', 'internal', 'constant'];

/** Storage a global value of the purpose lives in (SC-009): the portal keeps variables and constants. */
const GLOBAL_STORAGE_OF_PURPOSE: { [string]: string } = {
	internal: 'GlobalVar',
	constant: 'GlobalConst',
};

/** Purpose a global value stands for in the form of a template: the portal keeps no parameters. */
const PURPOSE_OF_GLOBAL: { [string]: Purpose } = {
	GlobalVar: 'internal',
	GlobalConst: 'constant',
};

/** Scopes an element is kept in: the template of the process or the portal. */
const SCOPES: string[] = ['local', 'global'];

/** Types the legacy field bridge renders — the set `BX.Bizproc.FieldType.isBaseType` answers for. */
const TYPES: string[] = ['string', 'text', 'int', 'double', 'bool', 'date', 'datetime', 'time', 'select', 'user'];

const DEFAULT_TYPE = 'string';
const SELECT_TYPE = 'select';

/** Identifier prefixes of the legacy designer: a generated identifier stays familiar to the developer. */
const KEY_PREFIXES: { [string]: string } = {
	input: 'Parameter',
	internal: 'Variable',
	constant: 'Constant',
};

const HAS_WRITERS_CODE = 'PROCESS_DATA_HAS_WRITERS';
const IN_USE_CODE = 'PROCESS_DATA_IN_USE';

let formInstanceCounter = 0;

type ElementDraft = {
	key: string;
	name: string;
	purpose: Purpose;
	scope: string;
	type: string;
	multiple: boolean;
	required: boolean;
	defaultValue: string;
	description: string;
	options: string;
	visibility: string;
};

function valueToText(value: mixed): string
{
	if (Type.isNil(value))
	{
		return '';
	}

	return Type.isArray(value) ? value.join('\n') : String(value);
}

function textToLines(text: string): Array<string>
{
	return text.split('\n').map((line) => line.trim()).filter((line) => line !== '');
}

function optionsToText(options: mixed): string
{
	if (!Type.isPlainObject(options))
	{
		return '';
	}

	return Object.entries(options).map(([value, name]) => `${value}=${String(name)}`).join('\n');
}

function textToOptions(text: string): { [string]: string } | null
{
	const entries = text
		.split('\n')
		.map((line: string) => line.trim())
		.filter((line: string) => line !== '')
		.map((line: string) => {
			const separator = line.indexOf('=');

			return separator === -1
				? [line, line]
				: [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
		})
	;

	return entries.length === 0 ? null : Object.fromEntries(entries);
}

/** A global value answers `shared`, so its purpose in the template is taken from its storage. */
function templatePurposeOf(element: ProcessDataElement | null): Purpose
{
	// A pair answers `internal`, but the form edits the purpose the user picks, and the filling at the start
	// is exactly what `input` stands for: otherwise a pair could never be turned back into a plain variable.
	if (element?.acceptsStartValue === true)
	{
		return 'input';
	}

	const purpose = element?.purpose;

	if (TEMPLATE_PURPOSES.includes(purpose))
	{
		return purpose;
	}

	return PURPOSE_OF_GLOBAL[element?.sourceType] ?? TEMPLATE_PURPOSES[0];
}

function draftOf(element: ProcessDataElement | null, defaultVisibility: string): ElementDraft
{
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
		visibility: element?.visibility ?? defaultVisibility,
	};
}

export const ElementForm = defineComponent({
	name: 'BizprocDesignerProcessDataElementForm',
	components: {
		Alert,
		BIcon,
		BInput,
		Checkbox: CheckboxVue.Checkbox,
		ElementUsages,
		UiButton,
	},
	props: {
		/**
		 * Element the form edits; nothing means the form creates a new one.
		 * @type {ProcessDataElement | null}
		 */
		element: {
			type: Object,
			default: null,
		},
	},
	emits: ['close'],
	setup(): Object
	{
		return {
			store: useProcessDataStore(),
			AirButtonStyle,
			AlertDesign,
			ButtonSize,
			InputDesign,
			InputSize,
			checkboxSize: CheckboxSize.Sm,
			iconSet: Outline,
			types: TYPES,
		};
	},
	data(): {
		draft: ElementDraft,
		usages: ProcessDataUsage[],
		usagesRequest: number,
		isLoadingUsages: boolean,
		isUsagesShown: boolean,
		isSaving: boolean,
		isSaved: boolean,
		isRemoving: boolean,
		fieldUid: string,
		} {
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
			fieldUid: `bizprocdesigner-process-data-form-${++formInstanceCounter}`,
		};
	},
	computed: {
		isCreating(): boolean
		{
			return this.element === null;
		},
		isReadOnly(): boolean
		{
			return this.store.isReadOnly;
		},
		isShared(): boolean
		{
			return this.element?.purpose === 'shared';
		},
		/** Purpose the draft asks for: the scope decides between the portal and the blocks of the template. */
		targetPurpose(): Purpose
		{
			return this.draft.scope === SCOPES[1] ? 'shared' : this.draft.purpose;
		},
		/** Purpose the element stands at now: an element of the legacy designer carries no label of its own. */
		currentPurpose(): Purpose
		{
			return this.isShared ? 'shared' : templatePurposeOf(this.element);
		},
		isPurposeChanged(): boolean
		{
			return !this.isCreating && this.targetPurpose !== this.currentPurpose;
		},
		isSharedDraft(): boolean
		{
			return this.targetPurpose === 'shared';
		},
		/**
		 * The type, the multiplicity, the requirement and the visibility of a shared value are set when it is
		 * created: the portal refuses to change them on an existing one.
		 */
		isSchemaLocked(): boolean
		{
			return this.isShared && this.isSharedDraft;
		},
		/** Storage of a global value follows its purpose: the developer picks a purpose, not a table. */
		storage(): string
		{
			return GLOBAL_STORAGE_OF_PURPOSE[this.draft.purpose] ?? GLOBAL_STORAGE_OF_PURPOSE.internal;
		},
		canDelete(): boolean
		{
			return !this.isCreating && (this.isShared ? this.store.sharedAccess.canDelete : true);
		},
		canSave(): boolean
		{
			if (this.isSharedDraft)
			{
				return this.store.sharedAccess.canUpsert;
			}

			// Taking a value back into the template removes it from the portal, so it is asked of who may delete.
			return this.isShared ? this.store.sharedAccess.canDelete : true;
		},
		purposes: (): Purpose[] => TEMPLATE_PURPOSES,
		scopes: (): string[] => SCOPES,
		/**
		 * A scope is offered to who may write shared values. A value already global shows its scope locked:
		 * other templates may answer to it, so the way back into the template is not offered.
		 */
		isScopeOffered(): boolean
		{
			return this.isShared || this.store.sharedAccess.canUpsert;
		},
		/** The portal keeps variables and constants: an input value is passed at start and stays local, so
		 * the scope is not asked of it at all. */
		isScopeLocked(): boolean
		{
			return this.draft.purpose === 'input';
		},
		/** Each hint speaks for its own select: what globality means is told by the scope hint below. */
		purposeHint(): string
		{
			return this.loc(`BIZPROCDESIGNER_EDITOR_PROCESS_DATA_GROUP_${this.draft.purpose.toUpperCase()}_HINT`);
		},
		scopeHint(): string
		{
			return this.loc(`BIZPROCDESIGNER_EDITOR_PROCESS_DATA_FORM_SCOPE_${this.draft.scope.toUpperCase()}_HINT`);
		},
		visibilityOptions(): Array<{ code: string, name: string }>
		{
			return Object.entries(this.store.sharedAccess.visibility)
				.map(([code, name]) => ({ code, name: String(name) }))
			;
		},
		title(): string
		{
			if (this.isCreating)
			{
				return this.loc('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_FORM_TITLE_CREATE');
			}

			return this.draft.name === '' ? this.draft.key : this.draft.name;
		},
		writers(): ProcessDataUsage[]
		{
			const error = this.store.errors.find((item) => item.code === HAS_WRITERS_CODE);
			const activities = error?.customData?.activities;

			return Type.isArray(activities) ? activities : [];
		},
		// The identifier has no field of its own: its errors join the common ones of the form.
		formError(): string
		{
			return this.store.errors
				.map((item) => item.message)
				.filter((message: string) => message !== '')
				.join(' ')
			;
		},
		hasOptions(): boolean
		{
			return this.draft.type === SELECT_TYPE;
		},
		defaultValueText(): string
		{
			return textToLines(this.draft.defaultValue).join(', ');
		},
		saveText(): string
		{
			return this.isCreating
				? this.loc('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_FORM_CREATE')
				: this.loc('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_FORM_SAVE')
			;
		},
	},
	watch: {
		// The window stays open after a save, so the answer holds only until the next edit.
		draft: {
			deep: true,
			handler(): void
			{
				this.isSaved = false;
			},
		},
		element(): void
		{
			this.draft = draftOf(this.element, this.draft.visibility);
			this.refreshGeneratedKey();
			this.isUsagesShown = false;
			this.resetUsages();
		},
		'draft.purpose'(): void
		{
			if (this.isScopeLocked)
			{
				this.draft.scope = 'local';
			}

			this.refreshGeneratedKey();
		},
	},
	created(): void
	{
		this.refreshGeneratedKey();
		this.confirmDialog = null;
	},
	beforeUnmount(): void
	{
		this.confirmDialog?.hide();
		this.confirmDialog = null;
	},
	methods: {
		loc(code: string, params: Object | null = null): string
		{
			return Loc.getMessage(code, params) ?? '';
		},
		purposeLabel,
		typeLabel,
		scopeLabel(scope: string): string
		{
			return this.loc(`BIZPROCDESIGNER_EDITOR_PROCESS_DATA_FORM_SCOPE_${scope.toUpperCase()}`);
		},
		/**
		 * A new element gets its identifier by itself: the developer names it, not identifies it.
		 * The stamp of the moment is what the legacy form of global values takes it from — an identifier
		 * free of any element the portal keeps out of sight of this template.
		 */
		refreshGeneratedKey(): void
		{
			if (!this.isCreating)
			{
				return;
			}

			this.draft.key = `${KEY_PREFIXES[this.draft.purpose]}${Date.now()}`;
		},
		resetUsages(): void
		{
			this.usagesRequest += 1;
			this.usages = [];
			this.isLoadingUsages = false;
		},
		/** The nodes an element is written and read in are asked for when the panel is opened, and not before. */
		async loadUsages(): Promise<void>
		{
			this.resetUsages();
			if (this.isCreating)
			{
				return;
			}

			const request = this.usagesRequest;
			this.isLoadingUsages = true;
			try
			{
				const usages = await this.store.usages(this.element.sourceType, this.element.key);
				if (request === this.usagesRequest)
				{
					this.usages = usages;
				}
			}
			finally
			{
				if (request === this.usagesRequest)
				{
					this.isLoadingUsages = false;
				}
			}
		},
		showSettings(): void
		{
			this.isUsagesShown = false;
		},
		showUsages(): void
		{
			this.isUsagesShown = true;
			this.loadUsages();
		},
		buildProperty(): $Shape<ProcessDataProperty>
		{
			const property = {
				Name: this.draft.name,
				Description: this.draft.description,
				Type: this.draft.type,
				Multiple: this.draft.multiple,
				Required: this.draft.required,
				Options: this.hasOptions ? textToOptions(this.draft.options) : null,
				Default: this.draft.multiple ? textToLines(this.draft.defaultValue) : this.draft.defaultValue,
			};

			// Visibility belongs to the portal alone, and it is read here: the move replaces the draft.
			return this.isSharedDraft ? { ...property, Visibility: this.draft.visibility } : property;
		},
		/**
		 * Nothing is written and nothing is asked until the save: the selects only hold what the developer
		 * intends. The edited property travels with the move, so one intent of the developer is one change of
		 * the server and a refused save leaves no half of it behind.
		 */
		async save(): Promise<void>
		{
			if (this.isSaving)
			{
				return;
			}

			let isMoving = this.isPurposeChanged;
			const purpose = this.targetPurpose;

			// A refused move leaves the element where it is, but the rest of the edits still stand.
			if (isMoving && !await this.confirm(this.purposeConfirmationText(purpose)))
			{
				this.resetPurpose();
				isMoving = false;
			}

			const property = this.buildProperty();

			this.isSaving = true;
			try
			{
				if (isMoving)
				{
					if (!await this.store.changePurpose(
						this.element.sourceType,
						this.element.key,
						purpose,
						property,
						this.storage,
					))
					{
						this.resetPurpose();

						return;
					}
				}
				else if (!await this.submit(this.isCreating ? null : this.element, property))
				{
					return;
				}

				if (this.isCreating)
				{
					this.$emit('close');

					return;
				}

				// The saved element replaces the draft, and that edit of its own must not eat the answer.
				await this.$nextTick();
				this.isSaved = true;
			}
			finally
			{
				this.isSaving = false;
			}
		},
		submit(target: ProcessDataElement | null, property: $Shape<ProcessDataProperty>): Promise<boolean>
		{
			if (target === null)
			{
				return this.isSharedDraft
					? this.store.upsertShared(this.storage, this.draft.key, property)
					: this.store.create({ key: this.draft.key, purpose: this.draft.purpose, property })
				;
			}

			return target.purpose === 'shared'
				? this.store.upsertShared(target.sourceType, target.key, property)
				: this.store.update(target.sourceType, target.key, property)
			;
		},
		/** A refused move has to leave the selects showing what the element still is. */
		resetPurpose(): void
		{
			this.draft.purpose = templatePurposeOf(this.element);
			this.draft.scope = this.isShared ? SCOPES[1] : SCOPES[0];
		},
		purposeConfirmationText(purpose: Purpose): string
		{
			if (purpose === 'shared')
			{
				return this.loc('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_CONFIRM_PURPOSE_TO_SHARED');
			}

			if (this.currentPurpose === 'internal' && purpose === 'input')
			{
				return this.loc('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_CONFIRM_PURPOSE_PAIR');
			}

			return this.loc('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_CONFIRM_PURPOSE');
		},
		async requestDelete(): Promise<void>
		{
			if (this.isRemoving)
			{
				return;
			}

			const text = this.loc(
				'BIZPROCDESIGNER_EDITOR_PROCESS_DATA_CONFIRM_DELETE',
				{ '#KEY#': this.element.key },
			);

			if (!await this.confirm(text))
			{
				return;
			}

			this.isRemoving = true;
			try
			{
				await this.remove();
			}
			finally
			{
				this.isRemoving = false;
			}
		},
		async remove(): Promise<void>
		{
			const isDone = this.isShared
				? await this.store.removeShared(this.element.sourceType, this.element.key)
				: await this.store.remove(this.element.sourceType, this.element.key)
			;

			if (isDone)
			{
				this.$emit('close');

				return;
			}

			// What holds the element is the answer to the refusal, so it replaces the tab it belongs to.
			const inUse = this.store.errors.find((item) => item.code === IN_USE_CODE);
			if (inUse)
			{
				const activities = inUse.customData?.activities;
				this.usages = Type.isArray(activities) ? activities : this.usages;
				this.isUsagesShown = true;
			}
		},
		/** A hidden dialog destroys its popup, so every confirmation is asked by a dialog of its own. */
		confirm(subtitle: string): Promise<boolean>
		{
			return new Promise((resolve) => {
				let isConfirmed = false;

				const confirmButton = new PopupButton({
					text: this.loc('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_CONFIRM_OK'),
					useAirDesign: true,
					style: PopupButtonStyle.FILLED,
					dataset: { testid: 'bizprocdesigner-process-data-confirm-ok' },
				});
				const cancelButton = new PopupButton({
					text: this.loc('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_CONFIRM_CANCEL'),
					useAirDesign: true,
					style: PopupButtonStyle.OUTLINE,
					dataset: { testid: 'bizprocdesigner-process-data-confirm-cancel' },
				});

				const dialog = new Dialog({
					title: this.loc('BIZPROCDESIGNER_EDITOR_PROCESS_DATA_CONFIRM_TITLE'),
					subtitle,
					centerButtons: [cancelButton, confirmButton],
					width: 420,
					events: {
						onHide: () => {
							this.confirmDialog = null;
							resolve(isConfirmed);
						},
					},
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
		},
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
	`,
});
