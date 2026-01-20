import { BMenu, MenuItemDesign, type MenuOptions } from 'ui.system.menu.vue';
import { Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

const sectionCodeHelp = 'help';

// @vue/component
export const GanttMenu = {
	components: {
		BMenu,
	},
	props: {
		type: {
			type: String,
			required: true,
		},
		bindElement: {
			type: HTMLElement,
			required: true,
		},
	},
	emits: ['update:type', 'close'],
	computed: {
		menuOptions(): MenuOptions
		{
			return {
				bindElement: this.bindElement,
				sections: [
					{
						code: sectionCodeHelp,
					},
				],
				closeOnItemClick: false,
				items: [
					...Object.keys(this.types).map((type: string) => ({
						title: this.types[type].title,
						subtitle: this.types[type].description,
						isSelected: type === this.type,
						onClick: (): void => {
							this.$emit('update:type', type);
							this.$emit('close');
						},
					})),
					{
						sectionCode: sectionCodeHelp,
						design: MenuItemDesign.Accent2,
						title: this.loc('TASKS_V2_GANTT_TYPE_HELP'),
						icon: Outline.QUESTION,
						onClick: () => this.showHelpDesk(),
					},
				],
				offsetTop: 4,
				targetContainer: this.bindElement.closest('body'),
			};
		},
		types(): { [type: string]: { title: string, description: string } }
		{
			return {
				finish_start: {
					title: this.loc('TASKS_V2_GANTT_FINISH_START'),
					description: this.loc('TASKS_V2_GANTT_FINISH_START_DESCRIPTION'),
				},
				start_start: {
					title: this.loc('TASKS_V2_GANTT_START_START'),
					description: this.loc('TASKS_V2_GANTT_START_START_DESCRIPTION'),
				},
				start_finish: {
					title: this.loc('TASKS_V2_GANTT_START_FINISH'),
					description: this.loc('TASKS_V2_GANTT_START_FINISH_DESCRIPTION'),
				},
				finish_finish: {
					title: this.loc('TASKS_V2_GANTT_FINISH_FINISH'),
					description: this.loc('TASKS_V2_GANTT_FINISH_FINISH_DESCRIPTION'),
				},
			};
		},
	},
	methods: {
		showHelpDesk(): void
		{
			top.BX.Helper.show('redirect=detail&code=18100344');
		},
	},
	template: `
		<BMenu :options="menuOptions" @close="$emit('close')"/>
	`,
};
