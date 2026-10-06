/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
(function (exports, ui_vue3, booking_core, booking_component_mixin_locMixin, main_loader, ui_vue3_vuex, booking_const, booking_lib_datePeriod, booking_lib_duration, booking_component_emptyFilterResultsPopup, booking_provider_service_mainPageService, booking_provider_service_saleChannelsService, booking_provider_service_dictionaryService, booking_provider_service_bookingService, booking_provider_service_calendarService, booking_provider_service_resourceDialogService, booking_lib_analytics, booking_lib_mousePosition, booking_lib_filterResultNavigator, booking_component_whatsappPopupChangesSendingMessages, main_date, booking_lib_busySlots, booking_lib_grid, main_core_events, ui_datePicker, ui_iconSet_api_vue, ui_iconSet_main, ui_iconSet_actions, booking_provider_service_optionService, booking_component_counterFloating, main_core, booking_lib_drag, main_popup, ui_dialogs_messagebox, booking_provider_service_waitListService, booking_component_bookingCard, booking_lib_isRealId, booking_component_actionsPopup, booking_lib_dealHelper, booking_lib_removeWaitListItem, ui_iconSet_api_core, ui_iconSet_outline, booking_lib_limit, booking_component_button, ui_ears, booking_lib_ahaMoments, booking_lib_range, ui_vue3_components_richLoc, booking_component_popup, booking_lib_booking, booking_lib_inInterval, booking_lib_checkBookingIntersection, booking_provider_service_bookingActionsService, ui_notificationManager, booking_component_loader, ui_vue3_directives_hint, booking_lib_removeBooking, booking_lib_requestRevisionGuard, booking_component_timeSelector, ui_iconSet_animated, booking_component_counter, booking_lib_utils, booking_lib_cell, ui_system_skeleton_vue, ui_vue3_components_button, booking_lib_slotRanges, ui_vue3_components_counter, ui_cnt, ui_entitySelector, booking_lib_resources, booking_lib_resourcesDateCache, booking_component_statisticsPopup, booking_lib_helpDesk, ui_label, booking_lib_currencyFormat, ui_hint, booking_resourceCreationWizard, booking_lib_removeResource, booking_lib_sidePanelInstance, ui_counterpanel, booking_provider_service_clientService, booking_component_clientPopup, ui_bannerDispatcher, booking_lib_resolvable, ui_autoLaunch, booking_application_yandexIntegrationWizard, booking_application_skuResourcesEditor, booking_provider_service_resourcesService) {
	'use strict';

	const MarkColors = {
		FREE: 'rgba(var(--ui-color-background-success-rgb), 0.7)',
		FILTER: 'rgba(var(--ui-color-primary-rgb), 0.20)',
		COUNTER: 'red'
	};

	// @vue/component
	const Calendar = {
		name: 'BookingSidebarCalendar',
		components: {
			Icon: ui_iconSet_api_vue.BIcon,
			CounterFloating: booking_component_counterFloating.CounterFloating
		},
		props: {
			calendarClass: {
				type: [String, Object, Array],
				default: ''
			}
		},
		setup() {
			return {
				IconSet: ui_iconSet_api_vue.Set,
				NavigationDirection: booking_const.NavigationDirection
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				calendarExpanded: `${booking_const.Model.Interface}/calendarExpanded`,
				freeMarks: `${booking_const.Model.Interface}/freeMarks`,
				getCounterMarks: `${booking_const.Model.Interface}/getCounterMarks`,
				offset: `${booking_const.Model.Interface}/offset`,
				firstWeekDay: `${booking_const.Model.Interface}/firstWeekDay`,
				isWeekMode: `${booking_const.Model.Interface}/isWeekMode`,
				datesCount: `${booking_const.Model.Filter}/datesCount`,
				filteredMarks: `${booking_const.Model.Filter}/filteredMarks`,
				isFilterMode: `${booking_const.Model.Filter}/isFilterMode`,
				isDeletingResourceFilterMode: `${booking_const.Model.Filter}/isDeletingResourceFilterMode`
			}),
			selectedDateTs() {
				return this.$store.getters[`${booking_const.Model.Interface}/selectedDateTs`] + this.offset;
			},
			viewDateTs() {
				return this.$store.getters[`${booking_const.Model.Interface}/viewDateTs`] + this.offset;
			},
			counterMarks() {
				if (this.isFilterMode || this.isDeletingResourceFilterMode) {
					return this.getCounterMarks(this.filteredMarks);
				}
				return this.getCounterMarks();
			},
			formattedDate() {
				const shouldUseMonthYearFormat = this.isWeekMode || this.calendarExpanded;
				const format = shouldUseMonthYearFormat ? this.loc('BOOKING_MONTH_YEAR_FORMAT') : main_date.DateTimeFormat.getFormat('LONG_DATE_FORMAT');
				const timestampMs = shouldUseMonthYearFormat ? this.viewDateTs : this.selectedDateTs;
				const timestampSeconds = timestampMs / 1000;
				return main_date.DateTimeFormat.format(format, timestampSeconds);
			},
			isShowCounterFloating() {
				return (this.isDeletingResourceFilterMode || this.isFilterMode) && this.datesCount.count > 0;
			}
		},
		watch: {
			selectedDateTs(selectedDateTs) {
				this.updateDateSelection(ui_datePicker.createDate(selectedDateTs));
				this.updateMarks();
			},
			filteredMarks() {
				this.updateMarks();
			},
			freeMarks() {
				this.updateMarks();
			},
			counterMarks() {
				this.setCounterMarks();
			},
			isFilterMode() {
				this.updateMarks();
			}
		},
		created() {
			this.datePicker = new ui_datePicker.DatePicker({
				inline: true,
				hideHeader: true,
				firstWeekDay: this.firstWeekDay,
				selectedDates: this.isWeekMode ? null : [this.selectedDateTs],
				selectionMode: this.isWeekMode ? 'range' : null
			});
			this.datePicker.setViewDate(ui_datePicker.createDate(this.selectedDateTs));
			this.setViewDate();
			this.syncWeekRangeSelection();
			this.datePicker.subscribe(ui_datePicker.DatePickerEvent.BEFORE_DAY_SELECT, event => {
				const date = event.getData().date;
				const selectedDate = this.createDateFromUtc(date);
				void this.$store.dispatch(`${booking_const.Model.Interface}/setSelectedDateTs`, selectedDate.getTime());
				this.setViewDate();
				this.syncWeekRangeSelection();
				event.preventDefault();
			});
			if (this.isWeekMode) {
				main_core_events.EventEmitter.subscribe(booking_const.EventName.MultiBookingShowPreviousPeriod, this.previousWeek);
				main_core_events.EventEmitter.subscribe(booking_const.EventName.MultiBookingShowNextPeriod, this.nextWeek);
			}
		},
		mounted() {
			this.datePicker.setTargetNode(this.$refs.datePicker);
			this.datePicker.show();
			this.updateMarks();
		},
		beforeUnmount() {
			main_core_events.EventEmitter.unsubscribe(booking_const.EventName.MultiBookingShowPreviousPeriod, this.previousWeek);
			main_core_events.EventEmitter.unsubscribe(booking_const.EventName.MultiBookingShowNextPeriod, this.nextWeek);
			this.datePicker.destroy();
		},
		methods: {
			previousWeek() {
				this.navigateByWeek(booking_const.NavigationDirection.previous);
			},
			nextWeek() {
				this.navigateByWeek(booking_const.NavigationDirection.next);
			},
			navigate(direction) {
				const unit = this.getNavigationUnit();
				const navigationHandlers = {
					[booking_const.NavigationUnit.day]: () => this.navigateByDay(direction),
					[booking_const.NavigationUnit.week]: () => this.navigateByWeek(direction),
					[booking_const.NavigationUnit.month]: () => this.navigateByMonth(direction)
				};
				navigationHandlers[unit]();
			},
			getNavigationUnit() {
				if (this.calendarExpanded) {
					return booking_const.NavigationUnit.month;
				}
				return this.isWeekMode ? booking_const.NavigationUnit.week : booking_const.NavigationUnit.day;
			},
			navigateByDay(direction) {
				const date = this.datePicker.getSelectedDate() || this.datePicker.getToday();
				const nextDate = ui_datePicker.getNextDate(date, booking_const.NavigationUnit.day, direction);
				const selectedDate = this.createDateFromUtc(nextDate);
				void this.$store.dispatch(`${booking_const.Model.Interface}/setSelectedDateTs`, selectedDate.getTime());
				this.updateDateSelection(nextDate);
				this.setViewDate();
			},
			navigateByWeek(direction) {
				const daysOffset = direction * booking_const.Grid.Duration.Week;
				const newDate = ui_datePicker.getNextDate(ui_datePicker.createDate(this.selectedDateTs), booking_const.NavigationUnit.day, daysOffset);
				const selectedDate = this.createDateFromUtc(newDate);
				void this.$store.dispatch(`${booking_const.Model.Interface}/setSelectedDateTs`, selectedDate.getTime());
				this.datePicker.setViewDate(newDate);
				this.setViewDate();
				this.syncWeekRangeSelection();
			},
			navigateByMonth(direction) {
				const viewDate = this.datePicker.getViewDate();
				this.datePicker.setViewDate(ui_datePicker.getNextDate(viewDate, booking_const.NavigationUnit.month, direction));
				this.setViewDate();
			},
			updateDateSelection(nextDate) {
				if (this.isWeekMode) {
					this.syncWeekRangeSelection();
				} else {
					this.datePicker.selectDate(nextDate);
				}
			},
			setViewDate() {
				const viewDate = this.createDateFromUtc(this.datePicker.getViewDate());
				const viewDateTs = viewDate.setDate(1);
				void this.$store.dispatch(`${booking_const.Model.Interface}/setViewDateTs`, viewDateTs);
			},
			createDateFromUtc(date) {
				return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
			},
			updateMarks() {
				if (this.isFilterMode || this.isDeletingResourceFilterMode) {
					this.setFilterMarks();
				} else {
					this.setFreeMarks();
				}
				this.setCounterMarks();
			},
			setFreeMarks() {
				const dates = this.prepareDates(this.freeMarks);
				this.datePicker.setDayColors([{
					matcher: dates,
					bgColor: MarkColors.FREE
				}]);
			},
			getFilterMarks() {
				if (!this.isDeletingResourceFilterMode) {
					return this.filteredMarks;
				}
				const today = new Date();
				const todayTs = today.setHours(0, 0, 0, 0);
				return this.filteredMarks.filter(freeMarkTs => new Date(freeMarkTs).getTime() >= todayTs);
			},
			setFilterMarks() {
				const dates = this.prepareDates(this.getFilterMarks());
				this.datePicker.setDayColors([{
					matcher: dates,
					bgColor: MarkColors.FILTER
				}]);
			},
			setCounterMarks() {
				const dates = this.prepareDates(this.counterMarks);
				this.datePicker.setDayMarks([{
					matcher: dates,
					bgColor: MarkColors.COUNTER
				}]);
			},
			prepareDates(dates) {
				return dates.map(markDate => {
					const date = main_date.DateTimeFormat.parse(markDate, false, booking_const.DateFormat.ServerParse);
					return this.prepareTimestamp(date.getTime());
				});
			},
			prepareTimestamp(timestamp) {
				const dateFormat = main_date.DateTimeFormat.getFormat('FORMAT_DATE');
				return main_date.DateTimeFormat.format(dateFormat, timestamp / 1000);
			},
			async collapseToggle() {
				await Promise.all([this.$store.dispatch(`${booking_const.Model.Interface}/setCalendarExpanded`, !this.calendarExpanded), booking_provider_service_optionService.optionService.setBool(booking_const.Option.CalendarExpanded, this.calendarExpanded)]);
			},
			syncWeekRangeSelection() {
				if (!this.isWeekMode) {
					void this.$store.dispatch(`${booking_const.Model.Interface}/setSelectedFirstDayPeriodTs`, null);
					return;
				}
				const firstWeekDateUtc = ui_datePicker.floorDate(ui_datePicker.createDate(this.selectedDateTs), 'week', this.firstWeekDay);
				const lastWeekDayUtc = ui_datePicker.addDate(firstWeekDateUtc, 'day', 6);
				const firstWeekDateLocal = new Date(firstWeekDateUtc.getUTCFullYear(), firstWeekDateUtc.getUTCMonth(), firstWeekDateUtc.getUTCDate());
				void this.$store.dispatch(`${booking_const.Model.Interface}/setSelectedFirstDayPeriodTs`, firstWeekDateLocal.getTime());
				this.datePicker.selectRange(firstWeekDateUtc.getTime(), lastWeekDayUtc.getTime(), {
					emitEvents: false
				});
			}
		},
		template: `
		<div
			class="booking-sidebar-calendar-container"
			:class="[calendarClass, {
				'--expanded': calendarExpanded,
				'--counter': isShowCounterFloating,
			}].flat(1)"
		>
			<div class="booking-booking-sidebar-calendar">
				<div class="booking-booking-sidebar-calendar-header">
					<div class="booking-sidebar-button" @click="navigate(NavigationDirection.previous)">
						<div class="ui-icon-set --chevron-left"></div>
					</div>
					<div class="booking-booking-sidebar-calendar-title">
						{{ formattedDate }}
					</div>
					<div class="booking-sidebar-button --right" @click="navigate(NavigationDirection.next)">
						<div class="ui-icon-set --chevron-right"></div>
					</div>
					<div class="booking-sidebar-button" @click="collapseToggle">
						<Icon :name="calendarExpanded ? IconSet.COLLAPSE : IconSet.EXPAND_1"/>
					</div>
				</div>
				<div class="booking-booking-sidebar-calendar-date-picker" ref="datePicker"></div>
			</div>
			<CounterFloating
				v-if="isShowCounterFloating"
				:count="datesCount.count"
			/>
		</div>
	`
	};

	// @vue/component
	const WaitListLayout = {
		name: 'WaitListLayout',
		props: {
			waitListItemsCount: {
				type: Number,
				default: 0
			},
			waitListClass: {
				type: [String, Object, Array],
				default: ''
			},
			showEmptyState: {
				type: Boolean,
				default: false
			},
			dragging: {
				type: Boolean,
				default: false
			},
			expanded: {
				type: Boolean,
				default: false
			}
		},
		emits: ['mouseUp'],
		methods: {
			showHelpDesk() {
				if (!top.BX.Helper) {
					return;
				}
				const anchor = booking_const.HelpDesk.WaitListDescription.anchorCode || null;
				const params = {
					redirect: 'detail',
					code: booking_const.HelpDesk.WaitListDescription.code,
					...(anchor !== null && {
						anchor
					})
				};
				const queryString = Object.entries(params).map(([key, value]) => `${key}=${value}`).join('&');
				top.BX.Helper.show(queryString);
			}
		},
		template: `
		<div
			class="booking-wait-list"
			:class="waitListClass"
			@mouseup.capture="$emit('mouseUp', $event)"
		>
			<div class="booking-wait-list-header">
				<div class="booking-wait-list-title">{{ loc('BOOKING_BOOKING_WAIT_LIST') }}</div>
				<div v-if="waitListItemsCount > 0" class="booking--wait-list-title-count">{{ waitListItemsCount }}</div>
				<div class="booking-wait-list-buttons">
					<slot name="header" />
				</div>
			</div>
			<div
				v-if="expanded"
				class="booking--wait-list-content"
			>
				<div v-if="showEmptyState" class="booking-wait-list-empty">
					<div class="booking-wait-list-empty-icon"></div>
					<div class="booking-wait-list-empty-title">{{ loc('BOOKING_BOOKING_WAIT_LIST') }}</div>
					<div class="booking-wait-list-empty-subtitle">{{ loc('BOOKING_BOOKING_WAIT_LIST_DESCRIPTION') }}</div>
					<div
						class="booking-wait-list-empty-help"
						@click="showHelpDesk"
					>
						{{ loc('BOOKING_BOOKING_WAIT_LIST_HOW') }}
					</div>
				</div>
				<div v-if="dragging" class="booking-wait-list-drag-area">
					{{ loc('BOOKING_BOOKING_WAIT_LIST_DRAG_AREA') }}
				</div>
				<template v-else>
					<slot name="waitlist" />
				</template>
			</div>
		</div>
	`
	};

	const useDeleteWaitListGroup = () => {
		const confirmDelete = async () => {
			return new Promise(resolve => {
				const messageBox = ui_dialogs_messagebox.MessageBox.create({
					message: main_core.Loc.getMessage('BOOKING_BOOKING_WAIT_LIST_GROUP_CONFIRM_DELETE'),
					yesCaption: main_core.Loc.getMessage('BOOKING_BOOKING_WAIT_LIST_GROUP_CONFIRM_DELETE_YES'),
					modal: true,
					buttons: ui_dialogs_messagebox.MessageBoxButtons.YES_CANCEL,
					onYes: () => {
						messageBox.close();
						resolve(true);
					},
					onCancel: () => {
						messageBox.close();
						resolve(false);
					}
				});
				messageBox.show();
			});
		};
		const deleteWaitListGroup = async waitListItemsIds => {
			// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-dialogs
			if (await confirmDelete()) {
				await booking_provider_service_waitListService.waitListService.deleteList(waitListItemsIds);
			}
		};
		return {
			deleteWaitListGroup
		};
	};

	// @vue/component

	const WaitListGroupMenu = {
		name: 'WaitListGroupMenu',
		props: {
			waitListGroup: {
				type: Object,
				required: true
			}
		},
		setup() {
			const menuPopup = null;
			const {
				deleteWaitListGroup
			} = useDeleteWaitListGroup();
			return {
				menuPopup,
				deleteWaitListGroup
			};
		},
		computed: {
			popupId() {
				return `wait-list-group-menu-${main_core.Text.getRandom(4)}`;
			}
		},
		unmounted() {
			if (this.menuPopup) {
				this.destroy();
			}
		},
		methods: {
			openMenu() {
				if (this.menuPopup?.popupWindow?.isShown()) {
					this.destroy();
					return;
				}
				const menuButton = this.$refs['menu-button'];
				this.menuPopup = main_popup.MenuManager.create(this.popupId, menuButton, this.getMenuItems(), {
					className: 'booking--wait-list--wait-list-group-menu-popup',
					closeByEsc: true,
					autoHide: true,
					offsetTop: -3,
					offsetLeft: menuButton.offsetWidth - 6,
					angle: true,
					cacheable: true,
					events: {
						onDestroy: () => this.unbindScrollEvent()
					}
				});
				this.menuPopup.show();
				this.bindScrollEvent();
			},
			getMenuItems() {
				return [{
					html: `<span>${this.loc('BOOKING_BOOKING_WAIT_LIST_GROUP_DELETE')}</span>`,
					onclick: async () => {
						this.destroy();
						await this.deleteWaitListGroup(this.waitListGroup.items.map(({
							id
						}) => id));
					}
				}];
			},
			// async deleteWaitListGroup(): Promise<void>
			// {
			// 	const waitListItemsIds = this.waitListGroup.items.map(({ id }) => id);
			// 	await waitListService.deleteList(waitListItemsIds);
			// },
			destroy() {
				main_popup.MenuManager.destroy(this.popupId);
				this.unbindScrollEvent();
			},
			bindScrollEvent() {
				main_core.Event.bind(document, 'scroll', this.adjustPosition, {
					capture: true
				});
			},
			unbindScrollEvent() {
				main_core.Event.unbind(document, 'scroll', this.adjustPosition, {
					capture: true
				});
			},
			adjustPosition() {
				this.menuPopup?.popupWindow?.adjustPosition();
			}
		},
		template: `
		<button ref="menu-button" class="ui-icon-set --more" @click="openMenu"></button>
	`
	};

	// @vue/component

	const WaitListGroups = {
		name: 'WaitListGroups',
		components: {
			Icon: ui_iconSet_api_vue.BIcon,
			WaitListGroupMenu
		},
		setup() {
			const dragManager = null;
			return {
				dragManager,
				IconSet: ui_iconSet_api_vue.Set
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				editingWaitListItemId: `${booking_const.Model.Interface}/editingWaitListItemId`,
				isFeatureEnabled: `${booking_const.Model.Interface}/isFeatureEnabled`,
				animationPause: `${booking_const.Model.Interface}/animationPause`,
				waitListItems: `${booking_const.Model.WaitList}/get`
			}),
			waitListGroups() {
				const groups = [{
					title: this.loc('BOOKING_BOOKING_WAIT_LIST_ADDED_TODAY'),
					items: []
				}, {
					title: this.loc('BOOKING_BOOKING_WAIT_LIST_ADDED_THIS_WEEK'),
					items: []
				}, {
					title: this.loc('BOOKING_BOOKING_WAIT_LIST_ADDED_THIS_MONTH'),
					items: []
				}, {
					title: this.loc('BOOKING_BOOKING_WAIT_LIST_ADDED_OVER_MONTH'),
					items: []
				}];
				const today = new Date().setHours(0, 0, 0, 0);
				const {
					d: dayDuration,
					w: weekDuration,
					m: monthDuration
				} = booking_lib_duration.Duration.getUnitDurations();
				[...this.waitListItems].sort((a, b) => b.createdAt - a.createdAt).forEach(waitListItem => {
					const duration = today - new Date(waitListItem.createdAt).setHours(0, 0, 0, 0);
					if (duration < dayDuration) {
						groups[0].items.push(waitListItem);
					} else if (duration < weekDuration) {
						groups[1].items.push(waitListItem);
					} else if (duration < monthDuration) {
						groups[2].items.push(waitListItem);
					} else {
						groups[3].items.push(waitListItem);
					}
				});
				return groups.filter(({
					items
				}) => items.length > 0);
			}
		},
		template: `
		<div class="booking-wait-list-groups">
			<div v-for="group of waitListGroups" :key="group.title" class="booking-wait-list-group">
				<div class="booking-wait-list-group-header">
					<div class="booking-wait-list-group-title">{{ group.title }}</div>
					<div class="booking-sidebar-button">
						<WaitListGroupMenu :waitListGroup="group"/>
					</div>
				</div>
				<TransitionGroup :name="animationPause ? 'none' : 'wait-list'" tag="div">
					<template v-for="item of group.items" :key="item.id">
						<slot name="item" :item="item"/>
					</template>
				</TransitionGroup>
			</div>
		</div>
	`
	};

	// @vue/component
	const WaitListItemClient = {
		name: 'WaitListItemClient',
		components: {
			Client: booking_component_actionsPopup.Client
		},
		props: {
			waitListItemId: {
				type: Number,
				required: true
			}
		},
		emits: ['freeze', 'unfreeze'],
		computed: {
			waitListItem() {
				return this.$store.getters[`${booking_const.Model.WaitList}/getById`](this.waitListItemId);
			}
		},
		methods: {
			async addClients({
				clients
			}) {
				await booking_provider_service_waitListService.waitListService.update({
					id: this.waitListItem.id,
					clients
				});
			},
			async updateClients({
				clients
			}) {
				await booking_provider_service_waitListService.waitListService.update({
					id: this.waitListItem.id,
					clients
				});
			},
			async updateNote({
				note
			}) {
				await booking_provider_service_waitListService.waitListService.update({
					id: this.waitListItem.id,
					note
				});
			}
		},
		template: `
		<Client
			:id="waitListItemId"
			:primaryClientData="waitListItem.clients?.[0] || null"
			:clients="waitListItem.clients"
			:note="waitListItem.note"
			:dataId="waitListItemId"
			dataElementPrefix="wait-list-item"
			:dataAttributes="{
				'data-wait-list-item-id': waitListItemId,
			}"
			@freeze="$emit('freeze')"
			@unfreeze="$emit('unfreeze')"
			@addClients="addClients"
			@updateClients="updateClients"
			@updateNote="updateNote"
		/>
	`
	};

	// @vue/component
	const WaitListItemConfirmation = {
		name: 'WaitListItemConfirmation',
		components: {
			Confirmation: booking_component_actionsPopup.Confirmation
		},
		props: {
			waitListItemId: {
				type: Number,
				required: true
			}
		},
		emits: ['freeze', 'unfreeze'],
		template: `
		<Confirmation
			:id="waitListItemId"
			:isConfirmed="false"
			:counters="[]"
			disabled
			:dataId="waitListItemId"
			dataPre
		/>
	`
	};

	// @vue/component
	const WaitListItemDeal = {
		name: 'WaitListItemDeal',
		components: {
			Deal: booking_component_actionsPopup.Deal
		},
		props: {
			waitListItemId: {
				type: Number,
				required: true
			}
		},
		emits: ['freeze', 'unfreeze'],
		setup(props) {
			const dealHelper = new booking_lib_dealHelper.WaitListDealHelper(props.waitListItemId);
			return {
				dealHelper
			};
		},
		computed: {
			waitListItem() {
				return this.$store.getters[`${booking_const.Model.WaitList}/getById`](this.waitListItemId);
			},
			deal() {
				return this.waitListItem?.externalData?.find(data => data.entityTypeId === booking_const.CrmEntity.Deal) ?? null;
			}
		},
		template: `
		<Deal
			:deal="deal"
			:dealHelper="dealHelper"
			:dataId="waitListItemId"
			:dataAttributes="{
				'data-wait-list-item-id': waitListItemId,
			}"
			dataElementPrefix="wait-list"
			@freeze="$emit('freeze')"
			@unfreeze="$emit('unfreeze')"
		/>
	`
	};

	// @vue/component
	const WaitListItemDocument = {
		name: 'WaitListItemDocument',
		components: {
			Document: booking_component_actionsPopup.Document
		},
		props: {
			waitListItemId: {
				type: Number,
				required: true
			}
		},
		setup() {
			const isLoading = ui_vue3.ref(true);
			ui_vue3.onMounted(() => {
				isLoading.value = false;
			});
			return {
				isLoading
			};
		},
		template: `
		<Document
			:id="waitListItemId"
			:loading="isLoading"
			disabled
		/>
	`
	};

	// @vue/component
	const WaitListItemMessage = {
		name: 'WaitListItemMessage',
		components: {
			Message: booking_component_actionsPopup.Message
		},
		props: {
			waitListItemId: {
				type: Number,
				required: true
			}
		},
		template: `
		<Message
			:id="waitListItemId"
			:clientData="null"
			:loading="false"
			disabled
			:dataId="waitListItemId"
			dataElementPrefix="wait-list"
		/>
	`
	};

	// @vue/component
	const WaitListItemRemove = {
		name: 'WaitListItemRemove',
		components: {
			RemoveButton: booking_component_actionsPopup.RemoveButton
		},
		props: {
			waitListItemId: {
				type: Number,
				required: true
			}
		},
		emits: ['close'],
		methods: {
			remove() {
				new booking_lib_removeWaitListItem.RemoveWaitListItem(this.waitListItemId);
				this.$emit('close');
			}
		},
		template: `
		<RemoveButton
			showLabel
			:dataAttributes="{
				'data-id': waitListItemId,
				'data-element': 'booking-wait-list-item-menu-remove-button'
			}"
			@remove="remove"
		/>
	`
	};

	// @vue/component
	const WaitListItemVisit = {
		name: 'WaitListItemVisit',
		components: {
			Visit: booking_component_actionsPopup.Visit
		},
		props: {
			waitListItemId: {
				type: Number,
				required: true
			}
		},
		computed: {
			waitListItem() {
				return this.$store.getters[`${booking_const.Model.WaitList}/getById`](this.waitListItemId);
			}
		},
		template: `
		<Visit
			:id="waitListItem.id"
			:hasClients="waitListItem.clients.length > 0"
			visitStatus="0"
			disabled
			:dataId="waitListItem.id"
			dataElementPrefix="wait-list"
		/>
	`
	};

	const ActionsPopupActionEnum$1 = Object.freeze({
		client: 'client',
		confirmation: 'confirmation',
		deal: 'deal',
		document: 'document',
		fullForm: 'fullForm',
		message: 'message',
		visit: 'visit',
		overbooking: 'overbooking',
		remove: 'remove',
		waitList: 'waitList'
	});

	// @vue/component
	const WaitListItemActionsPopup = {
		name: 'WaitListItemActionsPopup',
		components: {
			ActionsPopup: booking_component_actionsPopup.ActionsPopup,
			FullForm: booking_component_actionsPopup.FullForm,
			WaitListItemClient,
			WaitListItemConfirmation,
			WaitListItemDeal,
			WaitListItemDocument,
			WaitListItemMessage,
			WaitListItemRemove,
			WaitListItemVisit
		},
		props: {
			/**
			 * @type {WaitListItemModel}
			 */
			waitListItem: {
				type: Object,
				required: true
			},
			bindElement: {
				type: HTMLElement,
				required: true
			}
		},
		emits: ['close'],
		computed: {
			config() {
				return {
					offsetTop: -100,
					offsetLeft: -315,
					className: 'booking--wait-list--wait-list-item--sticky-popup'
				};
			},
			contentStructure() {
				const waitListItemId = this.waitListItem.id;
				return [{
					id: ActionsPopupActionEnum$1.client,
					props: {
						waitListItemId
					},
					component: WaitListItemClient
				}, [{
					id: ActionsPopupActionEnum$1.deal,
					props: {
						waitListItemId
					},
					component: WaitListItemDeal
				}, {
					id: ActionsPopupActionEnum$1.document,
					props: {
						waitListItemId
					},
					component: WaitListItemDocument
				}], [{
					id: ActionsPopupActionEnum$1.fullForm,
					props: {
						bookingId: waitListItemId
					},
					component: booking_component_actionsPopup.FullForm
				}, {
					id: ActionsPopupActionEnum$1.info,
					class: '--shrink',
					props: {
						waitListItemId
					},
					component: booking_component_actionsPopup.Info
				}]];
			}
		},
		// language=Vue
		template: `
		<ActionsPopup
			:popupId="waitListItem.id"
			:bindElement="bindElement"
			:contentStructure="contentStructure"
			:popupOptions="config"
			@close="$emit('close')"
		>
			<template #footer>
				<WaitListItemRemove
					:waitListItemId="waitListItem.id"
					@close="$emit('close')"
				/>
			</template>
		</ActionsPopup>
	`
	};

	// @vue/component
	const WaitListItemActions = {
		name: 'WaitListItemActions',
		components: {
			WaitListItemActionsPopup
		},
		props: {
			/**
			 * @type {WaitListItemModel}
			 */
			waitListItem: {
				type: Object,
				required: true
			}
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				editingWaitListItemId: `${booking_const.Model.Interface}/editingWaitListItemId`,
				isEditingBookingMode: `${booking_const.Model.Interface}/isEditingBookingMode`,
				isMenuOpenedForWaitListItem: `${booking_const.Model.Interface}/isMenuOpenedForWaitListItem`
			})
		},
		async mounted() {
			if (this.isEditingBookingMode && this.editingWaitListItemId === this.waitListItem.id) {
				await this.$store.dispatch(`${booking_const.Model.Interface}/setMenuOpenedForWaitListItem`, this.waitListItem.id);
			}
		},
		methods: {
			async clickHandler() {
				const currentId = this.waitListItem.id;
				const waitListItemId = this.isMenuOpenedForWaitListItem(currentId) ? 0 : currentId;
				await this.$store.dispatch(`${booking_const.Model.Interface}/setMenuOpenedForWaitListItem`, waitListItemId);
			},
			async onClose() {
				if (this.isMenuOpenedForWaitListItem(this.waitListItem.id)) {
					await this.$store.dispatch(`${booking_const.Model.Interface}/setMenuOpenedForWaitListItem`, 0);
				}
			}
		},
		template: `
		<div
			ref="node"
			class="booking-booking-booking-actions booking--wait-list-item-actions"
			data-element="booking-wait-list-item-actions-button"
			:data-id="waitListItem.id"
			@click="clickHandler"
		>
		</div>
		<WaitListItemActionsPopup
			v-if="isMenuOpenedForWaitListItem(waitListItem.id)"
			:waitListItem
			:bindElement="$refs.node"
			@close="onClose()"
		/>
	`
	};

	// @vue/component
	const WaitListItemAddClient = {
		name: 'WaitListItemAddClient',
		components: {
			BookingCardAddClient: booking_component_bookingCard.AddClient
		},
		props: {
			/** @type{ WaitListCardDataService } */
			cardDataService: {
				type: Object,
				required: true
			}
		},
		computed: {
			dataAttributes() {
				return this.cardDataService.buildDataAttributes('booking-booking-card-add-client-button');
			}
		},
		template: `
		<BookingCardAddClient
			:dataAttributes
			:popupOffsetLeft="-300"
			@add="(clients) => cardDataService.addClients(clients)"
		/>
	`
	};

	class WaitListCardDataService extends booking_component_bookingCard.AbstractCardDataService {
		get dataKindAttribute() {
			return booking_const.EntityDataAttribute.WaitListItem;
		}
		get item() {
			return this.$store.getters[`${booking_const.Model.WaitList}/getById`](this.itemId);
		}
		get primaryClient() {
			const primaryClientData = this.item.clients?.[0];
			if (!primaryClientData) {
				return null;
			}
			return this.$store.getters[`${booking_const.Model.Clients}/getByClientData`](primaryClientData);
		}
		createDealHelper() {
			return new booking_lib_dealHelper.WaitListDealHelper(this.itemId);
		}
		get skus() {
			const deal = this.item.externalData?.find(data => data.entityTypeId === booking_const.CrmEntity.Deal);
			if (!deal) {
				return [];
			}
			const opportunity = Number(deal.data?.opportunity);
			const currencyId = deal.data?.currencyId;
			if (!Number.isFinite(opportunity) || !currencyId) {
				return [];
			}
			return [{
				id: deal.value ?? this.itemId,
				name: '',
				price: opportunity,
				currencyId
			}];
		}
		async saveNote(note) {
			await booking_provider_service_waitListService.waitListService.update({
				id: this.itemId,
				note
			});
		}
		async addClients(clients) {
			await booking_provider_service_waitListService.waitListService.update({
				id: this.itemId,
				clients
			});
		}
	}

	// @vue/component
	const WaitListItem = {
		name: 'WaitListItem',
		components: {
			BookingCard: booking_component_bookingCard.BookingCard,
			WaitListItemActions,
			WaitListItemAddClient
		},
		props: {
			/** @type {WaitListItemModel} */
			item: {
				type: Object,
				required: true
			}
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				editingWaitListItemId: `${booking_const.Model.Interface}/editingWaitListItemId`,
				isEditingBookingMode: `${booking_const.Model.Interface}/isEditingBookingMode`,
				isWaitListItemCreatedFromEmbed: `${booking_const.Model.Interface}/isWaitListItemCreatedFromEmbed`,
				animationPause: `${booking_const.Model.Interface}/animationPause`,
				isMenuOpenedForWaitListItem: `${booking_const.Model.Interface}/isMenuOpenedForWaitListItem`,
				isWeekMode: `${booking_const.Model.Interface}/isWeekMode`
			}),
			cardDataService() {
				return new WaitListCardDataService(this.item.id);
			},
			isReal() {
				return booking_lib_isRealId.isRealId(this.item.id);
			},
			disabled() {
				return this.isEditingBookingMode && this.editingWaitListItemId !== this.item.id;
			},
			hasAccent() {
				return this.editingWaitListItemId === this.item.id || this.isWaitListItemCreatedFromEmbed(this.item.id) || this.isMenuOpenedForWaitListItem(this.item.id);
			},
			dataAttributes() {
				return this.cardDataService.buildDataAttributes('booking-booking-card-container');
			}
		},
		template: `
		<BookingCard
			:classes="[
				'booking-wait-list-item',
				{
					'booking--draggable-item': this.isReal,
					'--not-real': !this.isReal,
					'--disabled': disabled,
					'--accent': hasAccent,
					'no-transition': animationPause,
				},
			]"
			:disabled
			:dataAttributes
			:cardDataService
			:isMinimalView="true"
		>
			<template #lower-content-row>
				<div class="booking--wait-list-item--space"></div>
			</template>
			<template #add-client-button>
				<WaitListItemAddClient :cardDataService/>
			</template>
			<template #actions>
				<WaitListItemActions :waitListItem="item"/>
			</template>
		</BookingCard>
	`
	};

	// @vue/component
	const ButtonAddWaitListItem = {
		name: 'ButtonAddWaitListItem',
		components: {
			UiButton: booking_component_button.Button
		},
		setup() {
			return {
				ButtonColor: booking_component_button.ButtonColor,
				ButtonSize: booking_component_button.ButtonSize,
				Outline: ui_iconSet_api_core.Outline
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				embedItems: `${booking_const.Model.Interface}/embedItems`,
				isLoaded: `${booking_const.Model.Interface}/isLoaded`,
				isEditingBookingMode: `${booking_const.Model.Interface}/isEditingBookingMode`,
				waitListItems: `${booking_const.Model.WaitList}/get`,
				waitListExpanded: `${booking_const.Model.Interface}/waitListExpanded`
			}),
			featureEnabled() {
				return this.$store.state[booking_const.Model.Interface].enabledFeature.bookingWaitlist;
			},
			addButtonText() {
				return this.isLoaded && this.waitListItems.length === 0 ? this.loc('BOOKING_BOOKING_WAIT_LIST_ADD').replace('[plus]', this.featureEnabled ? '+' : '') : '+';
			},
			disabled() {
				return this.isEditingBookingMode || !this.isLoaded;
			},
			clients() {
				const clients = this.embedItems.filter(item => {
					return item.entityTypeId === 'CONTACT' || item.entityTypeId === 'COMPANY';
				});
				return clients.map(item => {
					return {
						id: item.value,
						type: {
							code: item.entityTypeId,
							module: item.moduleId
						}
					};
				});
			}
		},
		methods: {
			async addWaitListItem() {
				if (this.disabled || !this.isLoaded) {
					return;
				}
				if (!this.featureEnabled) {
					void booking_lib_limit.limit.show(booking_const.LimitFeatureId.Waitlist);
					return;
				}
				if (!this.waitListExpanded) {
					await this.expandWaitListWidget();
				}
				const now = Date.now();
				const id = `tmp-id-${now}-${main_core.Text.getRandom(4)}`;
				await this.addCreatedFromEmbedWaitListItem(id);
				const result = await booking_provider_service_waitListService.waitListService.add({
					id,
					clients: this.clients,
					externalData: this.embedItems,
					createdAt: now,
					updatedAt: now
				});
				if (result.success && result.waitListItem) {
					booking_lib_analytics.WaitListAnalytics.sendAddBooking();
					await this.addCreatedFromEmbedWaitListItem(result.waitListItem.id);
				}
			},
			async addCreatedFromEmbedWaitListItem(id) {
				await this.$store.dispatch(`${booking_const.Model.Interface}/addCreatedFromEmbedWaitListItem`, id);
			},
			async expandWaitListWidget() {
				await this.$store.commit('interface/setWaitListExpanded', true);
			}
		},
		template: `
		<UiButton
			class="booking-wait-list-add"
			:buttonClass="featureEnabled ? '' : 'booking-wait-list-add-locked'"
			:text="addButtonText"
			:size="ButtonSize.EXTRA_SMALL"
			:color="ButtonColor.SECONDARY_LIGHT"
			:disabled
			:icon="featureEnabled ? '' : Outline.LOCK_S"
			round
			@click="addWaitListItem"
		/>
	`
	};

	// @vue/component
	const WaitList = {
		name: 'WaitList',
		components: {
			Icon: ui_iconSet_api_vue.BIcon,
			ButtonAddWaitListItem,
			WaitListLayout,
			WaitListGroups,
			WaitListItem
		},
		setup() {
			return {
				IconSet: ui_iconSet_api_vue.Set
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				waitListItems: `${booking_const.Model.WaitList}/get`,
				waitListExpanded: `${booking_const.Model.Interface}/waitListExpanded`,
				draggedBookingId: `${booking_const.Model.Interface}/draggedBookingId`,
				draggedBookingResourceId: `${booking_const.Model.Interface}/draggedBookingResourceId`,
				editingBookingId: `${booking_const.Model.Interface}/editingBookingId`,
				editingWaitListItemId: `${booking_const.Model.Interface}/editingWaitListItemId`,
				isFeatureEnabled: `${booking_const.Model.Interface}/isFeatureEnabled`,
				embedItems: `${booking_const.Model.Interface}/embedItems`
			}),
			featureEnabled() {
				return this.$store.state[booking_const.Model.Interface].enabledFeature.bookingWaitlist;
			},
			isEmpty() {
				return this.waitListItems.length === 0;
			},
			isAvailableDropToWaitList() {
				return Boolean(this.draggedBookingId) && booking_lib_drag.dragPolicy.canMoveBookingOnCheckList({
					draggedBookingId: this.draggedBookingId,
					draggedBookingResourceId: this.draggedBookingResourceId
				});
			},
			showEmptyState() {
				return this.isEmpty && !this.draggedBookingId;
			},
			embedEditingMode() {
				return this.isFeatureEnabled && (this.editingBookingId > 0 || this.editingWaitListItemId > 0 || (this.embedItems?.length ?? 0) > 0);
			}
		},
		watch: {
			// wait list can be expanded externally (currently in ButtonAddWaitListItem)
			async waitListExpanded(newValue, oldValue) {
				if (newValue !== oldValue) {
					await booking_provider_service_optionService.optionService.setBool(booking_const.Option.WaitListExpanded, newValue);
				}
			}
		},
		methods: {
			async onMouseUp() {
				if (!this.isAvailableDropToWaitList) {
					return;
				}
				const bookingId = this.draggedBookingId;
				if (!this.featureEnabled) {
					main_core.Event.EventEmitter.emit(booking_const.EventName.StartLockedBookingAnimation, {
						bookingId,
						featureId: booking_const.LimitFeatureId.Waitlist
					});
					return;
				}
				await booking_lib_drag.dragActions.moveBookingToWaitList(bookingId);
			},
			async collapseToggle() {
				await this.$store.dispatch(`${booking_const.Model.Interface}/setWaitListExpanded`, !this.waitListExpanded);
			}
		},
		template: `
		<WaitListLayout
			:dragging="isAvailableDropToWaitList"
			:showEmptyState
			:expanded="waitListExpanded"
			:waitListItemsCount="waitListItems.length"
			:waitListClass="{
				'--expand': waitListExpanded,
				'embed-editing-mode': embedEditingMode,
			}"
			@mouseUp="onMouseUp"
		>
			<template #header>
				<ButtonAddWaitListItem/>
				<div class="booking-sidebar-button" @click="collapseToggle">
					<Icon :name="waitListExpanded ? IconSet.COLLAPSE : IconSet.EXPAND_1"/>
				</div>
			</template>
			<template #waitlist>
				<WaitListGroups>
					<template #item="{ item }">
						<WaitListItem :item/>
					</template>
				</WaitListGroups>
			</template>
		</WaitListLayout>
	`
	};

	// @vue/component
	const Sidebar = {
		components: {
			Calendar,
			WaitList
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				isWeekMode: `${booking_const.Model.Interface}/isWeekMode`
			})
		},
		template: `
		<div class="booking-booking-sidebar">
			<Calendar :key="isWeekMode"/>
			<WaitList/>
		</div>
	`
	};

	// @vue/component
	const TimeScale = {
		name: 'TimeScale',
		props: {
			fromHour: {
				type: Number,
				required: true
			},
			toHour: {
				type: Number,
				required: true
			},
			offHoursExpanded: {
				type: Boolean,
				required: true
			}
		},
		setup() {
			return {
				HoursInDay: booking_lib_grid.HoursInDay
			};
		},
		computed: {
			hours() {
				const timeFormat = main_date.DateTimeFormat.getFormat('SHORT_TIME_FORMAT');
				const lastHour = this.offHoursExpanded ? booking_lib_grid.HoursInDay : this.toHour;
				return booking_lib_range.range(0, booking_lib_grid.HoursInDay).map(hour => {
					const timestamp = new Date().setHours(hour, 0) / 1000;
					return {
						value: hour,
						formatted: main_date.DateTimeFormat.format(timeFormat, timestamp),
						offHours: hour < this.fromHour || hour >= this.toHour,
						last: hour === lastHour
					};
				});
			}
		},
		template: `
		<div class="booking-booking-time-scale">
			<template v-for="hour of hours" :key="hour.value">
				<div
					v-if="hour.last"
					class="booking-booking-time-scale__label"
				>
					{{ hour.formatted }}
				</div>
				<div
					v-if="hour.value !== HoursInDay"
					class="booking-booking-time-scale__row"
					:class="{ '--off-hours': hour.offHours }"
				>
					<div class="booking-booking-time-scale__label">
						{{ hour.formatted }}
					</div>
					<slot name="row" :hour="hour"></slot>
				</div>
			</template>
		</div>
	`
	};

	const cellHeight = 50;
	const cellHeightProperty = '--booking-off-hours-cell-height';
	const classCollapse = '--booking-booking-collapse';
	const classExpand = '--booking-booking-expand';
	class ExpandOffHours {
		#animation;
		get #container() {
			return booking_core.Core.getParams().container;
		}
		get #content() {
			return BX('booking-content');
		}
		get #gridWrap() {
			return BX('booking-booking-grid-wrap');
		}
		get #fromHour() {
			return booking_core.Core.getStore().getters['interface/fromHour'];
		}
		get #toHour() {
			return booking_core.Core.getStore().getters['interface/toHour'];
		}
		expand({
			keepScroll
		}) {
			main_core.Dom.removeClass(this.#container, classCollapse);
			main_core.Dom.addClass(this.#container, classExpand);
			this.animate(0, cellHeight, keepScroll);
		}
		collapse() {
			main_core.Dom.removeClass(this.#container, classExpand);
			main_core.Dom.addClass(this.#container, classCollapse);
			this.animate(cellHeight, 0, true);
		}
		animate(fromHeight, toHeight, keepScroll = false) {
			const savedScrollTop = this.#gridWrap.scrollTop;
			const savedScrollHeight = this.#gridWrap.scrollHeight;
			const topCellsCoefficient = this.#fromHour / (24 - (this.#toHour - this.#fromHour));
			this.#animation?.stop();
			this.#animation = new BX.easing({
				duration: 200,
				start: {
					height: fromHeight
				},
				finish: {
					height: toHeight
				},
				step: ({
					height
				}) => {
					main_core.Dom.style(this.#content, cellHeightProperty, `calc(var(--zoom) * ${height}px)`);
					if (keepScroll) {
						const heightChange = this.#gridWrap.scrollHeight - savedScrollHeight;
						this.#gridWrap.scrollTop = savedScrollTop + heightChange * topCellsCoefficient;
					}
				}
			});
			this.#animation.animate();
		}
		setExpanded(isExpanded) {
			const savedScrollTop = this.#gridWrap.scrollTop;
			const savedScrollHeight = this.#gridWrap.scrollHeight;
			const topCellsCoefficient = this.#fromHour / (24 - (this.#toHour - this.#fromHour));
			const height = isExpanded ? cellHeight : 0;
			const className = isExpanded ? classExpand : classCollapse;
			main_core.Dom.removeClass(this.#container, [classCollapse, classExpand]);
			main_core.Dom.addClass(this.#container, className);
			main_core.Dom.style(this.#content, cellHeightProperty, `calc(var(--zoom) * ${height}px)`);
			const heightChange = this.#gridWrap.scrollHeight - savedScrollHeight;
			this.#gridWrap.scrollTop = savedScrollTop + heightChange * topCellsCoefficient;
			void booking_core.Core.getStore().dispatch(`${booking_const.Model.Interface}/setOffHoursExpanded`, isExpanded);
		}
	}
	const expandOffHours = new ExpandOffHours();

	const OffHours$1 = {
		props: {
			bottom: {
				type: Boolean,
				default: false
			}
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				offHoursHover: 'interface/offHoursHover',
				offHoursExpanded: 'interface/offHoursExpanded',
				fromHour: 'interface/fromHour',
				toHour: 'interface/toHour'
			}),
			fromFormatted() {
				if (this.bottom) {
					return this.formatHour(this.toHour);
				}
				return this.formatHour(0);
			},
			toFormatted() {
				if (this.bottom) {
					return this.formatHour(24);
				}
				return this.formatHour(this.fromHour);
			}
		},
		methods: {
			formatHour(hour) {
				const timeFormat = main_date.DateTimeFormat.getFormat('SHORT_TIME_FORMAT');
				const timestamp = new Date().setHours(hour, 0) / 1000;
				return main_date.DateTimeFormat.format(timeFormat, timestamp);
			},
			animateOffHours({
				keepScroll
			}) {
				if (this.offHoursExpanded) {
					expandOffHours.collapse();
				} else {
					expandOffHours.expand({
						keepScroll
					});
				}
				void this.$store.dispatch('interface/setOffHoursExpanded', !this.offHoursExpanded);
			}
		},
		template: `
		<div
			class="booking-booking-off-hours"
			:class="{'--hover': offHoursHover, '--bottom': bottom, '--top': !bottom}"
			@click="animateOffHours({ keepScroll: bottom })"
			@mouseenter="$store.dispatch('interface/setOffHoursHover', true)"
			@mouseleave="$store.dispatch('interface/setOffHoursHover', false)"
		>
			<div class="booking-booking-off-hours-border"></div>
			<span>{{ fromFormatted }}</span>
			<span>{{ toFormatted }}</span>
		</div>
	`
	};

	const HelpPopup = {
		name: 'HelpPopup',
		components: {
			RichLoc: ui_vue3_components_richLoc.RichLoc,
			StickyPopup: booking_component_popup.StickyPopup
		},
		emits: ['close'],
		props: {
			bindElement: {
				type: HTMLElement,
				required: true
			}
		},
		computed: {
			popupId() {
				return 'booking-quick-filter-help-popup';
			},
			config() {
				return {
					className: 'booking-quick-filter-help-popup',
					bindElement: this.bindElement,
					offsetLeft: this.bindElement.offsetWidth,
					offsetTop: this.bindElement.offsetHeight,
					maxWidth: 220
				};
			}
		},
		methods: {
			closePopup() {
				this.$emit('close');
			}
		},
		template: `
		<StickyPopup
			:id="popupId"
			:config="config"
			@close="closePopup"
		>
			<div class="booking-quick-filter-help-popup-content">
				<div class="booking-quick-filter-help-popup-icon-container">
					<div class="booking-quick-filter-help-popup-icon"></div>
				</div>
				<div class="booking-quick-filter-help-popup-description">
					<RichLoc :text="loc('BOOKING_QUICK_FILTER_HELP_MSGVER_1')" placeholder="[bold]">
						<template #bold="{ text }">
							<span>{{ text }}</span>
						</template>
					</RichLoc>
				</div>
			</div>
		</StickyPopup>
	`
	};

	const QuickFilter = {
		props: {
			hour: {
				type: Number,
				required: true
			}
		},
		setup() {
			return {
				IconSet: ui_iconSet_api_vue.Set
			};
		},
		data() {
			return {
				isHelpPopupShown: false
			};
		},
		computed: {
			active() {
				return this.hour in this.$store.getters[`${booking_const.Model.Filter}/quickFilter`].active;
			},
			hovered() {
				return this.hour in this.$store.getters[`${booking_const.Model.Filter}/quickFilter`].hovered;
			}
		},
		methods: {
			onClick() {
				this.closeHelpPopup();
				if (this.active) {
					void this.$store.dispatch(`${booking_const.Model.Filter}/deactivateQuickFilter`, this.hour);
				} else {
					void this.$store.dispatch(`${booking_const.Model.Filter}/activateQuickFilter`, this.hour);
				}
			},
			hover() {
				this.helpPopupTimeout = setTimeout(() => this.showHelpPopup(), 1000);
				void this.$store.dispatch(`${booking_const.Model.Filter}/hoverQuickFilter`, this.hour);
			},
			flee() {
				this.closeHelpPopup();
				void this.$store.dispatch(`${booking_const.Model.Filter}/fleeQuickFilter`, this.hour);
			},
			showHelpPopup() {
				this.isHelpPopupShown = true;
			},
			closeHelpPopup() {
				clearTimeout(this.helpPopupTimeout);
				this.isHelpPopupShown = false;
			}
		},
		components: {
			Icon: ui_iconSet_api_vue.BIcon,
			HelpPopup
		},
		template: `
		<div
			class="booking-booking-quick-filter-container"
			:class="{'--hover': hovered || active, '--active': active}"
		>
			<div
				class="booking-booking-quick-filter"
				@mouseenter="hover"
				@mouseleave="flee"
				@click="onClick"
			>
				<Icon :name="active ? IconSet.CROSS_25 : IconSet.FUNNEL"/>
			</div>
			<HelpPopup
				v-if="isHelpPopupShown"
				:bindElement="$el"
				@close="closeHelpPopup"
			/>
		</div>
	`
	};

	const LeftPanel = {
		computed: {
			...ui_vue3_vuex.mapGetters({
				offHoursExpanded: 'interface/offHoursExpanded',
				fromHour: 'interface/fromHour',
				toHour: 'interface/toHour'
			})
		},
		components: {
			TimeScale,
			OffHours: OffHours$1,
			QuickFilter
		},
		template: `
		<div class="booking-booking-grid-left-panel-container">
			<div class="booking-booking-grid-left-panel">
				<OffHours/>
				<OffHours :bottom="true"/>
				<TimeScale
					:fromHour="fromHour"
					:toHour="toHour"
					:offHoursExpanded="offHoursExpanded"
				>
					<template #row="{ hour }">
						<QuickFilter :hour="hour.value"/>
					</template>
				</TimeScale>
			</div>
		</div>
	`
	};

	// @vue/component
	const NowLine = {
		name: 'NowLine',
		data() {
			return {
				visible: true
			};
		},
		created() {
			this.intervalId = null;
		},
		computed: ui_vue3_vuex.mapGetters({
			zoom: `${booking_const.Model.Interface}/zoom`,
			selectedDateTs: `${booking_const.Model.Interface}/selectedDateTs`,
			offHoursExpanded: `${booking_const.Model.Interface}/offHoursExpanded`,
			fromHour: `${booking_const.Model.Interface}/fromHour`,
			toHour: `${booking_const.Model.Interface}/toHour`,
			offset: `${booking_const.Model.Interface}/offset`,
			isWeekMode: `${booking_const.Model.Interface}/isWeekMode`,
			selectedFirstDayPeriodTs: `${booking_const.Model.Interface}/selectedFirstDayPeriodTs`,
			scroll: `${booking_const.Model.Interface}/scroll`
		}),
		watch: {
			scroll(value) {
				this.updateNowLine();
			},
			selectedDateTs() {
				this.updateNowLine();
			},
			zoom() {
				this.updateNowLine();
			},
			offHoursExpanded(offHoursExpanded) {
				if (this.isWeekMode) {
					return;
				}
				const now = new Date();
				const nowMinutes = now.getHours() * 60 + now.getMinutes();
				if (nowMinutes < this.toHour * 60) {
					return;
				}
				this.setVisible(!offHoursExpanded);
				setTimeout(() => this.setVisible(true), 200);
			}
		},
		mounted() {
			this.updateNowLine();
			this.intervalId = setInterval(() => this.updateNowLine(), 1000);
		},
		beforeUnmount() {
			if (this.intervalId) {
				clearInterval(this.intervalId);
				this.intervalId = null;
			}
		},
		methods: {
			setVisible(visible) {
				this.visible = visible;
				this.updateNowLine();
			},
			updateNowLine() {
				if (this.isWeekMode) {
					this.updateWeekNowLine();
				} else {
					this.updateDayNowLine();
				}
			},
			updateDayNowLine() {
				const now = new Date(Date.now() + this.offset);
				const hourHeight = 50 * this.zoom;
				const fromMinutes = this.fromHour * 60;
				const nowMinutes = now.getHours() * 60 + now.getMinutes();
				const toHour = this.offHoursExpanded ? 24 : this.toHour;
				const toMinutes = Math.min(toHour * 60 + 21, nowMinutes);
				const top = (toMinutes - fromMinutes) * (hourHeight / 60);
				main_core.Dom.style(this.$refs.nowLine, 'top', `${top}px`);
				main_core.Dom.style(this.$refs.nowLine, 'left', '');
				this.updateTimeText(now);
				this.updateDayVisibility(now);
			},
			updateWeekNowLine() {
				const now = new Date(Date.now() + this.offset);
				const weekStart = new Date(this.selectedFirstDayPeriodTs + this.offset);
				const weekStartMidnight = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
				const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
				const diffDays = Math.round((nowMidnight - weekStartMidnight) / (24 * 60 * 60 * 1000));
				const isInWeek = diffDays >= 0 && diffDays < 7;
				if (!isInWeek || !this.visible) {
					main_core.Dom.style(this.$refs.nowLine, 'display', 'none');
					return;
				}
				const weekHourWidth = booking_lib_grid.gridTokens.get(booking_lib_grid.GridTokenKey.WeekHourWidth);
				const hourOffset = (now.getHours() + now.getMinutes() / 60) * weekHourWidth * this.zoom;
				const left = diffDays * booking_lib_grid.gridTokens.get(booking_lib_grid.GridTokenKey.WeekCellWidth) * this.zoom + hourOffset;
				const top = booking_lib_grid.gridTokens.get(booking_lib_grid.GridTokenKey.WeekDaysPanelHeight) + this.scroll;
				main_core.Dom.style(this.$refs.nowLine, 'top', `${top}px`);
				main_core.Dom.style(this.$refs.nowLine, 'left', `${left}px`);
				main_core.Dom.style(this.$refs.nowLine, 'display', '');
				this.updateTimeText(now);
			},
			updateTimeText(now) {
				const timeFormat = main_date.DateTimeFormat.getFormat('SHORT_TIME_FORMAT');
				const timeFormatted = main_date.DateTimeFormat.format(timeFormat, now.getTime() / 1000);
				if (timeFormatted !== this.$refs.nowText.innerText) {
					this.$refs.nowText.innerText = timeFormatted;
				}
			},
			updateDayVisibility(now) {
				const date = new Date(this.selectedDateTs + this.offset);
				const visible = this.visible && Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) === Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
				main_core.Dom.style(this.$refs.nowLine, 'display', visible ? '' : 'none');
			}
		},
		template: `
		<div class="booking-booking-grid-now-line" ref="nowLine">
			<div class="booking-booking-grid-now-line-text" ref="nowText"></div>
		</div>
	`
	};

	const MinUiBookingDurationMs = 15 * 60 * 1000;

	function getBookingUiSlot({
		dateFromTs,
		dateToTs
	}) {
		const duration = dateToTs - dateFromTs;
		return [dateFromTs, duration < MinUiBookingDurationMs ? dateFromTs + MinUiBookingDurationMs : dateToTs];
	}
	function createBookingModelUi(resourceId, booking, overbookingMapItem) {
		return {
			...booking,
			resourcesIds: [resourceId],
			uiSlot: getBookingUiSlot(booking),
			overbooking: overbookingMapItem?.items?.some(item => {
				return item.resourceId === resourceId && item.shifted;
			})
		};
	}
	function splitBookingsByResourceId(bookings) {
		const resourceBookingsMap = new Map();
		for (const booking of bookings) {
			const resourceId = booking.resourcesIds?.[0] || 0;
			let resourceBookings = [];
			if (resourceBookingsMap.has(resourceId)) {
				resourceBookings = resourceBookingsMap.get(resourceId) || [];
			}
			resourceBookings.push(booking);
			resourceBookingsMap.set(resourceId, resourceBookings);
		}
		return resourceBookingsMap;
	}
	function groupBookingUis(bookings) {
		const groups = [];
		if (bookings.length === 0) {
			return groups;
		}
		let group = {
			slot: [0, 0],
			bookingIds: []
		};
		bookings.filter(booking => !booking.overbooking).map(booking => {
			return {
				id: booking.id,
				uiSlot: booking.uiSlot
			};
		}).sort((a, b) => a.uiSlot[0] - b.uiSlot[0]).forEach(booking => {
			if (group.bookingIds.length === 0) {
				group.slot = [booking.uiSlot[0], booking.uiSlot[1]];
			} else if (booking_lib_inInterval.inInterval(booking.uiSlot[0], group.slot)) {
				group.slot[1] = booking.uiSlot[1];
			} else {
				groups.push(group);
				group = {
					slot: [booking.uiSlot[0], booking.uiSlot[1]],
					bookingIds: []
				};
			}
			group.bookingIds.push(booking.id);
		});
		groups.push(group);
		return groups;
	}
	function getResourceBookingUiGroups(resourceBookingsMap) {
		const resourceBookingUiGroups = new Map();
		if (resourceBookingsMap instanceof Map) {
			[...resourceBookingsMap.keys()].forEach(resourceId => {
				const bookingGroups = groupBookingUis(resourceBookingsMap.get(resourceId) || []);
				resourceBookingUiGroups.set(resourceId, bookingGroups);
			});
		}
		return resourceBookingUiGroups;
	}

	// @vue/component
	const BusyPopup = {
		name: 'BusyPopup',
		components: {
			Popup: booking_component_popup.Popup
		},
		props: {
			busySlot: {
				type: Object,
				required: true
			}
		},
		emits: ['close'],
		computed: {
			...ui_vue3_vuex.mapGetters({
				offset: `${booking_const.Model.Interface}/offset`,
				mousePosition: `${booking_const.Model.Interface}/mousePosition`
			}),
			resource() {
				const resourceId = this.busySlot.type === booking_const.BusySlot.Intersection ? this.busySlot.intersectingResourceId : this.busySlot.resourceId;
				return this.$store.getters[`${booking_const.Model.Resources}/getById`](resourceId);
			},
			popupId() {
				return `booking-booking-busy-popup-${this.busySlot.resourceId}`;
			},
			config() {
				const width = 200;
				const angleLeft = main_popup.Popup.getOption('angleMinBottom');
				const angleOffset = width / 2 - angleLeft;
				return {
					bindElement: this.mousePosition,
					width,
					background: '#2878ca',
					offsetTop: -5,
					offsetLeft: -angleOffset + angleLeft,
					bindOptions: {
						forceBindPosition: true,
						position: 'top'
					},
					angle: {
						offset: angleOffset,
						position: 'bottom'
					},
					angleBorderRadius: '4px 0',
					autoHide: false
				};
			},
			textFormatted() {
				const timeFormat = main_date.DateTimeFormat.getFormat('SHORT_TIME_FORMAT');
				const messageId = this.getPopupMessageId(this.busySlot.type);
				return this.loc(messageId, {
					'#RESOURCE#': this.resource.name,
					'#TIME_FROM#': main_date.DateTimeFormat.format(timeFormat, (this.busySlot.fromTs + this.offset) / 1000),
					'#TIME_TO#': main_date.DateTimeFormat.format(timeFormat, (this.busySlot.toTs + this.offset) / 1000)
				});
			}
		},
		watch: {
			mousePosition: {
				handler() {
					this.adjustPosition();
				},
				deep: true
			}
		},
		methods: {
			getPopupMessageId(slotType) {
				if (slotType === booking_const.BusySlot.Intersection) {
					return 'BOOKING_BOOKING_INTERSECTING_RESOURCE_IS_BUSY';
				}
				if (slotType === booking_const.BusySlot.IntersectionOverbooking) {
					return 'BOOKING_BOOKING_INTERSECTING_RESOURCE_IS_FULL_BUSY';
				}
				return 'BOOKING_BOOKING_RESOURCE_IS_BUSY';
			},
			adjustPosition() {
				const popup = this.$refs.popup?.getPopupInstance();
				if (!popup) {
					return;
				}
				popup.setBindElement(this.mousePosition);
				popup.adjustPosition();
			},
			closePopup() {
				this.$emit('close');
			}
		},
		template: `
		<Popup
			v-if="mousePosition.left !== 0 && mousePosition.top !== 0"
			:id="popupId"
			:config="config"
			ref="popup"
			@close="closePopup"
		>
			<div class="booking-booking-busy-popup">
				{{ textFormatted }}
			</div>
		</Popup>
	`
	};

	const BookingBusySlotClassName = 'booking-booking-busy-slot';

	// @vue/component
	const UiBusySlot = {
		name: 'UiBusySlot',
		components: {
			BusyPopup
		},
		props: {
			busySlot: {
				type: Object,
				required: true
			},
			positionStyle: {
				type: Object,
				required: true
			},
			isDisabled: {
				type: Boolean,
				default: false
			},
			isVisible: {
				type: Boolean,
				default: true
			}
		},
		emits: ['click'],
		setup() {
			return {
				BookingBusySlotClassName,
				BusySlotType: booking_const.BusySlot
			};
		},
		data() {
			return {
				isPopupShown: false
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				isDragMode: `${booking_const.Model.Interface}/isDragMode`
			})
		},
		methods: {
			onClick() {
				this.$emit('click');
			},
			onMouseEnter() {
				clearTimeout(this.showTimeout);
				this.showTimeout = setTimeout(() => this.showPopup(), 300);
				main_core.Event.unbind(document, 'mousemove', this.onMouseMove);
				main_core.Event.bind(document, 'mousemove', this.onMouseMove);
			},
			onMouseMove(event) {
				if (this.cursorInsideContainer(event.target)) {
					this.updatePopup(event);
				} else {
					main_core.Event.unbind(document, 'mousemove', this.onMouseMove);
					this.closePopup();
				}
			},
			onMouseLeave(event) {
				if (event.relatedTarget?.closest('.popup-window')?.querySelector('.booking-booking-busy-popup')) {
					return;
				}
				main_core.Event.unbind(document, 'mousemove', this.onMouseMove);
				this.closePopup();
			},
			cursorInsideContainer(eventTarget) {
				return !main_core.Type.isNull(eventTarget) && main_core.Dom.hasClass(eventTarget, this.BookingBusySlotClassName);
			},
			updatePopup(event) {
				const rect = this.$refs.container?.getBoundingClientRect();
				if (this.isDragMode || !rect || event.clientY > rect.top + rect.height || event.clientY < rect.top || event.clientX < rect.left || event.clientX > rect.left + rect.width) {
					this.closePopup();
					return;
				}
				this.showTimeout ??= setTimeout(() => this.showPopup(), 300);
			},
			showPopup() {
				this.isPopupShown = true;
			},
			closePopup() {
				clearTimeout(this.showTimeout);
				this.showTimeout = null;
				this.isPopupShown = false;
			}
		},
		template: `
		<div
			v-if="isVisible"
			:class="[BookingBusySlotClassName, {
				'--disabled': isDisabled,
			}]"
			:style="{
				...positionStyle,
				'z-index': busySlot.type === BusySlotType.IntersectionOverbooking ? 2 : 1,
			}"
			data-element="ui-booking-busy-slot"
			:data-id="busySlot.resourceId"
			:data-from="busySlot.fromTs"
			:data-to="busySlot.toTs"
			ref="container"
			@click.stop="onClick"
			@mouseenter.stop="onMouseEnter"
			@mouseleave.stop="onMouseLeave"
		></div>
		<BusyPopup
			v-if="isPopupShown"
			:busySlot="busySlot"
			@close="closePopup"
		/>
	`
	};

	const {
		mapGetters: mapInterfaceGetters$5
	} = ui_vue3_vuex.createNamespacedHelpers(booking_const.Model.Interface);
	const {
		mapGetters: mapFilterGetters$3
	} = ui_vue3_vuex.createNamespacedHelpers(booking_const.Model.Filter);

	// @vue/component
	const BusySlot = {
		name: 'BusySlot',
		components: {
			UiBusySlot
		},
		inject: {
			gridContext: {
				default: null
			}
		},
		props: {
			busySlot: {
				type: Object,
				required: true
			}
		},
		computed: {
			...mapInterfaceGetters$5({
				disabledBusySlots: 'disabledBusySlots',
				isEditingBookingMode: 'isEditingBookingMode',
				isDragMode: 'isDragMode'
			}),
			...mapFilterGetters$3({
				isFilterMode: 'isFilterMode'
			}),
			grid() {
				return booking_lib_grid.GridFactory.getGrid(this.gridContext);
			},
			enabledOverbookingFeature() {
				return this.$store.state[booking_const.Model.Interface].enabledFeature.bookingOverbooking;
			},
			left() {
				return this.grid.calculateLeft(this.busySlot.resourceId);
			},
			top() {
				return this.grid.calculateTop(this.busySlot.fromTs);
			},
			height() {
				return this.grid.calculateHeight(this.busySlot.fromTs, this.busySlot.toTs);
			},
			positionStyle() {
				return {
					'--left': `${this.left}px`,
					'--top': `${this.top}px`,
					'--height': `${this.height}px`
				};
			},
			isVisible() {
				return this.left >= 0;
			},
			isDisabled() {
				const isDragOffHours = this.isDragMode && this.busySlot.type === booking_const.BusySlot.OffHours;
				const isDragOverbooking = this.isDragMode && this.busySlot.type === booking_const.BusySlot.IntersectionOverbooking;
				if (this.isFilterMode || isDragOffHours || isDragOverbooking) {
					return true;
				}
				return this.busySlot.id in this.disabledBusySlots;
			}
		},
		methods: {
			onClick() {
				if (this.isFilterMode || this.isEditingBookingMode || this.busySlot.type === booking_const.BusySlot.IntersectionOverbooking || !this.enabledOverbookingFeature && this.busySlot.type === booking_const.BusySlot.Intersection) {
					return;
				}
				void this.$store.dispatch(`${booking_const.Model.Interface}/addDisabledBusySlot`, this.busySlot);
			}
		},
		template: `
		<UiBusySlot
			:busySlot="busySlot"
			:positionStyle="positionStyle"
			:isDisabled="isDisabled"
			:isVisible="isVisible"
			@click="onClick"
		/>
	`
	};

	/**
	 * @typedef {Object} Cell
	 * @property {string} id
	 * @property {number} fromTs
	 * @property {number} toTs
	 * @property {number} resourceId
	 * @property {boolean} boundedToBottom
	 */
	const BaseCell = {
		inject: {
			gridContext: {
				default: null
			}
		},
		props: {
			/** @type {Cell} */
			cell: {
				type: Object,
				required: true
			},
			className: {
				type: [String, Object],
				default: ''
			},
			fixed: {
				type: Boolean,
				default: true
			},
			compact: {
				type: Boolean,
				default: false
			}
		},
		components: {
			Icon: ui_iconSet_api_vue.BIcon,
			UiButton: booking_component_button.Button
		},
		data() {
			return {
				creatingBookingId: null
			};
		},
		setup() {
			return {
				IconSet: ui_iconSet_api_vue.Set,
				ButtonSize: booking_component_button.ButtonSize,
				ButtonColor: booking_component_button.ButtonColor,
				ButtonIcon: booking_component_button.ButtonIcon
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				selectedPlacementSlots: `${booking_const.Model.Interface}/selectedPlacementSlots`,
				intersections: `${booking_const.Model.Interface}/intersections`,
				timezone: `${booking_const.Model.Interface}/timezone`,
				offset: `${booking_const.Model.Interface}/offset`,
				isFeatureEnabled: `${booking_const.Model.Interface}/isFeatureEnabled`,
				draggedDataTransfer: `${booking_const.Model.Interface}/draggedDataTransfer`,
				embedItems: `${booking_const.Model.Interface}/embedItems`
			}),
			grid() {
				return booking_lib_grid.GridFactory.getGrid(this.gridContext);
			},
			multiSelectEnabled() {
				return this.gridContext?.multiSelectEnabled ?? true;
			},
			selected() {
				return this.multiSelectEnabled && this.cell.id in this.selectedPlacementSlots;
			},
			hasSelectedCells() {
				return this.multiSelectEnabled && Object.keys(this.selectedPlacementSlots).length > 0;
			},
			timeFormatted() {
				const timeFormat = main_date.DateTimeFormat.getFormat('SHORT_TIME_FORMAT');
				return this.loc('BOOKING_BOOKING_TIME_RANGE', {
					'#FROM#': main_date.DateTimeFormat.format(timeFormat, (this.cell.fromTs + this.offset) / 1000),
					'#TO#': main_date.DateTimeFormat.format(timeFormat, (this.cell.toTs + this.offset) / 1000)
				});
			},
			height() {
				return this.grid.calculateRealHeight(this.cell.fromTs, this.cell.toTs);
			},
			externalData() {
				return this.embedItems;
			},
			clients() {
				const clients = this.embedItems.filter(item => {
					return item.entityTypeId === 'CONTACT' || item.entityTypeId === 'COMPANY';
				});
				return clients.map(item => {
					return {
						id: item.value,
						type: {
							code: item.entityTypeId,
							module: item.moduleId
						}
					};
				});
			}
		},
		methods: {
			onCellSelected({
				target: {
					checked
				}
			}) {
				if (!this.isFeatureEnabled) {
					booking_lib_limit.limit.show();
					return;
				}
				if (checked) {
					this.$store.dispatch(`${booking_const.Model.Interface}/addSelectedCell`, this.cell);
				} else {
					this.$store.dispatch(`${booking_const.Model.Interface}/removeSelectedCell`, this.cell);
				}
			},
			onMouseDown() {
				if (!this.isFeatureEnabled) {
					void booking_lib_limit.limit.show();
					return;
				}
				void this.$store.dispatch(`${booking_const.Model.Interface}/setHoveredPlacementSlot`, null);
				this.creatingBookingId = `tmp-id-${Date.now()}-${main_core.Text.getRandom(4)}`;
				void this.$store.dispatch(`${booking_const.Model.Filter}/addQuickFilterIgnoredBookingId`, this.creatingBookingId);
				void this.$store.dispatch(`${booking_const.Model.Bookings}/add`, {
					id: this.creatingBookingId,
					dateFromTs: this.cell.fromTs,
					dateToTs: this.cell.toTs,
					resourcesIds: [...new Set([this.cell.resourceId, ...(this.intersections[0] ?? []), ...(this.intersections[this.cell.resourceId] ?? [])])],
					timezoneFrom: this.timezone,
					timezoneTo: this.timezone,
					externalData: this.externalData,
					clients: this.clients
				});
				main_core.Event.bind(window, 'mouseup', this.addBooking);
			},
			addBooking() {
				main_core.Event.unbind(window, 'mouseup', this.addBooking);
				if (!this.isFeatureEnabled) {
					void booking_lib_limit.limit.show();
					return;
				}
				setTimeout(async () => {
					const creatingBooking = this.$store.getters[`${booking_const.Model.Bookings}/getById`](this.creatingBookingId);
					const result = await booking_provider_service_bookingService.bookingService.add(creatingBooking);
					if (result.success && result.booking) {
						const overbookingMap = this.$store.getters[`${booking_const.Model.Bookings}/overbookingMap`];
						booking_lib_analytics.BookingAnalytics.sendAddBooking({
							isOverbooking: Boolean(overbookingMap?.has?.(result.booking.id))
						});
					}
				});
			}
		},
		template: `
		<div
			class="booking-booking-base-cell"
			:class="[className, {
				'--selected': selected,
				'--bounded-to-bottom': cell.boundedToBottom,
				'--height-is-less-than-40': height < 40,
				'--small': height <= 20,
			}]"
			:style="{
				'--height': height + 'px',
			}"
			data-element="booking-base-cell"
			:data-resource-id="cell.resourceId"
			:data-from="cell.fromTs"
			:data-to="cell.toTs"
			:data-selected="selected"
		>
			<div class="booking-booking-grid-cell-padding">
				<div class="booking-booking-grid-cell-inner">
					<label
						class="booking-booking-grid-cell-time"
						:class="{ '--hidden': !fixed }"
						data-element="booking-grid-cell-select-label"
					>
						<span class="booking-booking-grid-cell-time-inner">
							<input
								v-if="multiSelectEnabled && !draggedDataTransfer.id"
								class="booking-booking-grid-cell-checkbox"
								type="checkbox"
								:checked="selected"
								@change="onCellSelected"
							>
							<span data-element="booking-grid-cell-time">
								{{ timeFormatted }}
							</span>
						</span>
					</label>
					<div
						v-if="fixed && !hasSelectedCells && !draggedDataTransfer.id"
						class="booking-booking-grid-cell-select-button-container"
						ref="button"
						data-element="booking-grid-cell-add-button"
						@mousedown="onMouseDown"
					>
						<UiButton
							:text="(!isFeatureEnabled || compact) ? '' : loc('BOOKING_BOOKING_SELECT')"
							:icon="!isFeatureEnabled ? ButtonIcon.LOCK : (compact ? ButtonIcon.CHEVRON_RIGHT_S : null)"
							:size="compact ? ButtonSize.EXTRA_EXTRA_SMALL : ButtonSize.EXTRA_SMALL"
							:color="isFeatureEnabled ? ButtonColor.PRIMARY : ButtonColor.LIGHT_BORDER"
							:round="true"
							useAirDesign
						/>
					</div>
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const UiRestrictionPopup = {
		name: 'UiRestrictionPopup',
		components: {
			Popup: booking_component_popup.Popup
		},
		props: {
			message: {
				type: String,
				required: true
			},
			popupId: {
				type: String,
				required: true
			}
		},
		emits: ['close'],
		computed: {
			...ui_vue3_vuex.mapGetters({
				mousePosition: `${booking_const.Model.Interface}/mousePosition`
			}),
			config() {
				const width = 200;
				const angleLeft = main_popup.Popup.getOption('angleMinBottom');
				const angleOffset = width / 2 - angleLeft;
				return {
					bindElement: this.mousePosition,
					width,
					background: '#2878ca',
					offsetTop: -5,
					offsetLeft: -angleOffset + angleLeft,
					bindOptions: {
						forceBindPosition: true,
						position: 'top'
					},
					angle: {
						offset: angleOffset,
						position: 'bottom'
					},
					angleBorderRadius: 'var(--ui-border-radius-2xs) 0',
					autoHide: false
				};
			}
		},
		watch: {
			mousePosition: {
				handler() {
					this.adjustPosition();
				},
				deep: true
			}
		},
		methods: {
			adjustPosition() {
				const popup = this.$refs.popup?.getPopupInstance();
				if (!popup) {
					return;
				}
				popup.setBindElement(this.mousePosition);
				popup.adjustPosition();
			},
			closePopup() {
				this.$emit('close');
			}
		},
		template: `
		<Popup
			v-if="mousePosition.left !== 0 && mousePosition.top !== 0"
			:id="popupId"
			:config="config"
			ref="popup"
			@close="closePopup"
		>
			<div class="booking-booking-restriction-popup">
				{{ message }}
			</div>
		</Popup>
	`
	};

	/**
	 * @typedef {Object} Cell
	 * @property {string} id
	 * @property {number} fromTs
	 * @property {number} toTs
	 * @property {number} resourceId
	 * @property {boolean} boundedToBottom
	 *
	 * @vue/component
	 */
	const DayPlacementSlot = {
		name: 'DayPlacementSlot',
		components: {
			BaseCell,
			UiRestrictionPopup
		},
		inject: {
			gridContext: {
				default: null
			}
		},
		props: {
			/** @type {Cell} */
			cell: {
				type: Object,
				required: true
			},
			draggedBooking: {
				type: Object,
				default: null
			}
		},
		data() {
			return {
				overbookingPositionsInCell: []
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				overbookingMap: `${booking_const.Model.Bookings}/overbookingMap`
			}),
			grid() {
				return booking_lib_grid.GridFactory.getGrid(this.gridContext);
			},
			isWeekMode() {
				if (this.gridContext) {
					return this.gridContext.gridMode === booking_const.Grid.Mode.Week;
				}
				return this.$store.getters[`${booking_const.Model.Interface}/isWeekMode`];
			},
			zoom() {
				if (this.gridContext) {
					return this.gridContext.zoom;
				}
				return this.$store.getters[`${booking_const.Model.Interface}/zoom`];
			},
			left() {
				const left = this.grid.calculateLeft(this.cell.resourceId);
				const overbookingPositions = this.overbookingPositionsInCell;
				if (overbookingPositions.length > 1) {
					return -1;
				}
				if (overbookingPositions.length === 0 || overbookingPositions[0]) {
					return left;
				}
				return left + this.grid.calculateWidth(this.width);
			},
			top() {
				return this.grid.calculateTop(this.cell.fromTs);
			},
			height() {
				const fromTs = this.cell.fromTs;
				const draggedBookingDuration = this.draggedBooking ? this.draggedBooking.dateToTs - this.draggedBooking.dateFromTs : Infinity;
				const toTs = draggedBookingDuration < this.cell.toTs - fromTs ? fromTs + draggedBookingDuration : this.cell.toTs;
				return this.grid.calculateHeight(fromTs, toTs);
			},
			width() {
				const dayCellWidth = booking_lib_grid.gridTokens.get(booking_lib_grid.GridTokenKey.DayCellWidth);
				return this.overbookingPositionsInCell.length === 0 ? dayCellWidth : dayCellWidth / 2;
			},
			isRestricted() {
				return this.cell.toTs - this.cell.fromTs > booking_lib_drag.MaxInteractionBookingDurationsMs;
			},
			isRestrictionPopupVisible() {
				return this.restrictionPopupEnabled && this.isRestricted && !this.isWeekMode;
			},
			restrictionPopupEnabled() {
				return this.gridContext?.restrictionPopupEnabled ?? true;
			},
			isVisible() {
				return this.left >= 0 && (!this.isRestricted || this.isRestrictionPopupVisible);
			},
			popupId() {
				return `booking-day-restriction-popup-${this.cell.resourceId}-${this.cell.fromTs}`;
			},
			isCompact() {
				return this.height < 40 || this.zoom < 0.8;
			}
		},
		mounted() {
			this.calcOverbookingPositionsInCell();
		},
		methods: {
			calcOverbookingPositionsInCell() {
				const resourceId = this.cell.resourceId;
				const cellTimespan = {
					dateFromTs: this.cell.fromTs,
					dateToTs: this.cell.toTs
				};
				const positions = [];
				for (const [, overbooking] of this.overbookingMap) {
					const resourceOverbooking = overbooking.items.find(item => item.resourceId === resourceId);
					if (resourceOverbooking && booking_lib_checkBookingIntersection.checkBookingIntersection(overbooking.booking, cellTimespan) && !positions.includes(resourceOverbooking?.shifted)) {
						positions.push(resourceOverbooking?.shifted);
					}
					if (positions.length > 2) {
						break;
					}
				}
				this.overbookingPositionsInCell = positions;
			}
		},
		template: `
		<div
			v-if="isVisible"
			class="booking-booking-selected-cell"
			:style="{
				'--left': left + 'px',
				'--top': top + 'px',
				'--height': height + 'px',
				'--width': width + 'px',
			}"
			@mouseleave="$store.dispatch('interface/setHoveredPlacementSlot', null)"
		>
			<UiRestrictionPopup
				v-if="isRestrictionPopupVisible"
				:message="loc('BOOKING_BOOKING_DAY_CELL_RESTRICTION')"
				:popupId="popupId"
			/>
			<BaseCell
				v-else
				:cell="cell"
				:compact="isCompact"
				:className="{ '--overbooking': overbookingPositionsInCell.length > 0 }"
			/>
		</div>
	`
	};

	const QuickFilterLine = {
		props: {
			hour: {
				type: Number,
				required: true
			}
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				selectedDateTs: `${booking_const.Model.Interface}/selectedDateTs`,
				resourcesIds: `${booking_const.Model.Interface}/resourcesIds`
			}),
			grid() {
				return booking_lib_grid.GridFactory.getGrid();
			},
			top() {
				return this.grid.calculateTop(this.fromTs);
			},
			width() {
				return this.resourcesIds.length * booking_lib_grid.gridTokens.get(booking_lib_grid.GridTokenKey.DayCellWidth);
			},
			fromTs() {
				return new Date(this.selectedDateTs).setHours(this.hour);
			}
		},
		template: `
		<div
			class="booking-booking-quick-filter-line"
			:style="{
				'--top': top + 'px',
				'--width': width + 'px',
			}"
		></div>
	`
	};

	// @vue/component
	const BookingClient = {
		name: 'BookingActionsPopupClient',
		components: {
			Client: booking_component_actionsPopup.Client
		},
		props: {
			bookingId: {
				type: [Number, String],
				required: true
			}
		},
		emits: ['freeze', 'unfreeze'],
		computed: {
			booking() {
				return this.$store.getters['bookings/getById'](this.bookingId);
			}
		},
		methods: {
			async addClients({
				clients
			}) {
				await booking_provider_service_bookingService.bookingService.update({
					id: this.booking.id,
					clients
				});
			},
			async updateClients({
				clients
			}) {
				await booking_provider_service_bookingService.bookingService.update({
					id: this.booking.id,
					clients
				});
			},
			async updateNote({
				note
			}) {
				await booking_provider_service_bookingService.bookingService.update({
					id: this.booking.id,
					note
				});
			}
		},
		template: `
		<Client
			:id="bookingId"
			:clients="booking.clients"
			:primaryClientData="booking.primaryClient"
			:note="booking.note"
			:dataId="bookingId"
			:dateFromTs="booking.dateFromTs"
			:dateToTs="booking.dateToTs"
			:dataAttributes="{
				'data-booking-id': bookingId,
			}"
			dataElementPrefix="booking"
			@freeze="$emit('freeze')"
			@unfreeze="$emit('unfreeze')"
			@addClients="addClients"
			@updateClients="updateClients"
			@updateNote="updateNote"
		/>
	`
	};

	// @vue/component
	const BookingDeal = {
		name: 'BookingActionsPopupDeal',
		components: {
			Deal: booking_component_actionsPopup.Deal
		},
		props: {
			bookingId: {
				type: [Number, String],
				required: true
			}
		},
		emits: ['freeze', 'unfreeze'],
		setup(props) {
			const dealHelper = new booking_lib_dealHelper.BookingDealHelper(props.bookingId);
			return {
				dealHelper
			};
		},
		computed: {
			booking() {
				return this.$store.getters[`${booking_const.Model.Bookings}/getById`](this.bookingId);
			},
			deal() {
				return this.booking.externalData?.find(data => data.entityTypeId === booking_const.CrmEntity.Deal) ?? null;
			}
		},
		template: `
		<Deal
			:deal="deal"
			:dealHelper="dealHelper"
			:dataId="booking.id"
			:dataAttributes="{
				'data-booking-id': bookingId,
			}"
			dataElementPrefix="booking"
			@freeze="$emit('freeze')"
			@unfreeze="$emit('unfreeze')"
		/>
	`
	};

	const BookingDocument = {
		name: 'BookingActionsPopupDocument',
		props: {
			bookingId: {
				type: [Number, String],
				required: true
			}
		},
		data() {
			return {
				isLoading: true
			};
		},
		async mounted() {
			await booking_provider_service_bookingActionsService.bookingActionsService.getDocData();
			this.isLoading = false;
		},
		components: {
			Document: booking_component_actionsPopup.Document
		},
		template: `
		<Document
			:id="bookingId"
			:loading="isLoading"
			disabled
		/>
	`
	};

	// @vue/component
	const BookingExtraResourcesInfo = {
		name: 'BookingExtraResourcesInfo',
		components: {
			ExtraResourcesInfo: booking_component_actionsPopup.ExtraResourcesInfo
		},
		props: {
			bookingId: {
				type: [Number, String],
				required: true
			},
			resourceId: {
				type: Number,
				required: true
			}
		},
		emits: ['freeze', 'unfreeze'],
		template: `
		<ExtraResourcesInfo
			:id="bookingId"
			:resourceId
			@open="$emit('freeze')"
			@close="$emit('unfreeze')"
			@freeze="$emit('freeze')"
			@unfreeze="$emit('unfreeze')"
		/>
	`
	};

	const BookingMessage = {
		name: 'BookingActionsPopupMessage',
		emits: ['freeze', 'unfreeze'],
		props: {
			bookingId: {
				type: Number,
				required: true
			}
		},
		data() {
			return {
				isLoading: true,
				isPrimaryClientIdUpdated: false
			};
		},
		mounted() {
			void this.fetchMessageData();
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				getSenderByCode: `${booking_const.Model.Notifications}/getSenderByCode`
			}),
			senderCanUse() {
				const sender = this.senderCode ? this.getSenderByCode(this.senderCode) : null;
				return sender?.canUse ?? false;
			},
			booking() {
				return this.$store.getters['bookings/getById'](this.bookingId);
			},
			client() {
				const clientData = this.booking.primaryClient;
				return clientData ? this.$store.getters['clients/getByClientData'](clientData) : null;
			},
			clientId() {
				return this.booking.primaryClient?.id;
			},
			updatedAt() {
				return this.booking.updatedAt;
			},
			resource() {
				const resourceId = this.booking.resourcesIds?.[0];
				return resourceId ? this.$store.getters['resources/getById'](resourceId) : null;
			},
			senderCode() {
				return this.resource?.senderCode ?? '';
			}
		},
		watch: {
			clientId() {
				this.isPrimaryClientIdUpdated = true;
			},
			updatedAt() {
				if (this.isPrimaryClientIdUpdated && this.senderCanUse) {
					void this.fetchMessageData();
					this.isPrimaryClientIdUpdated = false;
				}
			}
		},
		methods: {
			async sendMessage({
				notificationType
			}) {
				try {
					await booking_provider_service_bookingActionsService.bookingActionsService.sendMessage(this.bookingId, notificationType);
					void this.fetchMessageData();
				} catch (result) {
					if (main_core.Type.isArrayFilled(result.errors)) {
						ui_notificationManager.Notifier.notify({
							id: 'booking-message-send-error',
							text: result.errors[0].message
						});
					}
				}
			},
			async fetchMessageData() {
				this.isLoading = true;
				await booking_provider_service_bookingActionsService.bookingActionsService.getMessageData(this.bookingId);
				this.isLoading = false;
			}
		},
		components: {
			Message: booking_component_actionsPopup.Message
		},
		template: `
		<Message
			:id="bookingId"
			:clientData="booking.primaryClient"
			:loading="isLoading"
			:dataId="bookingId"
			:senderCode="senderCode"
			dataElementPrefix="booking"
			@open="$emit('freeze')"
			@close="$emit('unfreeze')"
			@updateNotificationType="sendMessage"
		/>
	`
	};

	const BookingConfirmation = {
		emits: ['freeze', 'unfreeze'],
		name: 'BookingActionsPopupConfirmation',
		props: {
			bookingId: {
				type: [Number, String],
				required: true
			}
		},
		computed: {
			booking() {
				return this.$store.getters[`${booking_const.Model.Bookings}/getById`](this.bookingId);
			}
		},
		methods: {
			updateConfirmationStatus({
				isConfirmed
			}) {
				void booking_provider_service_bookingService.bookingService.confirm(this.booking.id, isConfirmed);
			}
		},
		components: {
			Confirmation: booking_component_actionsPopup.Confirmation
		},
		template: `
		<Confirmation
			:id="bookingId"
			:isConfirmed="booking.isConfirmed"
			:counters="booking.counters"
			:dataId="booking.id"
			dataElementPrefix="booking"
			@open="$emit('freeze')"
			@close="$emit('unfreeze')"
			@updateConfirmationStatus="updateConfirmationStatus"
		/>
	`
	};

	// @vue/component
	const BookingSkusInfo = {
		name: 'BookingSkusInfo',
		components: {
			SkusInfo: booking_component_actionsPopup.SkusInfo
		},
		props: {
			bookingId: {
				type: [Number, String],
				required: true
			},
			resourceId: {
				type: Number,
				required: true
			}
		},
		emits: ['freeze', 'unfreeze'],
		template: `
		<SkusInfo
			:id="bookingId"
			:resourceId="resourceId"
			@open="$emit('freeze')"
			@close="$emit('unfreeze')"
			@freeze="$emit('freeze')"
			@unfreeze="$emit('unfreeze')"
		/>
	`
	};

	const BookingVisit = {
		emits: ['freeze', 'unfreeze'],
		name: 'BookingActionsPopupVisit',
		props: {
			bookingId: {
				type: [Number, String],
				required: true
			}
		},
		computed: {
			booking() {
				return this.$store.getters[`${booking_const.Model.Bookings}/getById`](this.bookingId);
			}
		},
		methods: {
			updateVisitStatus({
				visitStatus
			}) {
				void booking_provider_service_bookingService.bookingService.update({
					id: this.booking.id,
					visitStatus
				});
			}
		},
		components: {
			Icon: ui_iconSet_api_vue.BIcon,
			Loader: booking_component_loader.Loader,
			Visit: booking_component_actionsPopup.Visit
		},
		template: `
		<Visit
			:id="booking.id"
			:visitStatus="booking.visitStatus"
			:dataId="booking.id"
			dataElementPrefix="booking"
			:hasClients="booking.clients.length > 0"
			@freeze="$emit('freeze')"
			@unfreeze="$emit('unfreeze')"
			@update:visitStatus="updateVisitStatus"
		/>
	`
	};

	// @vue/component
	const Overbooking = {
		name: 'BookingActionsPopupOverbooking',
		components: {
			Icon: ui_iconSet_api_vue.BIcon
		},
		directives: {
			hint: ui_vue3_directives_hint.hint
		},
		props: {
			bookingId: {
				type: [Number, String],
				required: true
			},
			resourceId: {
				type: Number,
				required: true
			},
			disabled: {
				type: Boolean,
				default: false
			}
		},
		emits: ['close'],
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline,
				IconSet: ui_iconSet_api_vue.Set
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				getBookingById: `${booking_const.Model.Bookings}/getById`,
				dictionary: `${booking_const.Model.Dictionary}/getBookingVisitStatuses`,
				isFeatureEnabled: `${booking_const.Model.Interface}/isFeatureEnabled`,
				timezone: `${booking_const.Model.Interface}/timezone`,
				embedItems: `${booking_const.Model.Interface}/embedItems`
			}),
			booking() {
				return this.getBookingById(this.bookingId);
			},
			featureEnabled() {
				return this.$store.state[booking_const.Model.Interface].enabledFeature.bookingOverbooking;
			},
			hasOverbookingHint() {
				if (!this.disabled) {
					return undefined;
				}
				return {
					text: this.loc('BB_ACTIONS_POPUP_OVERBOOKING_DISABLED_HINT')
				};
			},
			iconColor() {
				if (this.disabled) {
					return 'var(--ui-color-palette-gray-20)';
				}
				if (!this.featureEnabled) {
					return 'var(--ui-color-gray-40)';
				}
				return 'var(--ui-color-palette-gray-60)';
			},
			clients() {
				const clients = this.embedItems.filter(item => {
					return item.entityTypeId === 'CONTACT' || item.entityTypeId === 'COMPANY';
				});
				return clients.map(item => {
					return {
						id: item.value,
						type: {
							code: item.entityTypeId,
							module: item.moduleId
						}
					};
				});
			}
		},
		methods: {
			async addOverbooking() {
				if (this.disabled) {
					return;
				}
				if (!this.featureEnabled || !this.isFeatureEnabled) {
					void booking_lib_limit.limit.show(booking_const.LimitFeatureId.Overbooking);
					return;
				}
				const overbooking = {
					...this.booking,
					id: main_core.Text.getRandom(10),
					clients: this.clients,
					counter: 0,
					counters: [],
					skus: [],
					createdAt: Date.now(),
					externalData: this.embedItems,
					isConfirmed: false,
					name: null,
					note: null,
					resourcesIds: [this.resourceId],
					primaryClient: undefined,
					rrule: null,
					timezoneFrom: this.timezone,
					timezoneTo: this.timezone,
					updatedAt: Date.now(),
					visitStatus: this.dictionary.Unknown
				};
				delete overbooking.name;
				const result = await booking_provider_service_bookingService.bookingService.add(overbooking);
				if (result.success && result.booking) {
					booking_lib_analytics.BookingAnalytics.sendAddBooking({
						isOverbooking: true
					});
				}
				this.$emit('close');
			}
		},
		template: `
		<div
			v-hint="hasOverbookingHint"
			class="booking-actions-popup__item-overbooking-button"
			:class="{
				'--disabled': disabled,
				'--locked': !featureEnabled,
			}"
			role="button"
			tabindex="0"
			@click="addOverbooking"
		>
			<Icon
				:name="featureEnabled ? IconSet.PLUS_20 : Outline.LOCK_S"
				:size="20"
				:color="iconColor"
			/>
			<div class="booking-actions-popup__item-overbooking-label">
				{{ loc('BB_ACTIONS_POPUP_OVERBOOKING_LABEL') }}
			</div>
		</div>
	`
	};

	// @vue/component
	const Waitlist = {
		name: 'BookingActionsPopupWaitlist',
		components: {
			Icon: ui_iconSet_api_vue.BIcon
		},
		props: {
			bookingId: {
				type: [Number, String],
				required: true
			}
		},
		setup() {
			return {
				IconSet: ui_iconSet_api_vue.Set,
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		computed: {
			disabled() {
				return !booking_lib_isRealId.isRealId(this.bookingId);
			},
			featureEnabled() {
				return this.$store.state[booking_const.Model.Interface].enabledFeature.bookingWaitlist;
			}
		},
		methods: {
			async toWaitList() {
				if (this.disabled) {
					return;
				}
				if (!this.featureEnabled) {
					void booking_lib_limit.limit.show(booking_const.LimitFeatureId.Waitlist);
					return;
				}
				await booking_lib_drag.dragActions.moveBookingToWaitList(this.bookingId);
			}
		},
		template: `
		<div
			class="booking--booking-actions-popup__item-waitlist-btn --end"
			:class="{
				'--disabled': disabled,
				'--locked': !featureEnabled,
			}"
			@click="toWaitList"
		>
			<Icon
				:name="featureEnabled ? IconSet.BLACK_CLOCK : Outline.LOCK_S"
				:size="20"
				:color="featureEnabled ? 'var(--ui-color-gray-60)': 'var(--ui-color-gray-40)'"
			/>
			<div class="booking-actions-popup__item-waitlist-label">
				{{ loc('BB_ACTIONS_POPUP_OVERBOOKING_LIST') }}
			</div>
		</div>
	`
	};

	function BookingRemoveBtn(props, {
		emit
	}) {
		const bookingId = props.bookingId;
		const removeBooking = () => {
			emit('close');
			new booking_lib_removeBooking.RemoveBooking(bookingId);
		};
		return ui_vue3.h(booking_component_actionsPopup.RemoveButton, {
			dataAttributes: {
				'data-booking-id': bookingId,
				'data-element': 'booking-menu-remove-button'
			},
			onRemove: removeBooking
		});
	}
	const bookingRemoveBtnProps = ['bookingId'];
	BookingRemoveBtn.props = bookingRemoveBtnProps;
	BookingRemoveBtn.emits = ['close'];

	const ActionsPopupActionEnum = Object.freeze({
		client: 'client',
		confirmation: 'confirmation',
		deal: 'deal',
		document: 'document',
		extraResourcesInfo: 'extraResourcesInfo',
		fullForm: 'fullForm',
		message: 'message',
		visit: 'visit',
		overbooking: 'overbooking',
		remove: 'remove',
		waitList: 'waitList',
		skus: 'skus'
	});

	// @vue/component
	const BookingActionsPopup = {
		name: 'BookingActionsPopup',
		components: {
			ActionsPopup: booking_component_actionsPopup.ActionsPopup,
			Overbooking,
			Waitlist,
			BookingSkusInfo,
			BookingRemoveBtn
		},
		props: {
			bindElement: {
				type: HTMLElement,
				required: true
			},
			bookingId: {
				type: [Number, String],
				required: true
			},
			resourceId: {
				type: Number,
				required: true
			},
			/**
			 * @type ActionsPopupOptions
			 */
			options: {
				type: Object,
				default: null
			}
		},
		emits: ['close'],
		data() {
			return {
				soonTmp: false
			};
		},
		computed: {
			config() {
				return {
					offsetLeft: this.getOffsetLeft() / 2,
					offsetTop: -200
				};
			},
			contentStructure() {
				return [{
					id: ActionsPopupActionEnum.client,
					props: {
						bookingId: this.bookingId
					},
					component: BookingClient
				}, [{
					id: ActionsPopupActionEnum.extraResourcesInfo,
					props: {
						bookingId: this.bookingId,
						resourceId: this.resourceId
					},
					component: BookingExtraResourcesInfo
				}, {
					id: ActionsPopupActionEnum.skus,
					props: {
						bookingId: this.bookingId,
						resourceId: this.resourceId
					},
					component: BookingSkusInfo
				}], [{
					id: ActionsPopupActionEnum.deal,
					props: {
						bookingId: this.bookingId
					},
					component: BookingDeal
				}, {
					id: ActionsPopupActionEnum.document,
					props: {
						bookingId: this.bookingId
					},
					component: BookingDocument
				}], {
					id: ActionsPopupActionEnum.message,
					props: {
						bookingId: this.bookingId
					},
					component: BookingMessage
				}, {
					id: ActionsPopupActionEnum.confirmation,
					props: {
						bookingId: this.bookingId
					},
					component: BookingConfirmation
				}, {
					id: ActionsPopupActionEnum.visit,
					props: {
						bookingId: this.bookingId
					},
					component: BookingVisit
				}, [{
					id: ActionsPopupActionEnum.fullForm,
					props: {
						bookingId: this.bookingId
					},
					component: booking_component_actionsPopup.FullForm
				}, {
					id: ActionsPopupActionEnum.info,
					class: '--shrink',
					props: {
						bookingId: this.bookingId
					},
					component: booking_component_actionsPopup.Info
				}]];
			},
			booking() {
				return this.$store.getters[`${booking_const.Model.Bookings}/getById`](this.bookingId);
			}
		},
		methods: {
			getOffsetLeft() {
				const {
					left
				} = this.bindElement.getBoundingClientRect();
				if (window.innerWidth - left < 325) {
					return -325;
				}
				return this.bindElement.offsetWidth;
			}
		},
		template: `
		<ActionsPopup
			:popupId="bookingId"
			:bindElement="bindElement"
			:contentStructure="contentStructure"
			:popupOptions="config"
			@close="$emit('close')"
		>
			<template #footer>
				<Overbooking
					v-if="!options?.overbooking?.hidden"
					:bookingId
					:resourceId
					:disabled="Boolean(options?.overbooking?.disabled)"
					@close="$emit('close')"
				/>
				<Waitlist v-if="!options?.waitList?.hidden" :bookingId/>
				<BookingRemoveBtn :bookingId @close="$emit('close')"/>
			</template>
		</ActionsPopup>
	`
	};

	// @vue/component
	const Actions = {
		name: 'BookingActions',
		components: {
			BookingActionsPopup
		},
		props: {
			bookingId: {
				type: [Number, String],
				required: true
			},
			resourceId: {
				type: Number,
				required: true
			},
			actionsPopupOptions: {
				type: Object,
				default: null
			}
		},
		computed: ui_vue3_vuex.mapGetters({
			editingBookingId: `${booking_const.Model.Interface}/editingBookingId`,
			isEditingBookingMode: `${booking_const.Model.Interface}/isEditingBookingMode`,
			isMenuOpenedForBooking: `${booking_const.Model.Interface}/isMenuOpenedForBooking`
		}),
		async mounted() {
			if (this.isEditingBookingMode && this.editingBookingId === this.bookingId) {
				await booking_core.Core.getStore().dispatch(`${booking_const.Model.Interface}/setMenuOpenedForBooking`, {
					bookingId: this.bookingId,
					resourceId: this.resourceId
				});
			}
		},
		methods: {
			async clickHandler() {
				await booking_core.Core.getStore().dispatch(`${booking_const.Model.Interface}/setMenuOpenedForBooking`, {
					bookingId: this.bookingId,
					resourceId: this.resourceId
				});
			},
			async onClose() {
				if (this.isMenuOpenedForBooking(this.bookingId, this.resourceId)) {
					await booking_core.Core.getStore().dispatch(`${booking_const.Model.Interface}/setMenuOpenedForBooking`, {
						bookingId: 0,
						resourceId: 0
					});
				}
			}
		},
		template: `
		<div 
			ref="node"
			class="booking-booking-booking-actions"
			data-element="booking-booking-actions-button"
			:data-id="bookingId"
			:data-resource-id="resourceId"
			@click="clickHandler"
		>
		</div>
		<BookingActionsPopup
			v-if="isMenuOpenedForBooking(this.bookingId, this.resourceId)"
			:bookingId
			:bindElement="this.$refs.node"
			:resourceId
			:options="actionsPopupOptions"
			@close="onClose()"
		/>
	`
	};

	// @vue/component
	const BookingAddClient = {
		name: 'BookingAddClient',
		components: {
			BookingCardAddClient: booking_component_bookingCard.AddClient
		},
		props: {
			/** @type{ BookingCardDataService } */
			cardDataService: {
				type: Object,
				required: true
			},
			expired: {
				type: Boolean,
				default: false
			}
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				getBookingById: `${booking_const.Model.Bookings}/getById`
			}),
			dataAttributes() {
				return this.cardDataService.buildDataAttributes('booking-booking-card-add-client-button');
			}
		},
		mounted() {
			if (booking_lib_isRealId.isRealId(this.bookingId)) {
				booking_lib_ahaMoments.ahaMoments.setBookingForAhaMoment(this.bookingId);
			}
			if (booking_lib_ahaMoments.ahaMoments.shouldShow(booking_const.AhaMoment.AddClient, {
				bookingId: this.bookingId
			})) {
				void this.showAhaMoment();
			}
		},
		methods: {
			async showAhaMoment() {
				await booking_lib_ahaMoments.ahaMoments.show({
					id: 'booking-add-client',
					title: this.loc('BOOKING_AHA_ADD_CLIENT_TITLE'),
					text: this.loc('BOOKING_AHA_ADD_CLIENT_TEXT_MSGVER_1'),
					target: this.$refs.addClientContainer?.$refs?.button,
					isPulsarTransparent: true
				});
				booking_lib_ahaMoments.ahaMoments.setShown(booking_const.AhaMoment.AddClient);
			}
		},
		template: `
		<BookingCardAddClient
			buttonClass="booking-booking-card__booking-add-client"
			ref="addClientContainer"
			:expired
			:dataAttributes
			@add="(clients) => this.cardDataService.addClients(clients)"
		/>
	`
	};

	const FreeDayColor = 'rgba(var(--ui-color-background-success-rgb), 0.7)';

	// @vue/component
	const ChangeDatePopup = {
		name: 'ChangeDatePopup',
		components: {
			Popup: booking_component_popup.Popup,
			UiButton: booking_component_button.Button
		},
		props: {
			bookingId: {
				type: [Number, String],
				required: true
			},
			resourceId: {
				type: Number,
				required: true
			},
			targetNode: {
				type: HTMLElement,
				required: true
			}
		},
		emits: ['close'],
		setup() {
			return {
				ButtonColor: booking_component_button.ButtonColor,
				ButtonIcon: booking_component_button.ButtonIcon
			};
		},
		data() {
			return {
				selectedFromTs: 0,
				selectedToTs: 0,
				isAvailable: true
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				offset: `${booking_const.Model.Interface}/offset`
			}),
			booking() {
				return this.$store.getters['bookings/getById'](this.bookingId);
			},
			isCheckingAvailability() {
				return this.isAvailable === null;
			},
			isDateUnavailable() {
				return this.isAvailable === false;
			},
			canSave() {
				return this.isAvailable === true;
			},
			hasChanges() {
				return this.booking.dateFromTs !== this.selectedFromTs || this.booking.dateToTs !== this.selectedToTs;
			},
			popupId() {
				return `booking-date-popup-${this.bookingId}-${this.resourceId}`;
			},
			popupConfig() {
				return {
					className: 'booking-booking-date-popup-wrapper',
					bindElement: this.targetNode,
					width: 272,
					fixed: true,
					bindOptions: {
						forceBindPosition: true
					}
				};
			}
		},
		created() {
			this.datePicker = null;
			this.resizeObserver = null;
			this.loadFreeDayRevisionGuard = new booking_lib_requestRevisionGuard.RequestRevisionGuard();
			this.checkAvailabilityRevisionGuard = new booking_lib_requestRevisionGuard.RequestRevisionGuard();
			this.selectedFromTs = this.booking.dateFromTs;
			this.selectedToTs = this.booking.dateToTs;
		},
		mounted() {
			void this.initDatePicker();
			this.observePopupResize();
		},
		beforeUnmount() {
			this.destroyDatePicker();
			this.unobservePopupResize();
		},
		methods: {
			async initDatePicker() {
				this.datePicker = new ui_datePicker.DatePicker({
					inline: true,
					selectionMode: 'range',
					enableTime: true,
					allowSeconds: false,
					selectedDates: [new Date(this.booking.dateFromTs + this.offset), new Date(this.booking.dateToTs + this.offset)],
					timePickerStyle: 'wheel'
				});
				this.datePicker.subscribe(ui_datePicker.DatePickerEvent.SELECT_CHANGE, this.onDateSelected);
				const originalSetViewDate = this.datePicker.setViewDate.bind(this.datePicker);
				this.datePicker.setViewDate = (...args) => {
					originalSetViewDate(...args);
					void this.loadFreeDayColors();
				};
				this.datePicker.setTargetNode(this.$refs.datePickerContainer);
				this.datePicker.show();
				this.$nextTick(() => {
					this.$refs.popup?.adjustPosition();
				});
				await this.loadFreeDayColors();
			},
			destroyDatePicker() {
				if (this.datePicker) {
					this.datePicker.destroy();
					this.datePicker = null;
				}
			},
			observePopupResize() {
				const container = this.$refs.datePickerContainer;
				this.resizeObserver = new ResizeObserver(() => {
					this.$refs.popup?.adjustPosition();
				});
				this.resizeObserver.observe(container);
			},
			unobservePopupResize() {
				if (this.resizeObserver) {
					this.resizeObserver.disconnect();
					this.resizeObserver = null;
				}
			},
			onDateSelected() {
				if (!this.datePicker) {
					return;
				}
				const rangeStart = this.datePicker.getRangeStart();
				const rangeEnd = this.datePicker.getRangeEnd();
				if (!rangeStart || !rangeEnd) {
					return;
				}
				this.selectedFromTs = this.pickerDateToTimestamp(rangeStart);
				this.selectedToTs = this.pickerDateToTimestamp(rangeEnd);
				this.isAvailable = null;
				void this.checkAvailability();
			},
			pickerDateToTimestamp(date) {
				const localDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
				return localDate.getTime() - this.offset;
			},
			saveAndClose() {
				if (this.hasChanges && this.canSave) {
					void booking_provider_service_bookingService.bookingService.update({
						id: this.booking.id,
						dateFromTs: this.selectedFromTs,
						dateToTs: this.selectedToTs,
						timezoneFrom: this.booking.timezoneFrom,
						timezoneTo: this.booking.timezoneTo
					});
				}
				this.$emit('close');
			},
			close() {
				this.$emit('close');
			},
			async checkAvailability() {
				if (!this.selectedFromTs || !this.selectedToTs) {
					this.isAvailable = false;
					return;
				}
				const revision = this.checkAvailabilityRevisionGuard.next(this.booking.id);
				const canChange = await booking_provider_service_bookingService.bookingService.canChangeDate(this.booking.id, this.selectedFromTs, this.selectedToTs);
				if (!this.checkAvailabilityRevisionGuard.isActual(this.booking.id, revision)) {
					return;
				}
				this.isAvailable = canChange;
			},
			async loadFreeDayColors() {
				if (!this.datePicker) {
					return;
				}
				const revision = this.loadFreeDayRevisionGuard.next(this.resourceId);
				const viewDate = this.datePicker.getViewDate();
				const dateTs = new Date(viewDate.getUTCFullYear(), viewDate.getUTCMonth(), 1).getTime();
				const freeDates = await booking_provider_service_calendarService.calendarService.getFreeDatesForResource(this.resourceId, dateTs);
				if (!this.loadFreeDayRevisionGuard.isActual(this.resourceId, revision) || !this.datePicker) {
					return;
				}
				const dateFormat = main_date.DateTimeFormat.getFormat('FORMAT_DATE');
				const formattedDates = freeDates.map(freeDate => {
					const date = main_date.DateTimeFormat.parse(freeDate, false, booking_const.DateFormat.ServerParse);
					return main_date.DateTimeFormat.format(dateFormat, date.getTime() / 1000);
				});
				this.datePicker.setDayColors(formattedDates.length > 0 ? [{
					matcher: formattedDates,
					bgColor: FreeDayColor
				}] : []);
			}
		},
		template: `
		<Popup
			:id="popupId"
			:config="popupConfig"
			ref="popup"
			@close="close"
		>
			<div class="booking-booking-date-popup">
				<div ref="datePickerContainer"></div>
				<div v-if="isDateUnavailable" class="booking-booking-date-popup__error">
					{{ loc('BOOKING_BOOKING_TIME_IS_NOT_AVAILABLE') }}
				</div>
				<div class="booking-booking-date-popup__footer">
					<UiButton
						class="booking-booking-date-popup__button"
						:size="ButtonIcon.MEDIUM"
						:color="ButtonColor.PRIMARY"
						:disabled="!canSave"
						:waiting="isCheckingAvailability"
						@click="saveAndClose"
						:text="loc('BOOKING_BOOKING_BOOKING_DATE_SAVE')"
					/>
				</div>
			</div>
		</Popup>
	`
	};

	// @vue/component
	const BookingDate = {
		name: 'BookingDate',
		components: {
			ChangeDatePopup
		},
		props: {
			startTs: {
				type: Number,
				required: true
			},
			endTs: {
				type: Number,
				required: true
			},
			bookingId: {
				type: [Number, String],
				required: true
			},
			resourceId: {
				type: Number,
				required: true
			}
		},
		data() {
			return {
				showPopup: false
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				offset: `${booking_const.Model.Interface}/offset`,
				isFeatureEnabled: `${booking_const.Model.Interface}/isFeatureEnabled`
			}),
			dateFormat() {
				return main_date.DateTimeFormat.getFormat('DAY_SHORT_MONTH_FORMAT');
			},
			timeFormat() {
				return main_date.DateTimeFormat.getFormat('SHORT_TIME_FORMAT');
			},
			startLocalSeconds() {
				return (this.startTs + this.offset) / 1000;
			},
			endLocalSeconds() {
				return (this.endTs + this.offset) / 1000;
			},
			dateFromFormatted() {
				return this.loc('BOOKING_BOOKING_DATE_FROM', {
					'#DATE#': main_date.DateTimeFormat.format(this.dateFormat, this.startLocalSeconds),
					'#TIME#': main_date.DateTimeFormat.format(this.timeFormat, this.startLocalSeconds)
				});
			},
			dateToFormatted() {
				return this.loc('BOOKING_BOOKING_DATE_TO', {
					'#DATE#': main_date.DateTimeFormat.format(this.dateFormat, (this.endTs + this.offset) / 1000),
					'#TIME#': main_date.DateTimeFormat.format(this.timeFormat, this.endLocalSeconds)
				});
			}
		},
		methods: {
			openPopup() {
				if (!this.isFeatureEnabled) {
					return;
				}
				this.showPopup = true;
			},
			closePopup() {
				this.showPopup = false;
			}
		},
		template: `
		<div
			class="booking-booking-booking__date"
			:class="{'--lock': !isFeatureEnabled}"
			data-element="booking-booking-date"
			ref="date"
			@click="openPopup"
		>
			<div class="booking-booking-booking__date-line">{{ dateFromFormatted }}</div>
			<div class="booking-booking-booking__date-line">{{ dateToFormatted }}</div>
		</div>
		<ChangeDatePopup
			v-if="showPopup"
			:bookingId="bookingId"
			:resourceId="resourceId"
			:targetNode="$refs.date"
			@close="closePopup"
		/>
	`
	};

	// @vue/component
	const ChangeTimePopup = {
		name: 'ChangeTimePopup',
		components: {
			Popup: booking_component_popup.Popup,
			TimeSelector: booking_component_timeSelector.TimeSelector,
			UiButton: booking_component_button.Button
		},
		inject: {
			autoHideContext: {
				default: null
			}
		},
		props: {
			bookingId: {
				type: [Number, String],
				required: true
			},
			resourceId: {
				type: Number,
				required: true
			},
			targetNode: {
				type: HTMLElement,
				required: true
			}
		},
		emits: ['close'],
		setup() {
			return {
				ButtonSize: booking_component_button.ButtonSize,
				ButtonColor: booking_component_button.ButtonColor,
				ButtonIcon: booking_component_button.ButtonIcon
			};
		},
		data() {
			return {
				fromTs: 0,
				toTs: 0,
				duration: 0
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				selectedDateTs: `${booking_const.Model.Interface}/selectedDateTs`,
				getBookingById: `${booking_const.Model.Bookings}/getById`,
				overbookingMap: `${booking_const.Model.Bookings}/overbookingMap`
			}),
			popupId() {
				return `booking-change-time-popup-${this.bookingId}-${this.resourceId}`;
			},
			config() {
				return {
					className: 'booking-booking-change-time-popup',
					bindElement: this.targetNode,
					offsetTop: -10,
					bindOptions: {
						forceBindPosition: true,
						position: 'top'
					},
					angle: {
						offset: this.targetNode.offsetWidth / 2
					}
				};
			},
			featureOverbookingEnabled() {
				return this.$store.state[booking_const.Model.Interface].enabledFeature.bookingOverbooking;
			},
			bookingsCountInTimes() {
				const bookingId = this.bookingId;
				return this.bookings.filter(({
					id,
					dateToTs,
					dateFromTs
				}) => {
					if (id !== bookingId && this.overbookingMap.has(id)) {
						const overbooking = this.overbookingMap.get(id);
						const resourceIntersections = overbooking.items.find(item => item.resourceId === this.resourceId);
						const intersections = resourceIntersections?.intersections?.filter(intersection => {
							return intersection.id !== bookingId && intersection.dateToTs > this.fromTs && this.toTs > intersection.dateFromTs;
						}) || [];
						if (resourceIntersections && intersections.length === 0) {
							return false;
						}
					}
					return id !== bookingId && dateToTs > this.fromTs && this.toTs > dateFromTs;
				}).length;
			},
			isBusy() {
				return this.bookingsCountInTimes > 1;
			},
			bookings() {
				return this.$store.getters[`${booking_const.Model.Bookings}/getByDateAndResources`](this.selectedDateTs, this.booking.resourcesIds);
			},
			booking() {
				return this.getBookingById(this.bookingId);
			}
		},
		watch: {
			fromTs() {
				this.toTs = this.fromTs + this.duration;
			},
			toTs() {
				if (this.toTs <= this.fromTs) {
					this.fromTs = this.toTs - this.duration;
				}
				this.duration = this.toTs - this.fromTs;
			},
			isBusy() {
				setTimeout(() => this.adjustPosition(), 0);
			}
		},
		created() {
			this.unfreezeAutoHide = null;
			this.fromTs = this.booking.dateFromTs;
			this.toTs = this.booking.dateToTs;
			this.duration = this.toTs - this.fromTs;
		},
		mounted() {
			this.freezeParentAutoHide();
			main_core.Event.bind(document, 'scroll', this.adjustPosition, true);
		},
		beforeUnmount() {
			this.unfreezeParentAutoHide();
			main_core.Event.unbind(document, 'scroll', this.adjustPosition, true);
		},
		methods: {
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
			adjustPosition() {
				this.$refs.popup.adjustPosition();
				this.$refs.timeFrom.adjustMenuPosition();
				this.$refs.timeTo.adjustMenuPosition();
			},
			closePopup() {
				const tsChanged = this.booking.dateFromTs !== this.fromTs || this.booking.dateToTs !== this.toTs;
				if (!tsChanged || this.isBusy) {
					this.$emit('close');
					return;
				}
				if (!this.featureOverbookingEnabled && this.bookingsCountInTimes > 0) {
					main_core.Event.EventEmitter.emit(booking_const.EventName.StartLockedBookingAnimation, {
						bookingId: this.bookingId,
						featureId: booking_const.LimitFeatureId.Overbooking
					});
					this.$emit('close');
					return;
				}
				void booking_provider_service_bookingService.bookingService.update({
					id: this.booking.id,
					dateFromTs: this.fromTs,
					dateToTs: this.toTs,
					timezoneFrom: this.booking.timezoneFrom,
					timezoneTo: this.booking.timezoneTo
				});
				this.$emit('close');
			},
			freeze() {
				this.$refs.popup.getPopupInstance().setAutoHide(false);
			},
			unfreeze() {
				this.$refs.popup.getPopupInstance().setAutoHide(true);
			}
		},
		template: `
		<Popup
			:id="popupId"
			:config="config"
			@close="closePopup"
			ref="popup"
		>
			<div class="booking-booking-booking__change-time-popup_container">
				<div class="booking-booking-booking__change-time-popup_main">
					<TimeSelector
						v-model="fromTs"
						:hasError="isBusy"
						data-element="booking-change-time-from"
						:data-ts="fromTs"
						:data-booking-id="bookingId"
						ref="timeFrom"
						@freeze="freeze"
						@unfreeze="unfreeze"
						@enterSave="closePopup"
					/>
					<div class="booking-booking-booking__change-time-popup_separator"></div>
					<TimeSelector
						v-model="toTs"
						:hasError="isBusy"
						:minTs="fromTs"
						data-element="booking-change-time-to"
						:data-ts="toTs"
						:data-booking-id="bookingId"
						ref="timeTo"
						@freeze="freeze"
						@unfreeze="unfreeze"
						@enterSave="closePopup"
					/>
					<UiButton
						class="booking-booking-booking__change-time-popup_button"
						:size="ButtonIcon.MEDIUM"
						:color="ButtonColor.PRIMARY"
						:icon="ButtonIcon.DONE"
						:disabled="isBusy"
						@click="closePopup"
					/>
				</div>
				<div v-if="isBusy" class="booking-booking-booking__change-time-popup_error">
					{{ loc('BOOKING_BOOKING_TIME_IS_NOT_AVAILABLE') }}
				</div>
			</div>
		</Popup>
	`
	};

	const BookingTime = {
		props: {
			bookingId: {
				type: [Number, String],
				required: true
			},
			resourceId: {
				type: Number,
				required: true
			},
			startTs: {
				type: Number,
				required: true
			},
			endTs: {
				type: Number,
				required: true
			}
		},
		data() {
			return {
				showPopup: false
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				offset: `${booking_const.Model.Interface}/offset`,
				isFeatureEnabled: `${booking_const.Model.Interface}/isFeatureEnabled`
			}),
			timeFormatted() {
				const timeFormat = main_date.DateTimeFormat.getFormat('SHORT_TIME_FORMAT');
				return this.loc('BOOKING_BOOKING_TIME_RANGE', {
					'#FROM#': main_date.DateTimeFormat.format(timeFormat, (this.startTs + this.offset) / 1000),
					'#TO#': main_date.DateTimeFormat.format(timeFormat, (this.endTs + this.offset) / 1000)
				});
			}
		},
		methods: {
			clickHandler() {
				if (!this.isFeatureEnabled) {
					return;
				}
				this.showPopup = true;
			},
			closePopup() {
				this.showPopup = false;
			}
		},
		components: {
			ChangeTimePopup
		},
		template: `
		<div
			class="booking-booking-booking__time"
			:class="{'--lock': !isFeatureEnabled}"
			data-element="booking-booking-time"
			:data-booking-id="bookingId"
			:data-resource-id="resourceId"
			:data-from="startTs"
			:data-to="endTs"
			ref="time"
			@click="clickHandler"
		>
			{{ timeFormatted }}
		</div>
		<ChangeTimePopup
			v-if="showPopup"
			:bookingId="bookingId"
			:resourceId="resourceId"
			:targetNode="$refs.time"
			@close="closePopup"
		/>
	`
	};

	// @vue/component
	const BookingDuration = {
		components: {
			BookingDate,
			BookingTime
		},
		props: {
			startTs: {
				type: Number,
				required: true
			},
			endTs: {
				type: Number,
				required: true
			},
			bookingId: {
				type: [Number, String],
				required: true
			},
			resourceId: {
				type: Number,
				required: true
			}
		},
		computed: {
			durationMs() {
				return this.endTs - this.startTs;
			},
			isDateDisplay() {
				return this.durationMs >= booking_lib_duration.Duration.getUnitDurations().d;
			}
		},
		template: `
		<div class="booking-booking-booking__duration">
			<BookingDate
				v-if="isDateDisplay"
				:startTs
				:endTs
				:bookingId
				:resourceId
			/>
			<BookingTime
				v-else
				:bookingId
				:resourceId
				:startTs
				:endTs
			/>
		</div>
	`
	};

	// @vue/component
	const DotCounter = {
		name: 'BookingDotCounter',
		props: {
			showConfirmed: {
				type: Boolean,
				default: false
			},
			showCounter: {
				type: Boolean,
				default: false
			}
		},
		template: `
		<div v-if="showConfirmed || showCounter"
			class="booking-booking-booking__counter-dot" 
			:class="{
				'--confirmed': this.showConfirmed,
				'--danger': this.showCounter,
			}"
		></div>
	`
	};

	// @vue/component
	const FullCounter = {
		name: 'BookingFullCounter',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			UiCounter: booking_component_counter.Counter
		},
		props: {
			showClocking: {
				type: Boolean,
				default: false
			},
			showConfirmed: {
				type: Boolean,
				default: false
			},
			showCounter: {
				type: Boolean,
				default: false
			},
			counterValue: {
				type: Number,
				default: 0
			}
		},
		setup() {
			return {
				Animated: ui_iconSet_api_core.Animated,
				Main: ui_iconSet_api_core.Main,
				CounterColor: booking_component_counter.CounterColor,
				CounterSize: booking_component_counter.CounterSize
			};
		},
		template: `
		<div v-if="showClocking" class="booking-booking-booking__counter_icon --clocking">
			<BIcon :name="Animated.LOADER_CLOCK" :hoverable="false"/>
		</div>
		<div v-else-if="showConfirmed" class="booking-booking-booking__counter_icon --confirmed">
			<BIcon :name="Main.CHECK" :hoverable="false"/>
		</div>
		<UiCounter
			v-else-if="showCounter"
			:value="counterValue"
			:color="CounterColor.DANGER"
			:size="CounterSize.LARGE"
			border
		/>
	`
	};

	// @vue/component
	const Counter = {
		components: {
			DotCounter,
			FullCounter
		},
		inject: {
			gridContext: {
				default: null
			}
		},
		props: {
			bookingId: {
				type: [Number, String],
				required: true
			},
			nowTs: {
				type: Number,
				required: true
			}
		},
		computed: {
			isWeekMode() {
				if (this.gridContext) {
					return this.gridContext.gridMode === booking_const.Grid.Mode.Week;
				}
				return this.$store.getters[`${booking_const.Model.Interface}/isWeekMode`];
			},
			booking() {
				return this.$store.getters[`${booking_const.Model.Bookings}/getById`](this.bookingId);
			},
			showClocking() {
				if (this.showCounter || this.isExpiredBooking || this.hasVisitStatus || this.isNotVisited) {
					return false;
				}
				return !this.booking.isConfirmed && this.booking.isConfirmationSent;
			},
			showConfirmed() {
				if (this.showCounter || this.isExpiredBooking || this.isNotVisited) {
					return false;
				}
				return this.booking.isConfirmed;
			},
			showCounter() {
				return this.booking.counter > 0;
			},
			isExpiredBooking() {
				return this.nowTs > this.booking.dateToTs;
			},
			hasVisitStatus() {
				return [booking_const.VisitStatus.Visited, booking_const.VisitStatus.NotVisited].includes(this.booking.visitStatus);
			},
			isNotVisited() {
				const started = this.nowTs > this.booking.dateFromTs;
				const statusUnknown = this.booking.visitStatus === booking_const.VisitStatus.Unknown;
				const statusNotVisited = this.booking.visitStatus === booking_const.VisitStatus.NotVisited;
				return started && statusUnknown || statusNotVisited;
			},
			isMinimalMode() {
				const bookingDuration = this.booking.dateToTs - this.booking.dateFromTs;
				return this.isWeekMode && bookingDuration <= booking_lib_duration.Duration.getUnitDurations().H * 8;
			}
		},
		template: `
		<div class="booking-booking-booking__counter">
			<DotCounter
				v-if="isMinimalMode"
				:showConfirmed
				:showCounter
			/>
			<FullCounter
				v-else
				:showClocking
				:showConfirmed
				:showCounter
				:counterValue="booking.counter"
			/>
		</div>
	`
	};

	// @vue/component
	const BookingPreviewPopup = {
		name: 'BookingPreviewPopup',
		components: {
			Popup: booking_component_popup.Popup
		},
		props: {
			bindElement: {
				type: HTMLElement,
				required: true
			},
			bookingId: {
				type: [Number, String],
				required: true
			},
			title: {
				type: String,
				required: true
			},
			dateFromTs: {
				type: Number,
				required: true
			},
			dateToTs: {
				type: Number,
				required: true
			}
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				offset: `${booking_const.Model.Interface}/offset`
			}),
			popupId() {
				return `booking-preview-popup-${this.bookingId}`;
			},
			dateFormatted() {
				const dateFormat = main_date.DateTimeFormat.getFormat('DAY_SHORT_MONTH_FORMAT');
				const timeFormat = main_date.DateTimeFormat.getFormat('SHORT_TIME_FORMAT');
				const fromSeconds = (this.dateFromTs + this.offset) / 1000;
				const toSeconds = (this.dateToTs + this.offset) / 1000;
				const dateFrom = main_date.DateTimeFormat.format(dateFormat, fromSeconds);
				const timeFrom = main_date.DateTimeFormat.format(timeFormat, fromSeconds);
				const timeTo = main_date.DateTimeFormat.format(timeFormat, toSeconds);
				if (this.isSameDay) {
					return this.loc('BOOKING_BOOKING_PREVIEW_POPUP_SAME_DAY', {
						'#DATE#': dateFrom,
						'#TIME_FROM#': timeFrom,
						'#TIME_TO#': timeTo
					});
				}
				const dateTo = main_date.DateTimeFormat.format(dateFormat, (this.dateToTs + this.offset) / 1000);
				return this.loc('BOOKING_BOOKING_PREVIEW_POPUP_DIFF_DAY', {
					'#DATE_FROM#': dateFrom,
					'#TIME_FROM#': timeFrom,
					'#DATE_TO#': dateTo,
					'#TIME_TO#': timeTo
				});
			},
			config() {
				return {
					className: 'booking-preview-popup-container',
					bindElement: this.bindElement,
					minWidth: 170,
					offsetTop: 0,
					offsetLeft: this.bindElement.getBoundingClientRect().width / 2,
					background: '#2878ca',
					padding: 0,
					bindOptions: {
						forceBindPosition: true,
						position: 'bottom'
					},
					angle: {
						position: 'top'
					},
					angleBorderRadius: 'var(--ui-border-radius-2xs) 0',
					autoHide: false,
					closeByEsc: false
				};
			},
			isSameDay() {
				return booking_lib_utils.Utils.time.isSameDay(this.dateFromTs, this.dateToTs, this.offset);
			}
		},
		template: `
		<Popup
			:id="popupId"
			:config="config"
		>
			<div class="booking-preview-popup">
				<div class="booking-preview-popup__client">{{ title }}</div>
				<div class="booking-preview-popup__date">{{ dateFormatted }}</div>
			</div>
		</Popup>
	`
	};

	const ResizeDirection = Object.freeze({
		From: -1,
		None: 0,
		To: 1
	});
	const minDuration = booking_lib_duration.Duration.getUnitDurations().i * 5;
	const minInitialDuration = booking_lib_duration.Duration.getUnitDurations().i * 15;

	// @vue/component
	const Resize$1 = {
		name: 'BookingResize',
		props: {
			bookingId: {
				type: [Number, String],
				required: true
			},
			resourceId: {
				type: Number,
				required: true
			}
		},
		setup() {
			const tooltipTop = null;
			const tooltipBottom = null;
			return {
				tooltipTop,
				tooltipBottom
			};
		},
		data() {
			return {
				resizeDirection: ResizeDirection.None,
				resizeFromTs: null,
				resizeToTs: null
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				selectedDateTs: `${booking_const.Model.Interface}/selectedDateTs`,
				offset: `${booking_const.Model.Interface}/offset`,
				overbookingMap: `${booking_const.Model.Bookings}/overbookingMap`
			}),
			grid() {
				return booking_lib_grid.GridFactory.getGrid();
			},
			featureOverbookingEnabled() {
				return this.$store.state[booking_const.Model.Interface].enabledFeature.bookingOverbooking;
			},
			booking() {
				return this.$store.getters[`${booking_const.Model.Bookings}/getById`](this.bookingId);
			},
			limits() {
				const fromTs = this.selectedDateTs;
				return {
					fromTs,
					toTs: fromTs + booking_lib_duration.Duration.getUnitDurations().d
				};
			},
			initialHeight() {
				return this.grid.calculateHeight(this.booking.dateFromTs, this.booking.dateToTs);
			},
			dateFromTsRounded() {
				return this.roundTimestamp(this.resizeFromTs);
			},
			dateToTsRounded() {
				return this.roundTimestamp(this.resizeToTs);
			},
			closestOnFrom() {
				return this.colliding.reduce((closest, {
					toTs
				}) => {
					return closest < toTs && toTs <= this.booking.dateFromTs ? toTs : closest;
				}, 0);
			},
			closestOnTo() {
				return this.colliding.reduce((closest, {
					fromTs
				}) => {
					return this.booking.dateToTs <= fromTs && fromTs < closest ? fromTs : closest;
				}, Infinity);
			},
			excludeBookings() {
				if (!this.featureOverbookingEnabled) {
					return [this.bookingId];
				}
				const overbookingMap = this.overbookingMap;
				return booking => {
					if (booking.id === this.bookingId) {
						return true;
					}
					const overbooking = overbookingMap.get(booking.id);
					const resourcesIds = this.booking.resourcesIds;
					return !overbooking || overbooking.items.every(item => !resourcesIds.includes(item.resourceId));
				};
			},
			colliding() {
				return this.$store.getters[`${booking_const.Model.Interface}/getColliding`](this.booking.resourcesIds, this.excludeBookings);
			},
			hasIntersections() {
				return this.booking.resourcesIds.length > 1;
			}
		},
		methods: {
			createPopup(options) {
				return new main_popup.Popup({
					autoHide: true,
					cacheable: true,
					darkMode: true,
					...options
				});
			},
			showTooltipTop(options) {
				if (!this.tooltipTop) {
					this.tooltipTop = this.createPopup({
						id: `resize-top-${this.bookingId}-${this.resourceId}`,
						bindElement: this.$refs.bookingResizeTop,
						bindOptions: {
							position: 'bottom'
						},
						offsetLeft: this.$refs.bookingResizeTop.offsetWidth / 2,
						content: this.loc('BOOKING_RESIZE_GRID_LIMIT'),
						...options
					});
				} else if (options?.content) {
					this.tooltipTop.setContent(options.content);
				}
				this.tooltipTop.show();
			},
			showTooltipBottom(options) {
				if (!this.tooltipBottom) {
					this.tooltipBottom = this.createPopup({
						id: `resize-bottom-${this.bookingId}-${this.resourceId}`,
						bindElement: this.$refs.bookingResizeBottom,
						bindOptions: {
							position: 'bottom'
						},
						offsetLeft: this.$refs.bookingResizeBottom.offsetWidth / 2,
						content: this.loc('BOOKING_RESIZE_GRID_LIMIT'),
						...options
					});
				} else if (options?.content) {
					this.tooltipBottom.setContent(options.content);
				}
				this.tooltipBottom.show();
			},
			hideTooltips() {
				this.tooltipTop?.close?.();
				this.tooltipBottom?.close?.();
			},
			onMouseDown(event) {
				const direction = main_core.Dom.hasClass(event.target, '--from') ? ResizeDirection.From : ResizeDirection.To;
				void this.startResize(direction);
			},
			async startResize(direction = ResizeDirection.To) {
				main_core.Dom.style(document.body, 'user-select', 'none');
				main_core.Event.bind(window, 'mouseup', this.endResize);
				main_core.Event.bind(window, 'pointermove', this.resize);
				this.resizeDirection = direction;
				void this.updateIds(this.bookingId, this.resourceId);
			},
			resize(event) {
				if (!this.resizeDirection) {
					return;
				}
				const rect = this.$el.getBoundingClientRect();
				const visiblePeriod = booking_lib_booking.bookingService.getVisiblePeriod(this.booking, this.limits);
				const visibleDuration = Math.max(visiblePeriod.toTs - visiblePeriod.fromTs, minInitialDuration);
				const resizeHeight = this.resizeDirection === ResizeDirection.To ? event.clientY - rect.top : rect.bottom - event.clientY;
				const duration = resizeHeight * visibleDuration / this.initialHeight;
				const newDuration = Math.max(duration, minDuration);
				if (this.resizeDirection === ResizeDirection.To) {
					const resizeToLimitTs = visiblePeriod.fromTs + newDuration;
					const resizeFromTs = this.booking.dateFromTs;
					const resizeToTs = Math.min(resizeToLimitTs, this.limits.toTs);
					this.manageToLimitNotification(resizeToLimitTs, resizeToTs);
					this.resizeFromTs = resizeFromTs;
					this.resizeToTs = Math.min(resizeToTs, this.closestOnTo);
				} else {
					const resizeFromLimitTs = visiblePeriod.toTs - newDuration;
					const resizeFromTs = Math.max(resizeFromLimitTs, this.limits.fromTs);
					const resizeToTs = this.booking.dateToTs;
					this.manageFromLimitNotification(resizeFromLimitTs, resizeFromTs);
					this.resizeFromTs = Math.max(resizeFromTs, this.closestOnFrom);
					this.resizeToTs = resizeToTs;
				}
				this.$emit('update', this.resizeFromTs, this.resizeToTs);
			},
			async endResize() {
				this.resizeBooking();
				this.hideTooltips();
				main_core.Dom.style(document.body, 'user-select', '');
				main_core.Event.unbind(window, 'mouseup', this.endResize);
				main_core.Event.unbind(window, 'pointermove', this.resize);
				this.$emit('update', null, null);
				await this.updateIds(null, null);
			},
			manageFromLimitNotification(resizeFromTs, fromTs) {
				const colliding = this.colliding.filter(({
					toTs
				}) => toTs === this.closestOnFrom);
				if (resizeFromTs < this.limits.fromTs) {
					this.showTooltipTop({
						content: this.loc('BOOKING_RESIZE_GRID_LIMIT')
					});
					return;
				}
				if (fromTs < this.closestOnFrom) {
					if (this.checkClosestByIntersection(colliding)) {
						this.showTooltipTop({
							content: this.loc('BOOKING_RESIZE_INTERSECTIONS_LIMIT')
						});
						return;
					}
					this.showTooltipTop({
						content: this.loc('BOOKING_RESIZE_LIMIT')
					});
					return;
				}
				this.hideTooltips();
			},
			manageToLimitNotification(resizeToTs, toTs) {
				const colliding = this.colliding.filter(({
					fromTs
				}) => fromTs === this.closestOnTo);
				if (resizeToTs > this.limits.toTs) {
					this.showTooltipBottom({
						content: this.loc('BOOKING_RESIZE_GRID_LIMIT')
					});
					return;
				}
				if (toTs > this.closestOnTo) {
					if (this.checkClosestByIntersection(colliding)) {
						this.showTooltipBottom({
							content: this.loc('BOOKING_RESIZE_INTERSECTIONS_LIMIT')
						});
						return;
					}
					this.showTooltipBottom({
						content: this.loc('BOOKING_RESIZE_LIMIT')
					});
					return;
				}
				this.hideTooltips();
			},
			checkClosestByIntersection(colliding) {
				return this.hasIntersections && (colliding.length === 1 || colliding.filter(coll => coll.resourcesIds[0] !== this.resourceId).length >= 2);
			},
			async updateIds(bookingId, resourceId) {
				await Promise.all([this.$store.dispatch(`${booking_const.Model.Interface}/setResizedBookingId`, bookingId), this.$store.dispatch(`${booking_const.Model.Interface}/setDraggedBookingResourceId`, resourceId)]);
				void booking_lib_busySlots.busySlots.loadBusySlots();
			},
			resizeBooking() {
				if (!this.dateFromTsRounded || !this.dateToTsRounded) {
					return;
				}
				if (this.dateFromTsRounded === this.booking.dateFromTs && this.dateToTsRounded === this.booking.dateToTs) {
					return;
				}
				const resource = this.$store.getters[`${booking_const.Model.Resources}/getById`](this.resourceId);
				if (resource.isDeleted) {
					return;
				}
				const id = this.bookingId;
				const booking = {
					id,
					dateFromTs: this.dateFromTsRounded,
					dateToTs: this.dateToTsRounded,
					timezoneFrom: this.booking.timezoneFrom,
					timezoneTo: this.booking.timezoneTo
				};
				if (!booking_lib_isRealId.isRealId(this.bookingId)) {
					void this.$store.dispatch(`${booking_const.Model.Bookings}/update`, {
						id,
						booking
					});
					return;
				}
				void booking_provider_service_bookingService.bookingService.update({
					id,
					...booking
				});
			},
			roundTimestamp(timestamp) {
				const fiveMinutes = booking_lib_duration.Duration.getUnitDurations().i * 5;
				return Math.round(timestamp / fiveMinutes) * fiveMinutes;
			}
		},
		template: `
		<div>
			<div ref="bookingResizeTop" class="booking-booking-resize --from" @mousedown="onMouseDown"></div>
			<div ref="bookingResizeBottom" class="booking-booking-resize --to" @mousedown="onMouseDown"></div>
		</div>
	`
	};

	const MinDetailedBookingDurationMs = 8 * booking_lib_duration.Duration.getUnitDurations().H;

	class BookingCardDataService extends booking_component_bookingCard.AbstractCardDataService {
		get dataKindAttribute() {
			return booking_const.EntityDataAttribute.Booking;
		}
		get item() {
			return this.$store.getters[`${booking_const.Model.Bookings}/getById`](this.itemId);
		}
		get primaryClient() {
			const primaryClientData = this.item.primaryClient;
			if (!primaryClientData) {
				return null;
			}
			return this.$store.getters[`${booking_const.Model.Clients}/getByClientData`](primaryClientData);
		}
		createDealHelper() {
			return new booking_lib_dealHelper.BookingDealHelper(this.itemId);
		}
		get skus() {
			return this.item.skus ?? [];
		}
		async saveNote(note) {
			await booking_provider_service_bookingService.bookingService.update({
				id: this.itemId,
				note
			});
		}
		async addClients(clients) {
			await booking_provider_service_bookingService.bookingService.update({
				id: this.itemId,
				clients
			});
		}
	}

	const bookingStatesMixin = {
		computed: {
			...ui_vue3_vuex.mapGetters({
				isBookingCreatedFromEmbed: `${booking_const.Model.Interface}/isBookingCreatedFromEmbed`,
				selectedDateTs: `${booking_const.Model.Interface}/selectedDateTs`,
				fromHour: `${booking_const.Model.Interface}/fromHour`,
				toHour: `${booking_const.Model.Interface}/toHour`,
				editingBookingId: `${booking_const.Model.Interface}/editingBookingId`,
				isEditingBookingMode: `${booking_const.Model.Interface}/isEditingBookingMode`,
				getResourceById: `${booking_const.Model.Resources}/getById`,
				isDeletingResourceFilterMode: `${booking_const.Model.Filter}/isDeletingResourceFilterMode`,
				deletingResource: `${booking_const.Model.Filter}/deletingResource`,
				isMenuOpenedForBooking: `${booking_const.Model.Interface}/isMenuOpenedForBooking`
			}),
			offHoursExpanded() {
				return this.gridContext?.offHoursExpanded ?? this.$store.getters[`${booking_const.Model.Interface}/offHoursExpanded`];
			},
			isReal() {
				return booking_lib_isRealId.isRealId(this.bookingId);
			},
			realBooking() {
				return main_core.Type.isNumber(this.bookingId);
			},
			isDeletedResource() {
				return this.getResourceById(this.resourceId)?.isDeleted ?? false;
			},
			disabled() {
				return this.isEditingBookingMode && this.editingBookingId !== this.bookingId;
			},
			disabledHover() {
				return this.draggedDataTransfer.id > 0 && (this.draggedDataTransfer.kind !== booking_const.DraggedElementKind.Booking || this.draggedDataTransfer.id !== this.bookingId);
			},
			isExpiredBooking() {
				return this.booking.dateToTs < this.nowTs;
			},
			isNotVisited() {
				const started = this.nowTs > this.booking.dateFromTs;
				const statusUnknown = this.booking.visitStatus === booking_const.VisitStatus.Unknown;
				const statusNotVisited = this.booking.visitStatus === booking_const.VisitStatus.NotVisited;
				return started && statusUnknown || statusNotVisited;
			},
			hasAccent() {
				return this.editingBookingId === this.bookingId || this.isBookingCreatedFromEmbed(this.bookingId) || this.isMenuOpenedForBooking(this.bookingId, this.resourceId);
			},
			isOutOfWorkingHours() {
				const workingHoursStartTs = new Date(this.selectedDateTs).setHours(this.fromHour, 0, 0, 0);
				const workingHoursEndTs = new Date(this.selectedDateTs).setHours(this.toHour, 0, 0, 0);
				return this.booking.dateToTs <= workingHoursStartTs || this.booking.dateFromTs >= workingHoursEndTs;
			},
			isShaded() {
				return this.isDeletingResourceFilterMode && this.resourceId !== this.deletingResource.id;
			}
		}
	};

	class OverbookingTimeCalculator {
		static calcFreeSpace(props) {
			const {
				booking,
				colliding,
				selectedDateTs,
				draggedBookingResourcesIds
			} = props;
			const minTs = new Date(selectedDateTs).setHours(0, 0, 0, 0);
			const maxTs = new Date(selectedDateTs).setHours(24, 0, 0, 0);
			const freeSpace = {
				fromTs: minTs,
				toTs: maxTs
			};
			if (draggedBookingResourcesIds.length > 1) {
				const bookingColliding = colliding.find(({
					fromTs
				}) => fromTs === booking.dateFromTs);
				if (bookingColliding && draggedBookingResourcesIds.every(id => bookingColliding.resourcesIds.includes(id))) {
					return null;
				}
			}
			for (const {
				fromTs,
				toTs
			} of colliding) {
				if (toTs <= booking.dateFromTs) {
					freeSpace.fromTs = Math.max(freeSpace.fromTs, toTs);
				}
				if (booking.dateToTs <= fromTs) {
					freeSpace.toTs = Math.min(freeSpace.toTs, fromTs);
				}
			}
			if (freeSpace.fromTs === minTs && freeSpace.toTs === maxTs) {
				return null;
			}
			return freeSpace;
		}
		static calcTimeForDroppedBooking(props) {
			const {
				freeSpace,
				booking,
				droppedBooking
			} = props;
			const duration = droppedBooking.dateToTs - droppedBooking.dateFromTs;
			if (booking.dateFromTs >= freeSpace.fromTs && booking.dateFromTs + duration <= freeSpace.toTs) {
				return {
					fromTs: booking.dateFromTs,
					toTs: booking.dateFromTs + duration
				};
			}
			if (booking.dateToTs - duration >= freeSpace.fromTs && booking.dateToTs <= freeSpace.toTs) {
				return {
					fromTs: booking.dateToTs - duration,
					toTs: booking.dateToTs
				};
			}
			return {
				fromTs: freeSpace.fromTs,
				toTs: freeSpace.fromTs + duration
			};
		}
	}

	const dropHandlerMixin = {
		data() {
			return {
				dropArea: false,
				freeSpace: null
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				draggedDataTransfer: `${booking_const.Model.Interface}/draggedDataTransfer`,
				draggedBookingId: `${booking_const.Model.Interface}/draggedBookingId`,
				getWaitListItemById: `${booking_const.Model.WaitList}/getById`,
				getBookingById: `${booking_const.Model.Bookings}/getById`
			})
		},
		watch: {
			draggedDataTransfer: {
				handler(draggedDataTransfer) {
					if (this.hasOverbooking) {
						return;
					}
					if (!draggedDataTransfer || !draggedDataTransfer.kind || !draggedDataTransfer.id) {
						this.stopDropHandler();
						return;
					}
					const mayOverbooking = this.isWeekMode ? this.bookingDurationMs < booking_lib_drag.MaxInteractionBookingDurationsMs : this.bookingDurationMs > booking_lib_drag.MaxInteractionBookingDurationsMs;
					if (mayOverbooking) {
						return;
					}
					if (draggedDataTransfer.kind === booking_const.DraggedElementKind.Booking) {
						if (draggedDataTransfer.id === this.bookingId) {
							return;
						}
						const draggedBooking = this.getBookingById(draggedDataTransfer.id);
						if (!booking_lib_drag.dragPolicy.canMoveBookingOnGrid(draggedBooking)) {
							this.stopDropHandler();
							return;
						}
					}
					this.startDropHandler();
				},
				deep: true
			}
		},
		methods: {
			dragMouseEnter() {
				if (this.isDeletedResource) {
					this.dropArea = false;
					return;
				}
				if (this.dropArea || !this.draggedDataTransfer.id) {
					return;
				}
				if (this.draggedDataTransfer.kind === booking_const.DraggedElementKind.WaitListItem) {
					this.freeSpace = {
						fromTs: this.booking.dateFromTs,
						toTs: this.booking.dateToTs,
						resourcesIds: this.booking.resourcesIds
					};
					this.dropArea = true;
					return;
				}
				const draggedBookingId = this.draggedBookingId;
				if (draggedBookingId === null) {
					return;
				}
				const draggedBooking = this.getBookingById(draggedBookingId);
				const bookingDuration = this.booking.dateToTs - this.booking.dateFromTs;
				const draggedBookingDuration = draggedBooking.dateToTs - draggedBooking.dateFromTs;
				if (bookingDuration >= draggedBookingDuration && draggedBooking.resourcesIds.length <= 1) {
					this.freeSpace = {
						fromTs: this.booking.dateFromTs,
						toTs: this.booking.dateToTs,
						resourcesIds: this.booking.resourcesIds
					};
					this.dropArea = true;
					return;
				}
				const excludeBookingFn = booking => {
					if (booking.id === this.draggedBookingId) {
						return true;
					}
					const overbooking = this.overbookingMap.get(booking.id);
					const resourceId = this.resourceId;
					return !overbooking || overbooking.items.some(item => item.resourceId === resourceId);
				};
				const colliding = this.$store.getters[`${booking_const.Model.Interface}/getColliding`](this.resourceId, excludeBookingFn);
				if (colliding.length === 0) {
					this.freeSpace = {
						fromTs: this.booking.dateFromTs,
						toTs: this.booking.dateToTs,
						resourcesIds: this.booking.resourcesIds
					};
					this.dropArea = true;
					return;
				}
				const freeSpace = OverbookingTimeCalculator.calcFreeSpace({
					booking: this.booking,
					colliding,
					selectedDateTs: this.selectedDateTs,
					draggedBookingResourcesIds: draggedBooking.resourcesIds
				});
				this.freeSpace = freeSpace;
				this.dropArea = freeSpace && freeSpace.toTs - freeSpace.fromTs >= draggedBookingDuration;
			},
			dragMouseLeave() {
				this.dropArea = false;
				this.freeSpace = null;
			},
			async dropElement() {
				const id = this.draggedDataTransfer.id;
				if (!id || !this.freeSpace) {
					return;
				}
				if (this.draggedDataTransfer.kind === booking_const.DraggedElementKind.Booking) {
					await this.dropBooking(id);
				} else if (this.draggedDataTransfer.kind === booking_const.DraggedElementKind.WaitListItem) {
					await this.dropWaitListItem(id);
				}
			},
			async dropBooking(id) {
				if (!this.enabledFeature.bookingOverbooking) {
					main_core.Event.EventEmitter.emit(booking_const.EventName.StartLockedBookingAnimation, {
						bookingId: this.draggedDataTransfer.id,
						featureId: booking_const.LimitFeatureId.Overbooking
					});
					return;
				}
				const droppedBooking = this.getBookingById(id);
				const {
					fromTs,
					toTs
				} = OverbookingTimeCalculator.calcTimeForDroppedBooking({
					freeSpace: this.freeSpace,
					booking: this.booking,
					droppedBooking
				});
				const overbooking = {
					id,
					dateFromTs: fromTs,
					dateToTs: toTs,
					timezoneFrom: droppedBooking.timezoneFrom,
					timezoneTo: droppedBooking.timezoneTo,
					resourcesIds: [...new Set([this.resourceId, ...droppedBooking.resourcesIds.slice(1, droppedBooking.resourcesIds.length)])]
				};
				if (!booking_lib_isRealId.isRealId(id)) {
					await this.$store.dispatch(`${booking_const.Model.Bookings}/update`, {
						id,
						booking: overbooking
					});
					return;
				}
				await booking_provider_service_bookingService.bookingService.update({
					id,
					...overbooking
				});
			},
			async dropWaitListItem(id) {
				if (!this.enabledFeature.bookingOverbooking) {
					void booking_lib_limit.limit.show(booking_const.LimitFeatureId.Overbooking);
					return;
				}
				const droppedWaitListItem = this.getWaitListItemById(id);
				const clients = [...droppedWaitListItem.clients];
				const resource = this.getResourceById(this.resourceId);
				const timezone = resource?.slotRanges?.[0]?.timezone;
				const overbooking = {
					id: `wl${id}`,
					resourcesIds: [this.resourceId],
					name: droppedWaitListItem.name,
					note: droppedWaitListItem.note,
					clients,
					primaryClient: clients.length > 0 ? clients[0] : undefined,
					externalData: [...droppedWaitListItem.externalData],
					dateFromTs: this.booking.dateFromTs,
					dateToTs: this.booking.dateToTs,
					timezoneFrom: timezone,
					timezoneTo: timezone
				};
				const result = await booking_provider_service_bookingService.bookingService.createFromWaitListItem(id, overbooking);
				if (result.success && result.booking) {
					booking_lib_analytics.BookingAnalytics.sendAddBooking({
						isOverbooking: true
					});
				}
			},
			startDropHandler() {
				main_core.Event.bind(this.$el, 'mousemove', this.dragMouseEnter, {
					capture: true
				});
				main_core.Event.bind(this.$el, 'mouseleave', this.dragMouseLeave, {
					capture: true
				});
				main_core.Event.bind(this.$el, 'mouseup', this.dropElement, {
					capture: true
				});
			},
			stopDropHandler() {
				this.dropArea = false;
				this.freeSpace = null;
				main_core.Event.unbind(this.$el, 'mousemove', this.dragMouseEnter, {
					capture: true
				});
				main_core.Event.unbind(this.$el, 'mouseleave', this.dragMouseLeave, {
					capture: true
				});
				main_core.Event.unbind(this.$el, 'mouseup', this.dropElement, {
					capture: true
				});
			}
		}
	};

	const lockedAnimationMixin = {
		data() {
			return {
				isLockedAnimation: false
			};
		},
		beforeMount() {
			if (!this.enabledFeature.bookingOverbooking || !this.enabledFeature.bookingWaitlist) {
				main_core.Event.EventEmitter.subscribe(booking_const.EventName.StartLockedBookingAnimation, this.startLockBookingAnimation);
			}
		},
		unmounted() {
			main_core.Event.EventEmitter.unsubscribe(booking_const.EventName.StartLockedBookingAnimation, this.startLockBookingAnimation);
		},
		methods: {
			startLockBookingAnimation(event) {
				if (this.bookingId !== event.getData()?.bookingId) {
					return;
				}
				void this.$nextTick(() => {
					this.isLockedAnimation = true;
					setTimeout(() => {
						this.isLockedAnimation = false;
						void booking_lib_limit.limit.show(event.getData()?.featureId ?? booking_const.LimitFeatureId.Overbooking);
					}, 800);
				});
			}
		}
	};

	const overbookingLayoutMixin = {
		computed: {
			...ui_vue3_vuex.mapGetters({
				overbookingMap: `${booking_const.Model.Bookings}/overbookingMap`
			}),
			overbooking() {
				return this.overbookingMap.get(this.bookingId) || null;
			},
			overbookingInResource() {
				return this.overbooking?.items?.find(item => item.resourceId === this.resourceId) || null;
			},
			overbookingDependencies() {
				return (this.overbookingInResource?.intersections || []).map(({
					id
				}) => id);
			},
			hasOverbooking() {
				return (this.overbookingInResource?.intersections || []).some(({
					id
				}) => !this.deletingBookings.includes(id));
			},
			isShifted() {
				return this.hasOverbooking && main_core.Type.isPlainObject(this.overbookingInResource) && this.overbookingInResource.shifted;
			},
			overlappingBookings() {
				const bookingId = !this.isShifted || !this.hasOverbooking ? this.bookingId : this.overbookingDependencies[0];
				return this.bookingUiGroups.find(({
					bookingIds
				}) => bookingIds.includes(bookingId))?.bookingIds || [];
			},
			bookingWidth() {
				if (this.hasOverbooking) {
					return this.countWidth(this.overlappingBookings) / 2;
				}
				return this.countWidth(this.overlappingBookings);
			},
			bookingHeight() {
				if (this.hasOverbooking) {
					return this.countHeight(this.overlappingBookings) / 2;
				}
				return this.countHeight(this.overlappingBookings);
			},
			leftOffset() {
				return this.countSideOffset(this.bookingWidth);
			},
			topOffset() {
				return this.countSideOffset(this.bookingHeight);
			}
		},
		methods: {
			countOffset({
				bookingId,
				sideSize,
				overlappingBookings
			}) {
				let index = overlappingBookings.indexOf(bookingId);
				if (index === -1) {
					index = 0;
				}
				return sideSize * index;
			},
			countWidth(overlappingBookings) {
				const count = overlappingBookings.length > 0 ? overlappingBookings.length : 1;
				return booking_lib_grid.gridTokens.get(booking_lib_grid.GridTokenKey.DayCellWidth) / count;
			},
			countHeight(overlappingBookings) {
				const count = overlappingBookings.length > 0 ? overlappingBookings.length : 1;
				return booking_lib_grid.gridTokens.get(booking_lib_grid.GridTokenKey.WeekCellHeight) / count;
			},
			countSideOffset(size) {
				if (this.isShifted) {
					const sideOffset = this.countOffset({
						bookingId: this.overbookingDependencies[0],
						sideSize: size,
						overlappingBookings: this.overlappingBookings
					});
					return sideOffset * 2 + size;
				}
				return this.countOffset({
					bookingId: this.booking.id,
					sideSize: this.hasOverbooking ? size * 2 : size,
					overlappingBookings: this.overlappingBookings
				});
			}
		}
	};

	const visibilityMixin = {
		data() {
			return {
				visible: true
			};
		},
		mounted() {
			this.updateVisibility();
			this.updateVisibilityDuringTransition();
		},
		methods: {
			updateVisibilityDuringTransition() {
				this.animation?.stop();
				// eslint-disable-next-line new-cap
				this.animation = new BX.easing({
					duration: 200,
					start: {},
					finish: {},
					step: this.updateVisibility
				});
				this.animation.animate();
			},
			updateVisibility() {
				if (!this.$el) {
					return;
				}
				const rect = this.$el.getBoundingClientRect();
				this.visible = rect.right > 0 && rect.left < window.innerWidth;
			}
		},
		watch: {
			scroll() {
				this.updateVisibility();
			},
			zoom() {
				this.updateVisibility();
			},
			resourcesIds() {
				this.updateVisibilityDuringTransition();
			},
			visible(visible) {
				if (visible) {
					return;
				}
				setTimeout(() => {
					this.updateVisibility();
				}, 2000);
			}
		}
	};

	// @vue/component
	const BookingBase = {
		name: 'GridBooking',
		components: {
			Actions,
			BookingAddClient,
			BookingCard: booking_component_bookingCard.BookingCard,
			BookingDuration,
			Counter,
			Resize: Resize$1,
			BookingPreviewPopup
		},
		mixins: [visibilityMixin, dropHandlerMixin, lockedAnimationMixin, overbookingLayoutMixin, bookingStatesMixin],
		inject: {
			gridContext: {
				default: null
			}
		},
		props: {
			bookingId: {
				type: [Number, String],
				required: true
			},
			resourceId: {
				type: Number,
				required: true
			},
			nowTs: {
				type: Number,
				required: true
			},
			/**
			 * @param {BookingUiGroup[]} bookingUiGroups
			 */
			bookingUiGroups: {
				type: Array,
				default: () => []
			}
		},
		data() {
			return {
				resizeFromTs: null,
				resizeToTs: null,
				isPreviewPopupShown: false
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				selectedFirstDayPeriodTs: `${booking_const.Model.Interface}/selectedFirstDayPeriodTs`,
				getBookingById: `${booking_const.Model.Bookings}/getById`,
				deletingBookingsMap: `${booking_const.Model.Interface}/deletingBookings`,
				animationPause: `${booking_const.Model.Interface}/animationPause`,
				scroll: `${booking_const.Model.Interface}/scroll`,
				resourcesIds: `${booking_const.Model.Interface}/resourcesIds`
			}),
			grid() {
				return booking_lib_grid.GridFactory.getGrid(this.gridContext);
			},
			zoom() {
				if (this.gridContext) {
					return this.gridContext.zoom;
				}
				return this.$store.getters[`${booking_const.Model.Interface}/zoom`];
			},
			isWeekMode() {
				if (this.gridContext) {
					return this.gridContext.gridMode === booking_const.Grid.Mode.Week;
				}
				return this.$store.getters[`${booking_const.Model.Interface}/isWeekMode`];
			},
			resizeEnabled() {
				return this.gridContext?.resizeEnabled ?? true;
			},
			booking() {
				return this.getBookingById(this.bookingId);
			},
			dateFromTs() {
				return this.resizeFromTs ?? this.booking.dateFromTs;
			},
			isPayable() {
				return Boolean(this.booking.payment?.id);
			},
			isPaid() {
				return Boolean(this.booking.payment?.isPaid) || Boolean(this.booking.payment?.isPaidManually);
			},
			dateFromTsRounded() {
				return this.roundTimestamp(this.resizeFromTs) ?? this.dateFromTs;
			},
			dateToTs() {
				return this.resizeToTs ?? this.booking.dateToTs;
			},
			dateToTsRounded() {
				return this.roundTimestamp(this.resizeToTs) ?? this.dateToTs;
			},
			deletingBookings() {
				return Object.values(this.deletingBookingsMap);
			},
			enabledFeature() {
				return this.$store.state[booking_const.Model.Interface].enabledFeature;
			},
			actionsPopupOptions() {
				return {
					overbooking: {
						disabled: this.overbooking !== null,
						hidden: this.isDeletedResource
					},
					waitList: {
						hidden: this.isDeletedResource
					}
				};
			},
			dataAttributes() {
				return {
					...this.cardDataService.buildDataAttributes('booking-booking-card-container'),
					'data-booking-id': this.bookingId,
					'data-resource-id': this.resourceId,
					'data-from': this.dateFromTs,
					'data-to': this.dateToTs
				};
			},
			bookingDurationMs() {
				return this.booking.dateToTs - this.booking.dateFromTs;
			},
			visiblePeriod() {
				if (!this.gridContext) {
					const visiblePeriod = booking_lib_datePeriod.DatePeriod.createByCurrentGridMode();
					return {
						fromTs: visiblePeriod.fromTs * 1000,
						toTs: visiblePeriod.toTs * 1000
					};
				}
				const fromTs = this.isWeekMode ? this.selectedFirstDayPeriodTs : this.selectedDateTs;
				const durationMs = this.isWeekMode ? booking_const.Grid.Duration.Week : booking_const.Grid.Duration.Day;
				return {
					fromTs,
					toTs: fromTs + durationMs
				};
			},
			visibleBookingDurationMs() {
				return booking_lib_booking.bookingService.getVisibleDuration(this.booking, this.visiblePeriod);
			},
			isWeekGridDetailed() {
				return this.visibleBookingDurationMs > MinDetailedBookingDurationMs;
			},
			isVisibleStartBooking() {
				return false;
			},
			isVisibleEndBooking() {
				return false;
			},
			isVisibleMiddleBooking() {
				return false;
			},
			isMinimalView() {
				return !this.isWeekMode || this.isWeekMode && this.isWeekGridDetailed;
			},
			shouldBeHidden() {
				return false;
			},
			bookingClasses() {
				return {
					'--short': this.overlappingBookings.length > 1,
					'--overbooking': this.hasOverbooking,
					'--overbooking-bg': this.hasOverbooking || this.overbooking !== null,
					'--shifted': this.isShifted && !this.realBooking,
					'--drop-area': this.dropArea,
					'--accent': this.hasAccent,
					'--shaded': this.isShaded,
					'not-transition': this.animationPause,
					'--locked': this.isLockedAnimation,
					'--not-real': !this.isReal,
					'--zoom-is-less-than-08': this.zoom < 0.8,
					'--compact-mode': this.realHeight < 40 || this.zoom < 0.8,
					'--small': this.realHeight > 15 && this.realHeight <= 20,
					'--extra-small': this.realHeight <= 15,
					'--long': this.realHeight >= 65,
					'--disabled': this.disabled,
					'--confirmed': this.booking.isConfirmed && !this.isNotVisited,
					'--expired': this.isExpiredBooking,
					'--not-visited': this.isNotVisited,
					'--resizing': this.resizeFromTs && this.resizeToTs,
					'--no-pointer-events': this.disabledHover,
					'--is-payable': this.isPayable,
					'--not-paid': this.isPayable && !this.isPaid,
					'--week-grid-detailed': this.isWeekGridDetailed,
					'--start-booking': this.isVisibleStartBooking,
					'--end-booking': this.isVisibleEndBooking,
					'--middle-booking': this.isVisibleMiddleBooking
				};
			}
		},
		created() {
			this.previewPopupShowTimeout = null;
			this.cardDataService = new BookingCardDataService(this.bookingId);
		},
		mounted() {
			setTimeout(() => {
				if (!this.isReal && this.resizeEnabled && this.$refs.resize && booking_lib_mousePosition.mousePosition.isMousePressed()) {
					void this.$refs.resize.startResize();
				}
			}, 300);
		},
		beforeUnmount() {
			this.hidePreviewPopup();
			if (this.deletingBookingsMap[this.bookingId] || !this.booking?.resourcesIds.includes(this.resourceId)) {
				this.$el.remove();
			}
		},
		methods: {
			showPreviewPopup() {
				if (!this.isWeekMode || this.disabledHover) {
					return;
				}
				if (this.visibleBookingDurationMs >= booking_lib_duration.Duration.getUnitDurations().d * 1.5) {
					return;
				}
				this.clearPreviewPopupTimeout();
				this.previewPopupShowTimeout = setTimeout(() => {
					this.isPreviewPopupShown = true;
				}, 100);
			},
			clearPreviewPopupTimeout() {
				clearTimeout(this.previewPopupShowTimeout);
				this.previewPopupShowTimeout = null;
			},
			hidePreviewPopup() {
				this.clearPreviewPopupTimeout();
				this.isPreviewPopupShown = false;
			},
			resizeUpdate(resizeFromTs, resizeToTs) {
				this.resizeFromTs = resizeFromTs;
				this.resizeToTs = resizeToTs;
			},
			roundTimestamp(timestamp) {
				const fiveMinutes = booking_lib_duration.Duration.getUnitDurations().i * 5;
				return timestamp ? Math.round(timestamp / fiveMinutes) * fiveMinutes : null;
			}
		},
		template: `
		<BookingCard
			ref="card"
			v-show="!shouldBeHidden"
			:styles="[geometryVariables]"
			:classes="['booking-booking-booking', 'booking--draggable-item', bookingClasses]"
			:isMinimalView
			:disabled
			:cardDataService
			:dataAttributes
			@mouseenter="showPreviewPopup"
			@mouseleave="hidePreviewPopup"
			@click="hidePreviewPopup"
			@communicationMouseenter="hidePreviewPopup"
		>
			<template #start>
				<Counter :bookingId="bookingId" :nowTs="nowTs"/>
				<BookingPreviewPopup
					v-if="isPreviewPopupShown"
					:bindElement="$refs.card.$el"
					:title="cardDataService.title"
					:bookingId
					:dateFromTs
					:dateToTs
				/>
			</template>
			<template #upper-content-row>
				<BookingDuration
					:bookingId="bookingId"
					:resourceId="resourceId"
					:startTs="dateFromTsRounded"
					:endTs="dateToTsRounded"
				/>
			</template>
			<template #lower-content-row>
				<BookingDuration
					:bookingId="bookingId"
					:resourceId="resourceId"
					:startTs="dateFromTsRounded"
					:endTs="dateToTsRounded"
				/>
			</template>
			<template #add-client-button>
				<BookingAddClient
					:cardDataService
					:expired="isExpiredBooking"
				/>
			</template>
			<template #actions>
				<Actions
					:bookingId
					:resourceId
					:actionsPopupOptions
				/>
			</template>
			<template #resize v-if="!isWeekMode && resizeEnabled">
				<Resize
					v-if="!disabled"
					:bookingId="bookingId"
					:resourceId="resourceId"
					ref="resize"
					@update="resizeUpdate"
				/>
			</template>
		</BookingCard>
	`
	};

	// @vue/component
	const BookingDay = {
		name: 'DayGridBooking',
		extends: BookingBase,
		computed: {
			realHeight() {
				return this.grid.calculateRealHeight(this.resizeFromTs ?? this.booking.dateFromTs, this.resizeToTs ?? this.booking.dateToTs);
			},
			isVisibleStartBooking() {
				const daySelected = this.selectedDateTs;
				const nextDay = daySelected + booking_lib_duration.Duration.getUnitDurations().d;
				return this.booking.dateFromTs >= daySelected && this.booking.dateToTs > nextDay;
			},
			isVisibleEndBooking() {
				const daySelected = this.selectedDateTs;
				const nextDay = daySelected + booking_lib_duration.Duration.getUnitDurations().d;
				const {
					dateFromTs,
					dateToTs
				} = this.booking;
				const endsThisDay = dateToTs > daySelected && dateToTs <= nextDay;
				return dateFromTs < daySelected && endsThisDay;
			},
			isVisibleMiddleBooking() {
				const daySelected = this.selectedDateTs;
				const nextDay = daySelected + booking_lib_duration.Duration.getUnitDurations().d;
				return this.booking.dateFromTs < daySelected && this.booking.dateToTs >= nextDay;
			},
			geometryVariables() {
				const left = this.grid.calculateLeft(this.resourceId) + this.leftOffset * this.zoom;
				const top = this.grid.calculateTop(this.dateFromTs);
				const height = this.grid.calculateHeight(this.dateFromTs, this.dateToTs);
				const width = this.bookingWidth;
				return {
					'--left': `${left}px`,
					'--top': `${top}px`,
					'--height': `${height}px`,
					'--width': `${width}px`
				};
			},
			shouldBeHidden() {
				return !this.offHoursExpanded && this.isOutOfWorkingHours;
			}
		}
	};

	// @vue/component
	const CreateRestrictionOverlay = {
		name: 'CreateRestrictionOverlay',
		components: {
			UiRestrictionPopup
		},
		props: {
			resourceId: {
				type: Number,
				required: true
			}
		},
		data() {
			return {
				isHovered: false
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				selectedDateTs: `${booking_const.Model.Interface}/selectedDateTs`,
				isWeekMode: `${booking_const.Model.Interface}/isWeekMode`
			}),
			grid() {
				return booking_lib_grid.GridFactory.getGrid();
			},
			resource() {
				return this.$store.getters[`${booking_const.Model.Resources}/getById`](this.resourceId);
			},
			slotSizeMs() {
				return (this.resource.slotRanges[0]?.slotSize ?? 60) * 60 * 1000;
			},
			isRestricted() {
				return this.slotSizeMs > booking_lib_drag.MaxInteractionBookingDurationsMs;
			},
			dayStartTs() {
				return this.selectedDateTs;
			},
			dayEndTs() {
				const date = new Date(this.selectedDateTs);
				return date.setDate(date.getDate() + 1);
			},
			left() {
				return this.grid.calculateLeft(this.resourceId);
			},
			top() {
				return this.grid.calculateTop(this.dayStartTs);
			},
			height() {
				return this.grid.calculateHeight(this.dayStartTs, this.dayEndTs);
			},
			popupId() {
				return `booking-day-creation-restriction-${this.resourceId}`;
			}
		},
		methods: {
			onMouseEnter() {
				this.isHovered = true;
			},
			onMouseLeave() {
				this.isHovered = false;
			}
		},
		template: `
		<div
			v-if="!isWeekMode && isRestricted && left >= 0"
			class="booking-booking-create-restriction-overlay"
			:style="{
				'--left': left + 'px',
				'--top': top + 'px',
				'--height': height + 'px',
			}"
			@mouseenter="onMouseEnter"
			@mouseleave="onMouseLeave"
		>
			<UiRestrictionPopup
				v-if="isHovered"
				:message="loc('BOOKING_BOOKING_DAY_CELL_RESTRICTION')"
				:popupId="popupId"
			/>
		</div>
	`
	};

	const {
		mapGetters: mapBookingsGetters$1
	} = ui_vue3_vuex.createNamespacedHelpers(booking_const.Model.Bookings);
	const {
		mapGetters: mapInterfaceGetters$4
	} = ui_vue3_vuex.createNamespacedHelpers(booking_const.Model.Interface);
	const {
		mapGetters: mapFilterGetters$2
	} = ui_vue3_vuex.createNamespacedHelpers(booking_const.Model.Filter);

	// @vue/component
	const Bookings$1 = {
		name: 'BookingsDay',
		components: {
			BusySlot,
			DayPlacementSlot,
			QuickFilterLine,
			BookingDay,
			CreateRestrictionOverlay
		},
		inject: {
			gridContext: {
				default: null
			}
		},
		data() {
			return {
				nowTs: Date.now()
			};
		},
		computed: {
			...mapBookingsGetters$1({
				overbookingMap: 'overbookingMap'
			}),
			...mapInterfaceGetters$4({
				selectedPlacementSlots: 'selectedPlacementSlots',
				selectedDateTs: 'selectedDateTs',
				hoveredPlacementSlot: 'hoveredPlacementSlot',
				busySlots: 'busySlots',
				isFeatureEnabled: 'isFeatureEnabled',
				editingBookingId: 'editingBookingId',
				embedItems: 'embedItems',
				draggedBookingId: 'draggedBookingId'
			}),
			...mapFilterGetters$2({
				filteredBookingsIds: 'filteredBookingsIds',
				isFilterMode: 'isFilterMode',
				quickFilter: 'quickFilter'
			}),
			resourcesHash() {
				const resources = this.$store.getters[`${booking_const.Model.Resources}/getByIds`](this.resourcesIds).map(({
					id,
					slotRanges
				}) => ({
					id,
					slotRanges
				}));
				return JSON.stringify(resources);
			},
			bookingsHash() {
				const bookings = this.bookings.map(({
					id,
					dateFromTs,
					dateToTs
				}) => ({
					id,
					dateFromTs,
					dateToTs
				}));
				return JSON.stringify(bookings);
			},
			bookings() {
				const dateTs = this.selectedDateTs;
				let bookings = [];
				if (this.isFilterMode) {
					bookings = this.$store.getters[`${booking_const.Model.Bookings}/getByDateAndIds`](dateTs, this.filteredBookingsIds);
				} else {
					bookings = this.$store.getters[`${booking_const.Model.Bookings}/getByDateAndResources`](dateTs, this.resourcesIds);
				}
				return bookings.flatMap(booking => {
					return booking.resourcesIds.filter(resourceId => this.resourcesIds.includes(resourceId)).map(resourceId => {
						return createBookingModelUi(resourceId, booking, this.overbookingMap.get(booking.id));
					});
				}).sort((a, b) => {
					if (a.resourcesIds[0] !== b.resourcesIds[0]) {
						return b.resourcesIds[0] - a.resourcesIds[0];
					}
					if (a.dateFromTs !== b.dateFromTs) {
						return a.dateFromTs - b.dateFromTs;
					}
					return b.overbooking - a.overbooking;
				});
			},
			cells() {
				const cells = [...Object.values(this.selectedPlacementSlots), this.hoveredPlacementSlot];
				const dateFromTs = this.selectedDateTs;
				const dateToTs = new Date(dateFromTs).setDate(new Date(dateFromTs).getDate() + 1);
				return cells.filter(cell => {
					return cell && this.resourcesIds.includes(cell.resourceId) && cell.toTs > dateFromTs && dateToTs > cell.fromTs;
				});
			},
			visibleBusySlots() {
				const dateFromTs = this.selectedDateTs;
				const dateToTs = new Date(dateFromTs).setDate(new Date(dateFromTs).getDate() + 1);
				return this.busySlots.filter(busySlot => {
					return this.resourcesIds.includes(busySlot.resourceId) && busySlot.toTs > dateFromTs && dateToTs > busySlot.fromTs;
				});
			},
			quickFilterHours() {
				if (!this.quickFilterEnabled) {
					return [];
				}
				const activeHours = new Set(Object.values(this.quickFilter.active));
				return Object.values(this.quickFilter.hovered).filter(hour => !activeHours.has(hour));
			},
			quickFilterEnabled() {
				return this.gridContext?.quickFilterEnabled ?? true;
			},
			resourceBookings() {
				return splitBookingsByResourceId(this.bookings);
			},
			resourceBookingsUiGroupsMap() {
				return getResourceBookingUiGroups(this.resourceBookings);
			},
			embedEditingMode() {
				return this.isFeatureEnabled && (this.editingBookingId > 0 || (this.embedItems?.length ?? 0) > 0);
			},
			draggedBooking() {
				if (!this.draggedBookingId) {
					return null;
				}
				return this.bookings.find(({
					id
				}) => id === this.draggedBookingId) || null;
			},
			resourcesIds() {
				if (this.gridContext) {
					return this.gridContext.resourcesIds;
				}
				return this.$store.getters[`${booking_const.Model.Interface}/resourcesIds`];
			}
		},
		watch: {
			selectedDateTs() {
				void booking_lib_busySlots.busySlots.loadBusySlots();
			},
			bookingsHash() {
				void booking_lib_busySlots.busySlots.loadBusySlots();
			},
			resourcesHash() {
				void booking_lib_busySlots.busySlots.loadBusySlots();
			}
		},
		mounted() {
			this.nowTsIntervalId = setInterval(() => {
				this.nowTs = Date.now();
			}, 5 * 1000);
		},
		beforeUnmount() {
			clearInterval(this.nowTsIntervalId);
		},
		methods: {
			generateBookingKey(booking) {
				return booking_lib_booking.bookingService.generateKey(booking);
			},
			getBookingUiGroupsByResourceId(resourceId) {
				return this.resourceBookingsUiGroupsMap.get(resourceId) || [];
			}
		},
		template: `
		<div
			class="booking-booking-bookings"
			:class="{
				'embed-editing-mode': embedEditingMode,
			}"
		>
			<div class="booking-booking-bookings__busy-slots">
				<template v-for="busySlot of visibleBusySlots" :key="busySlot.id">
					<BusySlot
						:busySlot="busySlot"
					/>
				</template>
			</div>
			<div class="booking-booking-bookings__items">
				<TransitionGroup name="booking-transition-booking">
					<template v-for="booking of bookings" :key="generateBookingKey(booking)">
						<BookingDay
							:bookingId="booking.id"
							:resourceId="booking.resourcesIds[0]"
							:nowTs
							:bookingUiGroups="getBookingUiGroupsByResourceId(booking.resourcesIds[0])"
						/>
					</template>
				</TransitionGroup>
			</div>
			<template v-for="resourceId of resourcesIds" :key="'restriction-' + resourceId">
				<CreateRestrictionOverlay
					:resourceId="resourceId"
				/>
			</template>
			<template v-for="cell of cells" :key="cell.id">
				<DayPlacementSlot
					:cell="cell"
					:draggedBooking="draggedBooking"
				/>
			</template>
			<template v-for="hour of quickFilterHours" :key="hour">
				<QuickFilterLine
					:hour="hour"
				/>
			</template>
		</div>
	`
	};

	const halfHour = 30 * 60 * 1000;
	const DayGridCell = {
		name: 'DayGridCell',
		props: {
			/** @type {Cell} */
			cell: {
				type: Object,
				required: true
			}
		},
		data() {
			return {
				halfOffset: 0
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				overbookingMap: `${booking_const.Model.Bookings}/overbookingMap`,
				isFilterMode: `${booking_const.Model.Filter}/isFilterMode`,
				isEditingBookingMode: `${booking_const.Model.Interface}/isEditingBookingMode`,
				draggedBookingId: `${booking_const.Model.Interface}/draggedBookingId`,
				draggedDataTransfer: `${booking_const.Model.Interface}/draggedDataTransfer`,
				resizedBookingId: `${booking_const.Model.Interface}/resizedBookingId`,
				quickFilter: `${booking_const.Model.Filter}/quickFilter`
			}),
			draggedElementId() {
				return this.draggedDataTransfer.id;
			},
			isBookingDragged() {
				return this.draggedDataTransfer.kind === booking_const.DraggedElementKind.Booking;
			},
			isAvailable() {
				if (this.isFilterMode || this.resizedBookingId || this.isEditingBookingMode && !this.draggedDataTransfer.id) {
					return false;
				}
				if (this.isBookingDragged && !booking_lib_drag.dragPolicy.canMoveBookingOnGrid(this.draggedBooking)) {
					return false;
				}
				const {
					fromTs,
					toTs
				} = this.freeSpace;
				const cellFromTs = this.cell.fromTs;
				const cellHalfTs = this.cell.fromTs + halfHour;
				return (toTs > cellFromTs || toTs > cellHalfTs) && toTs - fromTs >= this.duration;
			},
			fromTs() {
				return Math.min(this.freeSpace.toTs - this.duration, this.cell.fromTs) + this.halfOffset;
			},
			toTs() {
				return this.fromTs + this.duration;
			},
			duration() {
				if (this.draggedBooking) {
					return this.draggedBooking.dateToTs - this.draggedBooking.dateFromTs;
				}
				return this.cell.toTs - this.cell.fromTs;
			},
			draggedBooking() {
				return this.$store.getters[`${booking_const.Model.Bookings}/getById`](this.draggedBookingId) ?? null;
			},
			freeSpace() {
				let maxFrom = 0;
				let minTo = Infinity;
				for (const {
					fromTs,
					toTs
				} of this.colliding) {
					if (this.cell.fromTs + halfHour > fromTs && this.cell.fromTs + halfHour < toTs) {
						maxFrom = toTs;
						minTo = fromTs;
						break;
					}
					if (toTs <= this.cell.fromTs + halfHour) {
						maxFrom = Math.max(maxFrom, toTs);
					}
					if (fromTs >= this.cell.fromTs + halfHour) {
						minTo = Math.min(minTo, fromTs);
					}
				}
				return {
					fromTs: maxFrom,
					toTs: minTo
				};
			},
			colliding() {
				return this.$store.getters[`${booking_const.Model.Interface}/getColliding`](this.cell.resourceId, this.excludeBookingColliding);
			},
			quickFilterHovered() {
				return this.cell.minutes / 60 in this.quickFilter.hovered;
			},
			quickFilterActive() {
				return this.cell.minutes / 60 in this.quickFilter.active;
			}
		},
		methods: {
			excludeBookingColliding(booking) {
				if (booking.id === this.draggedBookingId) {
					return true;
				}
				const resourceId = this.cell.resourceId;
				const overbooking = this.overbookingMap.get(booking.id);
				return overbooking && overbooking.items.some(item => item.resourceId === resourceId);
			},
			mouseEnterHandler(event) {
				this.updateHalfHour(event);
			},
			mouseLeaveHandler(event) {
				const nextHoveredCell = event.relatedTarget?.closest('.booking-booking-base-cell');
				if (!nextHoveredCell || nextHoveredCell?.dataset?.selected === 'true') {
					void this.$store.dispatch(`${booking_const.Model.Interface}/setHoveredPlacementSlot`, null);
				}
			},
			mouseMoveHandler(event) {
				this.updateHalfHour(event);
			},
			updateHalfHour(event) {
				if (this.$refs.button?.contains(event.target)) {
					return;
				}
				this.halfOffset = 0;
				const clientY = event.clientY;
				const rect = this.$el.getBoundingClientRect();
				const bottomHalf = clientY > (rect.top + rect.top + rect.height) / 2;
				const canSubtractHalfHour = this.fromTs >= this.freeSpace.fromTs;
				const canAddHalfHour = this.toTs + halfHour <= this.freeSpace.toTs;
				if (bottomHalf && canAddHalfHour || !bottomHalf && !canSubtractHalfHour) {
					this.halfOffset = halfHour;
				}
				if ((!bottomHalf && !canSubtractHalfHour || bottomHalf && !canAddHalfHour) && this.freeSpace.fromTs - this.cell.fromTs > 0) {
					this.halfOffset = this.freeSpace.fromTs - this.cell.fromTs;
				} else if (!bottomHalf && canSubtractHalfHour || bottomHalf && !canAddHalfHour) {
					this.halfOffset = 0;
				}
				const offsetNotMatchesHalf = bottomHalf === (this.halfOffset === 0);
				if (this.duration <= halfHour && offsetNotMatchesHalf) {
					this.clearCell(event);
					return;
				}
				this.hoverCell({
					id: booking_lib_cell.cellService.generateId(this.cell.resourceId, this.fromTs, this.toTs),
					fromTs: this.fromTs,
					toTs: this.toTs,
					resourceId: this.cell.resourceId,
					boundedToBottom: this.toTs === this.freeSpace.toTs
				});
			},
			clearCell(event) {
				const nextHoveredCell = event.relatedTarget?.closest('.booking-booking-base-cell');
				if (!nextHoveredCell || nextHoveredCell?.dataset?.selected === 'true') {
					void this.$store.dispatch(`${booking_const.Model.Interface}/setHoveredPlacementSlot`, null);
				}
			},
			hoverCell(cell) {
				void this.$store.dispatch(`${booking_const.Model.Interface}/setHoveredPlacementSlot`, null);
				if (this.isAvailable) {
					void this.$store.dispatch(`${booking_const.Model.Interface}/setHoveredPlacementSlot`, cell);
				}
			}
		},
		watch: {
			draggedElementId(id) {
				if (!id) {
					void this.$store.dispatch(`${booking_const.Model.Interface}/setHoveredPlacementSlot`, null);
				}
			}
		},
		template: `
		<div
			class="booking-booking-grid-cell"
			:class="{
				'--quick-filter-hovered': quickFilterHovered,
				'--quick-filter-active': quickFilterActive,
			}"
			data-element="booking-grid-cell"
			:data-resource-id="cell.resourceId"
			:data-from="cell.fromTs"
			:data-to="cell.toTs"
			@mouseenter="mouseEnterHandler"
			@mouseleave="mouseLeaveHandler"
			@mousemove="mouseMoveHandler"
		></div>
	`
	};

	const OffHours = {
		props: {
			bottom: {
				type: Boolean,
				default: false
			}
		},
		computed: ui_vue3_vuex.mapGetters({
			offHoursHover: `${booking_const.Model.Interface}/offHoursHover`,
			offHoursExpanded: `${booking_const.Model.Interface}/offHoursExpanded`
		}),
		methods: {
			animateOffHours({
				keepScroll
			}) {
				if (this.offHoursExpanded) {
					expandOffHours.collapse();
				} else {
					expandOffHours.expand({
						keepScroll
					});
				}
				void this.$store.dispatch(`${booking_const.Model.Interface}/setOffHoursExpanded`, !this.offHoursExpanded);
			}
		},
		template: `
		<div
			class="booking-booking-column-off-hours"
			:class="{'--bottom': bottom, '--hover': offHoursHover}"
			@click="animateOffHours({ keepScroll: bottom })"
			@mouseenter="$store.dispatch('interface/setOffHoursHover', true)"
			@mouseleave="$store.dispatch('interface/setOffHoursHover', false)"
		></div>
	`
	};

	const {
		mapGetters: mapInterfaceGetters$3
	} = ui_vue3_vuex.createNamespacedHelpers(booking_const.Model.Interface);

	// @vue/component
	const Column = {
		components: {
			DayGridCell,
			OffHours
		},
		inject: {
			gridContext: {
				default: null
			}
		},
		props: {
			resourceId: {
				type: Number,
				required: true
			}
		},
		data() {
			return {
				visible: true
			};
		},
		computed: {
			...mapInterfaceGetters$3({
				zoom: 'zoom',
				scroll: 'scroll',
				offset: 'offset',
				fromHour: 'fromHour',
				toHour: 'toHour',
				selectedDateTs: 'selectedDateTs'
			}),
			resource() {
				return this.$store.getters['resources/getById'](this.resourceId);
			},
			resourcesIds() {
				if (this.gridContext) {
					return this.gridContext.resourcesIds;
				}
				return this.$store.getters[`${booking_const.Model.Interface}/resourcesIds`];
			},
			isOffHoursControlsEnabled() {
				return this.gridContext?.offHoursControlsEnabled ?? true;
			},
			fromMinutes() {
				return this.fromHour * 60;
			},
			toMinutes() {
				return this.toHour * 60;
			},
			slotSize() {
				return this.resource.slotRanges[0]?.slotSize ?? 60;
			},
			offHoursTopCells() {
				return this.cells.filter(it => it.minutes < this.fromMinutes);
			},
			workTimeCells() {
				return this.cells.filter(it => it.minutes >= this.fromMinutes && it.minutes < this.toMinutes);
			},
			offHoursBottomCells() {
				return this.cells.filter(it => it.minutes >= this.toMinutes);
			},
			cells() {
				const hour = 3600 * 1000;
				const from = this.selectedDateTs;
				const to = new Date(from).setDate(new Date(from).getDate() + 1);
				return booking_lib_range.range(from, to - hour, hour).map(fromTs => {
					const toTs = fromTs + this.slotSize * 60 * 1000;
					return {
						id: `${this.resource.id}-${fromTs}-${toTs}`,
						fromTs,
						toTs,
						minutes: new Date(fromTs + this.offset).getHours() * 60,
						resourceId: this.resource.id
					};
				});
			}
		},
		watch: {
			scroll() {
				this.updateVisibility();
			},
			zoom() {
				this.updateVisibility();
			},
			resourcesIds() {
				this.updateVisibilityDuringTransition();
			}
		},
		mounted() {
			this.updateVisibility();
			this.updateVisibilityDuringTransition();
		},
		methods: {
			updateVisibilityDuringTransition() {
				this.animation?.stop();
				this.animation = new BX.easing({
					duration: 200,
					start: {},
					finish: {},
					step: this.updateVisibility
				});
				this.animation.animate();
			},
			updateVisibility() {
				const rect = this.$el.getBoundingClientRect();
				this.visible = rect.right > 0 && rect.left < window.innerWidth;
			}
		},
		template: `
		<div
			class="booking-booking-grid-column"
			data-element="booking-grid-column"
			:data-id="resourceId"
		>
			<template v-if="visible">
				<div class="booking-booking-grid-padding">
					<OffHours v-if="isOffHoursControlsEnabled"/>
				</div>
				<div class="booking-booking-grid-off-hours-cells">
					<DayGridCell v-for="cell of offHoursTopCells" :key="cell.id" :cell="cell"/>
				</div>
				<DayGridCell v-for="cell of workTimeCells" :key="cell.id" :cell="cell"/>
				<div class="booking-booking-grid-off-hours-cells --bottom">
					<DayGridCell v-for="cell of offHoursBottomCells" :key="cell.id" :cell="cell"/>
				</div>
				<div class="booking-booking-grid-padding">
					<OffHours v-if="isOffHoursControlsEnabled" :bottom="true"/>
				</div>
			</template>
		</div>
	`
	};

	// @vue/component
	const ScalePanel = {
		name: 'ScalePanel',
		props: {
			getFitToScreenContainer: {
				type: Function,
				default: null
			},
			withZoom: {
				type: Boolean,
				default: true
			}
		},
		data() {
			return {
				isSlider: booking_core.Core.getParams().isSlider,
				desiredZoom: this.$store.getters['interface/zoom'],
				minZoom: 0.5,
				maxZoom: 1,
				hasFullscreenMode: false
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				zoom: `${booking_const.Model.Interface}/zoom`
			}),
			expanded() {
				return this.$store.state[booking_const.Model.Interface].expanded;
			},
			zoomFormatted() {
				return this.loc('BOOKING_BOOKING_ZOOM_PERCENT', {
					'#PERCENT#': Math.round(this.zoom * 100)
				});
			},
			showFullscreenButton() {
				return !this.isSlider && this.hasFullscreenMode;
			},
			showZoomControls() {
				return this.withZoom;
			},
			showFitToScreenButton() {
				return this.withZoom && main_core.Type.isFunction(this.getFitToScreenContainer);
			},
			shouldShowPanel() {
				return this.showFullscreenButton || this.showZoomControls;
			}
		},
		beforeMount() {
			const SiteTemplate = main_core.Reflection.getClass('BX.Intranet.Bitrix24.Template');
			this.hasFullscreenMode = main_core.Type.isFunction(SiteTemplate?.toggleFullscreen);
		},
		mounted() {
			if (location.hash === '#maximize') {
				this.expand();
			}
		},
		unmounted() {
			main_core.Event.unbind(window, 'mouseup', this.onMouseUp);
		},
		methods: {
			syncExpandedState() {
				setTimeout(() => {
					const expanded = BX.Intranet.Bitrix24.Template.isFullscreen();
					this.$store.dispatch(`${booking_const.Model.Interface}/setExpanded`, expanded);
				}, 300);
			},
			expand(event) {
				if (location.hash === '#maximize' || this.isAnyModifierKeyPressed(event)) {
					BX.Intranet.Bitrix24.Template.enterFullscreen();
					this.syncExpandedState();
				} else {
					window.open(`${location.href}#maximize`, '_blank').focus();
				}
			},
			isAnyModifierKeyPressed(event) {
				return event.altKey || event.shiftKey || event.ctrlKey || event.metaKey;
			},
			collapse() {
				BX.Intranet.Bitrix24.Template.exitFullscreen();
				this.syncExpandedState();
			},
			fitToScreen() {
				const sidebarPadding = 260;
				const view = this.getFitToScreenContainer?.();
				if (!view) {
					return;
				}
				const zoomCoefficient = (view.offsetWidth - sidebarPadding) / (view.scrollWidth - sidebarPadding);
				const newZoom = Math.floor(this.zoom * zoomCoefficient * 10) / 10;
				this.zoomInto(newZoom);
			},
			zoomInto(zoomInto) {
				if (Number.isNaN(zoomInto)) {
					return;
				}
				const noTransitionClass = '--booking-booking-no-transition';
				const container = booking_core.Core.getParams().container;
				const maxAnimationDuration = 400;
				this.desiredZoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoomInto));
				if (this.zoom === this.desiredZoom) {
					return;
				}
				this.animation?.stop();
				main_core.Dom.addClass(container, noTransitionClass);
				this.animation = new BX.easing({
					duration: Math.abs(this.zoom - this.desiredZoom) / this.minZoom * maxAnimationDuration,
					start: {
						zoom: this.zoom * 100
					},
					finish: {
						zoom: this.desiredZoom * 100
					},
					step: ({
						zoom
					}) => this.$store.dispatch('interface/setZoom', zoom / 100),
					complete: () => main_core.Dom.removeClass(container, noTransitionClass)
				});
				this.animation.animate();
			},
			async onMouseDown(direction) {
				main_core.Event.unbind(window, 'mouseup', this.onMouseUp);
				main_core.Event.bind(window, 'mouseup', this.onMouseUp);
				this.mouseDown = true;
				await new Promise(resolve => setTimeout(resolve, 50));
				if (this.mouseDown) {
					clearInterval(this.zoomInterval);
					this.zoomInterval = setInterval(() => this.zoomInto(this.desiredZoom + direction * 0.1), 40);
				}
			},
			onMouseUp() {
				this.mouseDown = false;
				if (this.desiredZoom > this.zoom) {
					this.desiredZoom = Math.ceil(this.zoom * 10) / 10;
				}
				if (this.desiredZoom < this.zoom) {
					this.desiredZoom = Math.floor(this.zoom * 10) / 10;
				}
				this.zoomInto(this.desiredZoom);
				clearInterval(this.zoomInterval);
				main_core.Event.unbind(window, 'mouseup', this.onMouseUp);
			},
			async showAhaMoment() {
				booking_lib_ahaMoments.ahaMoments.setPopupShown(booking_const.AhaMoment.ExpandGrid);
				await booking_lib_ahaMoments.ahaMoments.show({
					id: 'booking-expand-grid',
					title: this.loc('BOOKING_AHA_EXPAND_GRID_TITLE_MSGVER_1'),
					text: this.loc('BOOKING_AHA_EXPAND_GRID_TEXT_MSGVER_1'),
					target: this.$refs.expand,
					top: true,
					isPulsarTransparent: true
				});
				booking_lib_ahaMoments.ahaMoments.setShown(booking_const.AhaMoment.ExpandGrid);
			}
		},
		template: `
		<div
			v-if="shouldShowPanel"
			class="booking-booking-grid-scale-panel"
			:class="{'--with-zoom': withZoom}"
			>
				<div v-if="showFullscreenButton" class="booking-booking-grid-scale-panel-full-screen" ref="expand">
					<div v-if="expanded" class="ui-icon-set --collapse-diagonal" @click="collapse"></div>
					<div v-else class="ui-icon-set --expand-diagonal" @click="expand"></div>
				</div>
			<template v-if="showZoomControls">
				<div v-if="showFitToScreenButton" class="booking-booking-grid-scale-panel-fit-to-screen">
					<div class="booking-booking-grid-scale-panel-fit-to-screen-text" @click="fitToScreen">
						{{ loc('BOOKING_BOOKING_SHOW_ALL') }}
					</div>
				</div>
				<div class="booking-booking-grid-scale-panel-change">
					<div
						class="ui-icon-set --minus-30"
						:class="{'--disabled': zoom <= minZoom}"
						@click="zoomInto(desiredZoom - 0.1)"
						@mousedown="onMouseDown(-1)"
					></div>
					<div v-html="zoomFormatted" class="booking-booking-grid-scale-panel-zoom"></div>
					<div
						class="ui-icon-set --plus-30"
						:class="{'--disabled': zoom >= maxZoom}"
						@click="zoomInto(desiredZoom + 0.1)"
						@mousedown="onMouseDown(1)"
					></div>
				</div>
			</template>
		</div>
	`
	};

	const DragDelete = {
		setup() {
			return {
				IconSet: ui_iconSet_api_vue.Set
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				draggedDataTransfer: `${booking_const.Model.Interface}/draggedDataTransfer`
			})
		},
		methods: {
			onMouseUp() {
				if (this.draggedDataTransfer.kind === booking_const.DraggedElementKind.Booking) {
					new booking_lib_removeBooking.RemoveBooking(this.draggedDataTransfer.id);
					return;
				}
				if (this.draggedDataTransfer.kind === booking_const.DraggedElementKind.WaitListItem) {
					new booking_lib_removeWaitListItem.RemoveWaitListItem(this.draggedDataTransfer.id);
				}
			}
		},
		components: {
			Icon: ui_iconSet_api_vue.BIcon
		},
		template: `
		<div v-if="draggedDataTransfer.id > 0" class="booking-booking-drag-delete">
			<div
				class="booking-booking-drag-delete-button"
				data-element="booking-drag-delete"
				@mouseup.capture="onMouseUp"
			>
				<Icon :name="IconSet.TRASH_BIN"/>
				<div class="booking-booking-drag-delete-button-text">
					{{ loc('BOOKING_BOOKING_DRAG_DELETE') }}
				</div>
			</div>
		</div>
	`
	};

	const DragMixin = {
		beforeUnmount() {
			this.dragManager?.destroy();
		},
		methods: {
			setupDrag() {
				let dataId = null;
				let dataKind = null;
				if (this.editingBookingId) {
					dataId = this.editingBookingId;
					dataKind = booking_const.DraggedElementKind.Booking;
				}
				if (this.editingWaitListItemId) {
					dataId = this.editingWaitListItemId;
					dataKind = booking_const.DraggedElementKind.WaitListItem;
				}
				this.createDragManager(dataId, dataKind);
			},
			createDragManager(id = '', kind = null) {
				this.dragManager?.destroy();
				this.dragManager = null;
				if (this.isFeatureEnabled && this.$el.parentElement) {
					const dataId = id ? `[data-id="${id}"]` : '';
					const dataKind = kind ? `[data-kind="${kind}"]` : '';
					this.dragManager = new booking_lib_drag.Drag({
						container: this.$el.parentElement,
						draggable: `.booking--draggable-item${dataId}${dataKind}`
					});
				}
			}
		}
	};

	// @vue/component
	const GridDay = {
		name: 'BookingGridDay',
		components: {
			LeftPanel,
			NowLine,
			Column,
			Bookings: Bookings$1,
			ScalePanel,
			DragDelete
		},
		mixins: [DragMixin],
		data() {
			return {
				scrolledToBooking: false
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				scroll: `${booking_const.Model.Interface}/scroll`,
				editingBookingId: `${booking_const.Model.Interface}/editingBookingId`,
				editingWaitListItemId: `${booking_const.Model.Interface}/editingWaitListItemId`,
				isFeatureEnabled: `${booking_const.Model.Interface}/isFeatureEnabled`,
				isLoaded: `${booking_const.Model.Interface}/isLoaded`,
				selectedDateTs: `${booking_const.Model.Interface}/selectedDateTs`,
				resourcesIds: `${booking_const.Model.Interface}/resourcesIds`,
				filteredBookingsIds: `${booking_const.Model.Filter}/filteredBookingsIds`,
				isFilterMode: `${booking_const.Model.Filter}/isFilterMode`
			}),
			grid() {
				return booking_lib_grid.GridFactory.getGrid();
			},
			editingBooking() {
				return this.$store.getters['bookings/getById'](this.editingBookingId) ?? null;
			}
		},
		watch: {
			scroll(value) {
				this.$refs.columnsContainer.scrollLeft = value;
			},
			editingBooking() {
				this.scrollToEditingBooking();
			},
			isLoaded(isLoaded) {
				if (isLoaded) {
					this.setupDrag();
				}
			},
			editingBookingId(id) {
				if (id) {
					this.createDragManager(id, booking_const.DraggedElementKind.Booking);
				}
			},
			editingWaitListItemId(id) {
				if (id) {
					this.createDragManager(id, booking_const.DraggedElementKind.WaitListItem);
				}
			},
			filteredBookingsIds(ids) {
				if (!this.isFilterMode || ids.length === 0) {
					return;
				}
				const booking = this.$store.getters['bookings/getById'](ids[0]) ?? null;
				if (booking !== null) {
					this.scrollToBooking(booking);
				}
			}
		},
		mounted() {
			this.ears = new ui_ears.Ears({
				container: this.$refs.columnsContainer,
				smallSize: true,
				className: 'booking-booking-grid-columns-ears'
			}).init();
			expandOffHours.setExpanded(true);
			if (this.isLoaded) {
				this.setupDrag();
			}
			main_core_events.EventEmitter.subscribe('BX.Main.Popup:onAfterClose', this.tryShowAhaMoment);
			main_core_events.EventEmitter.subscribe('BX.Main.Popup:onDestroy', this.tryShowAhaMoment);
		},
		unmounted() {
			main_core_events.EventEmitter.unsubscribe('BX.Main.Popup:onAfterClose', this.tryShowAhaMoment);
			main_core_events.EventEmitter.unsubscribe('BX.Main.Popup:onDestroy', this.tryShowAhaMoment);
		},
		methods: {
			updateEars() {
				this.ears.toggleEars();
				this.tryShowAhaMoment();
			},
			areEarsShown() {
				const shownClass = 'ui-ear-show';
				return main_core.Dom.hasClass(this.ears.getRightEar(), shownClass) || main_core.Dom.hasClass(this.ears.getLeftEar(), shownClass);
			},
			scrollToEditingBooking() {
				if (!this.editingBooking || this.scrolledToBooking) {
					return;
				}
				this.scrollToBooking(this.editingBooking);
			},
			scrollToBooking(booking) {
				const top = this.grid.calculateTop(booking.dateFromTs);
				const height = this.grid.calculateHeight(booking.dateFromTs, booking.dateToTs);
				this.$refs.inner.scrollTop = top + height / 2 + this.$refs.inner.offsetHeight / 2;
				this.scrolledToBooking = true;
			},
			tryShowAhaMoment() {
				if (this.areEarsShown() && booking_lib_ahaMoments.ahaMoments.shouldShow(booking_const.AhaMoment.ExpandGrid)) {
					main_core.Event.EventEmitter.unsubscribe('BX.Main.Popup:onAfterClose', this.tryShowAhaMoment);
					main_core.Event.EventEmitter.unsubscribe('BX.Main.Popup:onDestroy', this.tryShowAhaMoment);
					void this.$refs.scalePanel.showAhaMoment();
				}
			}
		},
		template: `
		<div class="booking-booking__base-component_grid booking-horizontal-scroll-bar">
			<div ref="bookingContainer" class="booking-booking-grid">
				<div
					id="booking-booking-grid-wrap"
					class="booking-booking-grid-inner booking-vertical-scroll-bar"
					ref="inner"
				>
					<LeftPanel/>
					<NowLine/>
					<div
						id="booking-booking-grid-columns"
						class="booking-booking-grid-columns booking-horizontal-scroll-bar"
						ref="columnsContainer"
						@scroll="$store.dispatch('interface/setScroll', $refs.columnsContainer.scrollLeft)"
					>
						<Bookings/>
						<TransitionGroup
							name="booking-transition-resource"
							@after-leave="updateEars"
							@after-enter="updateEars"
						>
							<template v-for="resourceId of resourcesIds" :key="resourceId">
								<Column :resourceId="resourceId"/>
							</template>
						</TransitionGroup>
					</div>
				</div>
				<ScalePanel
					:getFitToScreenContainer="() => $refs.columnsContainer"
					ref="scalePanel"
				/>
				<DragDelete/>
			</div>
		</div>
	`
	};

	// @vue/component
	const DayBasic = {
		name: 'DayBasic',
		props: {
			isActive: {
				type: Boolean,
				default: false
			}
		},
		template: `
		<div class="booking-booking__grid-day-panel_day">
			<span class="booking-booking__grid-day-panel_day-name">
				<slot name="dayOfWeek"></slot>
			</span>
			<span
				class="booking-booking__grid-day-panel_day-number"
				:class="{ '--active': isActive }"
			>
				<slot name="date"></slot>
			</span>
		</div>
	`
	};

	// @vue/component
	const DayOfWeek = {
		name: 'DayOfWeek',
		components: {
			DayBasic
		},
		props: {
			date: {
				type: Number,
				required: true
			},
			dayOfWeek: {
				type: String,
				required: true
			},
			isActive: {
				type: Boolean,
				default: false
			}
		},
		template: `
		<DayBasic :isActive>
			<template #dayOfWeek>
				{{ dayOfWeek }}
			</template>

			<template #date>
				{{ date }}
			</template>
		</DayBasic>
	`
	};

	// @vue/component
	const DaySkeleton = {
		name: 'DaySkeleton',
		components: {
			BLine: ui_system_skeleton_vue.BLine,
			DayBasic
		},
		template: `
		<DayBasic>
			<template #dayOfWeek>
				<BLine
					:width="20"
					:height="9"
				/>
			</template>

			<template #date>
				<BLine
					:width="28"
					:height="28"
					:radius="28"
				/>
			</template>
		</DayBasic>
	`
	};

	// @vue/component
	const DaysPanel = {
		name: 'DaysPanel',
		components: {
			DayOfWeek,
			DaySkeleton
		},
		setup() {
			return {
				Grid: booking_const.Grid
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				offset: `${booking_const.Model.Interface}/offset`
			}),
			selectedFirstDayPeriodTs() {
				const selectedFirstDayPeriodTs = this.$store.getters[`${booking_const.Model.Interface}/selectedFirstDayPeriodTs`];
				return selectedFirstDayPeriodTs ? selectedFirstDayPeriodTs + this.offset : null;
			},
			week() {
				const weekData = [];
				const firstDayOfWeek = ui_datePicker.createDate(this.selectedFirstDayPeriodTs);
				for (let i = 0; i < booking_const.Grid.Duration.Week; i++) {
					const todayDate = ui_datePicker.getNextDate(firstDayOfWeek, 'day', i);
					weekData.push({
						id: main_date.DateTimeFormat.format('z', todayDate / 1000),
						date: todayDate.getDate(),
						dayOfWeek: main_date.DateTimeFormat.format('D', todayDate / 1000),
						isActive: this.isActiveDay(todayDate)
					});
				}
				return weekData;
			}
		},
		methods: {
			isActiveDay(date) {
				const today = new Date();
				const compareDate = new Date(date);
				today.setHours(0, 0, 0, 0);
				compareDate.setHours(0, 0, 0, 0);
				return today.getTime() === compareDate.getTime();
			}
		},
		template: `
		<div class="booking-booking__grid-day-panel_container">
			<template v-if="!selectedFirstDayPeriodTs">
				<template v-for="n in Grid.Duration.Week" :key="n">
					<DaySkeleton />
				</template>
			</template>

			<template v-else>
				<template v-for="day of week" :key="day.id">
					<DayOfWeek :date="day.date" :dayOfWeek="day.dayOfWeek" :isActive="day.isActive"/>
				</template>
			</template>
		</div>
	`
	};

	// @vue/component
	const NavigationPanel = {
		name: 'NavigationPanel',
		components: {
			UiButton: ui_vue3_components_button.Button
		},
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize,
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		computed: {
			selectedDateTs() {
				return this.$store.getters[`${booking_const.Model.Interface}/selectedDateTs`];
			},
			dateFormatted() {
				return main_date.DateTimeFormat.format('f', this.selectedDateTs / 1000);
			}
		},
		methods: {
			showPreviousWeek() {
				main_core_events.EventEmitter.emit(booking_const.EventName.MultiBookingShowPreviousPeriod);
			},
			showNextWeek() {
				main_core_events.EventEmitter.emit(booking_const.EventName.MultiBookingShowNextPeriod);
			},
			setToday() {
				const today = new Date();
				void this.$store.dispatch(`${booking_const.Model.Interface}/setSelectedDateTs`, new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime());
			}
		},
		template: `
		<div class="booking-booking__grid-navigation-panel_container">
			<div class="booking-booking__grid-navigation-panel_container-title">{{ dateFormatted }}</div>

			<div class="booking-booking__grid-navigation-panel_container-nav-block">
				<UiButton
					data-element="booking-week-grid-navigation-panel-button-back"
					:size="ButtonSize.EXTRA_SMALL"
					:style="AirButtonStyle.OUTLINE"
					:leftIcon="Outline.CHEVRON_LEFT_L"
					@click="showPreviousWeek"
				/>
				<UiButton
					:text="loc('BOOKING_BOOKING_WEEK_GRID_NAVIGATION_PANEL_BUTTON_TODAY')"
					:size="ButtonSize.EXTRA_SMALL"
					:style="AirButtonStyle.OUTLINE"
					data-element="booking-week-grid-navigation-panel-button-today"
					@click="setToday"
				/>
				<UiButton
					data-element="booking-week-grid-navigation-panel-button-next"
					:size="ButtonSize.EXTRA_SMALL"
					:style="AirButtonStyle.OUTLINE"
					:leftIcon="Outline.CHEVRON_RIGHT_L"
					@click="showNextWeek"
				/>
			</div>
		</div>
	`
	};

	const {
		H: HourDuration,
		i: MinuteDuration
	} = booking_lib_duration.Duration.getUnitDurations();
	const MinutesInHour = HourDuration / MinuteDuration;
	const DayColumnPopupGridPaddingTop = 7;

	// @vue/component
	const DayColumnPopup = {
		name: 'DayColumnPopup',
		components: {
			StickyPopup: booking_component_popup.StickyPopup,
			Bookings: Bookings$1,
			Column,
			TimeScale
		},
		provide() {
			return {
				gridContext: this.dayGridContext,
				autoHideContext: {
					freeze: () => this.freezePopupAutoHide()
				}
			};
		},
		props: {
			bindElement: {
				type: HTMLElement,
				required: true
			},
			dateTs: {
				type: Number,
				required: true
			},
			resourceId: {
				type: Number,
				required: true
			}
		},
		emits: ['close'],
		setup() {
			return {
				DayColumnPopupGridPaddingTop
			};
		},
		data() {
			return {
				autoHideFreezeCount: 0
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				offset: `${booking_const.Model.Interface}/offset`,
				fromHour: `${booking_const.Model.Interface}/fromHour`,
				toHour: `${booking_const.Model.Interface}/toHour`,
				timezone: `${booking_const.Model.Interface}/timezone`
			}),
			dayGridContext() {
				return {
					gridMode: booking_const.Grid.Mode.Day,
					resourcesIds: [this.resourceId],
					zoom: 1,
					offHoursExpanded: true,
					multiSelectEnabled: false,
					resizeEnabled: false,
					restrictionPopupEnabled: false,
					quickFilterEnabled: false,
					offHoursControlsEnabled: false
				};
			},
			popupId() {
				return `booking-week-day-column-popup-${this.resourceId}-${this.dateTs}`;
			},
			headerDate() {
				return main_date.DateTimeFormat.format('j F Y', (this.dateTs + this.offset) / 1000);
			},
			resource() {
				return this.$store.getters[`${booking_const.Model.Resources}/getById`](this.resourceId) ?? null;
			},
			resourceName() {
				return this.resource?.name ?? '';
			},
			weekDay() {
				return booking_const.DateFormat.WeekDays[new Date(this.dateTs + this.offset).getDay()];
			},
			workingSlotRanges() {
				return booking_lib_slotRanges.SlotRanges.applyTimezone(this.resource?.slotRanges ?? [], this.dateTs, this.timezone).filter(slotRange => slotRange.weekDays.includes(this.weekDay));
			},
			firstWorkingMinutes() {
				if (this.workingSlotRanges.length === 0) {
					return 0;
				}
				const firstWorkingMinutes = Math.min(...this.workingSlotRanges.map(slotRange => slotRange.from));
				return Math.max(0, firstWorkingMinutes);
			},
			config() {
				return {
					className: 'booking-booking-day-column-popup',
					bindElement: this.bindElement,
					offsetLeft: this.bindElement.offsetWidth + 6,
					offsetTop: -56,
					animation: 'fading-slide'
				};
			}
		},
		mounted() {
			this.scrollToFirstWorkingTime();
		},
		methods: {
			closePopup() {
				this.$emit('close');
			},
			scrollToFirstWorkingTime() {
				void this.$nextTick(() => {
					if (!this.$refs.grid) {
						return;
					}
					this.$refs.grid.scrollTop = this.getScrollTopByMinutes(this.firstWorkingMinutes);
				});
			},
			getScrollTopByMinutes(minutes) {
				if (minutes <= 0) {
					return 0;
				}
				const hourHeight = booking_lib_grid.gridTokens.get(booking_lib_grid.GridTokenKey.DayHourHeight);
				const scrollTop = minutes / MinutesInHour * hourHeight + DayColumnPopupGridPaddingTop - hourHeight / 2;
				return Math.max(0, scrollTop);
			},
			freezePopupAutoHide() {
				let unfrozen = false;
				if (this.autoHideFreezeCount === 0) {
					this.$refs.popup?.freeze();
				}
				this.autoHideFreezeCount++;
				return () => {
					if (unfrozen) {
						return;
					}
					unfrozen = true;
					if (this.autoHideFreezeCount === 0) {
						return;
					}
					this.autoHideFreezeCount--;
					if (this.autoHideFreezeCount === 0) {
						this.$refs.popup?.unfreeze();
					}
				};
			}
		},
		template: `
		<StickyPopup
			:id="popupId"
			:config="config"
			ref="popup"
			@close="closePopup"
		>
			<div
				class="booking-booking-day-column-popup__content booking-booking__base-component --ui-context-content-light --day-mode"
			>
				<div class="booking-booking-day-column-popup__header">
					<span
						v-if="resourceName"
						class="booking-booking-day-column-popup__resource-name"
						:title="resourceName"
					>
						{{ resourceName }},
					</span>
					<span class="booking-booking-day-column-popup__date">{{ headerDate }}</span>
					<div
						class="ui-icon-set --cross-45"
						data-element="booking-day-column-popup-close"
						@click="closePopup"
					></div>
				</div>
				<div
					class="booking-booking-day-column-popup__grid booking-vertical-scroll-bar"
					ref="grid"
				>
					<div
						class="booking-booking-day-column-popup__grid-inner"
						:style="{
							'--from-hour': fromHour,
							'--to-hour': toHour,
							'--booking-day-column-popup-grid-padding-top': DayColumnPopupGridPaddingTop + 'px',
						}"
					>
						<div class="booking-booking-day-column-popup__time-scale">
							<TimeScale
								:fromHour="fromHour"
								:toHour="toHour"
								:offHoursExpanded="dayGridContext.offHoursExpanded"
							/>
						</div>
						<div class="booking-booking-day-column-popup__column">
							<Bookings/>
							<Column :resourceId="resourceId"/>
						</div>
					</div>
				</div>
			</div>
		</StickyPopup>
	`
	};

	const MinAvailableZoom = 1;
	const InsufficientZoomMinVisibleDurationMs = booking_lib_duration.Duration.getUnitDurations().H / 2;
	const InsufficientZoomThreshold = 2;
	const MinCreatedBookingDurationMs = booking_lib_duration.Duration.getUnitDurations().H * 12;
	const MinCellStatsSlotSizeMinutes = MinCreatedBookingDurationMs / booking_lib_duration.Duration.getUnitDurations().i;
	const MaxDurationMsCompactCell = 18 * booking_lib_duration.Duration.getUnitDurations().H;
	const MaxOverflowPx = 35;
	const MinSlotWidthPx = 78;

	class WeekCellService {
		isCreationAvailable({
			resourceId
		}) {
			const resource = this.#getResourceById(resourceId);
			if (!resource) {
				return false;
			}
			const slotSize = resource.slotRanges[0]?.slotSize ?? 60;
			return this.isCreationAvailableForSlotSize(slotSize);
		}
		isCreationAvailableForSlotSize(slotSize) {
			return slotSize >= MinCellStatsSlotSizeMinutes;
		}
		#getResourceById(resourceId) {
			return this.#store.getters[`${booking_const.Model.Resources}/getById`](resourceId) || null;
		}
		get #store() {
			return booking_core.Core.getStore();
		}
	}
	const weekCellService = new WeekCellService();

	class CellStatsService {
		calculate(cell) {
			const resource = this.#getResourceById(cell.resourceId);
			if (!resource) {
				return null;
			}
			const period = {
				fromTs: cell.fromTs + this.#offset,
				toTs: cell.toTs + this.#offset
			};
			const bookings = this.#getCellBookings(cell.resourceId, period);
			return this.#calculateStats(period, resource, bookings);
		}
		#getResourceById(resourceId) {
			return this.#store.getters[`${booking_const.Model.Resources}/getById`](resourceId) || null;
		}
		#getCellBookings(resourceId, period) {
			const localFromTs = period.fromTs - this.#offset;
			const localToTs = period.toTs - this.#offset;
			return this.#store.getters[`${booking_const.Model.Bookings}/getByInterval`](localFromTs, localToTs).filter(booking => booking.resourcesIds.includes(resourceId)).map(booking => ({
				...booking,
				dateFromTs: booking.dateFromTs + this.#offset,
				dateToTs: booking.dateToTs + this.#offset
			}));
		}
		#calculateStats(period, resource, bookings) {
			if (!resource?.slotRanges?.length) {
				return null;
			}
			const workingTimePeriods = this.#getResourceWorkingPeriods(period, resource);
			const bookingPeriods = booking_lib_datePeriod.DatePeriod.merge(bookings.map(booking => booking_lib_booking.bookingService.getVisiblePeriod(booking, period)));
			let busySlotsCount = 0;
			let freeSlotsCount = 0;
			const slotSizeMs = (resource.slotRanges[0]?.slotSize ?? 0) * booking_lib_duration.Duration.getUnitDurations().i;
			for (const workingPeriod of workingTimePeriods) {
				const stats = this.#countSlots(workingPeriod, slotSizeMs, bookingPeriods);
				busySlotsCount += stats.busySlotsCount;
				freeSlotsCount += stats.freeSlotsCount;
			}
			return {
				busySlotsCount,
				freeSlotsCount
			};
		}
		#getResourceWorkingPeriods(period, resource) {
			const workingSlotRanges = this.#getWorkingSlotRanges(period, resource);
			return booking_lib_datePeriod.DatePeriod.merge(workingSlotRanges.map(slotRange => this.#slotRangeToDatePeriod(period.fromTs, slotRange)));
		}
		#getWeekDay(period) {
			return booking_const.DateFormat.WeekDays[new Date(period.fromTs + this.#offset).getDay()];
		}
		#getWorkingSlotRanges(period, resource) {
			return booking_lib_slotRanges.SlotRanges.applyTimezone(resource.slotRanges, period.fromTs, this.#timezone).filter(slotRange => slotRange.weekDays.includes(this.#getWeekDay(period)));
		}
		#slotRangeToDatePeriod(dayTs, slotRange) {
			const fromDate = new Date(dayTs);
			const toDate = new Date(dayTs);
			fromDate.setHours(0, slotRange.from, 0, 0);
			toDate.setHours(0, slotRange.to, 0, 0);
			return {
				fromTs: fromDate.getTime(),
				toTs: toDate.getTime()
			};
		}
		#countSlots(workingPeriod, slotSizeMs, bookingPeriods) {
			if (slotSizeMs <= 0) {
				return {
					busySlotsCount: 0,
					freeSlotsCount: 0
				};
			}
			const totalSlotsCount = Math.floor(booking_lib_datePeriod.DatePeriod.getDuration(workingPeriod) / slotSizeMs);
			let freeSlotsCount = 0;
			let freeFromTs = workingPeriod.fromTs;
			for (const bookingPeriod of bookingPeriods) {
				if (bookingPeriod.toTs <= workingPeriod.fromTs) {
					continue;
				}
				if (bookingPeriod.fromTs >= workingPeriod.toTs) {
					break;
				}
				const busyPeriod = booking_lib_datePeriod.DatePeriod.intersect(workingPeriod, bookingPeriod);
				freeSlotsCount += Math.floor(Math.max(0, busyPeriod.fromTs - freeFromTs) / slotSizeMs);
				freeFromTs = Math.max(freeFromTs, busyPeriod.toTs);
			}
			freeSlotsCount += Math.floor(Math.max(0, workingPeriod.toTs - freeFromTs) / slotSizeMs);
			return {
				busySlotsCount: totalSlotsCount - freeSlotsCount,
				freeSlotsCount
			};
		}
		get #offset() {
			return this.#store.getters[`${booking_const.Model.Interface}/offset`];
		}
		get #timezone() {
			return this.#store.getters[`${booking_const.Model.Interface}/timezone`];
		}
		get #store() {
			return booking_core.Core.getStore();
		}
	}
	const cellStatsService = new CellStatsService();

	// @vue/component
	const CellStatsOverlay = {
		name: 'CellStatsOverlay',
		components: {
			UiCounter: ui_vue3_components_counter.Counter,
			UiButton: ui_vue3_components_button.Button
		},
		props: {
			/** @type { HoveredPlacementSlot } */
			cell: {
				type: Object,
				required: true
			}
		},
		emits: ['openDayColumnPopup'],
		setup() {
			return {
				ButtonColor: ui_vue3_components_button.ButtonColor,
				ButtonSize: ui_vue3_components_button.ButtonSize,
				CounterSize: ui_cnt.CounterSize,
				CounterStyle: ui_cnt.CounterStyle
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				offset: `${booking_const.Model.Interface}/offset`
			}),
			busyCount() {
				return this.cell.stats?.busySlotsCount ?? 0;
			},
			freeCount() {
				return this.cell.stats?.freeSlotsCount ?? 0;
			}
		},
		methods: {
			openDayColumnPopup() {
				this.$emit('openDayColumnPopup', {
					dateTs: this.cell.fromTs + this.offset,
					resourceId: this.cell.resourceId
				});
			}
		},
		template: `
		<div
			class="booking-booking__week-cell-stats-overlay"
			data-element="booking-week-cell-stats-overlay"
		>
			<div class="booking-booking__week-cell-stats-overlay__content">
				<div class="booking-booking__week-cell-stats-overlay__rows">
					<div class="booking-booking__week-cell-stats-overlay__row">
						<span class="booking-booking__week-cell-stats-overlay__row_label">
							{{ loc('BOOKING_BOOKING_WEEK_STATS_CELL_BUSY') }}
						</span>
						<div
							class="booking-booking__week-cell-stats-overlay__row_counter"
							data-element="booking-week-cell-stats-overlay-busy-counter"
							:data-value="busyCount"
						>
							<UiCounter
								:value="busyCount"
								:maxValue="999"
								:size="CounterSize.LARGE"
								:style="CounterStyle.FILLED_NO_ACCENT"
							/>
						</div>
					</div>
					<div class="booking-booking__week-cell-stats-overlay__row">
						<span class="booking-booking__week-cell-stats-overlay__row_label">
							{{ loc('BOOKING_BOOKING_WEEK_STATS_CELL_FREE') }}
						</span>
						<div
							class="booking-booking__week-cell-stats-overlay__row_counter"
							data-element="booking-week-cell-stats-overlay-free-counter"
							:data-value="freeCount"
						>
							<UiCounter
								:value="freeCount"
								:maxValue="999"
								:size="CounterSize.LARGE"
								:style="CounterStyle.FILLED_SUCCESS"
							/>
						</div>
					</div>
				</div>
				<div class="booking-booking__week-cell-stats-overlay__button-container">
					<UiButton
						class="booking-booking__week-cell-stats-overlay__button-container_button"
						:dataset="{ element: 'booking-week-cell-stats-overlay-create-button' }"
						:text="loc('BOOKING_BOOKING_SELECT')"
						:size="ButtonSize.EXTRA_EXTRA_SMALL"
						:color="ButtonColor.PRIMARY"
						@click="openDayColumnPopup"
					/>
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const WeekGridCell = {
		name: 'WeekGridCell',
		components: {
			CellStatsOverlay
		},
		props: {
			resourceId: {
				type: Number,
				required: true
			},
			dayStartTs: {
				type: Number,
				required: true
			}
		},
		emits: ['openDayColumnPopup'],
		data() {
			return {
				hoveredHour: 0,
				isHourTracking: false
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				selectedFirstDayPeriodTs: `${booking_const.Model.Interface}/selectedFirstDayPeriodTs`,
				hoveredPlacementSlot: `${booking_const.Model.Interface}/hoveredPlacementSlot`,
				isHoveredPlacementSlotFixed: `${booking_const.Model.Interface}/isHoveredPlacementSlotFixed`,
				offset: `${booking_const.Model.Interface}/offset`,
				zoom: `${booking_const.Model.Interface}/zoom`,
				isFilterMode: `${booking_const.Model.Filter}/isFilterMode`,
				isEditingBookingMode: `${booking_const.Model.Interface}/isEditingBookingMode`,
				resizedBookingId: `${booking_const.Model.Interface}/resizedBookingId`,
				draggedDataTransfer: `${booking_const.Model.Interface}/draggedDataTransfer`,
				overbookingMap: `${booking_const.Model.Bookings}/overbookingMap`,
				draggedBookingId: `${booking_const.Model.Interface}/draggedBookingId`,
				timezone: `${booking_const.Model.Interface}/timezone`,
				disabledBusySlots: `${booking_const.Model.Interface}/disabledBusySlots`
			}),
			draggedElementId() {
				return this.draggedDataTransfer.id;
			},
			isBookingDragged() {
				return this.draggedDataTransfer.kind === booking_const.DraggedElementKind.Booking;
			},
			id() {
				return booking_lib_cell.cellService.generateId(this.resourceId, this.dayStartTs, this.dayEndTs);
			},
			dayEndTs() {
				return this.dayStartTs + booking_lib_duration.Duration.getUnitDurations().d;
			},
			cell() {
				return this.isHovered ? this.hoveredPlacementSlot : null;
			},
			isHovered() {
				return this.hoveredPlacementSlot?.id === this.id;
			},
			needShowStatsOverlay() {
				return this.isHovered && this.cell?.stats !== null;
			},
			resource() {
				return this.$store.getters[`${booking_const.Model.Resources}/getById`](this.resourceId);
			},
			isInteractionAvailable() {
				return !(this.isFilterMode || this.resizedBookingId || this.isEditingBookingMode && !this.draggedDataTransfer.id);
			},
			isCreationAvailable() {
				return weekCellService.isCreationAvailableForSlotSize(this.slotSize);
			},
			slotSize() {
				return this.resource?.slotRanges?.[0]?.slotSize ?? 60;
			},
			slotDuration() {
				return this.slotSize * booking_lib_duration.Duration.getUnitDurations().i;
			},
			hoveredTs() {
				return this.dayStartTs + this.hoveredHour * booking_lib_duration.Duration.getUnitDurations().H;
			},
			colliding() {
				return this.$store.getters[`${booking_const.Model.Interface}/getColliding`](this.resourceId, this.excludeBookingColliding);
			},
			freeSpace() {
				return this.getFreeSpaceForTs(this.hoveredTs);
			},
			weekDay() {
				return booking_const.DateFormat.WeekDays[new Date(this.dayStartTs + this.offset).getDay()];
			},
			resourceWorkRange() {
				const slotRanges = booking_lib_slotRanges.SlotRanges.applyTimezone(this.resource?.slotRanges ?? [], this.dayStartTs, this.timezone).filter(range => range.weekDays.includes(this.weekDay));
				if (slotRanges.length === 0) {
					return null;
				}
				return {
					from: Math.min(...slotRanges.map(r => r.from)),
					to: Math.max(...slotRanges.map(r => r.to))
				};
			},
			isNonWorkingTime() {
				if (!this.resourceWorkRange) {
					return false;
				}
				if (this.resourceWorkRange.from >= this.resourceWorkRange.to) {
					return false;
				}
				const hoveredMinutes = this.hoveredHour * 60;
				const isOutsideWorkRange = hoveredMinutes < this.resourceWorkRange.from || hoveredMinutes >= this.resourceWorkRange.to;
				if (!isOutsideWorkRange) {
					return false;
				}
				return !this.isOffHoursDisabled();
			},
			hasEnoughFreeSpace() {
				const {
					fromTs: freeFrom,
					toTs: freeTo
				} = this.freeSpace;
				return freeFrom !== freeTo && freeTo - freeFrom >= this.slotDuration;
			},
			createdFromTs() {
				const desired = this.hoveredTs;
				const {
					fromTs: freeFrom,
					toTs: freeTo
				} = this.freeSpace;
				if (!this.hasEnoughFreeSpace) {
					return desired;
				}
				const maxAllowed = freeTo - this.slotDuration;
				return Math.max(freeFrom, Math.min(desired, maxAllowed));
			},
			createdToTs() {
				return this.createdFromTs + this.slotDuration;
			}
		},
		watch: {
			draggedElementId(id) {
				if (!id) {
					this.stopHourTracking();
					void this.$store.dispatch(`${booking_const.Model.Interface}/setHoveredPlacementSlot`, null);
				}
			}
		},
		created() {
			this.cellStatsTimeoutId = null;
		},
		beforeUnmount() {
			this.stopHourTracking();
			clearTimeout(this.cellStatsTimeoutId);
		},
		methods: {
			openDayColumnPopup(params) {
				this.$emit('openDayColumnPopup', {
					...params,
					bindElement: this.$refs.cellContainer
				});
			},
			syncHoveredCell() {
				if (this.isBookingDragged) {
					return;
				}
				if (!this.isCreationAvailable) {
					const hoveredCell = {
						id: booking_lib_cell.cellService.generateId(this.resourceId, this.dayStartTs, this.dayEndTs),
						fromTs: this.dayStartTs,
						toTs: this.dayEndTs,
						resourceId: this.resourceId
					};
					void this.$store.dispatch(`${booking_const.Model.Interface}/setHoveredPlacementSlot`, hoveredCell);
					this.syncHoveredCellStats(hoveredCell);
					return;
				}
				if (!this.hasEnoughFreeSpace || this.isNonWorkingTime) {
					void this.$store.dispatch(`${booking_const.Model.Interface}/setHoveredPlacementSlot`, null);
					return;
				}
				void this.$store.dispatch(`${booking_const.Model.Interface}/setHoveredPlacementSlot`, {
					id: booking_lib_cell.cellService.generateId(this.resourceId, this.createdFromTs, this.createdToTs),
					fromTs: this.createdFromTs,
					toTs: this.createdToTs,
					resourceId: this.resourceId
				});
			},
			syncHoveredCellStats(cell) {
				this.cellStatsTimeoutId = setTimeout(() => {
					if (this.hoveredPlacementSlot?.id !== cell.id) {
						this.cellStatsTimeoutId = null;
						return;
					}
					const stats = cellStatsService.calculate(cell);
					void this.$store.dispatch(`${booking_const.Model.Interface}/setHoveredPlacementSlotStats`, stats);
					this.cellStatsTimeoutId = null;
				}, 400);
			},
			isOffHoursDisabled() {
				if (this.draggedElementId) {
					return true;
				}
				return Object.values(this.disabledBusySlots).some(busySlot => {
					return busySlot.type === booking_const.BusySlot.OffHours && busySlot.resourceId === this.resourceId && this.hoveredTs >= busySlot.fromTs && this.hoveredTs < busySlot.toTs;
				});
			},
			getFreeSpaceForTs(ts) {
				let maxFrom = this.dayStartTs - this.slotDuration;
				let minTo = Infinity;
				for (const {
					fromTs,
					toTs
				} of this.colliding) {
					if (ts >= fromTs && ts < toTs) {
						return {
							fromTs: toTs,
							toTs
						};
					}
					if (toTs <= ts) {
						maxFrom = Math.max(maxFrom, toTs);
					}
					if (fromTs > ts) {
						minTo = Math.min(minTo, fromTs);
					}
				}
				return {
					fromTs: maxFrom,
					toTs: minTo
				};
			},
			computeFromTsForHour(hour) {
				const desired = this.dayStartTs + hour * booking_lib_duration.Duration.getUnitDurations().H;
				const {
					fromTs: freeFrom,
					toTs: freeTo
				} = this.getFreeSpaceForTs(desired);
				if (freeFrom === freeTo || freeTo - freeFrom < this.slotDuration) {
					return null;
				}
				const maxAllowed = freeTo - this.slotDuration;
				return Math.max(freeFrom, Math.min(desired, maxAllowed));
			},
			excludeBookingColliding(booking) {
				if (booking.id === this.draggedBookingId) {
					return true;
				}
				const overbooking = this.overbookingMap.get(booking.id);
				return overbooking && overbooking.items.some(item => item.resourceId === this.resourceId);
			},
			getHourFromMouseEvent(event) {
				const rect = this.$el.getBoundingClientRect();
				const offsetX = event.clientX - rect.left;
				const hour = Math.floor(offsetX / (booking_lib_grid.gridTokens.get(booking_lib_grid.GridTokenKey.WeekHourWidth) * this.zoom));
				return Math.max(0, Math.min(23, hour));
			},
			isMouseInCell(event) {
				const rect = this.$el.getBoundingClientRect();
				return event.clientX >= rect.left && event.clientX < rect.right && event.clientY >= rect.top && event.clientY < rect.bottom;
			},
			onMouseEnter(event) {
				if (!this.isInteractionAvailable || this.isHoveredPlacementSlotFixed) {
					return;
				}
				this.stopHourTracking();
				this.hoveredHour = this.getHourFromMouseEvent(event);
				this.syncHoveredCell();
				if (this.isCreationAvailable) {
					this.startHourTracking();
				}
			},
			startHourTracking() {
				if (this.isHourTracking) {
					return;
				}
				this.isHourTracking = true;
				main_core.Event.bind(document, 'mousemove', this.onDocumentHourMove);
			},
			stopHourTracking() {
				if (!this.isHourTracking) {
					return;
				}
				this.isHourTracking = false;
				main_core.Event.unbind(document, 'mousemove', this.onDocumentHourMove);
			},
			onDocumentHourMove(event) {
				if (this.isHoveredPlacementSlotFixed) {
					this.stopHourTracking();
					return;
				}
				if (!this.isMouseInCell(event)) {
					if (this.hoveredPlacementSlot?.resourceId === this.resourceId) {
						void this.$store.dispatch(`${booking_const.Model.Interface}/setHoveredPlacementSlot`, null);
					}
					return;
				}
				if (!this.isInteractionAvailable) {
					return;
				}
				const newHour = this.getHourFromMouseEvent(event);
				if (newHour === this.hoveredHour && this.hoveredPlacementSlot !== null) {
					return;
				}
				const newFromTs = this.computeFromTsForHour(newHour);
				if (this.hoveredPlacementSlot !== null && (newFromTs === null || newFromTs === this.createdFromTs)) {
					return;
				}
				this.hoveredHour = newHour;
				this.syncHoveredCell();
			},
			onMouseLeave(event) {
				if (this.isHoveredPlacementSlotFixed) {
					this.stopHourTracking();
					return;
				}
				if (event.relatedTarget?.closest('.booking-booking-week-selected-cell')) {
					return;
				}
				this.stopHourTracking();
				void this.$store.dispatch(`${booking_const.Model.Interface}/setHoveredPlacementSlot`, null);
			},
			onMouseUp() {
				if (Boolean(this.draggedElementId) && !this.isCreationAvailable) {
					this.stopHourTracking();
					void this.$store.dispatch(`${booking_const.Model.Interface}/setHoveredPlacementSlot`, null);
				}
			}
		},
		template: `
		<div
			ref="cellContainer"
			class="booking-booking__booking__week-grid_row-cell"
			data-element="booking-week-grid-day-cell"
			:data-resource-id="resourceId"
			:data-date="dayStartTs"
			@mouseenter="onMouseEnter"
			@mouseleave="onMouseLeave"
			@mouseup.capture="onMouseUp"
		>
			<CellStatsOverlay
				v-if="needShowStatsOverlay"
				:cell
				@openDayColumnPopup="openDayColumnPopup"
			/>
		</div>
	`
	};

	const {
		mapGetters: mapInterfaceGetters$2
	} = ui_vue3_vuex.createNamespacedHelpers(booking_const.Model.Interface);

	// @vue/component
	const Row = {
		name: 'WeekGridRow',
		components: {
			WeekGridCell
		},
		props: {
			resourceId: {
				type: Number,
				required: true
			}
		},
		emits: ['openDayColumnPopup'],
		computed: {
			...mapInterfaceGetters$2({
				selectedFirstDayPeriodTs: 'selectedFirstDayPeriodTs',
				offset: 'offset'
			}),
			weekStartTs() {
				const weekStartTs = this.selectedFirstDayPeriodTs + this.offset;
				const weekStartDate = new Date(weekStartTs);
				return new Date(weekStartDate.getFullYear(), weekStartDate.getMonth(), weekStartDate.getDate()).getTime() - this.offset;
			},
			week() {
				const dayMs = booking_lib_duration.Duration.getUnitDurations().d;
				const weekData = [];
				for (let dayIndex = 0; dayIndex < booking_const.Grid.Duration.Week; dayIndex++) {
					weekData.push({
						id: `${this.resourceId} - ${dayIndex}`,
						dayStartTs: this.weekStartTs + dayIndex * dayMs
					});
				}
				return weekData;
			}
		},
		methods: {
			openDayColumnPopup(params) {
				this.$emit('openDayColumnPopup', params);
			}
		},
		template: `
		<div
			class="booking-booking__booking__week-grid_row"
			:data-id="resourceId"
		>
			<template v-for="day of week" :key="day.id">
				<WeekGridCell
					:resourceId
					:dayStartTs="day.dayStartTs"
					@openDayColumnPopup="openDayColumnPopup"
				/>
			</template>
		</div>
	`
	};

	const {
		mapGetters: mapInterfaceGetters$1
	} = ui_vue3_vuex.createNamespacedHelpers(booking_const.Model.Interface);
	const {
		mapGetters: mapFilterGetters$1
	} = ui_vue3_vuex.createNamespacedHelpers(booking_const.Model.Filter);

	// @vue/component
	const WeekBusySlot = {
		name: 'WeekBusySlot',
		components: {
			UiBusySlot
		},
		props: {
			busySlot: {
				type: Object,
				required: true
			},
			dayIndex: {
				type: Number,
				required: true
			}
		},
		computed: {
			...mapInterfaceGetters$1({
				disabledBusySlots: 'disabledBusySlots',
				isEditingBookingMode: 'isEditingBookingMode',
				isDragMode: 'isDragMode'
			}),
			...mapFilterGetters$1({
				isFilterMode: 'isFilterMode'
			}),
			grid() {
				return booking_lib_grid.GridFactory.getGrid();
			},
			enabledOverbookingFeature() {
				return this.$store.state[booking_const.Model.Interface].enabledFeature.bookingOverbooking;
			},
			left() {
				return this.grid.calculateLeft(this.dayIndex, this.busySlot.fromTs);
			},
			top() {
				return this.grid.calculateTop(this.busySlot.resourceId);
			},
			width() {
				return this.grid.calculateWidth(this.busySlot.fromTs, this.busySlot.toTs);
			},
			height() {
				return this.grid.calculateHeight();
			},
			positionStyle() {
				return {
					'--left': `${this.left}px`,
					'--top': `${this.top}px`,
					'--width': `${this.width}px`,
					'--height': `${this.height}px`
				};
			},
			isVisible() {
				return this.left >= 0;
			},
			isDisabled() {
				const isDragOffHours = this.isDragMode && this.busySlot.type === booking_const.BusySlot.OffHours;
				const isDragOverbooking = this.isDragMode && this.busySlot.type === booking_const.BusySlot.IntersectionOverbooking;
				if (this.isFilterMode || isDragOffHours || isDragOverbooking) {
					return true;
				}
				return this.busySlot.id in this.disabledBusySlots;
			}
		},
		methods: {
			onClick() {
				if (this.isFilterMode || this.isEditingBookingMode || this.busySlot.type === booking_const.BusySlot.IntersectionOverbooking || !this.enabledOverbookingFeature && this.busySlot.type === booking_const.BusySlot.Intersection) {
					return;
				}
				void this.$store.dispatch(`${booking_const.Model.Interface}/addDisabledBusySlot`, this.busySlot);
			}
		},
		template: `
		<UiBusySlot
			:busySlot="busySlot"
			:positionStyle="positionStyle"
			:isDisabled="isDisabled"
			:isVisible="isVisible"
			@click="onClick"
		/>
	`
	};

	// @vue/component
	const BookingWeek = {
		name: 'WeekGridBooking',
		extends: BookingBase,
		computed: {
			visiblePeriod() {
				const weekStartTs = this.grid.bookingWeekStartTs;
				return {
					fromTs: weekStartTs,
					toTs: weekStartTs + booking_lib_duration.Duration.getUnitDurations().w
				};
			},
			bookingVisiblePeriod() {
				return booking_lib_booking.bookingService.getVisiblePeriod(this.booking, this.visiblePeriod);
			},
			realHeight() {
				return this.grid.calculateHeight();
			},
			isVisibleStartBooking() {
				return this.booking.dateFromTs >= this.visiblePeriod.fromTs && this.booking.dateToTs >= this.visiblePeriod.toTs;
			},
			isVisibleEndBooking() {
				return this.booking.dateFromTs < this.visiblePeriod.fromTs && this.booking.dateToTs > this.visiblePeriod.fromTs && this.booking.dateToTs <= this.visiblePeriod.toTs;
			},
			isVisibleMiddleBooking() {
				return this.booking.dateFromTs < this.visiblePeriod.fromTs && this.booking.dateToTs >= this.visiblePeriod.toTs;
			},
			geometryVariables() {
				const dayIndex = this.grid.getDayIndex(this.bookingVisiblePeriod.fromTs);
				const left = this.grid.calculateLeft(dayIndex, this.bookingVisiblePeriod.fromTs);
				const top = this.grid.calculateTop(this.resourceId) + this.topOffset;
				const height = this.bookingHeight;
				const width = this.grid.calculateWidth(this.bookingVisiblePeriod.fromTs, this.bookingVisiblePeriod.toTs);
				return {
					'--left': `${left}px`,
					'--top': `${top}px`,
					'--height': `${height}px`,
					'--width': `${width}px`
				};
			}
		}
	};

	// @vue/component
	const WeekPlacementSlot = {
		name: 'WeekPlacementSlot',
		components: {
			BaseCell
		},
		props: {
			cell: {
				type: Object,
				required: true
			}
		},
		data() {
			return {
				overbookingPositionsInCell: []
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				isHoveredPlacementSlotFixed: `${booking_const.Model.Interface}/isHoveredPlacementSlotFixed`,
				hoveredPlacementSlot: `${booking_const.Model.Interface}/hoveredPlacementSlot`,
				selectedPlacementSlots: `${booking_const.Model.Interface}/selectedPlacementSlots`,
				zoom: `${booking_const.Model.Interface}/zoom`,
				overbookingMap: `${booking_const.Model.Bookings}/overbookingMap`
			}),
			grid() {
				return booking_lib_grid.GridFactory.getGrid();
			},
			dayIndex() {
				return this.grid.getDayIndex(this.cell.fromTs);
			},
			left() {
				return this.grid.calculateLeft(this.dayIndex, this.cell.fromTs);
			},
			fullHeight() {
				return this.grid.calculateHeight();
			},
			hasOverbooking() {
				return this.overbookingPositionsInCell.length === 1;
			},
			isBothHalvesOccupied() {
				return this.overbookingPositionsInCell.length > 1;
			},
			isOverbookingOnTop() {
				return this.hasOverbooking && !this.overbookingPositionsInCell[0];
			},
			top() {
				const baseTop = this.grid.calculateTop(this.cell.resourceId);
				if (this.isOverbookingOnTop) {
					return baseTop + this.fullHeight / 2;
				}
				return baseTop;
			},
			width() {
				const slotWidthPx = this.grid.calculateWidth(this.cell.fromTs, this.cell.toTs);
				const gridWidthPx = booking_lib_grid.gridTokens.get(booking_lib_grid.GridTokenKey.WeekCellWidth) * booking_const.Grid.Duration.Week * this.zoom;
				const maxSlotWidthPx = gridWidthPx + MaxOverflowPx - this.left;
				return Math.max(MinSlotWidthPx, Math.min(slotWidthPx, maxSlotWidthPx));
			},
			height() {
				if (this.hasOverbooking) {
					return this.fullHeight / 2;
				}
				return this.fullHeight;
			},
			positionStyle() {
				return {
					'--left': `${this.left}px`,
					'--top': `${this.top}px`,
					'--width': `${this.width}px`,
					'--height': `${this.height}px`
				};
			},
			isVisible() {
				return this.left >= 0 && !this.isBothHalvesOccupied;
			},
			isSelected() {
				return this.cell.id in this.selectedPlacementSlots;
			},
			isHoveredCell() {
				return this.hoveredPlacementSlot?.id === this.cell.id;
			},
			isFixed() {
				return this.isSelected || this.isHoveredCell && this.isHoveredPlacementSlotFixed;
			},
			isCompact() {
				const cellDuration = this.cell.toTs - this.cell.fromTs;
				return cellDuration < MaxDurationMsCompactCell;
			}
		},
		watch: {
			cell: {
				handler() {
					this.calcOverbookingPositionsInCell();
				},
				immediate: true
			},
			overbookingMap() {
				this.calcOverbookingPositionsInCell();
			}
		},
		methods: {
			calcOverbookingPositionsInCell() {
				const resourceId = this.cell.resourceId;
				const cellTimespan = {
					dateFromTs: this.cell.fromTs,
					dateToTs: this.cell.toTs
				};
				const positions = [];
				for (const [, overbooking] of this.overbookingMap) {
					const resourceOverbooking = overbooking.items.find(item => item.resourceId === resourceId);
					if (resourceOverbooking && booking_lib_checkBookingIntersection.checkBookingIntersection(overbooking.booking, cellTimespan) && !positions.includes(resourceOverbooking?.shifted)) {
						positions.push(resourceOverbooking?.shifted);
					}
					if (positions.length > 2) {
						break;
					}
				}
				this.overbookingPositionsInCell = positions;
			},
			onCellClick() {
				if (!this.isSelected && !this.isHoveredPlacementSlotFixed) {
					void this.$store.dispatch(`${booking_const.Model.Interface}/fixHoveredPlacementSlot`);
				}
			},
			onMouseLeave(event) {
				if (!this.isHoveredCell) {
					return;
				}
				if (this.isSelected || this.isHoveredPlacementSlotFixed) {
					void this.$store.dispatch(`${booking_const.Model.Interface}/setHoveredPlacementSlot`, null);
					return;
				}
				const enteredRowCell = event.relatedTarget?.closest('.booking-booking__booking__week-grid_row-cell');
				if (!enteredRowCell) {
					void this.$store.dispatch(`${booking_const.Model.Interface}/setHoveredPlacementSlot`, null);
				}
			}
		},
		template: `
		<div
			v-if="isVisible"
			class="booking-booking-week-selected-cell"
			:class="{ '--fixed': isFixed }"
			:style="positionStyle"
			@click.stop="onCellClick"
			@mouseleave="onMouseLeave"
		>
			<BaseCell
				:cell="cell"
				:fixed="isFixed"
				:compact="isCompact"
				:className="{ '--overbooking': hasOverbooking }"
			/>
		</div>
	`
	};

	const {
		mapGetters: mapBookingsGetters
	} = ui_vue3_vuex.createNamespacedHelpers(booking_const.Model.Bookings);
	const {
		mapGetters: mapInterfaceGetters
	} = ui_vue3_vuex.createNamespacedHelpers(booking_const.Model.Interface);
	const {
		mapGetters: mapFilterGetters
	} = ui_vue3_vuex.createNamespacedHelpers(booking_const.Model.Filter);

	// @vue/component
	const Bookings = {
		name: 'BookingsWeek',
		components: {
			BookingWeek,
			WeekBusySlot,
			WeekPlacementSlot
		},
		data() {
			return {
				nowTs: Date.now()
			};
		},
		computed: {
			...mapBookingsGetters({
				overbookingMap: 'overbookingMap'
			}),
			...mapInterfaceGetters({
				resourcesIds: 'resourcesIds',
				selectedFirstDayPeriodTs: 'selectedFirstDayPeriodTs',
				hoveredPlacementSlot: 'hoveredPlacementSlot',
				busySlots: 'busySlots',
				selectedPlacementSlots: 'selectedPlacementSlots',
				zoom: 'zoom'
			}),
			...mapFilterGetters({
				filteredBookingsIds: 'filteredBookingsIds',
				isFilterMode: 'isFilterMode'
			}),
			grid() {
				return booking_lib_grid.GridFactory.getGrid();
			},
			resourcesHash() {
				const resources = this.$store.getters[`${booking_const.Model.Resources}/getByIds`](this.resourcesIds).map(({
					id,
					slotRanges
				}) => ({
					id,
					slotRanges
				}));
				return JSON.stringify(resources);
			},
			bookingsHash() {
				const bookings = this.bookings.map(({
					id,
					dateFromTs,
					dateToTs,
					resourcesIds
				}) => ({
					id,
					dateFromTs,
					dateToTs,
					resourcesIds
				}));
				return JSON.stringify(bookings);
			},
			busySlotsWithDayIndex() {
				return this.busySlots.map(slot => ({
					slot,
					dayIndex: this.grid.getDayIndex(slot.fromTs)
				}));
			},
			bookings() {
				const {
					fromTs,
					toTs
				} = this.visiblePeriod;
				let bookings = [];
				if (this.isFilterMode) {
					bookings = this.$store.getters[`${booking_const.Model.Bookings}/getByInterval`](fromTs, toTs).filter(booking => this.filteredBookingsIds.includes(booking.id));
				} else {
					bookings = this.$store.getters[`${booking_const.Model.Bookings}/getByInterval`](fromTs, toTs).filter(booking => {
						return this.resourcesIds.some(id => booking.resourcesIds.includes(id));
					});
				}
				return bookings.flatMap(booking => {
					return booking.resourcesIds.filter(resourceId => this.resourcesIds.includes(resourceId)).map(resourceId => {
						return createBookingModelUi(resourceId, booking, this.overbookingMap.get(booking.id));
					});
				}).sort((a, b) => {
					if (a.resourcesIds[0] !== b.resourcesIds[0]) {
						return b.resourcesIds[0] - a.resourcesIds[0];
					}
					if (a.dateFromTs !== b.dateFromTs) {
						return a.dateFromTs - b.dateFromTs;
					}
					return b.overbooking - a.overbooking;
				});
			},
			visibleBookingsMap() {
				const visibleBookingsMap = new Map();
				for (const booking of this.bookings) {
					if (this.shouldFilterByMinVisibleBookingDuration && !booking_lib_booking.bookingService.isVisibleByMinDuration(booking, this.visiblePeriod, InsufficientZoomMinVisibleDurationMs)) {
						continue;
					}
					visibleBookingsMap.set(booking_lib_booking.bookingService.generateKey(booking), booking);
				}
				return visibleBookingsMap;
			},
			shouldFilterByMinVisibleBookingDuration() {
				return this.zoom < InsufficientZoomThreshold;
			},
			resourceBookingsUiGroupsMap() {
				const visibleBookingsByResourceId = splitBookingsByResourceId([...this.visibleBookingsMap.values()]);
				return getResourceBookingUiGroups(visibleBookingsByResourceId);
			},
			visiblePeriod() {
				return {
					fromTs: this.selectedFirstDayPeriodTs,
					toTs: this.selectedFirstDayPeriodTs + booking_lib_duration.Duration.getUnitDurations().w
				};
			},
			placementSlots() {
				const selected = Object.values(this.selectedPlacementSlots);
				const hovered = this.hoveredPlacementSlot;
				if (hovered && !this.selectedPlacementSlots[hovered.id] && weekCellService.isCreationAvailable(hovered)) {
					return [...selected, hovered];
				}
				return selected;
			}
		},
		watch: {
			selectedFirstDayPeriodTs() {
				void booking_lib_busySlots.busySlots.loadBusySlots();
			},
			bookingsHash() {
				void booking_lib_busySlots.busySlots.loadBusySlots();
			},
			resourcesHash() {
				void booking_lib_busySlots.busySlots.loadBusySlots();
			},
			overbookingMap() {
				void booking_lib_busySlots.busySlots.loadBusySlots();
			}
		},
		mounted() {
			this.nowTsIntervalId = setInterval(() => {
				this.nowTs = Date.now();
			}, 5 * 1000);
		},
		beforeUnmount() {
			clearInterval(this.nowTsIntervalId);
		},
		methods: {
			getBookingUiGroupsByResourceId(resourceId) {
				return this.resourceBookingsUiGroupsMap.get(resourceId) || [];
			}
		},
		template: `
		<TransitionGroup name="booking-transition-booking">
			<template v-for="[bookingKey, booking] of visibleBookingsMap" :key="bookingKey">
				<BookingWeek
					:bookingId="booking.id"
					:resourceId="booking.resourcesIds[0]"
					:nowTs
					:bookingUiGroups="getBookingUiGroupsByResourceId(booking.resourcesIds[0])"
				/>
			</template>
		</TransitionGroup>
		<template v-for="{ slot, dayIndex } of busySlotsWithDayIndex" :key="slot.id">
			<WeekBusySlot
				:busySlot="slot"
				:dayIndex="dayIndex"
			/>
		</template>
		<template v-for="cell of placementSlots" :key="cell.id">
			<WeekPlacementSlot
				:cell="cell"
			/>
		</template>
	`
	};

	// @vue/component
	const GridWeek = {
		name: 'BookingGridWeek',
		components: {
			DaysPanel,
			NavigationPanel,
			DayColumnPopup,
			Row,
			NowLine,
			Bookings,
			ScalePanel,
			DragDelete
		},
		mixins: [DragMixin],
		data() {
			return {
				dayColumnPopupParams: null
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				resourcesIds: `${booking_const.Model.Interface}/resourcesIds`,
				scroll: `${booking_const.Model.Interface}/scroll`,
				editingBookingId: `${booking_const.Model.Interface}/editingBookingId`,
				editingWaitListItemId: `${booking_const.Model.Interface}/editingWaitListItemId`,
				isFeatureEnabled: `${booking_const.Model.Interface}/isFeatureEnabled`,
				isLoaded: `${booking_const.Model.Interface}/isLoaded`
			})
		},
		watch: {
			scroll(value) {
				this.$refs.rowContainer.scrollTop = value;
			},
			isLoaded(isLoaded) {
				if (isLoaded) {
					this.setupDrag();
				}
			},
			isFeatureEnabled() {
				this.setupDrag();
			},
			editingBookingId() {
				this.setupDrag();
			},
			editingWaitListItemId() {
				this.setupDrag();
			}
		},
		mounted() {
			this.ears = new ui_ears.Ears({
				container: this.$refs.rowContainer,
				smallSize: true,
				className: 'booking-booking-grid-week-ears'
			}).init();
			if (this.isLoaded) {
				this.setupDrag();
			}
		},
		beforeUnmount() {
			this.closeDayColumnPopup();
			this.ears?.destroy();
			this.ears = null;
		},
		methods: {
			async openDayColumnPopup(params) {
				await this.$store.dispatch(`${booking_const.Model.Interface}/setSelectedDateTs`, params.dateTs);
				this.dayColumnPopupParams = params;
			},
			closeDayColumnPopup() {
				this.dayColumnPopupParams = null;
				void this.$store.dispatch(`${booking_const.Model.Interface}/setHoveredPlacementSlot`, null);
			},
			updateEars() {
				this.ears?.toggleEars();
			}
		},
		template: `
		<NavigationPanel/>
		<div class="booking-booking__week-grid-wrapper">
			<div
				id="booking-booking-grid-wrap"
				class="booking-booking__week-grid-table booking-horizontal-scroll-bar booking-vertical-scroll-bar"
				ref="rowContainer"
				@scroll="$store.dispatch('interface/setScroll', $refs.rowContainer.scrollTop)"
			>
				<NowLine/>
				<DaysPanel/>
				<TransitionGroup
					name="booking-transition-resource"
					@after-leave="updateEars"
					@after-enter="updateEars"
				>
					<template v-for="resourceId of resourcesIds" :key="resourceId">
						<Row :resourceId="resourceId" @openDayColumnPopup="openDayColumnPopup"/>
					</template>
				</TransitionGroup>
				<Bookings/>
				<div class="booking-booking_add-resource-container"></div>
			</div>
			<ScalePanel :withZoom="false"/>
			<DragDelete/>
		</div>
		<DayColumnPopup
			v-if="dayColumnPopupParams"
			:bindElement="dayColumnPopupParams.bindElement"
			:dateTs="dayColumnPopupParams.dateTs"
			:resourceId="dayColumnPopupParams.resourceId"
			@close="closeDayColumnPopup"
		/>
	`
	};

	class ContentHeader extends ui_entitySelector.BaseHeader {
		constructor(...props) {
			super(...props);
			this.getContainer();
		}
		render() {
			return this.options.content;
		}
	}

	const ResourceTypes = {
		emits: ['update:modelValue'],
		data() {
			return {
				selectedTypes: {}
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				resourceTypes: 'resourceTypes/get'
			}),
			visibleResourceTypes() {
				return this.resourceTypes.filter(item => item.resourcesCnt > 0);
			},
			isResourceTypesSectionVisible() {
				return this.visibleResourceTypes.length > 0;
			}
		},
		methods: {
			selectAll() {
				Object.keys(this.selectedTypes).forEach(typeId => {
					this.selectedTypes[typeId] = true;
				});
			},
			deselectAll() {
				Object.keys(this.selectedTypes).forEach(typeId => {
					this.selectedTypes[typeId] = false;
				});
			}
		},
		watch: {
			resourceTypes(resourceTypes) {
				resourceTypes.forEach(resourceType => {
					this.selectedTypes[resourceType.id] ??= true;
				});
			},
			selectedTypes: {
				handler() {
					this.$emit('update:modelValue', this.selectedTypes);
				},
				deep: true
			}
		},
		template: `
		<div v-if="isResourceTypesSectionVisible" class="booking-booking-resources-dialog-header-types">
			<div class="booking-booking-resources-dialog-header-header">
				<div class="booking-booking-resources-dialog-header-title">
					{{ loc('BOOKING_BOOKING_RESOURCES_DIALOG_RESOURCE_TYPES') }}
				</div>
				<div
					class="booking-booking-resources-dialog-header-button"
					data-element="booking-resources-dialog-select-all-types-button"
					@click="selectAll"
				>
					{{ loc('BOOKING_BOOKING_RESOURCES_DIALOG_SELECT_ALL') }}
				</div>
				<div
					class="booking-booking-resources-dialog-header-button"
					data-element="booking-resources-dialog-deselect-all-types-button"
					@click="deselectAll"
				>
					{{ loc('BOOKING_BOOKING_RESOURCES_DIALOG_DESELECT_ALL') }}
				</div>
			</div>
			<div class="booking-booking-resources-dialog-header-items">
				<template v-for="resourceType of visibleResourceTypes" :key="resourceType.id">
					<label
						class="booking-booking-resources-dialog-header-item"
						data-element="booking-resources-dialog-type"
						:data-id="resourceType.id"
						:data-selected="selectedTypes[resourceType.id]"
					>
						<span
							class="booking-booking-resources-dialog-header-item-text"
							data-element="booking-resources-dialog-type-name"
							:data-id="resourceType.id"
						>
							{{ resourceType.name }}
						</span>
						<input type="checkbox" v-model="selectedTypes[resourceType.id]">
					</label>
				</template>
			</div>
		</div>
	`
	};

	const Resize = {
		emits: ['startResize', 'endResize'],
		props: {
			getNode: {
				type: Function,
				required: true
			}
		},
		data() {
			return {
				isResized: false,
				startMouseY: 0,
				startHeight: 0
			};
		},
		methods: {
			startResize(event) {
				this.$emit('startResize');
				main_core.Dom.style(document.body, 'user-select', 'none');
				main_core.Event.bind(window, 'mouseup', this.endResize);
				main_core.Event.bind(window, 'pointermove', this.resize);
				this.isResized = true;
				this.startMouseY = event.clientY;
				this.startHeight = this.getNode().offsetHeight;
			},
			resize(event) {
				if (!this.isResized) {
					return;
				}
				event.preventDefault();
				const minHeight = 110;
				const maxHeight = 180;
				const height = this.startHeight + event.clientY - this.startMouseY;
				const newHeight = Math.min(maxHeight, Math.max(height, minHeight));
				main_core.Dom.style(this.getNode(), 'max-height', `${newHeight}px`);
			},
			endResize() {
				this.$emit('endResize');
				main_core.Dom.style(document.body, 'user-select', '');
				main_core.Event.unbind(window, 'mouseup', this.endResize);
				main_core.Event.unbind(window, 'pointermove', this.resize);
				this.isResized = false;
			}
		},
		template: `
		<div
			class="booking-booking-resources-dialog-header-resize"
			@mousedown="startResize"
		></div>
	`
	};

	const Search = {
		emits: ['search'],
		data() {
			return {
				query: ''
			};
		},
		created() {
			this.searchDebounced = main_core.Runtime.debounce(this.search, 200, this);
		},
		computed: {
			searchIcon() {
				return ui_iconSet_api_vue.Set.SEARCH_2;
			}
		},
		methods: {
			onInput(event) {
				const query = event.target.value;
				this.query = query;
				if (main_core.Type.isStringFilled(query)) {
					this.searchDebounced(query);
				} else {
					this.search(query);
				}
			},
			search(query) {
				if (this.query === query) {
					this.$emit('search', query);
				}
			}
		},
		components: {
			Icon: ui_iconSet_api_vue.BIcon
		},
		template: `
		<div class="booking-booking-resources-dialog-header-input-container">
			<input
				class="booking-booking-resources-dialog-header-input"
				:placeholder="loc('BOOKING_BOOKING_RESOURCES_DIALOG_SEARCH')"
				data-element="booking-resources-dialog-search-input"
				@input="onInput"
			>
			<div class="booking-booking-resources-dialog-header-input-icon">
				<Icon :name="searchIcon"/>
			</div>
		</div>
	`
	};

	const DialogHeader = {
		emits: ['update:modelValue', 'search', 'startResize', 'endResize', 'selectAll', 'deselectAll'],
		data() {
			return {
				selectedTypes: {}
			};
		},
		computed: ui_vue3_vuex.mapGetters({
			resources: 'resources/get'
		}),
		watch: {
			selectedTypes: {
				handler() {
					this.$emit('update:modelValue', this.selectedTypes);
				},
				deep: true
			}
		},
		components: {
			ResourceTypes,
			Resize,
			Search
		},
		template: `
		<div class="booking-booking-resources-dialog-header" ref="header">
			<ResourceTypes
				ref="resourceTypes"
				v-model="selectedTypes"
			/>
			<Resize
				:getNode="() => this.$refs.resourceTypes.$el"
				@startResize="$emit('startResize')"
				@endResize="$emit('endResize')"
			/>
			<div class="booking-booking-resources-dialog-header-resources">
				<div class="booking-booking-resources-dialog-header-header">
					<div class="booking-booking-resources-dialog-header-title">
						{{ loc('BOOKING_BOOKING_RESOURCES_DIALOG_RESOURCES') }}
					</div>
					<div
						class="booking-booking-resources-dialog-header-button"
						data-element="booking-resources-dialog-select-all-button"
						@click="$emit('selectAll')"
					>
						{{ loc('BOOKING_BOOKING_RESOURCES_DIALOG_SELECT_ALL') }}
					</div>
					<div
						class="booking-booking-resources-dialog-header-button"
						data-element="booking-resources-dialog-deselect-all-button"
						@click="$emit('deselectAll')"
					>
						{{ loc('BOOKING_BOOKING_RESOURCES_DIALOG_DESELECT_ALL') }}
					</div>
				</div>
				<Search @search="(query) => this.$emit('search', query)"/>
			</div>
		</div>
	`
	};

	class ContentFooter extends ui_entitySelector.BaseFooter {
		constructor(...props) {
			super(...props);
			this.getContainer();
		}
		render() {
			return this.options.content;
		}
	}

	const DialogFooter = {
		name: 'DialogFooter',
		emits: ['reset'],
		computed: {
			buttonSettings() {
				return Object.freeze({
					size: booking_component_button.ButtonSize.SMALL,
					color: booking_component_button.ButtonColor.LINK
				});
			},
			buttonLabel() {
				return this.loc('BOOKING_BOOKING_RESOURCES_DIALOG_RESET');
			}
		},
		components: {
			UiButton: booking_component_button.Button
		},
		template: `
		<div class="booking--booking--select-resources-dialog-footer">
			<UiButton
				:size="buttonSettings.size"
				:color="buttonSettings.color"
				:text="buttonLabel"
				button-class="booking--booking--select-resources-dialog-footer__button"
				@click="$emit('reset')"
			/>
		</div>
	`
	};

	const MIN_CHARGE = 0;
	const MAX_CHARGE = 12;
	const CHARGE_COLOR = 'var(--ui-color-primary-alt)';
	const EMPTY_COLOR = 'var(--ui-color-background-secondary)';
	const BATTERY_ICON_HEIGHT = 14;
	const BATTERY_ICON_WIDTH = 27;
	const BatteryIcon = {
		name: 'BatteryIcon',
		props: {
			percent: {
				type: Number,
				default: 0
			},
			dataId: {
				type: [String, Number],
				default: ''
			},
			height: {
				type: Number,
				default: BATTERY_ICON_HEIGHT
			},
			width: {
				type: Number,
				default: BATTERY_ICON_WIDTH
			}
		},
		mounted() {
			this.repaint();
		},
		methods: {
			getCharge(percent) {
				if (percent <= 0) {
					return MIN_CHARGE;
				}
				if (percent >= 100) {
					return MAX_CHARGE;
				}
				return Math.round(percent * MAX_CHARGE * 0.01);
			},
			repaint() {
				const rects = this.$refs['icon-battery-charge']?.children || [];
				const charge = this.getCharge(this.percent);
				let index = 1;
				for (const rect of rects) {
					rect.setAttribute('fill', index > charge ? EMPTY_COLOR : CHARGE_COLOR);
					index++;
				}
			}
		},
		watch: {
			percent: {
				handler() {
					this.repaint();
				}
			}
		},
		template: `
		<div :data-id="dataId" :data-percent="percent" data-element="booking-resource-workload-percent">
			<svg id="booking--battery-icon" :width="width" :height="height" viewBox="0 0 27 14" fill="none"
				 xmlns="http://www.w3.org/2000/svg">
				<rect width="23.2875" height="13.8" rx="4" fill="white"/>
				<rect x="22.6871" y="0.6" width="12.6" height="22.0875" rx="3.4" transform="rotate(90 22.6871 0.6)" stroke="#C9CCD0" stroke-width="1.2"/>
				<g ref="icon-battery-charge" id="booking--battery-icon-charge" clip-path="url(#clip0_5003_187951)">
					<rect x="2.58789" y="2.5875" width="1.50917" height="10" fill="#EDEEF0"/>
					<rect x="4.09766" y="2.5875" width="1.50917" height="10" fill="#EDEEF0"/>
					<rect x="5.60547" y="2.5875" width="1.50917" height="10" fill="#EDEEF0"/>
					<rect x="7.11523" y="2.5875" width="1.50917" height="10" fill="#EDEEF0"/>
					<rect x="8.625" y="2.5875" width="1.50917" height="10" fill="#EDEEF0"/>
					<rect x="10.1328" y="2.5875" width="1.50917" height="10" fill="#EDEEF0"/>
					<rect x="11.6426" y="2.5875" width="1.50917" height="10" fill="#EDEEF0"/>
					<rect x="13.1523" y="2.5875" width="1.50917" height="10" fill="#EDEEF0"/>
					<rect x="14.6621" y="2.5875" width="1.50917" height="10" fill="#EDEEF0"/>
					<rect x="16.1699" y="2.5875" width="1.50917" height="10" fill="#EDEEF0"/>
					<rect x="17.6797" y="2.5875" width="1.50917" height="10" fill="#EDEEF0"/>
					<rect x="19.1895" y="2.5875" width="1.50917" height="10" fill="#EDEEF0"/>
				</g>
				<g clip-path="url(#clip1_5003_187951)">
					<ellipse cx="23.102" cy="6.89999" rx="2.9" ry="3.48" transform="rotate(90 23.102 6.89999)" fill="#C9CCD0"/>
				</g>
				<defs>
					<clipPath id="clip0_5003_187951">
						<rect x="2.58789" y="2.5875" width="18.1125" height="8.625" rx="1.5" fill="white"/>
					</clipPath>
					<clipPath id="clip1_5003_187951">
						<rect width="6.9" height="2.15625" fill="white" transform="translate(26.7383 3.45) rotate(90)"/>
					</clipPath>
				</defs>
			</svg>
		</div>
	`
	};

	class ResourceWorkloadService {
		calculate(resourceId) {
			const resource = this.#getResourceById(resourceId);
			if (!resource) {
				return null;
			}
			const period = this.#getCurrentPeriod();
			if (!period) {
				return null;
			}
			return this.#calculateStats(period, resource, this.#getResourceBookings(resourceId, period));
		}
		#calculateStats(period, resource, bookings) {
			if (!resource?.slotRanges?.length) {
				return null;
			}
			const slotSizeMs = (resource.slotRanges[0]?.slotSize ?? 0) * booking_lib_duration.Duration.getUnitDurations().i;
			if (slotSizeMs <= 0) {
				return {
					slotsCount: 0,
					busySlotsCount: 0
				};
			}
			const workTimeDuration = this.#getWorkTimeDuration(period, resource);
			const bookingsDuration = bookings.reduce((sum, booking) => {
				return sum + booking_lib_booking.bookingService.getVisibleDuration(booking, period);
			}, 0);
			const busySlotsCount = Math.ceil(bookingsDuration / slotSizeMs);
			const slotsCount = Math.floor(workTimeDuration / slotSizeMs);
			return {
				slotsCount,
				busySlotsCount
			};
		}
		#getCurrentPeriod() {
			const period = booking_lib_datePeriod.DatePeriod.createByCurrentGridMode();
			return {
				fromTs: period.fromTs * 1000,
				toTs: period.toTs * 1000
			};
		}
		#getResourceById(resourceId) {
			return this.#store.getters[`${booking_const.Model.Resources}/getById`](resourceId) || null;
		}
		#getResourceBookings(resourceId, period) {
			return this.#store.getters[`${booking_const.Model.Bookings}/getByInterval`](period.fromTs, period.toTs).filter(booking => booking.resourcesIds.includes(resourceId));
		}
		#getWorkTimeDuration(period, resource) {
			return this.#getResourceWorkingPeriods(period, resource).reduce((sum, workingPeriod) => {
				return sum + booking_lib_datePeriod.DatePeriod.getDuration(workingPeriod);
			}, 0);
		}
		#getResourceWorkingPeriods(period, resource) {
			return booking_lib_datePeriod.DatePeriod.merge(booking_lib_datePeriod.DatePeriod.getDates({
				fromTs: period.fromTs / 1000,
				toTs: period.toTs / 1000
			}).map(dayTs => dayTs * 1000).flatMap(dayStartTs => {
				const dayPeriod = {
					fromTs: dayStartTs,
					toTs: dayStartTs + booking_lib_duration.Duration.getUnitDurations().d
				};
				return this.#getWorkingSlotRanges(dayPeriod, resource).map(slotRange => this.#slotRangeToDatePeriod(dayPeriod.fromTs, slotRange));
			}));
		}
		#getWorkingSlotRanges(period, resource) {
			return booking_lib_slotRanges.SlotRanges.applyTimezone(resource.slotRanges, period.fromTs, this.#timezone).filter(slotRange => slotRange.weekDays.includes(this.#getWeekDay(period)));
		}
		#getWeekDay(period) {
			return new Intl.DateTimeFormat('en-US', {
				weekday: 'short',
				timeZone: this.#timezone
			}).format(period.fromTs);
		}
		#slotRangeToDatePeriod(dayTs, slotRange) {
			const fromDate = new Date(dayTs);
			const toDate = new Date(dayTs);
			fromDate.setHours(0, slotRange.from, 0, 0);
			toDate.setHours(0, slotRange.to, 0, 0);
			return {
				fromTs: fromDate.getTime(),
				toTs: toDate.getTime()
			};
		}
		get #store() {
			return booking_core.Core.getStore();
		}
		get #timezone() {
			return this.#store.getters[`${booking_const.Model.Interface}/timezone`];
		}
	}
	const resourceWorkloadService = new ResourceWorkloadService();

	const WorkloadPopup = {
		emits: ['close'],
		props: {
			resourceId: {
				type: Number,
				required: true
			},
			slotsCount: {
				type: Number,
				required: true
			},
			busySlotsCount: {
				type: Number,
				required: true
			},
			workLoadPercent: {
				type: Number,
				required: true
			},
			bindElement: {
				type: HTMLElement,
				required: true
			}
		},
		computed: {
			popupId() {
				return 'booking-booking-resource-workload-popup';
			},
			title() {
				return this.loc('BOOKING_BOOKING_RESOURCE_WORKLOAD_POPUP_TITLE');
			},
			rows() {
				return [{
					title: this.loc('BOOKING_BOOKING_RESOURCE_WORKLOAD_SLOTS_BOOKED'),
					value: this.slotsBookedFormatted,
					dataset: {
						element: 'booking-resource-workload-popup-count',
						resourceId: this.resourceId,
						bookedCount: this.busySlotsCount,
						totalCount: this.slotsCount
					}
				}, {
					title: this.loc('BOOKING_BOOKING_RESOURCE_WORKLOAD'),
					value: this.workLoadPercentFormatted,
					dataset: {
						element: 'booking-resource-workload-popup-percent',
						resourceId: this.resourceId,
						percent: this.workLoadPercent
					}
				}];
			},
			slotsBookedFormatted() {
				return this.loc('BOOKING_BOOKING_RESOURCE_WORKLOAD_BOOKED_FROM_SLOTS_COUNT', {
					'#BOOKED#': this.busySlotsCount,
					'#SLOTS_COUNT#': this.slotsCount
				});
			},
			workLoadPercentFormatted() {
				return this.loc('BOOKING_BOOKING_RESOURCE_WORKLOAD_PERCENT', {
					'#PERCENT#': this.workLoadPercent
				});
			}
		},
		components: {
			StatisticsPopup: booking_component_statisticsPopup.StatisticsPopup
		},
		template: `
		<StatisticsPopup
			:popupId="popupId"
			:bindElement="bindElement"
			:title="title"
			:rows="rows"
			:dataset="{
				id: resourceId,
				element: 'booking-resource-workload-popup',
			}"
			@close="$emit('close')"
		/>
	`
	};

	// @vue/component
	const ResourceWorkload = {
		name: 'ResourceWorkload',
		components: {
			BatteryIcon,
			WorkloadPopup
		},
		props: {
			resourceId: {
				type: Number,
				required: true
			},
			scale: {
				type: Number,
				default: 1
			},
			isGrid: {
				type: Boolean,
				default: false
			}
		},
		data() {
			return {
				isPopupShown: false
			};
		},
		computed: {
			stats() {
				return resourceWorkloadService.calculate(this.resourceId) ?? {
					slotsCount: 0,
					busySlotsCount: 0
				};
			},
			workLoadPercent() {
				if (this.slotsCount === 0) {
					return 0;
				}
				return Math.round(this.busySlotsCount * 100 / this.slotsCount);
			},
			slotsCount() {
				return this.stats.slotsCount;
			},
			batteryIconOptions() {
				return {
					height: Math.round(BATTERY_ICON_HEIGHT * this.scale),
					width: Math.round(BATTERY_ICON_WIDTH * this.scale)
				};
			},
			busySlotsCount() {
				return this.stats.busySlotsCount;
			}
		},
		watch: {
			busySlotsCount(newCount, previousCount) {
				if (this.isGrid && newCount > previousCount && booking_lib_ahaMoments.ahaMoments.shouldShow(booking_const.AhaMoment.ResourceWorkload)) {
					void this.showAhaMoment();
				}
			}
		},
		methods: {
			onMouseEnter() {
				this.showTimeout = setTimeout(() => this.showPopup(), 100);
			},
			onMouseLeave() {
				clearTimeout(this.showTimeout);
				this.closePopup();
			},
			showPopup() {
				this.isPopupShown = true;
			},
			closePopup() {
				this.isPopupShown = false;
			},
			async showAhaMoment() {
				booking_lib_ahaMoments.ahaMoments.setPopupShown(booking_const.AhaMoment.ResourceWorkload);
				await booking_lib_ahaMoments.ahaMoments.show({
					id: 'booking-resource-workload',
					title: this.loc('BOOKING_AHA_RESOURCE_WORKLOAD_TITLE'),
					text: this.loc('BOOKING_AHA_RESOURCE_WORKLOAD_TEXT'),
					article: booking_const.HelpDesk.AhaResourceWorkload,
					target: this.$refs.container,
					isPulsarTransparent: true
				});
				booking_lib_ahaMoments.ahaMoments.setShown(booking_const.AhaMoment.ResourceWorkload);
			}
		},
		template: `
		<div
			class="booking-booking-header-resource-workload"
			data-element="booking-resource-workload"
			:data-id="resourceId"
			ref="container"
			@click="showPopup"
			@mouseenter="onMouseEnter"
			@mouseleave="onMouseLeave"
		>
			<BatteryIcon
				:percent="workLoadPercent"
				:data-id="resourceId"
				:height="batteryIconOptions.height"
				:width="batteryIconOptions.width"
			/>
		</div>
		<WorkloadPopup
			v-if="isPopupShown"
			:resourceId="resourceId"
			:slotsCount="slotsCount"
			:busySlotsCount="busySlotsCount"
			:workLoadPercent="workLoadPercent"
			:bindElement="$refs.container"
			@close="closePopup"
		/>
	`
	};

	// @vue/component
	const ResourceSelector = {
		name: 'ResourceSelector',
		components: {
			DialogHeader,
			DialogFooter,
			ResourceWorkload,
			Icon: ui_iconSet_api_vue.BIcon
		},
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		data() {
			return {
				dialogFilled: false,
				query: '',
				selectedTypes: {}
			};
		},
		created() {
			this.saveItemsDebounce = main_core.Runtime.debounce(this.saveItems, 10, this);
			this.workloadRefs = {};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				selectedDateTs: `${booking_const.Model.Interface}/selectedDateTs`,
				favoritesIds: `${booking_const.Model.Favorites}/get`,
				resources: `${booking_const.Model.Resources}/get`,
				isFilterMode: `${booking_const.Model.Filter}/isFilterMode`,
				isEditingBookingMode: `${booking_const.Model.Interface}/isEditingBookingMode`,
				isLoaded: `${booking_const.Model.Interface}/isLoaded`,
				isWeekMode: `${booking_const.Model.Interface}/isWeekMode`,
				mainResources: `${booking_const.Model.MainResources}/resources`,
				resourceTypes: `${booking_const.Model.ResourceTypes}/get`
			}),
			mainResourceIds() {
				return new Set(this.mainResources);
			},
			isDefaultState() {
				return this.mainResourceIds.size === this.favoritesIds.length && this.favoritesIds.every(id => this.mainResourceIds.has(id));
			},
			visibleResourceTypes() {
				return this.resourceTypes.filter(item => item.resourcesCnt > 0).map(({
					id
				}) => id);
			}
		},
		watch: {
			favoritesIds() {
				this.updateItems();
			},
			resources: {
				handler(resources) {
					setTimeout(() => this.addItems(resources));
					booking_provider_service_resourceDialogService.resourceDialogService.clearMainResourcesCache();
				},
				deep: true
			},
			selectedTypes: {
				handler() {
					void this.updateItemsByType();
				},
				deep: true
			},
			isLoaded() {
				this.tryShowAhaMoment();
			}
		},
		mounted() {
			this.dialog = new ui_entitySelector.Dialog({
				context: 'BOOKING',
				targetNode: this.$refs.button,
				width: 340,
				height: Math.min(window.innerHeight - 280, 600),
				offsetLeft: 4,
				dropdownMode: true,
				preselectedItems: this.favoritesIds.map(resourceId => [booking_const.EntitySelectorEntity.Resource, resourceId]),
				items: this.resources.map(resource => this.getItemOptions(resource)),
				entities: [{
					id: booking_const.EntitySelectorEntity.Resource
				}],
				events: {
					onShow: this.onShow,
					'Item:onSelect': this.saveItemsDebounce,
					'Item:onDeselect': this.saveItemsDebounce
				},
				header: ContentHeader,
				headerOptions: {
					content: this.$refs.dialogHeader.$el
				},
				footer: ContentFooter,
				footerOptions: {
					content: this.$refs.dialogFooter.$el
				}
			});
			main_core.Event.bind(this.dialog.getRecentTab().getContainer(), 'scroll', this.loadOnScroll);
			main_core.Event.EventEmitter.subscribe('BX.Main.Popup:onAfterClose', this.tryShowAhaMoment);
			main_core.Event.EventEmitter.subscribe('BX.Main.Popup:onDestroy', this.tryShowAhaMoment);
		},
		methods: {
			showDialog() {
				this.updateItems();
				void this.loadMainResources();
				this.dialog.show();
			},
			async onShow() {
				if (this.dialogFilled) {
					void this.loadOnScroll();
					return;
				}
				this.dialogFilled = true;
				await booking_provider_service_resourceDialogService.resourceDialogService.fillDialog(this.selectedDateTs / 1000);
			},
			async loadOnScroll() {
				const container = this.dialog.getRecentTab().getContainer();
				const scrollTop = container.scrollTop;
				const maxScroll = container.scrollHeight - container.offsetHeight;
				if (scrollTop + 10 >= maxScroll) {
					const loadedResourcesIds = booking_lib_resourcesDateCache.resourcesDateCache.getIdsByDateTs(this.selectedDateTs / 1000);
					const activeResources = this.resources.filter(resource => !resource.isDeleted);
					const resourcesIds = activeResources.map(resource => resource.id);
					const idsToLoad = resourcesIds.filter(id => !loadedResourcesIds.includes(id)).slice(0, booking_const.Limit.ResourcesDialog);
					await booking_provider_service_resourceDialogService.resourceDialogService.loadByIds(idsToLoad, this.selectedDateTs / 1000);
					this.updateItems();
				}
			},
			async loadMainResources() {
				await booking_provider_service_resourceDialogService.resourceDialogService.getMainResources();
			},
			updateItems() {
				this.dialog.getItems().forEach(item => {
					const id = item.getId();
					const workload = this.workloadRefs[id];
					const isHidden = this.isItemHidden(id);
					const isSelected = this.isItemSelected(id);
					item.getNodes().forEach(node => {
						const avatarContainer = node.getAvatarContainer();
						main_core.Dom.style(avatarContainer, 'width', 'max-content');
						main_core.Dom.style(avatarContainer, 'height', 'max-content');
						main_core.Dom.append(workload, avatarContainer);
					});
					item.setHidden(isHidden);
					if (!item.isSelected() && isSelected) {
						item.select();
					}
					if (item.isSelected() && !isSelected) {
						item.deselect();
					}
				});
			},
			saveItems() {
				void booking_lib_resources.hideResources(this.dialog.getSelectedItems().map(item => item.id));
			},
			addItems(resources) {
				const itemsOptions = resources.reduce((acc, resource) => ({
					...acc,
					[resource.id]: this.getItemOptions(resource)
				}), {});
				Object.values(itemsOptions).forEach(itemOptions => this.dialog.addItem(itemOptions));
				const itemsIds = this.dialog.getItems().map(item => item.getId()).filter(id => itemsOptions[id]);
				this.dialog.removeItems();
				itemsIds.forEach(id => this.dialog.addItem(itemsOptions[id]));

				// I don't know why, but tab is being removed after this.dialog.removeItems();
				const tab = this.dialog.getActiveTab();
				if (tab) {
					tab.getContainer().append(tab.getRootNode().getChildrenContainer());
					tab.render();
				}
				this.updateItems();
				if (main_core.Type.isStringFilled(this.query)) {
					void this.search(this.query);
				}
			},
			getItemOptions(resource) {
				return {
					id: resource.id,
					entityId: booking_const.EntitySelectorEntity.Resource,
					title: resource.name,
					subtitle: this.getResourceType(resource.typeId).name,
					avatarOptions: {
						bgImage: 'none',
						borderRadius: '0'
					},
					tabs: booking_const.EntitySelectorTab.Recent,
					selected: this.isItemSelected(resource.id),
					hidden: this.isItemHidden(resource.id),
					nodeAttributes: {
						'data-id': resource.id,
						'data-element': 'booking-select-resources-dialog-item'
					}
				};
			},
			isItemSelected(id) {
				return this.favoritesIds.includes(id);
			},
			isItemHidden(id) {
				const loadedResourcesIds = booking_lib_resourcesDateCache.resourcesDateCache.getIdsByDateTs(this.selectedDateTs / 1000);
				const resource = this.getResource(id);
				const visible = loadedResourcesIds.includes(id) && resource && !resource.isDeleted && this.selectedTypes[resource.typeId];
				return !visible;
			},
			getResource(id) {
				return this.$store.getters['resources/getById'](id);
			},
			getResourceType(id) {
				return this.$store.getters['resourceTypes/getById'](id);
			},
			async search(query) {
				this.query = query;
				this.dialog.search(this.query);
				this.updateItems();
				this.dialog.getSearchTab().getStub().hide();
				this.dialog.getSearchTab().getSearchLoader().show();
				await booking_provider_service_resourceDialogService.resourceDialogService.doSearch(this.query, this.selectedDateTs / 1000, this.visibleResourceTypes);
				this.dialog.search(this.query);
				this.updateItems();
				this.dialog.getSearchTab().getSearchLoader().hide();
				if (this.dialog.getSearchTab().isEmptyResult()) {
					this.dialog.getSearchTab().getStub().show();
				}
			},
			startResize() {
				this.dialog.freeze();
			},
			endResize() {
				setTimeout(() => this.dialog.unfreeze());
			},
			selectAll() {
				this.dialog.getItems().forEach(item => {
					if (!item.isHidden()) {
						item.select();
					}
				});
			},
			deselectAll() {
				this.dialog.getItems().forEach(item => {
					if (!item.isHidden()) {
						item.deselect();
					}
				});
			},
			setWorkloadRef(element, id) {
				this.workloadRefs[id] = element;
			},
			tryShowAhaMoment() {
				if (booking_lib_ahaMoments.ahaMoments.shouldShow(booking_const.AhaMoment.SelectResources)) {
					main_core.Event.EventEmitter.unsubscribe('BX.Main.Popup:onAfterClose', this.tryShowAhaMoment);
					main_core.Event.EventEmitter.unsubscribe('BX.Main.Popup:onDestroy', this.tryShowAhaMoment);
					void this.showAhaMoment();
				}
			},
			async showAhaMoment() {
				await booking_lib_ahaMoments.ahaMoments.show({
					id: 'booking-select-resources',
					title: this.loc('BOOKING_AHA_SELECT_RESOURCES_TITLE_MSGVER_1'),
					text: this.loc('BOOKING_AHA_SELECT_RESOURCES_TEXT_MSGVER_1'),
					article: {
						...booking_const.HelpDesk.AhaSelectResources,
						title: this.loc('BOOKING_AHA_ARTICLE_LINK_TITLE')
					},
					target: this.$refs.button,
					isPulsarTransparent: true
				});
				booking_lib_ahaMoments.ahaMoments.setShown(booking_const.AhaMoment.SelectResources);
			},
			reset() {
				const mainResourceIds = this.mainResourceIds;
				this.dialog.getItems().forEach(item => {
					if (mainResourceIds.has(item.id)) {
						item.select();
					} else {
						item.deselect();
					}
				});
			},
			getSelectedTypes() {
				return this.visibleResourceTypes.filter(id => this.selectedTypes[id]);
			},
			async updateItemsByType() {
				if (this.query || this.visibleResourceTypes.every(id => this.selectedTypes[id]) || this.visibleResourceTypes.every(id => !this.selectedTypes[id])) {
					this.updateItems();
					return;
				}
				await booking_provider_service_resourceDialogService.resourceDialogService.doSearch(this.query, this.selectedDateTs / 1000, this.getSelectedTypes());
				this.updateItems();
				this.dialog.getSearchTab().getSearchLoader().hide();
				if (this.dialog.getSearchTab().isEmptyResult()) {
					this.dialog.getSearchTab().getStub().show();
				}
			}
		},
		template: `
		<div 
			class="booking-booking__resource-selector"
			:class="{'--disabled': isFilterMode}"
			data-element="booking-select-resources"
			ref="button"
			@click="showDialog"
		>
			<Icon :name="Outline.FILTER_FUNNEL"/>
			<template v-if="isWeekMode">
				<div class="booking-booking__resource-selector_divider"></div>
				<div class="booking-booking__resource-selector_title">
					{{ loc('BOOKING_RESOURCE_SELECTOR_BUTTON_LABEL') }}
				</div>
			</template>
		</div>
		<DialogHeader
			ref="dialogHeader"
			v-model="selectedTypes"
			@search="search"
			@startResize="startResize"
			@endResize="endResize"
			@selectAll="selectAll"
			@deselectAll="deselectAll"
		/>
		<DialogFooter
			v-show="dialogFilled && !isDefaultState"
			ref="dialogFooter"
			@reset="reset"
		/>
		<div class="booking-booking__resource-selector_workload-container">
			<template v-for="resource of resources">
				<span class="booking-booking__resource-selector_workload" :ref="(el) => setWorkloadRef(el, resource.id)">
					<ResourceWorkload :resourceId="resource.id"/>
				</span>
			</template>
		</div>
	`
	};

	const Multiple = {
		emits: ['change'],
		props: {
			resourceId: {
				type: Number,
				required: true
			}
		},
		data() {
			return {
				isSelected: false,
				selectedItems: []
			};
		},
		mounted() {
			this.selector = this.createSelector();
		},
		unmounted() {
			this.selector.destroy();
			this.selector = null;
		},
		methods: {
			createSelector() {
				const selectedIds = this.intersections[this.resourceId] ?? [];
				return new ui_entitySelector.Dialog({
					id: `booking-intersection-selector-resource-${this.resourceId}`,
					targetNode: this.$refs.intersectionField,
					preselectedItems: selectedIds.map(id => [booking_const.EntitySelectorEntity.Resource, id]),
					width: 400,
					enableSearch: true,
					dropdownMode: true,
					context: 'bookingResourceIntersection',
					multiple: true,
					cacheable: true,
					showAvatars: false,
					entities: [{
						id: booking_const.EntitySelectorEntity.Resource,
						dynamicLoad: true,
						dynamicSearch: true
					}],
					searchOptions: {
						allowCreateItem: false,
						footerOptions: {
							label: this.loc('BOOKING_BOOKING_ADD_INTERSECTION_DIALOG_SEARCH_FOOTER')
						}
					},
					events: {
						onHide: this.changeSelected.bind(this),
						onLoad: this.changeSelected.bind(this)
					}
				});
			},
			showSelector() {
				if (!this.isMultiResourcesFeatureEnabled) {
					void booking_lib_limit.limit.show(booking_const.LimitFeatureId.MultiResources);
					return;
				}
				if (this.isFeatureEnabled) {
					this.selector.show();
				} else {
					void booking_lib_limit.limit.show();
				}
			},
			changeSelected() {
				this.selectedItems = this.selector.getSelectedItems();
				this.isSelected = this.selectedItems.length > 0;
				const selectedIds = this.selectedItems.map(item => item.id);
				this.$emit('change', selectedIds, this.resourceId);
			},
			handleRemove(itemId) {
				this.selector.getItem([booking_const.EntitySelectorEntity.Resource, itemId]).deselect();
				this.changeSelected();
			}
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				intersections: `${booking_const.Model.Interface}/intersections`,
				isFeatureEnabled: `${booking_const.Model.Interface}/isFeatureEnabled`,
				resources: `${booking_const.Model.Resources}/get`
			}),
			isMultiResourcesFeatureEnabled() {
				return this.$store.state[booking_const.Model.Interface].enabledFeature.bookingMulti;
			},
			resourcesIds() {
				return this.resources.map(({
					id
				}) => id);
			},
			firstItemTitle() {
				return this.selectedItems.length > 0 ? this.selectedItems[0].title : '';
			},
			remainingItemsCount() {
				return this.selectedItems.length > 1 ? this.selectedItems.length - 1 : 0;
			}
		},
		watch: {
			resourcesIds(resourcesIds, previousResourcesIds) {
				if (resourcesIds.join(',') === previousResourcesIds.join(',')) {
					return;
				}
				const removedIds = previousResourcesIds.filter(id => !resourcesIds.includes(id));
				const newIds = resourcesIds.filter(id => !previousResourcesIds.includes(id));
				removedIds.forEach(id => {
					const item = this.selector.getItem([booking_const.EntitySelectorEntity.Resource, id]);
					this.selector.removeItem(item);
				});
				newIds.forEach(id => {
					const resource = this.$store.getters[`${booking_const.Model.Resources}/getById`](id);
					if (!resource || resource.isDeleted) {
						return;
					}
					const resourceType = this.$store.getters[`${booking_const.Model.ResourceTypes}/getById`](resource.typeId);
					this.selector.addItem({
						id,
						entityId: booking_const.EntitySelectorEntity.Resource,
						title: resource.name,
						subtitle: resourceType.name,
						tabs: booking_const.EntitySelectorTab.Recent
					});
				});
				this.changeSelected();
			},
			resources: {
				handler() {
					this.selector.getItems().forEach(item => {
						const resource = this.$store.getters[`${booking_const.Model.Resources}/getById`](item.getId());
						if (!resource) {
							return;
						}
						const resourceType = this.$store.getters[`${booking_const.Model.ResourceTypes}/getById`](resource.typeId);
						item.setTitle(resource.name);
						item.setSubtitle(resourceType.name);
					});
					this.selector.getTagSelector().getTags().forEach(tag => {
						const resource = this.$store.getters[`${booking_const.Model.Resources}/getById`](tag.getId());
						if (!resource) {
							return;
						}
						tag.setTitle(resource.name);
						tag.render();
					});
					this.selectedItems = this.selector.getSelectedItems();
				},
				deep: true
			}
		},
		template: `
		<div
			ref="intersectionField"
			class="booking-booking-intersections-resource"
			:data-id="'booking-booking-intersections-resource-' + resourceId"
		>
			<template v-if="isSelected">
				<div
					ref="selectorItemContainer"
					class="booking-booking-intersections-resource-container"
				>
					<div
						v-if="selectedItems.length > 0"
						class="bbi-resource-selector-item bbi-resource-selector-tag"
					>
						<div class="bbi-resource-selector-tag-content" :title="firstItemTitle">
							<div class="bbi-resource-selector-tag-title">{{ firstItemTitle }}</div>
						</div>
						<div
							class="bbi-resource-selector-tag-remove"
							@click="handleRemove(selectedItems[0].id)"
							:data-id="'bbi-resource-selector-tag-remove-' + resourceId"
						></div>
					</div>
					<div
						v-if="remainingItemsCount > 0"
						class="bbi-resource-selector-item bbi-resource-selector-tag --count"
						@click="showSelector"
						:data-id="'bbi-resource-selector-tag-count-' + resourceId"
					>
						<div class="bbi-resource-selector-tag-content">
							<div class="bbi-resource-selector-tag-title --count">+{{ remainingItemsCount }}</div>
						</div>
					</div>
					<div>
						<span
							class="bbi-resource-selector-item bbi-resource-selector-add-button"
							@click="showSelector"
							:data-id="'bbi-resource-selector-add-button' + resourceId"
						>
							<span class="bbi-resource-selector-add-button-caption">
								{{ loc('BOOKING_BOOKING_INTERSECTION_BUTTON_MORE') }}
							</span>
						</span>
					</div>
				</div>
			</template>
			<template v-else>
				<span
					ref="selectorButton"
					class="bbi-resource-selector-item bbi-resource-selector-add-button"
					:data-id="'bbi-resource-selector-add-button' + resourceId"
					@click="showSelector"
				>
					<span class="bbi-resource-selector-add-button-caption">
						{{ loc('BOOKING_BOOKING_INTERSECTION_BUTTON_MSGVER_1') }}
					</span>
				</span>
			</template>
		</div>
	`
	};

	const Single = {
		emits: ['change'],
		created() {
			this.selector = this.createSelector();
			if (!this.isFeatureEnabled || !this.isMultiResourcesFeatureEnabled) {
				this.selector.lock();
			}
		},
		mounted() {
			this.mountSelector();
			main_core.Event.EventEmitter.subscribe('BX.Main.Popup:onAfterClose', this.tryShowAhaMoment);
			main_core.Event.EventEmitter.subscribe('BX.Main.Popup:onDestroy', this.tryShowAhaMoment);
		},
		beforeUnmount() {
			this.destroySelector();
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				isEditingBookingMode: `${booking_const.Model.Interface}/isEditingBookingMode`,
				intersections: `${booking_const.Model.Interface}/intersections`,
				isLoaded: `${booking_const.Model.Interface}/isLoaded`,
				isFeatureEnabled: `${booking_const.Model.Interface}/isFeatureEnabled`,
				resources: `${booking_const.Model.Resources}/get`
			}),
			resourcesIds() {
				return this.resources.map(({
					id
				}) => id);
			},
			isMultiResourcesFeatureEnabled() {
				return this.$store.state[booking_const.Model.Interface].enabledFeature.bookingMulti;
			}
		},
		methods: {
			createSelector() {
				return new ui_entitySelector.TagSelector({
					multiple: true,
					addButtonCaption: this.loc('BOOKING_BOOKING_ADD_INTERSECTION_MSGVER_1'),
					showCreateButton: false,
					dialogOptions: {
						context: 'bookingResourceIntersection',
						width: 290,
						height: 340,
						dropdownMode: true,
						enableSearch: true,
						cacheable: true,
						showAvatars: false,
						entities: [{
							id: booking_const.EntitySelectorEntity.Resource,
							dynamicLoad: true,
							dynamicSearch: true
						}],
						searchOptions: {
							allowCreateItem: false,
							footerOptions: {
								label: this.loc('BOOKING_BOOKING_ADD_INTERSECTION_DIALOG_SEARCH_FOOTER')
							}
						}
					},
					events: {
						onAfterTagAdd: this.onSelectorChange,
						onAfterTagRemove: this.onSelectorChange
					}
				});
			},
			onSelectorChange() {
				const selectedIds = this.selector.getDialog().getSelectedItems().map(({
					id
				}) => id);
				this.$emit('change', selectedIds);
			},
			mountSelector() {
				this.selector.renderTo(this.$refs.intersectionField);
			},
			destroySelector() {
				this.selector.getDialog().destroy();
				this.selector = null;
				this.$refs.intersectionField.innerHTML = '';
			},
			getResource(id) {
				return this.$store.getters['resources/getById'](id);
			},
			getResourceType(id) {
				return this.$store.getters['resourceTypes/getById'](id);
			},
			tryShowAhaMoment() {
				if (booking_lib_ahaMoments.ahaMoments.shouldShow(booking_const.AhaMoment.ResourceIntersection) && this.selector) {
					main_core.Event.EventEmitter.unsubscribe('BX.Main.Popup:onAfterClose', this.tryShowAhaMoment);
					main_core.Event.EventEmitter.unsubscribe('BX.Main.Popup:onDestroy', this.tryShowAhaMoment);
					void this.showAhaMoment();
				}
			},
			async showAhaMoment() {
				await booking_lib_ahaMoments.ahaMoments.show({
					id: 'booking-resource-intersection',
					title: this.loc('BOOKING_AHA_RESOURCE_INTERSECTION_TITLE'),
					text: this.loc('BOOKING_AHA_RESOURCE_INTERSECTION_TEXT'),
					article: booking_const.HelpDesk.AhaResourceIntersection,
					target: this.selector.getAddButton(),
					isPulsarTransparent: true
				});
				booking_lib_ahaMoments.ahaMoments.setShown(booking_const.AhaMoment.ResourceIntersection);
			},
			click() {
				if (!this.isMultiResourcesFeatureEnabled) {
					void booking_lib_limit.limit.show(booking_const.LimitFeatureId.MultiResources);
				}
				if (!this.isFeatureEnabled) {
					void booking_lib_limit.limit.show();
				}
			}
		},
		watch: {
			intersections(intersections) {
				if (!this.isEditingBookingMode) {
					return;
				}
				const resourcesIds = intersections[0] ?? [];
				resourcesIds.forEach(id => {
					const resource = this.getResource(id);
					this.selector.getDialog().addItem({
						id: resource.id,
						entityId: booking_const.EntitySelectorEntity.Resource,
						title: resource.name,
						subtitle: this.getResourceType(resource.typeId).name,
						selected: true
					});
				});
			},
			isLoaded() {
				this.tryShowAhaMoment();
			},
			resourcesIds(resourcesIds, previousResourcesIds) {
				if (resourcesIds.join(',') === previousResourcesIds.join(',')) {
					return;
				}
				const removedIds = previousResourcesIds.filter(id => !resourcesIds.includes(id));
				const newIds = resourcesIds.filter(id => !previousResourcesIds.includes(id));
				removedIds.forEach(id => {
					const item = this.selector.getDialog().getItem([booking_const.EntitySelectorEntity.Resource, id]);
					this.selector.getDialog().removeItem(item);
					const tag = this.selector.getTags().find(it => it.getId() === id);
					tag?.remove();
				});
				newIds.forEach(id => {
					const resource = this.$store.getters[`${booking_const.Model.Resources}/getById`](id);
					if (!resource || resource.isDeleted) {
						return;
					}
					const resourceType = this.$store.getters[`${booking_const.Model.ResourceTypes}/getById`](resource.typeId);
					this.selector.getDialog().addItem({
						id,
						entityId: booking_const.EntitySelectorEntity.Resource,
						title: resource.name,
						subtitle: resourceType.name,
						tabs: booking_const.EntitySelectorTab.Recent
					});
				});
				this.onSelectorChange();
				this.tryShowAhaMoment();
			},
			resources: {
				handler() {
					this.selector.getDialog().getItems().forEach(item => {
						const resource = this.$store.getters[`${booking_const.Model.Resources}/getById`](item.getId());
						if (!resource) {
							return;
						}
						const resourceType = this.$store.getters[`${booking_const.Model.ResourceTypes}/getById`](resource.typeId);
						item.setTitle(resource.name);
						item.setSubtitle(resourceType.name);
					});
					this.selector.getTags().forEach(tag => {
						const resource = this.$store.getters[`${booking_const.Model.Resources}/getById`](tag.getId());
						if (!resource) {
							return;
						}
						tag.setTitle(resource.name);
						tag.render();
					});
				},
				deep: true
			}
		},
		template: `
		<div
			ref="intersectionField"
			class="booking-booking-intersections-line booking-vertical-scroll-bar"
			data-id="booking-booking-intersections-line"
			@click="click"
		></div>
	`
	};

	const IntersectionModeMenuItemId = 'booking-intersection-menu-mode';

	// @vue/component
	const ResourceIntersection = {
		name: 'ResourceIntersection',
		components: {
			Icon: ui_iconSet_api_vue.BIcon,
			UiCounter: booking_component_counter.Counter,
			Multiple,
			Single
		},
		setup() {
			return {
				CounterSize: booking_component_counter.CounterSize,
				IconSet: ui_iconSet_api_vue.Set,
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				resourcesIds: `${booking_const.Model.Interface}/resourcesIds`,
				isFilterMode: `${booking_const.Model.Filter}/isFilterMode`,
				isEditingBookingMode: `${booking_const.Model.Interface}/isEditingBookingMode`,
				intersections: `${booking_const.Model.Interface}/intersections`,
				isIntersectionForAll: `${booking_const.Model.Interface}/isIntersectionForAll`,
				intersectionExpanded: `${booking_const.Model.Interface}/intersectionExpanded`,
				scroll: `${booking_const.Model.Interface}/scroll`,
				isLoaded: `${booking_const.Model.Interface}/isLoaded`,
				isFeatureEnabled: `${booking_const.Model.Interface}/isFeatureEnabled`,
				isWeekMode: `${booking_const.Model.Interface}/isWeekMode`
			}),
			countIntersectionResources() {
				if (this.isIntersectionForAll) {
					return this.intersections[0]?.length ?? 0;
				}
				return Object.values(this.intersections).filter(resourcesIds => resourcesIds.length > 0).length;
			},
			neededShowIntersectionCounter() {
				return this.countIntersectionResources > 0;
			},
			hasIntersections() {
				return Object.values(this.intersections).some(resourcesIds => resourcesIds.length > 0);
			},
			disabled() {
				return !this.isLoaded || this.isFilterMode || this.isEditingBookingMode;
			},
			isMultiResourcesFeatureEnabled() {
				return this.$store.state[booking_const.Model.Interface].enabledFeature.bookingMulti;
			},
			scrollProperty() {
				return this.isWeekMode ? booking_const.ScrollDirection.Vertical : booking_const.ScrollDirection.Horizontal;
			},
			inactiveScrollProperty() {
				return this.isWeekMode ? booking_const.ScrollDirection.Horizontal : booking_const.ScrollDirection.Vertical;
			}
		},
		watch: {
			async isIntersectionForAll() {
				await this.$store.dispatch(`${booking_const.Model.Interface}/setIntersections`, {});
				this.updateScroll();
				await booking_lib_busySlots.busySlots.loadBusySlots();
				this.toggleMenuItemActivityState(this.menu.getMenuItem(IntersectionModeMenuItemId));
			},
			scroll() {
				this.updateScroll();
			},
			intersectionExpanded() {
				void this.$nextTick(this.updateScroll);
			}
		},
		mounted() {
			this.menu = main_popup.MenuManager.create('booking-intersection-menu', this.$refs.intersectionMenu, this.getMenuItems(), {
				closeByEsc: true,
				autoHide: true,
				cacheable: true
			});
		},
		unmounted() {
			this.menu.destroy();
			this.menu = null;
		},
		methods: {
			showMenu() {
				if (!this.isMultiResourcesFeatureEnabled) {
					void booking_lib_limit.limit.show(booking_const.LimitFeatureId.MultiResources);
					return;
				}
				if (this.isFeatureEnabled) {
					this.menu.show();
				} else {
					void booking_lib_limit.limit.show();
				}
			},
			getMenuItems() {
				return [this.getIntersectionForAllItem(), {
					delimiter: true
				}, this.getHelpDeskItem()];
			},
			getIntersectionForAllItem() {
				return {
					id: IntersectionModeMenuItemId,
					dataset: {
						id: IntersectionModeMenuItemId
					},
					text: this.loc('BOOKING_BOOKING_INTERSECTION_MENU_ALL'),
					className: this.isIntersectionForAll ? 'menu-popup-item menu-popup-item-accept' : 'menu-popup-item menu-popup-no-icon',
					onclick: () => {
						this.menu.close();
						const value = !this.isIntersectionForAll;
						void this.$store.dispatch(`${booking_const.Model.Interface}/setIntersectionMode`, value);
						void booking_provider_service_optionService.optionService.setBool(booking_const.Option.IntersectionForAll, value);
					}
				};
			},
			getHelpDeskItem() {
				return {
					id: 'booking-intersection-menu-info',
					dataset: {
						id: 'booking-intersection-menu-info'
					},
					text: this.loc('BOOKING_BOOKING_INTERSECTION_MENU_HOW'),
					onclick: () => this.showHelpDesk()
				};
			},
			async showIntersections(selectedResourceIds, resourceId = 0) {
				const intersections = {
					...(resourceId === 0 ? {} : this.intersections),
					[resourceId]: selectedResourceIds
				};
				await this.$store.dispatch(`${booking_const.Model.Interface}/setIntersections`, intersections);
				await booking_lib_busySlots.busySlots.loadBusySlots();
			},
			toggleMenuItemActivityState(item) {
				main_core.Dom.toggleClass(item.getContainer(), 'menu-popup-item-accept');
				main_core.Dom.toggleClass(item.getContainer(), 'menu-popup-no-icon');
			},
			updateScroll() {
				if (!this.$refs.inner) {
					return;
				}
				if (this.intersectionExpanded) {
					this.$refs.inner[this.inactiveScrollProperty] = 0;
					this.$refs.inner[this.scrollProperty] = this.scroll;
				}
			},
			showHelpDesk() {
				booking_lib_helpDesk.helpDesk.show(booking_const.HelpDesk.Intersection.code, booking_const.HelpDesk.Intersection.anchorCode);
			}
		},
		template: `
		<div
			class="booking-booking__intersection-settings"
			:class="{
				'--locked': !isMultiResourcesFeatureEnabled,
				'--active': hasIntersections,
				'--disabled': disabled,
			}"
			data-id="booking-intersections-left-panel-menu"
			ref="intersectionMenu"
			@click="showMenu"
		>
			<div class="booking-booking__intersection-settings_icon">
				<Icon :name="Outline.LAYERS"/>
				<UiCounter
					v-if="neededShowIntersectionCounter"
					counterClass="booking-booking__intersection-settings_counter --air"
					:size="CounterSize.SMALL"
					:value="countIntersectionResources"
				/>
				<div
					v-if="!isFeatureEnabled || !isMultiResourcesFeatureEnabled"
					class="booking-booking__intersection-settings_lock-icon"
				>
					<Icon :name="IconSet.LOCK"/>
				</div>
			</div>
			<template v-if="isWeekMode">
				<div class="booking-booking__intersection-settings_divider"></div>
				<div
					class="booking-booking__intersection-settings_toggle"
					@click.stop="$store.dispatch('interface/setIntersectionExpanded', !intersectionExpanded)"
				>
					<div class="booking-booking__intersection-settings_toggle-title">
						{{ loc('BOOKING_BOOKING_INTERSECTION_BUTTON_LABEL') }}
					</div>
					<Icon v-show="!intersectionExpanded" :name="Outline.CHEVRON_RIGHT_S"/>
					<Icon v-show="intersectionExpanded" :name="Outline.CHEVRON_LEFT_S"/>
				</div>
			</template>
		</div>
		<Teleport defer to="#booking-resource-intersections">
			<div 
				class="booking-booking__intersections"
				:class="{
					'--locked': !isMultiResourcesFeatureEnabled,
					'--disabled': disabled,
				}"
			>
				<div
					class="booking-booking__intersection-container"
					ref="inner"
					@scroll="$store.dispatch('interface/setScroll', $refs.inner[scrollProperty])"
				>
					<Single v-if="isIntersectionForAll" @change="showIntersections"/>
					<template v-else>
						<template v-for="resourceId of resourcesIds" :key="resourceId">
							<Multiple :resourceId="resourceId" @change="showIntersections"/>
						</template>
						<div class="booking-booking__intersection-container_blank"></div>
					</template>
				</div>
				<span v-if="isWeekMode" class="booking-booking__intersection-help" @click="showHelpDesk">?</span>
			</div>
		</Teleport>
	`
	};

	// @vue/component
	const ActionsMenu = {
		name: 'BookingActionsMenu',
		components: {
			ResourceSelector,
			ResourceIntersection
		},
		template: `
		<div class="booking-booking__actions-menu">
			<ResourceSelector/>
			<ResourceIntersection/>
		</div>
	`
	};

	// @vue/component
	const ResourceMenu = {
		name: 'ResourceMenu',
		props: {
			resourceId: {
				type: Number,
				required: true
			}
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				favoritesIds: `${booking_const.Model.Favorites}/get`,
				isEditingBookingMode: `${booking_const.Model.Interface}/isEditingBookingMode`,
				isFeatureEnabled: `${booking_const.Model.Interface}/isFeatureEnabled`,
				isFilterMode: `${booking_const.Model.Filter}/isFilterMode`
			}),
			popupId() {
				return `resource-menu-${this.resourceId || 'new'}`;
			}
		},
		created() {
			this.menuPopup = null;
			this.hint = BX.UI.Hint.createInstance({
				popupParameters: {}
			});
		},
		unmounted() {
			if (this.menuPopup) {
				this.destroy();
			}
		},
		methods: {
			openMenu() {
				if (this.menuPopup?.popupWindow?.isShown()) {
					this.destroy();
					return;
				}
				if (this.isFilterMode) {
					return;
				}
				const menuButton = this.$refs['menu-button'];
				this.menuPopup = main_popup.MenuManager.create(this.popupId, menuButton, this.getMenuItems(), {
					className: 'booking-resource-menu-popup',
					closeByEsc: true,
					autoHide: true,
					offsetTop: -3,
					offsetLeft: menuButton.offsetWidth - 6,
					angle: true,
					cacheable: true,
					events: {
						onDestroy: () => this.unbindScrollEvent()
					}
				});
				this.menuPopup.show();
				this.bindScrollEvent();
			},
			getMenuItems() {
				return [
				// {
				// 	html: `<span>${this.loc('BOOKING_RESOURCE_MENU_ADD_BOOKING')}</span>`,
				// 	onclick: () => this.destroy(),
				// },
				{
					html: `<span>${this.loc('BOOKING_RESOURCE_MENU_EDIT_RESOURCE')}</span>`,
					className: this.isFeatureEnabled ? 'menu-popup-item menu-popup-no-icon' : 'menu-popup-item --lock',
					onclick: async () => {
						if (!this.isFeatureEnabled) {
							booking_lib_limit.limit.show();
							return;
						}
						const wizard = new booking_resourceCreationWizard.ResourceCreationWizard();
						this.editResource(this.resourceId, wizard);
						this.destroy();
					}
				},
				// {
				// 	html: `<span>${this.loc('BOOKING_RESOURCE_MENU_EDIT_NOTIFY')}</span>`,
				// 	onclick: () => this.destroy(),
				// },
				// {
				// 	html: `<span>${this.loc('BOOKING_RESOURCE_MENU_CREATE_COPY')}</span>`,
				// 	onclick: () => this.destroy(),
				// },
				// {
				// 	html: '<span></span>',
				// 	disabled: true,
				// 	className: 'menu-item-divider',
				// },
				{
					html: `<span>${this.loc('BOOKING_RESOURCE_MENU_HIDE')}</span>`,
					onclick: async () => {
						this.destroy();
						await this.hideResource(this.resourceId);
					}
				}, {
					html: `<span class="alert-text">${this.loc('BOOKING_RESOURCE_MENU_DELETE')}</span>`,
					onclick: async () => {
						this.destroy();
						await this.removeResource(this.resourceId);
					}
				}];
			},
			destroy() {
				main_popup.MenuManager.destroy(this.popupId);
				this.unbindScrollEvent();
			},
			bindScrollEvent() {
				main_core.Event.bind(document, 'scroll', this.adjustPosition, {
					capture: true
				});
			},
			unbindScrollEvent() {
				main_core.Event.unbind(document, 'scroll', this.adjustPosition, {
					capture: true
				});
			},
			adjustPosition() {
				this.menuPopup?.popupWindow?.adjustPosition();
			},
			async editResource(resourceId, wizard) {
				wizard.open(resourceId);
			},
			async removeResource(resourceId) {
				await new booking_lib_removeResource.RemoveResource(resourceId).run();
			},
			async hideResource(resourceId) {
				const ids = [...this.favoritesIds];
				const index = this.favoritesIds.indexOf(resourceId);
				if (index === -1) {
					return;
				}
				ids.splice(index, 1);
				await booking_lib_resources.hideResources(ids);
			}
		},
		template: `
		<button ref="menu-button" class="ui-icon-set --more" @click="openMenu"></button>
	`
	};

	// @vue/component
	const Resource = {
		components: {
			ResourceMenu,
			ResourceWorkload,
			UiCounter: booking_component_counter.Counter
		},
		props: {
			resourceId: {
				type: Number,
				required: true
			},
			withScale: {
				type: Boolean,
				default: true
			}
		},
		setup() {
			return {
				CounterSize: booking_component_counter.CounterSize
			};
		},
		data() {
			return {
				visible: true
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				resourcesIds: `${booking_const.Model.Interface}/resourcesIds`,
				zoom: `${booking_const.Model.Interface}/zoom`,
				scroll: `${booking_const.Model.Interface}/scroll`,
				selectedDateTs: `${booking_const.Model.Interface}/selectedDateTs`,
				selectedFirstDayPeriodTs: `${booking_const.Model.Interface}/selectedFirstDayPeriodTs`,
				gridMode: `${booking_const.Model.Interface}/gridMode`,
				isWeekMode: `${booking_const.Model.Interface}/isWeekMode`,
				intersections: `${booking_const.Model.Interface}/intersections`,
				intersectionExpanded: `${booking_const.Model.Interface}/intersectionExpanded`,
				hasIntersectionByResourceId: `${booking_const.Model.Interface}/hasIntersectionByResourceId`
			}),
			resource() {
				return this.$store.getters[`${booking_const.Model.Resources}/getById`](this.resourceId);
			},
			resourceType() {
				return this.$store.getters[`${booking_const.Model.ResourceTypes}/getById`](this.resource.typeId);
			},
			neededShowIntersectionCounter() {
				return this.isWeekMode && this.hasIntersectionByResourceId(this.resourceId);
			},
			intersectionCountLabel() {
				const count = (this.intersections[this.resourceId] ?? []).length;
				return `+${count}`;
			},
			profit() {
				const currencyId = booking_lib_currencyFormat.currencyFormat.getBaseCurrencyId();
				const services = this.bookings.filter(booking => booking.skus).flatMap(booking => booking.skus).filter(sku => sku.currencyId === currencyId);
				if (services.length === 0) {
					return '';
				}
				const profit = services.reduce((sum, sku) => sum + sku.price, 0);
				return booking_lib_currencyFormat.currencyFormat.format(currencyId, profit);
			},
			bookings() {
				if (this.isWeekMode) {
					return this.$store.getters[`${booking_const.Model.Bookings}/getByIntervalAndResources`](this.selectedFirstDayPeriodTs, this.selectedFirstDayPeriodTs + booking_lib_duration.Duration.getUnitDurations().w, [this.resourceId]);
				}
				return this.$store.getters[`${booking_const.Model.Bookings}/getByDateAndResources`](this.selectedDateTs, [this.resourceId]);
			},
			labelHTML() {
				const label = new ui_label.Label({
					size: ui_label.LabelSize.SM,
					text: this.loc('BOOKING_BOOKING_RESOURCE_DELETED'),
					fill: true
				});
				return label.render().outerHTML;
			},
			isFirstResource() {
				return this.resourceId === this.resourcesIds[0];
			}
		},
		watch: {
			scroll() {
				this.updateVisibility();
			},
			zoom() {
				this.updateVisibility();
			},
			resourcesIds() {
				this.updateVisibilityDuringTransition();
			},
			gridMode() {
				this.updateVisibility();
			}
		},
		mounted() {
			this.updateVisibility();
			this.updateVisibilityDuringTransition();
			if (this.isFirstResource) {
				main_core.Event.EventEmitter.subscribe(booking_const.EventName.AiCallBannerClosed, this.tryShowAiCallAha);
			}
		},
		beforeUnmount() {
			if (this.isFirstResource) {
				main_core.Event.EventEmitter.unsubscribe(booking_const.EventName.AiCallBannerClosed, this.tryShowAiCallAha);
			}
		},
		methods: {
			updateVisibilityDuringTransition() {
				this.animation?.stop();
				this.animation = new BX.easing({
					duration: 200,
					start: {},
					finish: {},
					step: this.updateVisibility
				});
				this.animation.animate();
			},
			updateVisibility() {
				if (!this.$refs.container) {
					return;
				}
				const rect = this.$refs.container.getBoundingClientRect();
				if (this.isWeekMode) {
					this.visible = rect.bottom > 0 && rect.top < window.innerHeight;
				} else {
					this.visible = rect.right > 0 && rect.left < window.innerWidth;
				}
			},
			async tryShowAiCallAha() {
				const isAiCallAhaShown = this.$store.getters[`${booking_const.Model.Interface}/isAiCallAhaShown`];
				if (isAiCallAhaShown || !this.$refs.meta) {
					return;
				}
				void this.$store.dispatch(`${booking_const.Model.Interface}/setIsAiCallAhaShown`, true);
				await booking_lib_ahaMoments.ahaMoments.show({
					id: 'booking-ai-call-notification',
					text: this.loc('BOOKING_AHA_AI_CALL_NOTIFICATION_TEXT'),
					target: this.$refs.meta,
					isPulsarTransparent: true
				});
			}
		},
		template: `
		<div
			class="booking-booking-header-resource"
			data-element="booking-resource"
			:data-id="resourceId"
			ref="container"
		>
			<template v-if="visible">
				<ResourceWorkload
					v-if="!resource.isDeleted"
					:resourceId="resourceId"
					:scale="withScale ? zoom : undefined"
					:isGrid="true"
				/>
				<div class="booking-booking-header-resource-title">
					<div class="booking-booking-header-resource-name" :title="resource.name">
						{{ resource.name }}
					</div>
					<div class="booking-booking-header-resource-type" :title="resourceType.name">
						{{ resourceType.name }}
					</div>
				</div>
				<div
					v-if="resource.isDeleted"
					v-html="labelHTML"
				></div>
				<div v-else class="booking-booking-header-resource-meta">
					<div
						class="booking-booking-header-resource-profit"
						v-html="profit"
					></div>
					<div class="booking-booking-header-resource-meta-row" ref="meta">
						<div class="booking-booking-header-resource-actions">
							<ResourceMenu :resourceId="resourceId"/>
						</div>
						<UiCounter
							v-if="neededShowIntersectionCounter"
							counterClass="booking-booking-header-resource-intersection-counter --air"
							:size="CounterSize.MEDIUM"
							:value="intersectionCountLabel"
							@click.stop="$store.dispatch('interface/setIntersectionExpanded', !intersectionExpanded)"
						/>
					</div>
				</div>
			</template>
		</div>
	`
	};

	// @vue/component
	const AddResourceButton = {
		name: 'AddResourceButton',
		components: {
			Icon: ui_iconSet_api_vue.BIcon
		},
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline,
				IconSet: ui_iconSet_api_vue.Set
			};
		},
		data() {
			return {
				hovered: false
			};
		},
		computed: ui_vue3_vuex.mapGetters({
			isLoaded: `${booking_const.Model.Interface}/isLoaded`,
			isFeatureEnabled: `${booking_const.Model.Interface}/isFeatureEnabled`
		}),
		watch: {
			isLoaded() {
				if (booking_lib_ahaMoments.ahaMoments.shouldShow(booking_const.AhaMoment.AddResource)) {
					void this.showAhaMoment();
				}
			}
		},
		methods: {
			async addResource() {
				if (!this.isFeatureEnabled) {
					await booking_lib_limit.limit.show();
					return;
				}
				new booking_resourceCreationWizard.ResourceCreationWizard().open();
				booking_lib_analytics.RcwAnalytics.sendClickAddResource();
			},
			async showAhaMoment() {
				await booking_lib_ahaMoments.ahaMoments.show({
					id: 'booking-add-resource',
					title: this.loc('BOOKING_AHA_ADD_RESOURCES_TITLE'),
					text: this.loc('BOOKING_AHA_ADD_RESOURCES_TEXT_MSGVER_1'),
					article: {
						...booking_const.HelpDesk.AhaAddResource,
						title: this.loc('BOOKING_AHA_ARTICLE_LINK_TITLE')
					},
					target: this.$refs.button,
					isPulsarTransparent: true
				});
				booking_lib_ahaMoments.ahaMoments.setShown(booking_const.AhaMoment.AddResource);
				if (booking_lib_sidePanelInstance.SidePanelInstance.openSliders.every(({
					url
				}) => url !== booking_resourceCreationWizard.ResourceCreationWizard.makeName())) {
					void this.addResource();
				}
			}
		},
		template: `
		<div class="booking-booking_add-resource-container">
			<div
				class="booking-booking-header-add-resource-icon-container"
				:class="{ '--hover': hovered }"
				@click="addResource"
				@mouseenter="hovered = true"
				@mouseleave="hovered = false"
			>
				<div
					class="booking-booking-header-add-resource-icon"
					:class="{'--lock': !isFeatureEnabled}"
				>
					<Icon v-if="isFeatureEnabled" :name="Outline.PLUS_M"/>
					<Icon v-else :name="IconSet.LOCK" :size="16"/>
				</div>
			</div>
			<div
				class="booking-booking-header-add-resource"
				:class="{ '--hover': hovered }"
				ref="button"
				data-testid="booking-add-resource-button"
				@click="addResource"
				@mouseenter="hovered = true"
				@mouseleave="hovered = false"
			>
				<div class="booking-booking-header-add-resource-text">
					{{ loc('BOOKING_BOOKING_ADD_RESOURCE') }}
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const ResourcePanel = {
		components: {
			Resource,
			AddResourceButton
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				scroll: `${booking_const.Model.Interface}/scroll`,
				resourcesIds: `${booking_const.Model.Interface}/resourcesIds`,
				isEditingBookingMode: `${booking_const.Model.Interface}/isEditingBookingMode`,
				gridMode: `${booking_const.Model.Interface}/gridMode`,
				isWeekMode: `${booking_const.Model.Interface}/isWeekMode`
			}),
			scrollProperty() {
				return this.isWeekMode ? booking_const.ScrollDirection.Vertical : booking_const.ScrollDirection.Horizontal;
			},
			inactiveScrollProperty() {
				return this.isWeekMode ? booking_const.ScrollDirection.Horizontal : booking_const.ScrollDirection.Vertical;
			}
		},
		watch: {
			scroll(value) {
				this.$refs.container[this.inactiveScrollProperty] = 0;
				this.$refs.container[this.scrollProperty] = value;
			}
		},
		methods: {
			handleScroll() {
				const scrollValue = this.$refs.container[this.scrollProperty];
				this.$store.dispatch('interface/setScroll', scrollValue);
			}
		},
		template: `
		<div 
			class="booking-booking__resource-panel"
			ref="container"
			@scroll="handleScroll"
		>
			<div class="booking-booking__resource-panel_resources">
				<TransitionGroup name="booking-transition-resource">
					<template v-for="resourceId of resourcesIds" :key="resourceId">
						<Resource :resourceId="resourceId" :withScale="!isWeekMode"/>
					</template>
				</TransitionGroup>
			</div>
			<AddResourceButton v-if="!isEditingBookingMode"/>
		</div>
	`
	};

	class WeekInitialZoom {
		calculate(measurements) {
			const {
				containerWidth,
				leftPanelWidth,
				sidebarZoneWidth,
				weekCellWidth
			} = measurements;
			const weekDaysWidth = weekCellWidth * booking_const.Grid.Duration.Week;
			if (containerWidth <= 0 || weekDaysWidth <= 0) {
				return MinAvailableZoom;
			}
			const availableWidth = containerWidth - leftPanelWidth - sidebarZoneWidth;
			return Math.max(MinAvailableZoom, availableWidth / weekDaysWidth);
		}
		get(container) {
			if (!main_core.Type.isDomNode(container)) {
				return null;
			}
			const measurements = {
				containerWidth: container.offsetWidth,
				leftPanelWidth: booking_lib_grid.gridTokens.get(booking_lib_grid.GridTokenKey.LeftPanelWidthWeek),
				sidebarZoneWidth: booking_lib_grid.gridTokens.get(booking_lib_grid.GridTokenKey.SidebarZoneWidth),
				weekCellWidth: booking_lib_grid.gridTokens.get(booking_lib_grid.GridTokenKey.WeekCellWidth)
			};
			if (!this.#hasRequiredMeasurements(measurements)) {
				return null;
			}
			return this.calculate(measurements);
		}
		#hasRequiredMeasurements(measurements) {
			return measurements.containerWidth > 0 && measurements.leftPanelWidth > 0 && measurements.sidebarZoneWidth > 0 && measurements.weekCellWidth > 0;
		}
	}

	const timeFormat = main_date.DateTimeFormat.getFormat('SHORT_TIME_FORMAT');

	// @vue/component
	const BaseComponent = {
		name: 'BaseComponent',
		components: {
			GridDay,
			GridWeek,
			ActionsMenu,
			ResourcePanel,
			Sidebar
		},
		data() {
			return {
				isGridTokensInitialized: false,
				isInitialZoomMeasuring: false
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				zoom: 'interface/zoom',
				fromHour: 'interface/fromHour',
				toHour: 'interface/toHour',
				gridMode: 'interface/gridMode',
				isWeekMode: `${booking_const.Model.Interface}/isWeekMode`,
				intersectionExpanded: `${booking_const.Model.Interface}/intersectionExpanded`
			}),
			isAmPmMode() {
				if (main_date.DateTimeFormat.isAmPmMode()) {
					return true;
				}
				const now = main_date.DateTimeFormat.format(timeFormat, Date.now());
				return now.endsWith('am') || now.endsWith('pm');
			},
			currentGridComponent() {
				return this.isWeekMode ? GridWeek : GridDay;
			}
		},
		watch: {
			gridMode() {
				void booking_lib_busySlots.busySlots.loadBusySlots();
				void this.updateInitialZoom();
			}
		},
		async mounted() {
			await booking_lib_grid.gridTokens.init(this.$refs.baseComponent);
			this.isGridTokensInitialized = true;
			void this.updateInitialZoom();
		},
		methods: {
			async updateInitialZoom() {
				if (!this.isWeekMode) {
					this.isInitialZoomMeasuring = false;
					return;
				}
				this.isInitialZoomMeasuring = true;
				try {
					const zoom = new WeekInitialZoom().get(this.$refs.baseComponent);
					if (zoom && zoom !== this.zoom) {
						await this.$store.dispatch('interface/setZoom', zoom);
					}
				} finally {
					this.isInitialZoomMeasuring = false;
				}
			}
		},
		template: `
		<div
			ref="baseComponent"
			class="booking-booking__base-component --ui-context-content-light"
			data-id="booking-booking-base-component"
			id="booking-content"
			:style="{
				'--zoom': zoom,
				'--from-hour': fromHour,
				'--to-hour': toHour,
			}"
			:class="{
				'--zoom-is-less-than-07': zoom < 0.7,
				'--zoom-is-less-than-08': zoom < 0.8,
				'--am-pm-mode': isAmPmMode,
				'--week-mode': isWeekMode,
				'--day-mode': !isWeekMode,
				'--initial-zoom-measuring': isInitialZoomMeasuring,
			}"
		>
			<template v-if="isGridTokensInitialized">
				<ActionsMenu class="booking-booking__base-component_actions"/>
				<ResourcePanel class="booking-booking__base-component_resources"/>
				<div v-show="intersectionExpanded"
					class="booking-booking__base-component_intersections" 
					id="booking-resource-intersections"
				></div>
				<component :is="currentGridComponent"/>
				<Sidebar/>
			</template>
		</div>
	`
	};

	const FilterField = Object.freeze({
		CreatedBy: 'CREATED_BY',
		Contact: 'CONTACT',
		Company: 'COMPANY',
		Resource: 'RESOURCE',
		ResourceLabel: 'RESOURCE_label',
		Confirmed: 'CONFIRMED',
		RequireAttention: 'REQUIRE_ATTENTION'
	});
	const RequireAttention = Object.freeze({
		Delayed: 'D',
		AwaitConfirmation: 'AC'
	});
	const Filter = {
		emits: ['apply', 'clear'],
		props: {
			filterId: {
				type: String,
				required: true
			}
		},
		created() {
			this.filter = BX.Main.filterManager.getById(this.filterId);
			main_core_events.EventEmitter.subscribe('BX.Main.Filter:beforeApply', this.onBeforeApply);
		},
		methods: {
			onBeforeApply(event) {
				const [filterId] = event.getData();
				if (filterId !== this.filterId) {
					return;
				}
				if (this.isFilterEmpty()) {
					this.$emit('clear');
				} else {
					this.$emit('apply');
				}
			},
			setFields(fields) {
				const preparedFields = this.filter.getFilterFieldsValues();
				preparedFields[FilterField.RequireAttention] = fields.REQUIRE_ATTENTION;
				preparedFields[FilterField.Resource] = fields.RESOURCE;
				if (FilterField.ResourceLabel in fields) {
					preparedFields[FilterField.ResourceLabel] = fields.RESOURCE_label;
				}
				this.filter.getApi().setFields(preparedFields);
				this.filter.getApi().apply();
			},
			isFilterEmpty() {
				return Object.keys(this.getFields()).length === 0;
			},
			getFields() {
				const booleanFields = [FilterField.Confirmed, FilterField.Delayed];
				const arrayFields = [FilterField.Company, FilterField.Contact, FilterField.CreatedBy, FilterField.Resource];
				const stringFields = [FilterField.RequireAttention];
				const filterFields = this.filter.getFilterFieldsValues();
				const fields = booleanFields.filter(field => ['Y', 'N'].includes(filterFields[field])).reduce((acc, field) => ({
					...acc,
					[field]: filterFields[field]
				}), {});
				arrayFields.forEach(field => {
					if (filterFields[field]?.length > 0) {
						fields[field] = filterFields[field];
					}
				});
				stringFields.forEach(field => {
					if (filterFields[field]?.length > 0) {
						fields[field] = filterFields[field];
					}
				});
				return fields;
			}
		},
		template: `
		<div></div>
	`
	};

	const CounterItem = Object.freeze({
		AwaitConfirmation: 'await-confirmation',
		Delayed: 'delayed'
	});
	const CountersPanel = {
		emits: ['activeItem'],
		props: {
			target: HTMLElement
		},
		mounted() {
			this.addCounterPanel();
			main_core_events.EventEmitter.subscribe('BX.UI.CounterPanel.Item:activate', this.onActiveItem);
			main_core_events.EventEmitter.subscribe('BX.UI.CounterPanel.Item:deactivate', this.onActiveItem);
		},
		computed: ui_vue3_vuex.mapGetters({
			counters: 'counters/get'
		}),
		methods: {
			setItem(itemId) {
				if (this.getActiveItem() === itemId) {
					return;
				}
				Object.values(CounterItem).forEach(id => this.counterPanel.getItemById(id).deactivate());
				const item = this.counterPanel.getItemById(itemId);
				item?.activate();
			},
			addCounterPanel() {
				this.counterPanel = new ui_counterpanel.CounterPanel({
					target: this.target,
					items: [{
						id: CounterItem.AwaitConfirmation,
						title: this.loc('BOOKING_BOOKING_COUNTER_PANEL_AWAIT_CONFIRMATION'),
						value: this.counters.unConfirmed,
						color: getFieldName(ui_cnt.CounterColor, ui_cnt.CounterColor.THEME)
					}, {
						id: CounterItem.Delayed,
						title: this.loc('BOOKING_BOOKING_COUNTER_PANEL_DELAYED'),
						value: this.counters.delayed
					}]
				});
				this.counterPanel.init();
			},
			onActiveItem() {
				this.$emit('activeItem', this.getActiveItem());
			},
			getActiveItem() {
				return this.counterPanel.getItems().find(({
					isActive
				}) => isActive)?.id ?? null;
			}
		},
		watch: {
			counters(counters) {
				this.counterPanel.getItems().forEach(item => {
					if (item.id === CounterItem.AwaitConfirmation) {
						item.updateColor(getFieldName(ui_cnt.CounterColor, ui_cnt.CounterColor.DANGER));
						item.updateValue(counters.unConfirmed);
					}
					if (item.id === CounterItem.Delayed) {
						item.updateColor(getFieldName(ui_cnt.CounterColor, ui_cnt.CounterColor.DANGER));
						item.updateValue(counters.delayed);
					}
				});
			}
		},
		template: `
		<div v-if="false"></div>
	`
	};
	const getFieldName = (obj, field) => Object.entries(obj).find(([, value]) => value === field)[0];

	const Statistics = {
		props: {
			value: {
				type: Number,
				required: true
			},
			valueFormatted: {
				type: String,
				required: true
			},
			increasedValue: {
				type: Number,
				required: true
			},
			increasedValueFormatted: {
				type: String,
				required: true
			},
			popupId: {
				type: String,
				required: true
			},
			title: {
				type: String,
				required: true
			},
			rows: {
				type: Array,
				required: true
			},
			button: {
				type: Object,
				required: false
			}
		},
		data() {
			return {
				isPopupShown: false
			};
		},
		methods: {
			onMouseEnter() {
				this.clearTimeouts();
				this.showTimeout = setTimeout(() => this.showPopup(), 100);
			},
			onMouseLeave() {
				main_core.Event.unbind(document, 'mouseover', this.updateHoverElement);
				main_core.Event.bind(document, 'mouseover', this.updateHoverElement);
				this.clearTimeouts();
				if (!this.button) {
					this.closePopup();
					return;
				}
				this.closeTimeout = setTimeout(() => {
					this.popupContainer = document.getElementById(this.popupId);
					if (!this.popupContainer?.contains(this.hoverElement) && !this.$refs.container.contains(this.hoverElement)) {
						this.closePopup();
					}
					if (this.popupContainer) {
						main_core.Event.unbind(this.popupContainer, 'mouseleave', this.onMouseLeave);
						main_core.Event.bind(this.popupContainer, 'mouseleave', this.onMouseLeave);
					}
				}, 100);
			},
			updateHoverElement(event) {
				this.hoverElement = event.target;
			},
			showPopup() {
				this.clearTimeouts();
				this.isPopupShown = true;
			},
			closePopup() {
				this.clearTimeouts();
				this.isPopupShown = false;
				main_core.Event.unbind(this.popupContainer, 'mouseleave', this.onMouseLeave);
				main_core.Event.unbind(document, 'mouseover', this.updateHoverElement);
			},
			clearTimeouts() {
				clearTimeout(this.closeTimeout);
				clearTimeout(this.showTimeout);
			},
			close() {
				this.closePopup();
				this.$emit('close');
			}
		},
		watch: {
			value() {
				this.$refs.animation?.replaceWith(this.$refs.animation);
			}
		},
		components: {
			StatisticsPopup: booking_component_statisticsPopup.StatisticsPopup
		},
		template: `
		<div class="booking-toolbar-after-title-info-profit-container" ref="container">
			<div
				v-html="valueFormatted"
				class="booking-toolbar-after-title-info-profit"
				@click="showPopup"
				@mouseenter="onMouseEnter"
				@mouseleave="onMouseLeave"
			></div>
			<div
				v-if="increasedValue > 0"
				v-html="increasedValueFormatted"
				class="booking-toolbar-after-title-profit-increased"
				ref="animation"
			></div>
		</div>
		<StatisticsPopup
			v-if="isPopupShown"
			:popupId="popupId"
			:bindElement="$refs.container"
			:title="title"
			:rows="rows"
			:button="button"
			@close="close"
		/>
	`
	};

	const Clients = {
		data() {
			return {
				increasedValue: 0
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				totalNewClientsToday: `${booking_const.Model.Interface}/totalNewClientsToday`,
				totalClients: `${booking_const.Model.Interface}/totalClients`
			}),
			popupId() {
				return 'booking-booking-after-title-clients-popup';
			},
			title() {
				return this.loc('BOOKING_BOOKING_AFTER_TITLE_CLIENTS_POPUP_TITLE');
			},
			rows() {
				return [{
					title: this.loc('BOOKING_BOOKING_AFTER_TITLE_CLIENTS_POPUP_TOTAL_CLIENTS_TODAY'),
					value: `+${this.totalNewClientsToday}`
				}, {
					title: this.loc('BOOKING_BOOKING_AFTER_TITLE_CLIENTS_POPUP_TOTAL_CLIENTS'),
					value: `<div>${this.totalClients}</div>`
				}];
			},
			button() {
				return {
					title: this.loc('BOOKING_BOOKING_CLIENTS_LIST'),
					click: () => BX.SidePanel.Instance.open('/crm/contact/list/')
				};
			},
			clientsProfitFormatted() {
				return main_core.Loc.getMessagePlural('BOOKING_BOOKING_PLUS_NUM_CLIENTS', this.totalNewClientsToday, {
					'#NUM#': this.totalNewClientsToday
				});
			},
			increasedValueFormatted() {
				return main_core.Loc.getMessagePlural('BOOKING_BOOKING_PLUS_NUM_CLIENTS', this.increasedValue, {
					'#NUM#': this.increasedValue
				});
			}
		},
		watch: {
			totalNewClientsToday(newValue, previousValue) {
				this.increasedValue = newValue - previousValue;
			}
		},
		components: {
			Statistics
		},
		template: `
		<Statistics
			:value="totalNewClientsToday"
			:valueFormatted="clientsProfitFormatted"
			:increasedValue="increasedValue"
			:increasedValueFormatted="increasedValueFormatted"
			:popupId="popupId"
			:title="title"
			:rows="rows"
			:button="button"
		/>
	`
	};

	const Profit = {
		data() {
			return {
				increasedValue: 0
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				moneyStatistics: `${booking_const.Model.Interface}/moneyStatistics`
			}),
			popupId() {
				return 'booking-booking-after-title-profit-popup';
			},
			title() {
				return this.loc('BOOKING_BOOKING_AFTER_TITLE_PROFIT_POPUP_TITLE');
			},
			rows() {
				const otherCurrencies = this.moneyStatistics?.month?.filter(({
					currencyId
				}) => currencyId !== this.baseCurrencyId)?.map(({
					currencyId
				}) => currencyId) ?? [];
				return [this.getTodayRow(this.baseCurrencyId), ...otherCurrencies.map(currencyId => this.getTodayRow(currencyId)), this.getMonthRow(this.baseCurrencyId), ...otherCurrencies.map(currencyId => this.getMonthRow(currencyId))];
			},
			todayProfit() {
				return this.getTodayProfit(this.moneyStatistics);
			},
			todayProfitFormatted() {
				return this.formatTodayProfit(this.todayProfit);
			},
			increasedValueFormatted() {
				return this.formatTodayProfit(this.increasedValue);
			},
			baseCurrencyId() {
				return booking_lib_currencyFormat.currencyFormat.getBaseCurrencyId();
			}
		},
		methods: {
			getTodayRow(currencyId) {
				const title = this.loc('BOOKING_BOOKING_AFTER_TITLE_PROFIT_POPUP_TOTAL_TODAY');
				return {
					title: currencyId === this.baseCurrencyId ? title : '',
					value: `+${this.getTodayProfitFormatted(currencyId)}`
				};
			},
			getMonthRow(currencyId) {
				const title = this.loc('BOOKING_BOOKING_AFTER_TITLE_PROFIT_POPUP_MONTH', {
					'#MONTH#': main_date.DateTimeFormat.format('f')
				});
				return {
					title: currencyId === this.baseCurrencyId ? title : '',
					value: `<div>${this.getMonthProfitFormatted(currencyId)}</div>`
				};
			},
			getTodayProfitFormatted(currency) {
				const statistics = this.moneyStatistics?.today?.find(({
					currencyId
				}) => currencyId === currency);
				const profit = statistics?.opportunity ?? 0;
				return booking_lib_currencyFormat.currencyFormat.format(currency, profit);
			},
			getMonthProfitFormatted(currency) {
				const statistics = this.moneyStatistics?.month?.find(({
					currencyId
				}) => currencyId === currency);
				const profit = statistics?.opportunity ?? 0;
				return booking_lib_currencyFormat.currencyFormat.format(currency, profit);
			},
			getTodayProfit(statistics) {
				const statistic = statistics?.today?.find(({
					currencyId
				}) => currencyId === this.baseCurrencyId);
				return statistic?.opportunity ?? 0;
			},
			formatTodayProfit(profit) {
				return `+ <span>${booking_lib_currencyFormat.currencyFormat.format(this.baseCurrencyId, profit)}</span>`;
			}
		},
		watch: {
			moneyStatistics(newValue, previousValue) {
				this.increasedValue = this.getTodayProfit(newValue) - this.getTodayProfit(previousValue);
			}
		},
		components: {
			Statistics
		},
		template: `
		<Statistics
			:value="todayProfit"
			:valueFormatted="todayProfitFormatted"
			:increasedValue="increasedValue"
			:increasedValueFormatted="increasedValueFormatted"
			:popupId="popupId"
			:title="title"
			:rows="rows"
		/>
	`
	};

	const AfterTitle = {
		computed: {
			dateFormatted() {
				const format = main_date.DateTimeFormat.getFormat('DAY_SHORT_MONTH_FORMAT');
				return main_date.DateTimeFormat.format(format, Date.now() / 1000);
			}
		},
		components: {
			Clients,
			Profit
		},
		template: `
		<div class="booking-toolbar-after-title">
			<div class="booking-toolbar-after-title-date" ref="date">
				{{ dateFormatted }}
			</div>
			<div class="booking-toolbar-after-title-info">
				<Clients/>
				<Profit/>
			</div>
		</div>
	`
	};

	const BookingMultipleButton = {
		name: 'BookingMultipleButton',
		emits: ['book'],
		props: {
			fetching: Boolean
		},
		computed: {
			text() {
				return this.loc('BOOKING_MULTI_BUTTON_LABEL');
			},
			size() {
				return booking_component_button.ButtonSize.SMALL;
			},
			color() {
				return booking_component_button.ButtonColor.SUCCESS;
			}
		},
		components: {
			UiButton: booking_component_button.Button
		},
		template: `
		<UiButton
			:text
			:size
			:color
			:waiting="fetching"
			@click="$emit('book')"
		/>
	`
	};

	// @vue/component

	const MultiBookingItem = {
		name: 'MultiBookingItem',
		components: {
			UiButton: booking_component_button.Button
		},
		emits: ['remove-selected'],
		props: {
			id: {
				type: String,
				required: true
			},
			fromTs: {
				type: Number,
				required: true
			},
			toTs: {
				type: Number,
				required: true
			},
			resourceId: {
				type: Number,
				required: true
			}
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				offset: `${booking_const.Model.Interface}/offset`
			}),
			label() {
				return this.loc('BOOKING_MULTI_ITEM_TITLE', {
					'#DATE#': main_date.DateTimeFormat.format('d M H:i', (this.fromTs + this.offset) / 1000),
					'#DURATION#': new booking_lib_duration.Duration(this.toTs - this.fromTs).format()
				});
			},
			buttonColor() {
				return booking_component_button.ButtonColor.LINK;
			},
			buttonSize() {
				return booking_component_button.ButtonSize.EXTRA_SMALL;
			}
		},
		template: `
		<div class="booking--multi-booking--book">
			<label>
				{{ label }}
			</label>
			<button
				:class="[buttonSize, buttonColor, 'ui-btn ui-icon-set --cross-20']"
				type="button"
				@click="$emit('remove-selected', this.id)">
			</button>
		</div>
	`
	};

	// @vue/component

	const MultiBookingItemsList = {
		name: 'MultiBookingItemsList',
		components: {
			MultiBookingItem
		},
		emits: ['remove-selected'],
		computed: {
			selectedPlacementSlots() {
				return this.$store.getters[`${booking_const.Model.Interface}/selectedPlacementSlots`];
			},
			selectedCellsCount() {
				return Object.keys(this.selectedPlacementSlots).length;
			}
		},
		mounted() {
			this.ears = new ui_ears.Ears({
				container: this.$refs.wrapper,
				smallSize: true,
				className: 'booking--multi-booking--items-ears',
				noScrollbar: true
			}).init();
		},
		watch: {
			selectedCellsCount: {
				handler() {
					setTimeout(() => this.ears.toggleEars(), 0);
				}
			}
		},
		template: `
		<div class="booking--multi-booking--book-list">
			<div ref="wrapper" class="booking--multi-booking--books-wrapper">
				<MultiBookingItem
					v-for="cell in selectedPlacementSlots"
					:key="cell.id"
					:id="cell.id"
					:from-ts="cell.fromTs"
					:to-ts="cell.toTs"
					:resource-id="cell.resourceId"
					@remove-selected="$emit('remove-selected', $event)"/>
			</div>
		</div>
	`
	};

	const AddClientButton = {
		name: 'AddClientButton',
		emits: ['update:model-value'],
		props: {
			modelValue: {
				type: Array,
				required: true
			}
		},
		data() {
			return {
				isPopupShown: false
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				getByClientData: `${booking_const.Model.Clients}/getByClientData`
			}),
			color() {
				return booking_component_button.ButtonColor.LINK;
			},
			size() {
				return booking_component_button.ButtonSize.EXTRA_SMALL;
			},
			label() {
				if (this.modelValue.length === 0) {
					return this.loc('BOOKING_MULTI_CLIENT');
				}
				return this.loc('BOOKING_MULTI_CLIENT_WHIT_NAME', {
					'#NAME#': this.modelValue.find(client => client.name)?.name || ''
				});
			},
			currentClient() {
				if (this.modelValue.length === 0) {
					return null;
				}
				return {
					contact: this.findClientByType(booking_const.CrmEntity.Contact),
					company: this.findClientByType(booking_const.CrmEntity.Company)
				};
			}
		},
		methods: {
			createClients(clients) {
				const clientsData = clients.map(client => this.getByClientData(client));
				this.$emit('update:model-value', clientsData);
			},
			findClientByType(clientTypeCode) {
				return this.modelValue.find(({
					type
				}) => type.code === clientTypeCode);
			}
		},
		components: {
			ClientPopup: booking_component_clientPopup.ClientPopup
		},
		template: `
		<button
			:class="['ui-btn', 'booking--multi-booking--client-button', color, size]"
			type="button"
			ref="button"
			@click="isPopupShown = !isPopupShown"
		>
			<i class="ui-icon-set --customer-card"></i>
			<span>{{ label }}</span>
		</button>
		<ClientPopup
			v-if="isPopupShown"
			:bind-element="$refs.button"
			:currentClient
			@create="createClients"
			@close="isPopupShown = false"/>
	`
	};

	const CancelButton = {
		name: 'CancelButton',
		emits: ['click'],
		setup() {
			return {
				color: booking_component_button.ButtonColor.LINK,
				size: booking_component_button.ButtonSize.EXTRA_SMALL
			};
		},
		template: `
		<button
			:class="['ui-btn', 'booking--multi-booking--cancel-button', color, size]"
			type="button"
			ref="button"
			@click="$emit('click')"
		>
			<i
				class="ui-icon-set --cross-25"
				style="--ui-icon-set__icon-base-color: rgba(var(--ui-color-palette-white-base-rgb), 0.3);--ui-icon-set__icon-size: var(--ui-size-2xl)"></i>
		</button>
	`
	};

	const MultiBooking = {
		name: 'MultiBooking',
		data() {
			return {
				fetching: false,
				clients: [],
				externalData: []
			};
		},
		async beforeMount() {
			this.clients = [];
			this.externalData = [];
			if (this.embedItems.length === 0) {
				return;
			}
			const embedContact = this.embedItems.find(item => item.entityTypeId === booking_const.CrmEntity.Contact);
			const embedCompany = this.embedItems.find(item => item.entityTypeId === booking_const.CrmEntity.Company);
			const embedDeal = this.embedItems.find(item => item.entityTypeId === booking_const.CrmEntity.Deal);
			if (embedContact) {
				const contact = await booking_provider_service_clientService.clientService.getContactById(Number(embedContact.value));
				if (contact) {
					this.clients.push(contact);
				}
			}
			if (embedCompany) {
				const company = await booking_provider_service_clientService.clientService.getCompanyById(Number(embedCompany.value));
				if (company) {
					this.clients.push(company);
				}
			}
			if (embedDeal) {
				this.externalData.push(embedDeal);
			}
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				selectedPlacementSlots: `${booking_const.Model.Interface}/selectedPlacementSlots`,
				timezone: `${booking_const.Model.Interface}/timezone`,
				embedItems: `${booking_const.Model.Interface}/embedItems`,
				intersections: `${booking_const.Model.Interface}/intersections`
			})
		},
		methods: {
			removeSelected(id) {
				if (Object.hasOwnProperty.call(this.selectedPlacementSlots, id)) {
					this.$store.dispatch(`${booking_const.Model.Interface}/removeSelectedCell`, this.selectedPlacementSlots[id]);
				}
			},
			async book() {
				const bookings = this.getBookings();
				if (bookings.length === 0) {
					return;
				}
				this.fetching = true;
				const bookingList = await booking_provider_service_bookingService.bookingService.addList(bookings);
				booking_lib_analytics.BookingAnalytics.sendAddMultiBookings(bookingList.map(({
					id
				}) => id));
				this.fetching = false;
				this.showNotification(bookingList);
				await this.closeMultiBooking();
			},
			getBookings() {
				return Object.values(this.selectedPlacementSlots).map(cell => ({
					id: `tmp-id-${Date.now()}-${main_core.Text.getRandom(4)}`,
					dateFromTs: cell.fromTs,
					dateToTs: cell.toTs,
					resourcesIds: [...new Set([cell.resourceId, ...(this.intersections[0] ?? []), ...(this.intersections[cell.resourceId] ?? [])])],
					timezoneFrom: this.timezone,
					timezoneTo: this.timezone,
					externalData: this.externalData,
					clients: this.clients
				}));
			},
			showNotification(bookingList) {
				const bookingQuantity = bookingList.length;
				const balloon = BX.UI.Notification.Center.notify({
					id: main_core.Text.getRandom(),
					content: main_core.Loc.getMessagePlural('BOOKING_MULTI_CREATED', bookingQuantity, {
						'#QUANTITY#': bookingQuantity
					}),
					actions: [{
						title: this.loc('BOOKING_MULTI_CREATED_CANCEL'),
						events: {
							click: () => this.reset(bookingList, balloon)
						}
					}]
				});
			},
			async reset(bookingList, balloon) {
				await booking_provider_service_bookingService.bookingService.deleteList(bookingList.map(({
					id
				}) => id));
				balloon?.close();
			},
			async closeMultiBooking() {
				await this.$store.dispatch(`${booking_const.Model.Interface}/clearSelectedCells`);
			}
		},
		components: {
			BookingMultipleButton,
			MultiBookingItemsList,
			AddClientButton,
			CancelButton
		},
		template: `
		<Teleport to="#uiToolbarContainer" defer>
			<div class="booking--multi-booking--bar">
				<BookingMultipleButton :fetching @book="book"/>
				<MultiBookingItemsList @remove-selected="removeSelected"/>
				<div class="booking--multi-booking--divider-vertical"></div>
				<AddClientButton v-model="clients"/>
				<div class="booking--multi-booking--space"></div>
				<div class="booking--multi-booking--close">
					<div class="booking--multi-booking--divider-vertical"></div>
					<CancelButton @click="closeMultiBooking"/>
				</div>
			</div>
		</Teleport>
	`
	};

	const Banner = {
		data() {
			return {
				isBannerShown: false,
				bannerComponent: null
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				canTurnOnDemo: `${booking_const.Model.Interface}/canTurnOnDemo`
			})
		},
		mounted() {
			if (booking_lib_ahaMoments.ahaMoments.shouldShow(booking_const.AhaMoment.Banner)) {
				void this.showBanner();
			}
		},
		methods: {
			async showBanner() {
				ui_bannerDispatcher.BannerDispatcher.high.toQueue(async onDone => {
					const {
						PromoBanner
					} = await main_core.Runtime.loadExtension('booking.component.promo-banner');
					this.bannerComponent = ui_vue3.shallowRef(PromoBanner);
					this.isBannerShown = true;
					this.setShown();
					this.bannerClosed = new booking_lib_resolvable.Resolvable();
					await this.bannerClosed;
					onDone();
				});
			},
			closeBanner() {
				this.isBannerShown = false;
				this.bannerClosed.resolve();
			},
			setShown() {
				booking_lib_ahaMoments.ahaMoments.setShown(booking_const.AhaMoment.Banner);
				booking_lib_analytics.BannerAnalytics.sendShowPopup();
			},
			buttonClick() {
				booking_lib_analytics.BannerAnalytics.sendClickEnable();
			}
		},
		template: `
		<component
			v-if="isBannerShown"
			:is="bannerComponent"
			:canTurnOnDemo="canTurnOnDemo"
			@buttonClick="buttonClick"
			@close="closeBanner"
		/>
	`
	};

	const BannerAiCall = {
		data() {
			return {
				bannerComponent: null,
				isBannerActivated: false
			};
		},
		created() {
			this.autoCloseTimerId = null;
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				aiCallBannerMode: `${booking_const.Model.Interface}/aiCallBannerMode`
			})
		},
		watch: {
			aiCallBannerMode(value) {
				if (value === booking_const.AiCallBannerMode.Invitation && !this.bannerComponent) {
					void this.showBanner();
				}
			}
		},
		mounted() {
			if (this.aiCallBannerMode === booking_const.AiCallBannerMode.Invitation) {
				void this.showBanner();
			}
		},
		methods: {
			async showBanner() {
				ui_bannerDispatcher.BannerDispatcher.high.toQueue(async onDone => {
					const {
						BannerAiCall
					} = await main_core.Runtime.loadExtension('booking.component.banner-ai-call');
					this.bannerComponent = ui_vue3.shallowRef(BannerAiCall);
					void booking_provider_service_mainPageService.mainPageService.registerAiCallBannerShown();
					booking_lib_analytics.AiCallBannerAnalytics.sendBannerView();
					this.bannerClosed = new booking_lib_resolvable.Resolvable();
					await this.bannerClosed;
					onDone();
				});
			},
			closeBanner() {
				if (this.autoCloseTimerId) {
					clearTimeout(this.autoCloseTimerId);
					this.autoCloseTimerId = null;
				}
				if (!this.bannerComponent) {
					return;
				}
				this.bannerComponent = null;
				this.bannerClosed?.resolve();
				main_core.Event.EventEmitter.emit(booking_const.EventName.AiCallBannerClosed);
			},
			async onEnable() {
				const result = await booking_provider_service_mainPageService.mainPageService.switchAllToAiCall();
				if (result === false) {
					this.notifyEnableError();
					this.closeBanner();
					return;
				}
				booking_lib_analytics.AiCallBannerAnalytics.sendBannerClickStartFlow();
				this.isBannerActivated = true;
				this.autoCloseTimerId = setTimeout(() => this.closeBanner(), 2000);
			},
			onSkip() {
				booking_lib_analytics.AiCallBannerAnalytics.sendBannerCloseSkip();
				this.closeBanner();
			},
			onClose() {
				if (!this.isBannerActivated) {
					booking_lib_analytics.AiCallBannerAnalytics.sendBannerCloseCross();
				}
				this.closeBanner();
			},
			notifyEnableError() {
				ui_notificationManager.Notifier.notify({
					id: 'booking-banner-ai-call-enable-error',
					text: main_core.Loc.getMessage('BOOKING_COMPONENT_BANNER_AI_CALL_ENABLE_ERROR')
				});
			}
		},
		template: `
		<component
			v-if="bannerComponent"
			:is="bannerComponent"
			:activated="isBannerActivated"
			@enable="onEnable"
			@skip="onSkip"
			@close="onClose"
		/>
	`
	};

	const Trial = {
		data() {
			return {
				isBannerShown: false,
				bannerComponent: null
			};
		},
		watch: {
			isShownTrialPopup() {
				if (booking_lib_ahaMoments.ahaMoments.shouldShow(booking_const.AhaMoment.TrialBanner)) {
					if (!ui_autoLaunch.AutoLauncher.isEnabled()) {
						ui_autoLaunch.AutoLauncher.enable();
					}
					void this.showBanner();
				}
			}
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				isShownTrialPopup: `${booking_const.Model.Interface}/isShownTrialPopup`
			})
		},
		methods: {
			async showBanner() {
				ui_bannerDispatcher.BannerDispatcher.high.toQueue(async onDone => {
					const {
						TrialBanner
					} = await main_core.Runtime.loadExtension('booking.component.trial-banner');
					this.bannerComponent = ui_vue3.shallowRef(TrialBanner);
					this.isBannerShown = true;
					this.bannerClosed = new booking_lib_resolvable.Resolvable();
					await this.bannerClosed;
					onDone();
				});
			},
			closeBanner() {
				this.isBannerShown = false;
				booking_lib_ahaMoments.ahaMoments.setShown(booking_const.AhaMoment.TrialBanner);
				this.bannerClosed.resolve();
			}
		},
		template: `
		<component v-if="isBannerShown" :is="bannerComponent" @close="closeBanner"/>
	`
	};

	// @vue/component
	const BCounter = {
		name: 'BCounter',
		props: {
			id: {
				type: String,
				required: true
			},
			value: {
				type: Number,
				default: 0
			}
		},
		mounted() {
			this.renderCounter();
		},
		updated() {
			this.renderCounter();
		},
		unmounted() {
			this.counterEl?.destroy();
		},
		methods: {
			renderCounter() {
				const counterContainer = this.$refs.counterContainer;
				if (this.value) {
					this.counterEl = new ui_cnt.Counter({
						size: ui_cnt.Counter.Size.SMALL,
						style: ui_cnt.Counter.Style.FILLED_ALERT,
						useAirDesign: true,
						value: this.value,
						id: `counterBookingPopup${this.id}`
					});
					const counterElRendered = this.counterEl.render();
					main_core.Dom.clean(counterContainer);
					main_core.Dom.append(counterElRendered.cloneNode(true), counterContainer);
				} else {
					main_core.Dom.clean(counterContainer);
				}
			}
		},
		template: `
		<div ref="counterContainer" class="option-counter-container"></div>
	`
	};

	// @vue/component
	const OptionCard = {
		name: 'IntegrationYandexMapOptionCard',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			BCounter
		},
		props: {
			id: {
				type: String,
				required: true
			},
			imgSrc: {
				type: String,
				default: ''
			},
			head: {
				type: String,
				default: ''
			},
			description: {
				type: String,
				default: ''
			},
			link: {
				type: [String, null],
				default: null
			},
			counter: {
				type: [Object, null],
				default: null
			},
			footer: {
				type: [Object, null],
				default: null
			},
			isInline: Boolean,
			isDisabled: Boolean
		},
		emits: ['click'],
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		methods: {
			getControlComponent() {
				return this.link ? 'a' : 'button';
			}
		},
		template: `
		<component
			v-if="isInline"
			:is="getControlComponent()"
			class="booking-option-card"
			:href="isDisabled ? null : link"
			:target="link ? '_blank' : null"
			:disabled="isDisabled || null"
			:data-id="'card-' + id"
			@click="$emit('click', $event)"
		>
			<div class="booking-option-card__bg">
				<div class="booking-option-card__bg-color"></div>
				<div class="booking-option-card__bg-border"></div>
			</div>
			<div class="booking-option-card__content">
				<div class="booking-option-card__body">
					<div class="booking-option-card__body-bg"></div>
					<div class="booking-option-card__body-content">
						<div class="booking-option-card__header">
							<div v-if="imgSrc" class="booking-option-card__img-container">
								<img :src="imgSrc" alt="Option" class="booking-option-card__img"/>
							</div>
							<div class="booking-option-card__header-text">
								<p class="booking-option-card__head">{{ head }}</p>
								<p v-if="description" class="booking-option-card__descr">{{ description }}</p>
							</div>
							<BIcon
								v-if="!isDisabled"
								class="booking-option-card__icon"
								:size="22"
								:name="Outline.CHEVRON_RIGHT_M"
							/>
						</div>
					</div>
				</div>
				<BCounter :id v-bind="counter" class="booking-option-card__counter" />
			</div>
		</component>
		<component
			v-else
			:is="getControlComponent()"
			class="booking-option-card"
			:href="isDisabled ? null : link"
			:target="link ? '_blank' : null"
			:disabled="isDisabled || null"
			:data-id="'card-' + id"
			@click="$emit('click', $event)"
		>
			<div class="booking-option-card__bg">
				<div class="booking-option-card__bg-color"></div>
				<div class="booking-option-card__bg-border"></div>
			</div>
			<div class="booking-option-card__content">
				<div class="booking-option-card__body">
					<div class="booking-option-card__body-bg"></div>
					<div class="booking-option-card__body-content">
						<div class="booking-option-card__header">
							<div v-if="imgSrc" class="booking-option-card__img-container">
								<img :src="imgSrc" alt="Option" class="booking-option-card__img" />
							</div>
							<div class="booking-option-card__header-text">
								<p class="booking-option-card__head">{{ head }}</p>
							</div>
						</div>
						<p v-if="description" class="booking-option-card__descr">{{ description }}</p>
					</div>
				</div>
				<div v-if="footer" class="booking-option-card__footer">
					<div class="booking-option-card__footer-bg"></div>
					<div class="booking-option-card__footer-content">
						<p v-if="footer.action" class="booking-option-card__action">
							<BIcon
								class="booking-option-card__action-icon"
								:size="19"
								:name="Outline.PLUS_M"
							/>
							<span class="booking-option-card__action-text">{{ footer.action }}</span>
						</p>
					</div>
				</div>
				<BCounter :id v-bind="counter" class="booking-option-card__counter"/>
			</div>
		</component>
	`
	};

	var imgLogoYa = "/bitrix/js/booking/application/booking/dist/assets/logo_ya_maps_square_rounded.svg";

	var imgLogoTwoGis = "/bitrix/js/booking/application/booking/dist/assets/logo_two_gis_square_rounded.webp";

	const OPTIONS_MAPS_STATUSES = [{
		id: 1,
		name: booking_const.IntegrationMapItemStatus.NotConnected,
		value: main_core.Loc.getMessage('BOOKING_INTEGRATIONS_POPUP_MAPS_STATUS_NOT_CONNECTED')
	}, {
		id: 2,
		name: booking_const.IntegrationMapItemStatus.InProgress,
		value: main_core.Loc.getMessage('BOOKING_INTEGRATIONS_POPUP_MAPS_STATUS_IN_PROGRESS')
	}, {
		id: 3,
		name: booking_const.IntegrationMapItemStatus.Connected,
		value: main_core.Loc.getMessage('BOOKING_INTEGRATIONS_POPUP_MAPS_STATUS_CONNECTED')
	}];

	// @vue/component
	const MapsBlock = {
		name: 'IntegrationPopupMapsBlock',
		components: {
			OptionCard
		},
		props: {
			integrations: {
				type: Array,
				default: () => []
			}
		},
		emits: ['freeze', 'unfreeze'],
		setup() {
			return {
				imgLogoYa,
				imgLogoTwoGis
			};
		},
		computed: {
			optionMapYa() {
				return {
					id: 'optionMapYa',
					code: booking_const.IntegrationMapItemCode.Yandex,
					imgSrc: this.imgLogoYa,
					head: this.loc('BOOKING_INTEGRATIONS_POPUP_YANDEX_MAP_LABEL_MSGVER_1'),
					counter: {
						id: 'counterMapsYa',
						value: this.counterMapsYa
					},
					click: this.handleClickMapYa
				};
			},
			optionMapTwoGis() {
				return {
					id: 'option2GIS',
					code: booking_const.IntegrationMapItemCode.Gis,
					imgSrc: this.imgLogoTwoGis,
					head: this.loc('BOOKING_INTEGRATIONS_POPUP_2GIS_LABEL')
				};
			},
			optionsMaps() {
				const optionsNew = {
					[booking_const.IntegrationMapItemCode.Yandex]: this.optionMapYa,
					[booking_const.IntegrationMapItemCode.Gis]: this.optionMapTwoGis
				};
				return this.integrations.map(integration => {
					const integrationOption = optionsNew[integration.code];
					const integrationDescription = OPTIONS_MAPS_STATUSES.find(status => status.name === integration.status)?.value || this.loc('BOOKING_INTEGRATIONS_POPUP_LABEL_SOON');
					return {
						...integrationOption,
						description: integrationDescription,
						isDisabled: !integration.status,
						isInline: true
					};
				});
			},
			counterMapsYa() {
				return this.$store.state[booking_const.Model.Counters].counters.newYandexMaps ?? 0;
			}
		},
		mounted() {
			if (booking_lib_ahaMoments.ahaMoments.shouldShow(booking_const.AhaMoment.IntegrationMapsYa)) {
				void this.$nextTick(this.showAhaMomentMapsYa);
			}
		},
		methods: {
			handleClickMapYa() {
				this.openYandexIntegrationWizard();
			},
			openYandexIntegrationWizard() {
				const wizard = new booking_application_yandexIntegrationWizard.YandexIntegrationWizard();
				wizard.open();
			},
			async showAhaMomentMapsYa() {
				this.$emit('freeze');
				const optionYandexMapEl = this.$refs[`option${this.optionMapYa.id}`]?.[0]?.$el || null;
				if (optionYandexMapEl === null) {
					return;
				}
				await booking_lib_ahaMoments.ahaMoments.show({
					id: 'booking-integrations-aha-moment-maps-ya',
					title: '',
					text: this.loc('BOOKING_INTEGRATIONS_POPUP_YANDEX_MAP_AHA'),
					target: optionYandexMapEl,
					top: true,
					isPulsarTransparent: true
				});
				booking_lib_ahaMoments.ahaMoments.setShown(booking_const.AhaMoment.IntegrationMapsYa);
				this.$emit('unfreeze');
			}
		},
		template: `
		<div
			v-if="optionsMaps.length > 0"
			class="booking-integrations__options"
		>
			<div class="booking-integrations__options-header">
				<p class="booking-integrations__options-header-head">
					{{ loc('BOOKING_INTEGRATIONS_POPUP_MAPS_TITLE') }}
				</p>
			</div>
			<ul class="booking-integrations__options-list">
				<li v-for="option in optionsMaps" :key="option" class="booking-integrations__option">
					<OptionCard
						:ref="'option' + option.id"
						:id="option.id"
						v-bind="option"
						@click="option.click"
					/>
				</li>
			</ul>
		</div>
	`
	};

	var imgSrcVisual = "/bitrix/js/booking/application/booking/dist/assets/calendar_geo_message_pads_2.webp";

	var imgSrcGrad = "/bitrix/js/booking/application/booking/dist/assets/gradient_copilot_complex_2.webp";

	var imgIconPopup = "/bitrix/js/booking/application/booking/dist/assets/icon_popup_checked_square_rounded.svg";

	// @vue/component
	const IntegrationsPopup = {
		name: 'IntegrationsPopup',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			Popup: booking_component_popup.Popup,
			OptionCard,
			Loader: booking_component_loader.Loader,
			MapsBlock
		},
		props: {
			bindElement: {
				type: HTMLElement,
				required: true
			}
		},
		emits: ['close'],
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline,
				IntegrationMapItemStatus: booking_const.IntegrationMapItemStatus,
				IntegrationMapItemCode: booking_const.IntegrationMapItemCode,
				LoaderType: booking_component_loader.LoaderType,
				imgSrcVisual,
				imgSrcGrad,
				imgIconPopup
			};
		},
		computed: {
			saleChannels() {
				return this.$store.state[booking_const.Model.SaleChannels];
			},
			formsMenu() {
				return this.saleChannels?.formsMenu;
			},
			formsListLink() {
				return this.formsMenu.formsListLink;
			},
			formsCount() {
				return this.formsMenu?.formsCount || 0;
			},
			presets() {
				return this.formsMenu?.presets || [];
			},
			integrations() {
				return this.saleChannels?.integrations || [];
			},
			allFormsText() {
				if (this.formsCount > 0) {
					return this.loc('BOOKING_INTEGRATIONS_POPUP_FORMS_ACTION_WITH_COUNT', {
						'#COUNT#': this.formsCount
					});
				}
				return this.loc('BOOKING_INTEGRATIONS_POPUP_FORMS_ACTION');
			},
			optionsForms() {
				return this.presets.map(preset => {
					return {
						id: preset.id,
						link: preset.link,
						head: preset.title,
						description: preset.description,
						imgSrc: this.imgIconPopup,
						footer: {
							action: this.loc('BOOKING_INTEGRATIONS_POPUP_FORMS_BUTTON_LABEL')
						}
					};
				});
			},
			config() {
				return {
					className: 'booking-integrations-popup',
					bindElement: this.bindElement,
					offsetTop: 10,
					padding: 0,
					minHeight: 344,
					minWidth: 659,
					maxWidth: 660,
					background: 'var(--ui-color-accent-main-primary-alt)',
					closeByEsc: true,
					bindOptions: {
						forceBindPosition: true,
						position: 'bottom'
					}
				};
			},
			description() {
				const hasYandexMap = this.integrations.some(integration => integration.code === booking_const.IntegrationMapItemCode.Yandex);
				return this.loc(hasYandexMap ? 'BOOKING_INTEGRATIONS_POPUP_DESCRIPTION_WITH_YANDEX_MSGVER_1' : 'BOOKING_INTEGRATIONS_POPUP_DESCRIPTION_MSGVER_1').replaceAll('[NBSP/]', '\u00A0');
			}
		},
		methods: {
			freezePopup() {
				this.$refs.popup.freeze();
			},
			unfreezePopup() {
				this.$refs.popup.unfreeze();
			}
		},
		template: `
		<Popup
			ref="popup"
			id="booking-integrations-popup"
			:config
			@close="$emit('close', $event)"
		>
			<div class="booking-integrations">
				<div class="booking-integrations__bg">
					<img :src="imgSrcGrad" alt="Bg" class="booking-integrations__bg-grad"/>
				</div>
				<div class="booking-integrations__content">
					<div class="booking-integrations__info">
						<div class="booking-integrations__info-text">
							<p class="booking-integrations__info-text-head">
								{{ loc('BOOKING_INTEGRATIONS_POPUP_TITLE') }}
							</p>
							<p class="booking-integrations__info-text-description">
								{{ description }}
							</p>
						</div>
						<div class="booking-integrations__info-visual">
							<img :src="imgSrcVisual" alt="Integrations" class="booking-integrations__info-visual-img"/>
						</div>
					</div>
					<template v-if="optionsForms.length > 0 || integrations.length > 0">
						<div class="booking-integrations__options">
							<div class="booking-integrations__options-header">
								<p class="booking-integrations__options-header-head">
									{{ loc('BOOKING_INTEGRATIONS_POPUP_FORMS_TITLE') }}
								</p>
								<a
									v-if="formsListLink"
									:href="formsListLink"
									target="_blank"
									class="booking-integrations__options-header-action"
									data-id="booking-integrations-all-forms-link"
								>
									<span class="booking-integrations__options-header-action-text">
										{{ allFormsText }}
									</span>
									<BIcon
										class="booking-integrations__options-header-action-icon"
										:size="16"
										:name="Outline.CHEVRON_RIGHT_M"
									/>
								</a>
							</div>
							<ul v-if="optionsForms.length > 0"
								class="booking-integrations__options-list"
							>
								<li v-for="option in optionsForms" :key="option" class="booking-integrations__option">
									<OptionCard
										:id="option.id"
										v-bind="option"
										@click="option.click"
									/>
								</li>
							</ul>
						</div>
						<MapsBlock
							v-if="integrations.length > 0"
							:integrations
							@freeze="freezePopup"
							@unfreeze="unfreezePopup"
						/>
					</template>
					<template v-else>
						<Loader
							class="booking-integrations__loader"
							:options="{ type: LoaderType.DEFAULT }"
						/>
					</template>
				</div>
			</div>
		</Popup>
	`
	};

	// @vue/component
	const IntegrationsButton = {
		name: 'IntegrationButton',
		components: {
			IntegrationsPopup,
			UiButton: booking_component_button.Button
		},
		props: {
			container: {
				type: HTMLElement,
				required: true
			}
		},
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
				isPopupShown: false
			};
		},
		computed: {
			newYandexMapsCounter() {
				return this.$store.state[booking_const.Model.Counters].counters.newYandexMaps;
			},
			counterIntegrations() {
				return {
					id: 'counterIntegrationOpener',
					value: this.newYandexMapsCounter
				};
			},
			label() {
				return this.loc('BOOKING_INTEGRATIONS_BUTTON_LABEL');
			}
		},
		mounted() {
			this.container.replaceWith(this.$refs.integrationsPopupOpener.$el);
		},
		methods: {
			togglePopup() {
				this.isPopupShown = !this.isPopupShown;
			}
		},
		template: `
		<UiButton
			ref="integrationsPopupOpener"
			:text="label"
			:rightCounter="counterIntegrations"
			:size="ButtonSize.SMALL"
			:style="AirButtonStyle.OUTLINE_NO_ACCENT"
			useAirDesign
			:color="ButtonColor.LIGHT_BORDER"
			@click="togglePopup"
		/>
		<IntegrationsPopup
			v-if="isPopupShown"
			:bindElement="$refs.integrationsPopupOpener.$el"
			@close="togglePopup"
		/>
	`
	};

	// @vue/component
	const SwitchViewButton = {
		name: 'SwitchViewButton',
		components: {
			Icon: ui_iconSet_api_vue.BIcon,
			UiButton: ui_vue3_components_button.Button
		},
		props: {
			container: {
				type: HTMLElement,
				required: true
			}
		},
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonColor: ui_vue3_components_button.ButtonColor,
				ButtonSize: ui_vue3_components_button.ButtonSize,
				ButtonState: ui_vue3_components_button.ButtonState,
				Grid: booking_const.Grid,
				IconSet: ui_iconSet_api_vue.Set
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				gridMode: `${booking_const.Model.Interface}/gridMode`,
				isWeekMode: `${booking_const.Model.Interface}/isWeekMode`,
				isLoaded: `${booking_const.Model.Interface}/isLoaded`
			}),
			isMultidayFeatureEnabled() {
				return this.$store.state[booking_const.Model.Interface].enabledFeature.bookingLong;
			}
		},
		watch: {
			async gridMode(newValue, oldValue) {
				if (newValue !== oldValue) {
					await booking_provider_service_optionService.optionService.set(booking_const.Option.GridMode, newValue);
				}
			},
			isLoaded() {
				void this.tryShowAhaMoment();
			}
		},
		mounted() {
			this.container.after(this.$refs.dayWeekButton);
		},
		methods: {
			setGridMode(mode) {
				if (this.gridMode !== mode) {
					void this.$store.dispatch(`${booking_const.Model.Interface}/setGridMode`, mode);
				}
			},
			handleWeekClick() {
				if (!this.isMultidayFeatureEnabled) {
					void booking_lib_limit.limit.show(booking_const.LimitFeatureId.MultidayBooking);
					return;
				}
				this.setGridMode(booking_const.Grid.Mode.Week);
			},
			async tryShowAhaMoment() {
				if (!booking_lib_ahaMoments.ahaMoments.shouldShow(booking_const.AhaMoment.WeekView)) {
					return;
				}
				await booking_lib_ahaMoments.ahaMoments.show({
					id: 'booking-week-view',
					title: this.loc('BOOKING_AHA_WEEK_VIEW_TITLE'),
					text: this.loc('BOOKING_AHA_WEEK_VIEW_TEXT'),
					target: this.$refs.weekButton
				});
				booking_lib_ahaMoments.ahaMoments.setShown(booking_const.AhaMoment.WeekView);
			}
		},
		template: `
		<div class="booking-booking__switch-view-container" ref="dayWeekButton">
			<UiButton
				class="booking-booking__switch-view-button"
				:dataset="{ id: 'booking-booking-switch-view-day-button' }"
				:text="loc('BOOKING_BOOKING_SWITZER_DAY_BUTTON')"
				:size="ButtonSize.SMALL"
				:style="AirButtonStyle.OUTLINE_NO_ACCENT"
				:state="!isWeekMode ? ButtonState.ACTIVE : null"
				removeRightCorners
				@click="setGridMode(Grid.Mode.Day)"
			/>
			<div
				ref="weekButton"
				class="booking-booking__switch-view-button"
				data-id="booking-booking-switch-view-week-button"
				:class="{'--locked': !isMultidayFeatureEnabled}"
				@click="handleWeekClick"
			>
				<UiButton
					:text="loc('BOOKING_BOOKING_SWITZER_WEEK_BUTTON')"
					:size="ButtonSize.SMALL"
					:style="AirButtonStyle.OUTLINE_NO_ACCENT"
					:state="isWeekMode ? ButtonState.ACTIVE : null"
					removeLeftCorners
				/>
				<Icon v-if="!isMultidayFeatureEnabled" :name="IconSet.LOCK"/>
			</div>
		</div>
	`
	};

	// @vue/component
	const SkusSettings = {
		name: 'SkusSettings',
		created() {
			main_core_events.EventEmitter.subscribe(booking_const.EventName.BookingOpenSkusSettings, this.openSkuResourcesEditor);
		},
		methods: {
			async openSkuResourcesEditor() {
				const editor = new booking_application_skuResourcesEditor.SkuResourcesEditor({
					title: this.loc('BOOKING_BOOKING_SKUS_SETTINGS_TITLE'),
					description: this.loc('BOOKING_BOOKING_SKUS_SETTINGS_DESCRIPTION'),
					options: {
						editMode: false,
						canBeEmpty: true,
						catalogSkuEntityOptions: this.getCatalogSkuEntityOptions()
					},
					loadData: () => this.getResources(),
					save: data => this.saveResources(data)
				});
				editor.open();
			},
			async fetchResourceSkuRelations() {
				await booking_provider_service_resourcesService.resourceService.loadResourceSkuRelations();
			},
			async fetchMainResources() {
				await booking_provider_service_resourceDialogService.resourceDialogService.getMainResources();
			},
			getCatalogSkuEntityOptions() {
				return this.$store.state[booking_const.Model.Sku].catalogSkuEntityOptions;
			},
			async getResources() {
				await Promise.all([this.fetchResourceSkuRelations(), this.fetchMainResources()]);
				return this.$store.state[booking_const.Model.Resources].resourcesSkuRelations;
			},
			async saveResources(data) {
				if (main_core.Type.isNil(data) || !main_core.Type.isArray(data.resources)) {
					return;
				}
				try {
					await booking_provider_service_resourcesService.resourceService.updateResourceSkuRelations(data.resources);
					ui_notificationManager.Notifier.notify(this.prepareNotificationOptions(this.loc('BOOKING_BOOKING_SKUS_SETTINGS_UPDATE_SUCCESS_MESSAGE')));
				} catch (error) {
					console.error('save Resources data error', error);
				}
			},
			prepareNotificationOptions(text) {
				return {
					id: main_core.Text.getRandom(),
					text
				};
			}
		},
		template: `

	`
	};

	// @vue/component
	const App = {
		name: 'BookingApp',
		components: {
			BaseComponent,
			AfterTitle,
			BookingFilter: Filter,
			CountersPanel,
			MultiBooking,
			Banner,
			BannerAiCall,
			Trial,
			IntegrationsButton,
			SwitchViewButton,
			SkusSettings,
			EmptyFilterResultsPopup: booking_component_emptyFilterResultsPopup.EmptyFilterResultsPopup,
			WhatsappPopupChangesSendingMessages: booking_component_whatsappPopupChangesSendingMessages.WhatsappPopupChangesSendingMessages
		},
		props: {
			afterTitleContainer: HTMLElement,
			counterPanelContainer: HTMLElement,
			settingsButtonContainer: HTMLElement,
			filterId: {
				type: String,
				required: true
			}
		},
		data() {
			return {
				loadingFilter: false
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				selectedDateTs: `${booking_const.Model.Interface}/selectedDateTs`,
				selectedFirstDayPeriodTs: `${booking_const.Model.Interface}/selectedFirstDayPeriodTs`,
				viewDateTs: `${booking_const.Model.Interface}/viewDateTs`,
				isWeekMode: `${booking_const.Model.Interface}/isWeekMode`,
				isFilterMode: `${booking_const.Model.Filter}/isFilterMode`,
				isDeletingResourceFilterMode: `${booking_const.Model.Filter}/isDeletingResourceFilterMode`,
				deletingResource: `${booking_const.Model.Filter}/deletingResource`,
				filteredBookingsIds: `${booking_const.Model.Filter}/filteredBookingsIds`,
				selectedPlacementSlots: `${booking_const.Model.Interface}/selectedPlacementSlots`,
				resourcesIds: `${booking_const.Model.Favorites}/get`,
				extraResourcesIds: `${booking_const.Model.Interface}/extraResourcesIds`,
				bookings: `${booking_const.Model.Bookings}/get`,
				getBookingsByIds: `${booking_const.Model.Bookings}/getByIds`,
				getFutureBookingsByResourceId: `${booking_const.Model.Bookings}/getFutureByResourceId`,
				intersections: `${booking_const.Model.Interface}/intersections`,
				editingBookingId: `${booking_const.Model.Interface}/editingBookingId`,
				fetchingNextDate: `${booking_const.Model.Filter}/fetchingNextDate`,
				datesCount: `${booking_const.Model.Filter}/datesCount`,
				requestFields: `${booking_const.Model.Filter}/requestFields`,
				shouldShowWhatsAppEmergency: `${booking_const.Model.Interface}/shouldShowWhatsAppEmergency`,
				isReloadRelations: `${booking_const.Model.Sku}/isReloadRelations`
			}),
			hasSelectedCells() {
				return Object.keys(this.selectedPlacementSlots).length > 0;
			},
			editingBooking() {
				return this.$store.getters['bookings/getById'](this.editingBookingId) ?? null;
			},
			filteredBookings() {
				if (this.isWeekMode) {
					return this.$store.getters[`${booking_const.Model.Bookings}/getByIntervalAndIds`](this.selectedFirstDayPeriodTs, this.selectedFirstDayPeriodTs + booking_lib_duration.Duration.getUnitDurations().w, this.filteredBookingsIds);
				}
				return this.$store.getters[`${booking_const.Model.Bookings}/getByDateAndIds`](this.selectedDateTs, this.filteredBookingsIds);
			},
			filteredResourcesIds() {
				return this.filteredBookings.map(booking => booking.resourcesIds[0]).filter((value, index, array) => array.indexOf(value) === index);
			}
		},
		watch: {
			selectedDateTs() {
				if (this.isWeekMode) {
					return;
				}
				if (this.isFilterMode) {
					void this.applyFilter();
				} else if (this.isDeletingResourceFilterMode) {
					void this.applyDeletingResourceFilter(this.deletingResource);
				} else {
					void this.fetchPage();
				}
			},
			selectedFirstDayPeriodTs() {
				if (!this.isWeekMode) {
					return;
				}
				if (this.isFilterMode) {
					void this.applyFilter();
				} else if (this.isDeletingResourceFilterMode) {
					void this.applyDeletingResourceFilter(this.deletingResource);
				} else {
					void this.fetchPage();
				}
			},
			filteredBookingsIds() {
				if (this.isFilterMode) {
					this.showResourcesWithBookings();
				}
			},
			isFilterMode(isFilterMode) {
				if (!isFilterMode) {
					void this.fetchPage();
				}
			},
			isReloadRelations(isReloadRelations) {
				if (isReloadRelations) {
					void this.fetchPage();
					void this.$store.dispatch(`${booking_const.Model.Sku}/setReloadRelations`, false);
				}
			},
			isDeletingResourceFilterMode(isDeletingResourceFilterMode) {
				if (isDeletingResourceFilterMode) {
					booking_lib_filterResultNavigator.deletingResourceFilterResultCountActualizer.subscribe();
				} else {
					booking_lib_filterResultNavigator.deletingResourceFilterResultCountActualizer.unsubscribe();
					void this.clearDeletingResourceFilter();
					void this.fetchPage();
				}
			},
			viewDateTs() {
				void this.updateMarks();
			},
			resourcesIds(resourcesIds) {
				if (this.isDeletingResourceFilterMode) {
					if (resourcesIds.includes(this.deletingResource.id)) {
						this.$store.dispatch(`${booking_const.Model.Interface}/setPinnedResourceIds`, [...resourcesIds]);
					} else {
						void this.clearDeletingResourceFilter();
					}
				}
				void this.updateMarks();
			},
			intersections() {
				void this.updateMarks();
			},
			editingBooking(booking) {
				const additionalResourcesIds = booking?.resourcesIds?.slice(1) ?? [];
				if (additionalResourcesIds.length > 0) {
					void this.$store.dispatch(`${booking_const.Model.Interface}/setIntersections`, {
						0: additionalResourcesIds
					});
				}
			},
			fetchingNextDate(fetching) {
				if (fetching) {
					this.showLoader();
				} else {
					this.hideLoader();
				}
			},
			deletingResource(resource) {
				if (resource !== null) {
					void this.applyDeletingResourceFilter(resource, true);
				}
			}
		},
		created() {
			this.loader = new main_loader.Loader();
		},
		beforeMount() {
			booking_lib_mousePosition.mousePosition.init();
		},
		async mounted() {
			this.showLoader();
			this.addAfterTitle();
			booking_lib_analytics.SectionAnalytics.sendOpenSection();
			await Promise.all([booking_provider_service_dictionaryService.dictionaryService.fetchData(), this.fetchPage()]);
			void this.$store.dispatch(`${booking_const.Model.Interface}/setIsLoaded`, true);
		},
		beforeUnmount() {
			booking_lib_mousePosition.mousePosition.destroy();
		},
		methods: {
			async fetchPage(datePeriod = booking_lib_datePeriod.DatePeriod.createByCurrentGridMode()) {
				this.showLoader();
				await Promise.all([booking_provider_service_mainPageService.mainPageService.fetchData(datePeriod), booking_provider_service_saleChannelsService.saleChannelsService.loadData()]);
				if (this.extraResourcesIds.length > 0) {
					await booking_provider_service_resourceDialogService.resourceDialogService.loadByIds(this.extraResourcesIds, this.selectedDateTs / 1000);
				}
				this.hideLoader();
			},
			onActiveItem(counterItem) {
				if (this.ignoreConterPanel) {
					return;
				}
				const fields = this.getFilterFieldsByCounterItem(counterItem);
				this.$refs.filter.setFields(fields);
			},
			getFilterFields() {
				const fields = this.$refs.filter.getFields();
				if (this.isDeletingResourceFilterMode && 'RESOURCE' in fields && Object.keys(fields).length === 1) {
					return {
						RESOURCE: this.$store.getters[`${booking_const.Model.Interface}/resourcesIds`]
					};
				}
				return this.$refs.filter.getFields();
			},
			async applyFilter({
				fromFilter = false
			} = {}) {
				const fields = this.$refs.filter.getFields();
				this.setCounterItem(this.getCounterItemByFilterFields(fields));
				this.showLoader();
				await this.$store.dispatch(`${booking_const.Model.Filter}/setFilterFields`, this.$refs.filter.getFields());
				await Promise.all([this.$store.dispatch(`${booking_const.Model.Filter}/setFilterMode`, true), this.updateMarks(),
				// eslint-disable-next-line unicorn/no-array-callback-reference
				booking_provider_service_bookingService.bookingService.filter(this.requestFields)]);
				if (fromFilter && (this.filteredBookingsIds.length === 0 || Date.now() > this.selectedDateTs)) {
					await this.tryNavigateToOptimalFilterResult();
				}
				this.hideLoader();
			},
			async applyDeletingResourceFilter(resource, force = false) {
				if (!force && this.isDeletingResourceFilterMode && !this.isDeletionResourceFilterFields(this.$refs.filter.getFields())) {
					await this.$store.dispatch(`${booking_const.Model.Filter}/setFilterMode`, true);
					await this.clearDeletingResourceFilter(true);
					await this.applyFilter({
						fromFilter: true
					});
					return;
				}
				const fields = {
					RESOURCE: [resource.id.toString()],
					RESOURCE_label: [resource.name]
				};
				if (force) {
					this.$refs.filter.setFields(fields);
				}
				const requestFields = this.getFilterFields();
				this.showLoader();
				await Promise.all([this.$store.dispatch(`${booking_const.Model.Filter}/setFilterFields`, fields), this.$store.dispatch(`${booking_const.Model.Filter}/setDeletionResourceFilterFields`, requestFields), this.$store.dispatch(`${booking_const.Model.Interface}/setPinnedResourceIds`, requestFields.RESOURCE)]);
				await Promise.all([this.updateMarks(),
				// eslint-disable-next-line unicorn/no-array-callback-reference
				booking_provider_service_bookingService.bookingService.filter(this.requestFields)]);
				if (force && this.getFutureBookingsByResourceId(resource.id).length === 0) {
					await this.tryNavigateToOptimalFilterResult(true);
				}
				this.hideLoader();
			},
			isDeletionResourceFilterFields(fields) {
				return Object.keys(fields).length === 1 && 'RESOURCE' in fields && fields.RESOURCE.length === 1 && fields.RESOURCE[0] === this.deletingResource.id.toString();
			},
			setCounterItem(item) {
				this.ignoreConterPanel = true;
				setTimeout(() => {
					this.ignoreConterPanel = false;
				}, 0);
				this.$refs.countersPanel.setItem(item);
			},
			getCounterItemByFilterFields(filterFields) {
				return {
					[RequireAttention.AwaitConfirmation]: CounterItem.AwaitConfirmation,
					[RequireAttention.Delayed]: CounterItem.Delayed
				}[filterFields.REQUIRE_ATTENTION];
			},
			async tryNavigateToOptimalFilterResult(inFuture = false) {
				const dateTs = await booking_lib_filterResultNavigator.filterResultNavigator.getOptimalFilterDateTs(inFuture);
				if (!dateTs) {
					return;
				}
				if (this.isWeekMode) {
					await this.$store.dispatch(`${booking_const.Model.Interface}/setSelectedFirstDayPeriodTs`, dateTs);
				}
				await this.$store.dispatch(`${booking_const.Model.Interface}/setSelectedDateTs`, dateTs);
			},
			getFilterFieldsByCounterItem(counterItem) {
				const fields = this.$refs.filter.getFields();
				fields.REQUIRE_ATTENTION = {
					[CounterItem.AwaitConfirmation]: RequireAttention.AwaitConfirmation,
					[CounterItem.Delayed]: RequireAttention.Delayed
				}[counterItem];
				return fields;
			},
			async clearFilter() {
				this.setCounterItem(null);
				booking_provider_service_calendarService.calendarService.clearFilterCache();
				booking_provider_service_bookingService.bookingService.clearFilterCache();
				await Promise.all([this.$store.dispatch(`${booking_const.Model.Interface}/setResourcesIds`, this.resourcesIds), this.$store.dispatch(`${booking_const.Model.Filter}/setFilterMode`, false), this.$store.dispatch(`${booking_const.Model.Filter}/setFilteredBookingsIds`, []), this.$store.dispatch(`${booking_const.Model.Filter}/setFilteredMarks`, []), this.$store.dispatch(`${booking_const.Model.Filter}/clearFilter`, {}), this.$store.dispatch(`${booking_const.Model.Interface}/setPinnedResourceIds`, [])]);
				this.hideLoader();
			},
			async clearDeletingResourceFilter(modeOnly = false) {
				await Promise.all([this.$store.dispatch(`${booking_const.Model.Filter}/setDeletingResourceFilter`, null), this.$store.dispatch(`${booking_const.Model.Interface}/setPinnedResourceIds`, [])]);
				if (this.isFilterMode || modeOnly) {
					return;
				}
				this.$refs.filter.setFields({
					RESOURCE: [],
					RESOURCE_label: []
				});
				await this.clearFilter();
			},
			clearDeletingResourceFilterFields() {
				if (this.isDeletionResourceFilterFields(this.$refs.filter.getFields())) {
					this.$refs.filter.setFields({
						RESOURCE: [],
						RESOURCE_label: []
					});
				}
			},
			addAfterTitle() {
				this.afterTitleContainer.append(this.$refs.afterTitle.$el);
			},
			showResourcesWithBookings() {
				void this.$store.dispatch(`${booking_const.Model.Interface}/setResourcesIds`, this.filteredResourcesIds);
			},
			async updateMarks() {
				if (this.isFilterMode || this.isDeletingResourceFilterMode) {
					await Promise.all([this.updateFilterBookingsCount(), this.updateFilterMarks()]);
				} else {
					await Promise.all([this.updateFreeMarks(), this.updateCounterMarks()]);
				}
			},
			async updateFreeMarks() {
				const resources = this.resourcesIds.map(id => [id, ...(this.intersections[0] ?? []), ...(this.intersections[id] ?? [])]);
				await this.$store.dispatch(`${booking_const.Model.Interface}/setFreeMarks`, []);
				await booking_provider_service_calendarService.calendarService.loadMarks(this.viewDateTs, resources);
			},
			async updateFilterMarks() {
				const fields = this.$refs.filter.getFields();
				await this.$store.dispatch(`${booking_const.Model.Filter}/setFilteredMarks`, []);
				await booking_provider_service_calendarService.calendarService.loadFilterMarks(fields, this.isDeletingResourceFilterMode);
			},
			async updateCounterMarks() {
				await booking_provider_service_calendarService.calendarService.loadCounterMarks(this.viewDateTs);
			},
			async updateFilterBookingsCount() {
				const fields = this.$refs.filter.getFields();
				await booking_provider_service_calendarService.calendarService.loadBookingsDateCount(fields, this.isDeletingResourceFilterMode);
			},
			showLoader() {
				this.loadingFilter = true;
				if (this.$refs.layout?.$el) {
					void this.loader.show(this.$refs.layout.$el);
				}
			},
			hideLoader() {
				this.loadingFilter = false;
				void this.loader.hide();
			}
		},
		template: `
		<div>
			<MultiBooking v-if="hasSelectedCells"/>
			<AfterTitle ref="afterTitle"/>
			<IntegrationsButton :container="settingsButtonContainer"/>
			<SwitchViewButton :container="counterPanelContainer"/>
			<BookingFilter
				:filterId="filterId"
				ref="filter"
				@apply="isDeletingResourceFilterMode ? applyDeletingResourceFilter(deletingResource) : applyFilter({ fromFilter: true })"
				@clear="clearFilter"
			/>
			<EmptyFilterResultsPopup
				v-if="isFilterMode && !isDeletingResourceFilterMode && !loadingFilter && !fetchingNextDate && datesCount.count === 0"
			/>
			<CountersPanel
				:target="counterPanelContainer"
				ref="countersPanel"
				@activeItem="onActiveItem"
			/>
			<BaseComponent ref="layout"/>
			<Banner/>
			<BannerAiCall/>
			<Trial/>
			<WhatsappPopupChangesSendingMessages
				v-if="shouldShowWhatsAppEmergency"
			/>
			<SkusSettings/>
		</div>
	`
	};

	class Booking {
		constructor(params) {
			booking_core.Core.setParams(params);
			void this.#mountApplication();
		}
		async #mountApplication() {
			await booking_core.Core.init();
			const application = ui_vue3.BitrixVue.createApp(App, booking_core.Core.getParams());
			application.mixin(booking_component_mixin_locMixin.locMixin);
			application.use(booking_core.Core.getStore());
			application.mount(booking_core.Core.getParams().container);
		}
	}

	exports.Booking = Booking;

})(this.BX.Booking.Application = this.BX.Booking.Application || {}, BX.Vue3, BX.Booking, BX.Booking.Component.Mixin, BX, BX.Vue3.Vuex, BX.Booking.Const, BX.Booking.Lib, BX.Booking.Lib, BX.Booking.Component, BX.Booking.Provider.Service, BX.Booking.Provider.Service, BX.Booking.Provider.Service, BX.Booking.Provider.Service, BX.Booking.Provider.Service, BX.Booking.Provider.Service, BX.Booking.Lib, BX.Booking.Lib, BX.Booking.Lib, BX.Booking.Component, BX.Main, BX.Booking.Lib, BX.Booking.Lib, BX.Event, BX.UI.DatePicker, BX.UI.IconSet, window, window, BX.Booking.Provider.Service, BX.Booking.Component, BX, BX.Booking.Lib, BX.Main, BX.UI.Dialogs, BX.Booking.Provider.Service, BX.Booking.Component, BX.Booking.Lib, BX.Booking.Component, BX.Booking.Lib, BX.Booking.Lib, BX.UI.IconSet, window, BX.Booking.Lib, BX.Booking.Component, BX.UI, BX.Booking.Lib, BX.Booking.Lib, BX.UI.Vue3.Components, BX.Booking.Component, BX.Booking.Lib, BX.Booking.Lib, BX.Booking.Lib, BX.Booking.Provider.Service, BX.UI.NotificationManager, BX.Booking.Component, BX.Vue3.Directives, BX.Booking.Lib, BX.Booking.Lib, BX.Booking.Component, window, BX.Booking.Component, BX.Booking, BX.Booking.Lib, BX.UI.System.Skeleton.Vue, BX.Vue3.Components, BX.Booking.Lib, BX.UI.Vue3.Components, BX.UI, BX.UI.EntitySelector, BX.Booking.Lib, BX.Booking.Lib, BX.Booking.Component, BX.Booking.Lib, BX.UI, BX.Booking.Lib, BX.UI, BX.Booking, BX.Booking.Lib, BX.Booking.Lib, BX.UI, BX.Booking.Provider.Service, BX.Booking.Component, BX.UI, BX.Booking.Lib, BX.UI.AutoLaunch, BX.Booking.Application, BX.Booking.Application, BX.Booking.Provider.Service);
//# sourceMappingURL=booking.bundle.js.map
