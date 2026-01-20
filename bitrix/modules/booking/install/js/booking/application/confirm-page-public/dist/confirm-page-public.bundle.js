/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
(function (exports,ui_vue3,booking_component_mixin_locMixin,main_core,ui_iconSet_main,main_date,booking_lib_currencyFormat,ui_iconSet_api_vue,main_popup,booking_component_popup,ui_iconSet_actions,booking_component_button,booking_model_bookings) {
	'use strict';

	// @vue/component
	const Mixin = {
	  computed: {
	    isBookingCanceled() {
	      return this.booking.isDeleted === true;
	    }
	  }
	};

	// @vue/component
	const Header = {
	  name: 'Header',
	  components: {
	    Icon: ui_iconSet_api_vue.BIcon
	  },
	  mixins: [Mixin],
	  props: {
	    booking: {
	      type: Object,
	      required: true
	    },
	    company: {
	      type: String,
	      required: true
	    },
	    context: {
	      type: String,
	      required: true
	    }
	  },
	  data() {
	    return {};
	  },
	  computed: {
	    iconColor() {
	      if (this.context === 'delayed.pub.page') {
	        return 'var(--ui-color-palette-gray-60)';
	      }
	      return this.isBookingCanceled ? 'var(--ui-color-palette-red-60)' : 'var(--ui-color-palette-green-60)';
	    },
	    iconSize() {
	      return 45;
	    },
	    iconName() {
	      if (this.context === 'delayed.pub.page') {
	        return ui_iconSet_api_vue.Set.HOURGLASS_SANDGLASS;
	      }
	      return this.isBookingCanceled ? ui_iconSet_api_vue.Set.CROSS_CIRCLE_70 : ui_iconSet_api_vue.Set.CIRCLE_CHECK;
	    },
	    titleClass() {
	      if (this.context === 'delayed.pub.page') {
	        return '--delayed';
	      }
	      return this.isBookingCanceled ? '--canceled' : '';
	    },
	    title() {
	      if (this.context === 'delayed.pub.page') {
	        return this.loc('BOOKING_CONFIRM_PAGE_BOOKING_CONFIRMATION_WAITING');
	      }
	      if (this.context === 'info.pub.page') {
	        return this.loc('BOOKING_CONFIRM_PAGE_BOOKING_INFO');
	      }
	      return this.isBookingCanceled ? this.loc('BOOKING_CONFIRM_PAGE_BOOKING_CANCELED') : this.loc('BOOKING_CONFIRM_PAGE_BOOKING_CONFIRMED');
	    }
	  },
	  template: `
		<div class="confirm-page-header">
			<div class="confirm-page-header-status">
				<div :class="['confirm-page-header-status-icon', titleClass]">
					<Icon :name="iconName" :size="iconSize" :color="iconColor" />
				</div>
				<div :class="['confirm-page-header-status-title', titleClass]">{{ title }}</div>
			</div>
			<div class="confirm-page-header-company">
				<div class="confirm-page-header-company-title">{{ company }}</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const BookingTime = {
	  name: 'BookingTime',
	  mixins: [Mixin],
	  props: {
	    booking: {
	      type: Object,
	      required: true
	    }
	  },
	  data() {
	    return {};
	  },
	  computed: {
	    getBookingDateFrom() {
	      return new Date(this.booking.datePeriod.from.timestamp * 1000);
	    },
	    getBookingDateTo() {
	      return new Date(this.booking.datePeriod.to.timestamp * 1000);
	    },
	    getTimeTo() {
	      const bookingDateTo = new Date(this.booking.datePeriod.to.timestamp);
	      return `${bookingDateTo.getHours()}:${bookingDateTo.getMinutes()}`;
	    },
	    getMonth() {
	      return main_date.DateTimeFormat.format('F', this.getBookingDateFrom);
	    },
	    getDayOfWeek() {
	      const weekDay = this.getBookingDateFrom.getDay();
	      return this.loc(`BOOKING_CONFIRM_PAGE_CALENDAR_WEEK_DAY_${weekDay}`);
	    },
	    timeFromFormatted() {
	      const timeFormat = main_date.DateTimeFormat.getFormat('SHORT_TIME_FORMAT');
	      return main_date.DateTimeFormat.format(timeFormat, this.getBookingDateFrom);
	    },
	    timeFormatted() {
	      const timeFormat = main_date.DateTimeFormat.getFormat('SHORT_TIME_FORMAT');
	      return this.loc('BOOKING_CONFIRM_PAGE_TIME_RANGE', {
	        '#FROM#': main_date.DateTimeFormat.format(timeFormat, this.getBookingDateFrom),
	        '#TO#': main_date.DateTimeFormat.format(timeFormat, this.getBookingDateTo)
	      });
	    },
	    timeDetailFormatted() {
	      const timeFormat = main_date.DateTimeFormat.getFormat('SHORT_DAY_OF_WEEK_MONTH_FORMAT');
	      return main_date.DateTimeFormat.format(timeFormat, this.getBookingDateFrom);
	    },
	    timeZoneFormatted() {
	      const offset = this.getBookingDateFrom.getTimezoneOffset();
	      const hours = Math.floor(Math.abs(offset) / 60);
	      const minutes = Math.abs(offset) % 60;
	      const sign = offset > 0 ? '-' : '+';
	      return `GMT${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}, ${this.booking.datePeriod.from.timezone}`;
	    }
	  },
	  template: `
		<div class="confirm-page-content-border">
			<div class="confirm-page-content-booking-time">
				<div class="confirm-page-content-booking-time-calendar">
					<div class="confirm-page-content-booking-time-calendar-container">
						<div class="confirm-page-content-booking-time-calendar-container-border"></div>
						<div class="confirm-page-content-booking-time-calendar-container-header"></div>
						<div class="confirm-page-content-booking-time-calendar-container-date">{{ getBookingDateFrom.getDate() }}</div>
						<div class="confirm-page-content-booking-time-calendar-container-month">{{ getMonth }}</div>
						<div class="confirm-page-content-booking-time-calendar-container-time">{{ timeFromFormatted }}</div>
					</div>
				</div>
				<div class="confirm-page-content-booking-time-detail">
					<div class="confirm-page-content-booking-time-detail-date">{{ timeDetailFormatted }}</div>
					<div class="confirm-page-content-booking-time-detail-time">{{ timeFormatted }}</div>
					<div class="confirm-page-content-booking-time-detail-timezone">{{ timeZoneFormatted }}</div>
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const SkuItem = {
	  name: 'BookingDetailSkuItem',
	  props: {
	    sku: {
	      type: Object,
	      required: true
	    },
	    withPrice: {
	      type: Boolean,
	      default: false
	    }
	  },
	  computed: {
	    formattedPrice() {
	      return booking_lib_currencyFormat.currencyFormat.format(this.sku.currencyId, this.sku.price);
	    }
	  },
	  template: `
		<div class="booking-confirm-page__booking-detail_sku-container">
			<div class="booking-confirm-page__booking-detail_sku-item">
				<div class="booking-confirm-page__booking-detail_sku-item-summary">
					<div 
						class="booking-confirm-page__booking-detail_sku-item-summary-title"
						:title="sku.name"
					>
						{{ sku.name }}
					</div>
				</div>
				<div v-if="withPrice" class="booking-confirm-page__booking-detail_sku-item-price">
					<span v-html="formattedPrice"></span>
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const SkuList = {
	  name: 'BookingDetailSkuList',
	  components: {
	    SkuItem
	  },
	  props: {
	    skuList: {
	      type: Array,
	      required: true
	    },
	    withPrice: {
	      type: Boolean,
	      default: false
	    }
	  },
	  template: `
		<div
			v-for="sku in skuList"
			:key="sku.id"
			class="booking-confirm-page__booking-detail_sku-list"
		>
			<SkuItem :sku :withPrice/>
		</div>
	`
	};

	// @vue/component
	const TotalPrice = {
	  name: 'BookingDetailTotalPrice',
	  props: {
	    skuList: {
	      type: Array,
	      required: true
	    }
	  },
	  computed: {
	    totalPrice() {
	      return this.skuList.reduce((total, sku) => total + sku.price, 0);
	    },
	    formattedTotalPrice() {
	      var _this$skuList$;
	      const currencyId = (_this$skuList$ = this.skuList[0]) == null ? void 0 : _this$skuList$.currencyId;
	      if (!currencyId) {
	        return String(this.totalPrice);
	      }
	      return booking_lib_currencyFormat.currencyFormat.format(currencyId, this.totalPrice);
	    }
	  },
	  template: `
		<div class="booking-confirm-page__booking-detail_total-price-container">
			<div class="booking-confirm-page__booking-detail_total-price-title">
				{{ loc('BOOKING_CONFIRM_PAGE_TOTAL_PRICE_TITLE') }}
			</div>
			<div class="booking-confirm-page__booking-detail_total-price">
				<span v-html="formattedTotalPrice"></span>
			</div>
		</div>
	`
	};

	// @vue/component
	const ResourceAvatar = {
	  name: 'BookingDetailResourceAvatar',
	  props: {
	    avatarUrl: {
	      type: [String, null],
	      required: true
	    },
	    name: {
	      type: String,
	      required: true
	    }
	  },
	  computed: {
	    getAvatarUrl() {
	      return this.avatarUrl || '/bitrix/js/booking/application/confirm-page-public/images/resource-icon.svg';
	    }
	  },
	  template: `
		<div class="booking-confirm-page__booking-detail_resource-avatar">
			<img
				class="booking-confirm-page__booking-detail_resource-avatar-image"
				:src="getAvatarUrl"
				:alt="name"
				draggable="false"
			/>
		</div>
	`
	};

	// @vue/component
	const ResourceInfo = {
	  name: 'BookingDetailResourceInfo',
	  components: {
	    ResourceAvatar
	  },
	  props: {
	    resource: {
	      type: Object,
	      required: true
	    }
	  },
	  computed: {
	    avatarUrl() {
	      var _this$resource, _this$resource$avatar;
	      return ((_this$resource = this.resource) == null ? void 0 : (_this$resource$avatar = _this$resource.avatar) == null ? void 0 : _this$resource$avatar.url) || null;
	    },
	    name() {
	      return this.resource.name;
	    },
	    typeName() {
	      return this.resource.type.name;
	    }
	  },
	  template: `
		<ResourceAvatar :avatarUrl :name />
		<div class="booking-confirm-page__booking-detail_resource-info">
			<div class="booking-confirm-page__booking-detail_resource-name">
				{{ name }}
			</div>
			<div class="booking-confirm-page__booking-detail_resource-title">
				{{ typeName }}
			</div>
		</div>
	`
	};

	// @vue/component
	const BookingDetail = {
	  name: 'BookingDetail',
	  components: {
	    ResourceInfo,
	    SkuList,
	    TotalPrice
	  },
	  mixins: [Mixin],
	  props: {
	    booking: {
	      type: Object,
	      required: true
	    }
	  },
	  computed: {
	    primaryResource() {
	      return this.booking.resources.find(resource => resource.isPrimary);
	    },
	    skuList() {
	      return this.booking.skus;
	    },
	    isAllSkuPricesZero() {
	      return this.skuList.every(sku => sku.price === 0);
	    }
	  },
	  template: `
		<div class="booking-confirm-page__booking-detail_border">
			<div class="booking-confirm-page__booking-detail_title">
				{{ loc('BOOKING_CONFIRM_PAGE_BOOKING_DETAILS') }}
			</div>
			<div class="booking-confirm-page__booking-detail_line"></div>
			<div class="booking-confirm-page__booking-detail_resource">
				<ResourceInfo :resource="primaryResource" />
			</div>
			<template v-if="skuList.length > 0">
				<div class="booking-confirm-page__booking-detail_line"></div>
				<SkuList :skuList :withPrice="!isAllSkuPricesZero"/>
				<div class="booking-confirm-page__booking-detail_line"></div>
				<TotalPrice v-if="!isAllSkuPricesZero" :skuList />
			</template>
		</div>
	`
	};

	// @vue/component
	const Content = {
	  name: 'Content',
	  components: {
	    BookingTime,
	    BookingDetail
	  },
	  props: {
	    booking: {
	      type: Object,
	      required: true
	    }
	  },
	  data() {
	    return {};
	  },
	  template: `
		<div class="confirm-page-content">
			<BookingTime :booking="booking"/>
			<BookingDetail :booking="booking"/>
		</div>
	`
	};

	// @vue/component
	const ConfirmPopup = {
	  name: 'ConfirmPopup',
	  components: {
	    Popup: booking_component_popup.Popup,
	    UiButton: booking_component_button.Button
	  },
	  props: {
	    booking: {
	      type: Object,
	      required: true
	    },
	    showPopup: {
	      type: Boolean,
	      required: true
	    }
	  },
	  emits: ['bookingConfirmed', 'bookingCanceled', 'closePopup'],
	  data() {
	    return {
	      ButtonSize: booking_component_button.ButtonSize,
	      ButtonColor: booking_component_button.ButtonColor,
	      btnWaiting: false
	    };
	  },
	  computed: {
	    popupId() {
	      return `booking-confirm-page-popup-${this.booking.id}`;
	    },
	    popupConfig() {
	      return {
	        className: 'booking-confirm-page-popup',
	        offsetLeft: 0,
	        offsetTop: 0,
	        overlay: true,
	        borderRadius: '5px',
	        autoHide: false
	      };
	    }
	  },
	  watch: {
	    booking: {
	      handler(booking) {
	        if (booking.isConfirmed === true) {
	          this.btnWaiting = false;
	          this.$emit('closePopup');
	        }
	      },
	      deep: true
	    }
	  },
	  methods: {
	    confirmBookingHandler() {
	      this.btnWaiting = true;
	      this.$emit('bookingConfirmed');
	    },
	    cancelBookingHandler() {
	      this.btnWaiting = true;
	      this.$emit('bookingCanceled');
	    }
	  },
	  template: `
		<Popup
			v-if="showPopup"
			:id="popupId"
			:config="popupConfig"
			@close="closePopup"
		>
			<div class="cancel-booking-popup-content">
				<div class="cancel-booking-popup-content-title">{{ loc('BOOKING_CONFIRM_PAGE_MESSAGEBOX_CONFIRM_TILE') }}</div>
				<div class="cancel-booking-popup-content-text">
					{{ loc('BOOKING_CONFIRM_PAGE_MESSAGEBOX_CONFIRM_TEXT_MSGVER_1') }}
				</div>
				<div class="cancel-booking-popup-content-buttons">
					<UiButton
						:text="loc('BOOKING_CONFIRM_PAGE_MESSAGEBOX_BTN_NOT_CONFIRM')"
						:size="ButtonSize.EXTRA_SMALL"
						:color="ButtonColor.LIGHT_BORDER"
						:buttonClass="'cancel-booking-popup-content-buttons-no'"
						@click="cancelBookingHandler"
					/>
					<UiButton
						:text="loc('BOOKING_CONFIRM_PAGE_MESSAGEBOX_BTN_CONFIRM')"
						:size="ButtonSize.EXTRA_SMALL"
						:buttonClass="'cancel-booking-popup-content-buttons-yes --confirm'"
						:waiting="btnWaiting"
						@click="confirmBookingHandler"
					/>
				</div>
			</div>
		</Popup>
	`
	};

	// @vue/component
	const CancelPopup = {
	  name: 'CancelPopup',
	  components: {
	    Popup: booking_component_popup.Popup,
	    UiButton: booking_component_button.Button
	  },
	  props: {
	    booking: {
	      type: Object,
	      required: true
	    },
	    showPopup: {
	      type: Boolean,
	      required: true
	    }
	  },
	  emits: ['bookingCanceled', 'popupClosed'],
	  data() {
	    return {
	      ButtonSize: booking_component_button.ButtonSize,
	      ButtonColor: booking_component_button.ButtonColor,
	      btnWaiting: false
	    };
	  },
	  computed: {
	    popupId() {
	      return `booking-confirm-page-popup-${this.booking.id}`;
	    },
	    popupConfig() {
	      return {
	        className: 'booking-confirm-page-popup',
	        offsetLeft: 0,
	        offsetTop: 0,
	        overlay: true,
	        borderRadius: '5px'
	      };
	    }
	  },
	  watch: {
	    booking: {
	      handler(booking) {
	        if (booking.isDeleted === true) {
	          this.btnWaiting = false;
	          this.closePopup();
	        }
	      },
	      deep: true
	    }
	  },
	  methods: {
	    cancelBookingHandler() {
	      this.btnWaiting = true;
	      this.$emit('bookingCanceled');
	    },
	    closePopup() {
	      this.$emit('popupClosed');
	    }
	  },
	  template: `
		<Popup
			v-if="showPopup"
			:id="popupId"
			:config="popupConfig"
			@close="closePopup"
		>
			<div class="cancel-booking-popup-content">
				<div class="cancel-booking-popup-content-title">{{ loc('BOOKING_CONFIRM_PAGE_MESSAGEBOX_TILE') }}</div>
				<div class="cancel-booking-popup-content-text">{{ loc('BOOKING_CONFIRM_PAGE_MESSAGEBOX_TEXT') }}</div>
				<div class="cancel-booking-popup-content-buttons">
					<UiButton
						:text="loc('BOOKING_CONFIRM_PAGE_MESSAGEBOX_BTN_NO')"
						:size="ButtonSize.EXTRA_SMALL"
						:color="ButtonColor.LIGHT_BORDER"
						:buttonClass="'cancel-booking-popup-content-buttons-no'"
						@click="closePopup"
					/>
					<UiButton
						:text="loc('BOOKING_CONFIRM_PAGE_MESSAGEBOX_BTN_YES')"
						:size="ButtonSize.EXTRA_SMALL"
						:buttonClass="'cancel-booking-popup-content-buttons-yes'"
						:waiting="btnWaiting"
						@click="cancelBookingHandler"
					/>
				</div>
			</div>
		</Popup>
	`
	};

	// @vue/component
	const Cancel = {
	  name: 'Cancel',
	  components: {
	    Icon: ui_iconSet_api_vue.BIcon,
	    CancelPopup,
	    ConfirmPopup
	  },
	  props: {
	    booking: {
	      type: Object,
	      required: true
	    },
	    context: {
	      type: String,
	      required: true
	    }
	  },
	  emits: ['bookingCanceled', 'bookingConfirmed'],
	  data() {
	    return {
	      showPopup: this.context === 'delayed.pub.page',
	      btnWaiting: false,
	      showLink: true
	    };
	  },
	  computed: {
	    icon() {
	      return ui_iconSet_api_vue.Set.UNDO_1;
	    },
	    iconSize() {
	      return 17;
	    },
	    iconColor() {
	      return '#A8ADB4';
	    },
	    popupId() {
	      return `booking-confirm-page-popup-${this.booking.id}`;
	    },
	    popupConfig() {
	      return {
	        className: 'booking-confirm-page-popup',
	        offsetLeft: 0,
	        offsetTop: 0,
	        overlay: true,
	        borderRadius: '5px'
	      };
	    },
	    showCancelBtn() {
	      return this.context !== 'manager.view.details';
	    },
	    showCancelPopup() {
	      return this.context === 'cancel.pub.page' || this.context === 'info.pub.page';
	    },
	    showConfirmPopup() {
	      return this.context === 'delayed.pub.page';
	    }
	  },
	  watch: {
	    booking: {
	      handler(booking) {
	        if (booking.isDeleted === true) {
	          this.showLink = false;
	          this.btnWaiting = false;
	          this.showPopup = false;
	        }
	        if (booking.isConfirmed === true) {
	          this.btnWaiting = false;
	          this.showPopup = false;
	        }
	      },
	      deep: true
	    }
	  },
	  methods: {
	    cancelBookingHandler() {
	      this.btnWaiting = true;
	      this.$emit('bookingCanceled');
	    },
	    confirmBookingHandler() {
	      this.btnWaiting = true;
	      this.$emit('bookingConfirmed');
	    },
	    cancelBtnHandler() {
	      if (this.booking.isDeleted) {
	        return;
	      }
	      this.showPopup = true;
	    },
	    closePopup() {
	      this.showPopup = false;
	    }
	  },
	  template: `
		<div v-if="showLink" class="cancel-booking">
			<Icon :name="icon" :size="iconSize" :color="iconColor" v-if="showCancelBtn"/>
			<a class="cancel-booking-link" @click="cancelBtnHandler" v-if="showCancelBtn">
				{{ loc('BOOKING_CONFIRM_PAGE_CANCEL_BTN') }}
			</a>
		</div>
		<CancelPopup 
			v-if="showCancelPopup"
			:showPopup="showPopup" 
			:booking="booking"
			@bookingCanceled="cancelBookingHandler"
			@popupClosed="closePopup"
		/>
		<ConfirmPopup
			v-if="showConfirmPopup"
			:showPopup="showPopup"
			:booking="booking"
			@bookingCanceled="cancelBookingHandler"
			@bookingConfirmed="confirmBookingHandler"
			@closePopup="closePopup"
		/>
	`
	};

	// @vue/component
	const AddToCalendar = {
	  name: 'AddToCalendar',
	  components: {
	    // eslint-disable-next-line vue/no-reserved-component-names
	    Button: booking_component_button.Button
	  },
	  props: {
	    /**
	     * @type {BookingModel}
	     */
	    booking: {
	      type: Object,
	      required: true
	    },
	    icsDownloadRequested: {
	      type: Boolean,
	      required: true
	    }
	  },
	  emits: ['downloadIcs'],
	  setup() {
	    return {
	      ButtonSize: booking_component_button.ButtonSize,
	      ButtonColor: booking_component_button.ButtonColor
	    };
	  },
	  template: `
		<div v-if="!booking.isDeleted" class="add-to-calendar__container">
			<Button
				:text="loc('BOOKING_CONFIRM_PAGE_ADD_TO_CALENDAR_BTN')"
				:buttonClass="'add-to-calendar__btn'"
				:size="ButtonSize.SMALL"
				:color="ButtonColor.LIGHT_BORDER"
				:waiting="icsDownloadRequested"
				@click="$emit('downloadIcs')"
			/>
		</div>
	`
	};

	// @vue/component
	const Footer = {
	  name: 'Footer',
	  components: {
	    Cancel,
	    AddToCalendar
	  },
	  props: {
	    booking: {
	      type: Object,
	      required: true
	    },
	    context: {
	      type: String,
	      required: true
	    },
	    icsDownloadRequested: {
	      type: Boolean,
	      required: true
	    }
	  },
	  emits: ['bookingCanceled', 'bookingConfirmed', 'downloadIcs'],
	  data() {
	    return {};
	  },
	  template: `
		<div class="confirm-page__footer">
			<Cancel
				:booking="booking"
				:context="context"
				@bookingCanceled="$emit('bookingCanceled')"
				@bookingConfirmed="$emit('bookingConfirmed')"
			/>
			<AddToCalendar
				:booking="booking"
				:icsDownloadRequested="icsDownloadRequested"
				@downloadIcs="$emit('downloadIcs')"
			/>
		</div>
	`
	};

	// @vue/component
	const App = {
	  name: 'ConfirmPageApp',
	  components: {
	    Header,
	    Content,
	    Footer
	  },
	  props: {
	    booking: {
	      type: Object,
	      required: true
	    },
	    hash: {
	      type: String,
	      required: true
	    },
	    company: {
	      type: String,
	      required: true
	    },
	    context: {
	      type: String,
	      required: true
	    }
	  },
	  data() {
	    return {
	      confirmedBooking: this.booking,
	      confirmedContext: this.context,
	      icsDownloadRequested: false
	    };
	  },
	  methods: {
	    async bookingCancelHandler() {
	      try {
	        await main_core.ajax.runComponentAction('bitrix:booking.pub.confirm', 'cancel', {
	          mode: 'class',
	          data: {
	            hash: this.hash
	          }
	        });
	        this.confirmedBooking.isDeleted = true;
	        if (this.confirmedContext === 'delayed.pub.page' || this.confirmedContext === 'info.pub.page') {
	          this.confirmedContext = 'cancel.pub.page';
	        }
	      } catch (error) {
	        console.error('Confirm page: cancel error', error);
	      }
	    },
	    async bookingConfirmHandler() {
	      try {
	        await main_core.ajax.runComponentAction('bitrix:booking.pub.confirm', 'confirm', {
	          mode: 'class',
	          data: {
	            hash: this.hash
	          }
	        });
	        this.confirmedBooking.isConfirmed = true;
	        if (this.confirmedContext === 'delayed.pub.page') {
	          this.confirmedBooking.confirmedByDelayed = true;
	          this.confirmedContext = 'cancel.pub.page';
	        }
	      } catch (error) {
	        console.error('Confirm page: confirm error', error);
	      }
	    },
	    async downloadIcsHandler() {
	      try {
	        this.icsDownloadRequested = true;
	        const {
	          data
	        } = await main_core.ajax.runComponentAction('bitrix:booking.pub.confirm', 'getIcsContent', {
	          mode: 'class',
	          data: {
	            hash: this.hash
	          }
	        });
	        const fileContent = data == null ? void 0 : data.ics;
	        if (!fileContent) {
	          console.error('Receive empty ics file');
	          return;
	        }
	        const fileName = 'booking.ics';
	        const link = document.createElement('a');
	        link.href = `data:text/calendar,${encodeURI(fileContent)}`;
	        link.download = fileName;
	        link.click();
	      } catch (error) {
	        console.error('Confirm page: can not receive ics file', error);
	      } finally {
	        this.icsDownloadRequested = false;
	      }
	    }
	  },
	  template: `
		<div class="confirm-page-container">
			<div class="confirm-page-body">
				<Header 
					:booking="confirmedBooking"
					:company="company"
					:context="confirmedContext"
				/>
				<Content :booking="confirmedBooking"/>
				<Footer 
					:booking="confirmedBooking"
					:context="confirmedContext"
					:icsDownloadRequested="icsDownloadRequested"
					@bookingCanceled="bookingCancelHandler"
					@bookingConfirmed="bookingConfirmHandler"
					@downloadIcs="downloadIcsHandler"
				/>
			</div>
		</div>
	`
	};

	class ConfirmPagePublic {
	  constructor(params) {
	    const app = ui_vue3.BitrixVue.createApp(App, params);
	    app.mixin(booking_component_mixin_locMixin.locMixin);
	    app.mount(params.container);
	  }
	}

	exports.ConfirmPagePublic = ConfirmPagePublic;

}((this.BX.Booking.Application = this.BX.Booking.Application || {}),BX.Vue3,BX.Booking.Component.Mixin,BX,BX,BX.Main,BX.Booking.Lib,BX.UI.IconSet,BX.Main,BX.Booking.Component,BX,BX.Booking.Component,BX.Booking.Model));
//# sourceMappingURL=confirm-page-public.bundle.js.map
