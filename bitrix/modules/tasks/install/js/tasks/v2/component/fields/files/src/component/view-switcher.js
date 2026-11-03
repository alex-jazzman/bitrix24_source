import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { BMenu, type MenuOptions, type MenuItemOptions, type MenuSectionOptions } from 'ui.system.menu.vue';

import 'ui.icon-set.outline';

import { Model } from 'tasks.v2.const';
import { type FilesViewMode } from 'tasks.v2.model.interface';

const sectionMain = 'view-switcher';

// @vue/component
export const ViewSwitcher = {
	name: 'TaskFilesViewSwitcher',
	components: {
		BIcon,
		BMenu,
	},
	emits: ['change'],
	setup(): Object
	{
		return { Outline };
	},
	data(): Object
	{
		return {
			isMenuShown: false,
		};
	},
	computed: {
		viewMode(): FilesViewMode
		{
			return this.$store.getters[`${Model.Interface}/filesViewMode`];
		},
		menuOptions(): Function
		{
			return (): MenuOptions => ({
				id: 'tasks-files-view-switcher-menu',
				bindElement: this.$refs.switcher,
				offsetTop: 8,
				width: 220,
				sections: this.menuSections,
				items: this.menuItems,
				targetContainer: document.body,
			});
		},
		menuSections(): MenuSectionOptions[]
		{
			return [
				{ code: sectionMain, title: this.loc('TASKS_V2_FILES_VIEW_SWITCHER_TITLE') },
			];
		},
		menuItems(): MenuItemOptions[]
		{
			return [
				{
					id: 'view-tile',
					sectionCode: sectionMain,
					title: this.loc('TASKS_V2_FILES_VIEW_TILE'),
					icon: Outline.APPS,
					isSelected: this.viewMode === 'tile',
					onClick: () => this.handleSelect('tile'),
				},
				{
					id: 'view-list',
					sectionCode: sectionMain,
					title: this.loc('TASKS_V2_FILES_VIEW_LIST'),
					icon: Outline.BULLETED_LIST,
					isSelected: this.viewMode === 'list',
					onClick: () => this.handleSelect('list'),
				},
			];
		},
	},
	methods: {
		handleSelect(mode: FilesViewMode): void
		{
			this.isMenuShown = false;

			if (mode !== this.viewMode)
			{
				this.$emit('change', mode);
			}
		},
	},
	template: `
		<div class="tasks-field-files-view-switcher" data-testid="task-files-view-switcher">
			<button
				type="button"
				class="tasks-field-files-view-switcher-button"
				:aria-label="loc('TASKS_V2_FILES_VIEW_SWITCHER_TITLE')"
				aria-haspopup="menu"
				:aria-expanded="isMenuShown"
				data-task-files-view-switcher
				data-testid="task-files-view-switcher-btn"
				@click="isMenuShown = true"
				ref="switcher"
			>
				<BIcon
					class="tasks-field-files-view-switcher-icon"
					:name="Outline.APPS"
					hoverable
					aria-hidden="true"
				/>
			</button>
			<BMenu v-if="isMenuShown" :options="menuOptions()" @close="isMenuShown = false"/>
		</div>
	`,
};
