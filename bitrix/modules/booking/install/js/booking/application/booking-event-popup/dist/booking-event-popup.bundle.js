/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
(function (exports, main_popup, ui_vue3, booking_core, booking_const, booking_component_mixin_locMixin, booking_model_bookingInfo, main_loader, ui_vue3_vuex, booking_provider_service_calendarDataService, ui_vue3_directives_hint, ui_iconSet_api_vue, ui_iconSet_outline, booking_component_avatar, booking_component_button, booking_lib_sidePanelInstance, ui_vue3_components_richLoc, ui_cnt, ui_vue3_components_counter) {
	'use strict';

	// @vue/component
	const BookingEventPopupClient = {
		name: 'BookingEventPopupClient',
		directives: {
			hint: ui_vue3_directives_hint.hint
		},
		components: {
			UiAvatar: booking_component_avatar.Avatar,
			UiButton: booking_component_button.Button,
			UiIcon: ui_iconSet_api_vue.BIcon
		},
		setup() {
			return {
				AirButtonStyle: booking_component_button.AirButtonStyle,
				ButtonSize: booking_component_button.ButtonSize,
				ButtonStyle: booking_component_button.ButtonStyle,
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				client: `${booking_const.Model.BookingInfo}/client`
			}),
			isPermitted() {
				return Boolean(this.client?.permissions?.read);
			},
			clientName() {
				if (!this.client) {
					return this.loc('BOOKING_EVENT_POPUP_CLIENT_IS_UNAVAILABLE');
				}
				if (!this.isPermitted) {
					return this.loc('BOOKING_EVENT_POPUP_NO_ACCESS');
				}
				return this.client.name;
			},
			clientImageLink() {
				return this.isPermitted ? this.client.image : '';
			}
		},
		methods: {
			soonHint() {
				return {
					text: this.loc('BOOKING_EVENT_POPUP_SOON_HINT'),
					popupOptions: {}
				};
			},
			openClient() {
				if (!this.isPermitted || !this.client) {
					return;
				}
				const entity = this.client.type.toLowerCase();
				booking_lib_sidePanelInstance.SidePanelInstance.open(`/crm/${entity}/details/${this.client.id}/`);
			}
		},
		template: `
		<div class="booking-event-popup__person-block">
			<div class="booking-event-popup__person">
				<div class="booking-event-popup__person_avatar">
					<UiAvatar
						:userName="isPermitted ? clientName : null"
						:userpicPath="clientImageLink"
					/>
				</div>
				<div class="booking-event-popup__person_data">
					<div v-if="client !== null" class="booking-event-popup__person_status">
						{{ loc('BOOKING_EVENT_POPUP_CLIENT') }}
					</div>
					<div
						:class="[
							'booking-event-popup__person_name',
							{ '--no-access': !isPermitted }
						]"
						@click="openClient"
					>
						{{ clientName }}
						<template v-if="client && !isPermitted">
							<UiIcon :name="Outline.LOCK_S" :size="20" color="rgb(var(--ui-color-palette-gray-50-rgb))"/>
						</template>
					</div>
				</div>
			</div>
			<UiButton
				v-hint="soonHint"
				:buttonClass="['--air', ButtonStyle.NO_CAPS, AirButtonStyle.OUTLINE_NO_ACCENT]"
				:text="loc('BOOKING_EVENT_POPUP_CALL_LABEL')"
				:icon="Outline.PHONE_UP"
				iconPosition="right"
				:size="ButtonSize.SMALL"
				disabled
				useAirDesign
			/>
		</div>
	`
	};

	// @vue/component
	const BookingEventPopupNote = {
		name: 'BookingEventPopupNote',
		components: {
			RichLoc: ui_vue3_components_richLoc.RichLoc,
			UiIcon: ui_iconSet_api_vue.BIcon
		},
		setup() {
			const iconName = ui_iconSet_api_vue.Outline.NOTE;
			return {
				iconName
			};
		},
		data() {
			return {
				showedMore: false
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				note: `${booking_const.Model.BookingInfo}/note`
			}),
			shortNote() {
				if (this.showedMore) {
					return this.note;
				}
				const moreText = this.extractMoreText(this.loc('BOOKING_EVENT_POPUP_NOTE_MORE_MSGVER_1', {
					'#NOTE#': ''
				}));
				return this.note.slice(0, 100 - moreText.length - 3).trimEnd();
			},
			richLocText() {
				return this.loc('BOOKING_EVENT_POPUP_NOTE_MORE_MSGVER_1', {
					'#NOTE#': this.shortNote
				});
			}
		},
		methods: {
			extractMoreText(text) {
				const regex = /\[button](.*?)\[\/button]/;
				const matchResult = text.match(regex);
				if (matchResult && matchResult.length > 1) {
					return matchResult[1];
				}
				return '';
			}
		},
		template: `
		<div class="booking-event-popup__person-info">
			<div class="booking-event-popup__person-info_icon">
				<UiIcon :name="iconName" :size="22" color="rgba(250, 167, 44, 1)"/>
			</div>
			<div class="booking-event-popup__person-info_text">
				<RichLoc v-if="shortNote.length < note.length" :text="richLocText" placeholder="[button]">
					<template #button="{ text }">
						<span
							class="booking-event-popup__person-info_text-more"
							@click="showedMore = true"
						>
							{{ text }}
						</span>
					</template>
				</RichLoc>
				<text v-else>
					{{ note }}
				</text>
			</div>
		</div>
	`
	};

	// @vue/component
	const EntitiesList = {
		name: 'EntitiesList',
		components: {
			RichLoc: ui_vue3_components_richLoc.RichLoc,
			UiCounter: ui_vue3_components_counter.Counter,
			UiIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			title: {
				type: String,
				required: true
			},
			iconName: {
				type: String,
				required: true
			},
			entities: {
				type: Array,
				default: () => []
			},
			hasNoAccess: {
				type: Boolean,
				default: false
			}
		},
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline,
				CounterSize: ui_cnt.CounterSize,
				CounterStyle: ui_cnt.CounterStyle
			};
		},
		data() {
			return {
				limit: 90
			};
		},
		computed: {
			entitiesCount() {
				return this.entities.length;
			},
			hasMore() {
				return !this.hasNoAccess && this.entities.length > this.names.length;
			},
			more() {
				return this.loc('BOOKING_EVENT_POPUP_ENTITIES_MORE_MSGVER_2', {
					'#COUNT#': this.entities.length - this.names.length || '',
					'#RESOURCES#': this.names.join(', ')
				});
			},
			count() {
				return this.entitiesCount ?? this.entities.length;
			},
			names() {
				if (this.hasNoAccess) {
					return [this.loc('BOOKING_EVENT_POPUP_NO_ACCESS')];
				}
				if (this.limit === Infinity) {
					return this.entities.map(({
						name
					}) => name);
				}
				let textLength = 0;
				const names = [];
				if (this.entities.length === 1) {
					return this.entities.map(({
						name
					}) => name);
				}
				for (const entity of this.entities) {
					if (textLength + entity.name.length > this.limit) {
						break;
					}
					textLength += entity.name.length;
					names.push(entity.name);
				}
				return names;
			}
		},
		template: `
		<div class="booking-event-popup__resources-item">
			<div class="booking-event-popup__resources-item_icon">
				<UiIcon :name="iconName" :size="20"/>
			</div>
			<div class="booking-event-popup__resources-item_info">
				<div class="booking-event-popup__resources-item_title">
					{{ title }}
					<UiCounter
						v-if="!hasNoAccess"
						:value="count"
						:maxValue="999"
						:size="CounterSize.SMALL"
						:style="CounterStyle.FILLED"
					/>
					<template v-if="hasNoAccess">
						<UiIcon :name="Outline.LOCK_S" :size="20" color="rgb(var(--ui-color-palette-gray-50-rgb))"/>
					</template>
				</div>
				<div
					:class="[
						'booking-event-popup__resources-item_text',
						{ '--no-access': hasNoAccess }
					]"
				>
					<RichLoc v-if="hasMore" :text="more" placeholder="[button]" style="display: inline-block">
						<template #button="{ text }">
							<span
								v-if="hasMore"
								class="booking-event-popup__resources-item_text-more"
								@click="limit = Infinity"
							>
								{{ text }}
							</span>
						</template>
					</RichLoc>
					<text v-else>
						{{ names.join(', ') }}
					</text>
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const ResourceEntitiesList = {
		name: 'ResourceEntitiesList',
		components: {
			EntitiesList
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				resources: `${booking_const.Model.BookingInfo}/resources`
			})
		},
		render() {
			if (this.resources.length === 0) {
				return null;
			}
			const hasNoAccess = this.resources.some(({
				permissions
			}) => !permissions.read);
			return ui_vue3.h(EntitiesList, {
				title: this.loc('BOOKING_EVENT_POPUP_RESOURCES_TITLE'),
				iconName: ui_iconSet_api_vue.Outline.PRODUCT,
				entities: hasNoAccess ? [] : this.resources,
				hasNoAccess
			});
		}
	};

	// @vue/component
	const ServicesEntitiesList = {
		name: 'ServicesEntitiesList',
		components: {
			EntitiesList
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				services: `${booking_const.Model.BookingInfo}/services`
			})
		},
		render() {
			if (this.services.length === 0) {
				return null;
			}
			const hasNoAccess = this.services.some(({
				permissions
			}) => !permissions.read);
			return ui_vue3.h(EntitiesList, {
				title: this.loc('BOOKING_EVENT_POPUP_SERVICES_TITLE'),
				iconName: ui_iconSet_api_vue.Outline.THREE_PERSONS,
				entities: hasNoAccess ? [] : this.services,
				hasNoAccess
			});
		}
	};

	// @vue/component
	const App = {
		name: 'BookingEventPopupApp',
		components: {
			BookingEventPopupClient,
			BookingEventPopupNote,
			ResourceEntitiesList,
			ServicesEntitiesList
		},
		props: {
			bookingId: {
				type: Number,
				required: true
			}
		},
		data() {
			return {
				fetching: false
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				note: `${booking_const.Model.BookingInfo}/note`
			})
		},
		watch: {
			fetching: {
				handler(fetching) {
					if (fetching) {
						this.showLoader();
					} else {
						this.hideLoader();
					}
				},
				immediate: true
			}
		},
		created() {
			this.loader = new main_loader.Loader();
		},
		mounted() {
			void this.fetchBookingInfo();
		},
		methods: {
			async fetchBookingInfo() {
				try {
					this.fetching = true;
					await booking_provider_service_calendarDataService.calendarDataService.loadBookingInfo(this.bookingId);
				} catch (error) {
					console.error('BookingEventPopup. Get data error', error);
				} finally {
					this.fetching = false;
				}
			},
			showLoader() {
				void this.loader?.show(this.$refs.app);
			},
			hideLoader() {
				void this.loader?.hide(this.$refs.app);
			}
		},
		template: `
		<div ref="app" class="booking-event-popup__content">
			<div class="booking-event-popup__title">{{ loc('BOOKING_EVENT_POPUP_TITLE') }}</div>
			<BookingEventPopupClient v-if="!fetching"/>
			<BookingEventPopupNote v-if="note"/>
			<div class="booking-event-popup__resources">
				<ResourceEntitiesList/>
				<ServicesEntitiesList/>
			</div>
		</div>
	`
	};

	let popup = null;
	class BookingEventPopup {
		#bookingId;
		#app;
		constructor(params) {
			this.#bookingId = params.bookingId;
		}
		async show() {
			if (popup) {
				return;
			}
			if (!popup) {
				this.#initPopup();
			}
			await booking_core.Core.init({
				skipCoreModels: true,
				skipPull: true
			});
			await booking_core.Core.addDynamicModule(booking_model_bookingInfo.BookingInfo.create().setVariables({
				bookingId: this.#bookingId
			}));
			popup.show();
			this.#mountApplication(popup.getContentContainer());
		}
		#initPopup() {
			if (popup) {
				return;
			}
			popup = new main_popup.Popup({
				id: `calendar-entity-booking-event-popup-${this.#bookingId}`,
				bindElement: null,
				content: '',
				width: 490,
				minHeight: 100,
				maxHeight: 330,
				closeByEsc: true,
				closeIcon: true,
				className: 'booking-event-popup',
				autoHide: true,
				events: {
					onPopupAfterClose: async () => {
						await this.#close();
					}
				},
				padding: 13
			});
		}
		#mountApplication(container) {
			const app = ui_vue3.BitrixVue.createApp(App, {
				...booking_core.Core.getParams(),
				bookingId: this.#bookingId
			});
			app.mixin(booking_component_mixin_locMixin.locMixin);
			app.use(booking_core.Core.getStore());
			app.mount(container);
			this.#app = app;
		}
		async #close() {
			this.#app.unmount();
			this.#app = null;
			await booking_core.Core.removeDynamicModule(booking_const.Model.BookingInfo);
			popup?.destroy();
			popup = null;
		}
	}

	exports.BookingEventPopup = BookingEventPopup;

})(this.BX.Booking.Application = this.BX.Booking.Application || {}, BX.Main, BX.Vue3, BX.Booking, BX.Booking.Const, BX.Booking.Component.Mixin, BX.Booking.Model, BX, BX.Vue3.Vuex, BX.Booking.Provider.Service, BX.Vue3.Directives, BX.UI.IconSet, window, BX.Booking.Component, BX.Booking.Component, BX.Booking.Lib, BX.UI.Vue3.Components, BX.UI, BX.UI.Vue3.Components);
//# sourceMappingURL=booking-event-popup.bundle.js.map
