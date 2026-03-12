import { EventEmitter } from 'main.core.events';
import { BMenu } from 'ui.system.menu.vue';
import {
	makeEmptyTitle,
	makeEmptyDescription,
	makeEmptyDelimiter,
	makeEmptyConstant,
	makeEmptyTitleWithIcon,
} from '../../utils';
import type { MenuOptions } from 'ui.system.menu';

type AddElementBtnData = {
	isMenuShown: boolean;
	offsetLeft: number;
};

// @vue/component
export const AddElementBtn = {
	name: 'AddElementBtn',
	components: {
		BMenu,
	},
	props:
	{
		constantIds: {
			type: Set,
			default: () => new Set(),
		},
	},
	emits: ['add:element', 'create:constant'],
	data(): AddElementBtnData
	{
		return {
			isMenuShown: false,
			offsetLeft: 0,
		};
	},
	computed: {
		menuOptions(): MenuOptions
		{
			return {
				bindElement: this.$refs.addElementButton,
				offsetLeft: this.offsetLeft,
				fixed: false,
				cacheable: false,
				items: [
					{
						title: this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_TITLE_ITEM_LABEL'),
						onClick: () => this.$emit('add:element', makeEmptyTitle()),
					},
					{
						title: this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_ICON_TITLE_ITEM_LABEL'),
						onClick: () => this.$emit('add:element', makeEmptyTitleWithIcon()),
					},
					{
						title: this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_DESCRIPTION_ITEM_LABEL'),
						onClick: () => this.$emit('add:element', makeEmptyDescription()),
					},
					{
						title: this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_DELIMITER_ITEM_LABEL'),
						onClick: () => this.$emit('add:element', makeEmptyDelimiter()),
					},
					{
						title: this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_MENU'),
						onClick: () => {
							const id = this.generateFriendlyId();
							this.$emit('create:constant', makeEmptyConstant(id));
						},
					},
				],
			};
		},
	},
	mounted(): void
	{
		EventEmitter.subscribe('Bizproc.SetupTemplate:Draggable:start', this.closeMenu);
		EventEmitter.subscribe('Bizproc.NodeSettings:onScroll', this.closeMenu);
	},
	unmounted(): void
	{
		EventEmitter.unsubscribe('Bizproc.SetupTemplate:Draggable:start', this.closeMenu);
		EventEmitter.unsubscribe('Bizproc.NodeSettings:onScroll', this.closeMenu);
	},
	methods: {
		onShowMenu(event: MouseEvent): void
		{
			const { left = 0 } = this.$refs.addElementButton?.getBoundingClientRect() ?? {};

			this.offsetLeft = Math.abs(event.clientX - left);
			this.isMenuShown = true;
		},
		generateFriendlyId(): string
		{
			const BASE_NAME = 'Constant';

			let counter = 1;
			let potentialId = `${BASE_NAME}${counter}`;

			while (this.constantIds.has(potentialId))
			{
				counter++;
				potentialId = `${BASE_NAME}${counter}`;
			}

			return potentialId;
		},
		closeMenu(): void
		{
			this.$refs.addElementButton.blur();
			this.isMenuShown = false;
		},
	},
	template: `
		<button
			ref="addElementButton"
			class="ui-btn --air --wide --style-outline-no-accent ui-btn-no-caps --with-icon bizproc-setuptemplateactivity-add-element-btn"
			type="button"
			@click="onShowMenu"
		>
			<div class="ui-icon-set --plus-l"/>
			<span class="ui-btn-text">
				{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_ADD_ITEM') }}
			</span>
			<BMenu
				v-if="isMenuShown"
				:options="menuOptions"
				@close="isMenuShown = false"
			/>
		</button>
	`,
};
