/* eslint-disable */
this.BX = this.BX || {};
this.BX.Socialnetwork = this.BX.Socialnetwork || {};
this.BX.Socialnetwork.V2 = this.BX.Socialnetwork.V2 || {};
this.BX.Socialnetwork.V2.Components = this.BX.Socialnetwork.V2.Components || {};
(function (exports, ui_vue3, main_core) {
	'use strict';

	const UiTextarea = ui_vue3.defineComponent({
		name: 'UiTextarea',
		props: {
			modelValue: {
				type: String,
				default: ''
			},
			id: {
				type: String,
				default: ''
			},
			placeholder: {
				type: String,
				default: ''
			},
			disabled: {
				type: Boolean,
				default: false
			}
		},
		emits: ['update:modelValue'],
		watch: {
			modelValue() {
				void this.$nextTick(() => this.adjustHeight());
			}
		},
		mounted() {
			this.adjustHeight();
		},
		methods: {
			onInput(event) {
				const value = event.target.value;
				this.$emit('update:modelValue', value);
				this.adjustHeight();
			},
			adjustHeight() {
				const textarea = this.$refs.textarea;
				if (!textarea) {
					return;
				}
				main_core.Dom.style(textarea, 'height', '');
				if (textarea.scrollHeight > textarea.clientHeight) {
					main_core.Dom.style(textarea, 'height', `${textarea.scrollHeight}px`);
				}
			}
		},
		template: `
		<div class="socialnetwork--ui-textarea">
			<textarea
				ref="textarea"
				:value="modelValue"
				:id
				class="socialnetwork--ui-textarea--textarea"
				:placeholder
				:disabled
				@input="onInput"
			></textarea>
		</div>
	`
	});

	exports.UiTextarea = UiTextarea;

})(this.BX.Socialnetwork.V2.Components.Elements = this.BX.Socialnetwork.V2.Components.Elements || {}, BX.Vue3, BX);
//# sourceMappingURL=ui-textarea.bundle.js.map
