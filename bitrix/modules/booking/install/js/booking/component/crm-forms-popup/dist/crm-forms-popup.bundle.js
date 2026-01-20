/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
(function (exports,booking_component_helpDeskLoc,ui_vue3,booking_const,booking_component_button) {
	'use strict';

	// @vue/component
	const CrmFormItemSkeleton = {
	  name: 'CrmFormItemSkeleton',
	  template: `
		<div class="booking--booking--crm-forms-popup--item-skeleton">
			<div class="booking--booking--crm-forms-popup--item-skeleton__circle"></div>
			<div class="booking--booking--crm-forms-popup--item-skeleton__line"></div>
			<div class="booking--booking--crm-forms-popup--item-skeleton__space"></div>
			<div class="booking--booking--crm-forms-popup--item-skeleton__line --thin"></div>
			<div class="booking--booking--crm-forms-popup--item-skeleton__circle"></div>
		</div>
	`
	};

	// @vue/component
	const CrmFormListEmpty = {
	  name: 'CrmFormListEmpty',
	  components: {
	    CrmFormItemSkeleton
	  },
	  template: `
		<CrmFormItemSkeleton v-for="i in 4" :key="i"/>
		<div class="booking--booking--crm-forms-popup--list__placeholder-bg"></div>
		<div class="booking--booking--crm-forms-popup--list__placeholder">
			<span>{{ loc('BOOKING_OPEN_CRM_FORMS_POPUP_FORMS_LIST_PLACEHOLDER') }}</span>
		</div>
	`
	};

	function CrmFormsListItemNameLink(props, {
	  slots
	}) {
	  if (props.canEdit && props.editUrl) {
	    return ui_vue3.h('a', {
	      href: props.editUrl,
	      target: '_blank'
	    }, slots.default());
	  }
	  return slots.default();
	}
	const props = ['canEdit', 'editUrl'];
	CrmFormsListItemNameLink.props = props;

	// eslint-disable-next-line no-unused-vars

	// @vue/component
	const CrmFormsListItem = {
	  name: 'CrmFormsListItem',
	  components: {
	    CrmFormsListItemNameLink
	  },
	  props: {
	    /**
	     * @type {FormsMenuItem}
	     */
	    item: {
	      type: Object,
	      required: true
	    },
	    canEdit: Boolean
	  },
	  setup() {
	    return {
	      AirButtonStyle: booking_component_button.AirButtonStyle
	    };
	  },
	  data() {
	    return {
	      copedPopupTimeoutId: null
	    };
	  },
	  methods: {
	    copyLink() {
	      if (!BX.clipboard.isCopySupported()) {
	        return;
	      }
	      BX.clipboard.copy(this.item.publicUrl);
	      this.showCopedPopup();
	    },
	    showCopedPopup() {
	      var _this$popup;
	      (_this$popup = this.popup) == null ? void 0 : _this$popup.destroy();
	      this.popup = new BX.PopupWindow(`booking_open_crm_forms_popup_item_${this.item.id}_clipboard_copy`, this.$refs.copy, {
	        content: this.loc('BOOKING_OPEN_CRM_FORMS_POPUP_FORMS_LIST_ITEM_LINK_COPED'),
	        darkMode: true,
	        autoHide: true,
	        zIndex: 1000,
	        angle: true,
	        offsetLeft: 20,
	        bindOptions: {
	          position: 'top'
	        }
	      });
	      this.popup.show();
	      this.copedPopupTimeoutId = setTimeout(() => {
	        var _this$popup2;
	        this.popup.close();
	        (_this$popup2 = this.popup) == null ? void 0 : _this$popup2.destroy();
	      }, 1200);
	    }
	  },
	  template: `
		<div class="booking--booking--crm-forms-popup--item">
			<div class="ui-icon-set --o-form booking--booking--crm-forms-popup--item__icon"></div>
			<div
				class="booking--booking--crm-forms-popup--item__name"
				:title="item.name"
			>
				<CrmFormsListItemNameLink :canEdit :editUrl="item.editUrl">
					<span>{{ item.name }}</span>
				</CrmFormsListItemNameLink>
			</div>
			<div
				ref="copy"
				:class="['booking--booking--crm-forms-popup--item__copy-btn', AirButtonStyle.OUTLINE_NO_ACCENT]"
				role="button"
				tabindex="0"
				@click="copyLink"
			>
				{{ loc('BOOKING_OPEN_CRM_FORMS_POPUP_FORMS_LIST_ITEM_COPY_LINK_BUTTON_LABEL') }}
				<div class="ui-icon-set --o-copy booking--booking--crm-forms-popup--item__copy-btn-icon"></div>
			</div>
		</div>
	`
	};

	// @vue/component
	const CrmFormsList = {
	  name: 'CrmFormsList',
	  components: {
	    CrmFormListEmpty,
	    CrmFormsListItem
	  },
	  computed: {
	    canEdit() {
	      return this.$store.state[booking_const.Model.FormsMenu].canEdit;
	    },
	    formList() {
	      return this.$store.getters[`${booking_const.Model.FormsMenu}/formList`];
	    }
	  },
	  template: `
		<div class="booking--booking--crm-forms-popup--list__container">
			<div class="booking--booking--crm-forms-popup--list-items">
				<template v-if="formList.length === 0">
					<CrmFormListEmpty />
				</template>
				<template v-else>
					<CrmFormsListItem
						v-for="item in formList"
						:key="item.id"
						:item="item"
						:canEdit
					/>
				</template>
			</div>
		</div>
	`
	};

	// @vue/component
	const CrmFormsToolbar = {
	  name: 'CrmFormsToolbar',
	  template: `
		<div class="booking--booking--crm-forms-popup-sort">
			<span>{{ loc('BOOKING_OPEN_CRM_FORMS_POPUP_SORT_LATEST_CREATED_LABEL') }}</span>
			<div class="ui-icon-set --o-change-order-2 booking--booking--crm-forms-popup--sort-icon"></div>
		</div>
	`
	};

	// @vue/component
	const AddCrmFormButton = {
	  name: 'AddCrmFormButton',
	  components: {
	    UiButton: booking_component_button.Button
	  },
	  setup() {
	    return {
	      ButtonColor: booking_component_button.ButtonColor,
	      ButtonSize: booking_component_button.ButtonSize,
	      ButtonStyle: booking_component_button.ButtonStyle
	    };
	  },
	  computed: {
	    createFormLink() {
	      return this.$store.state[booking_const.Model.FormsMenu].createFormLink;
	    },
	    addBtnLabel() {
	      return this.loc('BOOKING_OPEN_CRM_FORMS_POPUP_ADD_FORM_BUTTON_LABEL').replace('[plus]', '+');
	    }
	  },
	  template: `
		<a :href="createFormLink" target="_blank">
			<UiButton
				:text="addBtnLabel"
				:color="ButtonColor.LIGHT_BORDER"
				:size="ButtonSize.SMALL"
				:buttonClass="['--air', ButtonStyle.NO_CAPS]"
			/>
		</a>
	`
	};

	// @vue/component
	const AllCrmFormsButton = {
	  name: 'AllCrmFormsButton',
	  components: {
	    UiButton: booking_component_button.Button
	  },
	  setup() {
	    return {
	      AirButtonStyle: booking_component_button.AirButtonStyle,
	      ButtonColor: booking_component_button.ButtonColor,
	      ButtonSize: booking_component_button.ButtonSize,
	      ButtonStyle: booking_component_button.ButtonStyle
	    };
	  },
	  template: `
		<a href="/crm/webform/?IS_BOOKING_FORM=Y&apply_filter=Y" target="_blank">
			<UiButton
				:text="loc('BOOKING_OPEN_CRM_FORMS_POPUP_ALL_FORMS_BUTTON_LABEL')"
				:color="ButtonColor.LIGHT_BORDER"
				:size="ButtonSize.SMALL"
				:buttonClass="['--air', AirButtonStyle.OUTLINE_NO_ACCENT, ButtonStyle.NO_CAPS]"
			/>
		</a>
	`
	};

	// @vue/component
	const CrmFormsContent = {
	  name: 'CrmFormsContent',
	  components: {
	    AddCrmFormButton,
	    AllCrmFormsButton,
	    CrmFormsList,
	    CrmFormsToolbar,
	    HelpDeskLoc: booking_component_helpDeskLoc.HelpDeskLoc
	  },
	  // eslint-disable-next-line flowtype/require-return-type
	  setup() {
	    const helpDesk = booking_const.HelpDesk.CrmFormsPopup;
	    return {
	      helpDesk
	    };
	  },
	  template: `
		<div class="booking--booking--crm-forms-popup__wrapper">
			<div class="booking--booking--crm-forms-popup__header">
				<div class="booking--booking--crm-forms-popup__header-title-row">
					<slot name="icon"/>
					<span class="booking--booking--crm-forms-popup__header-title">
					{{ loc('BOOKING_OPEN_CRM_FORMS_POPUP_TITLE') }}
				</span>
				</div>
				<div class="booking--booking--crm-forms-popup__header-description">
					<HelpDeskLoc
						:message="loc('BOOKING_OPEN_CRM_FORMS_POPUP_DESCRIPTION')"
						:code="helpDesk.code"
						:anchor="helpDesk.anchorCode"
					/>
				</div>
			</div>
			<div class="booking--booking--crm-forms-popup__toolbar">
				<CrmFormsToolbar/>
			</div>
			<div class="booking--booking-crm-forms-popup__list-wrapper">
				<CrmFormsList/>
			</div>
			<div class="booking--booking-crm-forms-popup__footer">
				<div class="booking--booking--crm-forms-popup--footer-buttons-bar">
					<AllCrmFormsButton/>
					<AddCrmFormButton/>
				</div>
			</div>
		</div>
	`
	};

	exports.CrmFormsContent = CrmFormsContent;

}((this.BX.Booking.Component = this.BX.Booking.Component || {}),BX.Booking.Component,BX.Vue3,BX.Booking.Const,BX.Booking.Component));
//# sourceMappingURL=crm-forms-popup.bundle.js.map
