import { Loader } from 'main.loader';

// @vue/component
export const UiLoader = {
	name: 'UiLoader',
	props: {
		show: Boolean,
	},
	setup(): { loader: Loader }
	{
		return {
			loader: new Loader(),
		};
	},
	watch: {
		show: {
			handler(show: boolean): void
			{
				if (show)
				{
					this.showLoader();
				}
				else
				{
					this.hideLoader();
				}
			},
		},
	},
	mounted(): void
	{
		this.showLoader();
	},
	unmounted(): void
	{
		this.loader?.destroy();
	},
	methods: {
		showLoader(): void
		{
			void this.loader?.show(this.$refs.point);
		},
		hideLoader(): void
		{
			void this.loader?.hide(this.$refs.point);
		},
	},
	template: `
		<div ref="point"></div>
	`,
};
