/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, ui_iconSet_api_vue) {
	'use strict';

	// @vue/component
	const CloseIcon = {
		name: 'CloseIcon',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		computed: {
			OutlineIcons: () => ui_iconSet_api_vue.Outline
		},
		methods: {
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<button
			type="button"
			class="bx-im-list-container-slider__close-container"
			:aria-label="loc('IM_LIST_SLIDER_CLOSE_BUTTON_ARIA_LABEL')"
		>
			<BIcon
				:name="OutlineIcons.CHEVRON_LEFT_L"
				class="bx-im-list-container-slider__close-icon"
				aria-hidden="true"
			/>
		</button>
	`
	};

	// @vue/component
	const RecentListSlider = {
		name: 'RecentListSlider',
		components: {
			CloseIcon
		},
		props: {
			compactMode: {
				type: Boolean,
				default: false
			}
		},
		emits: ['close'],
		computed: {
			containerClasses() {
				return {
					'--compact-mode': this.compactMode
				};
			}
		},
		methods: {
			onClose() {
				this.$emit('close');
			}
		},
		template: `
		<div class="bx-im-list-container-slider" :class="containerClasses">
			<div class="bx-im-list-container-slider__header">
				<div class="bx-im-list-container-slider__header_content">
					<CloseIcon @click="onClose" />
					<slot name="header"></slot>
				</div>
				<div v-if="$slots['subheader']" class="bx-im-list-container-slider__subheader_content">
					<slot name="subheader"></slot>
				</div>
			</div>
			<div class="bx-im-list-container-slider__content">
				<slot name="content"></slot>
			</div>
		</div>
	`
	};

	exports.RecentListSlider = RecentListSlider;

})(this.BX.Messenger.v2.Component.List = this.BX.Messenger.v2.Component.List || {}, BX.UI.IconSet);
//# sourceMappingURL=list-slider.bundle.js.map
