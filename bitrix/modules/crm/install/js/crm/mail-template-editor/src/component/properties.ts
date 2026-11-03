import { Dom, Event, Loc, Text } from 'main.core';
import { type BaseEvent } from 'main.core.events';
import { defineComponent, markRaw, type PropType } from 'ui.vue3';
import { TagSelector, type Dialog, type Item } from 'ui.entity-selector';
import { BInput, InputDesign, InputSize } from 'ui.system.input.vue';
import { Chip, ChipDesign, ChipSize } from 'ui.system.chip.vue';
import { BMenu } from 'ui.system.menu.vue';
import { TextSm } from 'ui.system.typography.vue';
import { Switcher } from 'ui.vue3.components.switcher';

import { type EditorAccessItem, type EditorEntityType, type EditorFields, type EditorStore } from '../model/editor-store';

type InputComponent = { $el: HTMLElement; focus(): void };
type ChipComponent = { $el: HTMLElement };
type SwitcherComponent = { switcher: { getNode(): HTMLElement } | null };

export type EditorPropertiesInstance = {
	focusTitle(): void;
	focusField(field: keyof EditorFields): boolean;
};

type AccessControl = {
	selector: TagSelector | null;
	dialog: Dialog | null;
	initialized: boolean;
	disposed: boolean;
	openRequested: boolean;
};
type EntityTypeMenuOptions = {
	bindElement: HTMLElement;
	className: string;
	maxWidth: number;
	closeOnItemClick: boolean;
	items: {
		id: string;
		title: string;
		isSelected: boolean;
		onClick(): void;
	}[];
};

function getInput(component: unknown): HTMLInputElement | null
{
	return (component as InputComponent | undefined)?.$el.querySelector('input') ?? null;
}

function getFieldError(store: EditorStore, field: keyof EditorFields): string
{
	return store.state.errors.filter((error) => error.field === field).map((error) => error.message).join('\n');
}

