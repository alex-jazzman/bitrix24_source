import { Plugins } from 'ui.text-editor';
import { BMenu, MenuOptions, MenuItemOptions } from 'ui.system.menu.vue';
import { BIcon, Outline, Editor } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';
import 'ui.icon-set.editor';

import { ActionButton } from './action-button';

import '../entity-text.css';

// @vue/component
export const MoreButton = {
	components: {
		ActionButton,
		BIcon,
		BMenu,
	},
	props: {
		editor: {
			type: Object,
			required: true,
		},
	},
	setup(): Object
	{
		return {
			Outline,
			Editor,
		};
	},
	data(): Object
	{
		return {
			isMenuShown: false,
		};
	},
	computed: {
		menuOptions(): MenuOptions
		{
			return {
				id: 'tasks-entity-text-more-actions-menu',
				bindElement: this.$refs.actionButton.$el,
				offsetTop: 8,
				items: this.menuItems,
				targetContainer: document.body,
			};
		},
		menuItems(): MenuItemOptions[]
		{
			return [
				{
					title: this.loc('TASKS_V2_ENTITY_TEXT_MORE_CODE'),
					icon: Outline.DEVELOPER_RESOURCES,
					onClick: this.insertCodeBlock,
				},
				{
					title: this.loc('TASKS_V2_ENTITY_TEXT_MORE_QUOTE'),
					icon: Outline.QUOTE,
					onClick: this.insertQuote,
				},
				{
					title: this.loc('TASKS_V2_ENTITY_TEXT_MORE_SPOILER'),
					icon: Editor.INSERT_SPOILER,
					onClick: this.insertSpoiler,
				},
			];
		},
	},
	methods: {
		insertQuote(): void
		{
			const command = Plugins.Quote.TOGGLE_QUOTE_COMMAND ?? Plugins.Quote.INSERT_QUOTE_COMMAND;

			this.editor.dispatchCommand(command);
		},
		insertCodeBlock(): void
		{
			const command = Plugins.Code.TOGGLE_CODE_COMMAND ?? Plugins.Code.INSERT_CODE_COMMAND;

			this.editor.dispatchCommand(command);
		},
		insertSpoiler(): void
		{
			const command = Plugins.Spoiler.TOGGLE_SPOILER_COMMAND ?? Plugins.Spoiler.INSERT_SPOILER_COMMAND;

			this.editor.dispatchCommand(command);
		},
	},
	template: `
		<ActionButton 
			:iconName="Outline.MORE_L" 
			:title="loc('TASKS_V2_ENTITY_TEXT_ACTION_MORE')" 
			@click="isMenuShown = true"
			ref="actionButton"
		/>
		<BMenu v-if="isMenuShown" :options="menuOptions" @close="isMenuShown = false"/>
	`,
};
