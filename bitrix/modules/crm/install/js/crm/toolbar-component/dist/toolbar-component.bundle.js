/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, crm_clientSelector, main_core_events, main_popup, ui_dialogs_messagebox, ui_navigationpanel, crm_router, pull_client, ui_buttons, ui_tour) {
	'use strict';

	function _classPrivateMethodInitSpec$3(e, a) { _checkPrivateRedeclaration$4(e, a), a.add(e); }
	function _classPrivateFieldInitSpec$1(e, t, a) { _checkPrivateRedeclaration$4(e, t), t.set(e, a); }
	function _checkPrivateRedeclaration$4(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
	function _classPrivateFieldGet$1(s, a) { return s.get(_assertClassBrand$4(s, a)); }
	function _classPrivateFieldSet$1(s, a, r) { return s.set(_assertClassBrand$4(s, a), r), r; }
	function _assertClassBrand$4(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
	var _settings = /*#__PURE__*/new WeakMap();
	var _button = /*#__PURE__*/new WeakMap();
	var _isMenuOpened = /*#__PURE__*/new WeakMap();
	var _menuPopup = /*#__PURE__*/new WeakMap();
	var _isEnabled = /*#__PURE__*/new WeakMap();
	var _clientSelector = /*#__PURE__*/new WeakMap();
	var _CommunicationButton_brand = /*#__PURE__*/new WeakSet();
	/**
	 * @abstract
	 */
	let CommunicationButton = /*#__PURE__*/function () {
		function CommunicationButton(settings) {
			babelHelpers.classCallCheck(this, CommunicationButton);
			_classPrivateMethodInitSpec$3(this, _CommunicationButton_brand);
			/**
			 * @protected
			 */

			/**
			 * @protected
			 */

			/**
			 * @protected
			 */

			_classPrivateFieldInitSpec$1(this, _settings, {});
			_classPrivateFieldInitSpec$1(this, _button, void 0);
			_classPrivateFieldInitSpec$1(this, _isMenuOpened, false);
			_classPrivateFieldInitSpec$1(this, _menuPopup, void 0);
			_classPrivateFieldInitSpec$1(this, _isEnabled, false);
			_classPrivateFieldInitSpec$1(this, _clientSelector, void 0);
			_classPrivateFieldSet$1(_settings, this, settings || {});
			_classPrivateFieldSet$1(_button, this, _classPrivateFieldGet$1(_settings, this).button);
			_classPrivateFieldGet$1(_button, this).bindEvent('click', this.onButtonClick.bind(this));
			this.ownerInfo = BX.prop.getObject(_classPrivateFieldGet$1(_settings, this), 'ownerInfo', {});
			this.data = BX.prop.getObject(_classPrivateFieldGet$1(_settings, this), 'data', {});
			_assertClassBrand$4(_CommunicationButton_brand, this, _enable).call(this, _assertClassBrand$4(_CommunicationButton_brand, this, _hasData).call(this));
			this.useClientSelector = BX.prop.getBoolean(_classPrivateFieldGet$1(_settings, this), 'useClientSelector', false);
			main_core_events.EventEmitter.subscribe('BX.Crm.MessageSender.ReceiverRepository:OnReceiversChanged', _assertClassBrand$4(_CommunicationButton_brand, this, _onReceiversChange).bind(this));
		}
		return babelHelpers.createClass(CommunicationButton, [{
			key: "getOwnerInfo",
			value: function getOwnerInfo() {
				return {
					ownerID: this.ownerInfo.ENTITY_ID,
					ownerType: this.ownerInfo.ENTITY_TYPE_NAME,
					ownerUrl: this.ownerInfo.SHOW_URL,
					ownerTitle: this.ownerInfo.TITLE
				};
			}
		}, {
			key: "getMultifieldTypeName",
			value:
			/**
			 * @abstract
			 */
			function getMultifieldTypeName() {
				return '';
			}
		}, {
			key: "isEnabled",
			value: function isEnabled() {
				return _classPrivateFieldGet$1(_isEnabled, this);
			}
		}, {
			key: "getAddAddressSourceMessage",
			value: function getAddAddressSourceMessage(entityTypeName) {
				return '';
			}

			/**
			 * @abstract
			 */
		}, {
			key: "onButtonClick",
			value: function onButtonClick(button, event) {}
		}, {
			key: "prepareMenuItem",
			value: function prepareMenuItem(key, value) {}
		}, {
			key: "openMenu",
			value: function openMenu() {
				if (_classPrivateFieldGet$1(_isMenuOpened, this)) {
					_assertClassBrand$4(_CommunicationButton_brand, this, _closeMenu).call(this);
					return;
				}
				const menuItems = [];
				for (const [key, items] of Object.entries(this.data)) {
					for (const item of items) {
						menuItems.push(this.prepareMenuItem(key, item));
					}
				}
				if (this.useClientSelector) {
					_assertClassBrand$4(_CommunicationButton_brand, this, _openClientSelector).call(this, menuItems);
				} else {
					_assertClassBrand$4(_CommunicationButton_brand, this, _openPopupMenu).call(this, menuItems);
				}
			}
		}, {
			key: "onClientSelectorSelect",
			value: function onClientSelectorSelect({
				data: {
					item
				}
			}) {
				// may be implement in children classes
			}
		}]);
	}();
	function _getOwnerTypeName() {
		return BX.prop.getString(this.ownerInfo, 'ENTITY_TYPE_NAME', '');
	}
	function _getOwnerId() {
		return BX.prop.getInteger(this.ownerInfo, 'ENTITY_ID', 0);
	}
	function _hasData() {
		return main_core.Type.isPlainObject(this.data) && main_core.Type.isArrayFilled(Object.keys(this.data));
	}
	function _enable(enabled) {
		_classPrivateFieldSet$1(_isEnabled, this, Boolean(enabled));
		_classPrivateFieldGet$1(_button, this).setDisabled(!_classPrivateFieldGet$1(_isEnabled, this));
		if (!_classPrivateFieldGet$1(_isEnabled, this)) {
			const title = this.getAddAddressSourceMessage(_assertClassBrand$4(_CommunicationButton_brand, this, _getOwnerTypeName).call(this));
			if (title) {
				_classPrivateFieldGet$1(_button, this).getContainer().title = title;
			}
		}
	}
	function _openClientSelector(menuItems) {
		if (!_classPrivateFieldGet$1(_clientSelector, this)) {
			_classPrivateFieldSet$1(_clientSelector, this, BX.Crm.ClientSelector.createFromItems({
				targetNode: _classPrivateFieldGet$1(_button, this).getContainer(),
				items: menuItems,
				events: {
					onSelect: this.onClientSelectorSelect.bind(this),
					onShow: () => {
						_classPrivateFieldSet$1(_isMenuOpened, this, true);
					},
					onHide: () => {
						_classPrivateFieldSet$1(_isMenuOpened, this, false);
					}
				}
			}));
		}
		_classPrivateFieldGet$1(_clientSelector, this).show();
	}
	function _openPopupMenu(menuItems) {
		_classPrivateFieldSet$1(_menuPopup, this, new main_popup.Menu({
			bindElement: _classPrivateFieldGet$1(_button, this).getContainer(),
			offsetTop: 0,
			offsetLeft: 0,
			cacheable: false,
			items: menuItems,
			events: {
				onPopupShow: () => {
					_classPrivateFieldSet$1(_isMenuOpened, this, true);
				},
				onPopupClose: () => {
					_classPrivateFieldSet$1(_isMenuOpened, this, false);
				},
				onPopupDestroy: () => {
					_classPrivateFieldSet$1(_isMenuOpened, this, false);
					_classPrivateFieldSet$1(_menuPopup, this, null);
				}
			}
		}));
		_classPrivateFieldGet$1(_menuPopup, this).show();
	}
	function _closeMenu() {
		_classPrivateFieldGet$1(_menuPopup, this)?.close();
		_classPrivateFieldGet$1(_clientSelector, this)?.hide();
	}
	function _onReceiversChange(event) {
		const {
			item,
			current
		} = event.getData();
		if (item.entityTypeName !== _assertClassBrand$4(_CommunicationButton_brand, this, _getOwnerTypeName).call(this) || item.entityId !== _assertClassBrand$4(_CommunicationButton_brand, this, _getOwnerId).call(this)) {
			return;
		}
		this.data = {};
		for (const receiver of current) {
			if (receiver.address.typeId !== this.getMultifieldTypeName()) {
				continue;
			}
			const key = `${receiver.addressSource.entityTypeId}_${receiver.addressSource.entityId}`;
			this.data[key] ??= [];
			this.data[key].push({
				ID: receiver.address.id,
				ENTITY_ID: receiver.addressSource.entityId,
				ENTITY_TYPE_NAME: receiver.addressSource.entityTypeName,
				TYPE_ID: receiver.address.typeId,
				VALUE_TYPE: receiver.address.valueType,
				VALUE: receiver.address.value,
				VALUE_FORMATTED: receiver.address.valueFormatted,
				COMPLEX_ID: receiver.address.complexId,
				COMPLEX_NAME: receiver.address.valueTypeCaption,
				OWNER: {
					ID: receiver.addressSource.entityId,
					TYPE_ID: receiver.addressSource.entityTypeId,
					TITLE: receiver.addressSourceData.title
				}
			});
		}
		_assertClassBrand$4(_CommunicationButton_brand, this, _enable).call(this, _assertClassBrand$4(_CommunicationButton_brand, this, _hasData).call(this));
	}

	function _callSuper$4(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct$4() ? Reflect.construct(o, e || [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
	function _isNativeReflectConstruct$4() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct$4 = function () { return !!t; })(); }
	let EmailButton = /*#__PURE__*/function (_CommunicationButton) {
		function EmailButton() {
			babelHelpers.classCallCheck(this, EmailButton);
			return _callSuper$4(this, EmailButton, arguments);
		}
		babelHelpers.inherits(EmailButton, _CommunicationButton);
		return babelHelpers.createClass(EmailButton, [{
			key: "getAddAddressSourceMessage",
			value: function getAddAddressSourceMessage(entityTypeName) {
				const dynamicKey = `CRM_TOOLBAR_COMPONENT_ADD_CLIENT_FOR_EMAIL_SEND_${entityTypeName}`;
				return main_core.Loc.hasMessage(dynamicKey) ? main_core.Loc.getMessage(dynamicKey) : main_core.Loc.getMessage('CRM_TOOLBAR_COMPONENT_ADD_CLIENT_FOR_EMAIL_SEND');
			}
		}, {
			key: "onButtonClick",
			value: function onButtonClick(button, event) {
				if (!this.isEnabled()) {
					return;
				}
				if (!this.useClientSelector) {
					BX.CrmActivityEditor.addEmail(this.getOwnerInfo());
					return;
				}
				const keys = Object.keys(this.data);
				if (keys.length === 1) {
					const firstKey = keys[0];
					const items = this.data[firstKey];
					if (items.length === 1) {
						BX.CrmActivityEditor.addEmail(this.getOwnerInfo());
						return;
					}
				}
				this.openMenu();
			}
		}, {
			key: "prepareMenuItem",
			value: function prepareMenuItem(key, value) {
				if (!main_core.Type.isPlainObject(value) || !this.useClientSelector) {
					return {};
				}
				return {
					id: value.ID,
					title: value.OWNER ? value.OWNER.TITLE : value.VALUE_FORMATTED,
					subtitle: value.OWNER ? `${value.VALUE_FORMATTED}, ${value.COMPLEX_NAME}` : value.COMPLEX_NAME,
					avatar: null,
					customData: {
						entityId: value.OWNER ? value.OWNER.ID : null,
						entityTypeId: value.OWNER ? value.OWNER.TYPE_ID : null,
						value: value.VALUE ?? null,
						valueType: value.VALUE_TYPE ?? null
					}
				};
			}
		}, {
			key: "onClientSelectorSelect",
			value: function onClientSelectorSelect({
				data: {
					item
				}
			}) {
				const {
					customData
				} = item;
				const entityTypeId = customData.get('entityTypeId');
				const data = this.getOwnerInfo();
				data.mailDefaultCommunications = [{
					ENTITY_ID: customData.get('entityId'),
					ENTITY_TYPE_ID: entityTypeId,
					ENTITY_TYPE_NAME: BX.CrmEntityType.resolveName(entityTypeId),
					TYPE: this.getMultifieldTypeName(),
					VALUE: customData.get('value'),
					VALUE_TYPE: customData.get('valueType')
				}];
				BX.CrmActivityEditor.addEmail(data);
			}
		}, {
			key: "getMultifieldTypeName",
			value: function getMultifieldTypeName() {
				return 'EMAIL';
			}
		}]);
	}(CommunicationButton);

	function _callSuper$3(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct$3() ? Reflect.construct(o, e || [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
	function _isNativeReflectConstruct$3() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct$3 = function () { return !!t; })(); }
	function _classPrivateMethodInitSpec$2(e, a) { _checkPrivateRedeclaration$3(e, a), a.add(e); }
	function _checkPrivateRedeclaration$3(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
	function _assertClassBrand$3(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
	var _MessengerButton_brand = /*#__PURE__*/new WeakSet();
	let MessengerButton = /*#__PURE__*/function (_CommunicationButton) {
		function MessengerButton(...args) {
			var _this;
			babelHelpers.classCallCheck(this, MessengerButton);
			_this = _callSuper$3(this, MessengerButton, [...args]);
			_classPrivateMethodInitSpec$2(_this, _MessengerButton_brand);
			return _this;
		}
		babelHelpers.inherits(MessengerButton, _CommunicationButton);
		return babelHelpers.createClass(MessengerButton, [{
			key: "onButtonClick",
			value: function onButtonClick(button, event) {
				const keys = Object.keys(this.data);
				if (keys.length === 1) {
					const firstKey = keys[0];
					const items = this.data[firstKey];
					if (items.length === 1) {
						const parts = firstKey.split('_');
						if (parts.length >= 2) {
							_assertClassBrand$3(_MessengerButton_brand, this, _openChat).call(this, firstKey, items[0]);
							return;
						}
					}
				}
				this.openMenu();
			}
		}, {
			key: "prepareMenuItem",
			value: function prepareMenuItem(key, value) {
				let messengerText = '';
				let messengerValue = '';
				if (main_core.Type.isPlainObject(value)) {
					messengerValue = BX.prop.getString(value, 'VALUE', '');
					const valueType = BX.prop.getString(value, 'VALUE_TYPE', '');
					if (valueType === 'OPENLINE') {
						// Open line does not have formatted value
						messengerText = BX.prop.getString(value, 'COMPLEX_NAME', '');
					} else {
						messengerText = `${BX.prop.getString(value, 'COMPLEX_NAME', '')}: ${BX.prop.getString(value, 'VALUE_FORMATTED', '')}`;
					}
				} else {
					messengerText = value;
					messengerValue = value;
				}
				return {
					text: messengerText,
					onclick: () => {
						_assertClassBrand$3(_MessengerButton_brand, this, _openChat).call(this, key, messengerValue);
					}
				};
			}
		}, {
			key: "getMultifieldTypeName",
			value: function getMultifieldTypeName() {
				return 'IM';
			}
		}]);
	}(CommunicationButton);
	function _openChat(entityKey, messenger) {
		if (main_core.Type.isNil(window.top.BXIM)) {
			console.error('crm.toolbar-component: messaging not supported');
			return;
		}
		const messengerValue = main_core.Type.isPlainObject(messenger) ? messenger.VALUE : messenger;
		window.top.BXIM.openMessengerSlider(messengerValue, {
			RECENT: 'N',
			MENU: 'N'
		});
	}

	function _callSuper$2(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct$2() ? Reflect.construct(o, e || [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
	function _isNativeReflectConstruct$2() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct$2 = function () { return !!t; })(); }
	function _classPrivateMethodInitSpec$1(e, a) { _checkPrivateRedeclaration$2(e, a), a.add(e); }
	function _checkPrivateRedeclaration$2(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
	function _assertClassBrand$2(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
	var _PhoneButton_brand = /*#__PURE__*/new WeakSet();
	let PhoneButton = /*#__PURE__*/function (_CommunicationButton) {
		function PhoneButton(...args) {
			var _this;
			babelHelpers.classCallCheck(this, PhoneButton);
			_this = _callSuper$2(this, PhoneButton, [...args]);
			_classPrivateMethodInitSpec$1(_this, _PhoneButton_brand);
			return _this;
		}
		babelHelpers.inherits(PhoneButton, _CommunicationButton);
		return babelHelpers.createClass(PhoneButton, [{
			key: "getAddAddressSourceMessage",
			value: function getAddAddressSourceMessage(entityTypeName) {
				const dynamicKey = `CRM_TOOLBAR_COMPONENT_ADD_CLIENT_FOR_CALL_${entityTypeName}`;
				return main_core.Loc.hasMessage(dynamicKey) ? main_core.Loc.getMessage(dynamicKey) : main_core.Loc.getMessage('CRM_TOOLBAR_COMPONENT_ADD_CLIENT_FOR_CALL');
			}
		}, {
			key: "onButtonClick",
			value: function onButtonClick(button, event) {
				if (!this.isEnabled()) {
					return;
				}
				const keys = Object.keys(this.data);
				if (keys.length === 1) {
					const firstKey = keys[0];
					const items = this.data[firstKey];
					if (items.length === 1) {
						const parts = firstKey.split('_');
						if (parts.length >= 2) {
							_assertClassBrand$2(_PhoneButton_brand, this, _addCall).call(this, firstKey, items[0]);
							return;
						}
					}
				}
				this.openMenu();
			}
		}, {
			key: "prepareMenuItem",
			value: function prepareMenuItem(key, value) {
				let phoneText = value;
				let phoneValue = value;
				if (main_core.Type.isPlainObject(value)) {
					const complexName = BX.prop.getString(value, 'COMPLEX_NAME', '');
					const valueFormatted = BX.prop.getString(value, 'VALUE_FORMATTED', '');
					phoneText = `${complexName}: ${valueFormatted}`;
					phoneValue = BX.prop.getString(value, 'VALUE', '');
					if (this.useClientSelector) {
						return _assertClassBrand$2(_PhoneButton_brand, this, _createClientSelectorMenuItem).call(this, value);
					}
				}
				return _assertClassBrand$2(_PhoneButton_brand, this, _createPopupMenuItem).call(this, key, phoneValue, phoneText);
			}
		}, {
			key: "onClientSelectorSelect",
			value: function onClientSelectorSelect({
				data: {
					item
				}
			}) {
				const {
					customData
				} = item;
				const entityKey = `${customData.get('entityTypeId')}_${customData.get('entityId')}`;
				const value = customData.get('value');
				_assertClassBrand$2(_PhoneButton_brand, this, _addCall).call(this, entityKey, value);
			}
		}, {
			key: "getMultifieldTypeName",
			value: function getMultifieldTypeName() {
				return 'PHONE';
			}
		}]);
	}(CommunicationButton);
	function _createClientSelectorMenuItem(value) {
		const complexName = BX.prop.getString(value, 'COMPLEX_NAME', '');
		const valueFormatted = BX.prop.getString(value, 'VALUE_FORMATTED', '');
		const phoneValue = BX.prop.getString(value, 'VALUE', '');
		const owner = main_core.Type.isObjectLike(value.OWNER) ? value.OWNER : null;
		return {
			id: value.ID,
			title: owner ? owner.TITLE : valueFormatted,
			subtitle: owner ? `${valueFormatted}, ${complexName}` : complexName,
			avatar: null,
			customData: {
				entityId: owner ? owner.ID : null,
				entityTypeId: owner ? owner.TYPE_ID : null,
				value: phoneValue
			}
		};
	}
	function _createPopupMenuItem(entityKey, value, text) {
		return {
			text,
			onclick: () => {
				_assertClassBrand$2(_PhoneButton_brand, this, _addCall).call(this, entityKey, value);
			}
		};
	}
	function _addCall(entityKey, phone) {
		if (main_core.Type.isNil(window.top.BXIM)) {
			ui_dialogs_messagebox.MessageBox.alert(main_core.Loc.getMessage('CRM_TOOLBAR_COMPONENT_TELEPHONY_NOT_SUPPORTED'), null, main_core.Loc.getMessage('CRM_TOOLBAR_COMPONENT_TELEPHONY_NOT_SUPPORTED_OK'));
			return;
		}
		const parts = entityKey.split('_');
		if (parts.length < 2) {
			return;
		}
		const entityTypeId = main_core.Text.toInteger(parts[0]);
		const entityId = main_core.Text.toInteger(parts[1]);
		const ownerTypeId = BX.prop.getInteger(this.ownerInfo, 'ENTITY_TYPE_ID', 0);
		const ownerId = BX.prop.getInteger(this.ownerInfo, 'ENTITY_ID', 0);
		const phoneValue = main_core.Type.isPlainObject(phone) ? phone.VALUE : phone;
		const params = {
			ENTITY_TYPE_NAME: BX.CrmEntityType.resolveName(entityTypeId),
			ENTITY_ID: entityId,
			AUTO_FOLD: true
		};
		if (ownerTypeId !== entityTypeId || ownerId !== entityId) {
			params.BINDINGS = [{
				OWNER_TYPE_NAME: BX.CrmEntityType.resolveName(ownerTypeId),
				OWNER_ID: ownerId
			}];
		}
		window.top.BXIM.phoneTo(phoneValue, params);
	}

	function _callSuper$1(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct$1() ? Reflect.construct(o, e || [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
	function _isNativeReflectConstruct$1() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct$1 = function () { return !!t; })(); }
	function _classPrivateFieldInitSpec(e, t, a) { _checkPrivateRedeclaration$1(e, t), t.set(e, a); }
	function _checkPrivateRedeclaration$1(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
	function _classPrivateFieldGet(s, a) { return s.get(_assertClassBrand$1(s, a)); }
	function _classPrivateFieldSet(s, a, r) { return s.set(_assertClassBrand$1(s, a), r), r; }
	function _assertClassBrand$1(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
	var _id = /*#__PURE__*/new WeakMap();
	var _binding = /*#__PURE__*/new WeakMap();
	let NavigationBar = /*#__PURE__*/function (_NavigationPanel) {
		function NavigationBar(options) {
			var _this;
			babelHelpers.classCallCheck(this, NavigationBar);
			if (!main_core.Type.isPlainObject(options)) {
				throw 'BX.Crm.NavigationBar: The "options" argument must be object.';
			}
			options.items = main_core.Type.isArray(options.items) ? options.items : [];
			options.items.forEach(item => {
				if (!item.hasOwnProperty('active') && item.hasOwnProperty('isActive')) {
					item.active = item.isActive;
				}
				if (main_core.Type.isStringFilled(item.lockedCallback)) {
					item.locked = true;
					item.url = '';
					item.events = {
						click: () => eval(item.lockedCallback)
					};
				}
				if (main_core.Type.isStringFilled(item.url)) {
					item.events = {
						click: () => _this.openUrl(item.id, item.url)
					};
				}
			});
			_this = _callSuper$1(this, NavigationBar, [{
				target: BX(options.id),
				items: options.items
			}]);
			_classPrivateFieldInitSpec(_this, _id, void 0);
			_classPrivateFieldInitSpec(_this, _binding, void 0);
			_classPrivateFieldSet(_id, _this, options.id);
			_classPrivateFieldSet(_binding, _this, options.binding);
			return _this;
		}
		babelHelpers.inherits(NavigationBar, _NavigationPanel);
		return babelHelpers.createClass(NavigationBar, [{
			key: "openUrl",
			value: function openUrl(itemId, url) {
				if (!main_core.Type.isStringFilled(url)) {
					return;
				}
				if (_classPrivateFieldGet(_binding, this) && main_core.Type.isPlainObject(_classPrivateFieldGet(_binding, this))) {
					const category = main_core.Type.isStringFilled(_classPrivateFieldGet(_binding, this).category) ? _classPrivateFieldGet(_binding, this).category : '';
					const name = main_core.Type.isStringFilled(_classPrivateFieldGet(_binding, this).name) ? _classPrivateFieldGet(_binding, this).name : '';
					const key = main_core.Type.isStringFilled(_classPrivateFieldGet(_binding, this).key) ? _classPrivateFieldGet(_binding, this).key : '';
					if (category !== '' && name !== '' && key !== '') {
						const value = itemId + ":" + BX.formatDate(new Date(), 'YYYYMMDD');
						BX.userOptions.save(category, name, key, value, false);
					}
				}
				setTimeout(function () {
					window.location.href = url;
				}, 150);
			}
		}]);
	}(ui_navigationpanel.NavigationPanel);

	function _callSuper(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
	function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function () { return !!t; })(); }
	function _classPrivateMethodInitSpec(e, a) { _checkPrivateRedeclaration(e, a), a.add(e); }
	function _checkPrivateRedeclaration(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
	function _assertClassBrand(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
	const MENU_ID_PREFIX = 'toolbar-category-';
	let instance = null;
	let ToolbarEvents = /*#__PURE__*/babelHelpers.createClass(function ToolbarEvents() {
		babelHelpers.classCallCheck(this, ToolbarEvents);
	});
	/**
	 * @memberOf BX.Crm
	 */
	babelHelpers.defineProperty(ToolbarEvents, "TYPE_UPDATED", 'TypeUpdated');
	babelHelpers.defineProperty(ToolbarEvents, "CATEGORIES_UPDATED", 'CategoriesUpdated');
	babelHelpers.defineProperty(ToolbarEvents, "AUTOMATED_SOLUTION_UPDATED", 'CategoriesUpdated');
	var _ToolbarComponent_brand = /*#__PURE__*/new WeakSet();
	let ToolbarComponent = /*#__PURE__*/function (_EventEmitter) {
		function ToolbarComponent() {
			var _this;
			babelHelpers.classCallCheck(this, ToolbarComponent);
			_this = _callSuper(this, ToolbarComponent);
			_classPrivateMethodInitSpec(_this, _ToolbarComponent_brand);
			_this.initHints();
			_this.setEventNamespace('BX.Crm.ToolbarComponent');
			main_core.Event.ready(_this.bindEvents.bind(_this));
			return _this;
		}
		babelHelpers.inherits(ToolbarComponent, _EventEmitter);
		return babelHelpers.createClass(ToolbarComponent, [{
			key: "initHints",
			value: function initHints() {
				BX.UI.Hint.init(BX('ui-toolbar-after-title-buttons'));
			}
		}, {
			key: "bindEvents",
			value: function bindEvents() {
				const buttonNode = document.querySelector('[data-role="bx-crm-toolbar-categories-button"]');
				if (buttonNode) {
					const toolbar = BX.UI.ToolbarManager.getDefaultToolbar();
					const button = toolbar.getButton(main_core.Dom.attr(buttonNode, 'data-btn-uniqid'));
					const entityTypeId = Number(buttonNode.dataset.entityTypeId);
					if (button.counterNode && button.counterNode.innerText > 99) {
						button.counterNode.innerText = '99+';
					}
					if (button && entityTypeId > 0) {
						if (pull_client.PULL) {
							pull_client.PULL.subscribe({
								moduleId: 'crm',
								command: 'CRM_CATEGORIES_UPDATED',
								callback: data => {
									if (data.entityTypeId !== entityTypeId) {
										return;
									}
									_assertClassBrand(_ToolbarComponent_brand, this, _reloadCategoriesMenu).call(this, button, entityTypeId, buttonNode.dataset.categoryId);
								}
							});
							pull_client.PULL.extendWatch('CRM_CATEGORIES_UPDATED');
						}
						this.subscribeCategoriesUpdatedEvent(() => {
							_assertClassBrand(_ToolbarComponent_brand, this, _reloadCategoriesMenu).call(this, button, entityTypeId, buttonNode.dataset.categoryId);
						});
					}
				}
				_assertClassBrand(_ToolbarComponent_brand, this, _bindAutomationGuide).call(this);
			}
		}, {
			key: "emitTypeUpdatedEvent",
			value: function emitTypeUpdatedEvent(data) {
				this.emit(ToolbarEvents.TYPE_UPDATED, data);
			}
		}, {
			key: "emitAutomatedSolutionUpdatedEvent",
			value: function emitAutomatedSolutionUpdatedEvent(data) {
				this.emit(ToolbarEvents.AUTOMATED_SOLUTION_UPDATED, data);
			}
		}, {
			key: "emitCategoriesUpdatedEvent",
			value: function emitCategoriesUpdatedEvent(data) {
				this.emit(ToolbarEvents.CATEGORIES_UPDATED, data);
			}
		}, {
			key: "subscribeTypeUpdatedEvent",
			value: function subscribeTypeUpdatedEvent(callback) {
				this.subscribe(ToolbarEvents.TYPE_UPDATED, callback);
			}
		}, {
			key: "subscribeCategoriesUpdatedEvent",
			value: function subscribeCategoriesUpdatedEvent(callback) {
				this.subscribe(ToolbarEvents.CATEGORIES_UPDATED, callback);
			}
		}, {
			key: "subscribeAutomatedSolutionUpdatedEvent",
			value: function subscribeAutomatedSolutionUpdatedEvent(callback) {
				this.subscribe(ToolbarEvents.AUTOMATED_SOLUTION_UPDATED, callback);
			}
		}, {
			key: "unsubscribeAutomatedSolutionUpdatedEvent",
			value: function unsubscribeAutomatedSolutionUpdatedEvent(callback) {
				this.unsubscribe(ToolbarEvents.AUTOMATED_SOLUTION_UPDATED, callback);
			}
		}, {
			key: "getSettingsButton",
			value: function getSettingsButton() {
				const toolbar = BX.UI.ToolbarManager.getDefaultToolbar();
				if (!toolbar) {
					return null;
				}
				for (const [key, button] of Object.entries(toolbar.getButtons())) {
					if (button.getIcon() === ui_buttons.ButtonIcon.SETTING) {
						return button;
					}
				}
				return null;
			}
		}], [{
			key: "Instance",
			get: function () {
				if (window.top !== window && main_core.Reflection.getClass('top.BX.Crm.ToolbarComponent')) {
					return window.top.BX.Crm.ToolbarComponent.Instance;
				}
				if (instance === null) {
					instance = new ToolbarComponent();
				}
				return instance;
			}
		}]);
	}(main_core_events.EventEmitter);
	function _bindAutomationGuide() {
		const hash = document.location.hash;
		let guide = null;
		if (hash === '#robots') {
			const robotsBtn = document.querySelector('.robot-button-container');
			if (robotsBtn) {
				guide = new ui_tour.Guide({
					steps: [{
						target: robotsBtn,
						title: main_core.Loc.getMessage('CRM_TOOLBAR_COMPONENT_ROBOTS_GUIDE_TEXT_1'),
						text: ''
					}],
					onEvents: true
				});
			}
		} else if (hash === '#scripts') {
			const scriptsBtn = document.querySelector('.intranet-binding-menu-btn');
			if (scriptsBtn) {
				guide = new ui_tour.Guide({
					steps: [{
						target: scriptsBtn,
						title: main_core.Loc.getMessage('CRM_TOOLBAR_COMPONENT_SCRIPTS_GUIDE_TEXT'),
						article: '13281632',
						text: ''
					}],
					onEvents: true
				});
			}
		}
		if (guide) {
			guide.start();
			guide.getPopup().setAutoHide(true);
			guide.getPopup().setClosingByEsc(true);
		}
	}
	function _reloadCategoriesMenu(button, entityTypeId, categoryId) {
		const menu = button.getMenuWindow();
		if (!menu) {
			return;
		}
		main_core.ajax.runAction('crm.controller.category.list', {
			data: {
				entityTypeId
			}
		}).then(response => {
			let startKey = 0;
			const items = [];
			const categories = response.data.categories;
			menu.menuItems.forEach(item => {
				if (item.id.indexOf(MENU_ID_PREFIX) !== 0) {
					items.push(item.options);
				} else if (item.id === 'toolbar-category-all') {
					items.push(item.options);
					startKey = 1;
				}
			});
			menu.destroy();
			main_core.Event.unbindAll(button.getContainer(), 'click');
			categories.forEach(category => {
				const link = entityTypeId === BX.CrmEntityType.enumeration.deal ? crm_router.Router.Instance.getDealKanbanUrl(category.id)?.toString() : crm_router.Router.Instance.getItemListUrlInCurrentView(entityTypeId, category.id)?.toString();
				items.splice(startKey, 0, {
					id: `${MENU_ID_PREFIX}${category.id}`,
					text: main_core.Text.encode(category.name),
					href: link || null,
					dataset: {
						isDefault: category.isDefault || false,
						categoryId: category.id
					}
				});
				if (category.id >= 0 && categoryId >= 0 && Number(categoryId) === Number(category.id)) {
					button.setText(category.name);
				}
				startKey++;
			});
			const options = menu.params;
			options.items = items;
			button.menuWindow = new main_popup.Menu(options);
			main_core.Event.bind(button.getContainer(), 'click', button.menuWindow.show.bind(button.menuWindow));
			if (entityTypeId === BX.CrmEntityType.enumeration.deal) {
				_assertClassBrand(_ToolbarComponent_brand, this, _reloadAddButtonMenu).call(this, categories);
			}
			_assertClassBrand(_ToolbarComponent_brand, this, _tryRedirectToDefaultCategory).call(this, items, categoryId);
		}).catch(response => {
			console.log('error trying reload categories', response.errors);
		});
	}
	function _reloadAddButtonMenu(categories) {
		const addButtonNode = document.querySelector('.ui-btn-split.ui-btn-success');
		if (!addButtonNode) {
			return;
		}
		const addButtonId = addButtonNode.dataset.btnUniqid;
		const toolbar = BX.UI.ToolbarManager.getDefaultToolbar();
		const button = toolbar.getButton(addButtonId, 'data-btn-uniqid');
		if (!button) {
			return;
		}
		const menu = button.menuWindow;
		if (!menu) {
			return;
		}
		const menuItemsIds = menu.getMenuItems().map(item => item.id).filter(id => main_core.Type.isInteger(id));
		const categoryIds = new Set(categories.map(item => item.id));
		const idsToRemove = menuItemsIds.filter(id => !categoryIds.has(id));
		const newCategories = categories.filter(item => !menuItemsIds.includes(item.id) && item.id > 0);

		// remove menu item(s)
		if (idsToRemove.length > 0) {
			idsToRemove.forEach(idToRemove => menu.removeMenuItem(idToRemove));
		}

		// add new item(s)
		if (newCategories.length > 0) {
			const targetItemId = menu.getMenuItems().map(item => item.id).filter(id => main_core.Type.isString(id)).at(1);
			newCategories.forEach(item => {
				menu.addMenuItem({
					id: item.id,
					text: item.name,
					onclick() {
						BX.SidePanel.Instance.open(`/crm/deal/details/0/?category_id=${item.id}`);
					}
				}, targetItemId);
			});
		}
	}
	function _tryRedirectToDefaultCategory(items, currentCategoryId) {
		const tryToRedirect = () => {
			const isStaticCategory = currentCategoryId <= 0;
			const isCurrentCategoryDefined = items.some(row => Number(row?.dataset?.categoryId) === Number(currentCategoryId));
			if (!isCurrentCategoryDefined && !isStaticCategory) {
				const defaultPage = items.find(row => row?.dataset?.isDefault);
				if (main_core.Type.isObject(defaultPage) && main_core.Type.isStringFilled(defaultPage.href)) {
					window.location.href = defaultPage.href;
				}
			}
		};

		// wait until all sliders are closed before redirecting
		if (BX.SidePanel.Instance.getTopSlider()) {
			main_core_events.EventEmitter.subscribeOnce(BX.SidePanel.Instance.getTopSlider(), 'SidePanel.Slider:onCloseComplete', () => {
				_assertClassBrand(_ToolbarComponent_brand, this, _tryRedirectToDefaultCategory).call(this, items, currentCategoryId);
			});
			return;
		}
		tryToRedirect();
	}

	/**
	 * @memberOf BX.Crm.ToolbarComponent.Communications
	 */
	ToolbarComponent.Communications = Object.freeze({
		PhoneButton,
		EmailButton,
		MessengerButton
	});

	exports.NavigationBar = NavigationBar;
	exports.ToolbarComponent = ToolbarComponent;

})(this.BX.Crm = this.BX.Crm || {}, BX, BX.Crm, BX.Event, BX.Main, BX.UI.Dialogs, BX.UI, BX.Crm, BX, BX.UI, BX.UI.Tour);
//# sourceMappingURL=toolbar-component.bundle.js.map
