/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, crm_activity_todoEditorV2, main_core, main_core_events, main_popup, ui_a11y, ui_buttons, ui_notification) {
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
	var _openingQueue = /*#__PURE__*/new WeakMap();
	var _lastOpeningId = /*#__PURE__*/new WeakMap();
	var _AddingPopup_brand = /*#__PURE__*/new WeakSet();
	/**
	 * @event onSave
	 * @event onClose
	 */
	let AddingPopup = /*#__PURE__*/function () {
		function AddingPopup(entityTypeId, entityId, currentUser, _settings, _params) {
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
			_classPrivateFieldInitSpec(this, _openingQueue, Promise.resolve());
			_classPrivateFieldInitSpec(this, _lastOpeningId, 0);
			_classPrivateFieldSet(_entityId, this, main_core.Text.toInteger(entityId));
			_classPrivateFieldSet(_entityTypeId, this, main_core.Text.toInteger(entityTypeId));
			_classPrivateFieldSet(_currentUser, this, currentUser);
			_classPrivateFieldSet(_eventEmitter, this, new main_core_events.EventEmitter());
			_classPrivateFieldGet(_eventEmitter, this).setEventNamespace('Crm.Activity.AddingPopup');
			if (main_core.Type.isObject(_settings)) {
				_classPrivateFieldSet(_pingSettings, this, _settings.pingSettings ?? null);
				_classPrivateFieldSet(_calendarSettings, this, _settings.calendarSettings ?? null);
				_classPrivateFieldSet(_colorSettings, this, _settings.colorSettings ?? null);
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
				// the kanban card is unlocked as soon as show() is called, so the user can move it once more or
				// ask for a new activity while the update requests are still in flight. openings are serialized
				// to keep two prefills from interleaving, and the last one wins: a superseded opening is
				// dropped at its next await point, before it applies its snapshot or shows the popup, so the
				// form always gets the mode of the last call and data read after the last move
				_classPrivateFieldSet(_lastOpeningId, this, _classPrivateFieldGet(_lastOpeningId, this) + 1);
				const openingId = _classPrivateFieldGet(_lastOpeningId, this);
				const opening = _classPrivateFieldGet(_openingQueue, this).then(() => _assertClassBrand(_AddingPopup_brand, this, _openIfLastRequested).call(this, mode, openingId));
				// the queue tail never rejects, so a broken opening does not block the following ones
				_classPrivateFieldSet(_openingQueue, this, opening.catch(() => {}));
				return opening;
			}
		}]);
	}();
	async function _openIfLastRequested(mode, openingId) {
		if (_assertClassBrand(_AddingPopup_brand, this, _isSuperseded).call(this, openingId)) {
			return;
		}
		await _assertClassBrand(_AddingPopup_brand, this, _open).call(this, mode, openingId);
	}
	function _isSuperseded(openingId) {
		return openingId !== _classPrivateFieldGet(_lastOpeningId, this);
	}
	async function _open(mode, openingId) {
		const popup = _assertClassBrand(_AddingPopup_brand, this, _createPopupIfNotExists).call(this);
		if (popup.isShown()) {
			return;
		}
		if (!_classPrivateFieldGet(_popupToDoEditorContainer, this).hasChildNodes()) {
			await _assertClassBrand(_AddingPopup_brand, this, _createToDoEditor).call(this);
			_classPrivateFieldGet(_todoEditor, this).show();
			popup.setButtons([new ui_buttons.SaveButton({
				id: 'save',
				color: ui_buttons.ButtonColor.PRIMARY,
				size: ui_buttons.ButtonSize.EXTRA_SMALL,
				round: true,
				dataset: {
					testid: _assertClassBrand(_AddingPopup_brand, this, _getTestId).call(this, 'save')
				},
				events: {
					click: _assertClassBrand(_AddingPopup_brand, this, _saveAndClose).bind(this)
				}
			}), new ui_buttons.CancelButton({
				id: 'cancel',
				size: ui_buttons.ButtonSize.EXTRA_SMALL,
				round: true,
				dataset: {
					testid: _assertClassBrand(_AddingPopup_brand, this, _getTestId).call(this, 'cancel')
				},
				events: {
					click: () => {
						_classPrivateFieldGet(_todoEditor, this)?.sendAnalyticsCancelEvent(_assertClassBrand(_AddingPopup_brand, this, _getAnalyticsContext).call(this));
						popup.close();
					}
				}
			})]);
			popup.subscribeOnce('onFirstShow', event => {
				event.target.getZIndexComponent().setZIndex(1400);
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
		}
		await _assertClassBrand(_AddingPopup_brand, this, _prepareAndShowPopup).call(this, popup, mode, openingId);
	}
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
		const analytics = _assertClassBrand(_AddingPopup_brand, this, _getAnalyticsContext).call(this);
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
	function _getAnalyticsContext() {
		return main_core.Type.isPlainObject(_classPrivateFieldGet(_context, this)?.analytics) ? _classPrivateFieldGet(_context, this).analytics : {};
	}
	// callers keep one popup per entity alive and never destroy it, so several popups share the page
	function _getTestId(element) {
		return `crm-activity-adding-popup-${element}-${_classPrivateFieldGet(_entityTypeId, this)}-${_classPrivateFieldGet(_entityId, this)}`;
	}
	async function _prepareAndShowPopup(popup, mode, openingId) {
		if (mode === crm_activity_todoEditorV2.TodoEditorMode.ADD) {
			popup.show();
			return;
		}
		if (mode !== crm_activity_todoEditorV2.TodoEditorMode.UPDATE) {
			console.error('Wrong TodoEditor mode');
			return;
		}

		// the whole update path is wrapped: show() must not reject, because no caller handles its
		// result, and an unhandled rejection would be the only trace of a broken prefill
		try {
			const activity = await _assertClassBrand(_AddingPopup_brand, this, _fetchNearActivity).call(this);
			if (_assertClassBrand(_AddingPopup_brand, this, _isSuperseded).call(this, openingId) || !activity) {
				return;
			}
			const settings = await _assertClassBrand(_AddingPopup_brand, this, _fetchActivitySettings).call(this, activity.id);
			if (_assertClassBrand(_AddingPopup_brand, this, _isSuperseded).call(this, openingId) || !settings) {
				return;
			}
			const {
				entityData,
				blocksData
			} = settings;
			await _classPrivateFieldGet(_todoEditor, this).setActivityData(entityData, blocksData, crm_activity_todoEditorV2.TodoEditorMode.UPDATE);
			// a snapshot applied just before being superseded must not be shown: the popup is checked
			// for isShown() on the next opening, so showing it here would freeze the stale data
			if (_assertClassBrand(_AddingPopup_brand, this, _isSuperseded).call(this, openingId)) {
				return;
			}
			popup.show();
		} catch (error) {
			console.error('Crm.Activity.AddingPopup: unable to open the update form', error);
		}
	}
	// resolves with null instead of rejecting on a request failure: no caller handles the result of
	// show(), so a rejection would surface as an unhandled rejection on top of the shown notification
	function _fetchNearActivity() {
		const data = {
			ownerTypeId: _classPrivateFieldGet(_entityTypeId, this),
			ownerId: _classPrivateFieldGet(_entityId, this)
		};
		return new Promise((resolve, reject) => {
			main_core.ajax.runAction('crm.activity.todo.getNearest', {
				data
			})
			// the shape is checked instead of being destructured, so that an unexpected response
			// is rejected as a defect and never reaches the request failure handler below
			.then(response => {
				if (!main_core.Type.isPlainObject(response) || !('data' in response)) {
					reject(new Error('crm.activity.todo.getNearest returned an unexpected response'));
					return;
				}

				// null when the entity has no unfinished activity
				resolve(response.data);
			}).catch(response => {
				_assertClassBrand(_AddingPopup_brand, this, _notifyFetchError).call(this, response);
				resolve(null);
			});
		});
	}
	function _fetchActivitySettings(activityId) {
		const data = {
			id: activityId,
			ownerTypeId: _classPrivateFieldGet(_entityTypeId, this),
			ownerId: _classPrivateFieldGet(_entityId, this)
		};
		return new Promise((resolve, reject) => {
			main_core.ajax.runAction('crm.activity.todo.fetchSettings', {
				data
			}).then(response => {
				if (!main_core.Type.isPlainObject(response) || !('data' in response)) {
					reject(new Error('crm.activity.todo.fetchSettings returned an unexpected response'));
					return;
				}

				// null when the activity is gone between the two requests
				resolve(response.data);
			}).catch(response => {
				_assertClassBrand(_AddingPopup_brand, this, _notifyFetchError).call(this, response);
				resolve(null);
			});
		});
	}
	function _notifyFetchError(response) {
		const message = response?.errors?.[0]?.message;
		if (!message) {
			console.error('Crm.Activity.AddingPopup: the request failed without a message to show', response);
			return;
		}
		ui_notification.UI.Notification.Center.notify({
			content: message,
			autoHideDelay: 5000
		});
		ui_a11y.LiveAnnouncer.announce(message, 'assertive');
	}
	function _createPopupIfNotExists() {
		if (!_classPrivateFieldGet(_popup, this) || _classPrivateFieldGet(_popup, this).isDestroyed()) {
			_classPrivateFieldSet(_popupToDoEditorContainer, this, main_core.Tag.render`<div data-testid="${_assertClassBrand(_AddingPopup_brand, this, _getTestId).call(this, 'editor')}"></div>`);
			_classPrivateFieldSet(_popupContainer, this, main_core.Tag.render`
				<div class="crm-activity-adding-popup-container" data-testid="${_assertClassBrand(_AddingPopup_brand, this, _getTestId).call(this, 'container')}">
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

})(this.BX.Crm.Activity = this.BX.Crm.Activity || {}, BX.Crm.Activity, BX, BX.Event, BX.Main, BX.UI.Accessibility, BX.UI, BX.UI.Notification);
//# sourceMappingURL=adding-popup.bundle.js.map
