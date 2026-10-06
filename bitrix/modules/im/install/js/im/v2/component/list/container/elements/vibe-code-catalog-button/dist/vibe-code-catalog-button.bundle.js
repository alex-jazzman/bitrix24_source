/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, main_core, main_core_events, ui_iconSet_api_vue, ui_vue3, im_v2_const) {
	'use strict';

	const CatalogEvent = {
		request: 'im:vibe-code-catalog:request',
		stateChanged: 'im:vibe-code-catalog:state-changed'
	};
	const ICON_NAME = ui_iconSet_api_vue.Outline.VIBECODE_CATALOG;
	const COUNTER_DISPLAY_LIMIT = 99;
	const AVAILABLE_LAYOUTS = new Set([im_v2_const.Layout.chat, im_v2_const.Layout.notification]);
	const VibeCodeCatalogButton = ui_vue3.defineComponent({
		name: 'VibeCodeCatalogButton',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		data() {
			return {
				isActive: false,
				counter: 0
			};
		},
		computed: {
			ICON_NAME: () => ICON_NAME,
			layoutName() {
				return this.$store.getters['application/getLayout'].name;
			},
			shouldShow() {
				if (!this.isAvailable) {
					return false;
				}
				return AVAILABLE_LAYOUTS.has(this.layoutName);
			},
			isAvailable() {
				const settings = main_core.Extension.getSettings('im.v2.component.list.container.elements.vibe-code-catalog-button');
				return settings.get('isAvailable', false);
			},
			shouldShowCounter() {
				if (this.isActive) {
					return false;
				}
				return this.counter > 0;
			},
			isCounterValueOverflowed() {
				return this.counter > COUNTER_DISPLAY_LIMIT;
			},
			formattedCounterValue() {
				if (this.isCounterValueOverflowed) {
					return `${COUNTER_DISPLAY_LIMIT}+`;
				}
				return this.counter.toString();
			}
		},
		created() {
			main_core_events.EventEmitter.subscribe(CatalogEvent.stateChanged, this.onStateChanged);
		},
		beforeUnmount() {
			if (this.isActive) {
				main_core_events.EventEmitter.emit(CatalogEvent.request, {
					open: false,
					node: null
				});
			}
			main_core_events.EventEmitter.unsubscribe(CatalogEvent.stateChanged, this.onStateChanged);
		},
		methods: {
			onClick() {
				main_core_events.EventEmitter.emit(CatalogEvent.request, {
					open: !this.isActive,
					node: this.$el
				});
			},
			onStateChanged(event) {
				this.isActive = event.getData().active === true;
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<button
			v-if="shouldShow"
			type="button"
			class="bx-im-list-container-vibe-code-catalog-button__container"
			data-bx-vibe-code-catalog-events="true"
			:class="{'--active': isActive }"
			:aria-label="loc('IM_ELEMENTS_VIBE_CODE_CATALOG_ARIA_TITLE')"
			:aria-pressed="isActive"
			@click="onClick"
		>
			<BIcon
				class="bx-im-list-container-vibe-code-catalog-button__icon"
				:name="ICON_NAME"
				:aria-hidden="true"
			/>
			<span 
				v-if="shouldShowCounter"
				class="bx-im-list-container-vibe-code-catalog-button__counter"
				:class="{'--overflowed': isCounterValueOverflowed}"
				:aria-hidden="true"
			>
				{{ formattedCounterValue }}
			</span>
		</button>
	`
	});

	exports.VibeCodeCatalogButton = VibeCodeCatalogButton;

})(this.BX.Messenger.v2.Component.List = this.BX.Messenger.v2.Component.List || {}, BX, BX.Event, BX.UI.IconSet, BX.Vue3, BX.Messenger.v2.Const);
//# sourceMappingURL=vibe-code-catalog-button.bundle.js.map
