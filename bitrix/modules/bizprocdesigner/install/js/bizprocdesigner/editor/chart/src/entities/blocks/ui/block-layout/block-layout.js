import { computed, toValue, useSlots } from 'ui.vue3';
import { useBlockDiagram } from 'ui.block-diagram';
import { Outline } from 'ui.icon-set.api.vue';
import { IconButton } from '../../../../shared/ui';

import type { Block } from '../../../../shared/typed';

import './block-layout.css';

type BlockLayoutProps = {
	block: Block,
	showTopMenu: boolean,
	dragged: boolean,
	resized: boolean,
	disabled: boolean,
	isActivationVisible: boolean,
	hoverable: boolean,
};

type BlockLayoutSetup = {
	iconSet: { [string]: string };
	isOpen: boolean;
	isShowButtonMore: boolean;
	topMenuClass: { [string]: boolean };
	onOpenMoreMenu: (event: MouseEvent) => void;
	onCloseMoreMenu: () => void;
};

const BLOCK_LAYOUT_CLASS_NAMES = {
	base: 'editor-chart-block-layout',
	hoverable: '--hoverable',
	openedMenu: '--opened-menu',
};

const TOP_MENU_CLASS_NAMES = {
	base: 'editor-chart-block-layout__top-menu',
	show: '--show',
	hide: '--hide',
};

const STATUS_CLASS_NAMES = {
	base: 'editor-chart-block-layout__status',
	hide: '--hide',
};

const CONTENT_CLASS_NAMES = {
	base: 'editor-chart-block-layout__content',
	hasHeader: '--has-header',
};

export const BLOCK_LAYOUT_SLOT_NAMES = {
	TOP_MENU_TITLE: 'top-menu-title',
	TOP_MENU: 'top-menu',
	HEADER: 'header',
	DEFAULT: 'default',
	LEFT: 'left',
	STATUS: 'status',
};

// @vue/component
export const BlockLayout = {
	name: 'block-layout',
	components: {
		IconButton,
	},
	props: {
		/** @type Block */
		block: {
			type: Object,
			required: true,
		},
		showTopMenu: {
			type: Boolean,
			default: false,
		},
		dragged: {
			type: Boolean,
			default: false,
		},
		resized: {
			type: Boolean,
			default: false,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		isActivationVisible: {
			type: Boolean,
			default: true,
		},
		hoverable: {
			type: Boolean,
			default: true,
		},
	},
	setup(props: BlockLayoutProps, ctx: {...}): BlockLayoutSetup
	{
		const slots = useSlots();
		const { highlitedBlockIds, isSelectionActive } = useBlockDiagram();

		const isGroupSelected = computed(() => {
			return (toValue(highlitedBlockIds) || []).length > 1;
		});
		const blockLayoutClassNames = computed((): { [string]: boolean } => {
			const isHoverEnabled = props.hoverable && !toValue(isSelectionActive) && !isGroupSelected;

			return {
				[BLOCK_LAYOUT_CLASS_NAMES.base]: true,
				[BLOCK_LAYOUT_CLASS_NAMES.hoverable]: isHoverEnabled,
				[BLOCK_LAYOUT_CLASS_NAMES.openedMenu]: props.showTopMenu,
			};
		});

		const topMenuClassNames = computed((): { [string]: boolean } => {
			const isMenuHidden = props.dragged
				|| props.resized
				|| toValue(isSelectionActive)
				|| toValue(isGroupSelected);

			return {
				[TOP_MENU_CLASS_NAMES.base]: true,
				[TOP_MENU_CLASS_NAMES.show]: props.showTopMenu,
				[TOP_MENU_CLASS_NAMES.hide]: isMenuHidden,
			};
		});

		const statusClassNames = computed((): { [string]: boolean } => ({
			[STATUS_CLASS_NAMES.base]: true,
			[STATUS_CLASS_NAMES.hide]: props.dragged || props.resized || !slots.status,
		}));

		const contentClassNames = computed((): { [string]: boolean } => {
			return {
				[CONTENT_CLASS_NAMES.base]: true,
				[CONTENT_CLASS_NAMES.hasHeader]: ctx.slots.header,
			};
		});

		return {
			iconSet: Outline,
			slotNames: BLOCK_LAYOUT_SLOT_NAMES,
			blockLayoutClassNames,
			topMenuClassNames,
			statusClassNames,
			contentClassNames,
		};
	},
	template: `
		<div
			:class="blockLayoutClassNames"
			ref="editorBlockMenu"
		>
			<div 
				:class="topMenuClassNames"
				@mousedown.stop
			>
				<div
					v-if="!disabled"
					class="editor-chart-block-layout__top-menu-title"
				>
					<slot name="top-menu-title"/>
				</div>
				<div
					v-if="!disabled"
					class="editor-chart-block-layout__top-menu-content">
					<slot
						name="top-menu"
					/>
				</div>
			</div>
			<div
				v-if="$slots.header"
				class="editor-chart-block-layout__header"
			>
				<slot name="header"/>
			</div>
			<div
				v-if="$slots.default"
				:class="contentClassNames"
			>
				<slot/>
			</div>
			<div
				v-if="$slots.left"
				class="editor-chart-block-layout__left-content"
			>
				<slot name="left"/>
			</div>
			<div :class="statusClassNames">
				<slot name="status"/>
			</div>
		</div>
	`,
};
