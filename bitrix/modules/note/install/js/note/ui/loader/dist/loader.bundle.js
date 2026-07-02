/* eslint-disable */
this.BX = this.BX || {};
this.BX.Note = this.BX.Note || {};
(function (exports, ui_loader, main_core) {
	'use strict';

	const Loader = {
		name: 'NoteUiLoader',
		props: {
			label: {
				type: String,
				default: null
			}
		},
		computed: {
			accessibleLabel() {
				return this.label || main_core.Loc.getMessage('NOTE_UI_LOADER_DEFAULT_LABEL') || '';
			}
		},
		template: `
		<div class="ui-loader__bullet" role="status" aria-live="polite" :aria-label="accessibleLabel">
			<div class="ui-loader__bullet_item"></div>
			<div class="ui-loader__bullet_item"></div>
			<div class="ui-loader__bullet_item"></div>
			<div class="ui-loader__bullet_item"></div>
			<div class="ui-loader__bullet_item"></div>
		</div>
	`
	};

	exports.Loader = Loader;

})(this.BX.Note.Ui = this.BX.Note.Ui || {}, BX.UI, BX);
//# sourceMappingURL=loader.bundle.js.map
