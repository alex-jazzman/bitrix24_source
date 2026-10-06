/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
(function (exports, main_core, booking_component_popup, ui_vue3_vuex, booking_const, booking_component_notePopup, booking_lib_currencyFormat, ui_vue3_directives_hint, ui_iconSet_api_vue, ui_iconSet_main, ui_iconSet_crm, booking_lib_limit, main_popup, booking_component_clientPopup, booking_core) {
	'use strict';

	// @vue/component
	const DisabledPopup = {
		name: 'BookingCardDisabledPopup',
		components: {
			Popup: booking_component_popup.Popup
		},
		props: {
			popupId: {
				type: String,
				required: true
			},
			bindElement: {
				type: Function,
				required: true
			}
		},
		emits: ['close'],
		computed: {
			config() {
				return {
					className: 'booking-booking-disabled-popup',
					bindElement: this.bindElement(),
					width: this.bindElement().offsetWidth,
					offsetTop: -10,
					bindOptions: {
						forceBindPosition: true,
						position: 'top'
					},
					autoHide: true,
					darkMode: true
				};
			}
		},
		mounted() {
			this.adjustPosition();
			setTimeout(() => this.closePopup(), 3000);
			main_core.Event.bind(document, 'scroll', this.adjustPosition, true);
		},
		beforeUnmount() {
			main_core.Event.unbind(document, 'scroll', this.adjustPosition, true);
		},
		methods: {
			adjustPosition() {
				this.$refs.popup.adjustPosition();
			},
			closePopup() {
				this.$emit('close');
			}
		},
		template: `
		<Popup
			:id="popupId"
			:config="config"
			ref="popup"
			@close="closePopup"
		>
			<div class="booking-booking-card__disabled-popup_content">
				{{ loc('BOOKING_BOOKING_YOU_CANNOT_EDIT_THIS_BOOKING') }}
			</div>
		</Popup>
	`
	};

	// @vue/component
	const Title = {
		name: 'BookingCardTitle',
		inject: {
			/** @type{ AbstractCardDataService } */
			cardDataService: {}
		},
		computed: {
			dataAttributes() {
				return this.cardDataService.buildDataAttributes('booking-booking-card-title');
			}
		},
		template: `
		<div
			class="booking-booking-card__title"
			:title="this.cardDataService.title"
			v-bind="dataAttributes"
		>
			{{ this.cardDataService.title }}
		</div>
	`
	};

	// @vue/component
	const Note = {
		name: 'BookingCardNote',
		components: {
			NotePopup: booking_component_notePopup.NotePopup
		},
		inject: {
			/** @type{ AbstractCardDataService } */
			cardDataService: {},
			autoHideContext: {
				default: null
			}
		},
		props: {
			bindElement: {
				type: Function,
				required: true
			},
			note: {
				type: String,
				default: ''
			}
		},
		data() {
			return {
				isPopupShown: false,
				isEditMode: false
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				isFeatureEnabled: `${booking_const.Model.Interface}/isFeatureEnabled`
			}),
			itemId() {
				return this.cardDataService.itemId;
			},
			hasNote() {
				return Boolean(this.noteText);
			},
			noteText() {
				return this.cardDataService.note;
			},
			dataAttributes() {
				return this.cardDataService.buildDataAttributes('booking-booking-card-note-button');
			}
		},
		created() {
			this.unfreezeAutoHide = null;
		},
		beforeUnmount() {
			this.hidePopup();
		},
		methods: {
			onNoteMouseEnter() {
				this.showNoteTimeout = setTimeout(this.showViewPopup, 100);
			},
			onNoteMouseLeave() {
				clearTimeout(this.showNoteTimeout);
				this.closeViewPopup();
			},
			showViewPopup() {
				if (this.isPopupShown || !this.hasNote) {
					return;
				}
				this.isEditMode = false;
				this.showPopup();
			},
			closeViewPopup() {
				if (this.isEditMode) {
					return;
				}
				this.hidePopup();
			},
			showEditPopup() {
				this.isEditMode = true;
				this.showPopup();
			},
			closeEditPopup() {
				if (!this.isEditMode) {
					return;
				}
				this.hidePopup();
			},
			async handleSave(payload) {
				await this.cardDataService.saveNote(payload.note);
			},
			showPopup() {
				if (!this.isPopupShown) {
					this.freezeParentAutoHide();
				}
				this.isPopupShown = true;
			},
			hidePopup() {
				if (!this.isPopupShown) {
					return;
				}
				this.isPopupShown = false;
				this.unfreezeParentAutoHide();
			},
			freezeParentAutoHide() {
				if (this.unfreezeAutoHide) {
					return;
				}
				this.unfreezeAutoHide = this.autoHideContext?.freeze() ?? null;
			},
			unfreezeParentAutoHide() {
				this.unfreezeAutoHide?.();
				this.unfreezeAutoHide = null;
			}
		},
		template: `
		<div 
			class="booking-booking-card__note"
			@click="showViewPopup"
			@mouseenter="onNoteMouseEnter"
			@mouseleave="onNoteMouseLeave"
		>
			<div
				class="booking-booking-card__note-button"
				:class="{'--has-note': hasNote}"
				v-bind="dataAttributes"
				@click="showEditPopup"
			>
				<div class="ui-icon-set --note"></div>
			</div>
		</div>
		<NotePopup
			v-if="isPopupShown"
			:isEditMode="isEditMode && isFeatureEnabled"
			:id="itemId"
			:dataId="itemId"
			:dataElementPrefix="cardDataService.dataKindAttribute"
			:text="noteText"
			:bindElement
			@close="closeEditPopup"
			@save="handleSave"
		/>
	`
	};

	// @vue/component
	const Profit = {
		name: 'BookingCardProfit',
		inject: {
			/** @type{ AbstractCardDataService } */
			cardDataService: {}
		},
		computed: {
			dataAttributes() {
				return this.cardDataService.buildDataAttributes('booking-booking-card-profit');
			},
			skus() {
				return this.cardDataService.skus;
			},
			totalPrice() {
				return this.skus.reduce((acc, sku) => {
					const priceNum = Number(sku?.price);
					return acc + (Number.isFinite(priceNum) ? priceNum : 0);
				}, 0);
			},
			hasSkus() {
				return this.skus.length > 0;
			},
			currencyId() {
				return this.hasSkus ? this.skus[0]?.currencyId : '';
			},
			formattedTotalPrice() {
				return this.currencyId ? booking_lib_currencyFormat.currencyFormat.format(this.currencyId, this.totalPrice) : '';
			}
		},
		template: `
		<div
			v-if="hasSkus"
			class="booking-booking-card__profit"
			:data-profit="totalPrice"
			v-bind="dataAttributes"
			v-html="formattedTotalPrice"
		></div>
	`
	};

	// @vue/component
	const Communication = {
		name: 'BookingCardCommunication',
		directives: {
			hint: ui_vue3_directives_hint.hint
		},
		components: {
			Icon: ui_iconSet_api_vue.BIcon
		},
		setup() {
			return {
				IconSet: ui_iconSet_api_vue.Set
			};
		},
		computed: {
			soonHint() {
				return {
					text: this.loc('BOOKING_BOOKING_SOON_HINT'),
					popupOptions: {
						targetContainer: document.body
					}
				};
			}
		},
		template: `
		<div ref="hint" v-hint="soonHint" class="booking-booking-card__communication">
			<Icon :name="IconSet.TELEPHONY_HANDSET_1"/>
			<Icon :name="IconSet.CHATS_2"/>
		</div>
	`
	};

	// @vue/component
	const CrmButton = {
		name: 'CrmButton',
		components: {
			Icon: ui_iconSet_api_vue.BIcon
		},
		inject: {
			/** @type{ AbstractCardDataService } */
			cardDataService: {}
		},
		setup() {
			return {
				IconSet: ui_iconSet_api_vue.Set
			};
		},
		computed: {
			isFeatureEnabled() {
				return this.$store.getters[`${booking_const.Model.Interface}/isFeatureEnabled`];
			},
			dataAttributes() {
				return this.cardDataService.buildDataAttributes('booking-booking-card-crm-button');
			},
			dealHelper() {
				return this.cardDataService.dealHelper;
			},
			hasDeal() {
				return this.dealHelper.hasDeal?.() ?? false;
			}
		},
		methods: {
			onClick() {
				if (!this.isFeatureEnabled) {
					void booking_lib_limit.limit.show();
					return;
				}
				if (this.hasDeal) {
					this.dealHelper.openDeal?.();
				} else {
					this.dealHelper.createDeal?.();
				}
			}
		},
		template: `
		<Icon
			:name="IconSet.CRM_LETTERS"
			class="booking-booking-card__crm-button"
			:class="{'--no-deal': !hasDeal}"
			v-bind="dataAttributes"
			@click="onClick"
		/>
	`
	};

	// @vue/component
	const Source = {
		name: 'BookingCardSource',
		components: {
			Icon: ui_iconSet_api_vue.BIcon
		},
		inject: {
			/** @type{ AbstractCardDataService } */
			cardDataService: {}
		},
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline,
				BookingSource: booking_const.BookingSource
			};
		},
		computed: {
			source() {
				return this.cardDataService.item?.source ?? '';
			},
			isVisible() {
				return this.source === booking_const.BookingSource.Yandex || this.source === booking_const.BookingSource.Crm;
			}
		},
		template: `
		<div 
			v-if="isVisible" 
			class="booking-booking-card__source"
			:class="'--' + source"
		>
			<Icon
				v-if="source === BookingSource.Crm"
				:name="Outline.CRM_FORM"
				:size="14"
				:color="'var(--ui-color-bg-content-primary)'"
			/>
		</div>
	`
	};

	// @vue/component
	const AddClient = {
		name: 'BookingCardAddClient',
		components: {
			ClientPopup: booking_component_clientPopup.ClientPopup
		},
		inject: {
			autoHideContext: {
				default: null
			}
		},
		props: {
			expired: {
				type: Boolean,
				default: false
			},
			dataAttributes: {
				type: Object,
				default: null
			},
			buttonClass: {
				type: String,
				default: ''
			},
			popupOffsetLeft: {
				type: Number,
				default: null
			}
		},
		emits: ['add'],
		data() {
			return {
				showPopup: false
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				providerModuleId: `${booking_const.Model.Clients}/providerModuleId`,
				isFeatureEnabled: `${booking_const.Model.Interface}/isFeatureEnabled`
			})
		},
		created() {
			this.unfreezeAutoHide = null;
		},
		beforeUnmount() {
			this.closePopup();
		},
		methods: {
			clickHandler() {
				if (!this.isFeatureEnabled) {
					void booking_lib_limit.limit.show();
					return;
				}
				if (this.showPopup) {
					return;
				}
				main_popup.PopupManager.getPopupById(booking_component_clientPopup.CLIENT_POPUP_ID)?.destroy();
				this.freezeParentAutoHide();
				this.showPopup = true;
			},
			closePopup() {
				if (!this.showPopup) {
					return;
				}
				this.showPopup = false;
				this.unfreezeParentAutoHide();
			},
			freezeParentAutoHide() {
				if (this.unfreezeAutoHide) {
					return;
				}
				this.unfreezeAutoHide = this.autoHideContext?.freeze() ?? null;
			},
			unfreezeParentAutoHide() {
				this.unfreezeAutoHide?.();
				this.unfreezeAutoHide = null;
			},
			getOffsetLeft() {
				const {
					left
				} = this.$refs.button.getBoundingClientRect();
				if (window.innerWidth - left < 370) {
					return -317;
				}
				return main_core.Type.isNil(this.popupOffsetLeft) ? this.$refs.button.offsetWidth + 10 : this.popupOffsetLeft;
			}
		},
		template: `
		<div
			v-if="providerModuleId"
			class="booking-booking-card__add-client-button"
			:class="[buttonClass, { '--expired': expired }]"
			v-bind="$props.dataAttributes"
			ref="button"
			@click="clickHandler"
		>
			{{ loc('BOOKING_BOOKING_PLUS_CLIENT') }}
		</div>
		<ClientPopup
			v-if="showPopup"
			:bindElement="this.$refs.button"
			:offset-top="-100"
			:offset-left="getOffsetLeft()"
			@create="$emit('add', $event)"
			@close="closePopup"
		/>
	`
	};

	// @vue/component
	const BookingCard = {
		name: 'BookingCard',
		components: {
			BookingCardTitle: Title,
			BookingCardNote: Note,
			BookingCardProfit: Profit,
			BookingCardCommunication: Communication,
			BookingCardCrmButton: CrmButton,
			BookingCardSource: Source,
			BookingCardAddClient: AddClient,
			BookingCardDisabledPopup: DisabledPopup
		},
		provide() {
			return {
				cardDataService: this.cardDataService
			};
		},
		props: {
			/** @type { AbstractCardDataService } */
			cardDataService: {
				type: Object,
				required: true
			},
			classes: {
				type: [String, Object, Array],
				default: ''
			},
			styles: {
				type: [String, Object, Array],
				default: ''
			},
			dataAttributes: {
				type: Object,
				default: null
			},
			disabled: {
				type: Boolean,
				default: false
			},
			isMinimalView: {
				type: Boolean,
				required: true
			}
		},
		emits: ['communicationMouseenter'],
		data() {
			return {
				isDisabledPopupShown: false
			};
		},
		computed: {
			hasClient() {
				return Boolean(this.cardDataService.primaryClient);
			}
		},
		methods: {
			onBookingCardClick(event) {
				if (this.disabled) {
					this.isDisabledPopupShown = true;
					event.stopPropagation();
				}
			}
		},
		template: `
		<div
			class="booking-booking-card__container"
			:class="classes"
			:style="styles"
			v-bind="dataAttributes"
			@click.capture="onBookingCardClick"
		>
			<div class="booking-booking-card__padding">
				<slot name="start"/>
				<div class="booking-booking-card__inner">
					<div v-if="isMinimalView"
						class="booking-booking-card__content"
					>
						<div class="booking-booking-card__row booking-booking-card__upper-row">
							<div class="booking-booking-card__title-container">
								<BookingCardTitle/>
								<BookingCardNote :bindElement="() => $el"/>
							</div>
							<slot name="upper-content-row"/>
							<BookingCardProfit/>
						</div>
						<div class="booking-booking-card__row booking-booking-card__lower-row">
							<slot name="lower-content-row"/>
							<div v-if="hasClient" class="booking-booking-card__buttons">
								<BookingCardSource/>
								<BookingCardCommunication @mouseenter="$emit('communicationMouseenter')"/>
								<BookingCardCrmButton/>
							</div>
							<template v-else>
								<slot name="add-client-button"/>
							</template>
						</div>
					</div>
					<slot name="actions"></slot>
				</div>
			</div>
			<slot name="resize"/>
			<BookingCardDisabledPopup
				v-if="isDisabledPopupShown"
				:popupId="'booking-booking-card-disabled-popup-' + cardDataService.itemId"
				:bindElement="() => $el"
				@close="isDisabledPopupShown = false"
			/>
		</div>
	`
	};

	function buildBookingCardDataAttributes(params) {
		return {
			'data-id': params.id,
			'data-kind': params.kind,
			'data-element': params.element
		};
	}

	class AbstractCardDataService {
		#itemId;
		#dealHelper;
		constructor(itemId) {
			this.#itemId = itemId;
		}
		buildDataAttributes(element) {
			return buildBookingCardDataAttributes({
				id: this.itemId,
				kind: this.dataKindAttribute,
				element
			});
		}
		get dataKindAttribute() {
			throw new Error('You must implement dataKindAttribute() method.');
		}
		get item() {
			throw new Error('You must implement item() method.');
		}
		get primaryClient() {
			throw new Error('You must implement primaryClient() method.');
		}
		createDealHelper() {
			throw new Error('You must implement createDealHelper() method.');
		}
		get skus() {
			throw new Error('You must implement skus() method.');
		}
		async saveNote(note) {
			throw new Error('You must implement saveNote() method.');
		}
		async addClients(clients) {
			throw new Error('You must implement addClients() method.');
		}
		get itemId() {
			return this.#itemId;
		}
		set itemId(value) {
			this.#itemId = value;
		}
		get title() {
			return this.primaryClient?.name || this.item.name || main_core.Loc.getMessage('BOOKING_CARD_DATA_DEFAULT_BOOKING_NAME');
		}
		get note() {
			return this.item.note ?? '';
		}
		get dealHelper() {
			if (!this.#dealHelper) {
				this.#dealHelper = this.createDealHelper();
			}
			return this.#dealHelper;
		}
		get $store() {
			return booking_core.Core.getStore();
		}
	}

	exports.AbstractCardDataService = AbstractCardDataService;
	exports.AddClient = AddClient;
	exports.BookingCard = BookingCard;
	exports.buildBookingCardDataAttributes = buildBookingCardDataAttributes;

})(this.BX.Booking.Component = this.BX.Booking.Component || {}, BX, BX.Booking.Component, BX.Vue3.Vuex, BX.Booking.Const, BX.Booking.Component, BX.Booking.Lib, BX.Vue3.Directives, BX.UI.IconSet, window, window, BX.Booking.Lib, BX.Main, BX.Booking.Component, BX.Booking);
//# sourceMappingURL=booking-card.bundle.js.map
