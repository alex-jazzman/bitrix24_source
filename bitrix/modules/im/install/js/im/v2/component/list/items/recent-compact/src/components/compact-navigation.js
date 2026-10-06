import 'ui.design-tokens.air';
import { Extension } from 'main.core';

import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { NavigationMenuItem } from 'im.v2.const';

import { CompactNavigationItem } from './compact-navigation-item';

import '../css/compact-navigation.css';

// @vue/component
export const CompactNavigation = {
	name: 'CompactNavigation',
	components: { CompactNavigationItem },
	computed: {
		copilotAvailable(): boolean
		{
			return !FeatureManager.isFeatureAvailable(Feature.isBitrixGptV2Available)
				&& FeatureManager.isFeatureAvailable(Feature.copilotAvailable);
		},
		openLinesAvailable(): boolean
		{
			const settings = Extension.getSettings('im.v2.component.list.items.recent-compact');

			return settings.get('openLinesAvailable', false);
		},
		preparedNavigationItems(): $Values<typeof NavigationMenuItem>[]
		{
			const items = [NavigationMenuItem.notification];

			if (this.copilotAvailable)
			{
				items.push(NavigationMenuItem.copilot);
			}

			if (this.openLinesAvailable)
			{
				items.push(
					FeatureManager.isFeatureAvailable(Feature.openLinesV2)
						? NavigationMenuItem.openlinesV2
						: NavigationMenuItem.openlines,
				);
			}

			return items;
		},
	},
	template: `
		<div class="bx-im-compact-navigation__container">
			<div class="bx-im-compact-navigation__items">
				<CompactNavigationItem
					v-for="navigationItemId in preparedNavigationItems"
					:id="navigationItemId"
					:key="navigationItemId"
				/>
			</div>
			<div class="bx-im-compact-navigation__delimiter"></div>
		</div>
	`,
};
