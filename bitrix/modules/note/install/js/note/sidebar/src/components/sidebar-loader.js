import { Loader } from 'note.ui.loader';

export const SidebarLoader = {
	name: 'SidebarLoader',
	components: {
		Loader,
	},
	props: {
		level: { type: Number, default: 0 },
	},
	computed: {
		indentStyle(): Object
		{
			const normalized = Number.isFinite(Number(this.level)) ? Math.max(Number(this.level), 0) : 0;
			const padding = 16 + normalized * 24;

			return { paddingLeft: `${padding}px` };
		},
	},
	template: `
		<div class="sidebar-loader" :style="indentStyle">
			<Loader />
		</div>
	`,
};
