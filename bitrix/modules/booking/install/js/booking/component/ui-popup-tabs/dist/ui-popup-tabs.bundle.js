/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
(function (exports,main_core,ui_vue3,ui_hint,booking_component_popup,booking_component_button,booking_component_uiTabs,booking_component_uiResourceWizardItem) {
	'use strict';

	// @vue/component
	const PopupTabs = {
	  name: 'UiPopupTabs',
	  components: {
	    Popup: booking_component_popup.Popup,
	    UiButton: booking_component_button.Button,
	    UiTabs: booking_component_uiTabs.UiTabs,
	    UiResourceWizardItem: booking_component_uiResourceWizardItem.UiResourceWizardItem
	  },
	  props: {
	    title: {
	      type: String,
	      required: true
	    },
	    description: {
	      type: String,
	      default: null
	    },
	    hintText: {
	      type: String,
	      default: null
	    },
	    /**
	     * @type {popupTabsOptions}
	     */
	    popupTabsOptions: {
	      type: Array,
	      default: null
	    },
	    buttonSave: {
	      type: String,
	      default: main_core.Loc.getMessagePlural('BOOKING_POPUP_TWO_TABS_SAVE')
	    },
	    buttonCansel: {
	      type: String,
	      default: main_core.Loc.getMessagePlural('BOOKING_POPUP_TWO_TABS_CANSEL')
	    }
	  },
	  emits: ['cancel', 'save'],
	  setup() {
	    return {
	      AirButtonStyle: booking_component_button.AirButtonStyle,
	      ButtonColor: booking_component_button.ButtonColor,
	      ButtonSize: booking_component_button.ButtonSize,
	      ButtonStyle: booking_component_button.ButtonStyle
	    };
	  },
	  data() {
	    return {
	      activeComponent: "UiButton",
	      popupTab: [{
	        title: "Услуги",
	        // active: true,
	        componentName: "UiButton"
	      }, {
	        title: "Ресурсы",
	        // active: false,
	        componentName: "UiResourceWizardItem"
	      }]
	    };
	  },
	  computed: {
	    config() {
	      return ui_vue3.markRaw({
	        className: 'booking-popup-tabs',
	        padding: 14,
	        height: 598,
	        width: 706,
	        closeIcon: true,
	        borderRadius: 'var(--ui-border-radius-3xl)'
	      });
	    }
	  },
	  created() {
	    this.hint = BX.UI.Hint.createInstance({
	      popupParameters: {}
	    });
	  },
	  mounted() {
	    this.hint.init();
	  },
	  methods: {
	    save() {
	      this.$refs.tabsComponent.switchActiveTab('UiButton');
	      // this.$emit('save');
	    },

	    cancel() {
	      this.$refs.tabsComponent.switchActiveTab('UiResourceWizardItem');
	      // this.$emit('cancel');
	    },

	    closePopup() {
	      this.$emit('cancel');
	    },
	    makeTabActive(activeTab) {
	      this.activeComponent = activeTab;
	    }
	  },
	  template: `
		<Popup
			ref="popup"
			id="booking-popup-tabs"
			:config
			@close="closePopup"
		>
		
<!--		<UiTabs-->
<!--			:tabsOptions="popupTab"-->
<!--			:activeComponent="activeComponent"-->
<!--			@update:activeComponent="makeTabActive"-->
<!--		>-->
<!--			<template-->
<!--				#hint-->
<!--			>-->
<!--				<span :data-hint="hintText"></span>-->
<!--			</template>-->

<!--			<template #UiButton>-->
<!--				<UiButton-->
<!--					:text="buttonSave"-->
<!--					:size="ButtonSize.LARGE"-->
<!--					:color="ButtonColor.PRIMARY"-->
<!--					noCaps-->
<!--					useAirDesign-->
<!--				/>-->
<!--			</template>-->

<!--			<template #UiResourceWizardItem>-->
<!--				<UiResourceWizardItem-->
<!--					#UiResourceWizardItem-->
<!--					:title="title"-->
<!--					iconType="registration-on-site"-->
<!--				></UiResourceWizardItem>-->
<!--			</template>-->
<!--		</UiTabs>-->
		
			<div class="booking-popup-tabs__wrapper">
				<div class="booking-popup-tabs__title">
					{{ title }}
				</div>
				<div class="booking-popup-tabs__description">
					{{ description }}
				</div>
				<div class="booking-popup-tabs__nav">
					<div class="booking-popup-tabs__nav_tabs">
						<div 
							v-for="tab of popupTabsOptions"
							:key="tab.componentName"
							:id="tab.componentName"
							class="booking-popup-tabs__nav_tab"
							:class="{'--active': tab.componentName === activeComponent}"
							@click="makeTabActive"
						>
							{{ tab.title }}
						</div>
					</div>
					<span :data-hint="hintText"></span>
				</div>
				<slot :tab="activeComponent"/>
				{{ activeComponent }}
				<div class="booking-popup-tabs__footer">
					<UiButton
						:text="buttonSave"
						:size="ButtonSize.LARGE"
						:color="ButtonColor.PRIMARY"
						@click="save"
						noCaps
						useAirDesign
					/>
					<UiButton
						:text="buttonCansel"
						:style="AirButtonStyle.OUTLINE"
						:size="ButtonSize.LARGE"
						@click="cancel"
						noCaps
						useAirDesign
					/>
				</div>
			</div>
		</Popup>
	`
	};

	exports.PopupTabs = PopupTabs;

}((this.BX.Booking.Component = this.BX.Booking.Component || {}),BX,BX.Vue3,BX,BX.Booking.Component,BX.Booking.Component,BX.Booking.Component,BX.Booking.Component));
//# sourceMappingURL=ui-popup-tabs.bundle.js.map
