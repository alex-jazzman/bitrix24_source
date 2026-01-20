/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
(function (exports) {
	'use strict';

	// @vue/component
	const UiTabs = {
	  name: 'UiTabs',
	  props: {
	    /**
	     * @type {tabsOptions}
	     */
	    tabsOptions: {
	      type: Array,
	      default: null
	    },
	    activeComponent: {
	      type: String,
	      required: true
	    }
	  },
	  emits: ['update:activeComponent'],
	  methods: {
	    switchActiveTab(component) {
	      this.$emit('update:activeComponent', component);
	    }
	  },
	  template: `
		<div class="booking-tabs__wrapper">
			<div class="booking-tabs__nav">
				<div class="booking-tabs__nav_tabs">
					<div 
						v-for="tab of tabsOptions"
						:key="tab.componentName"
						:id="tab.componentName"
						class="booking-tabs__nav_tab"
						:class="{'--active': tab.componentName === activeComponent}"
						@click="switchActiveTab(tab.componentName)"
					>
						{{ tab.title }}
					</div>
				</div>
				<slot name="hint" />
			</div>
			<slot :name="activeComponent" />
		</div>
	`
	};

	exports.UiTabs = UiTabs;

}((this.BX.Booking.Component = this.BX.Booking.Component || {})));
//# sourceMappingURL=ui-tabs.bundle.js.map
