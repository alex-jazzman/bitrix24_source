/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, ui_system_chip_vue, im_v2_lib_counter) {
	'use strict';

	// @vue/component
	const NavigationSection = {
		name: 'NavigationSection',
		components: {
			Chip: ui_system_chip_vue.Chip
		},
		props: {
			text: {
				type: String,
				required: true
			},
			isSelected: {
				type: Boolean,
				required: true
			},
			counter: {
				type: Number,
				default: 0
			}
		},
		computed: {
			ChipSize: () => ui_system_chip_vue.ChipSize,
			chipDesign() {
				if (this.isSelected) {
					return ui_system_chip_vue.ChipDesign.OutlineAccent2;
				}
				return ui_system_chip_vue.ChipDesign.OutlineNoAccent;
			},
			formattedCounter() {
				return im_v2_lib_counter.CounterManager.formatCounter(this.counter);
			}
		},
		template: `
		<div class="bx-im-list-container-navigation-section__container" :class="{ '--selected': isSelected }">
			<Chip
				:text="text"
				:rounded="true"
				:size="ChipSize.Md"
				:design="chipDesign"
			/>
			<div v-if="counter > 0" class="bx-im-list-container-navigation-section__counter">{{ formattedCounter }}</div>
		</div>
	`
	};

	exports.NavigationSection = NavigationSection;

})(this.BX.Messenger.v2.Component.List = this.BX.Messenger.v2.Component.List || {}, BX.UI.System.Chip.Vue, BX.Messenger.v2.Lib);
//# sourceMappingURL=navigation-section.bundle.js.map
