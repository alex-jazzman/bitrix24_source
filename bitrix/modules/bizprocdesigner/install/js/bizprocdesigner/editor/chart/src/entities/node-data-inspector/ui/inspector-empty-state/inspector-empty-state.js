import { Loc } from 'main.core';
import { HeadlineMd, TextLg } from 'ui.system.typography.vue';

import './style.css';

// @vue/component
export const InspectorEmptyState = {
	name: 'InspectorEmptyState',
	components: {
		HeadlineMd,
		TextLg,
	},
	computed: {
		title(): string
		{
			return Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_EMPTY_STATE_TITLE');
		},
	},
	template: `
		<div class="bizprocdesigner-inspector-empty-state">
			<div class="bizprocdesigner-inspector-empty-state__image"></div>
			<div class="bizprocdesigner-inspector-empty-state__text">
				<HeadlineMd
					align="center"
					:className="'bizprocdesigner-inspector-empty-state__title'"
				>
					{{ title }}
				</HeadlineMd>
			</div>
		</div>
	`,
};
