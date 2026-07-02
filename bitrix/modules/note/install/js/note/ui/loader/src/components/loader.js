import { Loc } from 'main.core';

export const Loader = {
	name: 'NoteUiLoader',
	props: {
		label: {
			type: String,
			default: null,
		},
	},
	computed: {
		accessibleLabel(): string
		{
			return this.label || Loc.getMessage('NOTE_UI_LOADER_DEFAULT_LABEL') || '';
		},
	},
	template: `
		<div class="ui-loader__bullet" role="status" aria-live="polite" :aria-label="accessibleLabel">
			<div class="ui-loader__bullet_item"></div>
			<div class="ui-loader__bullet_item"></div>
			<div class="ui-loader__bullet_item"></div>
			<div class="ui-loader__bullet_item"></div>
			<div class="ui-loader__bullet_item"></div>
		</div>
	`,
};
