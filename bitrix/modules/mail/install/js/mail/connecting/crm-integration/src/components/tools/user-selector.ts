import { defineComponent, markRaw, type PropType } from 'ui.vue3';
import { TagSelector } from 'ui.entity-selector';

import type { ResponsibleQueueItem } from '../../utils/crm-integration-settings-type';

function resolvePopupTargetContainer(element: Element | null | undefined): HTMLElement
{
	return element?.closest('.side-panel-content-container, .ui-slider-content-box') ?? document.body;
}

type SelectorTag = {
	getEntityId(): string;
	getId(): string | number;
	getTitle(): string;
};

type SelectorDialog = {
	destroy(): void;
	show(): void;
	isOpen(): boolean;
};

type TagSelectorInstance = {
	getTags(): SelectorTag[];
	removeTag(tag: SelectorTag): void;
	addTag(tag: {
		id: string | number;
		entityId: string;
		title: string;
	}): void;
	subscribe(eventName: string, handler: () => void): void;
	getDialog(): SelectorDialog | null;
	getOuterContainer(): HTMLElement | null | undefined;
	renderTo(target: Element | null | undefined): void;
};

// @vue/component
export const UserSelector = defineComponent({
	name: 'crm-user-selector',

	props: {
		modelValue: {
			type: Array as PropType<ResponsibleQueueItem[]>,
			default: (): ResponsibleQueueItem[] => [],
		},
		dataTestId: {
			type: String,
			default: '',
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},

	emits: ['update:modelValue'],

	data()
	{
		return {
			selectorInstance: null as TagSelectorInstance | null,
		};
	},

	watch: {
		modelValue(newValue: ResponsibleQueueItem[]): void
		{
			if (!this.selectorInstance)
			{
				return;
			}

			const newItemsSet = new Set(newValue.map((item) => `${item.entityId}:${item.id}`));
			const currentTags = this.selectorInstance.getTags();
			const currentTagsSet = new Set(currentTags.map((tag) => `${tag.getEntityId()}:${tag.getId()}`));

			currentTags.forEach((tag) => {
				const tagId = `${tag.getEntityId()}:${tag.getId()}`;
				if (!newItemsSet.has(tagId))
				{
					this.selectorInstance?.removeTag(tag);
				}
			});

			newValue.forEach((item) => {
				const itemId = `${item.entityId}:${item.id}`;
				if (!currentTagsSet.has(itemId))
				{
					this.selectorInstance?.addTag({
						id: item.id,
						entityId: item.entityId,
						title: item.name,
					});
				}
			});
		},
	},

	mounted(): void
	{
		const selectorContainer = this.$refs.selectorContainer as HTMLElement;

		// markRaw prevents Vue from wrapping the TagSelector instance in a reactive Proxy.
		// The selector and its inner Dialog/Popup use private class fields (#field) whose
		// _assertClassBrand checks fail when called through a Proxy.
		this.selectorInstance = markRaw(new TagSelector({
			multiple: true,
			dialogOptions: {
				width: 425,
				height: 320,
				targetNode: selectorContainer,
				autoHideHandler: (event: MouseEvent): boolean => {
					const outerContainer = this.selectorInstance?.getOuterContainer();
					const target = event.target;

					if (target instanceof Node && outerContainer?.contains(target))
					{
						return false;
					}

					return true;
				},
				popupOptions: {
					targetContainer: resolvePopupTargetContainer(selectorContainer),
				},
				context: 'MAIL_CRM_QUEUE',
				preselectedItems: this.modelValue.map((item) => [item.entityId, item.id]),
				entities: [
					{
						id: 'user',
						options: {
							intranetUsersOnly: true,
							emailUsers: false,
							inviteEmployeeLink: false,
						},
					},
					{
						id: 'department',
						options: {
							selectMode: 'departmentsOnly',
						},
					},
				],
			},
			events: {
				onAfterTagAdd: this.onUpdate,
				onAfterTagRemove: this.onUpdate,
			},
		})) as TagSelectorInstance;

		this.selectorInstance.renderTo(selectorContainer);

		const dialog = this.selectorInstance.getDialog();
		if (dialog)
		{
			this.selectorInstance.subscribe('onContainerClick', () => {
				if (!dialog.isOpen())
				{
					dialog.show();
				}
			});
		}
	},

	beforeUnmount(): void
	{
		const dialog = this.selectorInstance?.getDialog();

		if (dialog)
		{
			dialog.destroy();
		}
	},

	methods: {
		onUpdate(): void
		{
			if (!this.selectorInstance || this.disabled)
			{
				return;
			}

			const selectedItems: ResponsibleQueueItem[] = this.selectorInstance.getTags().map((tag) => ({
				id: tag.getId(),
				entityId: tag.getEntityId(),
				name: tag.getTitle(),
			}));

			this.$emit('update:modelValue', selectedItems);
		},
	},

	template: `
		<div
			:data-test-id="dataTestId"
			:style="disabled ? { pointerEvents: 'none', opacity: 0.65 } : null"
		>
			<div ref="selectorContainer"></div>
		</div>
	`,
});
