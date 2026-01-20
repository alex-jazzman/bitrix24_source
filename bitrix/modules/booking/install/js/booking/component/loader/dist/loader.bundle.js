/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
(function (exports,main_core) {
	'use strict';

	const LoaderType = Object.freeze({
	  DEFAULT: 'DEFAULT',
	  BULLET: 'BULLET'
	});

	class LoaderFactory {
	  static async createByType(type, options = {}) {
	    switch (type) {
	      case LoaderType.DEFAULT:
	        {
	          const {
	            Loader
	          } = await main_core.Runtime.loadExtension('main.loader');
	          return new Loader(options);
	        }
	      case LoaderType.BULLET:
	        {
	          const {
	            Loader: UiLoader
	          } = await main_core.Runtime.loadExtension('ui.loader');
	          return new UiLoader(options);
	        }
	      default:
	        {
	          console.error(`Booking.LoaderFactory: Not loader by type: "${type}"`);
	          return null;
	        }
	    }
	  }
	}

	const Loader = {
	  name: 'BookingLoader',
	  props: {
	    options: {
	      type: Object,
	      default: null
	    }
	  },
	  methods: {
	    getOptions() {
	      return {
	        ...this.getDefaultOptions(),
	        ...this.options
	      };
	    },
	    getDefaultOptions() {
	      return {
	        type: LoaderType.BULLET,
	        target: this.$refs.loader,
	        size: 'xs'
	      };
	    }
	  },
	  async mounted() {
	    var _this$loader, _this$loader2;
	    this.loader = await LoaderFactory.createByType(this.getOptions().type, this.getOptions());
	    (_this$loader = this.loader) == null ? void 0 : _this$loader.render == null ? void 0 : _this$loader.render();
	    (_this$loader2 = this.loader) == null ? void 0 : _this$loader2.show();
	  },
	  beforeUnmount() {
	    var _this$loader3;
	    (_this$loader3 = this.loader) == null ? void 0 : _this$loader3.hide == null ? void 0 : _this$loader3.hide();
	    this.loader = null;
	  },
	  template: `
		<div class="booking-loader__container" ref="loader"></div>
	`
	};

	exports.Loader = Loader;
	exports.LoaderType = LoaderType;

}((this.BX.Booking.Component = this.BX.Booking.Component || {}),BX));
//# sourceMappingURL=loader.bundle.js.map
