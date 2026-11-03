/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, ui_iconSet_api_vue, ui_vue3) {
	'use strict';

	const IconButton = ui_vue3.defineComponent({
		name: 'IconButton',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			iconName: {
				type: String,
				required: true
			},
			label: {
				type: String,
				required: true
			},
			title: {
				type: String,
				default: undefined
			},
			iconSize: {
				type: Number,
				default: 24
			},
			iconColor: {
				type: String,
				default: null
			},
			disabled: {
				type: Boolean,
				default: false
			},
			pressed: {
				type: Boolean,
				default: null
			},
			expanded: {
				type: Boolean,
				default: null
			},
			tabindex: {
				type: Number,
				default: 0
			}
		},
		emits: ['click'],
		computed: {
			titleAttribute() {
				return this.title === undefined ? this.label : this.title;
			}
		},
		template: `
		<button
			type="button"
			class="bx-im-icon-button__container --focus-visible"
			:aria-label="label"
			:title="titleAttribute"
			:aria-pressed="pressed"
			:aria-expanded="expanded"
			:tabindex="tabindex"
			:disabled="disabled"
			:aria-disabled="disabled"
			@click="$emit('click', $event)"
		>
			<BIcon :name="iconName" :size="iconSize" :color="iconColor" :aria-hidden="true" />
		</button>
	`
	});

	exports.IconButton = IconButton;

})(this.BX.Messenger.v2.Component.Elements = this.BX.Messenger.v2.Component.Elements || {}, BX.UI.IconSet, BX.Vue3);
//# sourceMappingURL=icon-button.bundle.js.map
