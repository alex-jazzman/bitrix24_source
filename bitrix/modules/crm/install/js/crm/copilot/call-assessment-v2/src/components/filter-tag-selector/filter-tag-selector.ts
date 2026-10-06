import { Loc } from 'main.core';
import { TagSelector } from 'ui.entity-selector';
import { defineComponent, markRaw, type PropType } from 'ui.vue3';
import { type FilterOption, type TagStyling } from '../../types';
import './filter-tag-selector.css';

type FilterTagSelectorData = {
	tagSelector: TagSelector | null,
	isInSelectFlow: boolean,
};

type FilterTagSelectorItem = {
	id: number,
	entityId: string,
	title: string,
	tabs: string,
	selected: boolean,
	tagOptions?: TagStyling,
};

const ENTITY_ID_PREFIX = 'CRM_CALL_ASSESSMENT_V2_FILTER_';

export const FilterTagSelector = defineComponent({
	name: 'CrmCopilotCallAssessmentV2FilterTagSelector',
	props: {
		modelValue: {
			type: [Array, Number, Object] as PropType<number[] | number | null>,
			default: null,
		},
		options: {
			type: Array as PropType<FilterOption[]>,
			required: true,
		},
		multi: {
			type: Boolean,
			default: false,
		},
		entityIdSuffix: {
			type: String,
			required: true,
		},
		highlightValues: {
			type: Array as PropType<number[]>,
			default: (): number[] => [],
		},
		highlightStyle: {
			type: Object as PropType<TagStyling | null>,
			default: null,
		},
		minSelected: {
			type: Number,
			default: 0,
		},
	},
	emits: ['update:modelValue'],
	data(): FilterTagSelectorData
	{
		return {
			tagSelector: null,
			isInSelectFlow: false,
		};
	},
	computed: {
		entityId(): string
		{
			return ENTITY_ID_PREFIX + this.entityIdSuffix.toUpperCase();
		},
		selectedIds(): number[]
		{
			if (this.multi)
			{
				return Array.isArray(this.modelValue) ? (this.modelValue as number[]) : [];
			}

			const value = this.modelValue as number | null;

			return value ? [value] : [];
		},
	},
	mounted(): void
	{
		this.renderTagSelector();
	},
	beforeUnmount(): void
	{
		if (this.tagSelector !== null)
		{
			const dialog = this.tagSelector.getDialog?.();
			dialog?.destroy?.();
		}
		this.tagSelector = null;
	},
	methods: {
		buildDialogItems(): FilterTagSelectorItem[]
		{
			return this.options.map((option: FilterOption) => {
				const styling = this.getStylingFor(option.value);

				return {
					id: option.value,
					entityId: this.entityId,
					title: option.label,
					tabs: 'recents',
					selected: this.selectedIds.includes(option.value),
					...(styling === null ? {} : { tagOptions: styling }),
				};
			});
		},
		getStylingFor(value: number): TagStyling | null
		{
			if (this.highlightStyle === null || !this.highlightValues.includes(value))
			{
				return null;
			}

			return this.highlightStyle;
		},
		renderTagSelector(): void
		{
			const dialogItems = this.buildDialogItems();

			this.tagSelector = markRaw(new TagSelector({
				multiple: this.multi,
				addButtonCaption: Loc.getMessage('CRM_CALL_ASSESSMENT_V2_FILTER_ADD_BUTTON') ?? '',
				dialogOptions: {
					context: this.entityId,
					items: dialogItems,
					entities: [{ id: this.entityId }],
					hideOnSelect: false,
					events: {
						'Item:onBeforeSelect': () => { this.isInSelectFlow = true; },
						'Item:onSelect': () => { this.isInSelectFlow = false; },
						'Item:onBeforeDeselect': (event: { preventDefault: () => void }) => this.handleBeforeDeselect(event),
					},
				},
				events: {
					onBeforeTagRemove: (event: { preventDefault: () => void }) => this.handleBeforeTagRemove(event),
					onTagAdd: () => this.handleChange(),
					onTagRemove: () => this.handleChange(),
				},
			} as ConstructorParameters<typeof TagSelector>[0]));

			const container = this.$refs.container as HTMLElement | undefined;
			if (container)
			{
				this.tagSelector.renderTo(container);
			}
		},
		handleBeforeDeselect(event: { preventDefault: () => void }): void
		{
			if (this.minSelected <= 0 || this.isInSelectFlow)
			{
				return;
			}

			const tags = this.tagSelector?.getTags?.() ?? [];
			if (tags.length <= this.minSelected)
			{
				event.preventDefault();
			}
		},
		handleBeforeTagRemove(event: { preventDefault: () => void }): void
		{
			if (this.minSelected <= 0 || this.isInSelectFlow)
			{
				return;
			}

			const tags = this.tagSelector?.getTags?.() ?? [];
			if (tags.length <= this.minSelected)
			{
				event.preventDefault();
			}
		},
		handleChange(): void
		{
			const tags = this.tagSelector?.getTags?.() ?? [];
			const ids = tags.map((tag) => Number(tag.getId()));

			if (this.multi)
			{
				this.$emit('update:modelValue', ids);
			}
			else
			{
				this.$emit('update:modelValue', ids[0] ?? null);
			}
		},
	},
	template: `
		<div ref="container" class="crm-call-assessment-v2-filter-tag-selector"></div>
	`,
});
