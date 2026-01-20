/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
(function (exports,ui_iconSet_api_vue,booking_const,booking_component_helpDeskLoc) {
	'use strict';

	// @vue/component
	const UiResourceWizardItem = {
	  name: 'UiResourceWizardItem',
	  components: {
	    Icon: ui_iconSet_api_vue.BIcon,
	    EmptyRichLoc: booking_component_helpDeskLoc.EmptyRichLoc,
	    HelpDeskLoc: booking_component_helpDeskLoc.HelpDeskLoc
	  },
	  props: {
	    title: {
	      type: String,
	      required: true
	    },
	    iconType: {
	      type: String,
	      required: true
	    },
	    description: {
	      type: String,
	      default: null
	    },
	    helpDeskType: {
	      type: String,
	      default: null
	    }
	  },
	  computed: {
	    code() {
	      return booking_const.HelpDesk[`Resource${this.helpDeskType}`].code;
	    },
	    anchorCode() {
	      return booking_const.HelpDesk[`Resource${this.helpDeskType}`].anchorCode;
	    }
	  },
	  template: `
		<div class="booking-resource-wizard-item">
			<div class="booking-resource-wizard-item__row-title">
				<Icon
					:name="iconType"
					:color="'var(--ui-color-primary)'"
					:size="24"
				/>
				<div class="booking-resource-wizard-item__title">
					{{ title }}
				</div>
			</div>
			<div
				v-if="description"
				class="booking-resource-wizard-item__row-description"
			>
				<HelpDeskLoc
					v-if="helpDeskType"
					:message="description"
					:code="code"
					:anchor="anchorCode"
					:rules="['br']"
					class="booking-resource-wizard-item__help-desk"
				/>
				<div
					v-else
					class="booking-resource-wizard-item__description"
				>
					<EmptyRichLoc
						:message="description"
						:rules="['br']"
					/>
				</div>
			</div>
			<slot />
		</div>
	`
	};

	exports.UiResourceWizardItem = UiResourceWizardItem;

}((this.BX.Booking.Component = this.BX.Booking.Component || {}),BX.UI.IconSet,BX.Booking.Const,BX.Booking.Component));
//# sourceMappingURL=ui-resource-wizard-item.bundle.js.map
