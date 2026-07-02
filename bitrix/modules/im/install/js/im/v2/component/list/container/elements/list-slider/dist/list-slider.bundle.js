/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, main_core_events, ui_iconSet_api_vue, im_v2_const, im_v2_component_animation, im_v2_lib_escManager) {
	'use strict';

	// @vue/component
	const RecentListSlider = {
		name: 'RecentListSlider',
		components: {
			SlideAnimation: im_v2_component_animation.SlideAnimation,
			BIcon: ui_iconSet_api_vue.BIcon
		},
		emits: ['beforeClose', 'afterClose'],
		data() {
			return {
				showSlider: true
			};
		},
		computed: {
			OutlineIcons: () => ui_iconSet_api_vue.Outline
		},
		created() {
			main_core_events.EventEmitter.subscribe(im_v2_const.EventType.recent.closeListSlider, this.onCloseSliderEvent);
		},
		beforeUnmount() {
			main_core_events.EventEmitter.unsubscribe(im_v2_const.EventType.recent.closeListSlider, this.onCloseSliderEvent);
		},
		methods: {
			onCloseSlider() {
				this.$emit('beforeClose');
				this.showSlider = false;
			},
			onCloseSliderEvent() {
				this.onCloseSlider();
				return im_v2_lib_escManager.EscEventAction.handled;
			}
		},
		template: `
		<SlideAnimation appear @after-leave="$emit('afterClose')">
			<div v-if="showSlider" class="bx-im-list-container-slider">
				<div class="bx-im-list-container-slider__header">
					<div class="bx-im-list-container-slider__header_content">
						<BIcon
							:name="OutlineIcons.CHEVRON_LEFT_L"
							:hoverable="true"
							class="bx-im-list-container-slider__back-icon"
							@click="onCloseSlider"
						/>
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
		</SlideAnimation>
	`
	};

	exports.RecentListSlider = RecentListSlider;

})(this.BX.Messenger.v2.Component.List = this.BX.Messenger.v2.Component.List || {}, BX.Event, BX.UI.IconSet, BX.Messenger.v2.Const, BX.Messenger.v2.Component.Animation, BX.Messenger.v2.Lib);
//# sourceMappingURL=list-slider.bundle.js.map
