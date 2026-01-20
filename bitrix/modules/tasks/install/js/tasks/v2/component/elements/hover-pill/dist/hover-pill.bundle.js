/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports,ui_iconSet_api_vue) {
	'use strict';

	// @vue/component
	const HoverPill = {
	  name: 'HoverPill',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon
	  },
	  props: {
	    withClear: {
	      type: Boolean,
	      default: false
	    },
	    withSettings: {
	      type: Boolean,
	      default: false
	    },
	    textOnly: {
	      type: Boolean,
	      default: false
	    },
	    noOffset: {
	      type: Boolean,
	      default: false
	    },
	    readonly: {
	      type: Boolean,
	      default: false
	    },
	    active: {
	      type: Boolean,
	      default: false
	    },
	    compact: {
	      type: Boolean,
	      default: false
	    }
	  },
	  emits: ['clear', 'settings'],
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  computed: {
	    classes() {
	      return {
	        '--text-only': this.textOnly,
	        '--no-offset': this.noOffset,
	        '--readonly': this.readonly,
	        '--active': this.active,
	        '--compact': this.compact
	      };
	    }
	  },
	  template: `
		<div class="b24-hover-pill" :class="classes" tabindex="0">
			<div class="b24-hover-pill-content">
				<slot/>
			</div>
			<div v-if="withClear && !readonly" class="b24-hover-pill-remover" @click.stop="$emit('clear')">
				<BIcon :name="Outline.CROSS_L"/>
			</div>
			<div v-if="withSettings" class="b24-hover-pill-remover" @click.stop="$emit('settings')">
				<BIcon :name="Outline.FILTER_2_LINES"/>
			</div>
		</div>
	`
	};

	exports.HoverPill = HoverPill;

}((this.BX.Tasks.V2.Component.Elements = this.BX.Tasks.V2.Component.Elements || {}),BX.UI.IconSet));
//# sourceMappingURL=hover-pill.bundle.js.map
