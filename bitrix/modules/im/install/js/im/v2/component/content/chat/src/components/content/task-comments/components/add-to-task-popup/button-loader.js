import { Loader } from 'main.loader';

const LOADER_SIZE = 20;
const LOADER_COLOR = '#fff';

// @vue/component
export const AddToTaskButtonLoader = {
	name: 'AddToTaskButtonLoader',
	mounted()
	{
		this.loader = new Loader({
			target: this.$refs.container,
			size: LOADER_SIZE,
			color: LOADER_COLOR,
		});

		void this.loader.show();
	},
	beforeUnmount()
	{
		this.loader?.destroy();
	},
	template: `
		<div class="bx-im-mention-add-to-task__loading" ref="container"></div>
	`,
};
