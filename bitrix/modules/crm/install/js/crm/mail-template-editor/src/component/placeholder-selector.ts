import { Dom, Loc, Type } from 'main.core';
import { type BaseEvent } from 'main.core.events';
import { defineComponent, markRaw, type PropType } from 'ui.vue3';
import { Dialog, type Item, type ItemOptions } from 'ui.entity-selector';
import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';

import { type EditorPlaceholderMap, type EditorStore } from '../model/editor-store';

export type PlaceholderSelectorInstance = {
	cancel(): void;
};

type ButtonComponent = {
	button: { getContainer(): HTMLElement };
};

type SelectorControl = {
	dialog: Dialog | null;
	pendingMarker: string | null;
	entityTypeId: number | null;
	disposed: boolean;
};

const ENTITY_ID = 'crm-mail-template-placeholder';

function createGroup(id: string, title: string, children: ItemOptions[]): ItemOptions
{
	return {
		id: `group:${id}`,
		entityId: ENTITY_ID,
		title,
		children,
		locked: true,
		searchable: false,
		saveable: false,
		customData: { marker: null },
	};
}

function createFields(
	map: EditorPlaceholderMap,
	maps: EditorPlaceholderMap[],
	prefix: string,
	parentLabels: string[],
	includeRelations: boolean,
): ItemOptions[]
{
	return map.fields.flatMap((field, sort): ItemOptions[] => {
		const path = `${prefix}.${field.id}`;
		const title = field.name || field.id;
		const subtitle = parentLabels.join(' / ');
		if (Type.isNumber(field.typeId))
		{
			if (!includeRelations)
			{
				return [];
			}

			const relatedMap = maps.find((candidate) => candidate.typeId === field.typeId);
			const children = relatedMap
				? createFields(relatedMap, maps, path, [...parentLabels, title], false)
				: []
			;

			return [{ ...createGroup(path, title, children), subtitle, sort }];
		}

		const suffix = field.id.startsWith('UF_') ? `(${field.name})` : '';

		return [{
			id: `field:${path}`,
			entityId: ENTITY_ID,
			title,
			subtitle,
			sort,
			searchable: true,
			saveable: false,
			customData: { marker: `#${path}${suffix}#` },
		}];
	});
}

function createItems(store: EditorStore): ItemOptions[]
{
	const { placeholderMaps: maps, entityTypeId, entityTypes } = store.state;
	const items: ItemOptions[] = [];
	const sender = maps.find((map) => map.typeName === 'SENDER');
	if (sender)
	{
		const title = Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_SENDER') ?? '';
		items.push(createGroup('SENDER', title, createFields(sender, maps, sender.typeName, [title], true)));
	}

	const currentMap = entityTypeId === 0 ? null : maps.find((map) => map.typeId === entityTypeId);
	if (currentMap && currentMap !== sender)
	{
		const title = entityTypes.find((type) => type.id === entityTypeId)?.name ?? currentMap.typeName;
		items.push(...createFields(currentMap, maps, currentMap.typeName, [title], true));
	}

	return items.map((item, sort) => ({ ...item, sort, tabs: ['recents'] }));
}

