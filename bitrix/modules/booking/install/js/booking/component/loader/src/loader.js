import { LoaderFactory } from './internal/loader-factory';
import { LoaderType } from './type';

import type { BookingLoaderOptions } from './type';

import './loader.css';

export const Loader = {
	name: 'BookingLoader',
	props: {
		options: {
			type: Object,
			default: null,
		},
	},
	methods: {
		getOptions(): BookingLoaderOptions
		{
			return { ...this.getDefaultOptions(), ...this.options };
		},
		getDefaultOptions(): BookingLoaderOptions
		{
			return {
				type: LoaderType.BULLET,
				target: this.$refs.loader,
				size: 'xs',
			};
		},
	},
	async mounted(): void
	{
		this.loader = await LoaderFactory.createByType(this.getOptions().type, this.getOptions());

		this.loader?.render?.();
		this.loader?.show();
	},
	beforeUnmount(): void
	{
		this.loader?.hide?.();
		this.loader = null;
	},
	template: `
		<div class="booking-loader__container" ref="loader"></div>
	`,
};
