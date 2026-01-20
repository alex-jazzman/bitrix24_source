export const LoaderType = Object.freeze({
	DEFAULT: 'DEFAULT',
	BULLET: 'BULLET',
});

export type BulletLoaderOptions = {
	target?: HTMLElement,
	size?: string,
};

export type DefaultLoaderOptions = {
	target?: HTMLElement,
	size?: number,
};

export type BookingLoaderOptions = {
	type: $Values<typeof LoaderType>,
} & (DefaultLoaderOptions | BulletLoaderOptions);
