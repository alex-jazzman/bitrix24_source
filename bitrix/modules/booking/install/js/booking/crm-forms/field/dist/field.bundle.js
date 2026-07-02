/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
(function (exports, main_core, booking_component_mixin_locMixin, booking_const, booking_lib_segments, booking_lib_slotRanges, main_date, ui_datePicker, main_loader) {
	'use strict';

	const ALL_RESOURCES_ID = -1;
	const AllResource = {
		id: ALL_RESOURCES_ID,
		name: '',
		typeName: '',
		slotRanges: []
	};
	const DayIndexDict = Object.freeze({
		Sun: 0,
		Mon: 1,
		Tue: 2,
		Wed: 3,
		Thu: 4,
		Fri: 5,
		Sat: 6
	});

	function mapDtoToResource(resourcesDto) {
		return resourcesDto.map(dto => {
			return {
				...dto,
				slotRanges: dto.slotRanges.map(slotRange => {
					return {
						...slotRange,
						weekDays: slotRange.weekDays.map(weekDay => DayIndexDict[weekDay])
					};
				})
			};
		});
	}
	function mapResourcesToFormData(resources) {
		const fd = new FormData();
		resources.forEach((resource, index) => {
			fd.append(`resources[${index}][id]`, resource.id);
			for (const sku of resource.skus) {
				fd.append(`resources[${index}][skus][]`, sku);
			}
		});
		return fd;
	}

	let occupancyInstance = null;
	function createOccupancy(runAction) {
		if (occupancyInstance instanceof Occupancy) {
			return occupancyInstance;
		}
		occupancyInstance = new Occupancy(runAction);
		return occupancyInstance;
	}
	class Occupancy {
		#runAction = () => {};
		#timezone;
		#resources;
		#requestCache = {};
		#requestedResourcesIds = {};
		#occupancy = {};
		constructor(runAction) {
			this.#runAction = runAction;
		}
		setResources(resources) {
			this.#resources = resources;
			return this;
		}
		setTimezone(timezone) {
			this.#timezone = timezone;
			return this;
		}
		async getOccupancy(ids, dateTs) {
			const requestedResourcesIds = this.#requestedResourcesIds[dateTs];
			const unrequestedResourcesIds = ids.filter(id => !requestedResourcesIds?.has(id));
			if (unrequestedResourcesIds.length > 0) {
				const request = this.#requestOccupancy(unrequestedResourcesIds, dateTs);
				this.#requestCache[dateTs] ??= {};
				unrequestedResourcesIds.forEach(resourceId => {
					this.#requestCache[dateTs][resourceId] = request;
				});
			}
			await Promise.all(this.#getPromises(ids, dateTs));
			return this.#calculateOccupancy(ids, dateTs);
		}
		async #requestOccupancy(ids, dateTs) {
			this.#occupancy[dateTs] ??= {};
			this.#requestedResourcesIds[dateTs] ??= new Set();
			ids.forEach(resourceId => {
				this.#occupancy[dateTs][resourceId] ??= [];
				this.#requestedResourcesIds[dateTs].add(resourceId);
			});
			const {
				data: occupancy
			} = await this.#runAction('booking.api_v1.CrmForm.PublicForm.getOccupancy', {
				data: {
					ids,
					dateTs: Math.floor(dateTs / 1000)
				}
			});
			occupancy.forEach(({
				resourcesIds,
				fromTs,
				toTs
			}) => {
				resourcesIds.forEach(resourceId => {
					this.#occupancy[dateTs][resourceId]?.push({
						fromTs,
						toTs,
						resourcesIds
					});
				});
			});
		}
		#getPromises(ids, dateTs) {
			return Object.keys(this.#requestCache[dateTs]).filter(resourceId => ids.includes(Number(resourceId))).map(resourceId => this.#requestCache[dateTs][resourceId]);
		}
		#calculateOccupancy(resourcesIds, dateTs) {
			const segments = new booking_lib_segments.Segments([[dateTs, new Date(dateTs).setDate(new Date(dateTs).getDate() + 1)]]);
			const resource = this.#resources.find(({
				id
			}) => id === resourcesIds[0]);
			const selectedWeekDay = booking_const.DateFormat.WeekDays[new Date(dateTs).getDay()];
			booking_lib_slotRanges.SlotRanges.applyTimezone(resource.slotRanges, dateTs, this.#timezone).filter(slotRange => slotRange.weekDays.includes(selectedWeekDay)).forEach(slotRange => segments.subtract([new Date(dateTs).setMinutes(slotRange.from), new Date(dateTs).setMinutes(slotRange.to)]));
			return resourcesIds.flatMap(resourceId => this.#occupancy[dateTs][resourceId]).map(({
				fromTs,
				toTs,
				resourcesIds: slotResourcesIds
			}) => {
				return {
					fromTs: fromTs * 1000,
					toTs: toTs * 1000,
					resourcesIds: slotResourcesIds
				};
			});
		}
		clearCache() {
			this.#requestCache = {};
			this.#requestedResourcesIds = {};
		}
	}

	function formatPrice(sku) {
		if (typeof sku.price !== 'number' || Number.isNaN(sku.price)) {
			return '';
		}
		const currency = (sku.currencyFormat || '').split(' ')?.[1] || '';
		return `${sku.price} ${currency}`;
	}

	// @vue/component
	const SkuSelector = {
		name: 'SkuSelector',
		props: {
			skus: {
				type: Array,
				required: true
			}
		},
		emits: ['select'],
		methods: {
			formatPrice(sku) {
				return formatPrice(sku);
			}
		},
		template: `
		<div class="booking--crm-forms--resource-selector">
			<div
				v-for="(sku) in skus"
				:key="sku.id"
				class="b24-form-control-list-selector-item booking--crm-forms--resource-selector-resource"
				@click="$emit('select', sku)"
			>
				<div class="booking--crm-forms--skus-selector-sku">
					<div class="booking--crm-forms--skus-selector-sku-name">
						{{ sku.name }}
					</div>
					<div class="booking--crm-forms--skus-selector-sku-price" v-html="formatPrice(sku)"></div>
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const SkuQuantity = {
		name: 'SkuQuantity',
		props: {
			sku: {
				type: Object,
				required: true
			}
		},
		methods: {
			formatPrice() {
				return formatPrice(this.sku);
			}
		},
		template: `
		<div class="booking-crm-forms-field-sku-selector-quantity">
			<div class="b24-form-control-product-price booking-crm-forms-field-sku-selector-quantity-price">
				<div class="b24-form-control-product-price-current" v-html="formatPrice()"></div>
			</div>
		</div>
	`
	};

	// @vue/component
	const SkuSelectBlock = {
		name: 'SkuSelectBlock',
		components: {
			SkuSelector,
			SkuQuantity
		},
		props: {
			skuId: {
				type: Number,
				required: true
			},
			resourcesWithSkus: {
				type: Array,
				required: true
			},
			settingsData: {
				type: Object,
				required: true
			},
			dependencies: {
				type: Object,
				required: true
			},
			fetching: {
				type: Boolean,
				default: false
			},
			errorMessage: {
				type: String,
				default: ''
			},
			hasErrors: {
				type: Boolean,
				default: false
			}
		},
		emits: ['update:skuId'],
		data() {
			return {
				dropdownOpened: false
			};
		},
		computed: {
			skus() {
				const skusMap = new Map();
				this.resourcesWithSkus.forEach(({
					skus
				}) => {
					skus.forEach(sku => {
						if (!skusMap.has(sku.id)) {
							skusMap.set(sku.id, sku);
						}
					});
				});
				return [...skusMap.values()];
			},
			label() {
				return this.settingsData?.skuLabel || '';
			},
			sku() {
				return this.skus?.find(sku => sku.id === this.skuId) || null;
			},
			skuName() {
				return this.sku?.name || '';
			},
			placeholder() {
				return `${this.settingsData?.skuTextHeader || ''} *`;
			},
			hint() {
				return {
					text: this.settingsData?.skuHint || '',
					visible: Boolean(this.settingsData?.isVisibleSkuHint)
				};
			},
			fieldItemDropdownComponent() {
				return this.dependencies.mixinDropdown.components['field-item-dropdown'];
			}
		},
		watch: {
			dropdownOpened(opened) {
				if (opened) {
					main_core.Event.bind(window, 'click', this.handleClickOutOfSelector, true);
				} else {
					main_core.Event.unbind(window, 'click', this.handleClickOutOfSelector, true);
				}
			}
		},
		unmounted() {
			main_core.Event.unbind(window, 'click', this.handleClickOutOfSelector, true);
		},
		methods: {
			handleClickOutOfSelector(e) {
				if (this.$refs.dropdown.$el?.contains(e.target) || this.$refs.tagSelector?.contains(e.target)) {
					return;
				}
				this.closeDropdown();
			},
			toggleDropdown() {
				if (this.dropdownOpened) {
					this.closeDropdown();
					return;
				}
				if (this.fetching) {
					return;
				}
				this.dropdownOpened = true;
			},
			closeDropdown() {
				setTimeout(() => {
					this.dropdownOpened = false;
				}, 0);
			},
			setSku(sku) {
				this.$emit('update:skuId', sku.id);
				this.closeDropdown();
			}
		},
		template: `
		<div
			class="booking-crm-forms-field"
			:class="{
				'--error': false,
			}"
		>
			<div class="b24-form-field-layout-section booking-crm-forms-field-title">
				{{ label }}
			</div>
			<div
				ref="tagSelector"
				class="booking-crm-forms-field-sku-selector b24-form-control-string"
				:class="{
					'--disabled': fetching,
				}"
			>
				<div
					class="b24-form-control-container b24-form-control-icon-after booking-crm-forms-field-sku-selector-container"
					@click="toggleDropdown"
				>
					<input
						name="skuName"
						type="text"
						readonly
						:placeholder="placeholder"
						:value="skuName"
						class="b24-form-control booking--crm-forms--field-tag-selector-input"
						@click.capture.stop.prevent="toggleDropdown"
					/>
					<div class="booking--crm-forms--field-tag-selector-input-icon"></div>
				</div>
			</div>
			<component
				v-if="dropdownOpened"
				ref="dropdown"
				:is="fieldItemDropdownComponent"
				:marginTop="0"
				:visible="dropdownOpened"
				:title="label"
				@close="closeDropdown()"
			>
				<SkuSelector :skus="skus" @select="setSku"/>
			</component>
			<SkuQuantity v-if="sku" :sku="sku"/>
			<div class="b24-form-control-alert-message" style="top: 75px">{{ errorMessage }}</div>
			<div v-if="hint.visible" class="booking--crm-forms--field-hint">
				<div class="booking--crm-forms--field-hint-text">{{ hint.text }}</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const ResourceSelector = {
		name: 'ResourceSelector',
		props: {
			resources: {
				type: Array,
				default: () => []
			}
		},
		emits: ['select'],
		template: `
		<div class="booking--crm-forms--resource-selector">
			<div
				v-for="(resource) in resources"
				:key="resource.id"
				class="b24-form-control-list-selector-item booking--crm-forms--resource-selector-resource"
				@click="$emit('select', resource)"
			>
				<div>
					<div class="booking--crm-forms--time-selector-block-resource-name">
						{{ resource.name }}
					</div>
					<div class="booking--crm-forms--time-selector-block-resource-type-name">
						{{ resource.typeName }}
					</div>
				</div>
			</div>
		</div>
	`
	};

	// eslint-disable-next-line no-unused-vars

	// @vue/component
	const ResourceSelectBlock = {
		name: 'ResourceSelectBlock',
		components: {
			ResourceSelector
		},
		props: {
			resourceId: {
				type: Number,
				required: true
			},
			/**
			 * @type {Resource[]}
			 */
			resources: {
				type: Array,
				required: true
			},
			settingsData: {
				type: Object,
				required: true
			},
			fetching: {
				type: Boolean,
				default: false
			},
			errorMessage: {
				type: String,
				default: ''
			},
			hasErrors: {
				type: Boolean,
				default: false
			},
			dependencies: {
				type: Object,
				required: true
			}
		},
		emits: ['update:resourceId'],
		data() {
			return {
				dropdownOpened: false
			};
		},
		computed: {
			label() {
				return this.settingsData?.label || '';
			},
			placeholder() {
				return `${this.settingsData?.textHeader || ''} *`;
			},
			resource() {
				return this.resources.find(resource => resource.id === this.resourceId);
			},
			resourceName() {
				return this.resource?.name || '';
			},
			hint() {
				return {
					text: this.settingsData?.hint || '',
					visible: Boolean(this.settingsData?.isVisibleHint)
				};
			},
			fieldItemDropdownComponent() {
				return this.dependencies.mixinDropdown.components['field-item-dropdown'];
			}
		},
		watch: {
			dropdownOpened(opened) {
				if (opened) {
					main_core.Event.bind(window, 'click', this.handleClickOutOfSelector, true);
				} else {
					main_core.Event.unbind(window, 'click', this.handleClickOutOfSelector, true);
				}
			}
		},
		unmounted() {
			main_core.Event.unbind(window, 'click', this.handleClickOutOfSelector, true);
		},
		methods: {
			handleClickOutOfSelector(e) {
				if (this.$refs.dropdown.$el?.contains(e.target) || this.$refs.tagSelector?.contains(e.target)) {
					return;
				}
				this.closeDropdown();
			},
			toggleDropdown() {
				if (this.dropdownOpened) {
					this.closeDropdown();
					return;
				}
				if (this.fetching) {
					return;
				}
				this.dropdownOpened = true;
			},
			closeDropdown() {
				setTimeout(() => {
					this.dropdownOpened = false;
				}, 0);
			},
			setResource(resource) {
				this.$emit('update:resourceId', resource.id);
				if (this.dropdownOpened) {
					this.closeDropdown();
				}
			}
		},
		template: `
		<div
			class="booking-crm-forms-field"
			:class="{
				'--error': hasErrors,
			}"
		>
			<div class="b24-form-field-layout-section booking-crm-forms-field-title">
				{{ label }}
			</div>
			<div
				ref="tagSelector"
				class="booking-crm-forms-field-tag-selector b24-form-control-string"
				:class="{
					'--disabled': fetching,
				}"
			>
				<div
					class="b24-form-control-container b24-form-control-icon-after"
					@click="toggleDropdown"
				>
					<input
						name="resourceName"
						type="text"
						readonly
						:placeholder="placeholder"
						:value="resourceName"
						class="b24-form-control booking--crm-forms--field-tag-selector-input"
						@click.capture.stop.prevent="toggleDropdown"
					/>
					<div class="booking--crm-forms--field-tag-selector-input-icon"></div>
				</div>
			</div>
			<div class="b24-form-control-alert-message" style="top: 75px">{{ errorMessage }}</div>
			<component
				v-if="dropdownOpened"
				ref="dropdown"
				:is="fieldItemDropdownComponent"
				:marginTop="0"
				:visible="dropdownOpened"
				:title="label"
				@close="closeDropdown()"
			>
				<ResourceSelector :resources="resources" @select="setResource"/>
			</component>
			<div v-if="hint.visible" class="booking--crm-forms--field-hint">
				<div class="booking--crm-forms--field-hint-text">{{ hint.text }}</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const CalendarBlock = {
		name: 'CalendarBlock',
		mixins: [booking_component_mixin_locMixin.locMixin],
		props: {
			date: {
				type: Date,
				default: null
			},
			resource: {
				type: Object,
				required: true
			},
			titleOnly: {
				type: Boolean,
				default: false
			},
			hasError: {
				type: Boolean,
				default: false
			},
			errorMessage: {
				type: String,
				default: ''
			}
		},
		emits: ['updateDate'],
		data() {
			return {
				viewDate: null,
				disabledPrevMonth: true
			};
		},
		computed: {
			formattedViewDate() {
				return main_date.DateTimeFormat.format('f Y', this.viewDate);
			},
			title() {
				if (this.date !== null && this.titleOnly) {
					return this.loc('BOOKING_CRM_FORMS_FIELD_TIME_TITLE', {
						'#DATE#': main_date.DateTimeFormat.format(this.loc('DAY_MONTH_FORMAT'), this.date)
					});
				}
				return this.loc('BOOKING_CRM_FORMS_FIELD_DATE_TIME_TITLE');
			}
		},
		watch: {
			date(nextDate, prevDate) {
				if (!(nextDate instanceof Date) || !(prevDate instanceof Date) || nextDate === prevDate || !this.datePicker) {
					return;
				}
				this.datePicker.selectDate(nextDate);
			}
		},
		created() {
			this.viewDate = this.date;
			const selectedDates = this.date instanceof Date ? [this.date.getTime()] : [];
			this.datePicker = new ui_datePicker.DatePicker({
				selectedDates,
				startDate: new Date(),
				inline: true,
				hideHeader: true
			});
			this.datePicker.subscribe(ui_datePicker.DatePickerEvent.SELECT, event => {
				const date = event.getData().date;
				const selectedDate = this.toDateFromUtc(date);
				this.setViewDate();
				if (selectedDate !== this.date) {
					this.$emit('updateDate', selectedDate);
				}
			});
		},
		mounted() {
			this.datePicker.setTargetNode(this.$refs.datePicker);
			this.datePicker.show();
		},
		beforeUnmount() {
			this.datePicker.destroy();
		},
		methods: {
			setPreviousMonth() {
				const viewDate = this.datePicker.getViewDate();
				if (this.checkPastDate()) {
					this.updateDisabledPrevMonth();
					return;
				}
				this.datePicker.setViewDate(ui_datePicker.getNextDate(viewDate, 'month', -1));
				this.setViewDate();
			},
			setNextMonth() {
				const viewDate = this.datePicker.getViewDate();
				this.updateDisabledPrevMonth();
				this.datePicker.setViewDate(ui_datePicker.getNextDate(viewDate, 'month'));
				this.setViewDate();
			},
			setViewDate() {
				this.viewDate = this.toDateFromUtc(this.datePicker.getViewDate());
				this.updateDisabledPrevMonth();
			},
			toDateFromUtc(date) {
				return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
			},
			updateDisabledPrevMonth() {
				this.disabledPrevMonth = this.checkPastDate();
			},
			checkPastDate() {
				const viewDate = this.datePicker.getViewDate();
				const today = new Date();
				return viewDate.getMonth() <= today.getMonth() && viewDate.getYear() <= today.getYear();
			}
		},
		template: `
		<div
			class="booking-crm-forms-field booking--crm-forms--calendar-block"
			:class="{
				'--error': hasError,
			}"
		>
			<div class="b24-form-field-layout-section booking-crm-forms-field-title">{{ title }}</div>
			<div
				v-if="hasError"
				class="b24-form-control-alert-message"
				style="top: 30px"
			>
				{{ errorMessage }}
			</div>
			<div v-show="!titleOnly" class="booking--crm-forms--calendar-block-content">
				<div class="booking--crm-forms--calendar-block-datepicker-header">
					<div class="booking--crm-forms--calendar-block-datepicker-header-title">
						{{ formattedViewDate }}
					</div>
					<div
						class="booking--crm-forms--calendar-block-datepicker-header-button --left"
						:class="{ '--disabled': disabledPrevMonth }"
						@click="setPreviousMonth"
					>
						<div class="booking--crm-forms--calendar-block-datepicker-icon --chevron-left"></div>
					</div>
					<div
						class="booking--crm-forms--calendar-block-datepicker-header-button --right"
						@click="setNextMonth"
					>
						<div class="booking--crm-forms--calendar-block-datepicker-icon --chevron-right"></div>
					</div>
				</div>
				<div ref="datePicker" class="booking--crm-forms--calendar-block-datepicker"></div>
			</div>
		</div>
	`
	};

	const MAX_STEP_MINUTES = 30;
	const SLOT_START_OFFSET_MINUTES = 3;
	class SlotsCreator {
		#date;
		#resourceOccupancies;
		#slotRanges;
		#resourceId;
		#timezone;
		constructor(params) {
			this.#date = params.date;
			this.#resourceOccupancies = params.resourceOccupancy || [];
			this.#slotRanges = params.slotRanges;
			this.#resourceId = params.resourceId || null;
			this.#timezone = params.timezone;
		}
		get #timeFormat() {
			const isAmPmMode = new Intl.DateTimeFormat(navigator.language, {
				hour: 'numeric'
			}).resolvedOptions().hour12;
			return isAmPmMode ? 'h:i a' : 'H:i';
		}
		get #occupancies() {
			return this.#resourceId === null ? this.#resourceOccupancies : this.#resourceOccupancies.filter(({
				resourcesIds
			}) => resourcesIds.includes(this.#resourceId));
		}
		calcResourceSlots() {
			const nowTs = Date.now();
			const slots = [];
			booking_lib_slotRanges.SlotRanges.applyTimezone(this.#slotRanges, this.#date.getTime(), this.#timezone).filter(slotRange => slotRange.weekDays.includes(this.#date.getDay())).sort((a, b) => a.from - b.from).forEach(slotRange => {
				const slotsFromTs = new Set();
				const slotDurationMs = slotRange.slotSize * 60 * 1000;
				const step = slotRange.slotSize < MAX_STEP_MINUTES ? slotRange.slotSize : MAX_STEP_MINUTES;
				const stepDurationMs = step * 60 * 1000;
				let fromTs = this.#convertMinutesToTs(this.#date, slotRange.from);
				if (fromTs < nowTs) {
					fromTs = this.#roundSlotStart(nowTs, step);
				}
				const rangeTs = [fromTs, this.#convertMinutesToTs(this.#date, slotRange.to)];
				const slotOutOfRange = (slotFromTs, slotToTs) => {
					return slotFromTs <= nowTs || slotFromTs < rangeTs[0] || slotToTs > rangeTs[1];
				};
				while (fromTs < rangeTs[1]) {
					const toTs = fromTs + slotDurationMs;
					if (slotOutOfRange(fromTs, toTs)) {
						fromTs += stepDurationMs;
						continue;
					}
					if (this.#checkIsOccupiedSlot(fromTs, toTs)) {
						this.#getOccupancyBorderSlots(fromTs, toTs, slotDurationMs, slotOutOfRange).forEach(slotFromTs => slotsFromTs.add(slotFromTs));
						fromTs += stepDurationMs;
						continue;
					}
					slotsFromTs.add(fromTs);
					fromTs += stepDurationMs;
				}
				[...slotsFromTs].forEach(slotFromTs => {
					slots.push(this.#createSlot(slotFromTs, slotDurationMs));
				});
			});
			return slots;
		}
		#convertMinutesToTs(date, minutes) {
			const d = new Date(date);
			d.setHours(0, 0, 0, 0);
			d.setMinutes(minutes);
			return d.getTime();
		}
		#roundSlotStart(slotStartTs, slotDurationMinutes) {
			const slotStartDate = new Date(slotStartTs);
			let k = Math.ceil(slotStartDate.getMinutes() / slotDurationMinutes);
			if (k * slotDurationMinutes - slotStartDate.getMinutes() <= SLOT_START_OFFSET_MINUTES) {
				k += 1;
			}
			const roundedDate = new Date(slotStartDate);
			roundedDate.setMinutes(k * slotDurationMinutes);
			slotStartDate.setMinutes(roundedDate.getMinutes());
			return slotStartDate.getTime();
		}
		#createSlot(fromTs, duration) {
			return {
				fromTs,
				toTs: fromTs + duration,
				label: main_date.DateTimeFormat.format(this.#timeFormat, new Date(fromTs))
			};
		}
		#checkIsOccupiedSlot(fromTs, toTs) {
			return this.#occupancies.some(occupancy => {
				return fromTs >= occupancy.fromTs && fromTs < occupancy.toTs || toTs > occupancy.fromTs && toTs <= occupancy.toTs;
			});
		}
		#getOccupiedSlot(slot, resourceOccupancy) {
			return resourceOccupancy.find(occupancy => {
				return slot.fromTs >= occupancy.fromTs && slot.fromTs < occupancy.toTs || slot.toTs > occupancy.fromTs && slot.toTs <= occupancy.toTs;
			});
		}
		#getOccupancyBorderSlots(fromTs, toTs, slotSizeTs, slotOutOfRange) {
			const borderSlotsFromTs = [];
			const occupiedSlot = this.#getOccupiedSlot({
				fromTs,
				toTs
			}, this.#occupancies);
			if (!occupiedSlot) {
				return borderSlotsFromTs;
			}
			const leftSlot = [occupiedSlot.fromTs - slotSizeTs, occupiedSlot.fromTs];
			if (!this.#checkIsOccupiedSlot(leftSlot[0], leftSlot[1]) && !slotOutOfRange(leftSlot[0], leftSlot[1])) {
				borderSlotsFromTs.push(leftSlot[0]);
			}
			const rightSlot = [occupiedSlot.toTs, occupiedSlot.toTs + slotSizeTs];
			if (!this.#checkIsOccupiedSlot(rightSlot[0], rightSlot[1]) && !slotOutOfRange(rightSlot[0], rightSlot[1])) {
				borderSlotsFromTs.push(rightSlot[0]);
			}
			return borderSlotsFromTs;
		}
	}

	// @vue/component
	const ResourceSlotsUiBlock = {
		name: 'ResourceSlotsUiBlock',
		mixins: [booking_component_mixin_locMixin.locMixin],
		props: {
			/**
			 * @type {ResourceSlot|null}
			 */
			slot: {
				type: Object,
				default: null
			},
			date: {
				type: Date,
				required: true
			},
			/**
			 * @type {Resource}
			 */
			resource: {
				type: Object,
				required: true
			},
			resourceSlots: {
				type: Array,
				default: () => []
			},
			loading: {
				type: Boolean,
				default: false
			}
		},
		emits: ['select'],
		data() {
			return {
				showedMore: false
			};
		},
		computed: {
			formatDate() {
				return main_date.DateTimeFormat.format(this.loc('DAY_MONTH_FORMAT'), this.date);
			},
			title() {
				return this.loc('BOOKING_CRM_FORMS_FIELD_TIME_TITLE', {
					'#DATE#': this.formatDate
				});
			},
			emptySlotsMessage() {
				const day = this.date.getDay();
				if (this.resource.slotRanges.every(({
					weekDays
				}) => !weekDays.includes(day))) {
					return this.loc('BOOKING_CRM_FORMS_RESOURCE_RESOURCE_NOT_WORKING_MESSAGE');
				}
				return this.loc('BOOKING_CRM_FORMS_RESOURCE_NO_SLOTS_MESSAGE', {
					'#BR#': '<br />'
				});
			},
			hasResourceAvatar() {
				return Boolean(this.resource?.avatarUrl);
			},
			resourceAvatarUrl() {
				return this.hasResourceAvatar ? this.resource.avatarUrl : '/bitrix/js/booking/crm-forms/field/images/resource-icon.svg';
			},
			resourceDescription() {
				return this.resource?.description || '';
			},
			shortResourceDescription() {
				const SHORT_SIZE = 150 - this.more.length;
				if (this.showedMore || this.resourceDescription < SHORT_SIZE) {
					return this.resourceDescription;
				}
				const words = this.resourceDescription.split(' ');
				let description = '';
				for (const word of words) {
					if (description.length + word.length > SHORT_SIZE) {
						break;
					}
					description += `${word} `;
				}
				return description.trim();
			},
			more() {
				return this.loc('BOOKING_CRM_FORMS_RESOURCE_DESCRIPTION_MORE');
			}
		},
		watch: {
			loading: {
				handler(loading) {
					if (loading) {
						this.loader?.show?.(this.$refs.slotsContainer);
					} else {
						this.loader?.hide?.();
					}
				},
				immediate: true
			}
		},
		beforeMount() {
			this.loader = new main_loader.Loader({
				target: this.$refs.slotsContainer,
				size: 60
			});
		},
		methods: {
			selectSlot(slot) {
				const payload = {
					date: this.date,
					resource: this.resource,
					slot
				};
				this.$emit('select', payload);
			}
		},
		template: `
		<div class="booking-crm-forms-field booking--crm-forms--resource-slots">
			<slot name="title"/>
			<div class="booking--crm-forms--time-selector-block-header">
				<div class="booking--crm-forms--time-selector-block-resource">
					<div class="booking--crm-forms--resource-avatar">
						<img
							class="booking--crm-forms--resource-avatar-image"
							:src="resourceAvatarUrl"
							alt="Resource avatar"
							draggable="false"
						/>
					</div>
					<div class="booking--crm-forms--resource-info">
						<div class="booking--crm-forms--resource-name">
							{{ resource.name }}
						</div>
						<div class="booking--crm-forms--resource-type-name">
							{{ resource.typeName }}
						</div>
					</div>
				</div>
			</div>
			<div v-if="shortResourceDescription" class="booking--crm-forms--field-description-text">
				{{ shortResourceDescription }}
				<span
					v-if="shortResourceDescription.length < resourceDescription.length"
					class="booking--crm-forms--field-description-text-more"
					@click="showedMore = true"
				>
					{{ more }}
				</span>
			</div>
			<div ref="slotsContainer" class="booking--crm-forms--resource-slots__slot-list-wrapper">
				<div v-show="!loading" class="booking--crm-forms--resource-slots__slot-list">
					<div
						v-for="resourceSlot in resourceSlots"
						:key="resourceSlot"
						class="booking--crm-forms-time-selector-block-time-list-item booking--crm-forms--resource-slots__slot"
						:class="{
							'--selected': slot !== null && resourceSlot.fromTs === slot.fromTs
						}"
						@click="selectSlot(resourceSlot)"
					>
						<span>{{ resourceSlot.label }}</span>
					</div>
					<template v-if="resourceSlots.length === 0">
						<div class="booking--crm-forms--resource-slots__empty-slots">
							<div
								class="booking--crm-forms--resource-slots__empty-slots-message"
								v-html="emptySlotsMessage"
							>
							</div>
						</div>
					</template>
				</div>
				<div class="booking--crm-forms--time-selector-block-header__button">
					<slot name="changeDateBtn" :date="date" :resource="resource"/>
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const TimeSelectorBlock = {
		name: 'TimeSelectorBlock',
		components: {
			ResourceSlotsUiBlock
		},
		mixins: [booking_component_mixin_locMixin.locMixin],
		inject: ['isPreview'],
		props: {
			slot: {
				type: Object,
				default: null
			},
			/**
			 * @type {Resource}
			 */
			resource: {
				type: Object,
				default: null
			},
			/**
			 * @type {Resource[]}
			 */
			resources: {
				type: Array,
				default: () => []
			},
			date: {
				type: Date,
				required: true
			},
			fetching: {
				type: Boolean,
				default: false
			},
			showChangeDateButton: {
				type: Boolean,
				default: false
			},
			runAction: {
				type: Function,
				required: true
			},
			timezone: {
				type: String,
				required: true
			}
		},
		emits: ['update:slot', 'update:fetching', 'showCalendar'],
		data() {
			return {
				resourceOccupancy: []
			};
		},
		computed: {
			resourceSlots() {
				const slotsCreator = new SlotsCreator({
					date: this.date,
					slotRanges: this.resource?.slotRanges || [],
					resourceOccupancy: this.resourceOccupancy || [],
					timezone: this.timezone
				});
				return slotsCreator.calcResourceSlots();
			}
		},
		watch: {
			date: {
				handler(date) {
					if (date instanceof Date && !this.isPreview) {
						void this.fetchOccupancy();
					}
				},
				immediate: true
			},
			resource: {
				handler() {
					if (!this.isPreview) {
						void this.fetchOccupancy();
					}
				}
			}
		},
		created() {
			this.initOccupancy();
		},
		methods: {
			initOccupancy() {
				if (this.occupancy instanceof Occupancy) {
					return;
				}
				this.occupancy = createOccupancy(this.runAction);
				this.occupancy.setResources(this.resources);
				this.occupancy.setTimezone(this.timezone);
			},
			async fetchOccupancy() {
				if (!this.date || this.fetching || this.resource === null) {
					return;
				}
				if (!this.occupancy) {
					this.initOccupancy();
				}
				this.$emit('update:fetching', true);
				try {
					const response = await this.occupancy.getOccupancy([this.resource.id], this.date.getTime());
					this.resourceOccupancy = response || [];
				} catch (error) {
					console.error('Booking.CrmForms. GetOccupancy error', error);
				} finally {
					this.$emit('update:fetching', false);
				}
			},
			changeSlot({
				slot
			}) {
				this.$emit('update:slot', slot);
			},
			changeDate() {
				this.$emit('showCalendar');
			}
		},
		template: `
		<ResourceSlotsUiBlock
			:slot="slot"
			:resource="resource"
			:date="date"
			:resourceSlots="resourceSlots"
			:loading="fetching"
			@select="changeSlot"
		>
			<template #changeDateBtn>
				<button
					v-if="showChangeDateButton"
					type="button"
					class="booking--crm-forms--change-date-btn"
					@click="changeDate"
				>
					{{ loc('BOOKING_CRM_FORMS_CHANGE_DATE_BUTTON_CAPTION') }}
				</button>
			</template>
		</ResourceSlotsUiBlock>
	`
	};

	const DELAY = 300;

	// @vue/component
	const AvailableSlotsBlock = {
		name: 'AvailableSlotsBlock',
		components: {
			ResourceSlotsUiBlock
		},
		mixins: [booking_component_mixin_locMixin.locMixin],
		inject: ['isPreview'],
		props: {
			date: {
				type: Date,
				required: true
			},
			resources: {
				type: Array,
				required: true
			},
			runAction: {
				type: Function,
				required: true
			},
			timezone: {
				type: String,
				required: true
			}
		},
		emits: ['update:form', 'update:resourceId'],
		data() {
			return {
				fetching: false,
				selectedResourceId: null,
				visibleResourcesCount: 3,
				resourceOccupancy: [],
				resourcesSlots: []
			};
		},
		computed: {
			availableResource() {
				return this.resourcesSlots.filter(({
					slots
				}) => slots.length > 0);
			},
			visibleResources() {
				return this.availableResource.slice(0, this.visibleResourcesCount);
			},
			emptyResourcesSlotsMessage() {
				return this.loc('BOOKING_CRM_FORMS_RESOURCE_NO_SLOTS_MESSAGE', {
					'#BR#': '<br />'
				});
			}
		},
		watch: {
			date: {
				handler(date) {
					if (date instanceof Date && !this.isPreview) {
						void this.fetchAvailableSlots();
					}
				},
				immediate: true
			},
			fetching: {
				handler(fetching) {
					if (fetching) {
						this.loader?.show(this.$refs.resources);
						return;
					}
					this.loader?.hide();
				},
				immediate: true
			}
		},
		created() {
			this.initOccupancy();
		},
		beforeMount() {
			this.loader = new main_loader.Loader({
				target: this.$refs.resources,
				size: 60
			});
		},
		methods: {
			initOccupancy() {
				if (this.occupancy instanceof Occupancy) {
					return;
				}
				this.occupancy = createOccupancy(this.runAction);
				this.occupancy.setResources(this.resources);
				this.occupancy.setTimezone(this.timezone);
			},
			async fetchAvailableSlots() {
				this.fetching = true;
				if (!this.occupancy) {
					this.initOccupancy();
				}
				try {
					const resourcesIds = this.resources.map(resource => resource.id);
					const response = await this.occupancy.getOccupancy(resourcesIds, this.date.getTime());
					this.resourceOccupancy = response || [];
					this.setResourcesSlots();
				} catch (error) {
					console.error('Booking.CrmForms. GetOccupancy for resources error', error);
				} finally {
					this.fetching = false;
				}
			},
			setResourcesSlots() {
				this.resourcesSlots = this.resources.map(resource => {
					const resourceId = resource.id;
					const resourceOccupancies = this.resourceOccupancy;
					const slotsCreator = new SlotsCreator({
						date: this.date,
						slotRanges: resource.slotRanges,
						resourceOccupancy: resourceOccupancies,
						resourceId,
						timezone: this.timezone
					});
					return {
						resourceId,
						resource,
						slots: slotsCreator.calcResourceSlots()
					};
				}).sort((a, b) => b.slots.length - a.slots.length);
			},
			showMore() {
				this.visibleResourcesCount += 3;
			},
			changeDate(resourceId) {
				this.selectedResourceId = resourceId;
				setTimeout(() => {
					this.$emit('update:form', {
						resourceId
					});
				}, DELAY);
			},
			selectSlot({
				resource,
				slot
			}) {
				this.selectedResourceId = resource.id;
				setTimeout(() => {
					this.$emit('update:form', {
						resourceId: resource.id,
						slot
					});
				}, DELAY);
			}
		},
		template: `
		<div ref="resources" class="booking--crm-forms--field-group">
			<template v-show="!fetching">
				<ResourceSlotsUiBlock
					v-for="resource in visibleResources"
					:key="resource.resourceId"
					:date="date"
					:resource="resource.resource"
					:resourceSlots="resource.slots"
					:class="{
						'--fade': selectedResourceId !== null && selectedResourceId !== resource.resourceId,
					}"
					@select="selectSlot"
				>
					<template #changeDateBtn>
						<button
							type="button"
							class="booking--crm-forms--change-date-btn"
							@click="changeDate(resource.resourceId)"
						>
							{{ loc('BOOKING_CRM_FORMS_CHANGE_DATE_BUTTON_CAPTION') }}
						</button>
					</template>
				</ResourceSlotsUiBlock>
			</template>
			<template v-if="!fetching && visibleResources.length === 0">
				<p
					class="booking--crm-forms--available-slots-block__empty-slots"
					v-html="emptyResourcesSlotsMessage"
				></p>
			</template>
			<template v-if="resources.length > 0 && visibleResources.length > 0 && visibleResourcesCount < availableResource.length">
				<div class="booking--crm-forms--field-group--available-slots-block__footer">
					<button
						type="button"
						class="booking--crm-forms--change-date-btn booking--crm-forms--field-group--available-slots-block__btn-show-more"
						@click="showMore"
					>
						{{ loc('BOOKING_CRM_FORMS_SHOW_MORE_SLOTS') }}
					</button>
				</div>
			</template>
		</div>
	`
	};

	// @vue/component
	const Field = {
		name: 'CrmFormBookingField',
		components: {
			AvailableSlotsBlock,
			CalendarBlock,
			ResourceSelectBlock,
			SkuSelectBlock,
			TimeSelectorBlock
		},
		mixins: [booking_component_mixin_locMixin.locMixin],
		provide() {
			return {
				isPreview: this.isPreview
			};
		},
		props: {
			field: {
				type: Object,
				required: true
			},
			runAction: {
				type: Function,
				required: true
			},
			dependencies: {
				type: Object,
				required: true
			}
		},
		emits: ['change'],
		data() {
			return {
				form: {
					skuId: 0,
					resourceId: 0,
					date: null,
					dateTs: 0,
					slot: null
				},
				resources: [],
				resourceIds: [],
				resourcesWithSkus: [],
				fetchingResources: false,
				fetchingOccupancy: false,
				fetchingAutoSelectionResource: false,
				visibleCalendar: false,
				occupancy: null
			};
		},
		computed: {
			timezone() {
				return Intl.DateTimeFormat().resolvedOptions().timeZone;
			},
			isPreview() {
				return this.$root.form.editMode || window.location.pathname.indexOf('/sites/site/') === 0;
			},
			isAutoSelectionOn() {
				return Boolean(this.field?.options?.settingsData?.isAutoSelectionOn);
			},
			settingsData() {
				const defaultSettingsData = {
					label: this.loc('BOOKING_CRM_FORMS_DEFAULT_RESOURCE_FIELD_LABEL'),
					textHeader: this.loc('BOOKING_CRM_FORMS_DEFAULT_RESOURCE_FIELD_PLACEHOLDER'),
					hint: this.loc('BOOKING_CRM_FORMS_DEFAULT_RESOURCE_FIELD_HINT'),
					isVisibleHint: true,
					skuLabel: this.loc('BOOKING_CRM_FORMS_DEFAULT_SKU_FIELD_LABEL'),
					skuTextHeader: this.loc('BOOKING_CRM_FORMS_DEFAULT_SKU_FIELD_PLACEHOLDER')
				};
				if (this.isPreview && Array.isArray(this.field?.options?.settingsData)) {
					return defaultSettingsData;
				}
				const result = this.isAutoSelectionOn ? this.field?.options?.settingsData?.autoSelection : this.field?.options?.settingsData?.default;
				return main_core.Type.isObject(result) ? result : defaultSettingsData;
			},
			hasSlotsAllAvailableResources() {
				return !this.isAutoSelectionOn && this.settingsData?.hasSlotsAllAvailableResources;
			},
			isFieldWithSkus() {
				return this.resourceSkuRelations?.length > 0;
			},
			hasSkuFieldInPreview() {
				if (!this.isPreview) {
					return false;
				}
				const settingsData = this.isAutoSelectionOn ? this.field?.options?.settingsData?.autoSelection : this.field?.options?.settingsData?.default;
				return settingsData?.skuLabel || settingsData?.skuTextHeader || settingsData?.skuHint || settingsData?.isVisibleSkuHint || settingsData?.resources?.length > 0;
			},
			fetching() {
				return this.fetchingResources || this.fetchingOccupancy || this.fetchingAutoSelectionResource;
			},
			resource() {
				if (!this.form.resourceId) {
					return null;
				}
				return this.resources.find(resource => resource.id === this.form.resourceId) || null;
			},
			realResources() {
				return this.hasSlotsAllAvailableResources ? this.resources.filter(({
					id
				}) => id !== AllResource.id) : this.resources;
			},
			value() {
				if (!this.form.slot || !this.form.resourceId) {
					return null;
				}
				let resources = [];
				if (this.isFieldWithSkus) {
					resources = [{
						id: this.form.resourceId,
						skus: [{
							id: this.form.skuId
						}]
					}];
				} else {
					resources = [{
						id: this.form.resourceId
					}];
				}
				return {
					resources,
					dateFromTs: this.form.slot.fromTs / 1000,
					dateToTs: this.form.slot.toTs / 1000,
					timezone: this.timezone
				};
			},
			resourceSkuRelations() {
				return this.settingsData?.resources || [];
			},
			errorMessage() {
				return this.field.messages.get('fieldErrorRequired');
			},
			hasErrors() {
				return this.field.validated && !this.field.focused && !this.field.valid();
			},
			hasTitleOnlyInCalendar() {
				return this.form.date && !this.visibleCalendar && this.form.resourceId && this.isAutoSelectionOn;
			},
			showedCalendarBlock() {
				return this.form.resourceId && !this.form.date || this.form.date !== null || this.visibleCalendar;
			},
			showedSlotsBlock() {
				return !this.isPreview && this.hasSlotsAllAvailableResources && this.form.resourceId === AllResource.id && this.resources.length > 0 && this.form.date !== null;
			},
			showedTimeSelectorBlock() {
				return !this.isPreview && this.form.resourceId > 0 && this.realResources.length > 0 && this.form.date !== null;
			}
		},
		watch: {
			'$root.form.sent': {
				handler(next, prev) {
					this.tryUnbindCompleteScreen();
					if (next && !prev) {
						main_core.Event.bind(window, 'click', this.subscribeCompleteScreen, true);
					}
				}
			}
		},
		created() {
			this.initField();
		},
		async mounted() {
			if (!this.isPreview) {
				await this.loadData();
			}
			main_core.Event.bind(window, 'click', this.handleFocus, true);
		},
		beforeUnmount() {
			main_core.Event.unbind(window, 'click', this.handleFocus, true);
		},
		methods: {
			initField() {
				this.resourceIds = this.settingsData?.resourceIds || [];
				this.occupancyManager = createOccupancy(this.runAction);
				this.occupancyManager.setTimezone(this.timezone);
				this.form.skuId = 0;
				this.form.resourceId = this.hasSlotsAllAvailableResources ? AllResource.id : 0;
				this.form.date = new Date();
				this.form.slot = null;
			},
			async loadData() {
				if (this.isFieldWithSkus) {
					await this.loadResourceSkuRelationsData();
				} else {
					await this.loadResourcesData();
				}
			},
			async resetForm() {
				this.initField();
				this.field.validated = false;
				this.occupancyManager.clearCache();
				await this.loadData();
			},
			handleFocus({
				target
			}) {
				this.field.focused = this.$el.contains(target);
			},
			onSelectorChange() {
				this.updateValue();
			},
			updateValue() {
				if (this.form.resourceId || this.form.slot) {
					this.field.validated = false;
				}
				this.$emit('change', this.value);
			},
			async loadResourceSkuRelationsData() {
				try {
					this.fetchingResources = true;
					const formData = mapResourcesToFormData(this.settingsData.resources || []);
					const response = await this.runAction('booking.api_v1.CrmForm.PublicForm.getResourcesWithSkus', {
						data: formData
					});
					this.resourcesWithSkus = response?.data || [];
				} catch (error) {
					console.error('Load resource sku relations error', error);
				} finally {
					this.fetchingResources = false;
				}
			},
			async loadResourcesData() {
				const promises = [this.loadResources()];
				if (this.isAutoSelectionOn) {
					promises.push(this.fetchAutoSelectionData());
				}
				await Promise.all(promises);
			},
			async fetchAutoSelectionData() {
				try {
					this.fetchingAutoSelectionResource = true;
					const formData = new FormData();
					formData.append('timezone', this.timezone);
					this.resourceIds.forEach(resourceId => {
						formData.append('resourceIds[]', resourceId);
					});
					const response = await this.runAction('booking.api_v1.CrmForm.PublicForm.getAutoSelectionData', {
						data: formData
					});
					if (main_core.Type.isPlainObject(response?.data)) {
						this.form.resourceId = response.data.resourceId || 0;
						this.form.date = response.data.date ? new Date(response.data.date) : null;
					}
				} catch (error) {
					console.error('RunAction getAutoSelectionData error', error);
				} finally {
					this.fetchingAutoSelectionResource = false;
				}
			},
			async loadResources() {
				try {
					this.fetchingResources = true;
					const response = await this.runAction('booking.api_v1.CrmForm.PublicForm.getResources', {
						data: {
							ids: this.resourceIds
						}
					});
					this.setResources(mapDtoToResource(response.data || []));
					if (this.occupancyManager instanceof Occupancy) {
						this.occupancyManager.setResources(this.resources);
					}
				} catch (error) {
					console.error('Load resource error', error);
				} finally {
					this.fetchingResources = false;
				}
			},
			changeDate() {
				if (this.isPreview) {
					return;
				}
				this.visibleCalendar = true;
			},
			setResourceIdsBySkuId(skuId) {
				const resourceIds = new Set();
				for (const resource of this.resourcesWithSkus) {
					if (resource.skus.some(({
						id
					}) => id === skuId)) {
						resourceIds.add(resource.id);
					}
				}
				this.resourceIds = [...resourceIds];
			},
			async setSku(skuId) {
				this.form.skuId = skuId;
				this.setResourceIdsBySkuId(skuId);
				await this.loadResourcesData();
			},
			setResource(resourceId) {
				this.form.resourceId = resourceId;
				this.form.slot = null;
			},
			setResources(resources) {
				const resourceIds = this.resourceIds || [];
				const artificialResources = [];
				if (this.hasSlotsAllAvailableResources) {
					artificialResources.push({
						...AllResource,
						name: this.loc('BOOKING_CRM_FORMS_ALL_RESOURCES_LABEL')
					});
				}
				this.resources = [...artificialResources, ...resources.filter(({
					id
				}) => resourceIds.includes(id))];
			},
			setDate(date) {
				this.form.date = date;
				this.form.slot = null;
			},
			setSlot(selectedSlot) {
				this.form.slot = selectedSlot;
				this.updateValue();
			},
			updateForm(formPatch) {
				this.form = {
					...this.form,
					...formPatch
				};
				this.updateValue();
			},
			subscribeCompleteScreen(e) {
				if (e.target.tagName.toLowerCase() !== 'button') {
					return;
				}
				this.resetForm();
			},
			tryUnbindCompleteScreen() {
				main_core.Event.unbind(window, 'click', this.subscribeCompleteScreen, true);
			}
		},
		template: `
		<div class="booking-crm-forms-field-container">
			<SkuSelectBlock
				v-if="hasSkuFieldInPreview || isFieldWithSkus"
				:skuId="form.skuId"
				:resourcesWithSkus="resourcesWithSkus"
				:settingsData="settingsData"
				:dependencies="dependencies"
				@update:skuId="setSku"
			/>
			<ResourceSelectBlock
				v-if="isPreview || (isFieldWithSkus && form.skuId > 0) || !isFieldWithSkus"
				:resourceId="form.resourceId"
				:resources="resources"
				:settingsData="settingsData"
				:errorMessage="errorMessage"
				:hasErrors="hasErrors && form.resourceId <= 0"
				:fetching="fetchingAutoSelectionResource || fetchingResources || fetchingOccupancy"
				:dependencies="dependencies"
				@update:resourceId="setResource"
			/>
			<template v-if="(isFieldWithSkus && form.skuId > 0) || !isFieldWithSkus">
				<CalendarBlock
					v-if="!isPreview && showedCalendarBlock"
					:resource="resource"
					:date="form.date"
					:titleOnly="hasTitleOnlyInCalendar"
					:hasError="hasErrors && form.slot === null"
					:errorMessage="errorMessage"
					@updateDate="setDate"
				/>
				<AvailableSlotsBlock
					v-if="showedSlotsBlock"
					:date="form.date"
					:resources="realResources"
					:runAction="runAction"
					:timezone="timezone"
					@update:form="updateForm"
				/>
				<TimeSelectorBlock
					v-if="showedTimeSelectorBlock"
					:slot="form.slot"
					:resource="resource"
					:resources="realResources"
					:date="form.date"
					:runAction="runAction"
					:fetching="fetchingOccupancy"
					:timezone="timezone"
					:showChangeDateButton="hasTitleOnlyInCalendar"
					@update:fetching="fetchingOccupancy = $event"
					@update:slot="setSlot"
					@showCalendar="visibleCalendar = true"
				/>
			</template>
		</div>
	`
	};

	exports.Field = Field;

})(this.BX.Booking.CrmForms = this.BX.Booking.CrmForms || {}, BX, BX.Booking.Component.Mixin, BX.Booking.Const, BX.Booking.Lib, BX.Booking.Lib, BX.Main, BX.UI.DatePicker, BX);
//# sourceMappingURL=field.bundle.js.map
