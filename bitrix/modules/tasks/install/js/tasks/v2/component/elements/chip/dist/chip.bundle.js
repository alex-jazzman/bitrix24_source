/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports,ui_iconSet_api_vue,ui_iconSet_api_core) {
	'use strict';

	const ChipDesign = Object.freeze({
	  Outline: 'outline',
	  OutlineAccent: 'outline-accent',
	  OutlineAlert: 'outline-alert',
	  Shadow: 'shadow',
	  ShadowAccent: 'shadow-accent'
	});

	// @vue/component
	const Chip = {
	  name: 'UiChip',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon
	  },
	  props: {
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
	      required: true
	    },
	    design: {
	      type: String,
	      default: ChipDesign.Outline
	    },
	    withClear: {
	      type: Boolean,
	      default: false
	    },
	    lock: {
	      type: Boolean,
	      default: false
	    },
	    soon: {
	      type: Boolean,
	      default: false
	    },
	    trimmable: {
	      type: Boolean,
	      default: false
	    }
	  },
	  emits: ['clear', 'click'],
	  setup() {
	    return {
	      Outline: ui_iconSet_api_core.Outline
	    };
	  },
	  methods: {
	    clear(event) {
	      event.stopPropagation();
	      this.$emit('clear');
	    },
	    handleKeydown(event) {
	      if (event.key === 'Enter' && !(event.ctrlKey || event.metaKey)) {
	        this.$emit('click');
	      }
	    },
	    focus() {
	      this.$el.focus();
	    }
	  },
	  template: `
		<div
			class="b24-chip"
			:class="['--' + design, { '--soon': soon, '--trimmable': trimmable, '--lock': lock }]"
			tabindex="0"
			@keydown="handleKeydown"
			@click="$emit('click')"
		>
			<img v-if="image" class="b24-chip-image" :src="image.src" :alt="image.alt">
			<BIcon v-if="icon" class="b24-chip-icon" :name="icon"/>
			<div class="b24-chip-text">{{ text }}</div>
			<span v-if="soon" class="b24-chip-soon">скоро</span>
			<BIcon v-if="withClear" class="b24-chip-clear" :name="Outline.CROSS_M" @click="clear"/>
			<BIcon v-if="lock" class="b24-chip-lock" :name="Outline.LOCK_M"/>
		</div>
	`
	};

	exports.ChipDesign = ChipDesign;
	exports.Chip = Chip;

}((this.BX.Tasks.V2.Component.Elements = this.BX.Tasks.V2.Component.Elements || {}),BX.UI.IconSet,BX.UI.IconSet));
//# sourceMappingURL=chip.bundle.js.map
