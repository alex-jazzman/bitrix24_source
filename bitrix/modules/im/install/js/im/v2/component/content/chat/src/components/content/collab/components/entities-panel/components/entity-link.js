import { Type } from 'main.core';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { Analytics } from 'im.v2.lib.analytics';
import { Feature, FeatureManager } from 'im.v2.lib.feature';

import { EntityCounter } from './entity-counter';

export const EntityType = {
	tasks: 'tasks',
	files: 'files',
	calendar: 'calendar',
};

// @vue/component
export const EntityLink = {
	name: 'EntityLink',
	components: { EntityCounter, BIcon },
	props:
	{
		dialogId: {
			type: String,
			required: true,
		},
		compactMode: {
			type: Boolean,
			required: true,
		},
		type: {
			type: String,
			required: true,
		},
		title: {
			type: String,
			required: true,
		},
		url: {
			type: String,
			required: true,
		},
		counter: {
			type: [Number, null],
			default: null,
		},
	},
	computed:
	{
		isAirDesignEnabled(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isAirDesignEnabled);
		},
		iconName(): string
		{
			const iconByType = {
				[EntityType.tasks]: Outline.TASKS,
				[EntityType.files]: Outline.FILE,
				[EntityType.calendar]: Outline.CALENDAR,
			};

			return iconByType[this.type] ?? Outline.FILE;
		},
		showCounter(): boolean
		{
			return !Type.isNull(this.counter) && this.counter > 0;
		},
	},
	methods:
	{
		onLinkClick()
		{
			Analytics.getInstance().collabEntities.onClick(this.dialogId, this.type);

			BX.SidePanel.Instance.open(this.url, {
				cacheable: false,
				customLeftBoundary: 0,
			});
		},
	},
	template: `
		<a :href="url" @click.prevent="onLinkClick" class="bx-im-collab-header__link" :class="'--' + type">
			<BIcon
				v-if="compactMode && isAirDesignEnabled"
				:name="iconName"
				:hoverable="true"
				class="bx-im-collab-header__link-icon-air"
			/>
			<span v-else-if="compactMode" class="bx-im-collab-header__link-icon"></span>
			<span v-else class="bx-im-collab-header__link-text">{{ title }}</span>
			<EntityCounter v-if="showCounter" :counter="counter" />
		</a>
	`,
};
