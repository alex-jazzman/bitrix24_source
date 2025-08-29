/* eslint-disable */
this.BX = this.BX || {};
this.BX.UI = this.BX.UI || {};
this.BX.UI.System = this.BX.UI.System || {};
(function (exports,ui_iconSet_api_vue) {
	'use strict';

	const ChipDesign = Object.freeze({
	  Filled: 'filled',
	  OutlineAccent: 'outline-accent',
	  OutlineSuccess: 'outline-success',
	  OutlineAlert: 'outline-alert',
	  OutlineWarning: 'outline-warning',
	  Outline: 'outline',
	  OutlineNoAccent: 'outline-no-accent',
	  ShadowNoAccent: 'shadow-no-accent',
	  Shadow: 'shadow',
	  ShadowAccent: 'shadow-accent'
	});
	const ChipSize = Object.freeze({
	  Lg: 'l',
	  Md: 'm',
	  Sm: 's',
	  Xs: 'xs'
	});

	// @vue/component
	const Chip = {
	  name: 'UiChip',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon
	  },
	  props: {
	    size: {
	      type: String,
	      default: ChipSize.Lg
	    },
	    design: {
	      type: String,
	      default: ChipDesign.Outline
	    },
	    icon: {
	      type: String,
	      default: ''
	    },
	    image: {
	      /** @type ChipImage */
	      type: Object,
	      default: null
	    },
	    text: {
	      type: String,
	      default: ''
	    },
	    rounded: {
	      type: Boolean,
	      default: false
	    },
	    withClear: {
	      type: Boolean,
	      default: false
	    },
	    lock: {
	      type: Boolean,
	      default: false
	    },
	    trimmable: {
	      type: Boolean,
	      default: false
	    }
	  },
	  emits: ['click', 'clear'],
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  methods: {
	    handleKeydown(event) {
	      if (event.key === 'Enter' && !(event.ctrlKey || event.metaKey)) {
	        this.$emit('click');
	      }
	    }
	  },
	  template: `
		<div
			class="ui-chip"
			:class="[
				'--' + design,
				'--' + size,
				{
					'--rounded': rounded,
					'--trimmable': trimmable,
					'--lock': lock,
					'--with-clear': withClear,
					'--no-text': text.length === 0,
				},
			]"
			tabindex="0"
			@keydown="handleKeydown"
			@click="$emit('click')"
		>
			<img v-if="image" class="ui-chip-icon --image" :src="image.src" :alt="image.alt">
			<BIcon v-if="icon" class="ui-chip-icon" :name="icon"/>
			<div class="ui-chip-text">{{ text }}</div>
			<BIcon v-if="withClear" class="ui-chip-clear" :name="Outline.CROSS_M" @click.stop="$emit('clear')"/>
			<BIcon v-if="lock" class="ui-chip-lock" :name="Outline.LOCK_M"/>
		</div>
	`
	};

	var vue = /*#__PURE__*/Object.freeze({
		ChipDesign: ChipDesign,
		ChipSize: ChipSize,
		Chip: Chip
	});

	exports.Vue = vue;
	exports.ChipDesign = ChipDesign;
	exports.ChipSize = ChipSize;

}((this.BX.UI.System.Chip = this.BX.UI.System.Chip || {}),BX.UI.IconSet));
//# sourceMappingURL=chip.bundle.js.map
