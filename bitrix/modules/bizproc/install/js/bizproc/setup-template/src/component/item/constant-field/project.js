import { Loc, Type } from 'main.core';
import { type TagItem, TagSelector, type ItemId } from 'ui.entity-selector';

import {
	getDeletedProjectIds,
	isDeletedProjectSelected,
} from '../../../lib/project-field-state/project-field-state';

const ENTITY_TYPES = Object.freeze({
	PROJECT: 'project',
});

// @vue/component
export const ConstantProject = {
	name: 'ConstantProject',
	props: {
		item: {
			type: Object,
			required: true,
		},
		modelValue: {
			type: [String, Array, Number],
			default: '',
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update:modelValue'],
	data(): Object
	{
		return {
			tagObserver: null,
		};
	},
	computed: {
		projectState(): ?Object
		{
			return this.item.meta?.projectState ?? null;
		},
		isProjectDeleted(): boolean
		{
			return isDeletedProjectSelected(this.projectState, this.modelValue);
		},
		deletedProjectIds(): Array<string>
		{
			return getDeletedProjectIds(this.projectState);
		},
		projectDeletedTitle(): string
		{
			return Loc.getMessage('BIZPROC_JS_AI_AGENTS_ACTIVATOR_PROJECT_DELETED_VALUE') ?? '';
		},
	},
	mounted(): void
	{
		this.initializeSelector();
	},
	beforeUnmount(): void
	{
		this.disconnectTagObserver();

		if (this.tagSelector)
		{
			this.tagSelector.getDialog().destroy();
			this.tagSelector = null;
		}
	},
	methods: {
		syncValue(): void
		{
			if (!this.tagSelector)
			{
				return;
			}

			const tags = this.tagSelector.getTags();
			const newValues = tags.map((tag: TagItem) => {
				return tag.getId();
			}).filter(Boolean);

			if (this.item.multiple)
			{
				this.$emit('update:modelValue', newValues);
			}
			else
			{
				this.$emit('update:modelValue', newValues.length > 0 ? newValues[0] : '');
			}
		},
		getPreselectedItems(): Array<ItemId>
		{
			return this.normalizeModelValues().map((value: number): ItemId => [ENTITY_TYPES.PROJECT, value]);
		},
		normalizeModelValues(): Array<number>
		{
			const values = Type.isArray(this.modelValue) ? this.modelValue : [this.modelValue];

			return values
				.map((value) => Number(value))
				.filter((value: number) => Number.isFinite(value) && value > 0)
			;
		},
		initializeSelector(): void
		{
			this.tagSelector = new TagSelector({
				multiple: this.item.multiple,
				dialogOptions: {
					context: `BIZPROC_PROJECT_SELECTOR_${this.item.id}`,
					popupOptions: {
						className: 'bizproc-setup-template__no-tabs-selector-popup',
					},
					width: 500,
					entities: [
						{
							id: ENTITY_TYPES.PROJECT,
						},
					],
					multiple: this.item.multiple,
					dropdownMode: true,
					compactView: true,
					height: 280,
					preselectedItems: this.getPreselectedItems(),
				},
				events: {
					onAfterTagAdd: this.syncValue,
					onAfterTagRemove: this.syncValue,
				},
			});

			this.tagSelector.renderTo(this.$refs.container);
			this.syncDeletedProjectTag();
			this.watchDeletedProjectTag();
		},
		syncDeletedProjectTag(): void
		{
			if (!this.isProjectDeleted || !this.tagSelector)
			{
				return;
			}

			const selectedProjectIds = new Set(
				this.normalizeModelValues().map((value: number) => String(value)),
			);
			this.deletedProjectIds
				.filter((projectId: string) => selectedProjectIds.has(projectId))
				.forEach((projectId: string) => {
					const tag = this.tagSelector
						.getTags()
						.find((item: TagItem) => {
							return item.getEntityId() === ENTITY_TYPES.PROJECT && String(item.getId()) === projectId;
						})
						?? this.tagSelector.addTag({
							id: Number(projectId),
							entityId: ENTITY_TYPES.PROJECT,
							title: this.projectDeletedTitle,
							deselectable: false,
							animate: false,
						})
					;

					if (tag && tag.getTitle() !== this.projectDeletedTitle)
					{
						tag.setTitle(this.projectDeletedTitle);
						tag.render();
					}
				});
		},
		watchDeletedProjectTag(): void
		{
			if (!this.isProjectDeleted || !Type.isFunction(window.MutationObserver))
			{
				return;
			}

			this.tagObserver = new MutationObserver(this.syncDeletedProjectTag);
			this.tagObserver.observe(this.$refs.container, { childList: true, subtree: true });
		},
		disconnectTagObserver(): void
		{
			if (this.tagObserver)
			{
				this.tagObserver.disconnect();
				this.tagObserver = null;
			}
		},
	},
	template: `
		<div ref="container" data-test-id="bizproc-setup-template__form-project"></div>
	`,
};
