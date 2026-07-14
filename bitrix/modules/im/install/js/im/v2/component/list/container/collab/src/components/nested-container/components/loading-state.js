import { RecentListSlider } from 'im.v2.component.list.container.elements.list-slider';
import { ListLoadingState as LoadingState } from 'im.v2.component.elements.list-loading-state';

import { HeaderLoader } from './header/components/header-loader';
import { NavigationLoader } from './navigation/components/navigation-loader';
import { CardLoader } from './collab-card/components/card-loader';

// @vue/component
export const NestedListLoadingState = {
	name: 'NestedListLoadingState',
	components: { RecentListSlider, HeaderLoader, NavigationLoader, CardLoader, LoadingState },
	props: {
		compactMode: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['close'],
	template: `
		<RecentListSlider @close="$emit('close')" :compactMode="compactMode">
			<template #header>
				<HeaderLoader />
			</template>
			<template #subheader>
				<CardLoader />
				<NavigationLoader />
			</template>
			<template #content>
				<LoadingState />
			</template>
		</RecentListSlider>
	`,
};
