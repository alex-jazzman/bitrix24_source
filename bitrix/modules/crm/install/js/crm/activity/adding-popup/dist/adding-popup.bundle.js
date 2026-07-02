/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, crm_activity_todoEditorV2, main_core, main_core_events, main_popup, ui_buttons, ui_notification) {
	'use strict';

	function _classPrivateMethodInitSpec(e, a) { _checkPrivateRedeclaration(e, a), a.add(e); }
	function _classPrivateFieldInitSpec(e, t, a) { _checkPrivateRedeclaration(e, t), t.set(e, a); }
	function _checkPrivateRedeclaration(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
	function _classPrivateFieldGet(s, a) { return s.get(_assertClassBrand(s, a)); }
	function _classPrivateFieldSet(s, a, r) { return s.set(_assertClassBrand(s, a), r), r; }
	function _assertClassBrand(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
	var _entityId = /*#__PURE__*/new WeakMap();
	var _entityTypeId = /*#__PURE__*/new WeakMap();
	var _currentUser = /*#__PURE__*/new WeakMap();
	var _pingSettings = /*#__PURE__*/new WeakMap();
	var _calendarSettings = /*#__PURE__*/new WeakMap();
	var _colorSettings = /*#__PURE__*/new WeakMap();
	var _popup = /*#__PURE__*/new WeakMap();
	var _popupContainer = /*#__PURE__*/new WeakMap();
	var _popupToDoEditorContainer = /*#__PURE__*/new WeakMap();
	var _todoEditor = /*#__PURE__*/new WeakMap();
	var _eventEmitter = /*#__PURE__*/new WeakMap();
	var _context = /*#__PURE__*/new WeakMap();
	var _AddingPopup_brand = /*#__PURE__*/new WeakSet();
	/**
	 * @event onSave
	 * @event onClose
	 */
	let AddingPopup = /*#__PURE__*/function () {
		function AddingPopup(entityTypeId, entityId, currentUser, settings, _params) {
			babelHelpers.classCallCheck(this, AddingPopup);
			_classPrivateMethodInitSpec(this, _AddingPopup_brand);
			_classPrivateFieldInitSpec(this, _entityId, null);
			_classPrivateFieldInitSpec(this, _entityTypeId, null);
			_classPrivateFieldInitSpec(this, _currentUser, null);
			_classPrivateFieldInitSpec(this, _pingSettings, null);
			_classPrivateFieldInitSpec(this, _calendarSettings, null);
			_classPrivateFieldInitSpec(this, _colorSettings, null);
			_classPrivateFieldInitSpec(this, _popup, null);
			_classPrivateFieldInitSpec(this, _popupContainer, null);
			_classPrivateFieldInitSpec(this, _popupToDoEditorContainer, null);
			_classPrivateFieldInitSpec(this, _todoEditor, null);
			_classPrivateFieldInitSpec(this, _eventEmitter, null);
			_classPrivateFieldInitSpec(this, _context, {});
			_classPrivateFieldSet(_entityId, this, main_core.Text.toInteger(entityId));
			_classPrivateFieldSet(_entityTypeId, this, main_core.Text.toInteger(entityTypeId));
			_classPrivateFieldSet(_currentUser, this, currentUser);
			_classPrivateFieldSet(_eventEmitter, this, new main_core_events.EventEmitter());
			_classPrivateFieldGet(_eventEmitter, this).setEventNamespace('Crm.Activity.AddingPopup');
			if (main_core.Type.isObject(settings)) {
				_classPrivateFieldSet(_pingSettings, this, settings.pingSettings ?? null);
				_classPrivateFieldSet(_calendarSettings, this, settings.calendarSettings ?? null);
				_classPrivateFieldSet(_colorSettings, this, settings.colorSettings ?? null);
			}
			if (!main_core.Type.isPlainObject(_params)) {
				// eslint-disable-next-line no-param-reassign
				_params = {};
			}
			if (main_core.Type.isObject(_params.events)) {
				for (const eventName in _params.events) {
					if (main_core.Type.isFunction(_params.events[eventName])) {
						_classPrivateFieldGet(_eventEmitter, this).subscribe(eventName, _params.events[eventName]);
					}
				}
			}
			if (main_core.Type.isPlainObject(_params.context)) {
				_classPrivateFieldSet(_context, this, _params.context);
			}
		}
		return babelHelpers.createClass(AddingPopup, [{
			key: "show",
			value: async function show(mode = crm_activity_todoEditorV2.TodoEditorMode.ADD) {
				const popup = _assertClassBrand(_AddingPopup_brand, this, _createPopupIfNotExists).call(this);
				if (popup.isShown()) {
					return;
				}
				if (!_classPrivateFieldGet(_popupToDoEditorContainer, this).hasChildNodes()) {
					await _assertClassBrand(_AddingPopup_brand, this, _createToDoEditor).call(this);
					popup.setButtons([new ui_buttons.SaveButton({
						id: 'save',
						color: ui_buttons.ButtonColor.PRIMARY,
						size: ui_buttons.ButtonSize.EXTRA_SMALL,
						round: true,
						events: {
							click: _assertClassBrand(_AddingPopup_brand, this, _saveAndClose).bind(this)
						}
					}), new ui_buttons.CancelButton({
						id: 'cancel',
						size: ui_buttons.ButtonSize.EXTRA_SMALL,
						round: true,
						events: {
							click: () => {
								_classPrivateFieldGet(_todoEditor, this)?.sendAnalyticsCancelEvent(_classPrivateFieldGet(_context, this)?.analytics ?? {});
								popup.close();
							}
						}
					})]);
					popup.subscribeOnce('onFirstShow', event => {
						event.target.getZIndexComponent().setZIndex(1400);
						_classPrivateFieldGet(_todoEditor, this).show();
					});
					popup.subscribe('onAfterShow', () => {
						_assertClassBrand(_AddingPopup_brand, this, _actualizePopupLayout).call(this);
						_classPrivateFieldGet(_todoEditor, this).setFocused();
					});
					popup.subscribe('onAfterClose', () => {
						void _classPrivateFieldGet(_todoEditor, this).resetToDefaults().then(() => {
							_classPrivateFieldGet(_eventEmitter, this).emit('onClose');
						});
					});
					popup.subscribe('onShow', () => {
						const {
							mode: todoEditorMode,
							activity
						} = popup.params;
						if (todoEditorMode === crm_activity_todoEditorV2.TodoEditorMode.UPDATE && activity) {
							_classPrivateFieldGet(_todoEditor, this).setMode(todoEditorMode).setActivityId(activity.id).setDescription(activity.description).setDeadline(activity.deadline);
						}
					});
				}
				_assertClassBrand(_AddingPopup_brand, this, _prepareAndShowPopup).call(this, popup, mode);
			}
		}]);
	}();
	async function _createToDoEditor() {
		// just created, initialize
		const params = {
			container: _classPrivateFieldGet(_popupToDoEditorContainer, this),
			ownerTypeId: _classPrivateFieldGet(_entityTypeId, this),
			ownerId: _classPrivateFieldGet(_entityId, this),
			currentUser: _classPrivateFieldGet(_currentUser, this),
			pingSettings: _classPrivateFieldGet(_pingSettings, this),
			events: {
				onSaveHotkeyPressed: _assertClassBrand(_AddingPopup_brand, this, _onEditorSaveHotkeyPressed).bind(this),
				onChangeUploaderContainerSize: _assertClassBrand(_AddingPopup_brand, this, _onChangeUploaderContainerSize).bind(this),
				onFocus: _assertClassBrand(_AddingPopup_brand, this, _onFocus).bind(this)
			},
			popupMode: true
		};
		const analytics = _classPrivateFieldGet(_context, this)?.analytics ?? {};
		const section = analytics.c_section ?? null;
		const subSection = analytics.c_sub_section ?? null;
		params.calendarSettings = _classPrivateFieldGet(_calendarSettings, this);
		params.colorSettings = _classPrivateFieldGet(_colorSettings, this);
		params.defaultDescription = '';
		params.analytics = {
			section,
			subSection
		};
		_classPrivateFieldSet(_todoEditor, this, new crm_activity_todoEditorV2.TodoEditorV2(params));
	}
	function _prepareAndShowPopup(popup, mode = crm_activity_todoEditorV2.TodoEditorMode.ADD) {
		// eslint-disable-next-line no-param-reassign
		popup.params.mode = mode;
		if (mode === crm_activity_todoEditorV2.TodoEditorMode.ADD) {
			popup.show();
			return;
		}
		if (mode === crm_activity_todoEditorV2.TodoEditorMode.UPDATE) {
			void _assertClassBrand(_AddingPopup_brand, this, _fetchNearActivity).call(this).then(data => {
				if (data) {
					// eslint-disable-next-line no-param-reassign
					popup.params.activity = data;
					popup.show();
				}
			});
			return;
		}
		console.error('Wrong TodoEditor mode');
	}
	function _fetchNearActivity() {
		const data = {
			ownerTypeId: _classPrivateFieldGet(_entityTypeId, this),
			ownerId: _classPrivateFieldGet(_entityId, this)
		};
		return new Promise((resolve, reject) => {
			main_core.ajax.runAction('crm.activity.todo.getNearest', {
				data
			}).then(({
				data: responseData
			}) => resolve(responseData)).catch(response => {
				ui_notification.UI.Notification.Center.notify({
					content: response.errors[0].message,
					autoHideDelay: 5000
				});
				reject();
			});
		});
	}
	function _createPopupIfNotExists() {
		if (!_classPrivateFieldGet(_popup, this) || _classPrivateFieldGet(_popup, this).isDestroyed()) {
			_classPrivateFieldSet(_popupToDoEditorContainer, this, main_core.Tag.render`<div></div>`);
			_classPrivateFieldSet(_popupContainer, this, main_core.Tag.render`
				<div class="crm-activity-adding-popup-container">
					${_assertClassBrand(_AddingPopup_brand, this, _getPopupTitle).call(this)}
					${_classPrivateFieldGet(_popupToDoEditorContainer, this)}
				</div>
			`);
			_classPrivateFieldSet(_popup, this, new main_popup.Popup(_assertClassBrand(_AddingPopup_brand, this, _getPopupParams).call(this)));
		}
		return _classPrivateFieldGet(_popup, this);
	}
	function _getPopupTitle() {
		return main_core.Tag.render`
			<div class="crm-activity-adding-popup-title">
				${main_core.Loc.getMessage('CRM_ACTIVITY_ADDING_POPUP_TITLE')}
			</div>
		`;
	}
	function _getPopupParams() {
		const {
			innerWidth
		} = window;
		return {
			id: `kanban_planner_menu_${_classPrivateFieldGet(_entityId, this)}`,
			content: _classPrivateFieldGet(_popupContainer, this),
			cacheable: false,
			isScrollBlock: true,
			className: 'crm-activity-adding-popup',
			closeByEsc: true,
			closeIcon: false,
			padding: 16,
			minWidth: 537,
			width: Math.round(innerWidth * 0.45),
			maxWidth: 737,
			minHeight: 150,
			maxHeight: 482,
			overlay: {
				opacity: 50
			}
		};
	}
	function _saveAndClose() {
		if (_classPrivateFieldGet(_popup, this)) {
			const saveButton = _classPrivateFieldGet(_popup, this).getButton('save');
			if (saveButton.getState()) {
				return; // button is disabled
			}
			saveButton?.setWaiting(true);
			_classPrivateFieldGet(_todoEditor, this).save().then(() => {
				_classPrivateFieldGet(_popup, this).close();
				_classPrivateFieldGet(_eventEmitter, this).emit('onSave');
			}).catch(() => {}).finally(() => saveButton?.setWaiting(false));
		}
	}
	function _actualizePopupLayout(description) {
		if (_classPrivateFieldGet(_popup, this) && _classPrivateFieldGet(_popup, this).isShown()) {
			_classPrivateFieldGet(_eventEmitter, this).emit('onActualizePopupLayout', {
				entityId: _classPrivateFieldGet(_entityId, this)
			});
			_classPrivateFieldGet(_popup, this).adjustPosition({
				forceBindPosition: true
			});
		}
	}
	function _onEditorSaveHotkeyPressed() {
		_assertClassBrand(_AddingPopup_brand, this, _saveAndClose).call(this);
	}
	function _onChangeUploaderContainerSize() {
		if (_classPrivateFieldGet(_popup, this)) {
			_classPrivateFieldGet(_eventEmitter, this).emit('onActualizePopupLayout', {
				entityId: _classPrivateFieldGet(_entityId, this)
			});
			_classPrivateFieldGet(_popup, this).adjustPosition();
		}
	}
	function _onFocus() {
		setTimeout(() => {
			const popup = _assertClassBrand(_AddingPopup_brand, this, _createPopupIfNotExists).call(this);
			popup.adjustPosition({
				forceBindPosition: true
			});
		}, 0);
	}

	exports.AddingPopup = AddingPopup;

})(this.BX.Crm.Activity = this.BX.Crm.Activity || {}, BX.Crm.Activity, BX, BX.Event, BX.Main, BX.UI, BX);
//# sourceMappingURL=adding-popup.bundle.js.map