export const EditorProperties = defineComponent({
	name: 'CrmMailTemplateEditorProperties',
	components: { BInput, Chip, BMenu, TextSm, Switcher },
	props: {
		store: {
			type: Object as PropType<EditorStore>,
			required: true,
		},
	},
	expose: ['focusTitle', 'focusField'],
	setup()
	{
		const accessControl: AccessControl = {
			selector: null,
			dialog: null,
			initialized: false,
			disposed: false,
			openRequested: false,
		};

		return {
			Loc,
			InputDesign,
			InputSize,
			ChipDesign,
			ChipSize,
			fieldId: `crm-mail-template-properties-${Text.getRandom()}`,
			accessControl: markRaw(accessControl),
		};
	},
	data()
	{
		return {
			isTypeMenuShown: false,
			accessLoadFailed: false,
		};
	},
	computed: {
		isDisabled(): boolean
		{
			return !this.store.state.canEdit || this.store.state.busy;
		},
		titleError(): string
		{
			return getFieldError(this.store, 'title');
		},
		entityTypeError(): string
		{
			return getFieldError(this.store, 'entityTypeId');
		},
		accessError(): string
		{
			const errors = [getFieldError(this.store, 'access')];
			if (this.accessLoadFailed)
			{
				errors.unshift(Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_ACCESS_LOAD_ERROR') ?? '');
			}

			return errors.filter((message) => message !== '').join('\n');
		},
		activityError(): string
		{
			return getFieldError(this.store, 'isActive');
		},
		currentEntityType(): EditorEntityType
		{
			const { entityTypeId, entityTypes, placeholderMaps } = this.store.state;
			const currentType = entityTypes.find((type) => type.id === entityTypeId);
			if (currentType)
			{
				return currentType;
			}

			const name = placeholderMaps.find((map) => map.typeId === entityTypeId)?.typeName
				?? Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_ENTITY_TYPE_CURRENT', { '#ID#': String(entityTypeId) })
				?? ''
			;

			return { id: entityTypeId, name };
		},
		entityTypeMenuOptions(): EntityTypeMenuOptions
		{
			const types = [...this.store.state.entityTypes];
			if (!types.some((type) => type.id === this.store.state.entityTypeId))
			{
				types.unshift(this.currentEntityType);
			}

			return {
				bindElement: (this.$refs.entityType as ChipComponent).$el,
				className: 'crm-mail-template-editor__choice-menu',
				maxWidth: this.$el.getBoundingClientRect().width,
				closeOnItemClick: true,
				items: types.map((type) => ({
					id: `crm-mail-template-entity-type-${type.id}`,
					title: type.name,
					isSelected: type.id === this.store.state.entityTypeId,
					onClick: () => this.handleEntityTypeSelect(type.id),
				})),
			};
		},
		isPersonal(): boolean
		{
			return this.store.state.access.every(([entityId, id]) => this.isOwner(entityId, id));
		},
	},
	watch: {
		isDisabled(): void
		{
			this.isTypeMenuShown = false;
			this.updateAccessAvailability();
		},
		titleError(): void
		{
			this.updateTitleAccessibility();
		},
	},
	mounted(): void
	{
		this.updateTitleAccessibility();
		this.createAccessSelector();
	},
	beforeUnmount(): void
	{
		this.accessControl.disposed = true;
		if (this.accessControl.selector)
		{
			Event.unbind(this.accessControl.selector.getAddButtonLink(), 'click', this.handleAccessOpen, true);
		}
		this.isTypeMenuShown = false;
		this.updateAccessAvailability();
		if (!this.accessControl.dialog?.isLoading())
		{
			this.destroyAccessDialog();
		}
	},
	methods: {
		focusTitle(): void
		{
			this.focusField('title');
		},
		focusField(field: keyof EditorFields): boolean
		{
			let target: HTMLElement | null = null;
			switch (field)
			{
				case 'title':
					target = getInput(this.$refs.title);
					break;
				case 'entityTypeId':
					target = (this.$refs.entityType as ChipComponent | undefined)?.$el ?? null;
					break;
				case 'access':
					target = this.accessControl.initialized
						? this.accessControl.selector?.getAddButtonLink() ?? null
						: this.$refs.access as HTMLElement
					;
					break;
				case 'isActive':
					target = (this.$refs.active as SwitcherComponent | undefined)?.switcher?.getNode() ?? null;
					break;
				default:
					return false;
			}

			if (!target)
			{
				return false;
			}

			target.scrollIntoView({ block: 'nearest' });
			target.focus({ preventScroll: true });

			return true;
		},
		updateTitleAccessibility(): void
		{
			const input = getInput(this.$refs.title);
			if (input)
			{
				Dom.attr(input, {
					id: `${this.fieldId}-title`,
					'aria-required': 'true',
					'aria-invalid': this.titleError ? 'true' : null,
					'aria-describedby': this.titleError ? `${this.fieldId}-title-error` : null,
				});
			}
		},
		handleTitleInput(value: string): void
		{
			this.store.setField('title', value);
		},
		handleTypeMenu(): void
		{
			if (!this.isDisabled)
			{
				this.isTypeMenuShown = !this.isTypeMenuShown;
			}
		},
		handleEntityTypeSelect(id: number): void
		{
			this.store.setField('entityTypeId', id);
			this.isTypeMenuShown = false;
		},
		isOwner(entityId: string, id: number | string): boolean
		{
			return entityId === 'user' && String(id) === String(this.store.state.ownerId);
		},
		createAccessSelector(): void
		{
			const preselectedItems = this.store.state.access.filter(([entityId, id]) => !this.isOwner(entityId, id));
			const selector = new TagSelector({
				readonly: !this.store.state.canEdit,
				locked: true,
				addButtonCaption: Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_ACCESS_SELECT') ?? '',
				addButtonCaptionMore: Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_ACCESS_ADD') ?? '',
				dialogOptions: {
					targetNode: this.$refs.access as HTMLElement,
					context: 'PROVIDING-ACCESS-TO-TEMPLATE',
					ariaLabel: Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_ACCESS') ?? '',
					entities: [
						{ id: 'user', options: { inviteEmployeeLink: false, '!userId': [this.store.state.ownerId] } },
						{ id: 'department', options: { selectMode: 'departmentsOnly' } },
						{ id: 'meta-user', options: { 'all-users': true } },
					],
					preselectedItems,
					events: {
						'Item:onBeforeSelect': this.handleBeforeAccessSelect,
						'Item:onBeforeDeselect': this.handleBeforeAccessDeselect,
						'Item:onSelect': this.handleAccessChange,
						'Item:onDeselect': this.handleAccessChange,
						onLoad: this.handleAccessLoad,
						onLoadError: this.handleAccessLoadError,
					},
				},
			});

			this.accessControl.selector = selector;
			this.accessControl.dialog = selector.getDialog();
			selector.renderTo(this.$refs.access as HTMLElement);
			Dom.attr(selector.getAddButtonLink(), 'data-testid', 'crm-mail-template-access-select');
			Event.bind(selector.getAddButtonLink(), 'click', this.handleAccessOpen, true);
			Dom.attr(selector.getTextBox(), {
				'aria-label': Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_ACCESS') ?? '',
				'data-testid': 'crm-mail-template-access-search',
			});

			if (preselectedItems.length === 0 || !this.accessControl.dialog?.hasDynamicLoad())
			{
				this.handleAccessLoad();
			}
		},
		handleAccessOpen(event: MouseEvent): void
		{
			const { dialog, disposed } = this.accessControl;
			if (!dialog || dialog.isLoaded() || !dialog.hasDynamicLoad())
			{
				return;
			}

			event.preventDefault();
			event.stopImmediatePropagation();
			if (disposed || this.isDisabled)
			{
				return;
			}

			this.accessControl.openRequested = true;
			dialog.load();
		},
		handleBeforeAccessSelect(event: BaseEvent): void
		{
			const item = event.getData().item as Item;
			if (this.isOwner(item.getEntityId(), item.getId()))
			{
				event.preventDefault();
			}
			else
			{
				this.handleBeforeAccessDeselect(event);
			}
		},
		handleBeforeAccessDeselect(event: BaseEvent): void
		{
			if (this.accessControl.disposed || (this.accessControl.initialized && this.isDisabled))
			{
				event.preventDefault();
			}
		},
		handleAccessLoad(): void
		{
			if (this.accessControl.disposed)
			{
				this.destroyAccessDialog();

				return;
			}

			this.accessControl.initialized = true;
			this.accessLoadFailed = false;
			this.updateAccessAvailability();
			if (this.accessControl.openRequested)
			{
				this.accessControl.openRequested = false;
				this.accessControl.selector?.getAddButtonLink().click();
			}
		},
		handleAccessLoadError(): void
		{
			this.accessControl.openRequested = false;
			if (this.accessControl.disposed)
			{
				this.destroyAccessDialog();

				return;
			}

			this.accessLoadFailed = true;
			this.updateAccessAvailability();
		},
		updateAccessAvailability(): void
		{
			const { selector, dialog, initialized, disposed } = this.accessControl;
			if (disposed || this.isDisabled)
			{
				this.accessControl.openRequested = false;
			}
			selector?.setReadonly(disposed || !this.store.state.canEdit);
			selector?.setLocked(disposed || this.isDisabled || !initialized || dialog?.isLoading());
			if ((disposed || this.isDisabled) && dialog?.isOpen())
			{
				dialog.hide();
			}
		},
		handleAccessChange(): void
		{
			const { dialog, initialized, disposed } = this.accessControl;
			if (disposed || !initialized || this.isDisabled || !dialog)
			{
				return;
			}

			const access = dialog.getSelectedItems()
				.filter((item) => !this.isOwner(item.getEntityId(), item.getId()))
				.map((item): EditorAccessItem => [item.getEntityId(), item.getId()])
			;
			this.store.setField('access', access);
		},
		destroyAccessDialog(): void
		{
			const { dialog, selector } = this.accessControl;
			this.accessControl.dialog = null;
			this.accessControl.selector = null;
			selector?.setReadonly(true);
			selector?.setLocked(true);
			dialog?.destroy();
		},
	},
	template: `
		<div class="crm-mail-template-editor__properties" data-testid="crm-mail-template-editor-properties">
			<div class="crm-mail-template-editor__field">
				<TextSm class="crm-mail-template-editor__field-label" tag="label" :for="fieldId + '-title'">
					{{ Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_TITLE') }}
					<TextSm class="crm-mail-template-editor__field-required" aria-hidden="true">*</TextSm>
				</TextSm>
				<div class="crm-mail-template-editor__field-content">
					<BInput
						ref="title"
						class="crm-mail-template-editor__input"
						:class="{ '--invalid': titleError, '--readonly': !store.state.canEdit }"
						:modelValue="store.state.title"
						:ariaLabel="Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_TITLE')"
						:design="store.state.busy ? InputDesign.Disabled : InputDesign.Naked"
						:size="InputSize.Md"
						:readonly="isDisabled"
						data-testid="crm-mail-template-title"
						stretched
						@update:modelValue="handleTitleInput"
					/>
					<TextSm
						v-if="titleError"
						:id="fieldId + '-title-error'"
						class="crm-mail-template-editor__field-error"
						wrap="break-words"
						role="alert"
					>{{ titleError }}</TextSm>
				</div>
			</div>
			<div class="crm-mail-template-editor__field">
				<TextSm :id="fieldId + '-type-label'" class="crm-mail-template-editor__field-label">
					{{ Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_ENTITY_TYPE') }}
				</TextSm>
				<div class="crm-mail-template-editor__field-content">
					<Chip
						ref="entityType"
						:id="fieldId + '-type'"
						class="crm-mail-template-editor__type-chip"
						:text="currentEntityType.name"
						:design="isDisabled ? ChipDesign.Disabled : ChipDesign.OutlineNoAccent"
						:size="ChipSize.Md"
						:dropdown="!isDisabled"
						:aria-labelledby="fieldId + '-type-label ' + fieldId + '-type'"
						:aria-disabled="isDisabled"
						aria-expanded="false"
						:tabindex="isDisabled ? -1 : 0"
						aria-haspopup="menu"
						role="button"
						data-testid="crm-mail-template-entity-type"
						@click="handleTypeMenu"
						@keydown.space.prevent="handleTypeMenu"
						@keydown.down.prevent="handleTypeMenu"
					/>
					<BMenu v-if="isTypeMenuShown" :options="entityTypeMenuOptions" @close="isTypeMenuShown = false"/>
					<TextSm v-if="entityTypeError" class="crm-mail-template-editor__field-error" wrap="break-words">
						{{ entityTypeError }}
					</TextSm>
				</div>
			</div>
			<div class="crm-mail-template-editor__field">
				<TextSm :id="fieldId + '-access-label'" class="crm-mail-template-editor__field-label">
					{{ Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_ACCESS') }}
				</TextSm>
				<div class="crm-mail-template-editor__field-content">
					<div
						ref="access"
						class="crm-mail-template-editor__access"
						:aria-labelledby="fieldId + '-access-label'"
						:aria-disabled="isDisabled"
						role="group"
						tabindex="-1"
						data-testid="crm-mail-template-access"
					/>
					<TextSm v-if="isPersonal" class="crm-mail-template-editor__field-hint" wrap="break-words">
						{{ Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_ACCESS_PERSONAL') }}
					</TextSm>
					<TextSm v-if="accessError" class="crm-mail-template-editor__field-error" wrap="break-words" role="alert">
						{{ accessError }}
					</TextSm>
				</div>
			</div>
			<div class="crm-mail-template-editor__field">
				<TextSm :id="fieldId + '-active-label'" class="crm-mail-template-editor__field-label">
					{{ Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_ACTIVE') }}
				</TextSm>
				<div class="crm-mail-template-editor__field-content">
					<Switcher
						ref="active"
						:isChecked="store.state.isActive"
						:isDisabled="isDisabled"
						:options="{
							size: 'small',
							useAirDesign: true,
							accessible: true,
							ariaLabelledBy: fieldId + '-active-label',
						}"
						data-testid="crm-mail-template-active"
						@check="store.setField('isActive', true)"
						@uncheck="store.setField('isActive', false)"
					/>
					<TextSm v-if="activityError" class="crm-mail-template-editor__field-error" wrap="break-words">
						{{ activityError }}
					</TextSm>
				</div>
			</div>
		</div>
	`,
});
