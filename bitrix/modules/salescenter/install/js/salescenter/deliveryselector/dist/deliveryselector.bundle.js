/* eslint-disable */
this.BX = this.BX || {};
(function (exports, ui_vue, main_core, salescenter_manager, ui_ears, location_core, location_widget, ui_notification, main_popup, salescenter_component_stageBlock_hint) {
	'use strict';

	var StringControl = {
		props: {
			name: {
				type: String,
				required: true
			},
			initValue: {
				required: false
			},
			settings: {
				required: false
			},
			options: {
				required: false
			}
		},
		created() {
			this.value = this.initValue;
		},
		data() {
			return {
				value: null
			};
		},
		methods: {
			onInput(event) {
				this.value = event.target.value;
				this.$emit('change', this.value);
			}
		},
		computed: {
			isMultiline() {
				return this.settings && this.settings.MULTILINE === 'Y';
			}
		},
		template: `
		<div class="ui-ctl ui-ctl-w100">
			<textarea v-if="isMultiline" @input="onInput" :name="name" class="ui-ctl-element salescenter-delivery-comment-textarea" rows="1">{{value}}</textarea>
			<input v-else @input="onInput" type="text" :name="name" :value="value" class="ui-ctl-element ui-ctl-textbox" />
		</div>					
	`
	};

	let handleOutsideClick;
	var ClosableDirective = {
		bind(el, binding, vnode) {
			handleOutsideClick = e => {
				if (e.type === 'mousedown' && e.which !== 1) {
					return;
				}
				e.stopPropagation();
				const {
					handler,
					exclude
				} = binding.value;
				let clickedOnExcludedEl = false;
				exclude.forEach(refName => {
					if (!clickedOnExcludedEl) {
						const excludedEl = vnode.context.$refs[refName];
						if (excludedEl) {
							clickedOnExcludedEl = excludedEl.contains(e.target);
						}
					}
				});

				/**
				 * Click inside map wrapper
				 */
				if (e.target.closest('.location-map-wrapper')) {
					clickedOnExcludedEl = true;
				}
				if (!el.contains(e.target) && !clickedOnExcludedEl) {
					vnode.context[handler]();
				}
			};
			document.addEventListener('mousedown', handleOutsideClick);
			document.addEventListener('touchstart', handleOutsideClick);
		},
		unbind() {
			document.removeEventListener('mousedown', handleOutsideClick);
			document.removeEventListener('touchstart', handleOutsideClick);
		}
	};

	var AddressControl = {
		directives: {
			closable: ClosableDirective
		},
		props: {
			name: {
				type: String,
				required: true
			},
			initValue: {},
			settings: {},
			options: {
				required: false
			},
			isStartMarker: {
				type: Boolean,
				required: true
			}
		},
		data() {
			return {
				value: null,
				enterTookPlace: false,
				rightIcon: null,
				isEntering: false,
				isLoading: false,
				editMode: false,
				addressWidgetState: null,
				enteredAddresses: []
			};
		},
		methods: {
			switchToEditMode() {
				this.showMap();
				this.editMode = true;
			},
			clarifyAddress() {
				setTimeout(() => {
					this.$refs['input-node'].focus();
					this.$refs['input-node'].click();
					this.$refs['input-node'].click();
				}, 0);
			},
			clearAddress() {
				this.addressWidget.address = null;
				this.changeValue(null);
				this.clarifyAddress();
			},
			onControlClicked() {
				this.closeMap();
			},
			onControlFocus() {
				this.enterTookPlace = true;
				this.isEntering = true;
			},
			onControlBlur() {
				setTimeout(() => {
					this.isEntering = false;
				}, 200);
				this.editMode = false;
				this.closeMap();
			},
			changeValue(newValue) {
				this.value = newValue;
				this.syncRightIcon();
				this.$emit('change', this.value);
				if (this.onChangeCallback) {
					this.onChangeCallback();
				}
			},
			syncRightIcon() {
				if (this.$refs['input-node'].value.length === 0) {
					this.rightIcon = 'search';
				} else {
					this.rightIcon = 'clear';
				}
			},
			buildAddress(value) {
				try {
					return new BX.Location.Core.Address(JSON.parse(value));
				} catch (e) {
					return null;
				}
			},
			isValueValid(value) {
				return value && value.latitude && value.longitude && !(value.latitude === '0' && value.longitude === '0');
			},
			getPresetLocationsProvider() {
				return () => {
					let result = this.options && this.options.hasOwnProperty('defaultItems') ? this.options.defaultItems.map(item => new location_core.Location(item)) : [];
					for (let enteredAddress of this.enteredAddresses) {
						let location = enteredAddress.toLocation();
						if (!location) {
							continue;
						}
						location.name = BX.Location.Core.AddressStringConverter.convertAddressToString(enteredAddress, this.addressWidget.addressFormat, BX.Location.Core.AddressStringConverter.STRATEGY_TYPE_FIELD_TYPE, BX.Location.Core.AddressStringConverter.CONTENT_TYPE_TEXT);
						result.push(location);
					}
					return result.filter((location, index, self) => index === self.findIndex(l => l.name === location.name));
				};
			},
			/**
			 * Map Feature Methods
			 */
			getMap() {
				if (!this.addressWidget) {
					return null;
				}
				for (let feature of this.addressWidget.features) {
					if (feature instanceof BX.Location.Widget.MapFeature) {
						return feature;
					}
				}
				return null;
			},
			showMap() {
				let map = this.getMap();
				if (map) {
					map.showMap();
				}
			},
			closeMap() {
				let map = this.getMap();
				if (map) {
					map.closeMap();
				}
			}
		},
		computed: {
			addressFormatted() {
				if (!this.value || !this.addressWidget) {
					return '';
				}
				let address = this.buildAddress(this.value);
				if (!address) {
					return '';
				}
				return address.toString(this.addressWidget.addressFormat, BX.Location.Core.AddressStringConverter.STRATEGY_TYPE_FIELD_SORT);
			},
			isEditMode() {
				return this.editMode || !this.value;
			},
			wrapperClass() {
				return {
					'ui-ctl': true,
					'ui-ctl-w100': true,
					'sale-address-control-top-margin-5 sale-address-control-top-margin-width-820': this.isEditMode
				};
			},
			mapMarkerClass() {
				return {
					'salescenter-delivery-path-icon': true,
					'salescenter-delivery-path-icon--green': !this.isStartMarker
				};
			},
			rightIconClass() {
				return {
					'ui-ctl-after': true,
					'ui-ctl-icon-btn': true,
					'ui-ctl-icon-search': this.rightIcon === 'search',
					'ui-ctl-icon-clear': this.rightIcon === 'clear'
				};
			},
			needsClarification() {
				return !this.isEntering && this.enterTookPlace && !this.value && this.addressWidgetState !== location_widget.State.DATA_LOADING;
			},
			localize() {
				return ui_vue.Vue.getFilteredPhrases('SALE_DELIVERY_SERVICE_SELECTOR_');
			}
		},
		mounted() {
			if (this.initValue) {
				let initValue = null;
				let address = JSON.parse(this.initValue);
				if (this.isValueValid(address)) {
					initValue = this.initValue;
				} else {
					/**
					 * Simulate invalid input
					 */
					this.isEntering = false;
					this.enterTookPlace = true;
				}
				this.changeValue(initValue);
			}
			this.addressWidget = new BX.Location.Widget.Factory().createAddressWidget({
				address: this.initValue ? this.buildAddress(this.initValue) : null,
				mode: BX.Location.Core.ControlMode.edit,
				mapBehavior: 'manual',
				useFeatures: {
					fields: false,
					map: true,
					autocomplete: true
				},
				popupOptions: {
					offsetLeft: 14
				},
				popupBindOptions: {
					forceBindPosition: true
				},
				presetLocationsProvider: this.getPresetLocationsProvider()
			});

			/**
			 * Redefine native onInputKeyup
			 */
			const nativeOnInputKeyup = this.addressWidget.onInputKeyup;
			this.addressWidget.onInputKeyup = e => {
				switch (e.code) {
					case 'Enter':
					case 'NumpadEnter':
						return;
				}
				nativeOnInputKeyup.call(this.addressWidget, e);
			};

			/**
			 * Subscribe to widget events
			 */
			this.addressWidget.subscribeOnAddressChangedEvent(event => {
				let data = event.getData();
				this.editMode = true;
				let address = data.address;
				if (!this.isValueValid(address)) {
					this.changeValue(null);
				} else {
					this.enteredAddresses.push(address);
					this.changeValue(address.toJson());
					this.showMap();
				}
			});
			this.addressWidget.subscribeOnStateChangedEvent(event => {
				let data = event.getData();
				this.addressWidgetState = data.state;
				if (data.state === location_widget.State.DATA_INPUTTING) {
					this.changeValue(null);
					this.closeMap();
				} else if (data.state === location_widget.State.DATA_LOADING) {
					this.isLoading = true;
				} else if (data.state === location_widget.State.DATA_LOADED) {
					this.isLoading = false;
				}
			});
			this.addressWidget.subscribeOnFeatureEvent(event => {
				let data = event.getData();
				if (data.feature instanceof location_widget.AutocompleteFeature) {
					if (data.eventCode === location_widget.AutocompleteFeature.searchStartedEvent) {
						this.isLoading = true;
					} else if (data.eventCode === location_widget.AutocompleteFeature.searchCompletedEvent) {
						this.isLoading = false;
					}
				}
			});
			this.addressWidget.subscribeOnErrorEvent(event => {
				let data = event.getData();
				let errors = data.errors;
				let errorMessage = errors.map(error => error.message + (error.code.length ? `${error.code}` : '')).join(', ');
				this.isLoading = false;
				BX.UI.Notification.Center.notify({
					content: errorMessage
				});
			});

			/**
			 * Render widget
			 */
			this.addressWidget.render({
				inputNode: this.$refs['input-node'],
				autocompleteMenuElement: this.$refs['autocomplete-menu'],
				mapBindElement: this.$refs['map-marker'],
				controlWrapper: this.$refs['autocomplete-menu']
			});
			this.syncRightIcon();
		},
		template: `
		<div class="salescenter-delivery-path-control">
			<div ref="map-marker" :class="mapMarkerClass"></div>
				<div
					v-closable="{
						exclude: ['input-node'],
						handler: 'onControlBlur'
					}"
					class="ui-ctl-w100"
				>
					<div :class="wrapperClass">
						<div
							v-show="isEditMode" 
							ref="autocomplete-menu"
							class="sale-address-control-path-input-wrapper"
						>
							<div class="ui-ctl ui-ctl-textbox ui-ctl-after-icon salescenter-address-input-textbox">
								<input
									@click="onControlClicked"
									@focus="onControlFocus"
									ref="input-node"
									type="text"
									class="ui-ctl-element"
									:class="{ '--error': needsClarification }"
								/>
								<div
									v-show="!isLoading"
									@click="clearAddress"
									@mouseover.stop.prevent=""
									:class="rightIconClass"
								></div>
								<div
									v-show="isLoading"
									class="ui-ctl-after ui-ctl-icon-loader"
								></div>
							</div>
							<span
								v-show="needsClarification"
								@mouseover.stop.prevent=""
								@click="clarifyAddress"
								class="sale-address-control-path-input--alert"
							>
								{{localize.SALE_DELIVERY_SERVICE_SELECTOR_CLARIFY_ADDRESS}}
							</span>
						</div>
						<div v-show="!isEditMode" class="sale-address-control-path-input-wrapper">
							<span
								@click="switchToEditMode"
								type="text"
								class="ui-ctl-element ui-ctl-textbox sale-address-control-path-input"
								contenteditable="false"
								v-html="addressFormatted"
							></span>
						</div>
						<input v-model="value" :name="name" type="hidden" />
					</div>
				</div>
			</div>
		</div>
	`
	};

	var CheckboxService = {
		props: {
			name: {
				required: false
			},
			initValue: {
				required: false
			}
		},
		created() {
			this.value = this.initValue;
		},
		data() {
			return {
				value: null
			};
		},
		methods: {
			onChange(event) {
				this.value = event.target.checked ? 'Y' : '';
				this.$emit('change', this.value);
			}
		},
		template: `
		<label class="salescenter-delivery-selector salescenter-delivery-selector--hover salescenter-delivery-selector--checkbox">
			<input @change="onChange" :checked="value == 'Y' ? true : false" type="checkbox" value="Y" />
			<span class="salescenter-delivery-selector-text">{{name}}</span>
		</label>
	`
	};

	var DropdownService = {
		props: {
			name: {
				required: false
			},
			initValue: {
				required: false
			},
			options: {
				required: true,
				type: Array
			}
		},
		created() {
			this.value = this.initValue;
		},
		data() {
			return {
				value: null
			};
		},
		methods: {
			getSelectedItemTitle() {
				let selectedItem = this.getSelectedItem();
				if (!selectedItem || selectedItem.id === 'null') {
					return this.name;
				}
				return selectedItem.title;
			},
			getSelectedItem() {
				for (let option of this.options) {
					if (option.id === this.value) {
						return option;
					}
				}
				return null;
			},
			showPopupMenu(e) {
				let menuItems = [];
				for (let option of this.options) {
					menuItems.push({
						'text': option.title,
						onclick: () => {
							this.value = option.id;
							this.$emit('change', this.value);
							this.popupMenu.close();
						}
					});
				}
				this.popupMenu = new main_popup.Menu({
					bindElement: e.target,
					items: menuItems,
					angle: true,
					closeByEsc: true,
					offsetLeft: 40
				});
				this.popupMenu.show();
			}
		},
		template: `
		<div @click="showPopupMenu($event)" class="salescenter-delivery-selector salescenter-delivery-selector--dropdown">
			<span class="salescenter-delivery-selector-text">{{getSelectedItemTitle()}}</span>
		</div>
	`
	};

	const DeliverySelector = {
		components: {
			/**
			 * Properties Control Types
			 */
			'ADDRESS-control': AddressControl,
			'STRING-control': StringControl,
			/**
			 * Extra Services Control Types
			 */
			'checkbox-service': CheckboxService,
			'dropdown-service': DropdownService
		},
		props: {
			initDeliveryServiceId: {
				required: false
			},
			initRelatedServicesValues: {
				required: false
			},
			initRelatedPropsValues: {
				required: false
			},
			initRelatedPropsOptions: {
				required: false
			},
			initResponsibleId: {
				default: null,
				required: false
			},
			initEnteredDeliveryPrice: {
				required: false
			},
			personTypeId: {
				required: true
			},
			action: {
				type: String,
				required: true
			},
			actionData: {
				type: Object,
				required: true
			},
			externalSum: {
				required: true
			},
			externalSumLabel: {
				type: String,
				required: true
			},
			currency: {
				type: String,
				required: true
			},
			currencySymbol: {
				type: String,
				required: true
			},
			availableServices: {
				type: [Object, Array],
				required: true
			},
			excludedServiceIds: {
				type: Array,
				required: true
			}
		},
		data() {
			return {
				/**
				 * Selected Service
				 */
				selectedDeliveryService: null,
				deliveryServices: [],
				/**
				 * Props
				 */
				relatedProps: [],
				relatedPropsOfAddressType: [],
				relatedPropsOfOtherTypes: [],
				relatedPropsValues: {},
				/**
				 * Extra Services
				 */
				relatedServices: [],
				relatedServicesValues: {},
				/**
				 * Prices
				 */
				estimatedDeliveryPrice: null,
				enteredDeliveryPrice: null,
				/**
				 * Responsible User
				 */
				responsibleUser: null,
				/**
				 * Processing Indicators
				 */
				isCalculated: false,
				isCalculating: false,
				calculateErrors: [],
				restrictionsHintPopup: null
			};
		},
		methods: {
			initialize() {
				main_core.ajax.runAction('salescenter.deliveryselector.getinitializationdata', {
					data: {
						personTypeId: this.personTypeId,
						responsibleId: this.initResponsibleId,
						excludedServiceIds: this.excludedServiceIds
					}
				}).then(result => {
					/**
					 * Delivery services
					 */

					this.deliveryServices = result.data.services;
					if (this.deliveryServices.length > 0) {
						let initDeliveryServiceId = this.selectedDeliveryService ? this.selectedDeliveryService.id : this.initDeliveryServiceId ? this.initDeliveryServiceId : null;
						if (initDeliveryServiceId) {
							for (let deliveryService of this.deliveryServices) {
								if (deliveryService.id == initDeliveryServiceId) {
									this.onDeliveryServiceChanged(deliveryService, true);
									break;
								}
								for (let profile of deliveryService.profiles) {
									if (profile.id == initDeliveryServiceId) {
										this.onDeliveryServiceChanged(profile, true);
										break;
									}
								}
							}
						}
					}

					/**
					 * Related props
					 */
					let relatedProps = result.data.properties;

					/**
					 * Setting default values to related props
					 */
					for (let relatedProp of relatedProps) {
						let initValue = null;
						if (this.initRelatedPropsValues && this.initRelatedPropsValues.hasOwnProperty(relatedProp.id)) {
							initValue = this.initRelatedPropsValues[relatedProp.id];
						} else if (relatedProp.initValue) {
							initValue = relatedProp.initValue;
						}
						if (initValue !== null) {
							initValue = typeof initValue === 'object' ? JSON.stringify(initValue) : initValue;
							ui_vue.Vue.set(this.relatedPropsValues, relatedProp.id, initValue);
						}
					}
					this.relatedProps = relatedProps;
					this.relatedPropsOfAddressType = this.relatedProps.filter(item => item.type === 'ADDRESS');
					this.relatedPropsOfOtherTypes = this.relatedProps.filter(item => item.type !== 'ADDRESS');

					/**
					 * Related services
					 */
					let relatedServices = result.data.extraServices;
					for (let relatedService of relatedServices) {
						let initValue = null;
						if (this.initRelatedServicesValues && this.initRelatedServicesValues.hasOwnProperty(relatedService.id)) {
							initValue = this.initRelatedServicesValues[relatedService.id];
						} else if (relatedService.initValue) {
							initValue = relatedService.initValue;
						}
						if (initValue !== null) {
							ui_vue.Vue.set(this.relatedServicesValues, relatedService.id, initValue);
						}
					}
					this.relatedServices = relatedServices;

					/**
					 * Responsible
					 */
					this.responsibleUser = result.data.responsible;

					/**
					 * Misc
					 */
					this._userPageTemplate = result.data.userPageTemplate;
					this._deliverySettingsUrl = result.data.deliverySettingsUrl;

					/**
					 *
					 */
					if (this.initEnteredDeliveryPrice !== null) {
						this.enteredDeliveryPrice = this.initEnteredDeliveryPrice;
					}
					new ui_ears.Ears({
						container: this.$refs['delivery-methods'],
						smallSize: true,
						noScrollbar: true
					}).init();
					this.emitChange();
					this.recalculateRelatedServiceAvailabilities();
				});
			},
			calculate() {
				if (!this.isCalculatingAllowed) {
					return;
				}
				this.isCalculating = true;
				let calculationFinallyCallback = (status, payload) => {
					this.isCalculating = false;
					this.isCalculated = true;
					this.emitChange();
				};
				let actionData = Object.assign({}, this.actionData, {
					deliveryServiceId: this.selectedDeliveryServiceId,
					shipmentPropValues: this.currentRelatedPropsValues,
					deliveryRelatedServiceValues: this.currentRelatedServicesValues,
					deliveryResponsibleId: this.responsibleUser ? this.responsibleUser.id : null
				});
				main_core.ajax.runAction(this.action, {
					data: actionData
				}).then(result => {
					let deliveryPrice = result.data.deliveryPrice;
					this.estimatedDeliveryPrice = deliveryPrice;
					this.enteredDeliveryPrice = deliveryPrice;
					this.calculateErrors = [];
					calculationFinallyCallback();
				}).catch(result => {
					this.estimatedDeliveryPrice = null;
					this.enteredDeliveryPrice = 0.00;
					this.calculateErrors = result.errors.map(item => item.message);
					calculationFinallyCallback();
				});
			},
			openChangeResponsibleDialog(event) {
				let self = this;
				if (typeof this._userEditor === 'undefined') {
					this._userEditor = new BX.Crm.EntityEditorUserSelector();
					this._userEditor.initialize('deliverySelectorUserEditor', {
						callback(item, type, search, bUndeleted) {
							self.responsibleUser = {
								id: type.entityId,
								name: type.name,
								photo: type.avatar
							};
							self.emitChange();
						}
					});
				}
				this._userEditor.open(event.target.parentElement);
			},
			onDeliveryServiceChanged(deliveryService, selfCall = false) {
				if (!this.isServiceAvailable(deliveryService) && !selfCall) {
					return;
				}
				if (!deliveryService.parentId && deliveryService.profiles.length > 0) {
					let firstAvailableProfile;
					for (let profile of deliveryService.profiles) {
						if (this.isServiceAvailable(profile)) {
							firstAvailableProfile = profile;
							break;
						}
					}
					if (firstAvailableProfile) {
						this.onDeliveryServiceChanged(firstAvailableProfile, true);
					} else {
						this.onDeliveryServiceChanged(deliveryService.profiles[0], true);
					}
				} else {
					this.selectedDeliveryService = deliveryService;
					this.emitChange();
					this.emitServiceChanged();
				}
			},
			isNoDeliveryService(service) {
				return service['code'] === 'NO_DELIVERY';
			},
			isServiceAvailable(service) {
				return this.availableServices.hasOwnProperty(service.id);
			},
			isServiceProfitable(service) {
				return service.hasOwnProperty('tags') && Array.isArray(service.tags) && service.tags.includes('profitable');
			},
			onPropValueChanged(event, relatedProp) {
				ui_vue.Vue.set(this.relatedPropsValues, relatedProp.id, event);
				this.emitChange();
				if (relatedProp.isAddressFrom) {
					this.emitAddressFromChanged();
				}
			},
			onServiceValueChanged(event, relatedService) {
				ui_vue.Vue.set(this.relatedServicesValues, relatedService.id, event);
				this.emitChange();
			},
			responsibleUserClicked() {
				salescenter_manager.Manager.openSlider(this.responsibleUserLink);
			},
			emitChange() {
				this.$emit('change', this.state);
			},
			emitAddressFromChanged() {
				this.$emit('address-from-changed');
			},
			emitServiceChanged() {
				this.$emit('delivery-service-changed');
			},
			formatMoney(value) {
				return BX.Currency.currencyFormat(value, this.currency, false);
			},
			isNumber: function (event) {
				event = event ? event : window.event;
				var charCode = event.which ? event.which : event.keyCode;
				if (charCode > 31 && (charCode < 48 || charCode > 57) && charCode !== 46) {
					event.preventDefault();
				} else {
					return true;
				}
				return false;
			},
			getPropValue(relatedProp) {
				if (!this.relatedPropsValues) {
					return null;
				}
				return this.relatedPropsValues.hasOwnProperty(relatedProp.id) ? this.relatedPropsValues[relatedProp.id] : null;
			},
			getPropOptions(relatedProp) {
				if (!this.initRelatedPropsOptions) {
					return null;
				}
				return this.initRelatedPropsOptions.hasOwnProperty(relatedProp.id) ? this.initRelatedPropsOptions[relatedProp.id] : null;
			},
			getPropName(relatedProp) {
				if (relatedProp.isAddressFrom) {
					return main_core.Loc.getMessage('SALE_DELIVERY_SERVICE_SHIPMENT_ADDRESS_FROM_LABEL');
				}
				if (relatedProp.isAddressTo) {
					return main_core.Loc.getMessage('SALE_DELIVERY_SERVICE_SHIPMENT_ADDRESS_TO_LABEL');
				}
				return relatedProp.name;
			},
			getServiceValue(relatedService) {
				if (!this.relatedServicesValues) {
					return null;
				}
				return this.relatedServicesValues.hasOwnProperty(relatedService.id) ? this.relatedServicesValues[relatedService.id] : null;
			},
			onAddMoreClicked() {
				salescenter_manager.Manager.openSlider(this._deliverySettingsUrl).then(() => {
					this.initialize();
					this.$emit('settings-changed');
				});
			},
			getDeliveryServiceById(id) {
				for (let deliveryService of this.deliveryServices) {
					if (deliveryService.id == id) {
						return deliveryService;
					}
				}
				return null;
			},
			isParentDeliveryServiceSelected(deliveryService) {
				if (!this.selectedParentDeliveryService) {
					return false;
				}
				return this.selectedParentDeliveryService.id == deliveryService.id;
			},
			onRestrictionsHintShow(e, profile) {
				this.restrictionsHintPopup = new salescenter_component_stageBlock_hint.Popup();
				this.restrictionsHintPopup.show(e.target, this.buildRestrictionsNode(profile));
			},
			isVisibleProfileRestriction(profile) {
				return profile.restrictions && Array.isArray(profile.restrictions) && profile.restrictions.length > 0;
			},
			buildRestrictionsNode(profile) {
				let restrictionsNodes = profile.restrictions.map(restriction => `<div>${main_core.Text.encode(restriction)}</div>`);
				return main_core.Tag.render`<div>${restrictionsNodes.join('')}</div>`;
			},
			onRestrictionsHintHide(e) {
				if (this.restrictionsHintPopup) {
					this.restrictionsHintPopup.hide();
				}
			},
			isProfileSelected(profile) {
				return this.selectedDeliveryService && this.selectedDeliveryService.id == profile.id && this.isServiceAvailable(profile);
			},
			getProfileClass(profile) {
				return {
					'salescenter-delivery-car-item': true,
					'salescenter-delivery-car-item--selected': this.isProfileSelected(profile),
					'salescenter-delivery-car-item--disabled': !this.isServiceAvailable(profile)
				};
			},
			isRelatedServiceRelevant(relatedService) {
				return relatedService.deliveryServiceIds.includes(this.selectedDeliveryServiceId);
			},
			isRelatedServiceAvailable(relatedService) {
				return relatedService.hasOwnProperty('isAvailable') && relatedService.isAvailable;
			},
			getRelatedServiceStyle(relatedService) {
				return {
					'opacity': this.isRelatedServiceAvailable(relatedService) ? 1 : 0.5,
					'pointer-events': this.isRelatedServiceAvailable(relatedService) ? 'auto' : 'none'
				};
			},
			getProfileLogoStyle(logo) {
				if (!logo) {
					return {};
				}
				return {
					backgroundImage: 'url(' + logo.src + ')',
					backgroundSize: logo.width < 55 ? 'auto' : 'contain'
				};
			},
			recalculateRelatedServiceAvailabilities() {
				for (let i = 0; i < this.relatedServices.length; i++) {
					let relatedService = this.relatedServices[i];
					let isAvailable = false;
					for (let deliveryServiceId of relatedService.deliveryServiceIds) {
						if (this.availableServices.hasOwnProperty(deliveryServiceId)) {
							if (this.availableServices[deliveryServiceId] === null || Array.isArray(this.availableServices[deliveryServiceId]) && this.availableServices[deliveryServiceId].includes(relatedService.id)) {
								isAvailable = true;
								break;
							}
						}
					}
					relatedService.isAvailable = isAvailable;
					ui_vue.Vue.set(this.relatedServices, i, relatedService);
				}
			},
			isSelectorDisabled() {
				return this.$store.getters['orderCreation/isCompilationMode'];
			}
		},
		created() {
			this.initialize();
		},
		watch: {
			enteredDeliveryPrice(value) {
				this.emitChange();
			},
			areProfilesVisible(newValue, oldValue) {
				if (!oldValue && newValue) {
					//uncomment the block belowe to apply the ears plugin to profiles' section
					setTimeout(() => {
						new ui_ears.Ears({
							container: this.$refs['delivery-profiles'],
							smallSize: true,
							noScrollbar: true,
							className: 'salescenter-delivery-ears'
						}).init();
					}, 0);
				}
			},
			isSelectedDeliveryServiceAvailable(newValue, oldValue) {
				if (oldValue && !newValue) {
					this.isCalculated = false;
					this.estimatedDeliveryPrice = null;
					this.enteredDeliveryPrice = 0.00;
				}
			},
			availableServices(newValue) {
				this.recalculateRelatedServiceAvailabilities();
			}
		},
		computed: {
			state() {
				return {
					deliveryServiceId: this.selectedDeliveryServiceId,
					deliveryServiceName: this.selectedDeliveryServiceName,
					deliveryPrice: this.deliveryPrice,
					estimatedDeliveryPrice: this.estimatedDeliveryPrice,
					relatedPropsValues: this.currentRelatedPropsValues,
					relatedServicesValues: this.currentRelatedServicesValues,
					responsibleUser: this.responsibleUser
				};
			},
			selectedDeliveryServiceId() {
				return this.selectedDeliveryService ? this.selectedDeliveryService.id : null;
			},
			selectedDeliveryServiceName() {
				if (!this.selectedDeliveryService) {
					return null;
				}
				if (this.selectedParentDeliveryService === this.selectedDeliveryService) {
					return this.selectedDeliveryService.name;
				}
				return this.selectedParentDeliveryService.name + ': ' + this.selectedDeliveryService.name;
			},
			selectedParentDeliveryService() {
				if (!this.selectedDeliveryService) {
					return null;
				}
				return this.selectedDeliveryService.parentId ? this.getDeliveryServiceById(this.selectedDeliveryService.parentId) : this.selectedDeliveryService;
			},
			selectedNoDelivery() {
				return this.selectedDeliveryService && this.isNoDeliveryService(this.selectedDeliveryService);
			},
			isCalculatingAllowed() {
				return this.selectedDeliveryServiceId && this.arePropValuesReady && this.isSelectedDeliveryServiceAvailable && !this.isCalculating;
			},
			currentRelatedPropsValues() {
				let result = [];
				if (!this.selectedDeliveryServiceId) {
					return result;
				}
				for (let relatedProp of this.relatedProps) {
					if (!relatedProp.deliveryServiceIds.includes(this.selectedDeliveryServiceId)) {
						continue;
					}
					if (this.relatedPropsValues.hasOwnProperty(relatedProp.id)) {
						result.push({
							id: relatedProp.id,
							value: this.relatedPropsValues[relatedProp.id]
						});
					}
				}
				return result;
			},
			isResponsibleUserSectionVisible() {
				return this.responsibleUser && !this.selectedNoDelivery;
			},
			responsibleUserLink() {
				if (!this.responsibleUser) {
					return '';
				}
				return this._userPageTemplate.replace('#user_id#', this.responsibleUser.id);
			},
			arePropValuesReady() {
				if (!this.selectedDeliveryServiceId) {
					return false;
				}
				for (let relatedProp of this.relatedProps) {
					if (!relatedProp.deliveryServiceIds.includes(this.selectedDeliveryServiceId)) {
						continue;
					}
					if (relatedProp.required && !this.relatedPropsValues[relatedProp.id]) {
						return false;
					}
				}
				return true;
			},
			currentRelatedServicesValues() {
				let result = [];
				if (!this.selectedDeliveryServiceId) {
					return result;
				}
				for (let relatedService of this.relatedServices) {
					if (!(this.isRelatedServiceRelevant(relatedService) && this.isRelatedServiceAvailable(relatedService))) {
						continue;
					}
					if (this.relatedServicesValues.hasOwnProperty(relatedService.id)) {
						result.push({
							id: relatedService.id,
							value: this.relatedServicesValues[relatedService.id]
						});
					}
				}
				return result;
			},
			totalPrice() {
				let result = this.externalSum;
				if (this.deliveryPrice !== null) {
					result += this.deliveryPrice;
				}
				return result;
			},
			totalPriceFormatted() {
				return this.formatMoney(this.totalPrice);
			},
			deliveryPrice() {
				if (!this.selectedDeliveryServiceId) {
					return null;
				}
				if (this.selectedNoDelivery) {
					return 0;
				}
				if (this.enteredDeliveryPrice) {
					return +this.enteredDeliveryPrice;
				}
				return null;
			},
			deliveryPriceFormatted() {
				return this.formatMoney(this.deliveryPrice);
			},
			estimatedDeliveryPriceFormatted() {
				return this.formatMoney(this.estimatedDeliveryPrice);
			},
			externalSumFormatted() {
				return this.formatMoney(this.externalSum);
			},
			calculateDeliveryPriceButtonClass() {
				return {
					'ui-btn': true,
					'ui-btn-light-border': true,
					'salescenter-delivery-bottom-update-icon': true,
					'ui-btn-disabled': !this.isCalculatingAllowed
				};
			},
			localize() {
				return ui_vue.Vue.getFilteredPhrases('SALE_DELIVERY_SERVICE_SELECTOR_');
			},
			extraServicesCount() {
				let result = 0;
				for (let relatedService of this.relatedServices) {
					if (!this.isRelatedServiceRelevant(relatedService)) {
						continue;
					}
					result++;
				}
				return result;
			},
			relatedPropsOfAddressTypeCount() {
				let result = 0;
				for (let relatedProp of this.relatedPropsOfAddressType) {
					if (!relatedProp.deliveryServiceIds.includes(this.selectedDeliveryServiceId)) {
						continue;
					}
					result++;
				}
				return result;
			},
			relatedPropsOfOtherTypeCount() {
				let result = 0;
				for (let relatedProp of this.relatedPropsOfOtherTypes) {
					if (!relatedProp.deliveryServiceIds.includes(this.selectedDeliveryServiceId)) {
						continue;
					}
					result++;
				}
				return result;
			},
			areProfilesVisible() {
				return this.selectedParentDeliveryService && this.selectedParentDeliveryService.profiles.length > 0;
			},
			selectedParentServiceName() {
				return this.selectedParentDeliveryService ? this.selectedParentDeliveryService.name : '';
			},
			selectedParentServiceProfiles() {
				if (!this.selectedParentDeliveryService) {
					return [];
				}
				return this.selectedParentDeliveryService.profiles;
			},
			isSelectedDeliveryServiceAvailable() {
				return this.selectedDeliveryService && this.isServiceAvailable(this.selectedDeliveryService);
			}
		},
		template: `
		<div
			class="salescenter-delivery"
			:class="{'salescenter-delivery--disabled': isSelectorDisabled()}"
			data-testid="salescenter-delivery-selector"
		>
			<div class="salescenter-delivery-header">
				<div class="salescenter-delivery-car-title--sm">{{localize.SALE_DELIVERY_SERVICE_SELECTOR_DELIVERY_METHOD}}</div>
				<div class="salescenter-delivery-method" ref="delivery-methods">
					<div
						v-for="deliveryService in deliveryServices"
						@click="onDeliveryServiceChanged(deliveryService)"
						:class="{
							'salescenter-delivery-method-item': true,
							'salescenter-delivery-method-item--selected': isParentDeliveryServiceSelected(deliveryService)
						}"
						:data-role="isParentDeliveryServiceSelected(deliveryService) ? 'ui-ears-active' : ''"
						:data-testid="'salescenter-delivery-selector-method-' + deliveryService.id"
					>
						<div class="salescenter-delivery-method-image">
							<img v-if="deliveryService.logo" :src="deliveryService.logo.src">
							<div v-else-if="!isNoDeliveryService(deliveryService)" class="salescenter-delivery-method-image-blank"></div>
						</div>
						<div class="salescenter-delivery-method-info">
							<div v-if="deliveryService.title" class="salescenter-delivery-method-title">{{deliveryService.title}}</div>
							<div v-else="deliveryService.title" class="salescenter-delivery-method-title"></div>
							<div class="salescenter-delivery-method-name">{{deliveryService.name}}</div>
						</div>
					</div>
					<div
						@click="onAddMoreClicked"
						class="salescenter-delivery-method-item salescenter-delivery-method-item--add"
						data-testid="salescenter-delivery-selector-add-more"
					>
						<div class="salescenter-delivery-method-image-more"></div>
						<div class="salescenter-delivery-method-info">
							<div class="salescenter-delivery-method-name">
								{{localize.SALE_DELIVERY_SERVICE_SELECTOR_ADD_MORE}}
							</div>
						</div>
					</div>
				</div>
			</div>
			<div v-show="areProfilesVisible">
				<div class="salescenter-delivery-car-title--sm">{{selectedParentServiceName}}: {{localize.SALE_DELIVERY_SERVICE_SELECTOR_SHIPPING_SERVICES}}</div>
				<div ref="delivery-profiles" class="salescenter-delivery-car salescenter-delivery-car--ya-delivery">
					<div
						v-for="(profile, index) in selectedParentServiceProfiles"
						@click="onDeliveryServiceChanged(profile)"
						:class="getProfileClass(profile)"
						:data-role="selectedDeliveryService.id == profile.id ? 'ui-ears-active' : ''"
					>
						<div v-show="isServiceProfitable(profile)" class="salescenter-delivery-car-lable">
							{{localize.SALE_DELIVERY_SERVICE_SELECTOR_PROFITABLE}}
						</div>
						<div class="salescenter-delivery-car-container">
							<div
								class="salescenter-delivery-car-image"
								:style="getProfileLogoStyle(profile.logo)"
							></div>
							<div class="salescenter-delivery-car-param">
								<div class="salescenter-delivery-car-title">
									{{profile.name}}
									<div
										v-show="isVisibleProfileRestriction(profile)"
										@mouseenter="onRestrictionsHintShow($event, profile)"
										@mouseleave="onRestrictionsHintHide($event)"
										class="salescenter-delivery-car-title-info"
									></div>
								</div>
								<div class="salescenter-delivery-car-info">{{profile.description}}</div>
							</div>
						</div>
					</div>
				</div>
			</div>							
			<div v-show="extraServicesCount > 0" class="salescenter-delivery-additionally">
				<div class="salescenter-delivery-additionally-options">
					<component
						v-for="relatedService in relatedServices"
						v-show="isRelatedServiceRelevant(relatedService)"
						:is="relatedService.type + '-service'"
						:key="relatedService.id"
						:name="relatedService.name"
						:initValue="getServiceValue(relatedService)"						
						:options="relatedService.options"
						:style="getRelatedServiceStyle(relatedService)"
						@change="onServiceValueChanged($event, relatedService)"
					>
					</component>
				</div>
			</div>			
			<div v-show="relatedPropsOfAddressTypeCount > 0" class="salescenter-delivery-path">
				<div
					v-for="(relatedProp, index) in relatedPropsOfAddressType"
					v-show="relatedProp.deliveryServiceIds.includes(selectedDeliveryServiceId)"
					:style="{'margin-bottom': '30px'}"
					class="salescenter-delivery-path-item"
				>
					<div class="salescenter-delivery-path-title">
						{{getPropName(relatedProp)}}
					</div>
					<component
						:is="'ADDRESS-control'"
						:key="relatedProp.id"
						:name="'PROPS_' + relatedProp.id"							
						:initValue="getPropValue(relatedProp)"
						:options="getPropOptions(relatedProp)"
						:isStartMarker="relatedProp.isAddressFrom"
						@change="onPropValueChanged($event, relatedProp)"
					></component>
				</div>
			</div>
			<div v-show="relatedPropsOfOtherTypeCount > 0" class="salescenter-delivery-path --without-bg">
				<div
					v-for="(relatedProp, index) in relatedPropsOfOtherTypes"
					v-show="relatedProp.deliveryServiceIds.includes(selectedDeliveryServiceId)"
					class="salescenter-delivery-path-item"
					:style="{'margin-bottom': '30px'}"
				>
					<div class="salescenter-delivery-path-title-ordinary">{{relatedProp.name}}</div>
					<div class="salescenter-delivery-path-control">
						<component
							:is="relatedProp.type + '-control'"
							:key="relatedProp.id"
							:name="'PROPS_' + relatedProp.id"
							:initValue="getPropValue(relatedProp)"
							:settings="relatedProp.settings"
							:options="getPropOptions(relatedProp)"
							@change="onPropValueChanged($event, relatedProp)"
						></component>
					</div>
				</div>
			</div>
			<div v-if="isResponsibleUserSectionVisible" class="salescenter-delivery-manager-wrapper">
				<div class="ui-ctl-label-text">{{localize.SALE_DELIVERY_SERVICE_SELECTOR_RESPONSIBLE_MANAGER}}</div>
				<div class="salescenter-delivery-manager">
					<div class="salescenter-delivery-manager-avatar" :style="responsibleUser.photo ? {'background-image': 'url(' + responsibleUser.photo + ')'} : {}"></div>
					<div class="salescenter-delivery-manager-content">
						<div @click="responsibleUserClicked" class="salescenter-delivery-manager-name">{{responsibleUser.name}}</div>
					</div>
					<div @click="openChangeResponsibleDialog" class="salescenter-delivery-manager-edit">{{localize.SALE_DELIVERY_SERVICE_SELECTOR_CHANGE_RESPONSIBLE}}</div>
				</div>
			</div>
					
			<div v-show="!selectedNoDelivery">
				<template v-if="calculateErrors">
					<div v-for="(error, index) in calculateErrors" class="ui-alert ui-alert-danger ui-alert-icon-danger salescenter-delivery-errors-container-alert">
						<span class="ui-alert-message">{{error}}</span>
					</div>
				</template>
				<div class="salescenter-delivery-bottom">
					<div class="salescenter-delivery-bottom-row">					
						<div class="salescenter-delivery-bottom-col">
							<span v-show="!isCalculating" @click="calculate" :class="calculateDeliveryPriceButtonClass">{{isCalculated ? localize.SALE_DELIVERY_SERVICE_SELECTOR_CALCULATE_UPDATE : localize.SALE_DELIVERY_SERVICE_SELECTOR_CALCULATE}}</span>
							
							<span v-show="isCalculating" class="salescenter-delivery-waiter">
								<span class="salescenter-delivery-waiter-alert">{{localize.SALE_DELIVERY_SERVICE_SELECTOR_CALCULATING_LABEL}}</span>
								<span class="salescenter-delivery-waiter-text">{{localize.SALE_DELIVERY_SERVICE_SELECTOR_CALCULATING_REQUEST_SENT}} {{selectedParentDeliveryService ? selectedParentDeliveryService.name : ''}}</span>
							</span>
						</div>
					</div>
					<div v-show="isSelectedDeliveryServiceAvailable && isCalculated" class="salescenter-delivery-bottom-row">
						<div class="salescenter-delivery-bottom-col"></div>
						<div class="salescenter-delivery-bottom-col">
							<table class="salescenter-delivery-table-total">
								<tr>
									<td>{{localize.SALE_DELIVERY_SERVICE_SELECTOR_EXPECTED_DELIVERY_PRICE}}:</td>
									<td>
										<span v-html="estimatedDeliveryPriceFormatted"></span>&nbsp;<span v-html="currencySymbol"></span>
									</td>
								</tr>
								<tr>
									<td>{{localize.SALE_DELIVERY_SERVICE_SELECTOR_CLIENT_DELIVERY_PRICE}}:</td>
									<td>
										<div class="ui-ctl ui-ctl-md ui-ctl-wa salescenter-delivery-bottom-input-symbol">
											<input v-model="enteredDeliveryPrice" @keypress="isNumber($event)" type="text" class="ui-ctl-element ui-ctl-textbox">
											<span v-html="currencySymbol"></span>
										</div>
									</td>
								</tr>
								<tr>
									<td>{{externalSumLabel}}:</td>
									<td>
										<span v-html="externalSumFormatted"></span><span class="salescenter-delivery-table-total-symbol" v-html="currencySymbol"></span>
									</td>
								</tr>
								<tr>
									<td>{{localize.SALE_DELIVERY_SERVICE_SELECTOR_DELIVERY_DELIVERY}}:</td>
									<td>
										<span v-show="deliveryPrice > 0">
											<span v-html="deliveryPriceFormatted"></span>&nbsp;<span v-html="currencySymbol"></span>
										</span>
										<span v-show="!deliveryPrice" class="salescenter-delivery-status salescenter-delivery-status--success">
											{{localize.SALE_DELIVERY_SERVICE_SELECTOR_CLIENT_DELIVERY_PRICE_FREE}}
										</span>
									</td>
								</tr>
								
								<tr class="salescenter-delivery-table-total-result">
									<td>{{localize.SALE_DELIVERY_SERVICE_SELECTOR_TOTAL}}:</td>
									<td>
										<span v-html="totalPriceFormatted"></span>
										<span class="salescenter-delivery-table-total-symbol" v-html="currencySymbol"></span>
									</td>
								</tr>
							</table>
						</div>
					</div>
				</div>
			</div>
		</div>
	`
	};

	exports.DeliverySelector = DeliverySelector;

})(this.BX.Salescenter = this.BX.Salescenter || {}, BX, BX, BX.Salescenter, BX.UI, BX.Location.Core, BX.Location.Widget, BX.UI.Notification, BX.Main, BX.Salescenter.Component.StageBlock);
//# sourceMappingURL=deliveryselector.bundle.js.map
