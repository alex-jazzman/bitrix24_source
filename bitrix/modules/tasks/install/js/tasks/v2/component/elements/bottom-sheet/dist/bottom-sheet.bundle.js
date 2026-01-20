/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports,main_core,ui_vue3_components_popup) {
	'use strict';

	// @vue/component
	const BottomSheet = {
	  components: {
	    Popup: ui_vue3_components_popup.Popup
	  },
	  props: {
	    sheetBindProps: {
	      /** @type SheetBindProps */
	      type: Object,
	      required: true
	    },
	    isExpanded: {
	      type: Boolean,
	      default: false
	    },
	    padding: {
	      type: Number,
	      default: 24
	    },
	    popupPadding: {
	      type: Number,
	      default: 24
	    },
	    uniqueKey: {
	      type: String,
	      default: () => main_core.Text.getRandom()
	    },
	    customClass: {
	      type: String,
	      default: ''
	    }
	  },
	  emits: ['close'],
	  computed: {
	    popupOptions() {
	      const baseClass = 'b24-bottom-sheet';
	      const expandedClass = this.isExpanded ? '--expanded' : '';
	      const customClass = this.customClass || '';
	      const className = [baseClass, expandedClass, customClass].filter(name => name !== '').join(' ');
	      return {
	        id: `b24-bottom-sheet-${this.uniqueKey || 'default'}`,
	        bindElement: this.sheetBindProps.getBindElement(),
	        targetContainer: this.sheetBindProps.getTargetContainer(),
	        className,
	        borderRadius: '18px 18px 0 0',
	        padding: this.popupPadding,
	        animation: {
	          showClassName: '--show',
	          closeClassName: '--close',
	          closeAnimationType: 'animation'
	        },
	        autoHide: false
	      };
	    }
	  },
	  watch: {
	    isExpanded(isExpanded) {
	      var _this$$refs$popup;
	      const popup = (_this$$refs$popup = this.$refs.popup) == null ? void 0 : _this$$refs$popup.getPopupInstance();
	      main_core.Dom.toggleClass(popup == null ? void 0 : popup.getPopupContainer(), '--expanded', isExpanded);
	    }
	  },
	  created() {
	    this.unfreezeDebounced = main_core.Runtime.debounce(this.unfreeze, 500, this);
	  },
	  mounted() {
	    main_core.Event.EventEmitter.subscribe('BX.UI.Viewer.Controller:onBeforeShow', this.freeze);
	    main_core.Event.EventEmitter.subscribe('BX.UI.Viewer.Controller:onClose', this.unfreezeDebounced);
	  },
	  beforeUnmount() {
	    main_core.Event.EventEmitter.unsubscribe('BX.UI.Viewer.Controller:onBeforeShow', this.freeze);
	    main_core.Event.EventEmitter.unsubscribe('BX.UI.Viewer.Controller:onClose', this.unfreezeDebounced);
	  },
	  methods: {
	    freeze() {
	      var _this$$refs$popup2;
	      (_this$$refs$popup2 = this.$refs.popup) == null ? void 0 : _this$$refs$popup2.freeze();
	    },
	    unfreeze() {
	      var _this$$refs$popup3;
	      (_this$$refs$popup3 = this.$refs.popup) == null ? void 0 : _this$$refs$popup3.unfreeze();
	    }
	  },
	  template: `
		<Popup ref="popup" :options="popupOptions" @close="$emit('close')">
			<div class="b24-bottom-sheet-content" :style="{ '--padding': padding + 'px' }">
				<slot/>
			</div>
		</Popup>
	`
	};

	exports.BottomSheet = BottomSheet;

}((this.BX.Tasks.V2.Component.Elements = this.BX.Tasks.V2.Component.Elements || {}),BX,BX.UI.Vue3.Components));
//# sourceMappingURL=bottom-sheet.bundle.js.map
