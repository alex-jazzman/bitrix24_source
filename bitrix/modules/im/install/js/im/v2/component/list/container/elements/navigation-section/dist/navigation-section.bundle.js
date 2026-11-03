/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, ui_system_chip_vue, im_v2_lib_counter, im_v2_lib_utils) {
	'use strict';

	const TAB_ROLE = 'tab';
	const BUTTON_ROLE = 'button';
	const ACTIVATION_KEY = 'Space';

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
			},
			semanticRole: {
				type: String,
				default: null
			},
			rootId: {
				type: String,
				default: null
			},
			controls: {
				type: String,
				default: null
			},
			rootTabIndex: {
				type: Number,
				default: null
			},
			// Test id of the focusable chip. An attribute on the tag lands on the section wrapper instead,
			// which is where the other consumer of the section keeps its own label.
			rootTestId: {
				type: String,
				default: null
			}
		},
		emits: ['activate'],
		computed: {
			ChipSize: () => ui_system_chip_vue.ChipSize,
			chipDesign() {
				if (this.isSelected) {
					return ui_system_chip_vue.ChipDesign.OutlineAccent2;
				}
				return ui_system_chip_vue.ChipDesign.OutlineNoAccent;
			},
			chipRole() {
				return this.semanticRole ?? BUTTON_ROLE;
			},
			ariaCurrent() {
				// a tab announces its state through aria-selected, aria-current would duplicate it
				return this.semanticRole === TAB_ROLE ? null : this.isSelected;
			},
			ariaSelected() {
				// the mirror of ariaCurrent: outside a tab set the same state is announced by aria-current
				return this.semanticRole === TAB_ROLE ? this.isSelected : null;
			},
			tabIndexAttribute() {
				// an attribute bound to null strips the tabindex="0" of the Chip template instead of keeping it
				return this.rootTabIndex === null ? {} : {
					tabindex: this.rootTabIndex
				};
			},
			formattedCounter() {
				return im_v2_lib_counter.CounterManager.formatCounter(this.counter);
			}
		},
		methods: {
			handleChipKeydown(event) {
				// Enter arrives as the click event of the Chip, a second handler here would activate twice.
				// Exact comparison, the same helper the recipient list of the forward window uses: a held
				// modifier means the user is after something else, and Shift+Space keeps its native meaning.
				if (!im_v2_lib_utils.Utils.key.isExactCombination(event, ACTIVATION_KEY)) {
					return;
				}
				event.preventDefault();
				this.$emit('activate');
			},
			handleContainerClick(event) {
				// a click on the Chip bubbles here and is already reported by its own click event
				if (this.$refs.chip.$el.contains(event.target)) {
					return;
				}
				this.$emit('activate');
			}
		},
		template: `
		<div
			class="bx-im-list-container-navigation-section__container"
			:class="{ '--selected': isSelected }"
			@click="handleContainerClick"
		>
			<Chip
				ref="chip"
				:text="text"
				:rounded="true"
				:size="ChipSize.Md"
				:design="chipDesign"
				:id="rootId"
				:role="chipRole"
				:aria-controls="controls"
				:aria-selected="ariaSelected"
				:aria-current="ariaCurrent"
				v-bind="tabIndexAttribute"
				:data-testid="rootTestId"
				@click="$emit('activate')"
				@keydown="handleChipKeydown"
			/>
			<div v-if="counter > 0" class="bx-im-list-container-navigation-section__counter">{{ formattedCounter }}</div>
		</div>
	`
	};

	exports.NavigationSection = NavigationSection;

})(this.BX.Messenger.v2.Component.List = this.BX.Messenger.v2.Component.List || {}, BX.UI.System.Chip.Vue, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib);
//# sourceMappingURL=navigation-section.bundle.js.map
