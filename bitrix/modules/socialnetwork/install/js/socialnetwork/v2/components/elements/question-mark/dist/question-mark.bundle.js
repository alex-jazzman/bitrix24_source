/* eslint-disable */
this.BX = this.BX || {};
this.BX.Socialnetwork = this.BX.Socialnetwork || {};
this.BX.Socialnetwork.V2 = this.BX.Socialnetwork.V2 || {};
this.BX.Socialnetwork.V2.Components = this.BX.Socialnetwork.V2.Components || {};
(function (exports, ui_vue3, ui_vue3_directives_hint, ui_iconSet_api_vue, ui_iconSet_outline, socialnetwork_v2_components_elements_uiHint) {
	'use strict';

	const QuestionMark = ui_vue3.defineComponent({
		name: 'UiQuestionMark',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		directives: {
			hint: ui_vue3_directives_hint.hint
		},
		props: {
			size: {
				type: Number,
				default: 20
			},
			hintText: {
				type: String,
				default: ''
			},
			hintMaxWidth: {
				type: Number,
				default: 300
			}
		},
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		computed: {
			tooltip() {
				if (!this.hintText) {
					return null;
				}
				return () => socialnetwork_v2_components_elements_uiHint.tooltip({
					text: this.hintText,
					popupOptions: {
						offsetLeft: this.$el.offsetWidth / 2,
						maxWidth: this.hintMaxWidth
					},
					timeout: 200
				});
			}
		},
		template: `
		<BIcon v-hint="tooltip" class="b24-question-mark" :name="Outline.QUESTION" :size color="var(--ui-color-base-4)"/>
	`
	});

	exports.QuestionMark = QuestionMark;

})(this.BX.Socialnetwork.V2.Components.Elements = this.BX.Socialnetwork.V2.Components.Elements || {}, BX.Vue3, BX.Vue3.Directives, BX.UI.IconSet, window, BX.Socialnetwork.V2.Components.Elements);
//# sourceMappingURL=question-mark.bundle.js.map
