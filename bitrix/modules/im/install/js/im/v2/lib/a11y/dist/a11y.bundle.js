/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, main_popup, ui_a11y, main_core) {
	'use strict';

	const CHAT_DETAIL_FOCUS_CONTEXT = 'chatDetailFocusContext';
	const DetailArea = Object.freeze({
		header: 'header',
		preFeed: 'pre-feed',
		feed: 'feed',
		composerOrReplacement: 'composer-or-replacement',
		postComposer: 'post-composer',
		sidebar: 'sidebar'
	});
	const DetailLayer = Object.freeze({
		base: 'base',
		comments: 'comments'
	});
	function isEnabled(element) {
		return ui_a11y.InteractivityChecker.isFocusable(element) && !ui_a11y.InteractivityChecker.isDisabled(element);
	}
	function byDocumentPosition(first, second) {
		const relation = first.element.compareDocumentPosition(second.element);
		if ((relation & Node.DOCUMENT_POSITION_FOLLOWING) !== 0) {
			return -1;
		}
		if ((relation & Node.DOCUMENT_POSITION_PRECEDING) !== 0) {
			return 1;
		}
		return 0;
	}
	function isFocusHeldByPopup() {
		const activeElement = ui_a11y.FocusNavigator.getActiveElement();
		return main_popup.PopupWindowManager.getPopups().some(popup => {
			if (!popup.isShown()) {
				return false;
			}
			const isTrapped = popup.getFocusTrap()?.isActive() === true;
			const holdsActiveElement = activeElement !== null && popup.getPopupContainer().contains(activeElement);
			return isTrapped || holdsActiveElement;
		});
	}
	class ChatDetailFocusContext {
		#activeDialogId = '';
		#activeLayer = DetailLayer.base;
		#areas = new Map();
		#areaEntryTargets = new Map();
		#headers = new Map();
		#intents = new Map();
		#armedRestores = new Set();
		setActiveDialogId(dialogId) {
			if (dialogId === this.#activeDialogId) {
				return;
			}
			this.#activeDialogId = dialogId;
			this.#intents.clear();
		}
		getActiveDialogId() {
			return this.#activeDialogId;
		}
		setActiveLayer(layer) {
			if (layer === this.#activeLayer) {
				return;
			}
			this.#activeLayer = layer;
			this.#intents.clear();
		}
		getActiveLayer() {
			return this.#activeLayer;
		}
		registerArea(area, element) {
			if (!main_core.Type.isElementNode(element)) {
				return;
			}
			this.#areas.set(area, element);
		}
		unregisterArea(area, element) {
			if (this.#areas.get(area) !== element) {
				return;
			}
			this.#areas.delete(area);
		}
		getAreaElement(area) {
			return this.#areas.get(area) ?? null;
		}
		registerAreaEntryTarget(area, element) {
			if (!main_core.Type.isElementNode(element)) {
				return;
			}
			this.#areaEntryTargets.set(area, element);
		}
		unregisterAreaEntryTarget(area, element) {
			if (this.#areaEntryTargets.get(area) !== element) {
				return;
			}
			this.#areaEntryTargets.delete(area);
		}
		getAreaEntryTarget(area) {
			return this.#areaEntryTargets.get(area) ?? null;
		}
		registerHeaderRoot(element) {
			if (!main_core.Type.isElementNode(element)) {
				return;
			}
			this.#releaseHeaderRoot(element);
			const registry = this.#takeHeaderRegistry(this.#activeDialogId);
			registry.root = element;
			this.#adoptControlsInside(this.#activeDialogId, element);
		}
		unregisterHeaderRoot(element) {
			this.#releaseHeaderRoot(element);
			this.#pruneEmptyRegistries();
		}
		registerHeaderControl(registration) {
			if (!main_core.Type.isStringFilled(registration.key) || !main_core.Type.isElementNode(registration.element)) {
				return;
			}
			const owner = this.#resolveControlOwner(registration.element);
			this.#dropHeaderControl(registration.key, registration.element);
			this.#takeHeaderRegistry(owner).controls.set(registration.key, {
				key: registration.key,
				element: registration.element,
				after: main_core.Type.isStringFilled(registration.after) ? registration.after : null
			});
		}
		unregisterHeaderControl(key, element) {
			this.beforeHeaderControlChange(element);
			this.#dropHeaderControl(key, element);
		}
		beforeHeaderControlChange(element) {
			const owner = this.#findRegisteredControlOwner(element);
			if (owner !== null) {
				this.captureHeaderFocus(owner);
			}
		}
		getHeaderControlElement(key) {
			return this.#headers.get(this.#activeDialogId)?.controls.get(key)?.element ?? null;
		}
		getHeaderSnapshot() {
			return this.#buildOrder(this.#activeDialogId).map(control => {
				return {
					key: control.key,
					enabled: isEnabled(control.element)
				};
			});
		}
		captureHeaderFocus(dialogId) {
			const registry = this.#headers.get(dialogId);
			const isNothingToCapture = registry === undefined || registry.capture !== null || dialogId !== this.#activeDialogId || !this.#ownsActiveElement(registry);
			if (isNothingToCapture) {
				return;
			}
			const order = this.#buildOrder(dialogId);
			const focusedKey = this.#findFocusedKey(order);
			if (focusedKey === null) {
				return;
			}
			registry.capture = {
				focusedKey,
				order: order.map(control => control.key)
			};
			this.#armHeaderFocusRestore(dialogId);
		}
		restoreHeaderFocus(dialogId) {
			const registry = this.#headers.get(dialogId);
			if (registry === undefined) {
				return;
			}
			const capture = registry.capture;
			registry.capture = null;
			if (capture === null || dialogId !== this.#activeDialogId) {
				return;
			}
			const snapshot = this.getHeaderSnapshot();
			const isStillThere = snapshot.some(entry => {
				return entry.key === capture.focusedKey && entry.enabled;
			});
			if (isStillThere) {
				return;
			}
			if (isFocusHeldByPopup()) {
				return;
			}
			if (!this.#ownsActiveElement(registry) && !ui_a11y.FocusNavigator.isFocusLost()) {
				return;
			}
			this.#focusRestoreTarget(registry, capture, snapshot);
		}
		armIntent(intent) {
			const isComplete = main_core.Type.isStringFilled(intent.name) && main_core.Type.isStringFilled(intent.dialogId) && main_core.Type.isStringFilled(intent.openerKey);
			if (!isComplete || intent.dialogId !== this.#activeDialogId) {
				return;
			}
			this.#intents.set(intent.name, {
				...intent
			});
		}
		getIntent(name) {
			const intent = this.#intents.get(name);
			return intent ? {
				...intent
			} : null;
		}
		consumeIntent(name) {
			const intent = this.getIntent(name);
			this.#intents.delete(name);
			return intent;
		}
		clearIntent(name) {
			this.#intents.delete(name);
		}
		destroy() {
			this.#activeDialogId = '';
			this.#activeLayer = DetailLayer.base;
			this.#areas.clear();
			this.#areaEntryTargets.clear();
			this.#headers.clear();
			this.#intents.clear();
			this.#armedRestores.clear();
		}
		#armHeaderFocusRestore(dialogId) {
			if (this.#armedRestores.has(dialogId)) {
				return;
			}
			this.#armedRestores.add(dialogId);
			void Promise.resolve().then(() => {
				this.#armedRestores.delete(dialogId);
				this.restoreHeaderFocus(dialogId);
			});
		}
		#takeHeaderRegistry(dialogId) {
			const known = this.#headers.get(dialogId);
			if (known !== undefined) {
				return known;
			}
			const registry = {
				root: null,
				controls: new Map(),
				capture: null
			};
			this.#headers.set(dialogId, registry);
			return registry;
		}
		#resolveControlOwner(element) {
			for (const [dialogId, registry] of this.#headers) {
				if (registry.root?.contains(element) === true) {
					return dialogId;
				}
			}
			return this.#activeDialogId;
		}
		#findRegisteredControlOwner(element) {
			for (const [dialogId, registry] of this.#headers) {
				for (const control of registry.controls.values()) {
					if (control.element === element) {
						return dialogId;
					}
				}
			}
			return null;
		}
		#dropHeaderControl(key, element) {
			this.#headers.forEach(registry => {
				if (registry.controls.get(key)?.element === element) {
					registry.controls.delete(key);
				}
			});
			this.#pruneEmptyRegistries();
		}
		#adoptControlsInside(dialogId, root) {
			const registry = this.#takeHeaderRegistry(dialogId);
			this.#headers.forEach((other, otherDialogId) => {
				if (otherDialogId === dialogId) {
					return;
				}
				other.controls.forEach(control => {
					if (!root.contains(control.element)) {
						return;
					}
					other.controls.delete(control.key);
					registry.controls.set(control.key, control);
				});
			});
			this.#pruneEmptyRegistries();
		}
		#releaseHeaderRoot(element) {
			for (const registry of this.#headers.values()) {
				if (registry.root === element) {
					registry.root = null;
				}
			}
		}
		#pruneEmptyRegistries() {
			this.#headers.forEach((registry, dialogId) => {
				if (registry.root === null && registry.controls.size === 0) {
					this.#headers.delete(dialogId);
				}
			});
		}
		#buildOrder(dialogId) {
			const anchored = [];
			const logical = [];
			this.#headers.get(dialogId)?.controls.forEach(control => {
				if (!control.element.isConnected) {
					return;
				}
				(control.after === null ? anchored : logical).push(control);
			});
			const order = anchored.sort(byDocumentPosition);
			logical.forEach(control => {
				const anchorIndex = order.findIndex(placed => placed.key === control.after);
				if (anchorIndex === -1) {
					return;
				}
				order.splice(anchorIndex + 1, 0, control);
			});
			return order;
		}
		#findFocusedKey(order) {
			const activeElement = ui_a11y.FocusNavigator.getActiveElement();
			if (activeElement === null) {
				return null;
			}
			const focused = order.find(control => control.element.contains(activeElement));
			return focused?.key ?? null;
		}
		#ownsActiveElement(registry) {
			const activeElement = ui_a11y.FocusNavigator.getActiveElement();
			if (activeElement === null) {
				return false;
			}
			if (registry.root?.contains(activeElement) === true) {
				return true;
			}
			return [...registry.controls.values()].some(control => {
				return control.element.contains(activeElement);
			});
		}
		#focusRestoreTarget(registry, capture, snapshot) {
			const target = this.#findRestoreTarget(registry, capture, snapshot);
			if (target !== null) {
				ui_a11y.FocusNavigator.focusTarget(target, {
					preventScroll: true
				});
				return;
			}
			if (registry.root !== null) {
				ui_a11y.FocusNavigator.focusContainer(registry.root, {
					preventScroll: true
				});
			}
		}
		#findRestoreTarget(registry, capture, snapshot) {
			const focusedIndex = capture.order.indexOf(capture.focusedKey);
			if (focusedIndex === -1) {
				return null;
			}
			const enabledKeys = new Set(snapshot.filter(entry => entry.enabled).map(entry => entry.key));
			const toTheRight = capture.order.slice(focusedIndex + 1);
			const toTheLeft = capture.order.slice(0, focusedIndex).reverse();
			const targetKey = [...toTheRight, ...toTheLeft].find(key => enabledKeys.has(key));
			return targetKey === undefined ? null : registry.controls.get(targetKey)?.element ?? null;
		}
	}

	const pendingHandoffs = new Map();
	function findHandoff(matches) {
		return [...pendingHandoffs.values()].find(handoff => matches(handoff)) ?? null;
	}
	function findHandoffOfNestedList(nestedList) {
		return findHandoff(handoff => {
			return handoff.layoutName === nestedList.layoutName && handoff.dialogId === nestedList.dialogId;
		});
	}
	function armKeyboardFocusHandoff(handoff) {
		const isComplete = main_core.Type.isStringFilled(handoff.searchAreaId) && main_core.Type.isStringFilled(handoff.layoutName) && main_core.Type.isStringFilled(handoff.dialogId);
		if (!isComplete) {
			return;
		}
		pendingHandoffs.set(handoff.searchAreaId, {
			...handoff,
			heldByNestedList: false
		});
	}
	function getKeyboardFocusHandoff(searchAreaId) {
		const pendingHandoff = pendingHandoffs.get(searchAreaId);
		if (!pendingHandoff) {
			return null;
		}
		return {
			searchAreaId: pendingHandoff.searchAreaId,
			layoutName: pendingHandoff.layoutName,
			dialogId: pendingHandoff.dialogId
		};
	}
	function isKeyboardFocusHandoffPending(handoff) {
		const pendingHandoff = pendingHandoffs.get(handoff.searchAreaId);
		if (!pendingHandoff) {
			return false;
		}
		return pendingHandoff.layoutName === handoff.layoutName && pendingHandoff.dialogId === handoff.dialogId;
	}
	function clearKeyboardFocusHandoff(searchAreaId) {
		pendingHandoffs.delete(searchAreaId);
	}
	function holdKeyboardFocusHandoffForNestedList(nestedList) {
		const handoff = findHandoffOfNestedList(nestedList);
		if (handoff) {
			handoff.heldByNestedList = true;
		}
	}
	function isKeyboardFocusHandoffHeldByNestedList(nestedList) {
		return findHandoffOfNestedList(nestedList)?.heldByNestedList === true;
	}
	function isKeyboardFocusHandoffOfAreaHeldByNestedList(searchAreaId) {
		return pendingHandoffs.get(searchAreaId)?.heldByNestedList === true;
	}
	function releaseKeyboardFocusHandoffFromNestedList(nestedList) {
		const handoff = findHandoff(pendingHandoff => {
			return pendingHandoff.heldByNestedList && pendingHandoff.dialogId === nestedList.dialogId;
		});
		if (!handoff) {
			return null;
		}
		pendingHandoffs.delete(handoff.searchAreaId);
		return handoff.layoutName === nestedList.layoutName ? handoff.searchAreaId : null;
	}

	const VERTICAL_LIST_BIND_KEYS = ui_a11y.FocusKeys.ArrowVertical | ui_a11y.FocusKeys.HomeAndEnd;
	function createListFocusZone(container, options = {}) {
		return new ui_a11y.FocusZone(container, {
			bindKeys: VERTICAL_LIST_BIND_KEYS,
			focusOutBehavior: 'stop',
			...options
		});
	}
	function isFocusOwnedByPopup() {
		return main_popup.PopupWindowManager.isAnyPopupShown();
	}

	exports.CHAT_DETAIL_FOCUS_CONTEXT = CHAT_DETAIL_FOCUS_CONTEXT;
	exports.ChatDetailFocusContext = ChatDetailFocusContext;
	exports.DetailArea = DetailArea;
	exports.DetailLayer = DetailLayer;
	exports.armKeyboardFocusHandoff = armKeyboardFocusHandoff;
	exports.clearKeyboardFocusHandoff = clearKeyboardFocusHandoff;
	exports.createListFocusZone = createListFocusZone;
	exports.getKeyboardFocusHandoff = getKeyboardFocusHandoff;
	exports.holdKeyboardFocusHandoffForNestedList = holdKeyboardFocusHandoffForNestedList;
	exports.isFocusOwnedByPopup = isFocusOwnedByPopup;
	exports.isKeyboardFocusHandoffHeldByNestedList = isKeyboardFocusHandoffHeldByNestedList;
	exports.isKeyboardFocusHandoffOfAreaHeldByNestedList = isKeyboardFocusHandoffOfAreaHeldByNestedList;
	exports.isKeyboardFocusHandoffPending = isKeyboardFocusHandoffPending;
	exports.releaseKeyboardFocusHandoffFromNestedList = releaseKeyboardFocusHandoffFromNestedList;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX.Main, BX.UI.Accessibility, BX);
//# sourceMappingURL=a11y.bundle.js.map
