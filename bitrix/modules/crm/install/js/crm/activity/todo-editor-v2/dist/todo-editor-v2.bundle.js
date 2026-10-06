/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, crm_ai_nameService, crm_timeline_tools, main_core, main_core_events, main_date, ui_notification, ui_textEditor, ui_vue3, main_popup, ui_infoHelper, ui_analytics, location_core, location_widget, calendar_controls, calendar_planner, calendar_util, ui_designTokens, ui_entitySelector, ui_system_alert, ui_system_alert_vue, calendar_sectionmanager, ui_sidepanel, crm_clientSelector, ui_uploader_tileWidget, crm_field_colorSelector, ui_vue3_directives_hint, crm_field_pingSelector) {
	'use strict';

	BX.Location = BX.Location || {};

	const Events = {
		EVENT_RESPONSIBLE_USER_CHANGE: 'crm:timeline:todo:responsible-user-changed',
		EVENT_DEADLINE_CHANGE: 'crm:timeline:todo:deadline-changed',
		EVENT_CALENDAR_CHANGE: 'crm:timeline:todo:calendar-changed',
		EVENT_ACTIONS_POPUP_ITEM_CLICK: 'crm:timeline:todo:actions-popup-item-click',
		EVENT_UPDATE_CLICK: 'crm:timeline:todo:update',
		EVENT_REPEAT_CLICK: 'crm:timeline:todo:repeat'
	};

	const DELIMITER_TYPE = 'delimiter';
	class ActionsPopup {
		#menu = null;
		#items = [];
		#bindElement = null;
		constructor(items) {
			this.#items = items;
		}
		bindElement(bindElement) {
			this.#bindElement = bindElement;
			return this;
		}
		show() {
			this.#getMenuPopup().show();
		}
		#getMenuPopup() {
			if (main_core.Type.isNil(this.#menu)) {
				this.#menu = main_popup.MenuManager.create({
					id: `crm-activity__todo-editor-v2-actions-menu_${main_core.Text.getRandom()}`,
					bindElement: this.#bindElement,
					autoHide: true,
					offsetLeft: 50,
					angle: true,
					closeByEsc: false,
					items: this.#getPreparedItems()
				});
			}
			return this.#menu;
		}
		#getPreparedItems() {
			const result = [];
			this.#items.forEach(itemData => {
				if (itemData.hidden) {
					return;
				}
				result.push(this.#getActionItem(itemData));
			});
			return result;
		}
		#getActionItem(itemData) {
			const {
				svgData,
				messageCode,
				id,
				onClick,
				type,
				componentId,
				componentParams
			} = itemData;
			if (type === DELIMITER_TYPE) {
				return {
					delimiter: true
				};
			}
			return {
				html: this.#getActionItemHtml(svgData, messageCode, componentParams?.isLocked),
				onclick: this.onItemClick.bind(this, {
					id,
					componentId,
					componentParams,
					onClick
				})
			};
		}
		onItemClick({
			id,
			componentId,
			componentParams,
			onClick
		}) {
			if (componentParams?.isLocked) {
				ui_infoHelper.FeaturePromotersRegistry.getPromoter({
					featureId: 'calendar_location'
				}).show();
				return;
			}
			if (main_core.Type.isFunction(onClick)) {
				onClick();
			} else {
				this.#onClickActionItem({
					id,
					componentId,
					componentParams
				});
			}
			this.#menu.close();
		}
		#getActionItemHtml(svgData, messageCode, isLocked = false) {
			return `
			<span class="crm-activity__todo-editor-v2-actions-menu-item ${isLocked ? '--locked' : ''}">
				<span 
					class="crm-activity__todo-editor-v2-actions-menu-item-icon"
					style="background-image: url('data:image/svg+xml,${encodeURIComponent(svgData)}')"
				></span>
				${main_core.Loc.getMessage(messageCode)}
			</span>
		`;
		}
		#onClickActionItem({
			id,
			componentId,
			componentParams
		}) {
			const data = {
				id,
				componentId,
				componentParams
			};
			main_core_events.EventEmitter.emit(this, Events.EVENT_ACTIONS_POPUP_ITEM_CLICK, data);
		}
	}

	const EventIds = Object.freeze({
		activityView: 'activity_view',
		activityCreate: 'activity_create',
		activityEdit: 'activity_edit',
		activityCancel: 'activity_cancel',
		activityComplete: 'activity_complete'
	});
	const Section = Object.freeze({
		lead: 'lead_section',
		deal: 'deal_section',
		quote: 'quote_section',
		contact: 'contact_section',
		company: 'company_section',
		dynamic: 'dynamic_section',
		smartInvoice: 'smart_invoice',
		custom: 'custom_section',
		myCompany: 'my_company_section',
		smartDocument: 'smart_document_contact_section',
		catalogContact: 'catalog_contractor_contact_section',
		catalogCompany: 'catalog_contractor_company_section'
	});
	const SubSection = Object.freeze({
		list: 'list',
		kanban: 'kanban',
		activities: 'activities',
		deadlines: 'deadlines',
		details: 'details',
		notificationPopup: 'notification_popup',
		kanbanDropzone: 'kanban_dropzone'
	});
	const ElementIds = Object.freeze({
		colorSettings: 'color_settings',
		description: 'description',
		title: 'title',
		responsibleUserId: 'responsible_user_id',
		deadline: 'deadline',
		pingSettings: 'ping_settings',
		addBlock: 'add_block',
		createButton: 'create_button',
		editButton: 'edit_button',
		cancelButton: 'cancel_button',
		skipPeriodButton: 'skip_period_button',
		autoFromActivityViewMode: 'auto_from_activity_view_mode',
		complexButton: 'complete_button',
		checkbox: 'checkbox',
		calendarSection: 'calendar_section'
	});
	class Analytics {
		#tool = 'crm';
		#category = 'activity_operations';
		#event;
		#type = 'todo_activity';
		#section;
		#subSection;
		#element;
		#crmMode;
		#pingSettings;
		#colorId;
		#blockTypes;
		#notificationSkipPeriod;
		#isTitleChanged = false;
		#isDescriptionChanged = false;
		#extensionSettings = null;
		static createFromToDoEditorData(data) {
			const {
				analyticSection: section,
				analyticSubSection: subSection
			} = data;
			return new Analytics(section, subSection);
		}
		constructor(section, subSection) {
			this.#extensionSettings = main_core.Extension.getSettings('crm.activity.todo-editor-v2');
			this.#section = section;
			this.#subSection = subSection;
			this.#crmMode = this.#getCrmMode();
		}
		#getCrmMode() {
			return `crmMode_${this.#extensionSettings.get('crmMode', '').toLowerCase()}`;
		}
		setEvent(event) {
			this.#event = event;
			return this;
		}
		setSubSection(subSection) {
			this.#subSection = subSection;
			return this;
		}
		setPingSettings(pingSettings) {
			this.#pingSettings = pingSettings;
			return this;
		}
		setColorId(colorId) {
			this.#colorId = colorId;
			return this;
		}
		setBlockTypes(blockTypes) {
			this.#blockTypes = blockTypes;
			return this;
		}
		setNotificationSkipPeriod(notificationSkipPeriod) {
			this.#notificationSkipPeriod = notificationSkipPeriod;
			return this;
		}
		setElement(element) {
			this.#element = element;
			return this;
		}
		setIsTitleChanged(value = true) {
			this.#isTitleChanged = value;
			return this;
		}
		setIsDescriptionChanged(value = true) {
			this.#isDescriptionChanged = value;
			return this;
		}
		send() {
			const data = this.getData();
			if (this.#validate(data)) {
				ui_analytics.sendData(data);
			}
		}
		getData() {
			const data = {
				tool: this.#tool,
				category: this.#category,
				event: this.#event,
				type: this.#type,
				c_section: this.#section,
				c_sub_section: this.#subSection,
				c_element: this.#element,
				p1: this.#crmMode
			};
			if (main_core.Type.isStringFilled(this.#notificationSkipPeriod)) {
				if (this.#notificationSkipPeriod === 'forever') {
					data.p2 = 'skipPeriod_custom';
				} else {
					data.p2 = 'skipPeriod_forever';
				}
			} else if (main_core.Type.isStringFilled(this.#pingSettings)) {
				data.p2 = 'ping_custom';
			}
			if (main_core.Type.isStringFilled(this.#colorId)) {
				data.p3 = 'color_custom';
			}
			if (main_core.Type.isArrayFilled(this.#blockTypes)) {
				const p4Items = [];
				if (this.#blockTypes.includes('section_calendar')) {
					p4Items.push('calendarCustom');
				}
				p4Items.push(`addBlock_${this.#blockTypes.length}`);
				data.p4 = p4Items.join(',');
			}
			const p5Items = [];
			if (this.#isTitleChanged) {
				p5Items.push('title');
			}
			if (this.#isDescriptionChanged) {
				p5Items.push('description');
			}
			if (main_core.Type.isArrayFilled(p5Items)) {
				data.p5 = p5Items.join(',');
			}
			return data;
		}
		#validate(data) {
			let isValid = true;
			Object.keys(data).forEach(key => {
				if (main_core.Type.isNil(data[key])) {
					isValid = false;
				}
			});
			return isValid;
		}
	}

	let InputPopup$1 = class InputPopup {
		#popup = null;
		#bindElement = null;
		#title = null;
		#buttonTitle = null;
		#onSubmit = null;
		#address = null;
		#addressFormatted = '';
		#addressWidget = null;
		#searchInput = null;
		#detailsContainer = null;
		#addressContainer = null;
		constructor(params) {
			this.#bindElement = params.bindElement;
			this.#title = params.title;
			this.#buttonTitle = params.buttonTitle || 'OK';
			this.#address = main_core.Type.isStringFilled(params.addressJson) ? new location_core.Address(JSON.parse(params.addressJson)) : null;
			this.#addressFormatted = main_core.Type.isStringFilled(params.addressFormatted) ? params.addressFormatted : null;
			this.#onSubmit = params.onSubmit;
			this.onClickHandler = this.onClickHandler.bind(this);
			this.onKeyUpHandler = this.onKeyUpHandler.bind(this);
		}
		show() {
			this.#getPopup().show();
			setTimeout(() => {
				this.#searchInput.focus();
			});
		}
		destroy() {
			if (this.#popup) {
				this.#popup.destroy();
			}
		}
		#getPopup() {
			if (!this.#popup) {
				this.#popup = new main_popup.Popup({
					id: `crm-todo-address-input-popup-${main_core.Text.getRandom()}`,
					bindElement: this.#bindElement,
					content: this.#getContent(),
					closeByEsc: false,
					closeIcon: false,
					draggable: false,
					width: 466,
					padding: 0,
					events: {
						onFirstShow: () => {
							this.initAddress();
						}
					}
				});
			}
			return this.#popup;
		}
		#getContent() {
			this.#searchInput = main_core.Tag.render`
			<input 
				type="text" 
				class="ui-ctl-element ui-ctl-textbox crm-activity__todo-editor-v2_block-popup-address-input-container" 
				value="${this.#addressFormatted}" 
			>
		`;
			this.#detailsContainer = main_core.Tag.render`<div class="location-fields-control-block"></div>`;
			this.#addressContainer = main_core.Tag.render`<div></div>`;
			return main_core.Tag.render`
			<div>
				<div class="crm-activity__todo-editor-v2_block-popup-wrapper --address">
					<div class="crm-activity__todo-editor-v2_block-popup-title">
						${main_core.Text.encode(this.#title)}
					</div>
					<div class="crm-activity__todo-editor-v2_block-popup-content">
						${this.#searchInput}
						<button 
							onclick="${this.onClickHandler}" 
							class="ui-btn ui-btn-primary"
						>
							${main_core.Text.encode(this.#buttonTitle)}
						</button>
					</div>
					${this.#detailsContainer}
					${this.#addressContainer}
				</div>
			</div>
		`;
		}
		initAddress() {
			const widgetFactory = new location_widget.Factory();
			this.#addressWidget = widgetFactory.createAddressWidget({
				address: this.#address,
				mode: location_core.ControlMode.edit
			});
			this.#addressWidget.subscribeOnAddressChangedEvent(event => {
				const data = event.getData();
				this.#address = main_core.Type.isObject(data.address) ? data.address : null;
			});
			const addressWidgetParams = {
				mode: location_core.ControlMode.edit,
				inputNode: this.#searchInput,
				mapBindElement: this.#searchInput,
				fieldsContainer: this.#detailsContainer,
				controlWrapper: this.#addressContainer
			};
			this.#addressWidget.render(addressWidgetParams);
			this.#setFocus();
		}
		#setFocus() {
			this.#searchInput.focus();
		}
		onClickHandler() {
			this.#getPopup().close();
			this.#onSubmit(this.#address);
		}
		onKeyUpHandler(event) {
			if (event.keyCode === 13) {
				this.onClickHandler();
			}
		}
	};

	const TodoEditorBlocksAddress = {
		props: {
			id: {
				type: String,
				required: true
			},
			title: {
				type: String,
				required: true
			},
			icon: {
				type: String,
				required: true
			},
			settings: {
				type: Object,
				required: true
			},
			filledValues: {
				type: Object
			},
			context: {
				type: Object,
				required: true
			},
			isFocused: {
				type: Boolean
			}
		},
		emits: ['close', 'updateFilledValues'],
		data() {
			const data = {
				address: null,
				addressFormatted: null,
				addressJson: null
			};
			return this.getPreparedData(data);
		},
		mounted() {
			if (this.isFocused) {
				void this.$nextTick(this.onShowAddressPopup);
			}
		},
		beforeUnmount() {
			this.inputPopup?.destroy();
		},
		methods: {
			getId() {
				return 'address';
			},
			getPreparedData(data) {
				this.format = new location_core.Format(JSON.parse(main_core.Loc.getMessage('CRM_ACTIVITY_TODO_ADDRESS_FORMAT')));
				const {
					filledValues,
					format
				} = this;
				let addressInstance = null;
				if (main_core.Type.isStringFilled(filledValues?.addressFormatted)) {
					addressInstance = new location_core.Address({
						languageId: format.languageId
					});
					addressInstance.setFieldValue(format.fieldForUnRecognized, filledValues.addressFormatted);

					// eslint-disable-next-line no-param-reassign
					data.address = addressInstance;
					data.addressFormatted = addressInstance?.toString(format).replaceAll('<br />', ', ');
				}
				if (main_core.Type.isStringFilled(filledValues?.addressJson)) {
					// eslint-disable-next-line no-param-reassign
					data.addressJson = filledValues.addressJson;
				} else {
					// eslint-disable-next-line no-param-reassign
					data.addressJson = addressInstance?.toJson();
				}
				return data;
			},
			getExecutedData() {
				const {
					addressFormatted,
					addressJson
				} = this;
				return {
					addressFormatted,
					address: addressJson
				};
			},
			emitUpdateFilledValues() {
				let {
					filledValues
				} = this;
				const {
					addressFormatted,
					addressJson
				} = this;
				const newFilledValues = {
					addressFormatted,
					addressJson
				};
				filledValues = {
					...filledValues,
					...newFilledValues
				};
				this.$emit('updateFilledValues', this.getId(), filledValues);
			},
			onShowAddressPopup() {
				if (main_core.Type.isNil(this.inputPopup)) {
					this.inputPopup = new InputPopup$1({
						bindElement: this.$refs.address,
						title: this.$Bitrix.Loc.getMessage('CRM_ACTIVITY_TODO_ADDRESS_BLOCK_POPUP_TITLE'),
						addressFormatted: this.addressFormatted ?? '',
						addressJson: this.addressJson ?? '',
						format: this.format,
						onSubmit: value => {
							this.setAddress(value);
						}
					});
				}
				this.inputPopup.show();
			},
			setAddress(address) {
				this.address = address;
				if (main_core.Type.isObject(address)) {
					this.addressJson = address.toJson();
					this.addressFormatted = address.toString(this.format).replaceAll('<br />', ', ');
				} else {
					this.addressJson = '';
					this.addressFormatted = '';
				}
			}
		},
		computed: {
			encodedTitle() {
				return main_core.Text.encode(this.title);
			},
			iconStyles() {
				if (!this.icon) {
					return {};
				}
				const path = `/bitrix/js/crm/activity/todo-editor-v2/images/${this.icon}`;
				return {
					background: `url('${encodeURI(main_core.Text.encode(path))}') center center`
				};
			},
			actionTitle() {
				return this.hasAddress ? this.changeTitle : this.addTitle;
			},
			changeTitle() {
				return this.$Bitrix.Loc.getMessage('CRM_ACTIVITY_TODO_ADDRESS_BLOCK_CHANGE_ACTION');
			},
			addTitle() {
				return this.$Bitrix.Loc.getMessage('CRM_ACTIVITY_TODO_ADDRESS_BLOCK_ADD_ACTION');
			},
			hasAddress() {
				return main_core.Type.isStringFilled(this.addressFormatted);
			},
			preparedAddress() {
				return main_core.Type.isStringFilled(this.addressFormatted) ? this.addressFormatted : '';
			}
		},
		created() {
			this.$watch('address', this.emitUpdateFilledValues, {
				deep: true
			});
			this.$watch('addressFormatted', this.emitUpdateFilledValues);
		},
		template: `
		<div class="crm-activity__todo-editor-v2_block-header --address">
			<span
				class="crm-activity__todo-editor-v2_block-header-icon"
				:style="iconStyles"
			></span>
			<span>{{ encodedTitle }}</span>
			<span 
				class="crm-activity__todo-editor-v2_block-header-data"
				v-html="preparedAddress"
			>
			</span>
			<span
				@click="onShowAddressPopup"
				ref="address"
				class="crm-activity__todo-editor-v2_block-header-action"
			>
				{{ actionTitle }}
			</span>
			<div
				@click="$emit('close', id)"
				class="crm-activity__todo-editor-v2_block-header-close"
			></div>
		</div>
	`
	};

	const DEFAULT_TAB_ID = 'location';
	const LocationSelector = {
		props: {
			locationId: {
				type: Number
			},
			forceShowLocationSelectorDialog: {
				type: Boolean
			}
		},
		emits: ['change', 'close'],
		data() {
			return {
				locations: null
			};
		},
		async mounted() {
			this.locations = await this.fetchRoomsListData();
			if (this.forceShowLocationSelectorDialog) {
				this.showLocationSelectorDialog();
			}
		},
		methods: {
			showLocationSelectorDialog() {
				if (!this.isLocationFeatureEnabled()) {
					ui_infoHelper.FeaturePromotersRegistry.getPromoter({
						featureId: 'calendar_location'
					}).show();
					return;
				}
				setTimeout(() => {
					this.getLocationSelectorDialog()?.show();
				}, 5);
			},
			isLocationFeatureEnabled() {
				return main_core.Extension.getSettings('crm.activity.todo-editor-v2').get('locationFeatureEnabled');
			},
			getLocationSelectorDialog() {
				if (this.locations === null) {
					return null;
				}
				if (main_core.Type.isNil(this.locationSelectorDialog)) {
					const tabs = [{
						id: DEFAULT_TAB_ID,
						title: this.$Bitrix.Loc.getMessage('CRM_ACTIVITY_TODO_CALENDAR_BLOCK_ROOMS_ENTITY_TITLE')
					}];
					const items = [];
					this.locations.rooms?.forEach(room => {
						items.push({
							id: room.ID,
							title: room.NAME,
							subtitle: this.getCapacityTitle(room.CAPACITY ?? null),
							entityId: DEFAULT_TAB_ID,
							tabs: DEFAULT_TAB_ID,
							avatarOptions: {
								bgColor: room.COLOR,
								bgSize: '22px',
								bgImage: 'none'
							},
							customData: {
								locationId: room.LOCATION_ID
							}
						});
					});
					this.locationSelectorDialog = new ui_entitySelector.Dialog({
						id: 'todo-editor-calendar-room-selector-dialog',
						targetNode: this.$refs.locationSelector,
						context: 'CRM_ACTIVITY_TODO_CALENDAR_ROOM',
						multiple: false,
						dropdownMode: true,
						showAvatars: true,
						enableSearch: items.length > 8,
						width: 450,
						height: 300,
						zIndex: 2500,
						items,
						tabs,
						events: {
							'Item:onSelect': this.onSelectLocation,
							'Item:onDeselect': this.onDeselectLocation
						}
					});
				}
				return this.locationSelectorDialog;
			},
			getCapacityTitle(value) {
				if (main_core.Type.isNil(value) || value <= 0) {
					return '';
				}
				return this.$Bitrix.Loc.getMessage('CRM_ACTIVITY_TODO_CALENDAR_BLOCK_ROOMS_CAPACITY', {
					'#CAPACITY_VALUE#': value
				});
			},
			async fetchRoomsListData() {
				return new Promise(resolve => {
					main_core.ajax.runAction('calendar.api.locationajax.getRoomsList').then(response => {
						resolve(response.data);
					}).catch(errors => {
						console.log(errors);
					});
				});
			},
			onSelectLocation({
				data
			}) {
				this.emitChangeEvent('select', data.item);
			},
			onDeselectLocation({
				data
			}) {
				this.emitChangeEvent('deselect', data.item);
			},
			emitChangeEvent(action, item = null) {
				this.$emit('change', {
					action,
					id: Number(item?.id)
				});
			},
			getLocationById(id) {
				return this.locations.rooms.find(location => Number(location.ID) === id) ?? null;
			}
		},
		computed: {
			blockTitle() {
				return this.$Bitrix.Loc.getMessage('CRM_ACTIVITY_TODO_CALENDAR_BLOCK_ROOMS_TITLE');
			},
			locationsListTitle() {
				if (main_core.Type.isNil(this.locationId)) {
					return this.$Bitrix.Loc.getMessage('CRM_ACTIVITY_TODO_CALENDAR_BLOCK_ROOMS_LIST');
				}
				return this.$Bitrix.Loc.getMessage('CRM_ACTIVITY_TODO_CLIENT_BLOCK_CHANGE_ACTION');
			},
			selectedLocationTitle() {
				const location = this.getLocationById(this.locationId);
				if (!location) {
					return '';
				}
				return location.NAME;
			},
			hasSelectedLocation() {
				return main_core.Type.isNumber(this.locationId);
			}
		},
		template: `
		<div v-if="locations" class="crm-activity__todo-editor-v2_block-header">
			<span
				class="crm-activity__todo-editor-v2_block-header-icon --calendar-room"
			></span>
			<span>
				{{ blockTitle }}
			</span>
			<span 
				v-if="hasSelectedLocation" 
				class="crm-activity__todo-editor-v2_block-header-data"
			>
				{{ selectedLocationTitle }}
			</span>
			<span
				ref="locationSelector"
				@click="showLocationSelectorDialog"
				class="crm-activity__todo-editor-v2_block-header-action"
			>
				{{ locationsListTitle }}
			</span>
			<div
				@click="$emit('close')"
				class="crm-activity__todo-editor-v2_block-header-close"
			></div>
		</div>
		<div v-else class="crm-activity__todo-editor-v2_block-header --skeleton"></div>
	`
	};

	const SectionSelector = {
		props: {
			userId: {
				type: Number,
				required: true
			},
			trackingUsersList: {
				type: Array,
				required: true
			},
			sections: {
				type: Array,
				required: true
			},
			selectedSectionId: {
				type: Number
			},
			readOnly: {
				type: Boolean,
				required: false,
				default: false
			}
		},
		emits: ['change'],
		methods: {
			show() {
				setTimeout(() => {
					this.getSelectorDialog().openPopup();
				}, 5);
			},
			hide() {
				this.getSelectorDialog()?.getPopup()?.close();
				this.selectorDialog = null;
			},
			isShown() {
				return this.isShownValue;
			},
			showCalendar() {
				ui_sidepanel.SidePanel.Instance.open(`/company/personal/user/${this.userId}/calendar/?IFRAME=Y`, {
					width: 1000,
					allowChangeHistory: false
				});
			},
			getSelectorDialog() {
				if (main_core.Type.isNil(this.selectorDialog)) {
					this.selectorDialog = new calendar_controls.SectionSelector({
						outerWrap: this.$refs.container,
						defaultCalendarType: 'user',
						defaultOwnerId: this.userId,
						sectionList: this.sections,
						sectionGroupList: calendar_sectionmanager.SectionManager.getSectionGroupList({
							type: 'user',
							ownerId: this.userId,
							userId: this.userId,
							trackingUsersList: this.trackingUsersList
						}),
						mode: 'inline',
						zIndex: 1200,
						getCurrentSection: () => {
							return this.sections.find(section => section.ID === this.selectedSectionId);
						},
						selectCallback: sectionValue => {
							this.onSelectSection(sectionValue.ID);
						},
						openPopupCallback: () => {
							this.isShownValue = true;
						},
						closePopupCallback: () => {
							this.isShownValue = false;
						}
					});
				}
				return this.selectorDialog;
			},
			onSelectSection(id) {
				this.$emit('change', Number(id));
			}
		},
		computed: {
			currentSectionTitle() {
				const title = this.sections.find(section => section.ID === this.selectedSectionId)?.NAME ?? null;
				if (title) {
					return title;
				}
				return this.sections.find(section => section.DEFAULT)?.NAME ?? '';
			},
			hasSections() {
				return main_core.Type.isArrayFilled(this.sections);
			}
		},
		template: `
		<span v-if="hasSections && !readOnly" class="crm-activity__todo-editor-v2_block-header-data__calendar-container">
			<span @click="showCalendar">
				{{ currentSectionTitle }}
			</span>
			<span ref="container"></span>
		</span>
		<span v-else-if="hasSections && readOnly">
			<span @click="showCalendar">
				{{ currentSectionTitle }}
			</span>
		</span>
		<span v-else class="crm-activity__todo-editor-v2_block-header-data__calendar-container --skeleton"></span>
	`
	};

	function invalidatePlannerRequests(context) {
		context.destroyed = true;
		context.plannerRequestId += 1;
	}
	function normalizeUserId(userId) {
		const normalizedUserId = Number(userId);
		return Number.isInteger(normalizedUserId) && normalizedUserId > 0 ? normalizedUserId : 0;
	}
	function createSelectedUserIds(userIds, hostId) {
		const selectedUserIds = new Set();
		const normalizedHostId = normalizeUserId(hostId);
		if (normalizedHostId > 0) {
			selectedUserIds.add(normalizedHostId);
		}
		if (userIds?.[Symbol.iterator]) {
			for (const userId of userIds) {
				const normalizedUserId = normalizeUserId(userId);
				if (normalizedUserId > 0) {
					selectedUserIds.add(normalizedUserId);
				}
			}
		}
		return selectedUserIds;
	}
	function prepareCalendarBlockForCopy(calendarBlock, hostId, from) {
		calendarBlock.data.calendarEventId = 0;
		calendarBlock.data.hostId = normalizeUserId(hostId);
		calendarBlock.data.from = from;
	}
	function requestPlannerUpdate(context, data) {
		if (context.destroyed) {
			return Promise.resolve();
		}
		const requestId = ++context.plannerRequestId;
		context.getPlanner().showLoader();

		// wrap BX.Promise in native js promise
		return new Promise((resolve, reject) => {
			main_core.ajax.runAction('calendar.api.calendarajax.updatePlanner', {
				data
			}).then(resolve).catch(reject);
		}).then(response => {
			if (requestId !== context.plannerRequestId) {
				return response;
			}
			context.plannerLoadError = false;
			context.plannerLimitState = {
				exceeded: response.data.plannerLimitExceeded === true,
				maxPlannerUsers: parseInt(response.data.maxPlannerUsers, 10) || 0,
				peopleCount: parseInt(response.data.plannerLimitPeopleCount ?? response.data.plannerPeopleCount, 10) || 0
			};
			context.getPlanner().update(main_core.Type.isArray(response.data.entries) ? response.data.entries : [], main_core.Type.isObject(response.data.accessibility) ? response.data.accessibility : {});
			context.onDataUpdate();
			return response;
		}, response => {
			if (requestId === context.plannerRequestId) {
				context.plannerLoadError = true;
			}
			return response;
		}).catch(errors => {
			if (requestId === context.plannerRequestId) {
				context.plannerLoadError = true;
			}
			return errors;
		}).finally(() => {
			if (requestId === context.plannerRequestId) {
				context.plannerInstance?.hideLoader();
			}
		});
	}
	function teardownCalendar(context) {
		invalidatePlannerRequests(context);
		context.$Bitrix.eventEmitter.unsubscribe(Events.EVENT_RESPONSIBLE_USER_CHANGE, context.onResponsibleUserChange);
		context.$Bitrix.eventEmitter.unsubscribe(Events.EVENT_DEADLINE_CHANGE, context.onDeadlineChange);
		context.plannerInstance?.selector?.unsubscribe('onChange', context.plannerSelectorChangeHandler);
	}
	const calendarMethods = {
		normalizeCalendarConfig(config) {
			const normalizedConfig = main_core.Type.isObject(config) ? config : {};
			return {
				...normalizedConfig,
				sections: main_core.Type.isArray(normalizedConfig.sections) ? normalizedConfig.sections : []
			};
		},
		loadConfig(data) {
			// wrap BX.Promise in native js promise
			return new Promise((resolve, reject) => {
				this.fetchConfig().then(resolve).catch(reject);
			}).then(response => {
				if (this.destroyed) {
					return;
				}
				this.config = this.normalizeCalendarConfig(response.data);
				this.sectionSelectorReadOnly = this.config.readOnly ?? false;
				this.applyCalendarUserSettings(this.config);
				if (main_core.Type.isNil(data.sectionId)) {
					const defaultSection = this.config.sections.find(section => section.DEFAULT === true);
					if (main_core.Type.isObject(defaultSection)) {
						this.sectionId = defaultSection.ID;
					} else {
						const firstUserSection = this.config.sections.find(section => section.OWNER_ID === data.ownerId);
						this.sectionId = firstUserSection?.ID ?? 0;
					}
				}
			}).catch(error => {
				return error;
			}).finally(() => {
				if (!this.destroyed) {
					void this.$nextTick(() => this.initPlanner());
				}
			});
		},
		updatePlannerForSelectedUsers() {
			const data = this.prepareUpdatePlannerData([...this.selectedUserIds]);
			return this.updatePlanner(data);
		},
		onResponsibleUserChange(event) {
			const {
				responsibleUserId
			} = event.getData();
			this.ownerId = responsibleUserId;
			this.selectedUserIds.add(responsibleUserId);
			void this.updatePlannerForSelectedUsers();
		},
		onDeadlineChange(event) {
			const data = event.getData();
			if (data) {
				const deadline = data.deadline.getTime();
				this.from = deadline;
				this.to = this.from + this.duration;
			}
		}
	};
	const TodoEditorBlocksCalendar = {
		components: {
			Alert: ui_system_alert_vue.Alert,
			LocationSelector,
			SectionSelector
		},
		props: {
			id: {
				type: String,
				required: true
			},
			title: {
				type: String,
				required: true
			},
			icon: {
				type: String,
				required: true
			},
			settings: {
				type: Object,
				required: true
			},
			context: {
				type: Object,
				required: true
			},
			filledValues: {
				type: Object
			},
			isFocused: {
				type: Boolean
			}
		},
		emits: ['close', 'updateFilledValues'],
		data() {
			const ownerId = this.settings.ownerId || this.context.userId;
			const hostId = normalizeUserId(this.settings.hostId) || normalizeUserId(this.settings.userId);
			const selectedUserIds = createSelectedUserIds([ownerId], hostId);
			const timestamp = (this.settings.from || main_date.Timezone.UserTime.getTimestamp()) * 1000;
			const millisecondsInFiveMinutes = 5 * 60 * 1000;

			// round timestamp to 5 minutes
			const from = Math.ceil(timestamp / millisecondsInFiveMinutes) * millisecondsInFiveMinutes;
			const duration = Number(this.settings.duration ?? 60 * 60) * 1000;
			const to = from + duration;
			const data = {
				selectedUserIds,
				from,
				to,
				duration,
				showLocation: this.settings.showLocation ?? false,
				locationId: null,
				timezoneName: this.settings.timezoneName,
				ownerId,
				hostId,
				calendarEventId: normalizeUserId(this.settings.calendarEventId),
				sectionId: this.settings.sectionId || null,
				config: {},
				canUseCalendarSectionSelector: main_core.Type.isFunction(calendar_controls.SectionSelector.getModes) && calendar_controls.SectionSelector.getModes().includes('inline'),
				sectionSelectorReadOnly: this.settings.sectionSelectorReadOnly ?? false,
				plannerLimitState: {
					exceeded: false,
					maxPlannerUsers: 0,
					peopleCount: 0
				},
				plannerLoadError: false
			};
			return this.getPreparedData(data);
		},
		mounted() {
			this.$Bitrix.eventEmitter.subscribe(Events.EVENT_RESPONSIBLE_USER_CHANGE, this.onResponsibleUserChange);
			this.$Bitrix.eventEmitter.subscribe(Events.EVENT_DEADLINE_CHANGE, this.onDeadlineChange);
			if (this.settings.showUserSelector && this.isFocused) {
				this.showUserSelectorDialog();
			}
		},
		beforeUnmount() {
			teardownCalendar(this);
		},
		methods: {
			...calendarMethods,
			getPreparedData(data) {
				const {
					filledValues
				} = this;
				let preparedData = {
					...this.applyFilledValues(data, filledValues),
					config: {},
					sectionSelectorReadOnly: false
				};
				if (main_core.Type.isObject(filledValues?.config)) {
					const config = this.normalizeCalendarConfig(filledValues.config);
					preparedData = {
						...preparedData,
						config,
						sectionSelectorReadOnly: config.readOnly ?? false
					};
					this.applyCalendarUserSettings(config);
					void this.$nextTick(() => this.initPlanner());
				} else if (preparedData.canUseCalendarSectionSelector) {
					void this.loadConfig(preparedData);
				} else {
					void this.$nextTick(() => this.initPlanner());
				}
				return preparedData;
			},
			applyFilledValues(data, filledValues) {
				if (!main_core.Type.isObject(filledValues)) {
					return data;
				}
				let selectedUsers = data.selectedUserIds;
				if (main_core.Type.isObject(filledValues.selectedUserIds)) {
					selectedUsers = filledValues.selectedUserIds;
				} else if (main_core.Type.isObject(filledValues.attendeesEntityList)) {
					selectedUsers = Object.values(filledValues.attendeesEntityList).filter(({
						entityId
					}) => entityId === 'user').map(({
						id
					}) => id);
				}
				const isExistingEvent = normalizeUserId(filledValues.calendarEventId ?? data.calendarEventId) > 0;
				const hostId = normalizeUserId(filledValues.hostId) || (isExistingEvent ? 0 : data.hostId);
				const selectedUserIds = createSelectedUserIds(selectedUsers, hostId);
				return {
					...data,
					selectedUserIds,
					hostId,
					from: Number(filledValues.from),
					to: Number(filledValues.to),
					duration: Number(filledValues.duration),
					timezoneName: filledValues.timezoneFrom,
					sectionId: main_core.Type.isNil(filledValues.sectionId) ? filledValues.sectionId : Number(filledValues.sectionId),
					calendarEventId: filledValues.calendarEventId ?? 0,
					...(main_core.Type.isStringFilled(filledValues.location) ? {
						showLocation: true,
						locationId: Number(filledValues.location.split('_')[1]) // calendar_7_123, need 7 as id
					} : {}),
					...(!main_core.Type.isNil(filledValues.ownerId) ? {
						ownerId: filledValues.ownerId
					} : {})
				};
			},
			applyCalendarUserSettings(config) {
				if (main_core.Type.isObject(config.userSettings)) {
					calendar_util.Util.setUserSettings(config.userSettings);
				}
			},
			initPlanner() {
				if (this.destroyed || this.plannerInstance) {
					return;
				}
				this.showPlanner();
				this.getPlanner().selector.subscribe('onChange', this.plannerSelectorChangeHandler);
				const userIds = [...this.selectedUserIds];
				const data = this.prepareUpdatePlannerData(userIds);
				void this.updatePlanner(data);
			},
			getId() {
				return 'calendar';
			},
			showPlanner() {
				this.getPlanner().show();
			},
			getPlanner() {
				if (!this.plannerInstance) {
					this.plannerInstance = new calendar_planner.Planner({
						wrap: this.$refs.plannerContainer,
						compactMode: false,
						showEntryName: false,
						minWidth: 770,
						minHeight: 104,
						height: 104,
						width: 770,
						entryTimezone: this.config.userSettings?.timezoneName ?? this.timezoneName,
						readonly: this.isPlannerReadOnly()
					});
				}
				return this.plannerInstance;
			},
			isPlannerReadOnly() {
				if (!this.sectionSelectorReadOnly) {
					return false;
				}
				const hasSelectedSection = main_core.Type.isArray(this.config.sections) && this.config.sections.some(section => section.ID === this.sectionId);
				return !hasSelectedSection || !this.selectedUserIds.has(this.context.userId);
			},
			prepareUpdatePlannerData(newUserIds) {
				const location = this.locationId ? this.location : '';
				const data = {
					entryId: this.calendarEventId ?? 0,
					ownerId: this.ownerId,
					hostId: this.hostId,
					type: 'user',
					entityList: [],
					dateFrom: this.getFormattedDate('beforeOneWeek'),
					dateTo: this.getFormattedDate('afterTwoWeeks'),
					timezone: this.timezoneName,
					location,
					entries: false,
					prevUserList: [],
					skipFeatureCheck: 'Y'
				};
				newUserIds.forEach(userId => {
					data.entityList.push({
						entityId: 'user',
						id: userId,
						entityType: 'employee'
					});
				});
				return data;
			},
			updatePlanner(data) {
				return requestPlannerUpdate(this, data);
			},
			onDataUpdate() {
				this.updatePlannerSelector();
				this.$Bitrix.eventEmitter.emit(Events.EVENT_CALENDAR_CHANGE, {
					from: this.from,
					to: this.from + this.duration
				});
				this.emitUpdateFilledValues();
			},
			emitUpdateFilledValues() {
				let {
					filledValues
				} = this;
				const {
					to,
					from,
					duration,
					location,
					selectedUserIds,
					ownerId,
					hostId,
					sectionId,
					config
				} = this;
				const newFilledValues = {
					to,
					from,
					duration,
					location,
					selectedUserIds,
					ownerId,
					hostId,
					sectionId,
					config
				};
				filledValues = {
					...filledValues,
					...newFilledValues
				};
				this.$emit('updateFilledValues', this.getId(), filledValues);
			},
			updatePlannerSelector() {
				const dateFrom = this.createDateInstance(this.from);
				const dateTo = this.createDateInstance(this.from + this.duration);
				this.getPlanner().updateSelector(dateFrom, dateTo);
			},
			createDateInstance(timestamp = null, startOfDay = false) {
				if (!timestamp) {
					// eslint-disable-next-line no-param-reassign
					timestamp = Date.now();
				}
				const date = new Date(timestamp);
				if (startOfDay) {
					date.setHours(0, 0, 0, 0);
				}
				return date;
			},
			getFormattedDate(id) {
				return this.getFormattedValue(id, main_date.DateTimeFormat.getFormat('FORMAT_DATE'));
			},
			getFormattedValue(id, format) {
				let timestamp = 0;
				switch (id) {
					case 'beforeOneWeek':
						{
							timestamp = this.from - 8 * 24 * 60 * 60 * 1000;
							break;
						}
					case 'from':
						{
							timestamp = this.from;
							break;
						}
					case 'to':
						{
							timestamp = this.from + this.duration;
							break;
						}
					case 'afterTwoWeeks':
						{
							timestamp = this.from + 14 * 24 * 60 * 60 * 1000;
							break;
						}
					default:
						timestamp = 0;
				}
				return main_date.DateTimeFormat.format(format, timestamp / 1000);
			},
			toggleCalendarSelectorDialog() {
				const sectionSelector = this.$refs.sectionSelector;
				if (sectionSelector.isShown()) {
					sectionSelector.hide();
				} else {
					sectionSelector.show();
				}
			},
			showUserSelectorDialog() {
				setTimeout(() => {
					const dialog = ui_entitySelector.Dialog.getById('todo-editor-calendar-user-selector-dialog');
					if (dialog?.isOpen()) {
						dialog.hide();
					} else {
						this.getUserSelectorDialog().show();
					}
				}, 5);
			},
			getUserSelectorDialog() {
				const preselectedItems = [];
				this.selectedUsersIdsArray.forEach(id => {
					preselectedItems.push(['user', id]);
				});
				const undeselectedItems = this.hostId > 0 ? [['user', this.hostId]] : [];
				return new ui_entitySelector.Dialog({
					id: 'todo-editor-calendar-user-selector-dialog',
					targetNode: this.$refs.userSelector,
					context: 'CRM_ACTIVITY_TODO_CALENDAR_RESPONSIBLE_USER',
					multiple: true,
					dropdownMode: true,
					showAvatars: true,
					enableSearch: !this.sectionSelectorReadOnly,
					width: 450,
					zIndex: 2500,
					entities: [{
						id: 'user'
					}],
					preselectedItems,
					undeselectedItems,
					events: {
						'Item:onBeforeSelect': this.onBeforeSelectUser,
						'Item:onBeforeDeselect': this.onBeforeSelectUser,
						'Item:onSelect': this.onSelectUser,
						'Item:onDeselect': this.onDeselectUser
					}
				});
			},
			onBeforeSelectUser(event) {
				if (this.sectionSelectorReadOnly) {
					event.preventDefault();
					ui_notification.UI.Notification.Center.notify({
						content: main_core.Loc.getMessage('CRM_ACTIVITY_TODO_CALENDAR_PARTICIPANTS_AUTHOR_ONLY'),
						autoHideDelay: 5000
					});
				}
			},
			onSelectUser({
				data: {
					item
				}
			}) {
				if (this.selectedUserIds.has(item.id)) {
					return;
				}
				this.selectedUserIds.add(item.id);
				void this.updatePlannerForSelectedUsers();
			},
			onDeselectUser({
				data: {
					item
				}
			}) {
				if (item.id === this.hostId || !this.selectedUserIds.has(item.id)) {
					return;
				}
				this.selectedUserIds.delete(item.id);
				void this.updatePlannerForSelectedUsers();
			},
			getSelectedUserIds() {
				return this.selectedUserIds ?? [];
			},
			handlePlannerSelectorChanges({
				data: {
					dateFrom,
					dateTo
				}
			}) {
				this.from = dateFrom.getTime();
				this.duration = dateTo.getTime() - this.from;
				this.emitCalendarChange();
			},
			updateSettings(data) {
				if (!data || !data.deadline) {
					return;
				}
				this.from = data.deadline.getTime();
			},
			onSelectLocation({
				action,
				id
			}) {
				this.locationId = action === 'select' ? id : null;
			},
			onCloseLocationBlock() {
				this.locationId = null;
				this.showLocation = false;
			},
			getExecutedData() {
				const {
					duration,
					from,
					location,
					sectionId
				} = this;
				const microsecondsInSecond = 1000;

				// `from`/`to` are absolute UTC timestamps and the server consumes them as such
				// (DateTime::createFromTimestamp). Passing them through UserTime.toBrowser shifted the
				// moment whenever the browser timezone differed from the user's Bitrix profile timezone,
				// which silently moved the linked calendar event and tripped the deadline edit guard.
				return {
					from: from / microsecondsInSecond,
					to: (from + duration) / microsecondsInSecond,
					duration: duration / microsecondsInSecond,
					selectedUserIds: [...this.getSelectedUserIds()],
					sectionId,
					location
				};
			},
			prepareDataOnBlockConstruct(data, params) {
				// eslint-disable-next-line no-param-reassign
				data.settings.from = params.currentDeadline.getTime() / 1000;

				// eslint-disable-next-line no-param-reassign
				data.settings.ownerId = params.responsibleUserId;

				// eslint-disable-next-line no-param-reassign
				data.settings.userId = params.userId;

				// eslint-disable-next-line no-param-reassign
				data.settings.hostId = params.userId;
			},
			fetchConfig() {
				const data = {
					activityId: this.context.activityId,
					entityTypeId: this.context.itemIdentifier?.entityTypeId,
					entityId: this.context.itemIdentifier?.entityId
				};
				return main_core.ajax.runAction('crm.activity.todo.getCalendarConfig', {
					data
				});
			},
			onChangeSection(sectionId) {
				if (this.sectionId === sectionId) {
					return;
				}
				this.sectionId = sectionId;
				this.emitUpdateFilledValues();
				this.emitCalendarChange({
					sectionId
				});
			},
			emitCalendarChange(additional = {}) {
				const data = {
					...additional,
					from: this.from,
					to: this.from + this.duration
				};
				this.$Bitrix.eventEmitter.emit(Events.EVENT_CALENDAR_CHANGE, data);
			},
			hasSections() {
				return main_core.Type.isArrayFilled(this.config?.sections);
			}
		},
		computed: {
			encodedTitle() {
				return main_core.Text.encode(this.title);
			},
			iconStyles() {
				if (!this.icon) {
					return {};
				}
				const path = `/bitrix/js/crm/activity/todo-editor-v2/images/${this.icon}`;
				return {
					background: `url('${encodeURI(main_core.Text.encode(path))}') center center`
				};
			},
			usersList() {
				return this.$Bitrix.Loc.getMessage('CRM_ACTIVITY_TODO_CALENDAR_BLOCK_USERS_LIST');
			},
			location() {
				return this.locationId ? `calendar_${this.locationId}` : '';
			},
			selectedUsersIdsArray() {
				return [...this.selectedUserIds];
			},
			changeTitle() {
				return this.$Bitrix.Loc.getMessage('CRM_ACTIVITY_TODO_CALENDAR_BLOCK_CHANGE_ACTION');
			},
			plannerWarningText() {
				if (this.plannerLoadError) {
					return main_core.Loc.getMessage('CRM_ACTIVITY_TODO_CALENDAR_PLANNER_LOAD_ERROR');
				}
				return main_core.Loc.getMessage('CRM_ACTIVITY_TODO_CALENDAR_PLANNER_LIMIT_WARNING', {
					'#COUNT#': this.plannerLimitState.peopleCount,
					'#MAX#': this.plannerLimitState.maxPlannerUsers
				});
			},
			plannerWarningDesign() {
				return this.plannerLoadError ? ui_system_alert.AlertDesign.tintedAlert : ui_system_alert.AlertDesign.tintedWarning;
			}
		},
		created() {
			this.plannerInstance = null;
			this.plannerRequestId = 0;
			this.destroyed = false;
			this.plannerSelectorChangeHandler = this.handlePlannerSelectorChanges.bind(this);
			this.$watch('settings', (newSettings, oldSettings) => {
				const showLocation = Boolean(newSettings.showLocation ?? false);
				this.showLocation = main_core.Type.isStringFilled(this.filledValues?.location) || showLocation;
				if (oldSettings.showUserSelector !== newSettings.showUserSelector && newSettings.showUserSelector) {
					this.showUserSelectorDialog();
				}
			}, {
				deep: true
			});
		},
		watch: {
			duration() {
				this.onDataUpdate();
			},
			from() {
				this.onDataUpdate();
			},
			to() {
				this.onDataUpdate();
			},
			locationId(newLocationId, oldLocationId) {
				const newUserIds = this.selectedUsersIdsArray;
				const data = this.prepareUpdatePlannerData(newUserIds);
				void this.updatePlanner(data);
			}
		},
		template: `
		<div class="crm-activity__todo-editor-v2_block-header">
			<span
				class="crm-activity__todo-editor-v2_block-header-icon"
				:style="iconStyles"
			></span>
			<span>{{ encodedTitle }}</span>
			<span
				v-if="canUseCalendarSectionSelector"
				class="crm-activity__todo-editor-v2_block-header-data"
			>
				<SectionSelector 
					ref="sectionSelector"
					:userId="context.userId"
					:sections="config?.sections ?? []"
					:trackingUsersList="config?.trackingUsersList ?? []"
					:selectedSectionId="sectionId"
					:readOnly="sectionSelectorReadOnly"
					@change="onChangeSection"
				/>
			</span>
			<span v-if="canUseCalendarSectionSelector && hasSections && !sectionSelectorReadOnly">
				<span
					@click="toggleCalendarSelectorDialog"
					class="crm-activity__todo-editor-v2_block-header-action"
				>
					{{ changeTitle }}
				</span>
			</span>
			<div
				@click="$emit('close', id)"
				class="crm-activity__todo-editor-v2_block-header-close"
			></div>
		</div>
		<div class="crm-activity__todo-editor-v2_block-subheader">
			<span
				ref="userSelector"
				@click="showUserSelectorDialog"
				class="crm-activity__todo-editor-v2_block-subheader-action"
			>
				{{ usersList }} ({{ selectedUsersIdsArray.length }})
			</span>
		</div>
		<div class="crm-activity__todo-editor-v2_block-body">
			<div class="crm-activity__settings_popup__calendar-container">
				<div
					v-if="plannerLimitState.exceeded || plannerLoadError"
					class="crm-activity__todo-editor-v2_calendar-warning"
					role="status"
					aria-live="polite"
					aria-atomic="true"
				>
					<Alert :design="plannerWarningDesign">
						{{ plannerWarningText }}
					</Alert>
				</div>
				<div ref="plannerContainer" class="crm-activity__settings_popup__calendar__planner-container"></div>
			</div>
		</div>
		<div v-if="showLocation">
			<LocationSelector
				@change="onSelectLocation"
				@close="onCloseLocationBlock"
				:locationId="locationId"
				:forceShowLocationSelectorDialog="isFocused && !this.settings.showUserSelector"
			/>
		</div>
	`
	};

	const TodoEditorBlocksClient = {
		props: {
			id: {
				type: String,
				required: true
			},
			title: {
				type: String,
				required: true
			},
			icon: {
				type: String,
				required: true
			},
			settings: {
				type: Object,
				required: true
			},
			filledValues: {
				type: Object
			},
			context: {
				type: Object,
				required: true
			},
			isFocused: {
				type: Boolean
			}
		},
		emits: ['close', 'updateFilledValues'],
		data() {
			const data = {
				selectedClients: new Set(),
				isFetchedConfig: false,
				clients: []
			};
			return this.getPreparedData(data);
		},
		mounted() {
			this.fetchConfig();
			this.subscribeToReceiversChanges();
		},
		methods: {
			getId() {
				return 'client';
			},
			getPreparedData(data) {
				const {
					filledValues
				} = this;
				if (main_core.Type.isObject(filledValues?.clients)) {
					filledValues.clients.forEach(({
						entityId,
						entityTypeId,
						isAvailable
					}) => {
						data.selectedClients.add({
							entityId: Number(entityId),
							entityTypeId: Number(entityTypeId),
							isAvailable
						});
					});
				}
				if (main_core.Type.isObject(filledValues?.selectedClients)) {
					// eslint-disable-next-line no-param-reassign
					data.selectedClients = filledValues.selectedClients;
				}
				return data;
			},
			subscribeToReceiversChanges() {
				main_core_events.EventEmitter.subscribe('BX.Crm.MessageSender.ReceiverRepository:OnReceiversChanged', this.onReceiversChanged);
			},
			onReceiversChanged(event) {
				const {
					item
				} = event.getData();
				if (this.entityTypeId !== item?.entityTypeId || this.entityId !== item?.entityId) {
					return;
				}
				this.fetchConfig(true);
			},
			onShowAddClientPhoneSelector() {
				if (main_core.Type.isArrayFilled(this.clients)) {
					this.onShowClientSelector();
					return;
				}
				const id = 'client-selector-dialog';
				const context = `CRM_TIMELINE_TODO-${this.entityTypeId}`;
				if (!this.userSelectorDialog) {
					this.userSelectorDialog = new ui_entitySelector.Dialog({
						id,
						context,
						targetNode: this.$refs.addClientsSelector,
						multiple: false,
						dropdownMode: false,
						showAvatars: true,
						enableSearch: true,
						width: 450,
						zIndex: 2500,
						entities: this.getClientSelectorEntities(),
						events: {
							'Item:onSelect': this.onAddClient
						}
					});
				}
				if (this.userSelectorDialog.isOpen()) {
					this.userSelectorDialog.hide();
				} else {
					setTimeout(() => {
						this.userSelectorDialog.setTargetNode(this.$refs.addClientsSelector);
						this.userSelectorDialog.show();
					}, 5);
				}
			},
			async onAddClient(event) {
				if (this.isClientBindingInProgress) {
					event.preventDefault();
					return;
				}
				this.isClientBindingInProgress = true;
				const {
					item
				} = event.getData();
				const entityId = item.id;
				const entityTypeId = BX.CrmEntityType.resolveId(item.entityId);
				const isBound = await this.bindClient(entityId, entityTypeId);
				if (isBound) {
					BX.Crm.EntityEditor?.getDefault()?.reload();
				}
			},
			async bindClient(clientId, clientTypeId) {
				const ajaxParams = {
					entityId: this.entityId,
					entityTypeId: this.entityTypeId,
					clientId,
					clientTypeId
				};
				return new Promise(resolve => {
					main_core.ajax.runAction('crm.activity.todo.bindClient', {
						data: ajaxParams
					}).then(({
						data
					}) => {
						this.isClientBindingInProgress = false;
						if (!data) {
							resolve(false);
						}
						if (main_core.Type.isArrayFilled(data.clients)) {
							this.clients = data.clients;
							this.selectedClients.add({
								entityId: clientId,
								entityTypeId: clientTypeId,
								isAvailable: true
							});
						}
						resolve(true);
					}).catch(data => {
						this.isClientBindingInProgress = false;
						if (data.errors.length > 0) {
							this.showNotify(data.errors[0].message);
							return;
						}
						this.showNotify(this.$Bitrix.Loc.getMessage('CRM_ACTIVITY_TODO_BIND_CLIENT_ERROR'));
					});
				});
			},
			showNotify(content) {
				ui_notification.UI.Notification.Center.notify({
					content
				});
			},
			onShowClientSelector() {
				if (this.clientSelector && this.clientSelector.isOpen()) {
					this.clientSelector.hide();
				} else {
					const targetNode = this.$refs.clientsContainer;
					this.clientSelector = crm_clientSelector.ClientSelector.createFromItems({
						targetNode,
						multiple: true,
						items: this.clients,
						events: {
							onSelect: this.onSelectClient,
							onDeselect: this.onDeselectClient
						}
					});
					setTimeout(() => {
						this.availableSelectedClients.forEach(({
							entityId,
							entityTypeId
						}) => {
							this.clientSelector.setSelectedItemByEntityData(entityId, entityTypeId);
						});
						this.clientSelector.show();
					}, 5);
				}
			},
			getClientSelectorEntities() {
				const contact = {
					id: 'contact',
					dynamicLoad: true,
					dynamicSearch: true,
					options: {
						showTab: true,
						showPhones: true,
						showMails: true,
						hideReadMoreLink: true
					}
				};
				const company = {
					id: 'company',
					dynamicLoad: true,
					dynamicSearch: true,
					options: {
						excludeMyCompany: true,
						showTab: true,
						showPhones: true,
						showMails: true,
						hideReadMoreLink: true
					}
				};
				if (this.entityTypeId === BX.CrmEntityType.enumeration.contact) {
					return [company];
				}
				if (this.entityTypeId === BX.CrmEntityType.enumeration.company) {
					return [contact];
				}
				return [contact, company];
			},
			onSelectClient({
				data: {
					item
				}
			}) {
				this.selectedClients.add({
					entityId: item.customData.get('entityId'),
					entityTypeId: item.customData.get('entityTypeId'),
					isAvailable: true
				});
			},
			onDeselectClient({
				data: {
					item
				}
			}) {
				this.selectedClients.forEach(client => {
					if (client.entityId === item.customData.get('entityId') && client.entityTypeId === item.customData.get('entityTypeId')) {
						this.selectedClients.delete(client);
					}
				});
			},
			fetchConfig(force = false) {
				if (this.isFetchedConfig && !force) {
					return;
				}
				this.isFetchedConfig = false;
				if (!this.entityTypeId) {
					return;
				}
				const ajaxParameters = {
					entityTypeId: this.entityTypeId,
					entityId: this.entityId
				};
				main_core.ajax.runAction('crm.activity.todo.getClientConfig', {
					data: ajaxParameters
				}).then(({
					data
				}) => {
					this.isFetchedConfig = true;
					if (main_core.Type.isArrayFilled(data.clients)) {
						this.clients = data.clients;
						if (this.selectedClients.size === 0) {
							const {
								entityId,
								entityTypeId
							} = data.clients[0].customData;
							this.selectedClients.add({
								entityId,
								entityTypeId,
								isAvailable: true
							});
						}
					}
				}).catch(() => {
					BX.UI.Notification.Center.notify({
						content: this.$Bitrix.Loc.getMessage('CRM_ACTIVITY_TODO_ERROR')
					});
				});
			},
			onShowClient({
				entityId,
				entityTypeId
			}) {
				let path = '';
				if (entityTypeId === BX.CrmEntityType.enumeration.company) {
					path = `/crm/company/details/${Number(entityId)}/`;
				}
				if (entityTypeId === BX.CrmEntityType.enumeration.contact) {
					path = `/crm/contact/details/${Number(entityId)}/`;
				}
				if (!main_core.Type.isStringFilled(path)) {
					return;
				}
				if (BX.SidePanel) {
					BX.SidePanel.Instance.open(path);
				} else {
					window.top.location.href = path;
				}
			},
			getClientTitleFormatted(entityId, entityTypeId, showComma = false) {
				const clientInfo = this.getClientInfo(entityId, entityTypeId);
				if (!clientInfo) {
					return '';
				}
				const comma = showComma ? ', ' : '';
				return `${clientInfo.title}${comma}`;
			},
			getClientInfo(entityId, entityTypeId) {
				return this.clients.find(({
					customData
				}) => {
					return customData.entityId === entityId && customData.entityTypeId === entityTypeId;
				});
			},
			getExecutedData() {
				return {
					selectedClients: [...this.selectedClients]
				};
			},
			emitUpdateFilledValues() {
				let {
					filledValues
				} = this;
				const {
					selectedClients
				} = this;
				const newFilledValues = {
					selectedClients
				};
				filledValues = {
					...filledValues,
					...newFilledValues
				};
				this.$emit('updateFilledValues', this.getId(), filledValues);
			}
		},
		computed: {
			encodedTitle() {
				return main_core.Text.encode(this.title);
			},
			iconStyles() {
				if (!this.icon) {
					return {};
				}
				const path = `/bitrix/js/crm/activity/todo-editor-v2/images/${this.icon}`;
				return {
					background: `url('${encodeURI(main_core.Text.encode(path))}') center center`
				};
			},
			changeTitle() {
				return this.$Bitrix.Loc.getMessage('CRM_ACTIVITY_TODO_CLIENT_BLOCK_CHANGE_ACTION');
			},
			addTitle() {
				return this.$Bitrix.Loc.getMessage('CRM_ACTIVITY_TODO_CLIENT_BLOCK_ADD_ACTION');
			},
			hasClients() {
				return main_core.Type.isArrayFilled(this.availableSelectedClients);
			},
			entityTypeId() {
				return this.settings.entityTypeId;
			},
			entityId() {
				return this.settings.entityId;
			},
			availableSelectedClients() {
				return [...this.selectedClients].filter(client => client.isAvailable);
			}
		},
		created() {
			this.$watch('selectedClients', this.emitUpdateFilledValues, {
				deep: true
			});
		},
		template: `
		<div v-if="isFetchedConfig" class="crm-activity__todo-editor-v2_block-header">
			<span
				class="crm-activity__todo-editor-v2_block-header-icon"
				:style="iconStyles"
			></span>
			<span>{{ encodedTitle }}</span>
			<span 
				v-if="hasClients"
				class="crm-activity__todo-editor-v2_block-header-data"
			>
				<span
					v-for="(client, index) in availableSelectedClients"
					:key="client.entityTypeId + '-' + client.entityId"
					@click="onShowClient(client)"
				>
					<template v-if="Boolean(getClientInfo(client.entityId, client.entityTypeId))">
						{{ getClientTitleFormatted(client.entityId, client.entityTypeId, index !== availableSelectedClients.length - 1) }}
					</template>
				</span>
			</span>
			<span ref="clientsContainer">
				<span
					v-if="hasClients"
					ref="clientsSelector"
					@click="onShowClientSelector"
					class="crm-activity__todo-editor-v2_block-header-action"
				>
					{{ changeTitle }}
				</span>
				<span
					v-else
					ref="addClientsSelector"
					@click="onShowAddClientPhoneSelector"
					class="crm-activity__todo-editor-v2_block-header-action"
				>
					{{ addTitle }}
				</span>
			</span>
			<div
				@click="$emit('close', id)"
				class="crm-activity__todo-editor-v2_block-header-close"
			></div>
		</div>
		<div v-else class="crm-activity__todo-editor-v2_block-header --skeleton"></div>
	`
	};

	const MAX_UPLOAD_FILE_SIZE = 1024 * 1024 * 50; // 50M;

	const TodoEditorBlocksFile = {
		components: {
			TileWidgetComponent: ui_uploader_tileWidget.TileWidgetComponent
		},
		props: {
			id: {
				type: String,
				required: true
			},
			title: {
				type: String,
				required: true
			},
			icon: {
				type: String,
				required: true
			},
			settings: {
				type: Object,
				required: true
			},
			filledValues: {
				type: Object
			},
			context: {
				type: Object,
				required: true
			},
			isFocused: {
				type: Boolean
			}
		},
		emits: ['close', 'updateFilledValues'],
		data() {
			const data = {
				fileTokens: []
			};
			return this.getPreparedData(data);
		},
		mounted() {
			const needShowLoaderPopup = !(BX.localStorage && BX.localStorage.get('skip_autoshow_file_selector'));
			if (this.isFocused && needShowLoaderPopup) {
				void this.$nextTick(this.onShowUploaderPopup);
			}
			this.deleteFilesFromServerWhenDestroy = false;
		},
		methods: {
			getId() {
				return 'file';
			},
			getPreparedData(data) {
				const {
					filledValues
				} = this;
				if (main_core.Type.isArray(filledValues?.fileTokens)) {
					// eslint-disable-next-line no-param-reassign
					data.fileTokens = filledValues.fileTokens;
				}
				return data;
			},
			getExecutedData() {
				return {
					fileTokens: this.getFileTokenList()
				};
			},
			emitUpdateFilledValues() {
				let {
					filledValues
				} = this;
				const {
					fileTokens
				} = this;
				const newFilledValues = {
					fileTokens
				};
				filledValues = {
					...filledValues,
					...newFilledValues
				};
				this.$emit('updateFilledValues', this.getId(), filledValues);
			},
			onShowUploaderPopup() {
				this.$refs.fileBody.querySelector('.ui-tile-uploader-drop-label').click();
			},
			reset() {
				this.deleteFilesFromServerWhenDestroy = true;
			},
			getFileTokenList() {
				const tokens = [];
				this.$refs.uploader.uploader.getFiles().forEach(file => {
					if (file.isComplete()) {
						tokens.push(file.getServerFileId());
					}
				});
				return tokens;
			}
		},
		computed: {
			encodedTitle() {
				return main_core.Text.encode(this.title);
			},
			iconStyles() {
				if (!this.icon) {
					return {};
				}
				const path = `/bitrix/js/crm/activity/todo-editor-v2/images/${this.icon}`;
				return {
					background: `url('${encodeURI(main_core.Text.encode(path))}') center center`
				};
			},
			actionTitle() {
				return this.hasFileTokens ? this.changeTitle : this.addTitle;
			},
			changeTitle() {
				return this.$Bitrix.Loc.getMessage('CRM_ACTIVITY_TODO_LINK_BLOCK_CHANGE_ACTION');
			},
			addTitle() {
				return this.$Bitrix.Loc.getMessage('CRM_ACTIVITY_TODO_FILE_BLOCK_UPLOAD_ACTION');
			},
			hasFileTokens() {
				return main_core.Type.isArrayFilled(this.fileTokens);
			},
			uploaderOptions() {
				return {
					controller: 'crm.fileUploader.todoActivityUploaderController',
					controllerOptions: {
						entityId: this.settings.entityId,
						entityTypeId: this.settings.entityTypeId,
						activityId: this.context.activityId
					},
					files: this.fileTokens,
					events: {
						/* 'File:onRemove': (event) => {
							},
						onUploadStart: (event) => {
							},
						'File:onComplete': (event) => {
							}, */
						onUploadComplete: () => {
							void this.$nextTick(() => {
								this.fileTokens = this.getFileTokenList();
							});
						}
					},
					multiple: true,
					autoUpload: true,
					maxFileSize: MAX_UPLOAD_FILE_SIZE
				};
			},
			widgetOptions() {
				return {};
			}
		},
		created() {
			this.$watch('fileTokens', this.emitUpdateFilledValues, {
				deep: true
			});
		},
		beforeUnmount() {
			this.$refs.uploader.adapter.setRemoveFilesFromServerWhenDestroy(this.deleteFilesFromServerWhenDestroy);
		},
		template: `
		<div class="crm-activity__todo-editor-v2_block-header --file">
			<span
				class="crm-activity__todo-editor-v2_block-header-icon"
				:style="iconStyles"
			></span>
			<span>{{ encodedTitle }}</span>
			<span
				@click="onShowUploaderPopup"
				ref="file"
				class="crm-activity__todo-editor-v2_block-header-action"
			>
				{{ actionTitle }}
			</span>
			<div
				@click="$emit('close', id)"
				class="crm-activity__todo-editor-v2_block-header-close"
			></div>
		</div>
		<div ref="fileBody" class="crm-activity__todo-editor-v2_block-body --file">
			<TileWidgetComponent 
				ref="uploader"
				:uploaderOptions="uploaderOptions"
				:widgetOptions="widgetOptions"
			/>
		</div>
	`
	};

	class InputPopup {
		#popup = null;
		#bindElement = null;
		#title = null;
		#placeholder = null;
		#buttonTitle = null;
		#input = null;
		#onSubmit = null;
		constructor(params) {
			this.#bindElement = params.bindElement;
			this.#title = params.title;
			this.#placeholder = params.placeholder;
			this.#buttonTitle = params.buttonTitle || 'OK';
			this.#onSubmit = params.onSubmit;
			this.onClickHandler = this.onClickHandler.bind(this);
			this.onKeyUpHandler = this.onKeyUpHandler.bind(this);
		}
		show() {
			this.#getPopup().show();
			setTimeout(() => {
				this.#input.focus();
			});
		}
		destroy() {
			if (this.#popup) {
				this.#popup.destroy();
			}
		}
		setValue(value) {
			if (this.#input) {
				this.#input.value = value;
			}
		}
		#getPopup() {
			if (!this.#popup) {
				this.#popup = new main_popup.Popup({
					id: `crm-todo-link-input-popup-${main_core.Text.getRandom()}`,
					bindElement: this.#bindElement,
					content: this.#getContent(),
					closeByEsc: false,
					closeIcon: false,
					draggable: false,
					width: 466,
					padding: 0
				});
			}
			return this.#popup;
		}
		#getContent() {
			this.#input = main_core.Tag.render`
			<input 
				type="text" 
				placeholder="${main_core.Text.encode(this.#placeholder)}"
				class="ui-ctl-element"
				onkeyup="${this.onKeyUpHandler}"
			>
		`;
			return main_core.Tag.render`
			<div class="crm-activity__todo-editor-v2_block-popup-wrapper --link">
				<div class="crm-activity__todo-editor-v2_block-popup-title">
					${main_core.Text.encode(this.#title)}
				</div>
				<div class="crm-activity__todo-editor-v2_block-popup-content">
					${this.#input}
					<button 
						onclick="${this.onClickHandler}" 
						class="ui-btn ui-btn-primary"
					>
						${main_core.Text.encode(this.#buttonTitle)}
					</button>
				</div>
			</div>
		`;
		}
		onClickHandler(event) {
			this.#getPopup().close();
			this.#onSubmit(this.#input.value);
		}
		onKeyUpHandler(event) {
			if (event.keyCode === 13) {
				this.onClickHandler();
			}
		}
	}

	const TodoEditorBlocksLink = {
		props: {
			id: {
				type: String,
				required: true
			},
			title: {
				type: String,
				required: true
			},
			icon: {
				type: String,
				required: true
			},
			settings: {
				type: Object,
				required: true
			},
			filledValues: {
				type: Object
			},
			context: {
				type: Object,
				required: true
			},
			isFocused: {
				type: Boolean
			}
		},
		emits: ['close', 'updateFilledValues'],
		data() {
			const data = {
				link: null
			};
			return this.getPreparedData(data);
		},
		mounted() {
			if (this.isFocused) {
				void this.$nextTick(this.onShowLinkPopup);
			}
		},
		beforeUnmount() {
			this.inputPopup?.destroy();
		},
		methods: {
			getId() {
				return 'link';
			},
			getPreparedData(data) {
				const {
					filledValues
				} = this;
				if (main_core.Type.isStringFilled(filledValues?.link)) {
					// eslint-disable-next-line no-param-reassign
					data.link = filledValues.link;
				}
				return data;
			},
			getExecutedData() {
				const {
					link
				} = this;
				return {
					link
				};
			},
			emitUpdateFilledValues() {
				let {
					filledValues
				} = this;
				const {
					link
				} = this;
				const newFilledValues = {
					link
				};
				filledValues = {
					...filledValues,
					...newFilledValues
				};
				this.$emit('updateFilledValues', this.getId(), filledValues);
			},
			onLinkClick() {
				const a = document.createElement('a');
				a.href = this.link;
				a.target = '_blank';
				main_core.Dom.append(a, document.body);
				a.click();
				main_core.Dom.remove(a);
			},
			onShowLinkPopup() {
				if (main_core.Type.isNil(this.inputPopup)) {
					this.inputPopup = new InputPopup({
						bindElement: this.$refs.link,
						title: this.$Bitrix.Loc.getMessage('CRM_ACTIVITY_TODO_LINK_BLOCK_POPUP_TITLE'),
						placeholder: 'https://',
						onSubmit: value => {
							this.setLink(value);
						}
					});
				}
				this.inputPopup.show();
				this.inputPopup.setValue(this.link);
			},
			setLink(value) {
				this.link = value;
			}
		},
		computed: {
			encodedTitle() {
				return main_core.Text.encode(this.title);
			},
			iconStyles() {
				if (!this.icon) {
					return {};
				}
				const path = `/bitrix/js/crm/activity/todo-editor-v2/images/${this.icon}`;
				return {
					background: `url('${encodeURI(main_core.Text.encode(path))}') center center`
				};
			},
			actionTitle() {
				return this.hasLink ? this.changeTitle : this.addTitle;
			},
			changeTitle() {
				return this.$Bitrix.Loc.getMessage('CRM_ACTIVITY_TODO_LINK_BLOCK_CHANGE_ACTION');
			},
			addTitle() {
				return this.$Bitrix.Loc.getMessage('CRM_ACTIVITY_TODO_LINK_BLOCK_ADD_ACTION');
			},
			hasLink() {
				return main_core.Type.isStringFilled(this.link);
			}
		},
		created() {
			this.$watch('link', this.emitUpdateFilledValues, {
				deep: true
			});
		},
		template: `
		<div class="crm-activity__todo-editor-v2_block-header --link">
			<span
				class="crm-activity__todo-editor-v2_block-header-icon"
				:style="iconStyles"
			></span>
			<span>{{ encodedTitle }}</span>
			<span 
				class="crm-activity__todo-editor-v2_block-header-data"
				@click="onLinkClick"
			>
				{{ link }}
			</span>
			<span
				@click="onShowLinkPopup"
				ref="link"
				class="crm-activity__todo-editor-v2_block-header-action"
			>
				{{ actionTitle }}
			</span>
			<div
				@click="$emit('close', id)"
				class="crm-activity__todo-editor-v2_block-header-close"
			></div>
		</div>
	`
	};

	class BlockFactory {
		static getInstance(id) {
			if (id === TodoEditorBlocksCalendar.methods.getId()) {
				return TodoEditorBlocksCalendar;
			}
			if (id === TodoEditorBlocksClient.methods.getId()) {
				return TodoEditorBlocksClient;
			}
			if (id === TodoEditorBlocksLink.methods.getId()) {
				return TodoEditorBlocksLink;
			}
			if (id === TodoEditorBlocksFile.methods.getId()) {
				return TodoEditorBlocksFile;
			}
			if (id === TodoEditorBlocksAddress.methods.getId()) {
				return TodoEditorBlocksAddress;
			}
			throw new Error(`Unknown block id: ${id}`);
		}
	}

	const DEFAULT_COLOR_ID = 'default';
	const TodoEditorColorSelector = {
		directives: {
			hint: ui_vue3_directives_hint.hint
		},
		emits: ['onChange'],
		props: {
			valuesList: {
				type: Object,
				required: true
			},
			selectedValueId: {
				type: String,
				default: DEFAULT_COLOR_ID
			}
		},
		data() {
			return {
				currentValueId: this.selectedValueId || DEFAULT_COLOR_ID
			};
		},
		methods: {
			getValue() {
				return this.currentValueId;
			},
			setValue(value) {
				if (value === null) {
					this.resetToDefault();
					return;
				}
				this.currentValueId = value;
				this.itemSelector?.setValue(value);
			},
			onColorSelectorValueChange({
				data
			}) {
				this.currentValueId = data.value;
				this.$emit('onChange');
			},
			resetToDefault() {
				this.setValue(DEFAULT_COLOR_ID);
				this.itemSelector?.setValue(DEFAULT_COLOR_ID);
			}
		},
		computed: {
			hint() {
				return {
					text: this.$Bitrix.Loc.getMessage('CRM_ACTIVITY_TODO_COLOR_SELECTOR_HINT'),
					popupOptions: {
						angle: {
							offset: 30,
							position: 'top'
						},
						offsetTop: 2
					}
				};
			}
		},
		mounted() {
			void this.$nextTick(() => {
				this.itemSelector = new crm_field_colorSelector.ColorSelector({
					target: this.$refs.itemSelectorRef,
					colorList: this.valuesList,
					selectedColorId: this.currentValueId
				});
				main_core_events.EventEmitter.subscribe(this.itemSelector, crm_field_colorSelector.ColorSelectorEvents.EVENT_COLORSELECTOR_VALUE_CHANGE, this.onColorSelectorValueChange);
			});
		},
		template: `
		<div class="crm-activity__todo-editor-v2_color-selector" ref="itemSelectorRef" v-hint="hint"></div>
	`
	};

	const TodoEditorPingSelector = {
		directives: {
			hint: ui_vue3_directives_hint.hint
		},
		emits: ['onChange'],
		props: {
			valuesList: {
				type: Array,
				required: true,
				default: []
			},
			selectedValues: {
				type: Array,
				default: []
			},
			deadline: {
				type: Date
			}
		},
		computed: {
			hint() {
				return {
					text: this.$Bitrix.Loc.getMessage('CRM_ACTIVITY_TODO_PING_SELECTOR_HINT'),
					popupOptions: {
						angle: {
							offset: 34,
							position: 'top'
						}
					}
				};
			}
		},
		methods: {
			onPingSelectorValueChange() {
				this.$emit('onChange');
			},
			onDeadlineChange(event) {
				const {
					deadline
				} = event.getData();
				if (deadline) {
					this.itemSelector?.setDeadline(deadline);
				}
			},
			getValue() {
				if (this.itemSelector) {
					return this.itemSelector.getValue();
				}
				return [];
			},
			setValue(values) {
				this.itemSelector?.setValue(values);
			}
		},
		mounted() {
			this.itemSelector = new crm_field_pingSelector.PingSelector({
				target: this.$refs.container,
				valuesList: this.valuesList,
				selectedValues: this.selectedValues,
				icon: crm_field_pingSelector.CompactIcons.BELL,
				deadline: this.deadline
			});
			main_core_events.EventEmitter.subscribe(this.itemSelector, crm_field_pingSelector.PingSelectorEvents.EVENT_PINGSELECTOR_VALUE_CHANGE, this.onPingSelectorValueChange);
			this.$Bitrix.eventEmitter.subscribe(Events.EVENT_DEADLINE_CHANGE, this.onDeadlineChange);
		},
		template: '<div style="width: 100%;"><div ref="container" v-hint="hint"></div></div>'
	};

	const TodoEditorResponsibleUserSelector = {
		directives: {
			hint: ui_vue3_directives_hint.hint
		},
		props: {
			userId: {
				type: Number,
				required: true,
				default: 0
			},
			userName: {
				type: String,
				required: true,
				default: ''
			},
			imageUrl: {
				type: String,
				required: true,
				default: ''
			}
		},
		data() {
			return {
				userAvatarUrl: this.imageUrl
			};
		},
		computed: {
			userIconClassName() {
				return ['ui-icon', 'ui-icon-common-user', 'crm-timeline__user-icon'];
			},
			userIconStyles() {
				if (!this.userAvatarUrl) {
					return {};
				}
				return {
					backgroundImage: `url('${encodeURI(main_core.Text.encode(this.userAvatarUrl))}')`,
					backgroundSize: '21px'
				};
			},
			hint() {
				return {
					text: this.$Bitrix.Loc.getMessage('CRM_ACTIVITY_TODO_CHANGE_RESPONSIBLE'),
					popupOptions: {
						angle: {
							offset: 35,
							position: 'top'
						}
					}
				};
			}
		},
		methods: {
			onSelectUser(event) {
				const selectedItem = event.getData().item.getDialog().getSelectedItems()[0];
				if (selectedItem) {
					this.userAvatarUrl = selectedItem.getAvatar();
					this.$Bitrix.eventEmitter.emit(Events.EVENT_RESPONSIBLE_USER_CHANGE, {
						responsibleUserId: selectedItem.getId()
					});
				}
			},
			onDeselectUser() {
				setTimeout(() => {
					const selectedItems = this.userSelectorDialog.getSelectedItems();
					if (selectedItems.length === 0) {
						this.userAvatarUrl = this.imageUrl;
						this.userSelectorDialog.hide();
						this.$Bitrix.eventEmitter.emit(Events.EVENT_RESPONSIBLE_USER_CHANGE, {
							responsibleUserId: this.userId
						});
					}
				}, 100);
			},
			showUserDialog() {
				setTimeout(() => {
					this.getUserSelectorDialog().show();
				}, 5);
			},
			resetToDefault() {
				this.userAvatarUrl = this.imageUrl;
				if (this.userSelectorDialog) {
					const defaultUserItem = this.userSelectorDialog.getItem({
						id: this.userId,
						entityId: 'user'
					});
					if (defaultUserItem) {
						defaultUserItem.select(true);
					}
				}
			},
			getUserSelectorDialog() {
				if (main_core.Type.isNil(this.userSelectorDialog)) {
					this.userSelectorDialog = new ui_entitySelector.Dialog({
						id: 'responsible-user-selector-dialog',
						targetNode: this.$refs.userSelector,
						context: 'CRM_ACTIVITY_TODO_RESPONSIBLE_USER',
						multiple: false,
						dropdownMode: true,
						showAvatars: true,
						enableSearch: true,
						width: 450,
						zIndex: 2500,
						entities: [{
							id: 'user'
						}],
						preselectedItems: [['user', this.userId]],
						undeselectedItems: [['user', this.userId]],
						events: {
							'Item:onSelect': this.onSelectUser,
							'Item:onDeselect': this.onDeselectUser
						}
					});
				}
				return this.userSelectorDialog;
			}
		},
		watch: {
			imageUrl(imageUrl) {
				this.userAvatarUrl = imageUrl;
			}
		},
		template: `
		<div 
			class="crm-activity__todo-editor-v2_responsible-user-selector"
			ref="userSelector"
			@click="showUserDialog"
			v-hint="hint"
		>
			<span :class="userIconClassName">
				<i :style="userIconStyles"></i>
			</span>
		</div>
	`
	};

	const ADD_MODE = 'add';
	const CALENDAR_BLOCK_ID = TodoEditorBlocksCalendar.methods.getId();
	const TodoEditor = {
		components: {
			TodoEditorResponsibleUserSelector,
			TodoEditorPingSelector,
			TodoEditorBlocksCalendar,
			TodoEditorBlocksClient,
			TodoEditorBlocksLink,
			TodoEditorBlocksFile,
			TodoEditorBlocksAddress,
			TodoEditorColorSelector,
			TextEditorComponent: ui_textEditor.TextEditorComponent
		},
		props: {
			deadline: Date,
			defaultTitle: {
				type: String,
				required: false,
				default: ''
			},
			currentUser: Object,
			pingSettings: Object,
			colorSettings: Object,
			mode: {
				type: String,
				required: false,
				default: ADD_MODE
			},
			actionsPopup: Object,
			blocks: {
				type: Array,
				default: []
			},
			activityId: {
				type: Number,
				default: null,
				required: false
			},
			itemIdentifier: {
				type: Object,
				default: {},
				required: true
			},
			analytics: {
				type: Object,
				default: null,
				required: false
			},
			textEditor: ui_textEditor.TextEditor,
			onEditStart: Function
		},
		data() {
			const currentDeadline = this.deadline ?? new Date();
			const calendarDateTo = main_core.Runtime.clone(currentDeadline);
			calendarDateTo.setHours(currentDeadline.getHours() + 1);
			const blocksData = main_core.Runtime.clone(this.blocks);
			Object.keys(blocksData).forEach(blockId => {
				this.prepareBlockDataWithEditorParams(blocksData[blockId], {
					currentDeadline
				});
			});
			return {
				currentActivityId: this.activityId,
				title: this.defaultTitle,
				currentDeadline,
				calendarDateTo,
				pingOffsets: this.pingSettings.selectedValues,
				colorId: this.colorSettings.selectedValueId,
				responsibleUserId: this.currentUser.userId,
				wasUsed: false,
				blocksData,
				modeData: this.mode,
				currentUserData: this.currentUser,
				canChangeDeadline: true,
				isEdit: this.mode !== ADD_MODE
			};
		},
		computed: {
			deadlineTabIndex() {
				return this.isEdit ? 0 : -1;
			},
			deadlineFormatted() {
				let converter = new crm_timeline_tools.DatetimeConverter(this.currentDeadline);
				let deadlineFormatted = converter.toDatetimeString({
					withDayOfWeek: true,
					delimiter: ', '
				});

				// @todo use event here
				const calendarBlock = this.getBlockDataById(CALENDAR_BLOCK_ID);
				if (calendarBlock?.active) {
					converter = new crm_timeline_tools.DatetimeConverter(this.calendarDateTo);
					const calendarDateTo = converter.toTimeString();
					deadlineFormatted = `${deadlineFormatted}-${calendarDateTo}`;
				}
				return deadlineFormatted;
			},
			context() {
				return {
					userId: this.responsibleUserId,
					activityId: this.currentActivityId,
					itemIdentifier: this.itemIdentifier
				};
			},
			placeholderTitle() {
				return this.$Bitrix.Loc.getMessage('CRM_ACTIVITY_TODO_ADD_TITLE_PLACEHOLDER');
			},
			popupMenuButtonTitle() {
				return this.$Bitrix.Loc.getMessage('CRM_ACTIVITY_TODO_SHOW_ACTIONS_POPUP');
			},
			orderedBlocksData() {
				return this.blocksData.sort((a, b) => b.sort - a.sort);
			}
		},
		methods: {
			/* @internal */
			prepareBlockDataWithEditorParams(blocksData, {
				currentDeadline
			}) {
				this.prepareBlockData(blocksData, {
					currentDeadline,
					responsibleUserId: this.responsibleUserId || this.currentUser.userId,
					userId: this.currentUser.userId
				});
			},
			prepareBlockData(blockData, params) {
				// eslint-disable-next-line no-param-reassign
				blockData.active = main_core.Type.isBoolean(blockData.active) ? blockData.active : false;
				// eslint-disable-next-line no-param-reassign
				blockData.sort = main_core.Type.isNil(blockData.sort) ? 0 : blockData.sort;
				const blockInstance = BlockFactory.getInstance(blockData.id);
				if (main_core.Type.isFunction(blockInstance.methods.prepareDataOnBlockConstruct)) {
					// eslint-disable-next-line no-param-reassign
					blockData = {
						...blockData,
						...blockInstance.methods.prepareDataOnBlockConstruct(blockData, params)
					};
				}
			},
			setData({
				title,
				description,
				deadline,
				id,
				colorId,
				currentUser,
				pingOffsets,
				canChangeDeadline
			}) {
				this.title = title;
				this.textEditor.setText(description);
				this.currentDeadline = new Date(deadline);
				this.currentActivityId = id;
				this.canChangeDeadline = canChangeDeadline ?? true;
				this.currentUserData = currentUser;
				this.responsibleUserId = currentUser.userId;
				void this.$nextTick(() => {
					this.$refs.userSelector?.resetToDefault();
				});
				this.setPingOffsets(pingOffsets);
				this.$refs.pingSelector?.setValue(pingOffsets);
				this.$refs.colorSelector.setValue(colorId);
			},
			setMode(mode) {
				this.modeData = mode;
				this.isEdit = mode !== ADD_MODE;
			},
			resetCurrentActivityId() {
				this.currentActivityId = null;
			},
			setBlockFilledValues(id, filledValues) {
				const blockData = this.getBlockDataById(id);
				if (blockData) {
					blockData.filledValues = filledValues;
				}
			},
			setBlockActive(id, value = true) {
				const blockData = this.getBlockDataById(id);
				if (blockData) {
					blockData.active = value;
				}
			},
			resetTitleAndDescription() {
				this.setTitle(this.defaultTitle);
				this.textEditor.setText(this.defaultDescription);
			},
			setTitle(title) {
				this.title = title;
			},
			onDeadlineClick() {
				if (!this.canChangeDeadline) {
					ui_notification.UI.Notification.Center.notify({
						content: this.$Bitrix.Loc.getMessage('CRM_ACTIVITY_TODO_EDITOR_V2_CALENDAR_EVENT_ACCESS_DENIED'),
						autoHideDelay: 5000
					});
					return;
				}

				// eslint-disable-next-line @bitrix24/bitrix24-rules/no-bx
				BX.calendar({
					node: this.$refs.deadline,
					bTime: true,
					bHideTime: false,
					bSetFocus: false,
					value: main_date.DateTimeFormat.format(crm_timeline_tools.DatetimeConverter.getSiteDateTimeFormat(), this.currentDeadline),
					callback: this.onSetDeadlineByCalendar.bind(this)
				});
			},
			onDeadlineKeydown(event) {
				if (event.key === 'Enter' || event.key === ' ') {
					event.preventDefault();
					this.onDeadlineClick();
				}
			},
			onSetDeadlineByCalendar(deadline) {
				this.setDeadline(deadline);
				this.sendAnalyticsDeadlineChange();
			},
			setDeadline(deadline) {
				this.currentDeadline = deadline;
				this.$Bitrix.eventEmitter.emit(Events.EVENT_DEADLINE_CHANGE, {
					deadline
				});
			},
			onResponsibleUserChange(event) {
				const data = event.getData();
				if (data) {
					this.setResponsibleUserId(data.responsibleUserId);
					if (!this.responsibleUserSelectorChangeSended) {
						this.responsibleUserSelectorChangeSended = true;
						this.sendAnalytics(EventIds.activityView, ElementIds.responsibleUserId);
					}
				}
			},
			onCalendarChange(event) {
				const data = event.getData();
				if (data) {
					const currentDeadlineTimestamp = this.currentDeadline.getTime();
					this.setDeadline(new Date(data.from));
					this.calendarDateTo = new Date(data.to);
					if (currentDeadlineTimestamp !== data.from) {
						this.sendAnalyticsDeadlineChange();
					}
					if (main_core.Type.isNumber(data.sectionId)) {
						this.sendAnalyticsCalendarSectionChange();
					}
				}
			},
			setPingOffsets(offsets) {
				this.pingOffsets = offsets;
			},
			setResponsibleUserId(userId) {
				this.responsibleUserId = userId;
			},
			resetPingOffsetsToDefault() {
				this.setPingOffsets(this.pingSettings.selectedValues);
				this.$refs.pingSelector?.setValue(this.pingSettings.selectedValues);
			},
			resetResponsibleUserToDefault(user) {
				if (user) {
					this.currentUserData = {
						...this.currentUserData,
						...user
					};
				} else {
					this.currentUserData = {
						...this.currentUserData,
						...this.currentUser
					};
				}
				this.setResponsibleUserId(this.currentUserData.userId);
				const userSelector = this.$refs.userSelector;
				if (userSelector) {
					userSelector.resetToDefault();
				}
			},
			resetColorSelectorToDefault() {
				const colorSelector = this.$refs.colorSelector;
				if (colorSelector) {
					colorSelector.resetToDefault();
				}
			},
			getData() {
				return {
					title: main_core.Type.isString(this.title) && main_core.Type.isStringFilled(this.title.trim()) ? this.title.trim() : null,
					description: this.textEditor.getText(),
					deadline: this.currentDeadline,
					responsibleUserId: this.responsibleUserId,
					pingOffsets: this.$refs.pingSelector?.getValue(),
					colorId: this.$refs.colorSelector?.getValue(),
					isCalendarSectionChanged: this.isCalendarSectionChanged
				};
			},
			onColorSelectorValueChange() {
				if (!this.colorSelectorChangeSended) {
					this.colorSelectorChangeSended = true;
					this.sendAnalytics(EventIds.activityView, ElementIds.colorSettings);
				}
			},
			onPingSettingsSelectorValueChange() {
				if (!this.pingSettingsSelectorChangeSended) {
					this.pingSettingsSelectorChangeSended = true;
					this.sendAnalytics(EventIds.activityView, ElementIds.pingSettings);
				}
			},
			sendAnalyticsDeadlineChange() {
				if (!this.isDeadlineChanged) {
					this.sendAnalytics(EventIds.activityView, ElementIds.deadline);
					this.isDeadlineChanged = true;
				}
			},
			sendAnalyticsCalendarSectionChange() {
				if (!this.isCalendarSectionChanged) {
					this.sendAnalytics(EventIds.activityView, ElementIds.calendarSection);
					this.isCalendarSectionChanged = true;
				}
			},
			sendAnalytics(event, element) {
				if (this.analytics === null) {
					return;
				}
				this.analytics.setEvent(event).setElement(element).send();
			},
			onTitleInput(event) {
				const {
					value
				} = event.target;
				this.setTitle(value);
			},
			onTitleFocus(event) {
				this.titleBeforeFocus = event.target.value;
			},
			onTitleBlur(event) {
				const {
					value
				} = event.target;
				if (value !== this.defaultTitle && value !== this.titleBeforeFocus) {
					this.sendAnalytics(EventIds.activityView, ElementIds.title);
				}
			},
			handleTextEditorFocus(event) {
				this.isEdit = true;
				this.descriptionBeforeFocus = this.textEditor.getText();
			},
			handleTextEditorBlur(event) {
				const description = this.textEditor.getText();
				if (main_core.Type.isStringFilled(description) && description !== this.descriptionBeforeFocus) {
					this.sendAnalytics(EventIds.activityView, ElementIds.description);
				}
			},
			onActionsPopupItemClick({
				data: {
					id,
					componentId,
					componentParams
				}
			}) {
				const actionId = main_core.Type.isNil(componentId) ? id : componentId;
				if (!main_core.Type.isStringFilled(actionId)) {
					return;
				}
				this.blocksData.forEach(block => {
					// eslint-disable-next-line no-param-reassign
					block.focused = false;
				});
				const block = this.getBlockDataById(actionId);
				if (!main_core.Type.isObject(block)) {
					return;
				}
				if (main_core.Type.isPlainObject(componentParams)) {
					block.settings = {
						...componentParams,
						...this.getBlockDataFromPropsById(actionId).settings
					};
				} else {
					block.settings = main_core.Runtime.clone(this.getBlockDataFromPropsById(actionId).settings);
				}
				this.prepareBlockDataWithEditorParams(block, {
					currentDeadline: this.currentDeadline
				});
				block.active = true;
				block.focused = true;
				block.sort = this.getNextBlockSortValue();
				if (main_core.Type.isFunction(this.onEditStart)) {
					this.onEditStart();
				}
				this.isEdit = true;
				this.textEditor.focus();
				if (!this.addBlockSended) {
					this.addBlockSended = true;
					this.sendAnalytics(EventIds.activityView, ElementIds.addBlock);
				}
			},
			getNextBlockSortValue() {
				let maxSortValue = 0;
				this.blocksData.forEach(data => {
					if (maxSortValue < data.sort) {
						maxSortValue = data.sort;
					}
				});
				return ++maxSortValue;
			},
			showActionsPopup(event) {
				this.actionsPopup.bindElement(event.target).show();
			},
			onBlockCloseClick(id) {
				const block = this.getBlockDataById(id);
				this.resetBlock(block);
			},
			closeBlocks() {
				this.isEdit = false;
				this.blocksData.forEach(block => {
					this.resetBlock(block);
				});
			},
			resetBlock(block) {
				// eslint-disable-next-line no-param-reassign
				block.active = false;
				// eslint-disable-next-line no-param-reassign
				block.focused = false;
				// eslint-disable-next-line no-param-reassign
				block.sort = 0;
				if (main_core.Type.isFunction(this.$refs[block.id]?.reset)) {
					this.$refs[block.id].reset();
				}
				const blockData = this.getBlockDataById(block.id);
				if (main_core.Type.isObject(blockData)) {
					delete blockData.filledValues;
				}
			},
			getExecutedBlocksData() {
				const data = [];
				this.blocksData.filter(block => block.active).forEach(block => {
					data.push({
						...this.$refs[block.id][0].getExecutedData(),
						id: block.id
					});
				});
				return data;
			},
			getBlockComponentName(blockId) {
				return `TodoEditorBlocks${blockId.charAt(0).toUpperCase()}${blockId.slice(1)}`;
			},
			getBlockDataById(blockId) {
				return this.blocksData.find(block => block.id === blockId);
			},
			getBlockDataFromPropsById(blockId) {
				return this.blocks.find(block => block.id === blockId);
			},
			updateFilledValues(blockId, data) {
				const blockData = this.getBlockDataById(blockId);
				if (blockData) {
					blockData.filledValues = {
						...blockData.filledValues,
						...data
					};
				}
			}
		},
		mounted() {
			this.$Bitrix.eventEmitter.subscribe(Events.EVENT_RESPONSIBLE_USER_CHANGE, this.onResponsibleUserChange);
			this.$Bitrix.eventEmitter.subscribe(Events.EVENT_CALENDAR_CHANGE, this.onCalendarChange);
			main_core_events.EventEmitter.subscribe(this.actionsPopup, Events.EVENT_ACTIONS_POPUP_ITEM_CLICK, this.onActionsPopupItemClick);
		},
		beforeUnmount() {
			this.$Bitrix.eventEmitter.unsubscribe(Events.EVENT_RESPONSIBLE_USER_CHANGE, this.onResponsibleUserChange);
			this.$Bitrix.eventEmitter.unsubscribe(Events.EVENT_CALENDAR_CHANGE, this.onCalendarChange);
			main_core_events.EventEmitter.unsubscribe(this.actionsPopup, Events.EVENT_ACTIONS_POPUP_ITEM_CLICK, this.onActionsPopupItemClick);
		},
		template: `
		<div class="crm-activity__todo-editor-v2_container">
			<div class="crm-activity__todo-editor-v2_editor">
				<button
					class="crm-activity__todo-show-actions-popup-button ui-btn ui-btn-sm ui-btn-base-light"
					@click="showActionsPopup"
				>
					{{ popupMenuButtonTitle }}
					<span class="crm-activity__todo-show-actions-popup-button-arrow"></span>
				</button>
				<TextEditorComponent :events="{ onFocus: this.handleTextEditorFocus, onBlur: this.handleTextEditorBlur }" :editor-instance="textEditor">
					<template #header>
						<div class="crm-activity__todo-editor-v2_header">
							<input
								type="text"
								ref="title"
								class="crm-activity__todo-editor-v2_input_control --title"
								:value="title"
								:placeholder="placeholderTitle"
								maxlength="40"
								@input="onTitleInput"
								@focus="onTitleFocus"
								@blur="onTitleBlur"
							>
							<TodoEditorColorSelector
								ref="colorSelector"
								:valuesList="colorSettings.valuesList"
								:selectedValueId="colorSettings.selectedValueId"
								@onChange="onColorSelectorValueChange"
							/>
							<TodoEditorResponsibleUserSelector
								:userId="currentUserData.userId"
								:userName="currentUserData.title"
								:imageUrl="currentUserData.imageUrl"
								ref="userSelector"
								class="crm-activity__todo-editor-v2_action-btn"
							/>
						</div>
					</template>
					<template #footer>
						<div class="crm-activity__todo-editor-v2_tools">
							<div class="crm-activity__todo-editor-v2_left_tools">
								<div
									ref="deadline"
									role="button"
									:tabindex="deadlineTabIndex"
									@click="onDeadlineClick"
									@keydown="onDeadlineKeydown"
									class="crm-activity__todo-editor-v2_deadline"
								>
								<span class="crm-activity__todo-editor-v2_deadline-pill">
									<span class="crm-activity__todo-editor-v2_deadline-icon"></span>
									<span class="crm-activity__todo-editor-v2_deadline-text">{{ deadlineFormatted }}</span>
								</span>
								</div>
								<TodoEditorPingSelector
									ref="pingSelector"
									:valuesList="pingSettings.valuesList"
									:selectedValues="pingOffsets"
									:deadline="currentDeadline"
									@onChange="onPingSettingsSelectorValueChange"
									class="crm-activity__todo-editor-v2_ping_selector"
								/>
							</div>
						</div>
					</template>
				</TextEditorComponent>
			</div>

			<div
				class="crm-activity__todo-editor-v2_block-wrapper"
				v-for="block in orderedBlocksData"
				key="block.id"
				v-show="block?.active"
			>
				<component
					v-if="block?.active"
					v-bind:is="getBlockComponentName(block.id)"
					:ref="block.id"
					@close="onBlockCloseClick"
					:id="getBlockDataById(block.id).id"
					:title="getBlockDataById(block.id).title"
					:icon="getBlockDataById(block.id).icon"
					:settings="getBlockDataById(block.id).settings ?? {}"
					:filledValues="getBlockDataById(block.id).filledValues"
					:isFocused="getBlockDataById(block.id).focused"
					:context="context"
					@updateFilledValues="updateFilledValues"
				/>
			</div>
		</div>
	`
	};

	class TodoEditorBorderColor {
		static DEFAULT = 'default';
		static PRIMARY = 'primary';
	}

	const TodoEditorMode = {
		ADD: 'add',
		UPDATE: 'update',
		COPY: 'copy'
	};
	/**
	 * @memberOf BX.Crm.Activity
	 */
	class TodoEditorV2 {
		/**
		 * @event onFocus
		 * @event onSaveHotkeyPressed
		 */
		static BorderColor = TodoEditorBorderColor;
		static AnalyticsSection = Section;
		static AnalyticsSubSection = SubSection;
		static AnalyticsElement = ElementIds;
		static AnalyticsEvent = EventIds;
		#container = null;
		#layoutApp = null;
		#layoutComponent = null;
		#loadingPromise = null;
		#mode = TodoEditorMode.ADD;
		#ownerTypeId = null;
		#ownerId = null;
		#user = null;
		#currentUser = null;
		#pingSettings = null;
		#copilotSettings = null;
		#colorSettings = null;
		#calendarSettings = null;
		#defaultTitle = null;
		#defaultDescription = null;
		#deadline = null;
		#parentActivityId = null;
		#borderColor = '';
		#activityId = null;
		#eventEmitter = null;
		#popupMode = false;
		#hiddenActionItems = [];
		#actionsPopup = null;
		#analytics = null;
		#textEditor = null;
		constructor(params) {
			this.#checkParams(params);
			this.#initParams(params);
			this.#prepareContainer();
			this.onUpdateHandler = this.onUpdateHandler.bind(this);
			this.onRepeatHandler = this.onRepeatHandler.bind(this);
			this.#bindEvents(params);
		}
		#checkParams(params) {
			if (!main_core.Type.isDomNode(params.container)) {
				throw new Error('TodoEditor container must be a DOM Node');
			}
			if (!main_core.Type.isNumber(params.ownerTypeId)) {
				throw new TypeError('OwnerTypeId must be set');
			}
			if (!main_core.Type.isNumber(params.ownerId)) {
				throw new TypeError('OwnerId must be set');
			}
			if (!main_core.Type.isObjectLike(params.currentUser)) {
				throw new TypeError('Current user must be set');
			}
			if (!main_core.Type.isObjectLike(params.pingSettings) || Object.keys(params.pingSettings).length === 0) {
				throw new TypeError('Ping settings must be set');
			}
			if (!main_core.Type.isObjectLike(params.calendarSettings) || Object.keys(params.calendarSettings).length === 0) {
				throw new TypeError('Calendar settings must be set');
			}
			if (!main_core.Type.isObjectLike(params.colorSettings) || Object.keys(params.colorSettings).length === 0) {
				throw new TypeError('Color settings must be set');
			}
		}
		#initParams(params) {
			this.#container = params.container;
			this.#borderColor = this.#isValidBorderColor(params.borderColor) ? params.borderColor : TodoEditorV2.BorderColor.DEFAULT;
			this.#ownerTypeId = params.ownerTypeId;
			this.#ownerId = params.ownerId;
			this.#currentUser = params.currentUser;
			this.#user = main_core.Runtime.clone(params.currentUser);
			this.#pingSettings = params.pingSettings || {};
			this.#copilotSettings = params.copilotSettings || null;
			this.#colorSettings = params.colorSettings;
			this.#calendarSettings = params.calendarSettings || {};
			this.#defaultTitle = this.#getDefaultTitle();
			this.#defaultDescription = main_core.Type.isString(params.defaultDescription) ? params.defaultDescription : this.#getDefaultDescription();
			this.#deadline = main_core.Type.isDate(params.deadline) ? params.deadline : null;
			if (!this.#deadline) {
				this.setDefaultDeadLine(false);
			}
			if (main_core.Type.isArrayFilled(params.actionMenuSettings?.hiddenActionItems)) {
				this.#hiddenActionItems = params.actionMenuSettings.hiddenActionItems;
			}
			this.#popupMode = main_core.Type.isBoolean(params.popupMode) ? params.popupMode : false;
			if (main_core.Type.isPlainObject(params.analytics)) {
				this.#analytics = Analytics.createFromToDoEditorData({
					analyticSection: params.analytics.section,
					analyticSubSection: params.analytics.subSection
				});
			}
		}
		#prepareContainer() {
			main_core.Dom.addClass(this.#container, this.#getClassname());
		}
		setMode(mode) {
			if (!Object.values(TodoEditorMode).includes(mode)) {
				throw new Error(`Unknown TodoEditor mode ${mode}`);
			}
			this.#mode = mode;
			if (this.#layoutComponent) {
				this.#layoutComponent.setMode(mode);
			}
			return this;
		}
		show() {
			this.#layoutApp = ui_vue3.BitrixVue.createApp(TodoEditor, {
				deadline: this.#deadline,
				defaultTitle: this.#defaultTitle,
				currentUser: this.#currentUser,
				pingSettings: this.#pingSettings,
				colorSettings: this.#colorSettings,
				actionsPopup: this.#getActionsPopup(),
				blocks: this.#getBlocks(),
				mode: this.#mode,
				analytics: this.#getAnalyticsInstance(),
				textEditor: this.getTextEditor(),
				onEditStart: () => main_core.Dom.addClass(this.#container, '--is-edit'),
				itemIdentifier: {
					entityTypeId: this.#ownerTypeId,
					entityId: this.#ownerId
				}
			});
			this.#layoutComponent = this.#layoutApp.mount(this.#container);
		}
		getTextEditor() {
			if (this.#textEditor !== null) {
				return this.#textEditor;
			}
			this.#textEditor = new ui_textEditor.BasicEditor({
				removePlugins: ['BlockToolbar'],
				minHeight: 50,
				maxHeight: this.#popupMode ? 126 : 600,
				content: this.#defaultDescription,
				placeholder: main_core.Loc.getMessage('CRM_ACTIVITY_TODO_ADD_PLACEHOLDER_ROLLED'),
				paragraphPlaceholder: main_core.Loc.getMessage(main_core.Type.isPlainObject(this.#copilotSettings) ? 'CRM_ACTIVITY_TODO_ADD_PLACEHOLDER_WITH_COPILOT_MSGVER_1' : null, crm_ai_nameService.NameService.copilotNameReplacement()),
				toolbar: [],
				floatingToolbar: ['bold', 'italic', 'underline', 'strikethrough', '|', 'link', 'copilot'],
				collapsingMode: true,
				copilot: {
					copilotOptions: main_core.Type.isPlainObject(this.#copilotSettings) ? this.#copilotSettings : null,
					triggerBySpace: true
				},
				events: {
					onFocus: () => {
						this.#onInputFocus();
					},
					onEmptyContentToggle: event => {
						this.#eventEmitter.emit('onEmptyContentToggle', {
							isEmpty: event.getData().isEmpty
						});
					},
					onCollapsingToggle: event => {
						this.#eventEmitter.emit('onCollapsingToggle', {
							isOpen: event.getData().isOpen
						});
					},
					onMetaEnter: () => {
						this.#onSaveHotkeyPressed();
					}
				}
			});
			return this.#textEditor;
		}
		#getActionsPopup() {
			if (this.#actionsPopup === null) {
				const items = [{
					id: 'calendar',
					messageCode: 'CRM_ACTIVITY_TODO_ACTIONS_CALENDAR',
					svgData: '<svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.9907 10.3123H13.1133C13.3394 10.3123 13.5227 10.4944 13.5227 10.7191V11.8343C13.5227 12.0589 13.3394 12.241 13.1133 12.241H11.9907C11.7646 12.241 11.5813 12.0589 11.5813 11.8343V10.7191C11.5813 10.4944 11.7646 10.3123 11.9907 10.3123Z" fill="#A8ADB4"/><path d="M10.2021 10.3126H9.07947C8.85336 10.3126 8.67007 10.4947 8.67007 10.7193V11.8345C8.67007 12.0591 8.85336 12.2412 9.07947 12.2412H10.2021C10.4282 12.2412 10.6115 12.0591 10.6115 11.8345V10.7193C10.6115 10.4947 10.4282 10.3126 10.2021 10.3126Z" fill="#A8ADB4"/><path d="M10.2011 13.2054H9.07852C8.85242 13.2054 8.66912 13.3874 8.66912 13.6121V14.7273C8.66912 14.9519 8.85242 15.134 9.07852 15.134H10.2011C10.4272 15.134 10.6105 14.9519 10.6105 14.7273V13.6121C10.6105 13.3874 10.4272 13.2054 10.2011 13.2054Z" fill="#A8ADB4"/><path d="M13.1133 13.2054H11.9907C11.7646 13.2054 11.5813 13.3874 11.5813 13.6121V14.7273C11.5813 14.9519 11.7646 15.134 11.9907 15.134H13.1133C13.3394 15.134 13.5227 14.9519 13.5227 14.7273V13.6121C13.5227 13.3874 13.3394 13.2054 13.1133 13.2054Z" fill="#A8ADB4"/><path d="M14.9029 10.3123H16.0255C16.2516 10.3123 16.4349 10.4944 16.4349 10.7191V11.8343C16.4349 12.0589 16.2516 12.241 16.0255 12.241H14.9029C14.6768 12.241 14.4935 12.0589 14.4935 11.8343V10.7191C14.4935 10.4944 14.6768 10.3123 14.9029 10.3123Z" fill="#A8ADB4"/><path fill-rule="evenodd" clip-rule="evenodd" d="M17.1486 5.691V5.15946H18.3308C19.4103 5.2275 20.2467 6.16407 20.2272 7.28562V17.9164C20.2272 18.5032 19.7685 18.9795 19.201 18.9795H5.80482C5.23836 18.9795 4.77862 18.5032 4.77862 17.9164V7.28562C4.77451 7.23034 4.77246 7.17612 4.77246 7.12191C4.77451 6.03544 5.62627 5.15734 6.67505 5.15946H7.85724V5.691C7.85724 6.57123 8.54582 7.28562 9.39654 7.28562C10.2473 7.28562 10.9359 6.57123 10.9359 5.691V5.15946H14.07V5.691C14.07 6.57123 14.7596 7.28562 15.6093 7.28562C16.459 7.28562 17.1486 6.57123 17.1486 5.691ZM18.1748 16.8533H6.83106V8.40898H18.1748V16.8533Z" fill="#A8ADB4"/><path d="M10.1507 4.31111V5.4805C10.1507 5.91211 9.81308 6.26186 9.39644 6.26186C8.9798 6.26186 8.64218 5.91211 8.64218 5.4805V4.31111L8.64771 4.20959C8.69329 3.82206 9.01469 3.52246 9.40157 3.52442C9.81821 3.52762 10.1528 3.8795 10.1507 4.31111Z" fill="#A8ADB4"/><path d="M16.3215 4.33979V5.44858C16.3215 5.85574 16.0024 6.18636 15.6083 6.18636C15.2142 6.1853 14.8971 5.85468 14.8971 5.44752V4.33979C14.8971 3.93157 15.2163 3.60201 15.6093 3.60201C16.0024 3.60201 16.3215 3.93157 16.3215 4.33979Z" fill="#A8ADB4"/></svg>',
					hidden: !this.#canUseCalendarBlock()
				},
				// temporary commented
				// {
				// 	id: 'slot',
				// 	messageCode: 'CRM_ACTIVITY_TODO_ACTIONS_SLOT',
				// 	svgData: '<svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M6.48621 17.5597H9.71158L8.73957 19.6426H5.48731C4.93592 19.6426 4.48842 19.1759 4.48842 18.601V8.18467C4.48442 8.13051 4.48242 8.07738 4.48242 8.02426C4.48442 6.95972 5.3135 6.09933 6.33437 6.10142H7.4851V6.62223C7.4851 7.4847 8.15536 8.18467 8.98344 8.18467C9.81152 8.18467 10.4818 7.4847 10.4818 6.62223V6.10142H13.5351V6.62223C13.5351 7.4847 14.2064 8.18467 15.0334 8.18467C15.8605 8.18467 16.5318 7.4847 16.5318 6.62223V6.10142H17.7853C18.8361 6.16808 19.6502 7.08575 19.6313 8.18467V11.9389L17.6335 10.274V9.28577H6.48621V17.5597ZM9.71763 6.41636V5.27057C9.71963 4.84767 9.39399 4.50289 8.98844 4.49977C8.58288 4.49768 8.25125 4.83829 8.24925 5.26015V5.27057V6.41636C8.24925 6.83926 8.57789 7.18196 8.98344 7.18196C9.38899 7.18196 9.71763 6.83926 9.71763 6.41636ZM15.7266 6.38426V5.29784C15.7266 4.89786 15.4159 4.57495 15.0333 4.57495C14.6507 4.57495 14.3401 4.89786 14.3401 5.29784V6.38322C14.3401 6.78216 14.6487 7.10611 15.0323 7.10715C15.4159 7.10715 15.7266 6.7832 15.7266 6.38426ZM8.77829 11.1139C8.50215 11.1139 8.27829 11.3377 8.27829 11.6139V12.5036C8.27829 12.7797 8.50215 13.0036 8.77829 13.0036H9.66803C9.94418 13.0036 10.168 12.7797 10.168 12.5036V11.6139C10.168 11.3377 9.94418 11.1139 9.66803 11.1139H8.77829ZM11.1129 11.6511C11.1129 11.375 11.3368 11.1511 11.6129 11.1511H12.5027C12.7788 11.1511 13.0027 11.375 13.0027 11.6511V12.5409C13.0027 12.817 12.7788 13.0409 12.5027 13.0409H11.6129C11.3368 13.0409 11.1129 12.817 11.1129 12.5409V11.6511ZM16.9787 12.1586C16.9787 11.9791 17.2088 11.8845 17.3531 12.0046L22.4009 16.205C22.5328 16.3148 22.5328 16.506 22.4009 16.6158L17.3531 20.8162C17.2088 20.9363 16.9787 20.8417 16.9787 20.6622V17.9552C16.9513 17.9654 16.9214 17.971 16.8903 17.971C13.9663 17.9713 11.4309 19.8957 10.3896 20.8119C10.23 20.9523 9.96759 20.8299 10.0157 20.6312C10.4226 18.9502 11.9512 14.6044 16.8959 14.4746C16.9249 14.4738 16.9529 14.4784 16.9787 14.4873V12.1586Z" fill="#A8ADB4"/></svg>',
				// },
				{
					type: 'delimiter',
					hidden: !this.#canUseCalendarBlock()
				}, {
					id: 'client',
					messageCode: 'CRM_ACTIVITY_TODO_ACTIONS_CLIENT',
					svgData: '<svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19.1102 18.7826C19.5562 18.6205 19.8037 18.1517 19.7122 17.686L19.3963 16.0768C19.3963 15.4053 18.5019 14.6382 16.7409 14.1912C16.1442 14.0278 15.577 13.7745 15.0596 13.4403C14.9464 13.3768 14.9636 12.7904 14.9636 12.7904L14.3964 12.7056C14.3964 12.658 14.3479 11.9547 14.3479 11.9547C15.0265 11.7309 14.9567 10.4105 14.9567 10.4105C15.3877 10.6451 15.6684 9.60016 15.6684 9.60016C16.1781 8.14839 15.4145 8.23617 15.4145 8.23617C15.5481 7.34989 15.5481 6.44915 15.4145 5.56287C15.075 2.62285 9.96373 3.42099 10.5698 4.38119C9.07596 4.11109 9.41682 7.44748 9.41682 7.44748L9.74084 8.31146C9.29173 8.5974 9.37993 8.92555 9.47844 9.29212C9.51952 9.44494 9.56238 9.60443 9.56886 9.77033C9.60016 10.6029 10.1192 10.4304 10.1192 10.4304C10.1512 11.8045 10.8415 11.9834 10.8415 11.9834C10.9712 12.8464 10.8904 12.6995 10.8904 12.6995L10.276 12.7725C10.2844 12.9687 10.2681 13.1652 10.2275 13.3576C9.87062 13.5137 9.6521 13.638 9.43575 13.761C9.21426 13.8869 8.99503 14.0116 8.6319 14.1679C7.24504 14.7644 5.73779 15.5403 5.46984 16.5849C5.3915 16.8903 5.31478 17.3009 5.24543 17.729C5.17275 18.1776 5.42217 18.6168 5.84907 18.7728C7.71183 19.4533 9.81409 19.8566 12.0441 19.9044H12.942C15.1614 19.8568 17.2541 19.4572 19.1102 18.7826Z" fill="#A8ADB4"/></svg>'
				}, {
					id: 'colleague',
					messageCode: 'CRM_ACTIVITY_TODO_ACTIONS_COLLEAGUE',
					svgData: '<svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.3717 14.7295C15.3717 14.7295 15.8697 16.6051 16.1536 17.9919C16.2039 18.2372 16.0599 18.4795 15.8198 18.5503C14.2716 19.0067 12.5157 19.2655 10.6546 19.268H10.5989C8.33167 19.2649 6.22074 18.8816 4.45101 18.2238C4.09757 18.0925 3.90181 17.7203 3.97453 17.3503C4.14815 16.467 4.33844 15.5288 4.43784 15.1361C4.64903 14.3016 5.83236 13.6816 6.92075 13.205C7.20527 13.0805 7.37691 12.9811 7.55037 12.8806C7.72026 12.7822 7.89189 12.6828 8.17301 12.5578C8.20474 12.4044 8.21749 12.2477 8.21099 12.0911L8.69326 12.0328C8.69326 12.0328 8.75664 12.1501 8.6547 11.4606C8.6547 11.4606 8.11342 11.3162 8.0883 10.2184C8.0883 10.2184 7.68169 10.3563 7.65715 9.69107C7.65216 9.55801 7.61854 9.43016 7.58634 9.30774C7.50923 9.0145 7.4403 8.75241 7.79269 8.52443L7.53826 7.83494C7.53826 7.83494 7.27128 5.168 8.4438 5.38499C7.96824 4.6188 11.98 3.98123 12.2465 6.33026C12.3513 7.03836 12.3513 7.758 12.2465 8.46609C12.2465 8.46609 12.8459 8.39609 12.4457 9.55574C12.4457 9.55574 12.2254 10.3893 11.8872 10.2012C11.8872 10.2012 11.9421 11.2561 11.4093 11.4349C11.4093 11.4349 11.4472 11.9966 11.4472 12.0349L11.8927 12.104C11.8927 12.104 11.8804 12.5724 11.9681 12.6231C12.3741 12.8901 12.8192 13.0925 13.2875 13.2231C14.6706 13.5801 15.3717 14.1928 15.3717 14.7295Z" fill="#A8ADB4"/><path d="M21.5203 15.2542C21.5307 15.4621 21.5426 15.6981 21.5546 15.9373C21.5725 16.2952 21.3506 16.6229 21.0072 16.7257C19.8897 17.0604 18.6226 17.3309 17.2483 17.5217H16.816C16.7901 17.1556 16.4584 15.8876 16.266 15.1519C16.1897 14.8602 16.1352 14.6521 16.1304 14.6171C16.1056 13.9241 15.496 13.3052 14.4537 12.8823C14.5326 12.7757 14.6001 12.6612 14.6553 12.5407C14.8014 12.3594 14.992 12.2187 15.2085 12.1324L15.2252 11.5899L14.081 11.2324C14.081 11.2324 13.7869 11.095 13.7576 11.095C13.7915 11.0115 13.8339 10.9318 13.8841 10.857C13.906 10.7987 14.0445 10.3635 14.0445 10.3635C13.8779 10.5775 13.6825 10.7675 13.4638 10.9282C13.6639 10.5746 13.8337 10.2047 13.9712 9.82247C14.0619 9.45455 14.1226 9.07991 14.1529 8.7022C14.2312 8.01581 14.3536 7.33514 14.5192 6.66437C14.638 6.32965 14.8474 6.03436 15.1241 5.81126C15.533 5.5276 16.0102 5.35795 16.5067 5.31982H16.5651C17.0624 5.35763 17.5406 5.52729 17.9503 5.81126C18.2273 6.03393 18.4368 6.32909 18.5555 6.66379C18.7209 7.33461 18.8433 8.01526 18.9221 8.70162C18.9574 9.07094 19.0211 9.437 19.1128 9.79651C19.2503 10.1855 19.4171 10.5635 19.6118 10.9273C19.3927 10.7671 19.1969 10.5773 19.0299 10.3635C19.0299 10.3635 19.1377 10.7584 19.1593 10.8167C19.2185 10.9049 19.2712 10.9972 19.317 11.0929C19.2887 11.0929 18.9937 11.2303 18.9937 11.2303L17.8495 11.5879L17.8658 12.1307C18.0825 12.2167 18.2731 12.3574 18.4191 12.539C18.4883 12.7133 18.5979 12.8687 18.7389 12.9925C19.015 13.0885 19.2812 13.2108 19.5338 13.3577C19.9163 13.5702 20.149 13.6309 20.5105 13.8534C21.1937 14.2737 21.4835 14.5246 21.5201 15.2515L21.5203 15.2542Z" fill="#A8ADB4"/></svg>',
					componentId: 'calendar',
					componentParams: {
						showUserSelector: true
					},
					hidden: !this.#canUseCalendarBlock()
				}, {
					type: 'delimiter'
				}, {
					id: 'address',
					messageCode: 'CRM_ACTIVITY_TODO_ACTIONS_ADDRESS',
					svgData: '<svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M12.5059 3.50928C9.12771 3.50928 6.41309 6.22284 6.41309 9.6021C6.41309 13.2243 10.1465 18.3027 11.7684 20.338C12.1493 20.816 12.8582 20.8132 13.2357 20.3325C14.8534 18.2721 18.5987 13.1219 18.5987 9.6021C18.5987 6.22284 15.8841 3.50928 12.5059 3.50928ZM12.506 12.3707C10.9556 12.3707 9.73636 11.1526 9.73636 9.60108C9.73636 8.05063 10.9545 6.83142 12.506 6.83142C14.0565 6.83142 15.2757 8.04956 15.2757 9.60108C15.2757 11.1526 14.0565 12.3707 12.506 12.3707Z" fill="#A8ADB4"/></svg>',
					hidden: !this.#canUseAddressBlock()
				}, {
					id: 'room',
					messageCode: 'CRM_ACTIVITY_TODO_ACTIONS_ROOM',
					svgData: '<svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M5.23231 5.98876C6.98167 4.03949 18.4413 4.15905 20.0081 5.98876C21.5749 7.81847 21.8554 15.3273 20.0081 17.0395C19.6571 17.3648 18.9666 17.6131 18.0668 17.793C18.0471 18.8982 17.9669 21.1391 17.6418 21.1391C17.3455 21.1391 15.2474 19.3102 13.962 18.1643C10.2879 18.232 6.19211 17.778 5.23231 17.0395C3.55525 15.7491 3.48296 7.93803 5.23231 5.98876ZM6.27368 14.5419C6.87367 14.6452 7.7036 14.7319 8.66214 14.7982C8.72234 14.54 8.79838 14.2423 8.8529 14.029C8.89254 13.8739 8.9208 13.7633 8.92333 13.7447C8.93599 13.3759 9.43469 13.0463 9.97766 12.8211C9.93653 12.7643 9.90135 12.7034 9.87269 12.6394C9.79701 12.5432 9.69766 12.4684 9.58444 12.4221L9.57579 12.1334L10.172 11.9424C10.172 11.9424 10.3259 11.8694 10.3407 11.8694C10.3231 11.825 10.301 11.7825 10.2747 11.7426C10.2656 11.718 10.218 11.5663 10.1989 11.5056L10.191 11.4805C10.2773 11.5942 10.3789 11.6955 10.4928 11.7814C10.3883 11.593 10.2999 11.3962 10.2283 11.1929C10.181 10.997 10.1494 10.7976 10.1336 10.5966C10.0927 10.2313 10.029 9.86897 9.94254 9.51169C9.88118 9.33425 9.77217 9.17712 9.62748 9.05751C9.41503 8.90666 9.16566 8.81625 8.90592 8.7959H8.87605C8.61632 8.81632 8.36698 8.90673 8.15451 9.05751C8.0096 9.17698 7.9005 9.33415 7.83924 9.51169C7.75307 9.86902 7.68931 10.2313 7.64834 10.5966C7.62998 10.7932 7.59675 10.988 7.54893 11.1796C7.47744 11.3864 7.39056 11.5877 7.28902 11.7816C7.40367 11.6961 7.50591 11.5951 7.59282 11.4815C7.59282 11.4815 7.53662 11.6922 7.52531 11.7229C7.49449 11.7699 7.46708 11.819 7.44328 11.8699C7.4583 11.8699 7.61206 11.9429 7.61206 11.9429L8.20819 12.1334L8.19958 12.4221C8.08625 12.4682 7.98689 12.543 7.9113 12.6392C7.87548 12.7316 7.81841 12.8143 7.74472 12.8805C7.60094 12.9315 7.46246 12.9964 7.33121 13.0741C7.13253 13.187 6.91378 13.2603 6.68715 13.2896C6.45896 13.328 6.31499 13.7045 6.31499 13.7045C6.31464 13.7106 6.29359 14.1341 6.27368 14.5419ZM9.28982 14.8373C11.3578 14.9552 13.8758 14.9842 15.9706 14.8924C15.848 14.3765 15.7382 13.954 15.7382 13.954C15.7382 13.954 15.3331 13.2757 14.5348 13.0651C14.2636 12.9878 14.0063 12.8682 13.7724 12.7109C13.7348 12.6134 13.72 12.5086 13.729 12.4045L13.4731 12.3645C13.4731 12.342 13.4512 12.0104 13.4512 12.0104C13.7587 11.9049 13.7271 11.2824 13.7271 11.2824C13.9224 11.3929 14.0496 10.901 14.0496 10.901C14.2806 10.217 13.9345 10.2581 13.9345 10.2581C13.9951 9.84024 13.9951 9.41586 13.9345 8.99799C13.7808 7.61217 11.4644 7.98794 11.7391 8.44097C11.0622 8.31303 11.2167 9.88648 11.2167 9.88648L11.3636 10.2933C11.1602 10.4278 11.2001 10.5825 11.2446 10.7553C11.2632 10.8274 11.2825 10.9027 11.2854 10.9811C11.2996 11.3739 11.5343 11.2923 11.5343 11.2923C11.5489 11.9401 11.8615 12.0252 11.8615 12.0252C11.9202 12.432 11.8838 12.3618 11.8838 12.3618L11.6054 12.3963C11.6092 12.4887 11.6019 12.5813 11.5835 12.672C11.4219 12.7457 11.3229 12.8042 11.2252 12.8619C11.1246 12.9214 11.0254 12.98 10.8604 13.0537C10.232 13.3343 9.54886 13.7007 9.42766 14.193C9.39512 14.3251 9.34534 14.5617 9.28982 14.8373ZM16.6009 14.86C17.5258 14.806 18.3408 14.7254 18.9595 14.6151C18.9386 14.1847 18.9145 13.6995 18.914 13.693C18.914 13.693 18.7709 13.3189 18.5442 13.2808C18.3191 13.2516 18.1018 13.1789 17.9044 13.0667C17.774 12.9895 17.6364 12.925 17.4936 12.8744C17.4204 12.8085 17.3637 12.7264 17.328 12.6346C17.253 12.5391 17.1543 12.4647 17.0416 12.419L17.0333 12.1321L17.6255 11.9429C17.6255 11.9429 17.7783 11.8703 17.7932 11.8703C17.7695 11.8198 17.7422 11.7709 17.7115 11.7242C17.7003 11.6937 17.6445 11.4845 17.6445 11.4845C17.7308 11.5974 17.8324 11.6977 17.9463 11.7826C17.8454 11.59 17.7591 11.39 17.6881 11.1845C17.6406 10.9942 17.6075 10.8007 17.5893 10.6053C17.5486 10.2425 17.4853 9.88251 17.3997 9.52753C17.3388 9.35114 17.2304 9.195 17.0864 9.07631C16.8754 8.92651 16.6276 8.8367 16.3696 8.81641H16.3399C16.0819 8.83662 15.8342 8.92644 15.6231 9.07631C15.4793 9.19514 15.371 9.35125 15.31 9.52753C15.2242 9.88246 15.1609 10.2425 15.1202 10.6053C15.1046 10.805 15.0731 11.0031 15.0262 11.1978C14.9551 11.3996 14.8672 11.5952 14.7634 11.7825C14.8767 11.6971 15.0035 11.4835 15.0035 11.4835C15.0035 11.4835 14.9918 11.7131 14.9804 11.7437C14.9543 11.7834 14.9323 11.8256 14.9149 11.8697C14.9296 11.8697 15.0825 11.9423 15.0825 11.9423L15.6746 12.1321L15.6661 12.419C15.5535 12.4649 15.3162 12.6391 15.2754 12.6955C15.8148 12.9192 16.3102 13.3665 16.323 13.7329C16.3255 13.7515 16.3539 13.8629 16.3938 14.0188C16.4536 14.2532 16.5393 14.5883 16.6009 14.86Z" fill="#A8ADB4"/></svg>',
					componentId: 'calendar',
					componentParams: {
						showLocation: true,
						isLocked: !this.#isLocationFeatureEnabled()
					},
					hidden: !this.#canUseAddressBlock() || !this.#canUseCalendarBlock()
				}, {
					type: 'delimiter',
					hidden: !this.#canUseAddressBlock() || !this.#canUseCalendarBlock()
				}, {
					id: 'link',
					messageCode: 'CRM_ACTIVITY_TODO_ACTIONS_LINK',
					svgData: '<svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M16.4859 14.0353L17.7859 15.3353C18.5909 16.1402 18.5914 17.4575 17.7865 18.2624C16.9815 19.0674 15.6637 19.0674 14.8588 18.2624L13.5588 16.9624C12.9846 16.3883 12.8287 15.5561 13.0731 14.8323L13.474 15.2332C13.8267 15.586 14.4045 15.587 14.7578 15.2338C15.111 14.8805 15.1105 14.3022 14.7578 13.9494L14.3569 13.5485C15.0802 13.3046 15.9118 13.4611 16.4859 14.0353ZM7.27004 10.6737L5.97001 9.37368C5.16509 8.56875 5.16561 7.25145 5.97054 6.44652C6.77547 5.64159 8.09224 5.64159 8.89717 6.44652L10.1972 7.74655C10.7713 8.32068 10.9283 9.15282 10.6839 9.87558L10.047 9.23865C9.69373 8.88538 9.11594 8.88538 8.76267 9.23865C8.4094 9.59192 8.40992 10.1692 8.76319 10.5225L9.40012 11.1594C8.67684 11.4043 7.84417 11.2478 7.27004 10.6737ZM11.4334 6.67575L9.96797 5.21034C8.52873 3.7711 6.1736 3.7711 4.73436 5.21034C3.29512 6.64959 3.29512 9.00471 4.73436 10.444L6.19977 11.9094C7.41658 13.1262 9.28184 13.302 10.7022 12.4615L11.7715 13.5307C10.9304 14.9506 11.1068 16.8164 12.3231 18.0327L13.789 19.4986C15.2283 20.9379 17.5834 20.9379 19.0226 19.4986C20.4619 18.0594 20.4619 15.7043 19.0226 14.265L17.5567 12.7991C16.3404 11.5828 14.4746 11.4064 13.0553 12.2469L11.9861 11.1777C12.826 9.75783 12.6502 7.89257 11.4334 6.67575Z" fill="#A8ADB4"/></svg>'
				}, {
					id: 'file',
					messageCode: 'CRM_ACTIVITY_TODO_ACTIONS_FILE',
					svgData: '<svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M18.6123 10.7026C18.7309 10.8212 18.7309 11.0135 18.6123 11.1321L17.8165 11.9279C17.6979 12.0465 17.5056 12.0465 17.387 11.9279L12.7007 7.24153C11.3529 5.89374 9.14743 5.89374 7.79963 7.24153C6.45184 8.58932 6.45184 10.7948 7.79963 12.1426L13.5486 17.8916C14.3938 18.7368 15.7665 18.7368 16.6118 17.8916C17.457 17.0463 17.457 15.6736 16.6118 14.8284L11.4754 9.69206C11.1323 9.34889 10.5933 9.34889 10.2502 9.69206C9.90699 10.0352 9.90699 10.5742 10.2502 10.9173L14.3239 14.991C14.4425 15.1096 14.4425 15.3019 14.3239 15.4205L13.5281 16.2163C13.4095 16.3349 13.2172 16.3349 13.0986 16.2163L9.0249 12.1426C8.00783 11.1255 8.00783 9.48386 9.0249 8.46679C10.042 7.44973 11.6836 7.44973 12.7007 8.46679L17.837 13.6031C19.3561 15.1222 19.3561 17.5977 17.837 19.1168C16.3179 20.6359 13.8424 20.6359 12.3233 19.1168L6.57437 13.3679C4.55268 11.3462 4.55268 8.03795 6.57437 6.01626C8.59606 3.99458 11.9043 3.99458 13.926 6.01626L18.6123 10.7026Z" fill="#A8ADB4"/></svg>'
				}];
				this.#prepareActionItems(items);
				this.#actionsPopup = new ActionsPopup(items);
			}
			return this.#actionsPopup;
		}
		#prepareActionItems(items) {
			items.forEach(item => {
				// eslint-disable-next-line no-param-reassign
				item.hidden = item.id && this.#hiddenActionItems.includes(item.id) || item.hidden;
			});
		}
		#bindEvents(params) {
			this.#eventEmitter = new main_core_events.EventEmitter();
			this.#eventEmitter.setEventNamespace('Crm.Activity.TodoEditor');
			if (main_core.Type.isObject(params.events)) {
				Object.keys(params.events).forEach(eventName => {
					if (main_core.Type.isFunction(params.events[eventName])) {
						this.#eventEmitter.subscribe(eventName, params.events[eventName]);
					}
				});
			}
			main_core_events.EventEmitter.subscribe(Events.EVENT_UPDATE_CLICK, this.onUpdateHandler);
			main_core_events.EventEmitter.subscribe(Events.EVENT_REPEAT_CLICK, this.onRepeatHandler);
		}
		async onUpdateHandler(event) {
			const canShowPrefilledComponent = await this.#canShowPrefilledComponent();
			if (!canShowPrefilledComponent) {
				return;
			}
			const menuBar = BX.Crm?.Timeline?.MenuBar?.getDefault();
			if (!menuBar) {
				return;
			}
			menuBar.setActiveItemById('todo');
			const {
				entityData,
				blocksData
			} = await this.#getUpdateOrRepeatActionData(event.getData());
			this.setActivityId(entityData.id).setCurrentUser(entityData.currentUser);
			await this.#showPrefilledComponent(entityData, blocksData, TodoEditorMode.UPDATE);
		}
		async #canShowPrefilledComponent() {
			if (main_core.Dom.hasClass(this.#container, '--is-edit')) {
				return new Promise(resolve => {
					ui_notification.UI.Dialogs.MessageBox.show({
						modal: true,
						title: main_core.Loc.getMessage('CRM_ACTIVITY_TODO_CONFIRM_DIALOG_TITLE'),
						message: main_core.Loc.getMessage('CRM_ACTIVITY_TODO_CONFIRM_DIALOG_MESSAGE'),
						buttons: BX.UI.Dialogs.MessageBoxButtons.OK_CANCEL,
						okCaption: main_core.Loc.getMessage('CRM_ACTIVITY_TODO_CONFIRM_DIALOG_OK_BUTTON'),
						onOk: messageBox => {
							resolve(true);
							messageBox.close();
						},
						onCancel: messageBox => {
							resolve(false);
							messageBox.close();
						}
					});
				});
			}
			return Promise.resolve(true);
		}
		async onRepeatHandler(event) {
			const canShowPrefilledComponent = await this.#canShowPrefilledComponent();
			if (!canShowPrefilledComponent) {
				return;
			}
			const {
				entityData,
				blocksData
			} = await this.#getUpdateOrRepeatActionData(event.getData());
			this.#setActiveMenuBarItem();
			this.setActivityId(null).setCurrentUser(entityData.currentUser).setDefaultDeadLine();
			entityData.deadline = this.#deadline;
			// a copy is not linked to the source calendar event, so its deadline is always editable
			entityData.canChangeDeadline = true;
			const calendar = blocksData?.find(blockData => blockData.id === 'calendar');
			if (main_core.Type.isObject(calendar)) {
				prepareCalendarBlockForCopy(calendar, this.#user.userId, this.#deadline.getTime());
			}
			await this.#showPrefilledComponent(entityData, blocksData, TodoEditorMode.COPY);
		}
		#setActiveMenuBarItem() {
			const menuBar = BX.Crm?.Timeline?.MenuBar?.getDefault();
			if (menuBar) {
				menuBar.setActiveItemById('todo');
			}
		}
		async #getUpdateOrRepeatActionData(data) {
			const {
				activityId,
				ownerTypeId,
				ownerId
			} = data;
			const {
				data: {
					entityData,
					blocksData
				}
			} = await this.#fetchSettings({
				id: activityId,
				ownerTypeId,
				ownerId
			});
			return {
				entityData,
				blocksData
			};
		}
		async #showPrefilledComponent(entityData, blocksData, mode = TodoEditorMode.ADD) {
			await this.#initLayoutComponentForEdit(entityData, blocksData);
			this.getTextEditor().expand();
			this.#scrollToTop();
			this.setMode(mode);
			this.setFocused();
		}
		async #initLayoutComponentForEdit(entityData, blocksData) {
			return new Promise(resolve => {
				void this.#clearValue().then(() => {
					this.#layoutComponent.setData(entityData);
					blocksData.forEach(({
						id,
						data
					}) => {
						if (main_core.Type.isBoolean(data.active) && data.active === false) {
							return;
						}
						this.#layoutComponent.setBlockFilledValues(id, data);
						this.#layoutComponent.setBlockActive(id);
					});
					resolve();
				});
			});
		}
		#scrollToTop() {
			window.scrollTo({
				top: 0,
				behavior: 'smooth'
			});
		}
		async #fetchSettings({
			id,
			ownerId,
			ownerTypeId
		}) {
			const data = {
				id,
				ownerId,
				ownerTypeId
			};
			return new Promise(resolve => {
				main_core.ajax.runAction(this.#getConfigActionPath(), {
					data
				}).then(resolve).catch(errors => {
					console.error(errors);
				});
			});
		}
		#getConfigActionPath() {
			return 'crm.activity.todo.fetchSettings';
		}
		save() {
			if (this.#loadingPromise) {
				return this.#loadingPromise;
			}

			// wrap BX.Promise in native js promise
			this.#loadingPromise = new Promise((resolve, reject) => {
				this.#getSaveActionData().then(data => {
					const analytics = this.#getAnalyticsLabel(data);
					main_core.ajax.runAction(this.#getSaveActionPath(), {
						data,
						analytics
					}).then(response => {
						this.#currentUser = this.#user;
						resolve(response);
					}).catch(reject);
				}).catch(reject);
			}).catch(response => {
				ui_notification.UI.Notification.Center.notify({
					content: response.errors[0].message,
					autoHideDelay: 5000
				});

				// so that on error returned promise is marked as rejected
				throw response;
			}).finally(() => {
				this.#loadingPromise = null;
			});
			return this.#loadingPromise;
		}
		#getSaveActionData() {
			return new Promise(resolve => {
				void this.#getSaveActionDataSettings().then(settings => {
					const userData = this.#layoutComponent.getData();
					const data = {
						ownerTypeId: this.#ownerTypeId,
						ownerId: this.#ownerId,
						title: userData.title,
						description: userData.description,
						responsibleId: userData.responsibleUserId,
						deadline: main_date.DateTimeFormat.format(crm_timeline_tools.DatetimeConverter.getSiteDateTimeFormat(), userData.deadline),
						parentActivityId: this.#parentActivityId,
						settings,
						pingOffsets: userData.pingOffsets,
						colorId: userData.colorId,
						isCalendarSectionChanged: userData.isCalendarSectionChanged
					};
					if (this.#mode === TodoEditorMode.UPDATE) {
						data.id = this.#activityId;
					} else if (this.#mode === TodoEditorMode.COPY) {
						data.isCopy = true;
					}
					resolve(data);
				});
			});
		}
		#getSaveActionPath() {
			return this.#mode === TodoEditorMode.UPDATE ? 'crm.activity.todo.update' : 'crm.activity.todo.add';
		}
		#getSaveActionDataSettings() {
			const result = this.#layoutComponent.getExecutedBlocksData();
			return Promise.resolve(result);
		}
		#getAnalyticsLabel(data) {
			const analyticsLabel = this.#getAnalyticsInstance();
			if (analyticsLabel === null) {
				return null;
			}
			const isNew = main_core.Type.isNil(data.id);
			analyticsLabel.setEvent(isNew ? EventIds.activityCreate : EventIds.activityEdit).setElement(isNew ? ElementIds.createButton : ElementIds.editButton);

			// eslint-disable-next-line no-param-reassign
			data = main_core.Runtime.clone(data);
			const pingOffsets = data.pingOffsets.map(value => Number(value));
			const defaultOffsets = this.#pingSettings.selectedValues;
			if (JSON.stringify(pingOffsets) !== JSON.stringify(defaultOffsets)) {
				analyticsLabel.setPingSettings(data.pingOffsets.join(','));
			}
			const defaultColorId = 'default';
			if (data.colorId !== defaultColorId) {
				analyticsLabel.setColorId(data.colorId);
			}
			const blockTypes = [];
			const calendarBlockId = TodoEditorBlocksCalendar.methods.getId();
			data.settings.forEach(block => {
				if (data.isCalendarSectionChanged && block.id === calendarBlockId) {
					blockTypes.push('section_calendar');
				} else {
					blockTypes.push(block.id);
				}
			});
			if (main_core.Type.isArrayFilled(blockTypes)) {
				analyticsLabel.setBlockTypes(blockTypes);
			}
			if (this.#defaultTitle !== data.title) {
				analyticsLabel.setIsTitleChanged();
			}
			if (this.#defaultDescription !== data.description && main_core.Type.isStringFilled(data.description)) {
				analyticsLabel.setIsDescriptionChanged();
			}
			return analyticsLabel.getData();
		}
		#getBlocks() {
			const blocks = [];
			if (this.#canUseCalendarBlock()) {
				blocks.push(this.#getCalendarBlockSettings());
			}
			blocks.push(this.#getClientBlockSettings(), this.#getLinkBlockSettings(), this.#getFileBlockSettings());
			if (this.#canUseAddressBlock()) {
				blocks.push(this.#getAddressBlockSettings());
			}
			return blocks;
		}
		#getCalendarBlockSettings() {
			return {
				id: TodoEditorBlocksCalendar.methods.getId(),
				title: main_core.Loc.getMessage('CRM_ACTIVITY_TODO_CALENDAR_BLOCK_TITLE'),
				icon: 'crm-activity__todo-editor-v2_calendar-icon.svg',
				settings: this.#calendarSettings
			};
		}
		#getClientBlockSettings() {
			return {
				id: TodoEditorBlocksClient.methods.getId(),
				title: main_core.Loc.getMessage('CRM_ACTIVITY_TODO_CLIENT_BLOCK_TITLE'),
				icon: 'crm-activity__todo-editor-v2_client-icon-v2.svg',
				settings: {
					entityTypeId: this.#ownerTypeId,
					entityId: this.#ownerId
				}
			};
		}
		#getLinkBlockSettings() {
			return {
				id: TodoEditorBlocksLink.methods.getId(),
				title: main_core.Loc.getMessage('CRM_ACTIVITY_TODO_LINK_BLOCK_TITLE'),
				icon: 'crm-activity__todo-editor-v2_link-icon-v2.svg'
			};
		}
		#getFileBlockSettings() {
			return {
				id: TodoEditorBlocksFile.methods.getId(),
				title: main_core.Loc.getMessage('CRM_ACTIVITY_TODO_FILE_BLOCK_TITLE'),
				icon: 'crm-activity__todo-editor-v2_file-icon.svg',
				settings: {
					entityTypeId: this.#ownerTypeId,
					entityId: this.#ownerId
				}
			};
		}
		#getAddressBlockSettings() {
			return {
				id: TodoEditorBlocksAddress.methods.getId(),
				title: main_core.Loc.getMessage('CRM_ACTIVITY_TODO_ADDRESS_BLOCK_TITLE'),
				icon: 'crm-activity__todo-editor-v2_address-icon-v2.svg',
				settings: {
					entityTypeId: this.#ownerTypeId,
					entityId: this.#ownerId
				}
			};
		}
		#canUseAddressBlock() {
			const settings = main_core.Extension.getSettings('crm.activity.todo-editor-v2');
			return settings?.canUseAddressBlock === true;
		}
		#canUseCalendarBlock() {
			const settings = main_core.Extension.getSettings('crm.activity.todo-editor-v2');
			return settings?.canUseCalendarBlock === true;
		}
		getDeadline() {
			return this.#layoutComponent?.getData().deadline ?? null;
		}
		getDescription() {
			return this.getTextEditor().getText();
		}
		setParentActivityId(activityId) {
			this.#parentActivityId = activityId;
			return this;
		}
		setActivityId(activityId) {
			this.#activityId = activityId;
			return this;
		}
		setCurrentUser(currentUser) {
			this.#currentUser = currentUser;
			return this;
		}
		setDeadline(deadLine) {
			const value = main_date.DateTimeFormat.parse(deadLine);
			if (main_core.Type.isDate(value)) {
				this.#layoutComponent.setDeadline(value);
				this.#deadline = value;
			}
			return this;
		}
		setDefaultDeadLine(isNeedUpdateLayout = true) {
			// eslint-disable-next-line @bitrix24/bitrix24-rules/no-bx
			const defaultDate = BX.parseDate(main_core.Loc.getMessage('CRM_TIMELINE_TODO_EDITOR_DEFAULT_DATETIME'));
			if (main_core.Type.isDate(defaultDate)) {
				this.#deadline = defaultDate;
			} else {
				this.#deadline = new Date();
				this.#deadline.setMinutes(0);
				this.#deadline.setTime(this.#deadline.getTime() + 60 * 60 * 1000); // next hour
			}
			if (isNeedUpdateLayout) {
				this.#layoutComponent.setDeadline(this.#deadline);
			}
			return this;
		}
		setFocused() {
			this.getTextEditor().focus(null, {
				defaultSelection: 'rootEnd'
			});
		}
		setDescription(description) {
			this.getTextEditor().setText(description);
			return this;
		}
		cancel(params = {}) {
			const animateCollapse = this.#shouldAnimateCollapse();
			if (params?.sendAnalytics === false) {
				this.getTextEditor().collapse(animateCollapse);
				return this.#clearValue();
			}
			const data = this.#analytics?.getData();
			this.sendAnalyticsCancelEvent({
				...data,
				...params?.analytics
			});
			this.getTextEditor().collapse(animateCollapse);
			return this.#clearValue();
		}
		sendAnalyticsCancelEvent(params) {
			const analytics = this.#getAnalyticsInstance(params);
			if (analytics === null) {
				return;
			}
			analytics.setEvent(EventIds.activityCancel).setElement(ElementIds.cancelButton);
			const subSection = params?.subSection;
			if (main_core.Type.isStringFilled(subSection)) {
				analytics.setSubSection(subSection);
			}
			const element = params?.element;
			if (main_core.Type.isStringFilled(element)) {
				analytics.setElement(element);
			}
			const notificationSkipPeriod = params?.notificationSkipPeriod;
			if (main_core.Type.isStringFilled(notificationSkipPeriod)) {
				analytics.setNotificationSkipPeriod(notificationSkipPeriod);
			}
			analytics.send();
		}
		#getAnalyticsInstance(data = null) {
			// eslint-disable-next-line no-param-reassign
			data = data ?? this.#analytics?.getData();
			if (!data) {
				return null;
			}
			return new Analytics(data.c_section, data.c_sub_section);
		}
		#clearValue() {
			this.#parentActivityId = null;
			return this.#clearData();
		}
		resetToDefaults() {
			this.setDescription(this.#getDefaultDescription());
			this.getTextEditor().collapse(this.#shouldAnimateCollapse());
			return this.#clearData();
		}
		#shouldAnimateCollapse() {
			const menuBar = BX.Crm?.Timeline?.MenuBar?.getDefault();
			return menuBar && menuBar.getFirstItemIdWithLayout() === 'todo';
		}
		#clearData() {
			this.#currentUser = this.#user;
			this.setDefaultDeadLine();
			this.setMode(TodoEditorMode.ADD);
			this.#layoutComponent.resetTitleAndDescription();
			this.#layoutComponent.resetPingOffsetsToDefault();
			this.#layoutComponent.resetResponsibleUserToDefault(this.#currentUser);
			this.#layoutComponent.resetColorSelectorToDefault();
			this.#layoutComponent.resetCurrentActivityId();
			main_core.Dom.removeClass(this.#container, '--is-edit');
			this.#layoutComponent.closeBlocks();
			return new Promise(resolve => {
				setTimeout(resolve, 10);
			});
		}
		#getDefaultTitle() {
			return main_core.Loc.getMessage('CRM_ACTIVITY_TODO_ADD_TITLE_DEFAULT');
		}
		#getDefaultDescription() {
			let messagePhrase = 'CRM_ACTIVITY_TODO_NOTIFICATION_DEFAULT_TEXT';
			if (this.#ownerTypeId === BX.CrmEntityType.enumeration.deal) {
				messagePhrase = 'CRM_ACTIVITY_TODO_NOTIFICATION_DEFAULT_TEXT_DEAL';
			}
			return main_core.Loc.getMessage(messagePhrase);
		}
		#onInputFocus() {
			main_core.Dom.addClass(this.#container, '--is-edit');
			this.#eventEmitter.emit('onFocus');
		}
		#onSaveHotkeyPressed() {
			this.#eventEmitter.emit('onSaveHotkeyPressed');
		}
		#isValidBorderColor(borderColor) {
			return main_core.Type.isString(borderColor) && TodoEditorV2.BorderColor[borderColor.toUpperCase()];
		}
		#getClassname() {
			return `crm-activity__todo-editor-v2 --border-${this.#borderColor}`;
		}
		#isLocationFeatureEnabled() {
			return main_core.Extension.getSettings('crm.activity.todo-editor-v2').get('locationFeatureEnabled');
		}
	}

	exports.TodoEditorMode = TodoEditorMode;
	exports.TodoEditorV2 = TodoEditorV2;

})(this.BX.Crm.Activity = this.BX.Crm.Activity || {}, BX.Crm.AI, BX.Crm.Timeline, BX, BX.Event, BX.Main, BX.UI.Notification, BX.UI.TextEditor, BX.Vue3, BX.Main, BX.UI, BX.UI.Analytics, BX.Location.Core, BX.Location.Widget, BX.Calendar.Controls, BX.Calendar, BX.Calendar, window, BX.UI.EntitySelector, BX.UI.System.Alert, BX.UI.System.Alert.Vue, BX.Calendar, BX, BX.Crm, BX.UI.Uploader, BX.Crm.Field, BX.Vue3.Directives, BX.Crm.Field);
//# sourceMappingURL=todo-editor-v2.bundle.js.map
