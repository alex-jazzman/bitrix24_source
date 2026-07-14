/* eslint-disable */
this.BX = this.BX || {};
this.BX.Socialnetwork = this.BX.Socialnetwork || {};
this.BX.Socialnetwork.V2 = this.BX.Socialnetwork.V2 || {};
this.BX.Socialnetwork.V2.Components = this.BX.Socialnetwork.V2.Components || {};
(function (exports, ui_vue3, socialnetwork_v2_components_elements_questionMark) {
	'use strict';

	const UiField = ui_vue3.defineComponent({
		name: 'UiField',
		components: {
			QuestionMark: socialnetwork_v2_components_elements_questionMark.QuestionMark
		},
		props: {
			label: {
				type: String,
				default: ''
			},
			labelFor: {
				type: String,
				default: ''
			},
			hint: {
				type: [String, null],
				default: null
			},
			hintOptions: {
				type: Object,
				default: null
			}
		},
		template: `
		<div class="socialnetwork--project-wizard--ui-field">
			<div class="socialnetwork--project-wizard--ui-field_label-wrapper">
				<slot name="label">
					<label
						v-if="label"
						:for="labelFor"
						class="socialnetwork--project-wizard--ui-field_label"
					>
						{{ label }}
					</label>
				</slot>
				<template v-if="hint">
					<QuestionMark :hintText="hint" :size="hintOptions?.size" :hintMaxWidth="hintOptions?.maxWidth"/>
				</template>
			</div>
			<div class="socialnetwork--project-wizard--ui-field_field">
				<slot/>
			</div>
		</div>
	`
	});

	exports.UiField = UiField;

})(this.BX.Socialnetwork.V2.Components.Elements = this.BX.Socialnetwork.V2.Components.Elements || {}, BX.Vue3, BX.Socialnetwork.V2.Components.Elements);
//# sourceMappingURL=ui-field.bundle.js.map
