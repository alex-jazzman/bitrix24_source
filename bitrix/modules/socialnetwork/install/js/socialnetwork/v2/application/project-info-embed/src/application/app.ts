import { defineComponent, type PropType } from 'ui.vue3';

import { ProjectInfoBlock } from '../component/project-info-block/project-info-block';
import { loadProjectViewInfo } from '../feature/load-project-view-info/load-project-view-info';
import { type ProjectDates, type ProjectViewInfo } from '../model/project-view-info/types';

type AppData = {
	goal: string,
	description: string,
	tags: string[],
	dates: ProjectDates | null,
	isSettled: boolean,
	isDestroyed: boolean,
};

export const App = defineComponent({
	name: 'SocialnetworkProjectInfoEmbedApp',
	components: {
		ProjectInfoBlock,
	},
	props: {
		projectId: {
			type: Number,
			required: true,
		},
		onReady: {
			type: Function as unknown as PropType<(() => void) | null>,
			default: null,
		},
	},
	data(): AppData
	{
		return {
			goal: '',
			description: '',
			tags: [],
			dates: null,
			isSettled: false,
			isDestroyed: false,
		};
	},
	created(): void
	{
		void this.loadProject();
	},
	beforeUnmount(): void
	{
		this.isDestroyed = true;
	},
	methods: {
		async loadProject(): Promise<void>
		{
			await loadProjectViewInfo({
				projectId: this.projectId,
				isDestroyed: () => this.isDestroyed,
				applyProject: (project) => this.applyProject(project),
				showContent: () => {
					this.isSettled = true;
				},
				waitForDomUpdate: () => this.$nextTick(),
				onReady: () => this.onReady?.(),
			});
		},
		applyProject(project: ProjectViewInfo): void
		{
			this.goal = project.goal;
			this.description = project.description;
			this.tags = project.tags;
			this.dates = project.dates;
		},
	},
	// Nothing is rendered until the read settles: the sections now state that a
	// field is unset, and claiming that before the answer arrives would show four
	// false "not set" lines and then shove the whole sidebar down on replacing them.
	template: `
		<ProjectInfoBlock
			v-if="isSettled"
			:goal="goal"
			:description="description"
			:dates="dates"
			:tags="tags"
		/>
	`,
});