export const PlaceholderSelector = defineComponent({
	name: 'CrmMailTemplatePlaceholderSelector',
	components: { UiButton },
	props: {
		store: {
			type: Object as PropType<EditorStore>,
			required: true,
		},
		text: {
			type: String,
			required: true,
		},
		testId: {
			type: String,
			required: true,
		},
		rememberSelection: {
			type: Function as PropType<(onInvalidated: () => void) => boolean>,
			required: true,
		},
		insertPlaceholder: {
			type: Function as PropType<(marker: string) => boolean>,
			required: true,
		},
		clearSelection: {
			type: Function as PropType<() => void>,
			required: true,
		},
	},
	emits: ['error'],
	expose: ['cancel'],
	setup()
	{
		const control: SelectorControl = {
			dialog: null,
			pendingMarker: null,
			entityTypeId: null,
			disposed: false,
		};

		return { AirButtonStyle, ButtonSize, control: markRaw(control) };
	},
	computed: {
		isAvailable(): boolean
		{
			const { canEdit, ready, busy } = this.store.state;

			return canEdit && ready && !busy;
		},
	},
	watch: {
		isAvailable: {
			flush: 'sync',
			handler(available: boolean): void
			{
				if (!available)
				{
					this.cancel();
				}
			},
		},
		'store.state.entityTypeId': {
			flush: 'sync',
			handler(): void
			{
				this.cancel();
			},
		},
	},
	mounted(): void
	{
		this.updateButtonAccessibility(false);
	},
	beforeUnmount(): void
	{
		this.control.disposed = true;
		this.resetSelection();
		const { dialog } = this.control;
		this.control.dialog = null;
		dialog?.destroy();
	},
	methods: {
		getButton(): HTMLElement | null
		{
			return (this.$refs.button as ButtonComponent | undefined)?.button.getContainer() ?? null;
		},
		updateButtonAccessibility(expanded: boolean): void
		{
			const button = this.getButton();
			if (button)
			{
				Dom.attr(button, { 'aria-haspopup': 'dialog', 'aria-expanded': String(expanded) });
			}
		},
		prepareSelection(): boolean
		{
			if (!this.isAvailable || this.control.disposed)
			{
				return false;
			}

			try
			{
				return this.rememberSelection(this.cancel);
			}
			catch (error)
			{
				this.resetSelection();
				this.$emit('error', error);

				return false;
			}
		},
		handlePointerDown(event: PointerEvent): void
		{
			if (event.button === 0 && !this.control.dialog)
			{
				this.prepareSelection();
			}
		},
		handleOpen(): void
		{
			if (this.control.dialog || !this.isAvailable || this.control.disposed)
			{
				this.cancel();

				return;
			}

			const targetNode = this.getButton();
			if (!targetNode || !this.prepareSelection())
			{
				return;
			}

			try
			{
				this.control.entityTypeId = this.store.state.entityTypeId;
				this.control.dialog = new Dialog({
					targetNode,
					multiple: false,
					enableSearch: true,
					dropdownMode: true,
					showAvatars: false,
					compactView: true,
					hideOnSelect: true,
					clearSearchOnSelect: false,
					addTagOnSelect: false,
					cacheable: false,
					ariaLabel: Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_PLACEHOLDER_DIALOG_ARIA') ?? '',
					entities: [{
						id: ENTITY_ID,
						dynamicLoad: false,
						dynamicSearch: false,
						searchFields: [{ name: 'marker', type: 'string', searchable: true }],
					}],
					items: createItems(this.store),
					events: {
						'Item:onBeforeSelect': this.handleBeforeSelect,
						'Item:onSelect': this.handleSelect,
						onHide: this.handleHide,
						onDestroy: this.handleDestroy,
					},
				});
				Dom.style(this.control.dialog.getContainer(), 'max-width', 'calc(100vw - 48px)');
				targetNode.focus({ preventScroll: true });
				this.control.dialog.show();
				this.updateButtonAccessibility(true);
			}
			catch (error)
			{
				this.cancel();
				this.$emit('error', error);
			}
		},
		handleBeforeSelect(event: BaseEvent): void
		{
			const item = event.getData().item as Item;
			if (!this.isAvailable || this.control.disposed || !Type.isStringFilled(item.getCustomData().get('marker')))
			{
				event.preventDefault();
			}
		},
		handleSelect(event: BaseEvent): void
		{
			const item = event.getData().item as Item;
			const marker = item.getCustomData().get('marker');
			if (this.isAvailable && !this.control.disposed && Type.isStringFilled(marker))
			{
				this.control.pendingMarker = marker;
			}
		},
		handleHide(): void
		{
			const pendingMarker = this.control.pendingMarker;
			const entityTypeId = this.control.entityTypeId;
			this.control.pendingMarker = null;
			this.updateButtonAccessibility(false);
			try
			{
				if (
					this.isAvailable && !this.control.disposed && pendingMarker
					&& entityTypeId === this.store.state.entityTypeId
				)
				{
					this.insertPlaceholder(pendingMarker);
				}
			}
			catch (error)
			{
				this.$emit('error', error);
			}
			finally
			{
				this.resetSelection();
			}
		},
		handleDestroy(): void
		{
			this.control.dialog = null;
			this.resetSelection();
			this.updateButtonAccessibility(false);
		},
		resetSelection(): void
		{
			this.control.pendingMarker = null;
			this.control.entityTypeId = null;
			this.clearSelection();
		},
		cancel(): void
		{
			this.resetSelection();
			this.updateButtonAccessibility(false);
			const { dialog } = this.control;
			if (dialog?.isOpen())
			{
				dialog.hide();
			}
			else
			{
				this.control.dialog = null;
				dialog?.destroy();
			}
		},
	},
	template: `
		<div
			class="crm-mail-template-editor__placeholder"
			:data-testid="testId + '-container'"
			@pointerdown.capture="handlePointerDown"
		>
			<UiButton
				ref="button"
				:text="text"
				:size="ButtonSize.SMALL"
				:style="AirButtonStyle.PLAIN_NO_ACCENT"
				:disabled="!isAvailable"
				:dataset="{ testid: testId }"
				@click="handleOpen"
			/>
		</div>
	`,
});
