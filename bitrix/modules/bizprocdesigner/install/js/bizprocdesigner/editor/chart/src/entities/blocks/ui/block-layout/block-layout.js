import './block-layout.css';
import { computed, toValue, useTemplateRef, useSlots, inject } from 'ui.vue3';
import { useContextMenu, useBlockDiagram } from 'ui.block-diagram';
import { Outline } from 'ui.icon-set.api.vue';
import { IconButton } from '../../../../shared/ui';
import { ACTIVATION_STATUS } from '../../../../shared/constants';

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

const OFFSET_MORE_MENU_RIGHT = 15;
const OFFSET_MORE_MENU_TOP = 10;

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
		moreMenuItems: {
			type: Array,
			default: () => ([]),
		},
		topMenuOpened: {
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
	setup(props): BlockLayoutSetup
	{
		const buttonMore = useTemplateRef('buttonMore');
		const slots = useSlots();
		const {
			isOpen,
			showMenu,
			closeContextMenu,
		} = useContextMenu();
		const { highlitedBlockIds, isSelectionActive } = useBlockDiagram();

		const isShowButtonMore = computed(() => props.moreMenuItems.length > 0);
		const isGroupSelected = computed(() => {
			return (toValue(highlitedBlockIds) || []).length > 1;
		});
		const blockLayoutClassNames = computed((): { [string]: boolean } => {
			const isHoverEnabled = props.hoverable && !toValue(isSelectionActive) && !isGroupSelected;

			return {
				[BLOCK_LAYOUT_CLASS_NAMES.base]: true,
				[BLOCK_LAYOUT_CLASS_NAMES.hoverable]: isHoverEnabled,
			};
		});

		const topMenuClassNames = computed((): { [string]: boolean } => {
			const isMenuHidden = props.dragged || props.resized || toValue(isSelectionActive) || toValue(isGroupSelected);

			return {
				[TOP_MENU_CLASS_NAMES.base]: true,
				[TOP_MENU_CLASS_NAMES.show]: toValue(isOpen) || props.topMenuOpened,
				[TOP_MENU_CLASS_NAMES.hide]: isMenuHidden,
			};
		});

		const statusClassNames = computed((): { [string]: boolean } => ({
			[STATUS_CLASS_NAMES.base]: true,
			[STATUS_CLASS_NAMES.hide]: props.dragged || props.resized || !slots.status,
		}));

		function onOpenMoreMenu(): void
		{
			const { top = 0, right = 0 } = toValue(buttonMore)
				?.$el?.getBoundingClientRect() ?? {};

			showMenu(
				{
					clientX: right + OFFSET_MORE_MENU_RIGHT,
					clientY: top - OFFSET_MORE_MENU_TOP,
				},
				{ items: props.moreMenuItems },
			);
		}

		const onToggleBlockActivation = inject('onToggleBlockActivation');
		function handleIconClick(): void
		{
			if (!onToggleBlockActivation)
			{
				console.warn('onToggleBlockActivation is not provided');

				return;
			}

			onToggleBlockActivation(props.block.id);
		}

		function onCloseMoreMenu(): void
		{
			closeContextMenu();
		}

		return {
			iconSet: Outline,
			isOpen,
			isShowButtonMore,
			blockLayoutClassNames,
			topMenuClassNames,
			statusClassNames,
			onOpenMoreMenu,
			onCloseMoreMenu,
			handleIconClick,
		};
	},
	computed: {
		activationIcon(): string
		{
			return this.block.activity.Activated === ACTIVATION_STATUS.ACTIVE
				? this.iconSet.PAUSE_L
				: this.iconSet.PLAY_L;
		},
	},
	template: `
		<div
			:class="blockLayoutClassNames"
			ref="editorBlockMenu"
			@mousedown="onCloseMoreMenu"
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
					<IconButton
						v-if="isActivationVisible"
						:icon-name="activationIcon"
						@click="handleIconClick"
					/>
					<IconButton
						v-if="isShowButtonMore"
						ref="buttonMore"
						:active="isOpen"
						:size="16"
						:icon-name="iconSet.MORE_L"
						@click="onOpenMoreMenu"
					/>
				</div>
			</div>
			<div class="editor-chart-block-layout__content">
				<slot/>
			</div>
			<div class="editor-chart-block-layout__left-content">
				<slot name="left"/>
			</div>
			<div :class="statusClassNames">
				<slot name="status"/>
			</div>
		</div>
	`,
};
