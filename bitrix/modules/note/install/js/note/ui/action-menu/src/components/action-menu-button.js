import { Loc, Type } from 'main.core';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { markRaw } from 'ui.vue3';
import { ActionMenuService } from '../services/action-menu-service';

export const ActionMenuButton = {
	name: 'NoteActionMenuButton',
	components: {
		BIcon,
	},
	props: {
		items: {
			type: Array,
			default: null,
		},
		getItems: {
			type: Function,
			default: null,
		},
		menuKey: {
			type: [String, Number],
			default: '',
		},
		popupClass: {
			type: String,
			default: 'note-action-menu',
		},
		size: {
			type: Number,
			default: 24,
		},
		iconName: {
			type: String,
			default: '',
		},
		ariaLabel: {
			type: String,
			default: '',
		},
	},
	emits: ['open', 'close'],
	computed: {
		triggerIcon(): string
		{
			return Type.isStringFilled(this.iconName) ? this.iconName : Outline.MORE_L;
		},
		triggerLabel(): string
		{
			if (Type.isStringFilled(this.ariaLabel))
			{
				return this.ariaLabel;
			}

			return Loc.getMessage('NOTE_ACTION_MENU_TRIGGER_LABEL') || '';
		},
	},
	created()
	{
		this.service = markRaw(new ActionMenuService({ popupClass: this.popupClass }));
	},
	beforeUnmount()
	{
		this.service?.destroy?.();
		this.service = null;
	},
	methods: {
		onClick(event: MouseEvent): void
		{
			event?.stopPropagation?.();

			const target = event?.currentTarget;
			if (!(target instanceof HTMLElement))
			{
				return;
			}

			const items = Type.isFunction(this.getItems) ? this.getItems() : this.items;
			if (!Array.isArray(items) || items.length === 0)
			{
				return;
			}

			this.service?.open(items, target, {
				key: String(this.menuKey || ''),
				popupClass: this.popupClass,
			});

			this.$emit('open');
		},
	},
	// language=Vue
	template: `
		<button
			type="button"
			class="note-action-menu-trigger"
			:aria-label="triggerLabel"
			@click="onClick"
		>
			<BIcon :name="triggerIcon" :size="size" />
		</button>
	`,
};
