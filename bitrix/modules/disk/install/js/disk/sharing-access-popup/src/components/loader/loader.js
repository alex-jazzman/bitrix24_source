import { Loader } from 'main.loader';

// @vue/compontents
export const SharingAccessLoader = {
	name: 'SharingAccessLoader',
	created()
	{
		this.loader = null;
	},
	mounted()
	{
		this.loader = new Loader({
			target: this.$refs.container,
			size: 36,
			mode: 'inline',
		});

		this.loader.show();
	},
	beforeUnmount()
	{
		this.loader?.destroy();
		this.loader = null;
	},
	template: `
		<div class="disk-sharing-access-popup__loader">
			<span ref="container"></span>
		</div>
	`,
};
