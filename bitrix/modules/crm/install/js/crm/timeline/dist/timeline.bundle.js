/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, crm_timeline_item, main_core, main_date, crm_timeline_tools, ui_vue3, main_loader, ui_iconSet_api_vue, rest_client, ui_analytics, ui_notification, ui_infoHelper, ui_system_menu, ui_buttons, ui_vue3_directives_hint, main_popup, ui_iconSet_api_core, ui_vue3_components_button, crm_field_colorSelector, main_core_events, ui_designTokens, ui_system_label, ui_cnt, crm_timeline_dialog) {
	'use strict';

	/** @memberof BX.Crm.Timeline.Animation */
	class Expand {
		#overlay;
		#startHeight;
		#node;
		#callback;
		constructor() {
			this.#node = null;
			this.#callback = null;
			this.#overlay = null;
			this.#startHeight = 0;
		}
		initialize(node, callback, options) {
			this.#node = node;
			this.#callback = BX.type.isFunction(callback) ? callback : null;
			this.#startHeight = options?.startHeight || 0;
		}
		run() {
			if (this.#isNodeVisible(this.#node) === false) {
				if (this.#callback) {
					this.#callback();
				}
				return;
			}
			requestAnimationFrame(() => {
				const position = main_core.Dom.getPosition(this.#node);
				const elemStyle = getComputedStyle(this.#node);
				const paddingTop = parseInt(elemStyle.getPropertyValue('padding-top'), 10);
				const paddingBottom = parseInt(elemStyle.getPropertyValue('padding-bottom'), 10);
				const marginBottom = parseInt(elemStyle.getPropertyValue('margin-bottom'), 10);
				const startHeight = this.#startHeight;
				main_core.Dom.style(this.#node, {
					height: `${startHeight}px`,
					overflowY: 'clip',
					position: 'relative',
					padding: 0,
					marginBottom: 0
				});
				requestAnimationFrame(() => {
					main_core.Dom.style(this.#node, 'transition', 'transition: height 220ms ease, opacity 220ms ease, background-color 220ms ease');
					this.#overlay = main_core.Tag.render`<div class="crm-timeline__card_overlay crm-timeline__card-scope"></div>`;
					main_core.Dom.append(this.#overlay, this.#node);
					setTimeout(() => {
						// eslint-disable-next-line new-cap
						new BX.easing({
							duration: 400,
							start: {
								height: startHeight,
								overlayOpacity: 0,
								paddingTop: 0,
								paddingBottom: 0,
								marginBottom: 0
							},
							finish: {
								height: position.height,
								overlayOpacity: 50,
								paddingTop,
								paddingBottom,
								marginBottom
							},
							transition: BX.easing.makeEaseOut(BX.easing.transitions.quart),
							step: this.onNodeHeightStep.bind(this),
							complete: this.onNodeHeightComplete.bind(this)
						}).animate();
					}, 200);
				});
			});
		}
		onNodeHeightStep(state) {
			main_core.Dom.style(this.#overlay, 'opacity', 1 - state.overlayOpacity / 100);
			main_core.Dom.style(this.#node, {
				height: `${state.height}px`,
				paddingTop: `${state.paddingTop}px`,
				paddingBottom: `${state.paddingBottom}px`,
				marginBottom: `${state.marginBottom}px`
			});
		}
		onNodeHeightComplete() {
			setTimeout(() => {
				main_core.bindOnce(this.#overlay, 'transitionend', () => {
					main_core.Dom.remove(this.#overlay);
					this.#overlay = null;
					const color = main_core.Dom.style(this.#node, '--crm-timeline__card-color-background');
					main_core.Dom.style(this.#node, null);
					if (main_core.Type.isStringFilled(color)) {
						main_core.Dom.style(this.#node, '--crm-timeline__card-color-background', color);
					}
				});
				main_core.Dom.style(this.#overlay, 'opacity', 0);
				if (this.#callback) {
					this.#callback();
				}
			}, 400);
		}
		#isNodeVisible(node) {
			const position = main_core.Dom.getPosition(this.#node);
			return position.width !== 0 && position.height !== 0;
		}
		static create(node, callback, options) {
			const self = new Expand();
			self.initialize(node, callback, options);
			return self;
		}
	}

	/** @memberof BX.Crm.Timeline.Types */
	const Item$1 = {
		undefined: 0,
		activity: 1,
		creation: 2,
		modification: 3,
		link: 4,
		unlink: 5,
		mark: 6,
		comment: 7,
		wait: 8,
		bizproc: 9,
		conversion: 10,
		sender: 11,
		document: 12,
		restoration: 13,
		order: 14,
		orderCheck: 15,
		scoring: 16,
		externalNotification: 17,
		finalSummary: 18,
		delivery: 19,
		finalSummaryDocuments: 20,
		storeDocument: 21,
		productCompilation: 22,
		signDocument: 23
	};

	/** @memberof BX.Crm.Timeline.Types */
	const Mark$1 = {
		undefined: 0,
		waiting: 1,
		success: 2,
		renew: 3,
		ignored: 4,
		failed: 5
	};

	/** @memberof BX.Crm.Timeline.Types */

	/** @memberof BX.Crm.Timeline.Types */
	const Order = {
		encourageBuyProducts: 100
	};

	/** @memberof BX.Crm.Timeline.Types */
	const EditorMode = {
		view: 1,
		edit: 2
	};

	var types = /*#__PURE__*/Object.freeze({
		__proto__: null,
		EditorMode: EditorMode,
		Item: Item$1,
		Mark: Mark$1,
		Order: Order
	});

	/** @memberof BX.Crm.Timeline */
	class CompatibleItem extends crm_timeline_item.Item {
		constructor() {
			super();
			this._id = "";
			this._settings = {};
			this._data = {};
			this._container = null;
			this._typeCategoryId = null;
			this._associatedEntityData = null;
			this._associatedEntityTypeId = null;
			this._associatedEntityId = null;
			this._isContextMenuShown = false;
			this._contextMenuButton = null;
			this._activityEditor = null;
			this._actions = [];
			this._actionContainer = null;
			this._existedStreamItemDeadLine = null;
		}
		initialize(id, settings) {
			this._setId(id);
			this._settings = settings ? settings : {};
			this._container = this.getSetting("container");
			if (!BX.type.isPlainObject(settings['data'])) {
				throw "Item. A required parameter 'data' is missing.";
			}
			this._data = settings['data'];
			this._activityEditor = this.getSetting("activityEditor");
			this.doInitialize();
		}
		doInitialize() {}
		getId() {
			return this._id;
		}
		getSetting(name, defaultval) {
			return this._settings.hasOwnProperty(name) ? this._settings[name] : defaultval;
		}
		getData() {
			return this._data;
		}
		setData(data) {
			if (BX.type.isPlainObject(data)) {
				this._data = data;
				this.clearCachedData();
			}
		}
		getSort() {
			return this._data['sort'] ?? [];
		}
		getAssociatedEntityData() {
			if (this._associatedEntityData === null) {
				this._associatedEntityData = BX.type.isPlainObject(this._data["ASSOCIATED_ENTITY"]) ? this._data["ASSOCIATED_ENTITY"] : {};
			}
			return this._associatedEntityData;
		}
		getAssociatedEntityTypeId() {
			if (this._associatedEntityTypeId === null) {
				this._associatedEntityTypeId = BX.prop.getInteger(this._data, "ASSOCIATED_ENTITY_TYPE_ID", 0);
			}
			return this._associatedEntityTypeId;
		}
		getAssociatedEntityId() {
			if (this._associatedEntityId === null) {
				this._associatedEntityId = BX.prop.getInteger(this._data, "ASSOCIATED_ENTITY_ID", 0);
			}
			return this._associatedEntityId;
		}
		setAssociatedEntityData(associatedEntityData) {
			if (!BX.type.isPlainObject(associatedEntityData)) {
				associatedEntityData = {};
			}
			const data = this._data;
			data.ASSOCIATED_ENTITY = associatedEntityData;
			this.setData(data);
		}
		hasPermissions() {
			const entityData = this.getAssociatedEntityData();
			return BX.type.isPlainObject(entityData["PERMISSIONS"]);
		}
		getPermissions() {
			return BX.prop.getObject(this.getAssociatedEntityData(), "PERMISSIONS", {});
		}
		setPermissions(permissions) {
			const data = this._data;
			if (!main_core.Type.isPlainObject(data.ASSOCIATED_ENTITY)) {
				data.ASSOCIATED_ENTITY = {};
			}
			data.ASSOCIATED_ENTITY.PERMISSIONS = permissions;
			this.setData(data);
		}
		getTextDataParam(name) {
			return BX.prop.getString(this._data, name, "");
		}
		getObjectDataParam(name) {
			return BX.prop.getObject(this._data, name, {});
		}
		getArrayDataParam(name) {
			return BX.prop.getArray(this._data, name, []);
		}
		getTypeId() {
			return Item$1.undefined;
		}
		getTypeCategoryId() {
			if (this._typeCategoryId === null) {
				this._typeCategoryId = BX.prop.getInteger(this._data, "TYPE_CATEGORY_ID", 0);
			}
			return this._typeCategoryId;
		}
		getContainer() {
			return this._container;
		}
		setContainer(container) {
			this._container = BX.type.isElementNode(container) ? container : null;
		}
		layout(options) {
			if (!BX.type.isElementNode(this._container)) {
				throw "Item. Container is not assigned.";
			}
			this.prepareLayout(options);
			//region Actions
			/**/
			this.prepareActions();
			const actionQty = this._actions.length;
			for (let i = 0; i < actionQty; i++) {
				this._actions[i].layout();
			}
			this.showActions(actionQty > 0);
			/**/
			//endregion
		}
		prepareLayout(options) {}
		prepareActions() {}
		showActions(show) {}
		clearCachedData() {
			this._typeCategoryId = null;
			this._associatedEntityData = null;
			this._associatedEntityTypeId = null;
			this._associatedEntityId = null;
		}
		isDone() {
			return false;
		}
		markAsDone(isDone) {}
		view() {}
		edit() {}
		fasten() {}
		unfasten() {}
		remove() {}
		cutOffText(text, length) {
			if (!BX.type.isNumber(length)) {
				length = 0;
			}
			if (length <= 0 || text.length <= length) {
				return text;
			}
			let offset = length - 1;
			const whilespaceOffset = text.substring(offset).search(/\s/i);
			if (whilespaceOffset > 0) {
				offset += whilespaceOffset;
			}
			return text.substring(0, offset);
		}
		prepareMultilineCutOffElements(text, length, clickHandler) {
			if (!BX.type.isNumber(length)) {
				length = 0;
			}
			if (length <= 0 || text.length <= length) {
				return [BX.util.htmlspecialchars(text).replace(/(?:\r\n|\r|\n)/g, '<br>')];
			}
			let offset = length - 1;
			const whilespaceOffset = text.substring(offset).search(/\s/i);
			if (whilespaceOffset > 0) {
				offset += whilespaceOffset;
			}
			return [BX.util.htmlspecialchars(text.substring(0, offset)).replace(/(?:\r\n|\r|\n)/g, '<br>') + "&hellip;&nbsp;", BX.create("A", {
				attrs: {
					className: "crm-entity-stream-content-letter-more",
					href: "#"
				},
				events: {
					click: clickHandler
				},
				text: this.getMessage("details")
			})];
		}
		prepareCutOffElements(text, length, clickHandler) {
			if (!BX.type.isNumber(length)) {
				length = 0;
			}
			if (length <= 0 || text.length <= length) {
				return [BX.util.htmlspecialchars(text)];
			}
			let offset = length - 1;
			const whilespaceOffset = text.substring(offset).search(/\s/i);
			if (whilespaceOffset > 0) {
				offset += whilespaceOffset;
			}
			return [BX.util.htmlspecialchars(text.substring(0, offset)) + "&hellip;&nbsp;", BX.create("A", {
				attrs: {
					className: "crm-entity-stream-content-letter-more",
					href: "#"
				},
				events: {
					click: clickHandler
				},
				text: this.getMessage("details")
			})];
		}
		prepareAuthorLayout() {
			const authorInfo = this.getObjectDataParam("AUTHOR", null);
			if (!authorInfo) {
				return null;
			}
			const showUrl = BX.prop.getString(authorInfo, "SHOW_URL", "");
			if (showUrl === "") {
				return null;
			}
			const link = BX.create("A", {
				attrs: {
					className: "ui-icon ui-icon-common-user crm-entity-stream-content-detail-employee",
					href: showUrl,
					target: "_blank",
					title: BX.prop.getString(authorInfo, "FORMATTED_NAME", "")
				},
				children: [BX.create('i', {})]
			});
			const imageUrl = BX.prop.getString(authorInfo, "IMAGE_URL", "");
			if (imageUrl !== "") {
				link.children[0].style.backgroundImage = "url('" + encodeURI(imageUrl) + "')";
				link.children[0].style.backgroundSize = "21px";
			}
			return link;
		}
		onActivityCreate(activity, data) {}
		isContextMenuEnabled() {
			return false;
		}
		prepareContextMenuButton() {
			this._contextMenuButton = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section-context-menu"
				},
				events: {
					click: BX.delegate(this.onContextMenuButtonClick, this)
				}
			});
			return this._contextMenuButton;
		}
		onContextMenuButtonClick(e) {
			if (!this._isContextMenuShown) {
				this.openContextMenu();
			} else {
				this.closeContextMenu();
			}
		}
		openContextMenu() {
			const menuItems = this.prepareContextMenuItems();
			if (typeof IntranetExtensions !== "undefined") {
				menuItems.push(IntranetExtensions);
			}
			if (menuItems.length === 0) {
				return;
			}
			BX.PopupMenu.show(this._id, this._contextMenuButton, menuItems, {
				offsetTop: 0,
				offsetLeft: 16,
				angle: {
					position: "top",
					offset: 0
				},
				events: {
					onPopupShow: BX.delegate(this.onContextMenuShow, this),
					onPopupClose: BX.delegate(this.onContextMenuClose, this),
					onPopupDestroy: BX.delegate(this.onContextMenuDestroy, this)
				}
			});
			this._contextMenu = BX.PopupMenu.currentItem;
		}
		closeContextMenu() {
			if (this._contextMenu) {
				this._contextMenu.close();
			}
		}
		prepareContextMenuItems() {
			return [];
		}
		onContextMenuShow() {
			this._isContextMenuShown = true;
			BX.addClass(this._contextMenuButton, "active");
		}
		onContextMenuClose() {
			if (this._contextMenu) {
				this._contextMenu.popupWindow.destroy();
			}
		}
		onContextMenuDestroy() {
			this._isContextMenuShown = false;
			BX.removeClass(this._contextMenuButton, "active");
			this._contextMenu = null;
			if (typeof BX.PopupMenu.Data[this._id] !== "undefined") {
				delete BX.PopupMenu.Data[this._id];
			}
		}
		getMessage(name) {
			const m = CompatibleItem.messages;
			return m.hasOwnProperty(name) ? m[name] : name;
		}
		static getUserTimezoneOffset() {
			return main_date.Timezone.Offset.USER_TO_SERVER;
		}
		static messages = {};
	}

	/** @memberof BX.Crm.Timeline.Animation */
	class Fasten {
		constructor() {
			this._id = "";
			this._settings = {};
			this._initialItem = null;
			this._finalItem = null;
			this._events = null;
		}
		initialize(id, settings) {
			this._id = BX.type.isNotEmptyString(id) ? id : BX.util.getRandomString(4);
			this._settings = settings ? settings : {};
			this._initialItem = this.getSetting("initialItem");
			this._finalItem = this.getSetting("finalItem");
			this._anchor = this.getSetting("anchor");
			this._events = this.getSetting("events", {});
		}
		getId() {
			return this._id;
		}
		getSetting(name, defaultValue) {
			return this._settings.hasOwnProperty(name) ? this._settings[name] : defaultValue;
		}
		addFixedHistoryItem() {
			const node = this._finalItem.getWrapper();
			BX.addClass(node, 'crm-entity-stream-section-animate-start');
			if (this._anchor.parentNode && node) {
				this._anchor.parentNode.insertBefore(node, this._anchor.nextSibling);
			}
			setTimeout(BX.delegate(function () {
				BX.removeClass(node, 'crm-entity-stream-section-animate-start');
			}, this), 0);
		}
		run() {
			const node = this._initialItem.getWrapper();
			this._clone = node.cloneNode(true);
			BX.addClass(this._clone, 'crm-entity-stream-section-animate-start crm-entity-stream-section-top-fixed');
			this._startPosition = BX.pos(node);
			this._clone.style.position = "absolute";
			this._clone.style.width = this._startPosition.width + "px";
			let _cloneHeight = this._startPosition.height;
			const _minHeight = 65;
			const _sumPaddingContent = 18;
			if (_cloneHeight < _sumPaddingContent + _minHeight) _cloneHeight = _sumPaddingContent + _minHeight;
			this._clone.style.height = _cloneHeight + "px";
			this._clone.style.top = this._startPosition.top + "px";
			this._clone.style.left = this._startPosition.left + "px";
			this._clone.style.zIndex = 960;
			document.body.appendChild(this._clone);
			setTimeout(BX.proxy(function () {
				BX.addClass(this._clone, "crm-entity-stream-section-casper");
			}, this), 0);
			this._anchorPosition = BX.pos(this._anchor);
			const finish = {
				top: this._anchorPosition.top,
				height: _cloneHeight + 15,
				opacity: 1
			};
			const _difference = this._startPosition.top - this._anchorPosition.bottom;
			const _deepHistoryLimit = 2 * (document.body.clientHeight + this._startPosition.height);
			if (_difference > _deepHistoryLimit) {
				finish.top = this._startPosition.top - _deepHistoryLimit;
				finish.opacity = 0;
			}
			let _duration = Math.abs(finish.top - this._startPosition.top) * 2;
			_duration = _duration < 1500 ? 1500 : _duration;
			const movingEvent = new BX.easing({
				duration: _duration,
				start: {
					top: this._startPosition.top,
					height: 0,
					opacity: 1
				},
				finish: finish,
				transition: BX.easing.makeEaseOut(BX.easing.transitions.quart),
				step: BX.proxy(function (state) {
					this._clone.style.top = state.top + "px";
					this._clone.style.opacity = state.opacity;
					this._anchor.style.height = state.height + "px";
				}, this),
				complete: BX.proxy(function () {
					this.finish();
				}, this)
			});
			movingEvent.animate();
		}
		finish() {
			this._anchor.style.height = 0;
			this.addFixedHistoryItem();
			BX.remove(this._clone);
			if (BX.type.isFunction(this._events["complete"])) {
				this._events["complete"]();
			}
		}
		static create(id, settings) {
			const self = new Fasten();
			self.initialize(id, settings);
			return self;
		}
	}

	/** @memberof BX.Crm.Timeline.Items */
	let History$1 = class History extends CompatibleItem {
		constructor() {
			super();
			this._history = null;
			this._fixedHistory = null;
			this._typeId = null;
			this._createdTime = null;
			this._isFixed = false;
			this._headerClickHandler = BX.delegate(this.onHeaderClick, this);
		}
		doInitialize() {
			this._history = this.getSetting("history");
			this._fixedHistory = this.getSetting("fixedHistory");
		}
		getTypeId() {
			if (this._typeId === null) {
				this._typeId = BX.prop.getInteger(this._data, "TYPE_ID", Item$1.undefined);
			}
			return this._typeId;
		}
		getTitle() {
			return "";
		}
		isContextMenuEnabled() {
			return !this.isReadOnly();
		}
		getCreatedTimestamp() {
			return this.getTextDataParam("CREATED_SERVER");
		}
		getCreatedTime() {
			if (this._createdTime === null) {
				const time = BX.parseDate(this.getCreatedTimestamp(), false, "YYYY-MM-DD", "YYYY-MM-DD HH:MI:SS");
				this._createdTime = new crm_timeline_tools.DatetimeConverter(time).toUserTime().getValue();
			}
			return this._createdTime;
		}
		getCreatedDate() {
			return BX.prop.extractDate(new Date(this.getCreatedTime().getTime()));
		}
		getOwnerInfo() {
			return this._history ? this._history.getOwnerInfo() : null;
		}
		getOwnerTypeId() {
			return BX.prop.getInteger(this.getOwnerInfo(), "ENTITY_TYPE_ID", BX.CrmEntityType.enumeration.undefined);
		}
		getOwnerId() {
			return BX.prop.getInteger(this.getOwnerInfo(), "ENTITY_ID", 0);
		}
		isReadOnly() {
			return this._history.isReadOnly();
		}
		isEditable() {
			return !this.isReadOnly();
		}
		isDone() {
			const typeId = this.getTypeId();
			if (typeId === Item$1.activity) {
				const entityData = this.getAssociatedEntityData();
				return BX.CrmActivityStatus.isFinal(BX.prop.getInteger(entityData, "STATUS", 0));
			}
			return false;
		}
		isFixed() {
			return this._isFixed;
		}

		/**
		 * deprecated
		 */
		fasten(e) {
			if (this._fixedHistory._items.length >= 7) {
				if (!this.fastenLimitPopup) {
					this.fastenLimitPopup = new BX.PopupWindow('timeline_fasten_limit_popup_' + this._id, this._switcher, {
						content: BX.message('CRM_TIMELINE_FASTEN_LIMIT_MESSAGE'),
						darkMode: true,
						autoHide: true,
						zIndex: 990,
						angle: true,
						closeByEsc: true,
						bindOptions: {
							forceBindPosition: true
						}
					});
				}
				this.fastenLimitPopup.show();
				this.closeContextMenu();
				return;
			}
			BX.ajax({
				url: this._history._serviceUrl,
				method: "POST",
				dataType: "json",
				data: {
					"ACTION": "CHANGE_FASTEN_ITEM",
					"VALUE": 'Y',
					"OWNER_TYPE_ID": this.getOwnerTypeId(),
					"OWNER_ID": this.getOwnerId(),
					"ID": this._id
				}
			});
			this.closeContextMenu();
		}

		/**
		 * deprecated
		 */
		onSuccessFasten(result) {
			if (result && BX.type.isNotEmptyString(result.ERROR)) return;
			if (!this.isFixed()) {
				this._data.IS_FIXED = 'Y';
				const fixedItem = this._fixedHistory.createItem(this._data);
				fixedItem._isFixed = true;
				this._fixedHistory.addItem(fixedItem, 0);
				fixedItem.layout({
					add: false
				});
				this.refreshLayout();
				const animation = Fasten.create("", {
					initialItem: this,
					finalItem: fixedItem,
					anchor: this._fixedHistory._anchor
				});
				animation.run();
			}
			this.closeContextMenu();
		}

		/**
		 * deprecated
		 */
		unfasten(e) {
			BX.ajax({
				url: this._history._serviceUrl,
				method: "POST",
				dataType: "json",
				data: {
					"ACTION": "CHANGE_FASTEN_ITEM",
					"VALUE": 'N',
					"OWNER_TYPE_ID": this.getOwnerTypeId(),
					"OWNER_ID": this.getOwnerId(),
					"ID": this._id
				}
			});
			this.closeContextMenu();
		}

		/**
		 * deprecated
		 */
		onSuccessUnfasten(result) {
			if (result && BX.type.isNotEmptyString(result.ERROR)) return;
			let item;
			let historyItem;
			if (this.isFixed()) {
				item = this;
				historyItem = this._history.findItemById(this._id);
			} else {
				item = this._fixedHistory.findItemById(this._id);
				historyItem = this;
			}
			if (item) {
				const index = this._fixedHistory.getItemIndex(item);
				item.clearAnimate();
				this._fixedHistory.removeItemByIndex(index);
				if (historyItem) {
					historyItem._data.IS_FIXED = 'N';
					historyItem.refreshLayout();
					BX.LazyLoad.showImages();
				}
			}
		}
		clearAnimate() {
			if (!BX.type.isDomNode(this._wrapper)) return;
			const wrapperPosition = BX.pos(this._wrapper);
			const hideEvent = new BX.easing({
				duration: 1000,
				start: {
					height: wrapperPosition.height,
					opacity: 1,
					marginBottom: 15
				},
				finish: {
					height: 0,
					opacity: 0,
					marginBottom: 0
				},
				transition: BX.easing.makeEaseOut(BX.easing.transitions.quart),
				step: BX.proxy(function (state) {
					this._wrapper.style.height = state.height + "px";
					this._wrapper.style.opacity = state.opacity;
					this._wrapper.style.marginBottom = state.marginBottom;
				}, this),
				complete: BX.proxy(function () {
					this.clearLayout();
				}, this)
			});
			hideEvent.animate();
		}
		getWrapperClassName() {
			return "";
		}
		getIconClassName() {
			return "crm-entity-stream-section-icon crm-entity-stream-section-icon-info";
		}
		prepareContentDetails() {
			return [];
		}
		prepareContent() {
			let wrapperClassName = this.getWrapperClassName();
			if (wrapperClassName !== "") {
				wrapperClassName = "crm-entity-stream-section crm-entity-stream-section-history" + " " + wrapperClassName;
			} else {
				wrapperClassName = "crm-entity-stream-section crm-entity-stream-section-history";
			}
			const wrapper = BX.create("DIV", {
				attrs: {
					className: wrapperClassName
				}
			});
			wrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: this.getIconClassName()
				}
			}));
			if (this.isContextMenuEnabled()) {
				main_core.Dom.append(this.prepareContextMenuButton(), wrapper);
			}
			const contentWrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-event"
				}
			});
			wrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section-content"
				},
				children: [contentWrapper]
			}));
			const header = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-header"
				},
				children: [BX.create("DIV", {
					attrs: {
						className: "crm-entity-stream-content-event-title"
					},
					children: [BX.create("A", {
						attrs: {
							href: "#"
						},
						events: {
							click: this._headerClickHandler
						},
						text: this.getTitle()
					})]
				}), BX.create("SPAN", {
					attrs: {
						className: "crm-entity-stream-content-event-time"
					},
					text: this.formatTime(this.getCreatedTime())
				})]
			});
			contentWrapper.appendChild(header);
			contentWrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail"
				},
				children: this.prepareContentDetails()
			}));

			//region Author
			const authorNode = this.prepareAuthorLayout();
			if (authorNode) {
				contentWrapper.appendChild(authorNode);
			}
			//endregion

			return wrapper;
		}
		prepareLayout(options) {
			this._wrapper = this.prepareContent();
			if (this._wrapper) {
				const enableAdd = BX.type.isPlainObject(options) ? BX.prop.getBoolean(options, "add", true) : true;
				if (enableAdd) {
					const anchor = BX.type.isPlainObject(options) && BX.type.isElementNode(options["anchor"]) ? options["anchor"] : null;
					if (anchor && anchor.nextSibling) {
						this._container.insertBefore(this._wrapper, anchor.nextSibling);
					} else {
						this._container.appendChild(this._wrapper);
					}
				}
				this.markAsTerminated(this._history.checkItemForTermination(this));
			}
		}
		onHeaderClick(e) {
			this.view();
			e.preventDefault ? e.preventDefault() : e.returnValue = false;
		}
		prepareTitleLayout() {
			return BX.create("SPAN", {
				attrs: {
					className: "crm-entity-stream-content-event-title"
				},
				text: this.getTitle()
			});
		}
		prepareFixedSwitcherLayout() {
			const isFixed = this.getTextDataParam("IS_FIXED") === 'Y';
			this._switcher = BX.create("span", {
				attrs: {
					className: "crm-entity-stream-section-top-fixed-btn"
				},
				events: {
					click: isFixed ? BX.delegate(this.unfasten, this) : BX.delegate(this.fasten, this)
				}
			});
			if (isFixed) BX.addClass(this._switcher, "crm-entity-stream-section-top-fixed-btn-active");
			if (!this.isReadOnly() && !isFixed) {
				const manager = this._history.getManager();
				if (!manager.isSpotlightShowed()) {
					manager.setSpotlightShowed();
					BX.addClass(this._switcher, "crm-entity-stream-section-top-fixed-btn-spotlight");
					const spotlight = new BX.SpotLight({
						targetElement: this._switcher,
						targetVertex: "middle-center",
						lightMode: false,
						id: "CRM_TIMELINE_FASTEN_SWITCHER",
						zIndex: 900,
						top: -3,
						left: -1,
						autoSave: true,
						content: BX.message('CRM_TIMELINE_SPOTLIGHT_FASTEN_MESSAGE')
					});
					spotlight.show();
				}
			}
			return this._switcher;
		}
		prepareHeaderLayout() {
			const header = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-header"
				}
			});
			header.appendChild(this.prepareTitleLayout());
			const statusNode = this.getStatusNode();
			if (main_core.Type.isDomNode(statusNode)) {
				main_core.Dom.append(statusNode, header);
			}
			header.appendChild(BX.create("SPAN", {
				attrs: {
					className: "crm-entity-stream-content-event-time"
				},
				text: this.formatTime(this.getCreatedTime())
			}));
			return header;
		}
		getStatusNode() {
			return null;
		}
		onActivityCreate(activity, data) {
			this._history.getManager().onActivityCreated(activity, data);
		}
		formatTime(time) {
			if (this.isFixed()) {
				return this._fixedHistory.formatTime(time);
			}
			return this._history.formatTime(time);
		}
		static create(id, settings) {
			const self = new History();
			self.initialize(id, settings);
			return self;
		}
		static isCounterEnabled(deadline) {
			if (!BX.type.isDate(deadline)) {
				return false;
			}
			let start = new Date();
			start.setHours(0);
			start.setMinutes(0);
			start.setSeconds(0);
			start.setMilliseconds(0);
			start = start.getTime();
			let end = new Date();
			end.setHours(23);
			end.setMinutes(59);
			end.setSeconds(59);
			end.setMilliseconds(999);
			end = end.getTime();
			const time = deadline.getTime();
			return time < start || time >= start && time <= end;
		}
		static isCounterEnabledByLightTime(lightTime) {
			if (!BX.type.isDate(lightTime)) {
				return false;
			}
			const now = new Date().getTime();
			const time = lightTime.getTime();
			return time < now;
		}
	};

	/** @memberof BX.Crm.Timeline.Items */
	class Scheduled extends CompatibleItem {
		constructor() {
			super();
			this._schedule = null;
			this._deadlineNode = null;
			this._headerClickHandler = BX.delegate(this.onHeaderClick, this);
			this._setAsDoneButtonHandler = BX.delegate(this.onSetAsDoneButtonClick, this);
		}
		doInitialize() {
			this._schedule = this.getSetting("schedule");
			if (!(this._activityEditor instanceof BX.CrmActivityEditor)) {
				throw "Scheduled. The field 'activityEditor' is not assigned.";
			}
			if (this.hasPermissions() && !this.verifyPermissions()) {
				this.loadPermissions();
			}
		}
		getTypeId() {
			return Item$1.undefined;
		}
		verifyPermissions() {
			const userId = BX.prop.getInteger(this.getPermissions(), "USER_ID", 0);
			return userId <= 0 || userId === this._schedule.getUserId();
		}
		loadPermissions() {
			BX.ajax({
				url: this._schedule.getServiceUrl(),
				method: "POST",
				dataType: "json",
				data: {
					"ACTION": "GET_PERMISSIONS",
					"TYPE_ID": this.getTypeId(),
					"ID": this.getAssociatedEntityId()
				},
				onsuccess: this.onPermissionsLoad.bind(this)
			});
		}
		onPermissionsLoad(result) {
			const permissions = BX.prop.getObject(result, "PERMISSIONS", null);
			if (!permissions) {
				return;
			}
			this.setPermissions(permissions);
			window.setTimeout(function () {
				this.refreshLayout();
			}.bind(this), 0);
		}
		getDeadline() {
			return null;
		}
		getLightTime() {
			return null;
		}
		hasDeadline() {
			return BX.type.isDate(this.getDeadline());
		}
		isCounterEnabled() {
			if (this.isDone()) {
				return this._existedStreamItemDeadLine && History$1.isCounterEnabledByLightTime(this._existedStreamItemDeadLine);
			}
			const lightTime = this.getLightTime();
			return lightTime && History$1.isCounterEnabledByLightTime(lightTime);
		}
		isIncomingChannel() {
			return false;
		}
		getSourceId() {
			return BX.prop.getInteger(this.getAssociatedEntityData(), "ID", 0);
		}
		onSetAsDoneCompleted(data) {
			if (!BX.prop.getBoolean(data, "COMPLETED")) {
				return;
			}
			this.markAsDone(true);
			this._schedule.onItemMarkedAsDone(this, {
				'historyItemData': BX.prop.getObject(data, "HISTORY_ITEM")
			});
		}
		onPosponeCompleted(data) {}
		refreshDeadline() {
			this._deadlineNode.innerHTML = this.formatDateTime(this.getDeadline());
		}
		formatDateTime(time) {
			return this._schedule.formatDateTime(time);
		}
		getWrapperClassName() {
			return "";
		}
		getIconClassName() {
			return "crm-entity-stream-section-icon";
		}
		isReadOnly() {
			return this._schedule.isReadOnly();
		}
		isEditable() {
			return !this.isReadOnly();
		}
		canPostpone() {
			if (this.isReadOnly()) {
				return false;
			}
			if (this.isIncomingChannel()) {
				return false;
			}
			const perms = BX.prop.getObject(this.getAssociatedEntityData(), "PERMISSIONS", {});
			return BX.prop.getBoolean(perms, "POSTPONE", false);
		}
		isDone() {
			return BX.CrmActivityStatus.isFinal(BX.prop.getInteger(this.getAssociatedEntityData(), "STATUS", 0));
		}
		canComplete() {
			if (this.isReadOnly()) {
				return false;
			}
			const perms = BX.prop.getObject(this.getAssociatedEntityData(), "PERMISSIONS", {});
			return BX.prop.getBoolean(perms, "COMPLETE", false);
		}
		setAsDone(isDone) {}
		prepareContent(options) {
			return null;
		}
		prepareLayout(options) {
			this._wrapper = this.prepareContent();
			if (this._wrapper) {
				const enableAdd = BX.type.isPlainObject(options) ? BX.prop.getBoolean(options, "add", true) : true;
				if (enableAdd) {
					const anchor = BX.type.isPlainObject(options) && BX.type.isElementNode(options["anchor"]) ? options["anchor"] : null;
					if (anchor && anchor.nextSibling) {
						this._container.insertBefore(this._wrapper, anchor.nextSibling);
					} else {
						this._container.appendChild(this._wrapper);
					}
				}
				this.markAsTerminated(this._schedule.checkItemForTermination(this));
			}
		}
		onHeaderClick(e) {
			this.view();
			e.preventDefault ? e.preventDefault() : e.returnValue = false;
		}
		onSetAsDoneButtonClick(e) {
			if (this.canComplete()) {
				this.setAsDone(!this.isDone());
			}
		}
		onActivityCreate(activity, data) {
			this._schedule.getManager().onActivityCreated(activity, data);
		}
		static isDone(data) {
			const entityData = BX.prop.getObject(data, "ASSOCIATED_ENTITY", {});
			return BX.CrmActivityStatus.isFinal(BX.prop.getInteger(entityData, "STATUS", 0));
		}
		static create(id, settings) {
			const self = new Scheduled();
			self.initialize(id, settings);
			return self;
		}
	}

	class PullActionProcessor {
		#scheduleStream = null;
		#fixedHistoryStream = null;
		#historyStream = null;
		#itemsQueue = [];
		#itemsQueueProcessing = false;
		#reloadingMessagesQueue = [];
		#ownerTypeId;
		#ownerId;
		#userId;
		constructor(params) {
			if (!main_core.Type.isObject(params.scheduleStream) || !main_core.Type.isObject(params.fixedHistoryStream) || !main_core.Type.isObject(params.historyStream)) {
				throw new Error(`params scheduleStream, fixedHistoryStream and historyStream are required`);
			}
			if (!main_core.Type.isNumber(params.ownerTypeId) || !main_core.Type.isNumber(params.ownerId)) {
				throw new Error('params ownerTypeId and ownerId are required');
			}
			this.#scheduleStream = params.scheduleStream;
			this.#fixedHistoryStream = params.fixedHistoryStream;
			this.#historyStream = params.historyStream;
			this.#ownerTypeId = params.ownerTypeId;
			this.#ownerId = params.ownerId;
			this.#userId = params.userId;
		}
		processAction(actionParams) {
			if (this.#itemDataShouldBeReloaded(actionParams)) {
				this.#reloadingMessagesQueue.push(actionParams);
				this.#fetchItems();
			} else {
				this.#addToQueue(actionParams);
			}
		}
		#itemDataShouldBeReloaded(actionParams) {
			const {
				item
			} = actionParams;
			if (!item) {
				return false;
			}
			const canBeReloaded = BX.prop.getBoolean(item, 'canBeReloaded', true);
			if (!canBeReloaded) {
				return false;
			}
			const appLanguage = main_core.Loc.getMessage('LANGUAGE_ID').toLowerCase();
			const languageId = BX.prop.getString(item, 'languageId', appLanguage).toLowerCase();

			// maybe item was built under user with different language
			if (languageId !== appLanguage) {
				return true;
			}
			const targetUsersList = BX.prop.getArray(item, 'targetUsersList', []);

			// maybe item has user-specific information
			return targetUsersList.length > 0 && !targetUsersList.includes(this.#userId);
		}
		#addToQueue(actionParams) {
			this.#itemsQueue.push(actionParams);
			if (!this.#itemsQueueProcessing) {
				this.#processQueueItem();
			}
		}
		#processQueueItem() {
			if (!this.#itemsQueue.length) {
				this.#itemsQueueProcessing = false;
				return;
			}
			this.#itemsQueueProcessing = true;
			const actionParams = this.#itemsQueue.shift();
			const stream = this.#getStreamByName(actionParams.stream);
			const promises = [];
			switch (actionParams.action) {
				case 'add':
					promises.push(this.#addItem(actionParams.id, actionParams.item, stream));
					break;
				case 'update':
					promises.push(this.#updateItem(actionParams.id, actionParams.item, stream, false, true));
					if (stream.isHistoryStream()) {
						// fixed history stream can contain the same item as a history stream, so both should be updated:
						promises.push(this.#updateItem(actionParams.id, actionParams.item, this.#fixedHistoryStream, false, true));
					}
					break;
				case 'delete':
					promises.push(this.#deleteItem(actionParams.id, stream));
					if (stream.isHistoryStream()) {
						// fixed history stream can contain the same item as a history stream, so both should be updated:
						promises.push(this.#deleteItem(actionParams.id, this.#fixedHistoryStream));
					}
					break;
				case 'move':
					// move item from one stream to another one:
					const sourceStream = this.#getStreamByName(actionParams.params.fromStream);
					promises.push(this.#moveItem(actionParams.params.fromId, sourceStream, actionParams.id, stream, actionParams.item));
					break;
				case 'changePinned':
					// pin or unpin item
					if (this.#getStreamByName(actionParams.params.fromStream).isHistoryStream()) {
						promises.push(this.#pinItem(actionParams.id, actionParams.item));
					} else {
						promises.push(this.#unpinItem(actionParams.id, actionParams.item));
					}
			}
			Promise.all(promises).then(() => {
				this.#processQueueItem();
			});
		}
		async #addItem(id, itemData, stream) {
			const existedStreamItem = stream.findItemById(id);
			if (existedStreamItem) {
				return Promise.resolve();
			}
			const streamItem = stream.createItem(itemData);
			if (!streamItem) {
				return Promise.resolve();
			}
			const index = stream.calculateItemIndex(streamItem);
			const anchor = stream.createAnchor(index);
			await stream.addItem(streamItem, index);
			streamItem.layout({
				anchor
			});
			return stream.animateItemAdding(streamItem);
		}
		#updateItem(id, itemData, stream, animateUpdate = true, animateMove) {
			const isDone = BX.prop.getString(itemData['ASSOCIATED_ENTITY'], 'COMPLETED') === 'Y';
			const existedStreamItem = stream.findItemById(id);
			if (!existedStreamItem) {
				return Promise.resolve();
			}
			if (existedStreamItem instanceof CompatibleItem && isDone) {
				existedStreamItem._existedStreamItemDeadLine = existedStreamItem.getLightTime();
			}
			existedStreamItem.setData(itemData);
			return stream.refreshItem(existedStreamItem, animateUpdate, animateMove);
		}
		#deleteItem(id, stream) {
			const item = stream.findItemById(id);
			if (item) {
				return stream.deleteItemAnimated(item);
			}
			return Promise.resolve();
		}
		#moveItem(sourceId, sourceStream, destinationId, destinationStream, destinationItemData) {
			const sourceItem = sourceStream.findItemById(sourceId);
			if (!sourceItem) {
				return this.#addItem(destinationId, destinationItemData, destinationStream);
			}
			const existedDestinationItem = destinationStream.findItemById(destinationId);
			if (sourceItem && existedDestinationItem) {
				return this.#deleteItem(sourceId, sourceStream);
			}
			const destinationItem = destinationStream.createItem(destinationItemData);
			destinationStream.addItem(destinationItem, destinationStream.calculateItemIndex(destinationItem));
			if (destinationItem instanceof CompatibleItem) {
				destinationItem.layout({
					add: false
				});
			}
			return sourceStream.moveItemToStream(sourceItem, destinationStream, destinationItem);
		}
		#pinItem(id, itemData) {
			if (this.#fixedHistoryStream.findItemById(id)) {
				return Promise.resolve();
			}
			const historyItem = this.#historyStream.findItemById(id);
			if (!historyItem)
				// fixed history item does not exist into history items stream, so just add to fixed history stream
				{
					return this.#addItem(id, itemData, this.#fixedHistoryStream);
				}
			if (historyItem instanceof CompatibleItem) {
				historyItem.onSuccessFasten();
				return Promise.resolve();
			} else {
				// hide files block in comment content before pin
				const historyCommentBlock = historyItem.getLayoutContentBlockById('commentContentWeb');
				if (historyCommentBlock) {
					historyCommentBlock.setIsFilesBlockDisplayed(false);
					historyCommentBlock.setIsMoving();
				}
				return this.#updateItem(id, itemData, this.#historyStream, false, false).then(() => {
					const fixedHistoryItem = this.#fixedHistoryStream.createItem(itemData);
					fixedHistoryItem.initWrapper();
					this.#fixedHistoryStream.addItem(fixedHistoryItem, 0);
					return new Promise(resolve => {
						const animation = Fasten.create('', {
							initialItem: historyItem,
							finalItem: fixedHistoryItem,
							anchor: this.#fixedHistoryStream.getAnchor(),
							events: {
								complete: () => {
									fixedHistoryItem.initLayoutApp({
										add: false
									});

									// show files block in comment content after pin record
									if (historyCommentBlock) {
										historyCommentBlock.setIsFilesBlockDisplayed();
										historyCommentBlock.setIsMoving(false);
										const fixedHistoryCommentBlock = fixedHistoryItem.getLayoutContentBlockById('commentContentWeb');
										if (fixedHistoryCommentBlock) {
											fixedHistoryCommentBlock.setIsFilesBlockDisplayed();
											fixedHistoryCommentBlock.setIsMoving(false);
										}
									}
									resolve();
								}
							}
						});
						animation.run();
					});
				});
			}
		}
		#unpinItem(id, itemData) {
			const fixedHistoryItem = this.#fixedHistoryStream.findItemById(id);
			if (fixedHistoryItem instanceof CompatibleItem) {
				fixedHistoryItem.onSuccessUnfasten();
				return Promise.resolve();
			} else {
				return this.#updateItem(id, itemData, this.#historyStream, false, false).then(() => {
					return this.#deleteItem(id, this.#fixedHistoryStream);
				});
			}
		}
		#getStreamByName(streamName) {
			switch (streamName) {
				case 'scheduled':
					return this.#scheduleStream;
				case 'fixedHistory':
					return this.#fixedHistoryStream;
				case 'history':
					return this.#historyStream;
			}
			throw new Error(`Stream "${streamName}" not found`);
		}
		#fetchItems() {
			setTimeout(() => {
				const messages = main_core.clone(this.#reloadingMessagesQueue);
				this.#reloadingMessagesQueue = [];
				const activityIds = [];
				const historyIds = [];
				messages.forEach(message => {
					const container = message.stream === 'scheduled' ? activityIds : historyIds;
					container.push(message.id);
				});
				if (messages.length) {
					const data = {
						activityIds,
						historyIds,
						ownerTypeId: this.#ownerTypeId,
						ownerId: this.#ownerId
					};
					main_core.ajax.runAction('crm.timeline.item.load', {
						data
					}).then(response => {
						messages.forEach(message => {
							if (response.data[message.id]) {
								message.item = response.data[message.id];
							}
							this.#addToQueue(message);
						});
					}).catch(err => {
						console.error(err);
						messages.forEach(message => this.#addToQueue(message));
					});
				}
			}, 1500);
		}
	}

	/** @memberof BX.Crm.Timeline.Animation */
	class Item {
		constructor() {
			this._id = "";
			this._settings = {};
			this._initialItem = null;
			this._finalItem = null;
			this._events = null;
		}
		initialize(id, settings) {
			this._id = BX.type.isNotEmptyString(id) ? id : BX.util.getRandomString(4);
			this._settings = settings ? settings : {};
			this._initialItem = this.getSetting("initialItem");
			this._finalItem = this.getSetting("finalItem");
			this._anchor = this.getSetting("anchor");
			this._events = this.getSetting("events", {});
		}
		getId() {
			return this._id;
		}
		getSetting(name, defaultval) {
			return this._settings.hasOwnProperty(name) ? this._settings[name] : defaultval;
		}
		run() {
			this._node = this._initialItem.getWrapper();
			const originalPosition = BX.pos(this._node);
			this._initialYPosition = originalPosition.top;
			this._initialXPosition = originalPosition.left;
			this._initialWidth = this._node.offsetWidth;
			this._initialHeight = this._node.offsetHeight;
			this._anchorYPosition = BX.pos(this._anchor).top;
			this.createStub();
			this.createGhost();
			this.moveGhost();
		}
		createStub() {
			this._stub = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section crm-entity-stream-section-planned crm-entity-stream-section-shadow"
				},
				children: [BX.create("DIV", {
					props: {
						className: "crm-entity-stream-section-content"
					},
					style: {
						height: this._initialHeight + "px"
					}
				})]
			});
			this._node.parentNode.insertBefore(this._stub, this._node);
		}
		createGhost() {
			this._ghostNode = this._node;
			this._ghostNode.style.position = "absolute";
			this._ghostNode.style.width = this._initialWidth + "px";
			this._ghostNode.style.height = this._initialHeight + "px";
			this._ghostNode.style.top = this._initialYPosition + "px";
			this._ghostNode.style.left = this._initialXPosition + "px";
			document.body.appendChild(this._ghostNode);
			setTimeout(BX.proxy(function () {
				BX.addClass(this._ghostNode, "crm-entity-stream-section-casper");
			}, this), 20);
		}
		moveGhost() {
			const node = this._ghostNode;
			const movingEvent = new BX.easing({
				duration: 500,
				start: {
					top: this._initialYPosition
				},
				finish: {
					top: this._anchorYPosition
				},
				transition: BX.easing.makeEaseOut(BX.easing.transitions.quart),
				step: BX.proxy(function (state) {
					node.style.top = state.top + "px";
				}, this)
			});
			setTimeout(BX.proxy(function () {
				movingEvent.animate();
				node.style.boxShadow = "";
			}, this), 500);
			const placeEventAnim = new BX.easing({
				duration: 500,
				start: {
					height: 0
				},
				finish: {
					height: this._initialHeight + 20
				},
				transition: BX.easing.makeEaseOut(BX.easing.transitions.quart),
				step: BX.proxy(function (state) {
					this._anchor.style.height = state.height + "px";
				}, this),
				complete: BX.proxy(function () {
					if (BX.type.isFunction(this._events["complete"])) {
						this._events["complete"]();
					}
					this.addHistoryItem();
					this.removeGhost();
				}, this)
			});
			setTimeout(function () {
				placeEventAnim.animate();
			}, 500);
		}
		addHistoryItem() {
			const node = this._finalItem.getWrapper();
			this._anchor.parentNode.insertBefore(node, this._anchor.nextSibling);
			this._finalItemHeight = this._anchor.offsetHeight - node.offsetHeight;
			this._anchor.style.height = 0;
			node.style.marginBottom = this._finalItemHeight + "px";
		}
		removeGhost() {
			const ghostNode = this._ghostNode;
			const finalNode = this._finalItem.getWrapper();
			ghostNode.style.overflow = "hidden";
			const hideCasperItem = new BX.easing({
				duration: 70,
				start: {
					opacity: 100,
					height: ghostNode.offsetHeight,
					marginBottom: this._finalItemHeight
				},
				finish: {
					opacity: 0,
					height: finalNode.offsetHeight,
					marginBottom: 20
				},
				// transition : BX.easing.makeEaseOut(BX.easing.transitions.quart),
				step: BX.proxy(function (state) {
					ghostNode.style.opacity = state.opacity / 100;
					ghostNode.style.height = state.height + "px";
					finalNode.style.marginBottom = state.marginBottom + "px";
				}, this),
				complete: BX.proxy(function () {
					ghostNode.remove();
					finalNode.style.marginBottom = "";
					this.collapseStub();
				}, this)
			});
			hideCasperItem.animate();
		}
		collapseStub() {
			const removePlannedEvent = new BX.easing({
				duration: 500,
				start: {
					opacity: 100,
					height: this._initialHeight,
					marginBottom: 15
				},
				finish: {
					opacity: 0,
					height: 0,
					marginBottom: 0
				},
				transition: BX.easing.makeEaseOut(BX.easing.transitions.quart),
				step: BX.proxy(function (state) {
					this._stub.style.height = state.height + "px";
					this._stub.style.marginBottom = state.marginBottom + "px";
					this._stub.style.opacity = state.opacity / 100;
				}, this),
				complete: BX.proxy(function () {
					this.inited = false;
				}, this)
			});
			removePlannedEvent.animate();
		}
		static create(id, settings) {
			const self = new Item();
			self.initialize(id, settings);
			return self;
		}
	}

	/** @memberof BX.Crm.Timeline.Animation */
	class Shift {
		constructor() {
			this._node = null;
			this._anchor = null;
			this._nodeParent = null;
			this._startPosition = null;
			this._events = null;
		}
		initialize(node, anchor, startPosition, shadowNode, events, additionalShift) {
			this._node = node;
			this._shadowNode = shadowNode;
			this._anchor = anchor;
			this._nodeParent = node.parentNode;
			this._startPosition = startPosition;
			this._events = BX.type.isPlainObject(events) ? events : {};
			this.additionalShift = additionalShift ?? 0;
		}
		run() {
			this._anchorPosition = BX.pos(this._anchor);
			setTimeout(BX.proxy(function () {
				BX.addClass(this._node, "crm-entity-stream-section-casper");
			}, this), 0);

			// const nodeHeight = Dom.getPosition(this._node).height;
			const nodeHeight = main_core.Dom.getPosition(this._node).height;
			const nodeMarginBottom = parseFloat(getComputedStyle(this._node).marginBottom);
			const nodeMarginTop = parseFloat(getComputedStyle(this._node).marginTop);
			const nodeHeightWithMargin = nodeHeight + nodeMarginBottom + nodeMarginTop;
			const expandPlaceEvent = new BX.easing({
				duration: 600,
				start: {
					height: 0
				},
				finish: {
					height: nodeHeightWithMargin
				},
				transition: BX.easing.makeEaseOut(BX.easing.transitions.quart),
				step: state => {
					this._anchor.style.height = state.height + "px";
				}
			});
			const movingEvent = new BX.easing({
				duration: 1000,
				start: {
					top: this._startPosition.top
				},
				finish: {
					top: this._anchorPosition.top - nodeHeightWithMargin + this.additionalShift
				},
				transition: BX.easing.makeEaseOut(BX.easing.transitions.quart),
				step: BX.proxy(function (state) {
					this._node.style.top = state.top + "px";
				}, this),
				complete: BX.proxy(function () {
					this.finish();
				}, this)
			});
			expandPlaceEvent.animate();
			movingEvent.animate();
		}
		finish() {
			if (BX.type.isFunction(this._events["complete"])) {
				this._events["complete"]();
			}
			if (this._shadowNode !== false) ;
		}
		static create(node, anchor, startPosition, shadowNode, events, additionalShift) {
			const self = new Shift();
			self.initialize(node, anchor, startPosition, shadowNode, events, additionalShift);
			return self;
		}
	}

	class SystemMenu {
		#menu = null;
		#vueComponent;
		#onAction;
		constructor(vueComponent, menu, menuOptions, onAction) {
			this.#vueComponent = vueComponent;
			this.#onAction = onAction;
			const {
				items: mappedItems,
				sections: mappedSections
			} = this.#normalizeMenu(menu.items ?? [], menu.sections ?? []);
			this.#menu = new ui_system_menu.Menu({
				...menuOptions,
				items: mappedItems,
				sections: mappedSections,
				animation: menuOptions?.animation ?? 'fading-slide',
				autoHide: menuOptions?.autoHide ?? true,
				cacheable: menuOptions?.cacheable ?? false
			});
		}
		show() {
			this.#menu?.show();
		}
		isShown() {
			return this.#menu?.getPopup()?.isShown() ?? false;
		}
		destroy() {
			this.#menu?.destroy();
			this.#menu = null;
		}
		static showMenu(vueComponent, menu, menuOptions, onAction) {
			const instance = new SystemMenu(vueComponent, menu, menuOptions, onAction);
			instance.show();
			return instance;
		}
		#normalizeMenu(items, sections) {
			if (main_core.Type.isArrayFilled(sections)) {
				return {
					items: items.filter(item => !item.delimiter).map(item => this.#createMenuItem(item)),
					sections: sections
				};
			}
			return this.#normalizeWithDelimiters(items);
		}
		#createMenuItem(item) {
			const menuItem = {
				title: item.title ?? ''
			};
			if (main_core.Type.isStringFilled(item.subtitle)) {
				menuItem.subtitle = item.subtitle;
			}
			if (main_core.Type.isStringFilled(item.icon)) {
				menuItem.icon = item.icon;
			}
			if (main_core.Type.isStringFilled(item.design)) {
				menuItem.design = item.design;
			}
			if (main_core.Type.isBoolean(item.isSelected)) {
				menuItem.isSelected = item.isSelected;
			}
			if (main_core.Type.isBoolean(item.isLocked)) {
				menuItem.isLocked = item.isLocked;
			}
			if (main_core.Type.isObject(item.badgeText)) {
				menuItem.badgeText = item.badgeText;
			}
			if (main_core.Type.isStringFilled(item.sectionCode)) {
				menuItem.sectionCode = item.sectionCode;
			}
			if (main_core.Type.isObject(item.action) && main_core.Type.isFunction(this.#onAction)) {
				menuItem.onClick = () => {
					this.#menu?.close();
					this.#onAction(item.action);
				};
			}
			if (main_core.Type.isObject(item.menu)) {
				const {
					items: subItems,
					sections: subSections
				} = this.#normalizeMenu(Object.values(item.menu.items ?? {}), item.menu.sections ?? []);
				menuItem.subMenu = {
					items: subItems
				};
				if (main_core.Type.isArrayFilled(subSections)) {
					menuItem.subMenu.sections = subSections;
				}
			}
			return menuItem;
		}
		#normalizeWithDelimiters(items) {
			const groups = [[]];
			const sectionTitles = [null];
			for (const item of items) {
				if (item.delimiter) {
					groups.push([]);
					sectionTitles.push(item.title || null);
					continue;
				}
				groups[groups.length - 1].push(item);
			}
			if (groups.length === 1) {
				return {
					items: groups[0].map(item => this.#createMenuItem(item)),
					sections: []
				};
			}
			const sections = [];
			const mappedItems = [];
			groups.forEach((group, index) => {
				if (group.length === 0) {
					return;
				}
				const code = `generated-section-${index}`;
				const section = {
					code
				};
				if (sectionTitles[index]) {
					section.title = sectionTitles[index];
				}
				sections.push(section);
				for (const item of group) {
					const mapped = this.#createMenuItem(item);
					mapped.sectionCode = code;
					mappedItems.push(mapped);
				}
			});
			return {
				items: mappedItems,
				sections
			};
		}
	}

	const AnimationTarget = {
		block: 'block',
		item: 'item'
	};
	const AnimationType = {
		disable: 'disable',
		loader: 'loader'
	};
	const ActionType = {
		JS_EVENT: 'jsEvent',
		AJAX_ACTION: {
			STARTED: 'ajaxActionStarted',
			FINISHED: 'ajaxActionFinished',
			FAILED: 'ajaxActionFailed'
		},
		isJsEvent(type) {
			return type === this.JS_EVENT;
		},
		isAjaxAction(type) {
			return type === this.AJAX_ACTION.STARTED || type === this.AJAX_ACTION.FINISHED || type === this.AJAX_ACTION.FAILED;
		}
	};
	Object.freeze(ActionType.AJAX_ACTION);
	Object.freeze(ActionType);
	let Action$1 = class Action {
		#type = null;
		#value = null;
		#actionParams = null;
		#animation = null;
		#analytics = null;
		constructor(params) {
			this.#type = params.type;
			this.#value = params.value;
			this.#actionParams = params.actionParams;
			this.#animation = main_core.Type.isPlainObject(params.animation) ? params.animation : null;
			this.#analytics = main_core.Type.isPlainObject(params.analytics) ? params.analytics : null;
		}
		execute(vueComponent) {
			return new Promise((resolve, reject) => {
				if (this.isJsEvent()) {
					vueComponent.$Bitrix.eventEmitter.emit('crm:timeline:item:action', {
						action: this.#value,
						actionType: ActionType.JS_EVENT,
						actionData: this.#actionParams,
						animationCallbacks: {
							onStart: this.#startAnimation.bind(this, vueComponent),
							onStop: this.#stopAnimation.bind(this, vueComponent)
						}
					});
					this.#sendAnalytics();
					resolve(true);
				} else if (this.isJsCode()) {
					this.#startAnimation(vueComponent);

					// eslint-disable-next-line no-eval -- intentional: executes jsCode action type from server-side timeline layout
					eval(this.#value);
					this.#stopAnimation(vueComponent);
					this.#sendAnalytics();
					resolve(true);
				} else if (this.isAjaxAction() || this.isAjaxJsonAction()) {
					this.#startAnimation(vueComponent);
					vueComponent.$Bitrix.eventEmitter.emit('crm:timeline:item:action', {
						action: this.#value,
						actionType: ActionType.AJAX_ACTION.STARTED,
						actionData: this.#actionParams
					});
					const ajaxConfig = {
						[this.isAjaxJsonAction() ? 'json' : 'data']: this.#prepareRunActionParams(this.#actionParams)
					};
					if (this.#analytics) {
						ajaxConfig.analytics = this.#analytics;
					}
					main_core.ajax.runAction(this.#value, ajaxConfig).then(response => {
						this.#stopAnimation(vueComponent);
						vueComponent.$Bitrix.eventEmitter.emit('crm:timeline:item:action', {
							action: this.#value,
							actionType: ActionType.AJAX_ACTION.FINISHED,
							actionData: this.#actionParams,
							response
						});
						resolve(response);
					}, response => {
						this.#stopAnimation(vueComponent, true);
						ui_notification.UI.Notification.Center.notify({
							content: response.errors[0].message,
							autoHideDelay: 5000
						});
						vueComponent.$Bitrix.eventEmitter.emit('crm:timeline:item:action', {
							action: this.#value,
							actionType: ActionType.AJAX_ACTION.FAILED,
							actionParams: this.#actionParams,
							response
						});
						resolve(response);
					});
				} else if (this.isCallRestBatch()) {
					this.#startAnimation(vueComponent);
					vueComponent.$Bitrix.eventEmitter.emit('crm:timeline:item:action', {
						action: this.#value,
						actionType: 'ajaxActionStarted',
						actionData: this.#actionParams
					});
					rest_client.rest.callBatch(this.#prepareCallBatchParams(this.#actionParams), restResult => {
						for (const result in restResult) {
							const response = restResult[result].answer;
							if (response.error) {
								this.#stopAnimation(vueComponent);
								ui_notification.UI.Notification.Center.notify({
									content: response.error.error_description,
									autoHideDelay: 5000
								});
								vueComponent.$Bitrix.eventEmitter.emit('crm:timeline:item:action', {
									action: this.#value,
									actionType: 'ajaxActionFailed',
									actionParams: this.#actionParams
								});
								reject(restResult);
								return;
							}
						}
						this.#stopAnimation(vueComponent);
						vueComponent.$Bitrix.eventEmitter.emit('crm:timeline:item:action', {
							action: this.#value,
							actionType: 'ajaxActionFinished',
							actionData: this.#actionParams
						});
						resolve(restResult);
					}, true);
				} else if (this.isRedirect()) {
					this.#startAnimation(vueComponent);
					const linkAttrs = {
						href: this.#value
					};
					if (this.#actionParams && this.#actionParams.target) {
						linkAttrs.target = this.#actionParams.target;
					}
					// this magic allows auto opening internal links in slider if possible:
					const link = main_core.Dom.create('a', {
						attrs: linkAttrs,
						text: '',
						style: {
							display: 'none'
						}
					});
					main_core.Dom.append(link, document.body);
					link.click();
					setTimeout(() => main_core.Dom.remove(link), 10);
					this.#sendAnalytics();
					resolve(this.#value);
				} else if (this.isShowMenu()) {
					SystemMenu.showMenu(vueComponent, {
						items: this.#prepareMenuItems(this.#value.items ?? [], vueComponent),
						sections: this.#value.sections ?? []
					}, {
						bindElement: vueComponent.$el,
						minWidth: vueComponent.$el.offsetWidth,
						cacheable: false
					}, actionData => {
						const action = new Action(actionData);
						void action.execute(vueComponent);
					});
					this.#sendAnalytics();
					resolve(true);
				} else if (this.isShowInfoHelper()) {
					BX.UI.InfoHelper?.show(this.#value);
					this.#sendAnalytics();
					resolve(true);
				} else {
					reject(false);
				}
			});
		}
		isJsEvent() {
			return this.#type === 'jsEvent';
		}
		isJsCode() {
			return this.#type === 'jsCode';
		}
		isAjaxAction() {
			return this.#type === 'runAjaxAction';
		}
		isAjaxJsonAction() {
			return this.#type === 'runAjaxJsonAction';
		}
		isCallRestBatch() {
			return this.#type === 'callRestBatch';
		}
		isRedirect() {
			return this.#type === 'redirect';
		}
		isShowInfoHelper() {
			return this.#type === 'showInfoHelper';
		}
		isShowMenu() {
			return this.#type === 'showMenu';
		}
		getValue() {
			return this.#value;
		}
		getActionParam(param) {
			return this.#actionParams && this.#actionParams.hasOwnProperty(param) ? this.#actionParams[param] : null;
		}
		#prepareRunActionParams(params) {
			const result = {};
			if (main_core.Type.isUndefined(params)) {
				return result;
			}
			for (const paramName in params) {
				const paramValue = params[paramName];
				if (main_core.Type.isDate(paramValue)) {
					result[paramName] = main_date.DateTimeFormat.format(crm_timeline_tools.DatetimeConverter.getSiteDateTimeFormat(), paramValue);
				} else if (main_core.Type.isPlainObject(paramValue)) {
					result[paramName] = this.#prepareRunActionParams(paramValue);
				} else {
					result[paramName] = paramValue;
				}
			}
			return result;
		}
		#prepareCallBatchParams(params) {
			const result = {};
			if (main_core.Type.isUndefined(params)) {
				return result;
			}
			for (const paramName in params) {
				result[paramName] = {
					method: params[paramName].method,
					params: this.#prepareRunActionParams(params[paramName].params)
				};
			}
			return result;
		}
		#prepareMenuItems(items, vueComponent) {
			return Object.values(items).filter(item => item.state !== 'hidden' && item.scope !== 'mobile' && (!vueComponent.isReadOnly || !item.hideIfReadonly)).sort((a, b) => a.sort - b.sort);
		}
		#startAnimation(vueComponent) {
			if (!this.#isAnimationValid()) {
				return;
			}
			if (this.#animation.target === AnimationTarget.item) {
				if (this.#animation.type === AnimationType.disable) {
					vueComponent.$root.setFaded(true);
				}
				if (this.#animation.type === AnimationType.loader) {
					vueComponent.$root.showLoader(true);
				}
			}
			if (this.#animation.target === AnimationTarget.block) {
				if (this.#animation.type === AnimationType.disable) {
					if (main_core.Type.isFunction(vueComponent.setDisabled)) {
						vueComponent.setDisabled(true);
					}
				}
				if (this.#animation.type === AnimationType.loader) {
					if (main_core.Type.isFunction(vueComponent.setLoading)) {
						vueComponent.setLoading(true);
					}
				}
			}
		}
		#stopAnimation(vueComponent, force = false) {
			if (!this.#isAnimationValid()) {
				return;
			}
			if (this.#animation.forever && !force) {
				return; // should not be stopped
			}
			if (this.#animation.target === AnimationTarget.item) {
				if (this.#animation.type === AnimationType.disable) {
					vueComponent.$root.setFaded(false);
				}
				if (this.#animation.type === AnimationType.loader) {
					vueComponent.$root.showLoader(false);
				}
			}
			if (this.#animation.target === AnimationTarget.block) {
				if (this.#animation.type === AnimationType.disable) {
					if (main_core.Type.isFunction(vueComponent.setDisabled)) {
						vueComponent.setDisabled(false);
					}
				}
				if (this.#animation.type === AnimationType.loader) {
					if (main_core.Type.isFunction(vueComponent.setLoading)) {
						vueComponent.setLoading(false);
					}
				}
			}
		}
		#isAnimationValid() {
			if (!this.#animation) {
				return false;
			}
			if (!AnimationTarget.hasOwnProperty(this.#animation.target)) {
				return false;
			}
			return AnimationType.hasOwnProperty(this.#animation.type);
		}
		#sendAnalytics() {
			if (this.#analytics && this.#analytics.hit) {
				const clonedAnalytics = {
					...this.#analytics
				};
				delete clonedAnalytics.hit;
				ui_analytics.sendData(clonedAnalytics);
			}
		}
	};

	const ICON_TO_BICON_MAP = Object.freeze({
		'call': ui_iconSet_api_vue.Outline.PHONE_UP,
		'call-default': ui_iconSet_api_vue.Outline.PHONE_UP,
		'call-incoming': ui_iconSet_api_vue.Outline.PHONE_IN,
		'call-outgoing': ui_iconSet_api_vue.Outline.PHONE_OUT,
		'mail-income-unread': ui_iconSet_api_vue.Outline.MAIL,
		'mail-income-read': ui_iconSet_api_vue.Outline.MAIL_OPEN,
		'mail-outcome': ui_iconSet_api_vue.Outline.MAIL_SEND,
		'email': ui_iconSet_api_vue.Outline.MAIL,
		'document': ui_iconSet_api_vue.Outline.FILE,
		'document-signed': ui_iconSet_api_vue.Outline.DOCUMENT_SIGN,
		'document-print': ui_iconSet_api_vue.Outline.DOCUMENT_PRINT,
		'document-addition': ui_iconSet_api_vue.Outline.FORM,
		'document-draft': ui_iconSet_api_vue.Outline.FILE,
		'shop': ui_iconSet_api_vue.Outline.PACKAGE,
		'shop-eye': ui_iconSet_api_vue.Outline.SEEN_ITEMS,
		'list-check': ui_iconSet_api_vue.Outline.CHECK_LIST,
		'check': ui_iconSet_api_vue.Outline.SEEN_ITEMS,
		'sms': ui_iconSet_api_vue.Outline.SMS,
		'comment': ui_iconSet_api_vue.Outline.MESSAGE,
		'openline': ui_iconSet_api_vue.Outline.MESSAGES,
		'channel-chat': ui_iconSet_api_vue.Outline.OPEN_CHANNELS,
		'channel-whatsapp': ui_iconSet_api_vue.Outline.WHATSAPP,
		'channel-web-form': ui_iconSet_api_vue.Outline.CRM_FORM,
		'task-activity': ui_iconSet_api_vue.Outline.TASK,
		'unread-comment': ui_iconSet_api_vue.Outline.NEW_MESSAGE,
		'bank-card': ui_iconSet_api_vue.Outline.BANK_CARD,
		'calendar-share': ui_iconSet_api_vue.Outline.CALENDAR_SHARE,
		'delivery': ui_iconSet_api_vue.Outline.DELIVERY,
		'notification': ui_iconSet_api_vue.Outline.NOTIFICATION,
		'repeat-sale': ui_iconSet_api_vue.Outline.REPEAT_SALES,
		'bizproc': ui_iconSet_api_vue.Outline.BUSINES_PROCESS_STAGES,
		'bizproc-task': ui_iconSet_api_vue.Outline.BUSINES_PROCESS_STAGES
	});
	const Logo = {
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			type: String,
			addIcon: String,
			addIconType: String,
			icon: String,
			iconType: String,
			backgroundUrl: String,
			backgroundSize: Number,
			inCircle: {
				type: Boolean,
				required: false,
				default: false
			},
			action: Object
		},
		data() {
			return {
				currentIcon: this.icon
			};
		},
		computed: {
			className() {
				return ['crm-timeline__card-logo', `--${this.type}`, {
					'--clickable': this.action
				}];
			},
			iconClassname() {
				return ['crm-timeline__card-logo_icon', `--${this.currentIcon}`, {
					'--in-circle': this.inCircle,
					[`--type-${this.iconType}`]: !!this.iconType && !this.backgroundUrl,
					'--custom-bg': !!this.backgroundUrl
				}];
			},
			addIconClassname() {
				return ['crm-timeline__card-logo_add-icon', `--type-${this.addIconType}`, `--icon-${this.addIcon}`];
			},
			iconInteriorStyle() {
				const result = {};
				if (this.backgroundUrl) {
					result.backgroundImage = 'url(' + encodeURI(main_core.Text.encode(this.backgroundUrl)) + ')';
				}
				if (this.backgroundSize) {
					result.backgroundSize = parseInt(this.backgroundSize) + 'px';
				}
				return result;
			},
			useBIcon() {
				return ICON_TO_BICON_MAP.hasOwnProperty(this.currentIcon) && !this.backgroundUrl;
			},
			bIconName() {
				return ICON_TO_BICON_MAP[this.currentIcon] || '';
			},
			bIconColor() {
				if (this.iconType === 'failure') {
					return 'var(--ui-color-accent-main-alert)';
				}
				if (this.iconType === 'secondary') {
					return 'var(--ui-color-background-secondary)';
				}
				return 'var(--ui-color-accent-main-primary-alt-2)';
			}
		},
		watch: {
			icon(newIcon) {
				this.currentIcon = newIcon;
			}
		},
		methods: {
			executeAction() {
				if (!this.action) {
					return;
				}
				const action = new Action$1(this.action);
				action.execute(this);
			},
			setIcon(icon) {
				this.currentIcon = icon;
			}
		},
		template: `
		<div :class="className" @click="executeAction">
			<div class="crm-timeline__card-logo_content">
				<div :class="iconClassname">
					<BIcon
						v-if="useBIcon"
						:name="bIconName"
						:size="48"
						:color="bIconColor"
					/>
					<i v-else :style="iconInteriorStyle"></i>
				</div>
				<div :class="addIconClassname" v-if="addIcon">
					<i></i>
				</div>
			</div>
		</div>
	`
	};

	const CalendarIcon = {
		props: {
			timestamp: {
				type: Number,
				required: true,
				default: 0
			},
			calendarEventId: {
				type: Number,
				required: false,
				default: null
			}
		},
		computed: {
			date() {
				return this.formatUserTime('d');
			},
			month() {
				return this.formatUserTime('F');
			},
			dayWeek() {
				const dayShortName = this.formatUserTime('D');
				if (this.time.length > 5)
					// "12:34".length === 5, if +" PM" than > 5
					{
						return dayShortName.slice(0, 2);
					}
				return dayShortName;
			},
			time() {
				return this.getDateTimeConverter().toTimeString();
			},
			userTime() {
				return this.getDateTimeConverter().getValue();
			},
			hasCalendarEventId() {
				return this.calendarEventId > 0;
			}
		},
		methods: {
			getDateTimeConverter() {
				return crm_timeline_tools.DatetimeConverter.createFromServerTimestamp(this.timestamp).toUserTime();
			},
			formatUserTime(format) {
				return main_date.DateTimeFormat.format(format, this.userTime);
			}
		},
		template: `
		<div class="crm-timeline__calendar-icon-container">
			<div v-if="hasCalendarEventId" class="crm-timeline__calendar-icon_event_icon"></div>
			<div class="crm-timeline__calendar-icon">
				<header class="crm-timeline__calendar-icon_top">
					<div class="crm-timeline__calendar-icon_bullets">
						<div class="crm-timeline__calendar-icon_bullet"></div>
						<div class="crm-timeline__calendar-icon_bullet"></div>
					</div>
				</header>
				<main class="crm-timeline__calendar-icon_content">
					<div class="crm-timeline__calendar-icon_day">{{ date }}</div>
					<div class="crm-timeline__calendar-icon_month">{{ month }}</div>
					<div class="crm-timeline__calendar-icon_date">
						<span class="crm-timeline__calendar-icon_day-week">{{ dayWeek }}</span>
						<span class="crm-timeline__calendar-icon_time">{{ time }}</span>
					</div>
				</main>
			</div>
		</div>
	`
	};

	ui_vue3.BitrixVue.cloneComponent(Logo, {
		components: {
			CalendarIcon
		},
		props: {
			timestamp: {
				type: Number,
				required: false,
				default: 0
			},
			addIcon: String,
			addIconType: String,
			calendarEventId: {
				type: Number,
				required: false,
				default: null
			},
			backgroundColor: {
				type: String,
				required: false,
				default: null
			}
		},
		computed: {
			addIconClassname() {
				return ['crm-timeline__card-logo_add-icon', `--type-${this.addIconType}`, `--icon-${this.addIcon}`];
			},
			logoStyle() {
				if (main_core.Type.isStringFilled(this.backgroundColor)) {
					return {
						'--crm-timeline__logo-background': main_core.Text.encode(this.backgroundColor)
					};
				}
				return {};
			}
		},
		template: `
		<div 
			:class="className"
			:style="logoStyle"
			@click="executeAction"
		>
			<div class="crm-timeline__card-logo_content">
				<CalendarIcon :timestamp="timestamp" :calendar-event-id="calendarEventId" />
				<div :class="addIconClassname" v-if="addIcon">
					<i></i>
				</div>
			</div>
		</div>
	`
	});

	class ButtonState {
		static DEFAULT = '';
		static LOADING = 'loading';
		static DISABLED = 'disabled';
		static HIDDEN = 'hidden';
		static LOCKED = 'locked';
		static AI_LOADING = 'ai-loading';
		static AI_SUCCESS = 'ai-success';
	}

	class ButtonType {
		static ICON = 'icon';
		static PRIMARY = 'primary';
		static SECONDARY = 'secondary';
		static LIGHT = 'light';
		static AI = 'ai';
	}

	const BaseButton = {
		props: {
			id: {
				type: String,
				required: false,
				default: ''
			},
			title: {
				type: String,
				required: false,
				default: ''
			},
			tooltip: {
				type: String,
				required: false,
				default: ''
			},
			state: {
				type: String,
				required: false,
				default: ButtonState.DEFAULT
			},
			props: Object,
			action: Object
		},
		data() {
			return {
				currentState: this.state
			};
		},
		computed: {
			itemStateToButtonStateDict() {
				return {
					[ButtonState.LOADING]: ui_buttons.Button.State.WAITING,
					[ButtonState.DISABLED]: ui_buttons.Button.State.DISABLED,
					[ButtonState.AI_LOADING]: ui_buttons.Button.State.AI_WAITING
				};
			}
		},
		methods: {
			setDisabled(disabled) {
				if (disabled) {
					this.setButtonState(ButtonState.DISABLED);
				} else {
					this.setButtonState(ButtonState.DEFAULT);
				}
			},
			setLoading(loading) {
				if (loading) {
					this.setButtonState(ButtonState.LOADING);
				} else {
					this.setButtonState(ButtonState.DEFAULT);
				}
			},
			setButtonState(state) {
				if (this.currentState !== state) {
					this.currentState = state;
				}
			},
			onLayoutUpdated() {
				this.setButtonState(this.state);
			},
			executeAction() {
				if (this.action && this.currentState !== ButtonState.DISABLED && this.currentState !== ButtonState.LOADING && this.currentState !== ButtonState.AI_LOADING) {
					const action = new Action$1(this.action);
					action.execute(this);
				}
			}
		},
		created() {
			this.$Bitrix.eventEmitter.subscribe('layout:updated', this.onLayoutUpdated);
		},
		beforeUnmount() {
			this.$Bitrix.eventEmitter.unsubscribe('layout:updated', this.onLayoutUpdated);
		},
		template: `<button></button>`
	};

	class Menu {
		#menuOptions = {};
		#vueComponent = {};
		constructor(vueComponent, menuItems, menuOptions) {
			this.#vueComponent = vueComponent;
			this.#menuOptions = menuOptions || {};
			this.#menuOptions = {
				angle: false,
				cacheable: false,
				...this.#menuOptions
			};
			this.#menuOptions.items = [];
			for (const item of menuItems) {
				this.#menuOptions.items.push(this.createMenuItem(item));
			}
		}
		getMenuItems() {
			return this.#menuOptions.items;
		}
		show() {
			main_popup.MenuManager.show(this.#menuOptions);
		}
		createMenuItem(item) {
			if (Object.prototype.hasOwnProperty.call(item, 'delimiter') && item.delimiter) {
				return {
					text: item.title || '',
					delimiter: true
				};
			}
			const result = {
				text: item.title,
				value: item.title
			};
			if (item.icon) {
				result.className = `menu-popup-item-${item.icon}`;
			}
			if (item.menu) {
				result.items = [];
				for (const subItem of Object.values(item.menu.items || {})) {
					result.items.push(this.createMenuItem(subItem));
				}
			} else if (item.action) {
				if (item.action.type === 'redirect') {
					result.href = item.action.value;
				} else if (item.action.type === 'jsCode') {
					result.onclick = item.action.value;
				} else {
					result.onclick = () => {
						void this.onMenuItemClick(item);
					};
				}
			}
			return result;
		}
		onMenuItemClick(item) {
			const menu = main_popup.MenuManager.getCurrentMenu();
			if (menu) {
				menu.close();
			}
			const action = new Action$1(item.action);
			void action.execute(this.#vueComponent);
		}
		static showMenu(vueComponent, menuItems, menuOptions) {
			const menu = new Menu(vueComponent, menuItems, menuOptions);
			menu.show();
		}
	}

	class ButtonMenu extends Menu {
		constructor(vueComponent, menuItems, menuOptions) {
			super(vueComponent, menuItems, menuOptions);
			this.#applyMenuItems();
		}

		/**
		 * @override
		 */
		createMenuItem(item) {
			const result = {
				text: item.title,
				value: item.title
			};
			if (main_core.Type.isStringFilled(item.state)) {
				switch (item.state) {
					case ButtonState.AI_LOADING:
						result.className = 'menu-popup-item-ai-loading menu-popup-item-disabled';
						break;
					case ButtonState.AI_SUCCESS:
						result.className = 'menu-popup-item-accept menu-popup-item-disabled';
						break;
					case ButtonState.DISABLED:
						result.className = 'menu-popup-no-icon menu-popup-item-disabled';
						break;
					case ButtonState.LOCKED:
						result.className = 'menu-popup-item-locked';
						break;
					default:
						result.className = '';
				}
			}
			if (main_core.Type.isObject(item.action)) {
				if (item.action.type === 'redirect') {
					result.href = item.action.value;
				} else if (item.action.type === 'jsCode') {
					result.onclick = item.action.value;
				} else {
					result.onclick = () => {
						void this.onMenuItemClick(item);
					};
				}
			}
			return result;
		}
		#applyMenuItems() {
			const items = this.getMenuItems();
			if (!items) {
				return;
			}
			const emptyClassItems = items.filter(item => item.className === '');
			if (emptyClassItems.length === items.length) {
				return;
			}
			items.forEach(item => {
				if (item.className === '') {
					// eslint-disable-next-line no-param-reassign
					item.className = 'menu-popup-empty-icon';
				}
			});
		}
		static showMenu(vueComponent, menuItems, menuOptions) {
			const menu = new ButtonMenu(vueComponent, menuItems, menuOptions);
			menu.show();
		}
	}

	ui_vue3.BitrixVue.cloneComponent(BaseButton, {
		directives: {
			hint: ui_vue3_directives_hint.hint
		},
		props: {
			type: {
				type: String,
				required: false,
				default: ButtonType.SECONDARY
			},
			iconName: {
				type: String,
				required: false,
				default: ''
			},
			size: {
				type: String,
				required: false,
				default: 'medium'
			},
			menuItems: {
				type: Object,
				required: false,
				default: null
			}
		},
		data() {
			return {
				timerSecondsRemaining: 0,
				currentState: this.state,
				hintText: main_core.Type.isStringFilled(this.tooltip) ? this.tooltip : ''
			};
		},
		computed: {
			itemTypeToButtonStyleDict() {
				return {
					[ButtonType.PRIMARY]: ui_buttons.Button.AirStyle.FILLED,
					[ButtonType.SECONDARY]: ui_buttons.Button.AirStyle.OUTLINE,
					[ButtonType.LIGHT]: ui_buttons.Button.AirStyle.PLAIN,
					[ButtonType.ICON]: ui_buttons.Button.AirStyle.PLAIN_NO_ACCENT,
					[ButtonType.AI]: ui_buttons.Button.AirStyle.FILLED_BITRIX_GPT
				};
			},
			buttonContainerRef() {
				return this.$refs.buttonContainer;
			},
			containerClasses() {
				return [this.$attrs.class, {
					'--has-ai-icon': this.iconName?.toLowerCase() === 'ai',
					'--has-icon-only': this.type === ButtonType.ICON
				}];
			},
			hintOptions() {
				if (!main_core.Type.isStringFilled(this.hintText)) {
					return null;
				}
				return {
					text: main_core.Text.encode(this.hintText),
					popupOptions: {
						offsetTop: 5
					}
				};
			}
		},
		methods: {
			getButtonOptions() {
				const upperCaseIconName = main_core.Type.isString(this.iconName) ? this.iconName.toUpperCase() : '';
				const upperCaseButtonSize = main_core.Type.isString(this.size) ? this.size.toUpperCase() : 'extra_small';
				const btnStyle = this.itemTypeToButtonStyleDict[this.type] || ui_buttons.Button.AirStyle.OUTLINE;
				const titleText = this.type === ButtonType.ICON ? '' : this.title;
				return {
					id: this.id,
					useAirDesign: true,
					round: true,
					size: ui_buttons.Button.Size[upperCaseButtonSize],
					text: titleText,
					style: btnStyle,
					state: this.itemStateToButtonStateDict[this.currentState],
					icon: ui_buttons.Button.Icon[upperCaseIconName],
					props: main_core.Type.isPlainObject(this.props) ? this.props : {}
				};
			},
			getUiButton() {
				return this.uiButton;
			},
			disableWithTimer(sec) {
				this.setButtonState(ButtonState.DISABLED);
				const btn = this.getUiButton();
				let remainingSeconds = sec;
				btn.setText(this.formatSeconds(remainingSeconds));
				const timer = setInterval(() => {
					if (remainingSeconds < 1) {
						clearInterval(timer);
						btn.setText(this.title);
						this.setButtonState(ButtonState.DEFAULT);
						return;
					}
					remainingSeconds--;
					btn.setText(this.formatSeconds(remainingSeconds));
				}, 1000);
			},
			formatSeconds(sec) {
				const minutes = Math.floor(sec / 60);
				const seconds = sec % 60;
				const formatMinutes = this.formatNumber(minutes);
				const formatSeconds = this.formatNumber(seconds);
				return `${formatMinutes}:${formatSeconds}`;
			},
			formatNumber(num) {
				return num < 10 ? `0${num}` : num;
			},
			setButtonState(state) {
				this.parentSetButtonState(state);
				this.getUiButton()?.setState(this.itemStateToButtonStateDict[this.currentState] ?? null);
			},
			createSplitButton() {
				const menuItems = Object.keys(this.menuItems).map(key => this.menuItems[key]);
				const options = this.getButtonOptions();
				const showMenu = () => {
					ButtonMenu.showMenu(this, menuItems, {
						id: `split-button-menu-${this.id}`,
						className: 'crm-timeline__split-button-menu',
						width: 250,
						angle: true,
						cacheable: false,
						offsetLeft: 13,
						bindElement: this.$el.querySelector('.ui-btn-menu')
					});
				};
				options.menuButton = {
					onclick: (element, event) => {
						event.stopPropagation();
						showMenu();
					}
				};
				if (options.state === ui_buttons.ButtonState.DISABLED) {
					options.mainButton = {
						onclick: (element, event) => {
							event.stopPropagation();
							showMenu();
						}
					};
				}
				return new ui_buttons.SplitButton(options);
			},
			renderButton() {
				if (!this.buttonContainerRef) {
					return;
				}
				this.buttonContainerRef.innerHTML = '';
				const button = this.menuItems ? this.createSplitButton() : new ui_buttons.Button(this.getButtonOptions());
				button.renderTo(this.buttonContainerRef);
				this.uiButton = button;
			},
			setTooltip(tooltip) {
				this.hintText = tooltip;
			},
			isInViewport() {
				const rect = this.$el.getBoundingClientRect();
				return rect.top >= 0 && rect.left >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && rect.right <= (window.innerWidth || document.documentElement.clientWidth);
			},
			isPropEqual(propName, value) {
				return this.getButtonOptions().props[propName] === value;
			}
		},
		watch: {
			state(newValue) {
				this.setButtonState(newValue);
			},
			tooltip(newValue) {
				this.hintText = main_core.Type.isStringFilled(newValue) ? newValue : '';
			}
		},
		mounted() {
			this.renderButton();
		},
		updated() {
			this.renderButton();
		},
		template: `
		<div
			:class="containerClasses"
			v-hint="hintOptions"
			ref="buttonContainer"
			@click="executeAction"
		>
		</div>
	`
	});

	const AdditionalButtonIcon = Object.freeze({
		NOTE: 'note',
		PRINT: 'print',
		SCRIPT: 'script',
		QR_CODE: 'qr-code',
		VIDEOCONFERENCE: 'videoconference',
		DOTS: 'dots'
	});
	const AdditionalButtonColor = Object.freeze({
		DEFAULT: 'default',
		PRIMARY: 'primary'
	});
	Object.freeze({
		[AdditionalButtonIcon.NOTE]: ui_iconSet_api_core.Outline.NOTE,
		[AdditionalButtonIcon.PRINT]: ui_iconSet_api_core.Outline.PRINTER,
		[AdditionalButtonIcon.SCRIPT]: ui_iconSet_api_core.Outline.TRANSCRIPTION,
		[AdditionalButtonIcon.QR_CODE]: ui_iconSet_api_core.Outline.QR_CODE,
		[AdditionalButtonIcon.VIDEOCONFERENCE]: ui_iconSet_api_core.Outline.RECORD_VIDEO,
		[AdditionalButtonIcon.DOTS]: ui_iconSet_api_core.Outline.MORE_L
	});
	Object.freeze({
		[AdditionalButtonColor.DEFAULT]: ui_vue3_components_button.AirButtonStyle.PLAIN_NO_ACCENT,
		[AdditionalButtonColor.PRIMARY]: ui_vue3_components_button.AirButtonStyle.PLAIN_ACCENT
	});
	Object.freeze({
		[ButtonState.LOADING]: ui_vue3_components_button.ButtonState.WAITING,
		[ButtonState.AI_LOADING]: ui_vue3_components_button.ButtonState.AI_WAITING
	});
	({
		props: {
			color: {
				default: AdditionalButtonColor.DEFAULT}}});

	Object.freeze({
		'email': ui_iconSet_api_core.Outline.MAIL,
		'mail-income': ui_iconSet_api_core.Outline.MAIL,
		'mail-outcome': ui_iconSet_api_core.Outline.MAIL_SEND,
		'IM': ui_iconSet_api_core.Outline.MESSAGES,
		'call': ui_iconSet_api_core.Outline.PHONE_UP,
		'call-completed': ui_iconSet_api_core.Outline.PHONE_DOWN,
		'call-incoming': ui_iconSet_api_core.Outline.PHONE_IN,
		'call-incoming-missed': ui_iconSet_api_core.Outline.PHONE_BROKEN,
		'call-outcoming': ui_iconSet_api_core.Outline.PHONE_OUT,
		'crmForm': ui_iconSet_api_core.Outline.CRM_FORM,
		'store': ui_iconSet_api_core.Outline.PACKAGE,
		'task': ui_iconSet_api_core.Outline.TASK,
		'store-document': ui_iconSet_api_core.Outline.TASK,
		'meeting': ui_iconSet_api_core.Outline.MEETING_POINT,
		'visit': ui_iconSet_api_core.Outline.USER_PROFILE,
		'bp': ui_iconSet_api_core.Outline.BUSINES_PROCESS_STAGES,
		'info': ui_iconSet_api_core.Outline.INFO_CIRCLE,
		'comment': ui_iconSet_api_core.Outline.MESSAGE,
		'complete': ui_iconSet_api_core.Outline.CIRCLE_CHECK,
		'convert': ui_iconSet_api_core.Outline.REFRESH,
		'link': ui_iconSet_api_core.Outline.LINK,
		'unlink': ui_iconSet_api_core.Outline.UNLINK,
		'bank-card': ui_iconSet_api_core.Outline.BANK_CARD,
		'wallet': ui_iconSet_api_core.Outline.WALLET,
		'robot': ui_iconSet_api_core.Outline.ROBOT,
		'rest': ui_iconSet_api_core.Outline.DEVELOPER_RESOURCES,
		'taxi': ui_iconSet_api_core.Outline.DELIVERY,
		'terminal': ui_iconSet_api_core.Outline.PAYMENT_TERMINAL,
		'restApp': ui_iconSet_api_core.Outline.APPS,
		'sms': ui_iconSet_api_core.Outline.SMS,
		'new': ui_iconSet_api_core.Outline.EMPTY_MESSAGE,
		'whatsapp': ui_iconSet_api_core.Outline.WHATSAPP,
		'telegram': ui_iconSet_api_core.Outline.TELEGRAM,
		'check': ui_iconSet_api_core.Outline.RECEIPT,
		'document': ui_iconSet_api_core.Outline.FILE,
		'stage-change': ui_iconSet_api_core.Outline.STAGE,
		'relation': ui_iconSet_api_core.Outline.CONNECTION,
		'sum': ui_iconSet_api_core.Outline.SIGMA_SUMM,
		'circle-check': ui_iconSet_api_core.Outline.CIRCLE_CHECK,
		'clock': ui_iconSet_api_core.Outline.CLOCK,
		'view': ui_iconSet_api_core.Outline.SEEN_ITEMS,
		'pipeline': ui_iconSet_api_core.Outline.FILTER_FUNNEL,
		'attention': ui_iconSet_api_core.Outline.ALERT,
		'restoration': ui_iconSet_api_core.Outline.CLOCK_BACK,
		'arrow-up': ui_iconSet_api_core.Outline.ARROW_TOP_M,
		'arrow-down': ui_iconSet_api_core.Outline.ARROW_DOWN_M,
		'task-ping': ui_iconSet_api_core.Outline.PING,
		'task-new-comment': ui_iconSet_api_core.Outline.NEW_MESSAGE,
		'task-viewed-comment': ui_iconSet_api_core.Outline.MESSAGE,
		'task-activity': ui_iconSet_api_core.Outline.TASK,
		'ai-copilot': ui_iconSet_api_core.Outline.COPILOT,
		'ai-process': ui_iconSet_api_core.Outline.AI_PROCESS,
		'cycle-equal': ui_iconSet_api_core.Outline.REPEAT_CYCLE,
		'message-with-point': ui_iconSet_api_core.Outline.NEW_MESSAGE,
		'bizproc': ui_iconSet_api_core.Outline.BUSINES_PROCESS_STAGES,
		'booking': ui_iconSet_api_core.Outline.ONLINE_BOOKING,
		'repeat-sale': ui_iconSet_api_core.Outline.REPEAT_SALES,
		'conversion': ui_iconSet_api_core.Outline.DUPLICATE,
		'camera': ui_iconSet_api_core.Outline.CAMERA,
		'calendar': ui_iconSet_api_core.Outline.CALENDAR,
		'circle-crossed': ui_iconSet_api_core.Outline.CIRCLE_CROSS,
		'cross-air': ui_iconSet_api_core.Outline.CIRCLE_CROSS
	});

	/** @memberof BX.Crm.Timeline.Animation */
	class ItemNew {
		#startPosition;
		#node;
		#anchor;
		#areAnimatedItemsVisible;
		#id;
		#initialItem;
		#finalItem;
		#events;
		#settings;
		#stub;
		constructor() {
			this.#id = '';
			this.#settings = {};
			this.#initialItem = null;
			this.#finalItem = null;
			this.#events = null;
			this.#areAnimatedItemsVisible = false;
		}
		initialize(id, settings) {
			this.#id = main_core.Type.isStringFilled(id) ? id : BX.util.getRandomString(4);
			this.#settings = settings || {};
			this.#initialItem = this.getSetting('initialItem');
			this.#finalItem = this.getSetting('finalItem');
			this.#anchor = this.getSetting('anchor');
			this.#events = this.getSetting('events', {});
			this.#node = this.#initialItem.getWrapper();
		}
		getId() {
			return this.#id;
		}
		getSetting(name, defaultval) {
			return Object.hasOwn(this.#settings, name) ? this.#settings[name] : defaultval;
		}
		addHistoryItem() {
			if (this.#finalItem.getWrapper() === null && !(this.#finalItem instanceof CompatibleItem)) {
				this.#finalItem.initWrapper();
				this.#finalItem.initLayoutApp({
					add: false
				});
			}
			main_core.Dom.style(this.#anchor, {
				height: 0
			});
			this.#makeNodeStatic(this.#finalItem.getWrapper());
			main_core.Dom.insertBefore(this.#finalItem.getWrapper(), this.#anchor.nextSibling);
			requestAnimationFrame(() => {
				main_core.Dom.style(this.#finalItem.getWrapper(), {
					opacity: 1
				});
			});
		}
		run() {
			this.#areAnimatedItemsVisible = this.#isNodeVisible(this.#node);
			if (this.#areAnimatedItemsVisible === false) {
				this.finish();
				return;
			}
			this.#prepareInitialItemBeforeShift();
			this.#prepareFinalItemBeforeShift();
			setTimeout(() => {
				this.shiftAndReplaceInitialWithFinal();
				this.collapseStub();
			}, 300);
		}
		#prepareInitialItemBeforeShift() {
			main_core.Dom.addClass(this.#node, 'crm-entity-stream-section-animate-start');
			this.#startPosition = main_core.Dom.getPosition(this.#node);
			this.#makeNodeAbsoluteWithSavePosition(this.#node);
			this.addStubForInitialItem(this.#node);
			main_core.Dom.append(this.#node, document.body);
		}
		#prepareFinalItemBeforeShift() {
			if (!(this.#finalItem instanceof CompatibleItem)) {
				this.#finalItem.initWrapper();
				this.#finalItem.initLayoutApp({
					add: false
				});
			}
			main_core.Dom.style(this.#finalItem.getWrapper(), 'opacity', 0);
			main_core.Dom.append(this.#finalItem.getWrapper(), document.body);
			requestAnimationFrame(() => {
				this.#makeNodeAbsoluteWithSavePosition(this.#finalItem.getWrapper(), this.#startPosition);
			});
		}
		collapseStub() {
			main_core.bindOnce(this.#stub, 'transitionend', () => {
				main_core.Dom.remove(this.#stub);
			});
			main_core.Dom.style(this.#stub, {
				height: 0,
				margin: 0
			});
		}
		shift() {
			const shift = Shift.create(this.#node, this.#anchor, this.#startPosition, this.#stub, {
				complete: this.finish.bind(this)
			});
			shift.run();
			const heightDiff = main_core.Dom.getPosition(this.#finalItem.getWrapper()).height - this.#startPosition.height;
			const newNodeShift = Shift.create(this.#finalItem.getWrapper(), this.#anchor, main_core.Dom.getPosition(this.#finalItem.getWrapper()), undefined, undefined, heightDiff + 1);
			newNodeShift.run();
		}
		shiftAndReplaceInitialWithFinal() {
			this.shift();
			setTimeout(() => {
				this.#replaceInitialWithFinal();
			}, 100);
		}
		#replaceInitialWithFinal() {
			main_core.Dom.style(this.#node, 'opacity', 0);
			main_core.Dom.style(this.#finalItem.getWrapper(), 'opacity', 0.5);
		}
		addStubForInitialItem(node) {
			const wrapper = this.#initialItem.getWrapper();
			this.#stub = main_core.Tag.render`
			<div class="crm-entity-stream-section crm-entity-stream-section-planned crm-entity-stream-section-shadow">
				<div
					class="crm-entity-stream-section-content"
					style="height: ${wrapper.clientHeight}px;"
				></div>
			</div>
		`;
			const height = main_core.Dom.getPosition(wrapper).height;
			main_core.Dom.style(this.#stub, {
				height: `${height}px`,
				margin: getComputedStyle(wrapper).margin,
				animation: 'none',
				transition: 'height 0.2s ease-in-out'
			});
			main_core.Dom.insertBefore(this.#stub, node);
		}
		finish() {
			if (this.#areAnimatedItemsVisible) {
				main_core.Dom.removeClass(this.#node, 'crm-entity-stream-section-animate-start');
			}
			setTimeout(() => {
				this.#initialItem.clearLayout();
				main_core.Dom.remove(this.#node);
				this.addHistoryItem();
				if (main_core.Type.isFunction(this.#events.complete)) {
					this.#events.complete();
				}
			}, 500);
		}
		#makeNodeAbsoluteWithSavePosition(node, pos) {
			const nodePosition = main_core.Dom.getPosition(node);
			const position = pos || nodePosition;
			main_core.Dom.style(node, {
				position: 'absolute',
				width: `${position.width}px`,
				height: `${nodePosition.height}px`,
				top: `${position.top}px`,
				left: `${position.left}px`,
				zIndex: 960
			});
		}
		#makeNodeStatic(node) {
			main_core.Dom.style(node, {
				position: null,
				width: null,
				height: null,
				top: null,
				left: null
			});
		}
		#isNodeVisible(node) {
			const nodePosition = main_core.Dom.getPosition(node);
			return node.offsetParent !== null && nodePosition.height > 0 && nodePosition.width > 0;
		}
		static create(id, settings) {
			const self = new ItemNew();
			self.initialize(id, settings);
			return self;
		}
	}

	/** @memberof BX.Crm.Timeline */
	class Steam {
		constructor() {
			this._id = "";
			this._settings = {};
			this._container = null;
			this._manager = null;
			this._activityEditor = null;
			this._timeFormat = "";
			this._year = 0;
			this._isStubMode = false;
			this._userId = 0;
			this._readOnly = false;
			this._streamType = crm_timeline_item.StreamType.history;
			this._anchor = null;
			this._serviceUrl = "";
		}
		initialize(id, settings) {
			this._id = BX.type.isNotEmptyString(id) ? id : BX.util.getRandomString(4);
			this._settings = settings ? settings : {};
			this._container = BX(this.getSetting("container"));
			if (!BX.type.isElementNode(this._container)) {
				throw "Timeline. Container node is not found.";
			}
			this._editorContainer = BX(this.getSetting("editorContainer"));
			this._manager = this.getSetting("manager");
			if (!main_core.Type.isObject(this._manager)) {
				throw "Timeline. Manager instance is not found.";
			}

			//
			const datetimeFormat = BX.message("FORMAT_DATETIME").replace(/:SS/, "");
			const dateFormat = BX.message("FORMAT_DATE");
			this._timeFormat = BX.date.convertBitrixFormat(BX.util.trim(datetimeFormat.replace(dateFormat, "")));
			//
			this._year = new Date().getFullYear();
			this._activityEditor = this.getSetting("activityEditor");
			this._isStubMode = BX.prop.getBoolean(this._settings, "isStubMode", false);
			this._readOnly = BX.prop.getBoolean(this._settings, "readOnly", false);
			this._userId = BX.prop.getInteger(this._settings, "userId", 0);
			this._serviceUrl = BX.prop.getString(this._settings, "serviceUrl", "");
			this.doInitialize();
		}
		getId() {
			return this._id;
		}
		isScheduleStream() {
			return this.getStreamType() === crm_timeline_item.StreamType.scheduled;
		}
		isFixedHistoryStream() {
			return this.getStreamType() === crm_timeline_item.StreamType.pinned;
		}
		isHistoryStream() {
			return this.getStreamType() === crm_timeline_item.StreamType.history;
		}
		getSetting(name, defaultval) {
			return this._settings.hasOwnProperty(name) ? this._settings[name] : defaultval;
		}
		doInitialize() {}
		layout() {}
		isStubMode() {
			return this._isStubMode;
		}
		isReadOnly() {
			return this._readOnly;
		}
		getUserId() {
			return this._userId;
		}
		getServiceUrl() {
			return this._serviceUrl;
		}
		getAnchor() {
			return this._anchor;
		}
		getStreamType() {
			return this._streamType;
		}
		refreshLayout() {}
		getManager() {
			return this._manager;
		}
		getOwnerInfo() {
			return this._manager.getOwnerInfo();
		}
		reload() {
			const currentUrl = this.getSetting("currentUrl");
			const ajaxId = this.getSetting("ajaxId");
			if (ajaxId !== "") {
				BX.ajax.insertToNode(BX.util.add_url_param(currentUrl, {
					bxajaxid: ajaxId
				}), "comp_" + ajaxId);
			} else {
				window.location = currentUrl;
			}
		}
		getUserTimezoneOffset() {
			return main_date.Timezone.Offset.USER_TO_SERVER;
		}
		getServerTimezoneOffset() {
			return main_date.Timezone.Offset.SERVER_TO_UTC;
		}

		// @todo replace by DatetimeConverter
		formatTime(time, now, utc) {
			return main_date.DateTimeFormat.format(this._timeFormat, time, now, utc);
		}

		// @todo replace by DatetimeConverter
		formatDate(date) {
			return main_date.DateTimeFormat.format([["today", "today"], ["tommorow", "tommorow"], ["yesterday", "yesterday"], ["", date.getFullYear() === this._year ? main_date.DateTimeFormat.getFormat('DAY_MONTH_FORMAT') : main_date.DateTimeFormat.getFormat('LONG_DATE_FORMAT')]], date);
		}
		cutOffText(text, length) {
			if (!BX.type.isNumber(length)) {
				length = 0;
			}
			if (length <= 0 || text.length <= length) {
				return text;
			}
			let offset = length - 1;
			const whitespaceOffset = text.substring(offset).search(/\s/i);
			if (whitespaceOffset > 0) {
				offset += whitespaceOffset;
			}
			return text.substring(0, offset) + "...";
		}
		getItems() {
			return [];
		}

		/**
		 * @abstract
		 */
		setItems(items) {
			throw new Error('Stream.setItems() must be overridden');
		}
		getLastItem() {
			const items = this.getItems();
			return items.length > 0 ? items[items.length - 1] : null;
		}
		findItemById(id) {
			id = id.toString();
			return this.getItems().find(item => item.getId() === id) || null;
		}
		getItemIndex(item) {
			return this.getItems().findIndex(currentItem => currentItem === item);
		}
		removeItemByIndex(index) {
			const items = this.getItems();
			if (index < items.length) {
				items.splice(index, 1);
				this.setItems(items);
			}
		}

		/**
		 * @abstract
		 */
		createItem(data) {
			throw new Error('Stream.createItem() must be overridden');
		}
		createItemCopy(item) {
			if (item instanceof crm_timeline_item.ConfigurableItem) {
				return item.clone();
			}
			return this.createItem(item.getData());
		}
		refreshItem(item, animateUpdate = true, animateMove) {
			const index = this.getItemIndex(item);
			if (index < 0) {
				return Promise.resolve();
			}
			this.removeItemByIndex(index);
			let itemPositionChanged = false;
			let newIndex = 0;
			let newItem;
			if (this.isScheduleStream()) {
				newItem = this.createItemCopy(item);
				newIndex = this.calculateItemIndex(newItem);
				itemPositionChanged = newIndex !== index;
			}
			if (!itemPositionChanged) {
				this.addItem(item, newIndex);
				item.refreshLayout();
				if (animateUpdate) {
					return this.animateItemAdding(item);
				}
				return Promise.resolve();
			}
			const anchor = this.createAnchor(newIndex);
			this.addItem(newItem, newIndex);
			if (animateMove) {
				newItem.layout({
					add: false
				});
				return new Promise(resolve => {
					const animation = Item.create('', {
						initialItem: item,
						finalItem: newItem,
						anchor: anchor,
						events: {
							complete: () => {
								item.destroy();
								resolve();
							}
						}
					});
					animation.run();
				});
			} else {
				newItem.layout({
					anchor: anchor
				});
				item.destroy();
				return Promise.resolve();
			}
		}
		calculateItemIndex(item) {
			return 0;
		}
		createAnchor(index) {
			return null;
		}

		/**
		 * @abstract
		 */
		addItem(item, index) {
			throw new Error('Stream.addItem() must be overridden');
		}

		/**
		 * @abstract
		 */
		deleteItem(item) {
			throw new Error('Stream.deleteItem() must be overridden');
		}
		deleteItemAnimated(item) {
			if (!main_core.Type.isDomNode(item.getWrapper())) {
				this.deleteItem(item);
				return Promise.resolve();
			}
			return new Promise(resolve => {
				const wrapperPosition = main_core.Dom.getPosition(item.getWrapper());
				if (main_core.Dom.hasClass(item.getWrapper(), 'crm-entity-stream-section-planned')) {
					main_core.Dom.style(item.getWrapper(), {
						animation: 'none',
						opacity: 1
					});
				}
				const hideEvent = new BX.easing({
					duration: 1000,
					start: {
						height: wrapperPosition.height,
						opacity: 1,
						marginBottom: 15
					},
					finish: {
						height: 0,
						opacity: 0,
						marginBottom: 0
					},
					transition: BX.easing.makeEaseOut(BX.easing.transitions.quart),
					step: state => {
						main_core.Dom.style(item.getWrapper(), {
							height: state.height + 'px',
							opacity: state.opacity,
							marginBottom: state.marginBottom
						});
					},
					complete: () => {
						this.deleteItem(item);
						resolve();
					}
				});
				hideEvent.animate();
			});
		}
		moveItemToStream(item, destinationStream, destinationItem) {
			this.removeItemByIndex(this.getItemIndex(item));
			if (this.getItems().length > 0) {
				this.refreshLayout();
			}
			return new Promise(resolve => {
				const animation = ItemNew.create('', {
					initialItem: item,
					finalItem: destinationItem,
					anchor: destinationStream.createAnchor(),
					events: {
						complete: () => {
							this.refreshLayout();
							destinationStream.refreshLayout();
							resolve();
						}
					}
				});
				animation.run();
			});
		}
		animateItemAdding(item) {
			return Promise.resolve();
		}
	}

	/** @memberof BX.Crm.Timeline.Streams */
	class EntityChat extends Steam {
		static LayoutType = {
			none: 0,
			invitation: 1,
			summary: 2
		};
		constructor() {
			super();
			this._data = null;
			this._layoutType = EntityChat.LayoutType.none;
			this._wrapper = null;
			this._contentWrapper = null;
			this._messageWrapper = null;
			this._messageDateNode = null;
			this._messageTexWrapper = null;
			this._messageTextNode = null;
			this._userWrapper = null;
			this._extraUserCounter = null;
			this.isLoading = false;
			this._openChatHandler = BX.delegate(this.onOpenChat, this);
		}
		doInitialize() {
			this._data = BX.prop.getObject(this._settings, "data", {});
		}
		getData() {
			return this._data;
		}
		setData(data) {
			this._data = BX.type.isPlainObject(data) ? data : {};
		}
		isEnabled() {
			return BX.prop.getBoolean(this._data, "ENABLED", true);
		}

		/**
		 * @private
		 * @return {boolean}
		 */
		isRestricted() {
			return BX.prop.getBoolean(this._data, "IS_RESTRICTED", false);
		}

		/**
		 * @private
		 * @return {void}
		 */
		applyLockScript() {
			const lockScript = BX.prop.getString(this._data, "LOCK_SCRIPT", null);
			if (BX.Type.isString(lockScript) && lockScript !== '') {
				// eslint-disable-next-line no-eval -- intentional: executes server-provided lock script for entity chat
				eval(lockScript);
			}
		}
		getChatId() {
			return BX.prop.getInteger(this._data, "CHAT_ID", 0);
		}
		getUserId() {
			const userId = parseInt(top.BX.message("USER_ID"));
			return !isNaN(userId) ? userId : 0;
		}
		getMessageData() {
			return BX.prop.getObject(this._data, "MESSAGE", {});
		}
		setMessageData(data) {
			this._data["MESSAGE"] = BX.type.isPlainObject(data) ? data : {};
		}
		getUserInfoData() {
			return BX.prop.getObject(this._data, "USER_INFOS", {});
		}
		setUserInfoData(data) {
			this._data["USER_INFOS"] = BX.type.isPlainObject(data) ? data : {};
		}
		hasUserInfo(userId) {
			return userId > 0 && BX.type.isPlainObject(this.getUserInfoData()[userId]);
		}
		getUserInfo(userId) {
			const userInfos = this.getUserInfoData();
			return userId > 0 && BX.type.isPlainObject(userInfos[userId]) ? userInfos[userId] : null;
		}
		removeUserInfo(userId) {
			const userInfos = this.getUserInfoData();
			if (userId > 0 && BX.type.isPlainObject(userInfos[userId])) {
				delete userInfos[userId];
			}
		}
		setUnreadMessageCounter(userId, counter) {
			const userInfos = this.getUserInfoData();
			if (userId > 0 && BX.type.isPlainObject(userInfos[userId])) {
				userInfos[userId]["counter"] = counter;
			}
		}
		layout() {
			if (!this.isEnabled() || this.isStubMode()) {
				return;
			}
			this._wrapper = BX.create("div", {
				props: {
					className: "crm-entity-stream-section crm-entity-stream-section-live-im"
				}
			});
			this._container.appendChild(this._wrapper);
			this._wrapper.appendChild(BX.create("div", {
				props: {
					className: "crm-entity-stream-section-icon crm-entity-stream-section-icon-live-im"
				}
			}));
			this._contentWrapper = BX.create("div", {
				props: {
					className: "crm-entity-stream-content-live-im-detail"
				}
			});
			this._wrapper.appendChild(BX.create("div", {
				props: {
					className: "crm-entity-stream-section-content"
				},
				children: [BX.create("div", {
					props: {
						className: "crm-entity-stream-content-event"
					},
					children: [this._contentWrapper]
				})]
			}));
			this._userWrapper = BX.create("div", {
				props: {
					className: "crm-entity-stream-live-im-user-avatars"
				}
			});
			this._contentWrapper.appendChild(BX.create("div", {
				props: {
					className: "crm-entity-stream-live-im-users"
				},
				children: [this._userWrapper]
			}));
			this._extraUserCounter = BX.create("div", {
				props: {
					className: "crm-entity-stream-live-im-user-counter"
				}
			});
			this._contentWrapper.appendChild(this._extraUserCounter);
			this._layoutType = EntityChat.LayoutType.none;
			if (this.getChatId() > 0) {
				this.renderSummary();
			} else {
				this.renderInvitation();
			}
			BX.bind(this._contentWrapper, "click", this._openChatHandler);
			BX.addCustomEvent("onPullEvent-im", this.onChatEvent.bind(this));
		}
		refreshLayout() {
			BX.cleanNode(this._contentWrapper);
			this._userWrapper = BX.create("div", {
				props: {
					className: "crm-entity-stream-live-im-user-avatars"
				}
			});
			this._contentWrapper.appendChild(BX.create("div", {
				props: {
					className: "crm-entity-stream-live-im-users"
				},
				children: [this._userWrapper]
			}));
			this._extraUserCounter = BX.create("div", {
				props: {
					className: "crm-entity-stream-live-im-user-counter"
				}
			});
			this._contentWrapper.appendChild(this._extraUserCounter);
			this._layoutType = EntityChat.LayoutType.none;
			if (this.getChatId() > 0) {
				this.renderSummary();
			} else {
				this.renderInvitation();
			}
		}
		renderInvitation() {
			this._layoutType = EntityChat.LayoutType.invitation;
			this.refreshUsers();
			this._messageTextNode = BX.create("div", {
				props: {
					className: "crm-entity-stream-live-im-user-invite-text"
				}
			});
			this._contentWrapper.appendChild(this._messageTextNode);
			this._messageTextNode.innerHTML = this.getMessage("invite");
		}
		renderSummary() {
			this._layoutType = EntityChat.LayoutType.summary;
			this.refreshUsers();
			this._contentWrapper.appendChild(BX.create("div", {
				props: {
					className: "crm-entity-stream-live-im-separator"
				}
			}));
			this._messageWrapper = BX.create("div", {
				props: {
					className: "crm-entity-stream-live-im-messanger"
				}
			});
			this._contentWrapper.appendChild(this._messageWrapper);
			this._messageDateNode = BX.create("div", {
				props: {
					className: "crm-entity-stream-live-im-time"
				}
			});
			this._messageWrapper.appendChild(this._messageDateNode);
			this._messageTexWraper = BX.create("div", {
				props: {
					className: "crm-entity-stream-live-im-message"
				}
			});
			this._messageWrapper.appendChild(this._messageTexWraper);
			this._messageTextNode = BX.create("div", {
				props: {
					className: "crm-entity-stream-live-im-message-text"
				}
			});
			this._messageTexWraper.appendChild(this._messageTextNode);
			this._messageCounterNode = BX.create("div", {
				props: {
					className: "crm-entity-stream-live-im-message-counter"
				}
			});
			this._messageWrapper.appendChild(this._messageCounterNode);
			this.refreshSummary();
		}
		refreshUsers() {
			BX.cleanNode(this._userWrapper);
			const infos = this.getUserInfoData();
			const list = Object.values(infos);
			if (list.length === 0) {
				this._userWrapper.appendChild(BX.create("span", {
					props: {
						className: "crm-entity-stream-live-im-user-avatar ui-icon ui-icon-common-user"
					},
					children: [BX.create("i")]
				}));
			} else {
				const count = list.length >= 3 ? 3 : list.length;
				for (let i = 0; i < count; i++) {
					const info = list[i];
					const icon = BX.create("i");
					const imageUrl = BX.prop.getString(info, "avatar", "");
					if (main_core.Type.isStringFilled(imageUrl)) {
						icon.style.backgroundImage = "url('" + encodeURI(main_core.Text.encode(imageUrl)) + "')";
					}
					this._userWrapper.appendChild(BX.create("span", {
						props: {
							className: "crm-entity-stream-live-im-user-avatar ui-icon ui-icon-common-user"
						},
						children: [icon]
					}));
				}
			}
			if (this._layoutType === EntityChat.LayoutType.summary) {
				if (list.length > 3) {
					this._extraUserCounter.display = "";
					this._extraUserCounter.innerHTML = "+" + (list.length - 3).toString();
				} else {
					if (this._extraUserCounter.innerHTML !== "") {
						this._extraUserCounter.innerHTML = "";
					}
					this._extraUserCounter.display = "none";
				}
			} else
				//if(this._layoutType === EntityChat.LayoutType.invitation)
				{
					if (this._extraUserCounter.innerHTML !== "") {
						this._extraUserCounter.innerHTML = "";
					}
					this._extraUserCounter.display = "none";
					this._userWrapper.appendChild(BX.create("span", {
						props: {
							className: "crm-entity-stream-live-im-user-invite-btn"
						}
					}));
				}
		}
		refreshSummary() {
			if (this._layoutType !== EntityChat.LayoutType.summary) {
				return;
			}
			const message = this.getMessageData();

			//region Message Date
			const isoDate = BX.prop.getString(message, "date", "");
			if (isoDate === "") {
				this._messageDateNode.innerHTML = "";
			} else {
				// @todo replace by DatetimeConverter
				const remoteDate = new Date(isoDate).getTime() / 1000 + this.getServerTimezoneOffset() + this.getUserTimezoneOffset();
				const localTime = new Date().getTime() / 1000 + this.getServerTimezoneOffset() + this.getUserTimezoneOffset();
				this._messageDateNode.innerHTML = this.formatTime(remoteDate, localTime, true);
			}
			//endregion

			//region Message Text
			let text = BX.prop.getString(message, "text", "");
			const params = BX.prop.getObject(message, "params", {});
			if (text === "" && !params.ATTACH && !params.FILE_ID) {
				this._messageTextNode.innerHTML = "";
			} else {
				const MessengerCommon = main_core.Reflection.getClass('top.BX.MessengerCommon');
				const MessengerParser = main_core.Reflection.getClass('top.BX.Messenger.v2.Lib.Parser');
				if (MessengerCommon) {
					text = MessengerCommon.purifyText(text, params);
				} else if (MessengerParser) {
					text = MessengerParser.purify({
						text,
						attach: params.ATTACH,
						files: typeof params.FILE_ID === 'object' && params.FILE_ID.length > 0
					});
				}
				this._messageTextNode.innerText = text;
			}
			//endregion

			//region Unread Message Counter
			let counter = 0;
			const userId = this.getUserId();
			if (userId > 0) {
				counter = BX.prop.getInteger(BX.prop.getObject(BX.prop.getObject(this._data, "USER_INFOS", {}), userId, null), "counter", 0);
			}
			this._messageCounterNode.innerHTML = counter.toString();
			this._messageCounterNode.style.display = counter > 0 ? "" : "none";
			//endregion
		}
		refreshUsersAnimated() {
			BX.removeClass(this._userWrapper, 'crm-entity-stream-live-im-message-show');
			BX.addClass(this._userWrapper, 'crm-entity-stream-live-im-message-hide');
			window.setTimeout(function () {
				this.refreshUsers();
				window.setTimeout(function () {
					BX.removeClass(this._userWrapper, 'crm-entity-stream-live-im-message-hide');
					BX.addClass(this._userWrapper, 'crm-entity-stream-live-im-message-show');
				}.bind(this), 50);
			}.bind(this), 500);
		}
		refreshSummaryAnimated() {
			BX.removeClass(this._messageWrapper, 'crm-entity-stream-live-im-message-show');
			BX.addClass(this._messageWrapper, 'crm-entity-stream-live-im-message-hide');
			window.setTimeout(function () {
				this.refreshSummary();
				window.setTimeout(function () {
					BX.removeClass(this._messageWrapper, 'crm-entity-stream-live-im-message-hide');
					BX.addClass(this._messageWrapper, 'crm-entity-stream-live-im-message-show');
				}.bind(this), 50);
			}.bind(this), 500);
		}
		loading(isLoading) {
			if (this._contentWrapper && this._contentWrapper.classList) {
				if (isLoading) {
					main_core.Dom.addClass(this._contentWrapper, 'crm-entity-chat-loading');
					this.isLoading = true;
				} else {
					main_core.Dom.removeClass(this._contentWrapper, 'crm-entity-chat-loading');
					this.isLoading = false;
				}
			}
		}
		onOpenChat(e) {
			if (main_core.Type.isUndefined(top.BX.Messenger.Public) || this.isLoading) {
				return;
			}
			if (this.isRestricted()) {
				this.applyLockScript();
				return;
			}
			const ownerInfo = this.getOwnerInfo();
			const entityId = BX.prop.getInteger(ownerInfo, 'ENTITY_ID', 0);
			const entityTypeId = BX.prop.getInteger(ownerInfo, 'ENTITY_TYPE_ID', 0);
			const data = {
				data: {
					entityId,
					entityTypeId
				}
			};
			const successCallback = response => {
				this.loading(false);
				const chatId = response.data.chatId;
				top.BX.Messenger.Public.openChat(`chat${chatId}`);
			};
			const errorCallback = error => {
				this.loading(false);
				const errorMessage = error.errors[0].message;
				BX.UI.Notification.Center.notify({
					content: errorMessage,
					autoHideDelay: 5000
				});
			};
			this.loading(true);
			BX.ajax.runAction('crm.timeline.chat.get', data).then(successCallback, errorCallback);
		}
		onChatEvent(command, params, extras) {
			const chatId = this.getChatId();
			if (chatId <= 0 || chatId !== BX.prop.getInteger(params, "chatId", 0)) {
				return;
			}
			if (command === "chatUserAdd") {
				this.setUserInfoData(BX.mergeEx(this.getUserInfoData(), BX.prop.getObject(params, "users", {})));
				this.refreshUsersAnimated();
			} else if (command === "chatUserLeave") {
				this.removeUserInfo(BX.prop.getInteger(params, "userId", 0));
				this.refreshUsersAnimated();
			} else if (command === "messageChat") {
				//Message was added.
				this.setMessageData(BX.prop.getObject(params, "message", {}));
				this.setUnreadMessageCounter(this.getUserId(), BX.prop.getInteger(params, "counter", 0));
				this.refreshSummaryAnimated();
			} else if (command === "messageUpdate" || command === "messageDelete") {
				//Message was modified or removed.
				if (command === "messageDelete") {
					//HACK: date is not in ISO format
					delete params["date"];
				}
				const message = this.getMessageData();
				if (BX.prop.getInteger(message, "id", 0) === BX.prop.getInteger(params, "id", 0)) {
					this.setMessageData(BX.mergeEx(message, params));
					this.refreshSummaryAnimated();
				}
			} else if (command === "readMessageChat") {
				this.setUnreadMessageCounter(this.getUserId(), 0);
				this.refreshSummaryAnimated();
			} else if (command === "unreadMessageChat") {
				this.setUnreadMessageCounter(this.getUserId(), BX.prop.getInteger(params, "counter", 0));
				this.refreshSummaryAnimated();
			}
		}
		getMessage(name) {
			return BX.prop.getString(EntityChat.messages, name, name);
		}
		static create(id, settings) {
			const self = new EntityChat();
			self.initialize(id, settings);
			EntityChat.items[self.getId()] = self;
			return self;
		}
		static items = {};
		static messages = {};
	}

	/** @memberof BX.Crm.Timeline.Items */
	class Modification extends History$1 {
		constructor() {
			super();
		}
		getMessage(name) {
			const m = Modification.messages;
			return m.hasOwnProperty(name) ? m[name] : name;
		}
		getTitle() {
			return this.getTextDataParam("TITLE");
		}
		prepareContent() {
			const wrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section crm-entity-stream-section-info"
				}
			});
			wrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section-icon crm-entity-stream-section-icon-info"
				}
			}));
			const content = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-event"
				}
			});
			const header = this.prepareHeaderLayout();
			const contentChildren = [];
			if (BX.type.isNotEmptyString(this.getTextDataParam("START_NAME"))) {
				contentChildren.push(BX.create("SPAN", {
					attrs: {
						className: "crm-entity-stream-content-detain-info-status"
					},
					text: this.getTextDataParam("START_NAME")
				}));
				contentChildren.push(BX.create("SPAN", {
					attrs: {
						className: "crm-entity-stream-content-detail-info-separator-icon"
					}
				}));
			}
			if (BX.type.isNotEmptyString(this.getTextDataParam("FINISH_NAME"))) {
				contentChildren.push(BX.create("SPAN", {
					attrs: {
						className: "crm-entity-stream-content-detain-info-status"
					},
					text: this.getTextDataParam("FINISH_NAME")
				}));
			}
			content.appendChild(header);
			content.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail"
				},
				children: [BX.create("DIV", {
					attrs: {
						className: "crm-entity-stream-content-detail-info"
					},
					children: contentChildren
				})]
			}));

			//region Author
			const authorNode = this.prepareAuthorLayout();
			if (authorNode) {
				content.appendChild(authorNode);
			}
			//endregion

			wrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section-content"
				},
				children: [content]
			}));
			return wrapper;
		}
		static create(id, settings) {
			const self = new Modification();
			self.initialize(id, settings);
			return self;
		}
		static messages = {};
	}

	/** @memberof BX.Crm.Timeline.Actions */
	class Conversion extends History$1 {
		constructor() {
			super();
		}
		getMessage(name) {
			const m = Conversion.messages;
			return m.hasOwnProperty(name) ? m[name] : name;
		}
		getTitle() {
			return this.getTextDataParam("TITLE");
		}
		prepareContent() {
			const wrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section crm-entity-stream-section-convert crm-entity-stream-section-history"
				}
			});
			wrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section-icon crm-entity-stream-section-icon-convert"
				}
			}));
			const content = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-event"
				}
			});
			const header = this.prepareHeaderLayout();
			content.appendChild(header);
			const entityNodes = [];
			const entityInfos = this.getArrayDataParam("ENTITIES");
			let i = 0;
			const length = entityInfos.length;
			for (; i < length; i++) {
				const entityInfo = entityInfos[i];
				let entityNode;
				if (BX.prop.getString(entityInfo, 'SHOW_URL', "") === "") {
					entityNode = BX.create("DIV", {
						attrs: {
							className: "crm-entity-stream-content-detail-convert"
						},
						children: [BX.create("DIV", {
							attrs: {
								className: "crm-entity-stream-content-detain-convert-status"
							},
							children: [BX.create("SPAN", {
								attrs: {
									className: "crm-entity-stream-content-detail-status-text"
								},
								text: BX.CrmEntityType.getNotFoundMessage(entityInfo['ENTITY_TYPE_ID'])
							})]
						})]
					});
				} else {
					entityNode = BX.create("DIV", {
						attrs: {
							className: "crm-entity-stream-content-detail-convert"
						},
						children: [BX.create("DIV", {
							attrs: {
								className: "crm-entity-stream-content-detain-convert-status"
							},
							children: [BX.create("SPAN", {
								attrs: {
									className: "crm-entity-stream-content-detail-status-text"
								},
								text: entityInfo['ENTITY_TYPE_CAPTION']
							})]
						}), BX.create("SPAN", {
							attrs: {
								className: "crm-entity-stream-content-detail-convert-separator-icon"
							}
						}), BX.create("DIV", {
							attrs: {
								className: "crm-entity-stream-content-detain-convert-status"
							},
							children: [BX.create("A", {
								attrs: {
									className: "crm-entity-stream-content-detail-target",
									href: entityInfo['SHOW_URL']
								},
								text: entityInfo['TITLE']
							})]
						})]
					});
				}
				entityNodes.push(entityNode);
			}
			content.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail"
				},
				children: entityNodes
			}));

			//region Author
			const authorNode = this.prepareAuthorLayout();
			if (authorNode) {
				content.appendChild(authorNode);
			}
			//endregion

			wrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section-content"
				},
				children: [content]
			}));
			return wrapper;
		}
		static create(id, settings) {
			const self = new Conversion();
			self.initialize(id, settings);
			return self;
		}
		static messages = {};
	}

	/** @memberof BX.Crm.Timeline */
	class Action {
		constructor() {
			this._id = "";
			this._settings = {};
			this._container = null;
		}
		initialize(id, settings) {
			this._id = BX.type.isNotEmptyString(id) ? id : BX.util.getRandomString(4);
			this._settings = settings ? settings : {};
			this._container = this.getSetting("container");
			if (!BX.type.isElementNode(this._container)) {
				throw "BX.CrmTimelineAction: Could not find container.";
			}
			this.doInitialize();
		}
		doInitialize() {}
		getId() {
			return this._id;
		}
		getSetting(name, defaultval) {
			return this._settings.hasOwnProperty(name) ? this._settings[name] : defaultval;
		}
		layout() {
			this.doLayout();
		}
		doLayout() {}
	}

	/** @memberof BX.Crm.Timeline.Actions */
	let Activity$1 = class Activity extends Action {
		constructor() {
			super();
			this._activityEditor = null;
			this._entityData = null;
			this._item = null;
			this._isEnabled = true;
		}
		doInitialize() {
			this._entityData = this.getSetting("entityData");
			if (!BX.type.isPlainObject(this._entityData)) {
				throw "BX.Crm.Timeline.Actions.Activity. A required parameter 'entityData' is missing.";
			}
			this._activityEditor = this.getSetting("activityEditor");
			if (!(this._activityEditor instanceof BX.CrmActivityEditor)) {
				throw "BX.Crm.Timeline.Actions.Activity. A required parameter 'activityEditor' is missing.";
			}
			this._item = this.getSetting("item");
			this._isEnabled = this.getSetting("enabled", true);
		}
		getActivityId() {
			return BX.prop.getInteger(this._entityData, "ID", 0);
		}
		loadActivityCommunications(callback) {
			this._activityEditor.getActivityCommunications(this.getActivityId(), function (communications) {
				if (BX.type.isFunction(callback)) {
					callback(communications);
				}
			}, true);
		}
		getItemData() {
			return this._item ? this._item.getData() : null;
		}
	};

	/** @memberof BX.Crm.Timeline.Actions */
	let Email$2 = class Email extends Activity$1 {
		constructor() {
			super();
			this._clickHandler = BX.delegate(this.onClick, this);
			this._saveHandler = BX.delegate(this.onSave, this);
		}
		onClick(e) {
			const settings = {
				"ownerType": BX.CrmEntityType.resolveName(BX.prop.getInteger(this._entityData, "OWNER_TYPE_ID", 0)),
				"ownerID": BX.prop.getInteger(this._entityData, "OWNER_ID", 0),
				"ownerUrl": BX.prop.getString(this._entityData, "OWNER_URL", ""),
				"ownerTitle": BX.prop.getString(this._entityData, "OWNER_TITLE", ""),
				"originalMessageID": BX.prop.getInteger(this._entityData, "ID", 0),
				"messageType": "RE"
			};
			if (BX.CrmActivityProvider && top.BX.Bitrix24 && top.BX.Bitrix24.Slider) {
				const activity = this._activityEditor.addEmail(settings);
				activity.addOnSave(this._saveHandler);
			} else {
				this.loadActivityCommunications(BX.delegate(function (communications) {
					settings['communications'] = BX.type.isArray(communications) ? communications : [];
					settings['communicationsLoaded'] = true;
					BX.CrmActivityEmail.prepareReply(settings);
					const activity = this._activityEditor.addEmail(settings);
					activity.addOnSave(this._saveHandler);
				}, this));
			}
			return BX.PreventDefault(e);
		}
		onSave(activity, data) {
			if (BX.type.isFunction(this._item.onActivityCreate)) {
				this._item.onActivityCreate(activity, data);
			}
		}
	};

	/** @memberof BX.Crm.Timeline.Actions */
	class HistoryEmail extends Email$2 {
		constructor() {
			super();
		}
		doLayout() {
			this._container.appendChild(BX.create("A", {
				attrs: {
					className: "crm-entity-stream-content-action-reply-btn"
				},
				events: {
					"click": this._clickHandler
				}
			}));
		}
		static create(id, settings) {
			const self = new HistoryEmail();
			self.initialize(id, settings);
			return self;
		}
	}

	/** @memberof BX.Crm.Timeline.Actions */
	class ScheduleEmail extends Email$2 {
		constructor() {
			super();
		}
		doLayout() {
			this._container.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-action-reply-btn"
				},
				events: {
					"click": this._clickHandler
				}
			}));
		}
		static create(id, settings) {
			const self = new ScheduleEmail();
			self.initialize(id, settings);
			return self;
		}
	}

	/** @memberof BX.Crm.Timeline.Items */
	class HistoryActivity extends History$1 {
		constructor() {
			super();
		}
		doInitialize() {
			super.doInitialize();
			if (!(this._activityEditor instanceof BX.CrmActivityEditor)) {
				throw "HistoryActivity. The field 'activityEditor' is not assigned.";
			}
		}
		getTitle() {
			return BX.prop.getString(this.getAssociatedEntityData(), "SUBJECT", "");
		}
		getTypeDescription() {
			const entityData = this.getAssociatedEntityData();
			const direction = BX.prop.getInteger(entityData, "DIRECTION", 0);
			const typeCategoryId = this.getTypeCategoryId();
			if (typeCategoryId === BX.CrmActivityType.email) {
				return this.getMessage(direction === BX.CrmActivityDirection.incoming ? "incomingEmail" : "outgoingEmail");
			} else if (typeCategoryId === BX.CrmActivityType.call) {
				return this.getMessage(direction === BX.CrmActivityDirection.incoming ? "incomingCall" : "outgoingCall");
			} else if (typeCategoryId === BX.CrmActivityType.meeting) {
				return this.getMessage("meeting");
			} else if (typeCategoryId === BX.CrmActivityType.task) {
				return this.getMessage("task");
			} else if (typeCategoryId === BX.CrmActivityType.provider) {
				const providerId = BX.prop.getString(entityData, "PROVIDER_ID", "");
				if (providerId === "CRM_WEBFORM") {
					return this.getMessage("webform");
				} else if (providerId === "CRM_SMS") {
					return this.getMessage("sms");
				} else if (providerId === "CRM_REQUEST") {
					return this.getMessage("activityRequest");
				} else if (providerId === "IMOPENLINES_SESSION") {
					return this.getMessage("openLine");
				} else if (providerId === "REST_APP") {
					return this.getMessage("restApplication");
				} else if (providerId === "VISIT_TRACKER") {
					return this.getMessage("visit");
				} else if (providerId === "ZOOM") {
					return this.getMessage("zoom");
				}
			}
			return "";
		}
		prepareTitleLayout() {
			return BX.create("A", {
				attrs: {
					href: "#",
					className: "crm-entity-stream-content-event-title"
				},
				events: {
					"click": this._headerClickHandler
				},
				text: this.getTypeDescription()
			});
		}
		prepareTimeLayout() {
			return BX.create("SPAN", {
				attrs: {
					className: "crm-entity-stream-content-event-time"
				},
				text: this.formatTime(this.getCreatedTime())
			});
		}
		prepareMarkLayout() {
			const entityData = this.getAssociatedEntityData();
			const markTypeId = BX.prop.getInteger(entityData, "MARK_TYPE_ID", 0);
			if (markTypeId <= 0) {
				return null;
			}
			let messageName = "";
			if (markTypeId === Mark$1.success) {
				messageName = "SuccessMark";
			} else if (markTypeId === Mark$1.renew) {
				messageName = "RenewMark";
			}
			if (messageName === "") {
				return null;
			}
			let markText = "";
			const typeCategoryId = this.getTypeCategoryId();
			if (typeCategoryId === BX.CrmActivityType.email) {
				markText = this.getMessage("email" + messageName);
			} else if (typeCategoryId === BX.CrmActivityType.call) {
				markText = this.getMessage("call" + messageName);
			} else if (typeCategoryId === BX.CrmActivityType.meeting) {
				markText = this.getMessage("meeting" + messageName);
			} else if (typeCategoryId === BX.CrmActivityType.task) {
				markText = this.getMessage("task" + messageName);
			}
			if (markText === "") {
				return null;
			}
			return BX.create("SPAN", {
				props: {
					className: "crm-entity-stream-content-event-skipped"
				},
				text: markText
			});
		}
		prepareActions() {
			if (this.isReadOnly()) {
				return;
			}
			const typeCategoryId = this.getTypeCategoryId();
			if (typeCategoryId === BX.CrmActivityType.email) {
				this._actions.push(HistoryEmail.create("email", {
					item: this,
					container: this._actionContainer,
					entityData: this.getAssociatedEntityData(),
					activityEditor: this._activityEditor
				}));
			}
		}
		prepareContextMenuItems() {
			if (this._isMenuShown) {
				return;
			}
			const menuItems = [];
			if (!this.isReadOnly()) {
				if (this.isEditable()) {
					menuItems.push({
						id: "edit",
						text: this.getMessage("menuEdit"),
						onclick: BX.delegate(this.edit, this)
					});
				}
				menuItems.push({
					id: "remove",
					text: this.getMessage("menuDelete"),
					onclick: BX.delegate(this.processRemoval, this)
				});
				if (this.isFixed() || this._fixedHistory.findItemById(this._id)) menuItems.push({
					id: "unfasten",
					text: this.getMessage("menuUnfasten"),
					onclick: BX.delegate(this.unfasten, this)
				});else menuItems.push({
					id: "fasten",
					text: this.getMessage("menuFasten"),
					onclick: BX.delegate(this.fasten, this)
				});
			}
			return menuItems;
		}
		view() {
			this.closeContextMenu();
			const entityData = this.getAssociatedEntityData();
			const id = BX.prop.getInteger(entityData, "ID", 0);
			if (id > 0) {
				this._activityEditor.viewActivity(id);
			}
		}
		edit() {
			this.closeContextMenu();
			const associatedEntityTypeId = this.getAssociatedEntityTypeId();
			if (associatedEntityTypeId === BX.CrmEntityType.enumeration.activity) {
				const entityData = this.getAssociatedEntityData();
				const id = BX.prop.getInteger(entityData, "ID", 0);
				if (id > 0) {
					this._activityEditor.editActivity(id);
				}
			}
		}
		processRemoval() {
			this.closeContextMenu();
			this._detetionConfirmDlgId = "entity_timeline_deletion_" + this.getId() + "_confirm";
			let dlg = BX.Crm.ConfirmationDialog.get(this._detetionConfirmDlgId);
			if (!dlg) {
				dlg = BX.Crm.ConfirmationDialog.create(this._detetionConfirmDlgId, {
					title: this.getMessage("removeConfirmTitle"),
					content: this.getRemoveMessage(),
					background: 'vibrant'
				});
			}
			dlg.open().then(BX.delegate(this.onRemovalConfirm, this), BX.delegate(this.onRemovalCancel, this));
		}
		getRemoveMessage() {
			return this.getMessage('removeConfirm');
		}
		onRemovalConfirm(result) {
			if (BX.prop.getBoolean(result, "cancel", true)) {
				return;
			}
			this.remove();
		}
		onRemovalCancel() {}
		remove() {
			const associatedEntityTypeId = this.getAssociatedEntityTypeId();
			if (associatedEntityTypeId === BX.CrmEntityType.enumeration.activity) {
				const entityData = this.getAssociatedEntityData();
				const id = BX.prop.getInteger(entityData, "ID", 0);
				if (id > 0) {
					const activityEditor = this._activityEditor;
					const item = activityEditor.getItemById(id);
					if (item) {
						activityEditor.deleteActivity(id, true);
					} else {
						const serviceUrl = BX.util.add_url_param(activityEditor.getSetting('serviceUrl', ''), {
							id: id,
							action: 'get_activity',
							ownertype: activityEditor.getSetting('ownerType', ''),
							ownerid: activityEditor.getSetting('ownerID', '')
						});
						BX.ajax({
							'url': serviceUrl,
							'method': 'POST',
							'dataType': 'json',
							'data': {
								'ACTION': 'GET_ACTIVITY',
								'ID': id,
								'OWNER_TYPE': activityEditor.getSetting('ownerType', ''),
								'OWNER_ID': activityEditor.getSetting('ownerID', '')
							},
							onsuccess: BX.delegate(function (data) {
								if (typeof data['ACTIVITY'] !== 'undefined') {
									activityEditor._handleActivityChange(data['ACTIVITY']);
									window.setTimeout(BX.delegate(this.remove, this), 500);
								}
							}, this),
							onfailure: function (data) {}
						});
					}
				}
			}
		}
		static create(id, settings) {
			const self = new HistoryActivity();
			self.initialize(id, settings);
			return self;
		}
		static messages = {};
	}

	/** @memberof BX.Crm.Timeline.Items */
	let Email$1 = class Email extends HistoryActivity {
		constructor() {
			super();
		}
		prepareHeaderLayout() {
			const header = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-header"
				}
			});
			header.appendChild(this.prepareTitleLayout());
			const entityData = this.getAssociatedEntityData();
			const emailInfo = BX.prop.getObject(entityData, "EMAIL_INFO", null);
			const statusText = emailInfo !== null ? BX.prop.getString(emailInfo, "STATUS_TEXT", "") : "";
			const error = emailInfo !== null ? BX.prop.getBoolean(emailInfo, "STATUS_ERROR", false) : false;
			const className = !error ? "crm-entity-stream-content-event-skipped" : "crm-entity-stream-content-event-missing";
			if (statusText !== "") {
				header.appendChild(BX.create("SPAN", {
					props: {
						className: className
					},
					text: statusText
				}));
			}
			const markNode = this.prepareMarkLayout();
			if (markNode) {
				header.appendChild(markNode);
			}
			header.appendChild(this.prepareTimeLayout());
			return header;
		}
		prepareContextMenuItems() {
			const menuItems = [];
			if (!this.isReadOnly()) {
				menuItems.push({
					id: "view",
					text: this.getMessage("menuView"),
					onclick: BX.delegate(this.view, this)
				});
				menuItems.push({
					id: "remove",
					text: this.getMessage("menuDelete"),
					onclick: BX.delegate(this.processRemoval, this)
				});
				if (this.isFixed() || this._fixedHistory.findItemById(this._id)) menuItems.push({
					id: "unfasten",
					text: this.getMessage("menuUnfasten"),
					onclick: BX.delegate(this.unfasten, this)
				});else menuItems.push({
					id: "fasten",
					text: this.getMessage("menuFasten"),
					onclick: BX.delegate(this.fasten, this)
				});
			}
			return menuItems;
		}
		reply() {}
		replyAll() {}
		forward() {}
		getRemoveMessage() {
			const title = BX.util.htmlspecialchars(this.getTitle());
			return this.getMessage('emailRemove').replace("#TITLE#", title);
		}
		prepareContent() {
			const entityData = this.getAssociatedEntityData();
			let description = BX.prop.getString(entityData, "DESCRIPTION_RAW", "");
			if (description !== "") {
				//trim leading spaces
				description = description.replace(/^\s+/, '');
			}
			const communication = BX.prop.getObject(entityData, "COMMUNICATION", {});
			const communicationTitle = BX.prop.getString(communication, "TITLE", "");
			const communicationShowUrl = BX.prop.getString(communication, "SHOW_URL", "");
			const communicationValue = BX.prop.getString(communication, "VALUE", "");
			const outerWrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section crm-entity-stream-section-history crm-entity-stream-section-email"
				}
			});
			outerWrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section-icon crm-entity-stream-section-icon-email"
				}
			}));
			if (this.isFixed()) BX.addClass(outerWrapper, 'crm-entity-stream-section-top-fixed');
			const wrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-event"
				}
			});
			outerWrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section-content"
				},
				children: [wrapper]
			}));

			//Header
			const header = this.prepareHeaderLayout();
			wrapper.appendChild(header);

			//region Context Menu
			if (this.isContextMenuEnabled()) {
				wrapper.appendChild(this.prepareContextMenuButton());
			}
			//endregion

			//Details
			const detailWrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail-email"
				}
			});
			wrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail"
				},
				children: [detailWrapper]
			}));

			//TODO: Add status text
			/*
			detailWrapper.appendChild(
				BX.create("DIV", { attrs: { className: "crm-entity-stream-content-detail-email-read-status" } })
			);
			*/

			detailWrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail-email-title"
				},
				children: [BX.create("A", {
					attrs: {
						href: "#"
					},
					events: {
						"click": this._headerClickHandler
					},
					text: this.getTitle()
				})]
			}));
			const communicationWrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail-email-to"
				}
			});
			detailWrapper.appendChild(communicationWrapper);

			//Communications
			if (communicationTitle !== "") {
				if (communicationShowUrl !== "") {
					communicationWrapper.appendChild(BX.create("A", {
						attrs: {
							href: communicationShowUrl
						},
						text: communicationTitle
					}));
				} else {
					communicationWrapper.appendChild(BX.create("SPAN", {
						text: communicationTitle
					}));
				}
			}
			if (communicationValue !== "") {
				if (communicationTitle !== "") {
					communicationWrapper.appendChild(BX.create("SPAN", {
						text: " "
					}));
				}
				communicationWrapper.appendChild(BX.create("SPAN", {
					attrs: {
						className: "crm-entity-stream-content-detail-email-address"
					},
					text: communicationValue
				}));
			}

			//Content
			detailWrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail-email-fragment"
				},
				children: this.prepareCutOffElements(description, 128, this._headerClickHandler)
			}));

			//region Author
			const authorNode = this.prepareAuthorLayout();
			if (authorNode) {
				wrapper.appendChild(authorNode);
			}
			//endregion

			//region  Actions
			this._actionContainer = BX.create("SPAN", {
				attrs: {
					className: "crm-entity-stream-content-detail-action"
				}
			});
			wrapper.appendChild(this._actionContainer);
			//endregion

			if (!this.isReadOnly()) wrapper.appendChild(this.prepareFixedSwitcherLayout());
			return outerWrapper;
		}
		prepareActions() {
			if (this.isReadOnly()) {
				return;
			}
			this._actions.push(HistoryEmail.create("email", {
				item: this,
				container: this._actionContainer,
				entityData: this.getAssociatedEntityData(),
				activityEditor: this._activityEditor
			}));
		}
		showActions(show) {
			if (this._actionContainer) {
				this._actionContainer.style.display = show ? "" : "none";
			}
		}
		static create(id, settings) {
			const self = new Email();
			self.initialize(id, settings);
			return self;
		}
	};

	/** @memberof BX.Crm.Timeline.Actions */
	let Call$2 = class Call extends Activity$1 {
		constructor() {
			super();
			this._clickHandler = BX.delegate(this.onClick, this);
			this._menu = null;
			this._isMenuShown = false;
			this._menuItems = null;
		}
		getButton() {
			return null;
		}
		onClick(e) {
			if (typeof window.top['BXIM'] === 'undefined') {
				// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-dialogs
				crm_timeline_dialog.alert({
					content: main_core.Tag.render`<div>${this.getMessage("telephonyNotSupported")}</div>`
				});
				return;
			}
			let phone = "";
			const itemData = this.getItemData();
			const phones = BX.prop.getArray(itemData, "PHONE", []);
			if (phones.length === 1) {
				this.addCall(phones[0]['VALUE']);
			} else if (phones.length > 1) {
				this.showMenu();
			} else {
				const communication = BX.prop.getObject(this._entityData, "COMMUNICATION", null);
				if (communication) {
					if (BX.prop.getString(communication, "TYPE") === "PHONE") {
						phone = BX.prop.getString(communication, "VALUE");
						if (phone) {
							this.addCall(phone);
						}
					}
				}
			}
			return BX.PreventDefault(e);
		}
		showMenu() {
			if (this._isMenuShown) {
				return;
			}
			this.prepareMenuItems();
			if (!this._menuItems || this._menuItems.length === 0) {
				return;
			}
			this._menu = new BX.PopupMenuWindow(this._id, this._container, this._menuItems, {
				offsetTop: 0,
				offsetLeft: 16,
				events: {
					onPopupShow: BX.delegate(this.onMenuShow, this),
					onPopupClose: BX.delegate(this.onMenuClose, this),
					onPopupDestroy: BX.delegate(this.onMenuDestroy, this)
				}
			});
			this._menu.popupWindow.show();
		}
		closeMenu() {
			if (!this._isMenuShown) {
				return;
			}
			if (this._menu) {
				this._menu.close();
			}
		}
		prepareMenuItems() {
			if (this._menuItems) {
				return;
			}
			const itemData = this.getItemData();
			const phones = BX.prop.getArray(itemData, "PHONE", []);
			const handler = BX.delegate(this.onMenuItemClick, this);
			this._menuItems = [];
			if (phones.length === 0) {
				return;
			}
			let i = 0;
			const l = phones.length;
			for (; i < l; i++) {
				const value = BX.prop.getString(phones[i], "VALUE");
				const formattedValue = BX.prop.getString(phones[i], "VALUE_FORMATTED");
				const complexName = BX.prop.getString(phones[i], "COMPLEX_NAME");
				const itemText = (complexName ? complexName + ': ' : '') + (formattedValue ? formattedValue : value);
				if (value !== "") {
					this._menuItems.push({
						id: value,
						text: itemText,
						onclick: handler
					});
				}
			}
		}
		onMenuItemClick(e, item) {
			this.closeMenu();
			this.addCall(item.id);
		}
		onMenuShow() {
			this._isMenuShown = true;
		}
		onMenuClose() {
			this._isMenuShown = false;
			this._menu.popupWindow.destroy();
		}
		onMenuDestroy() {
			this._menu = null;
		}
		addCall(phone) {
			const communication = BX.prop.getObject(this._entityData, "COMMUNICATION", null);
			let entityTypeId = parseInt(BX.prop.getString(communication, "ENTITY_TYPE_ID", "0"));
			if (isNaN(entityTypeId)) {
				entityTypeId = 0;
			}
			let entityId = parseInt(BX.prop.getString(communication, "ENTITY_ID", "0"));
			if (isNaN(entityId)) {
				entityId = 0;
			}
			let ownerTypeId = 0;
			let ownerId = 0;
			const ownerInfo = BX.prop.getObject(this._settings, "ownerInfo");
			if (ownerInfo) {
				ownerTypeId = BX.prop.getInteger(ownerInfo, "ENTITY_TYPE_ID", 0);
				ownerId = BX.prop.getInteger(ownerInfo, "ENTITY_ID", 0);
			}
			if (ownerTypeId <= 0 || ownerId <= 0) {
				ownerTypeId = BX.prop.getInteger(this._entityData, "OWNER_TYPE_ID", 0);
				ownerId = BX.prop.getInteger(this._entityData, "OWNER_ID", "0");
			}
			if (ownerTypeId <= 0 || ownerId <= 0) {
				ownerTypeId = entityTypeId;
				ownerId = entityId;
			}
			let activityId = parseInt(BX.prop.getString(this._entityData, "ID", "0"));
			if (isNaN(activityId)) {
				activityId = 0;
			}
			const params = {
				"ENTITY_TYPE_NAME": BX.CrmEntityType.resolveName(entityTypeId),
				"ENTITY_ID": entityId,
				"AUTO_FOLD": true
			};
			if (ownerTypeId !== entityTypeId || ownerId !== entityId) {
				params["BINDINGS"] = [{
					"OWNER_TYPE_NAME": BX.CrmEntityType.resolveName(ownerTypeId),
					"OWNER_ID": ownerId
				}];
			}
			if (activityId > 0) {
				params["SRC_ACTIVITY_ID"] = activityId;
			}
			window.top['BXIM'].phoneTo(phone, params);
		}
		getMessage(name) {
			const m = Call.messages;
			return m.hasOwnProperty(name) ? m[name] : name;
		}
		static messages = {};
	};

	/** @memberof BX.Crm.Timeline.Actions */
	class HistoryCall extends Call$2 {
		constructor() {
			super();
			this._button = null;
		}
		getButton() {
			return this._button;
		}
		doLayout() {
			this._button = BX.create("A", {
				attrs: {
					className: "crm-entity-stream-content-action-reply-btn"
				},
				events: {
					"click": this._clickHandler
				}
			});
			this._container.appendChild(this._button);
		}
		static create(id, settings) {
			const self = new HistoryCall();
			self.initialize(id, settings);
			return self;
		}
	}
	class ScheduleCall extends Call$2 {
		constructor() {
			super();
		}
		doLayout() {
			this._container.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-action-reply-btn"
				},
				events: {
					"click": this._clickHandler
				}
			}));
		}
		static create(id, settings) {
			const self = new ScheduleCall();
			self.initialize(id, settings);
			return self;
		}
	}

	/** @memberof BX.Crm.Timeline.Items */
	let Call$1 = class Call extends HistoryActivity {
		constructor() {
			super();
			this._playerDummyClickHandler = BX.delegate(this.onPlayerDummyClick, this);
			this._playerWrapper = null;
			this._transcriptWrapper = null;
			this._mediaFileInfo = null;
		}
		getTypeDescription() {
			const entityData = this.getAssociatedEntityData();
			const callInfo = BX.prop.getObject(entityData, "CALL_INFO", null);
			const callTypeText = callInfo !== null ? BX.prop.getString(callInfo, "CALL_TYPE_TEXT", "") : "";
			if (callTypeText !== "") {
				return callTypeText;
			}
			const direction = BX.prop.getInteger(entityData, "DIRECTION", 0);
			return this.getMessage(direction === BX.CrmActivityDirection.incoming ? "incomingCall" : "outgoingCall");
		}
		prepareHeaderLayout() {
			const header = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-header"
				}
			});
			header.appendChild(this.prepareTitleLayout());

			//Position is important
			const entityData = this.getAssociatedEntityData();
			const callInfo = BX.prop.getObject(entityData, "CALL_INFO", null);
			const hasCallInfo = callInfo !== null;
			const isSuccessfull = hasCallInfo ? BX.prop.getBoolean(callInfo, "SUCCESSFUL", false) : false;
			const statusText = hasCallInfo ? BX.prop.getString(callInfo, "STATUS_TEXT", "") : "";
			if (hasCallInfo && statusText.length) {
				header.appendChild(BX.create("DIV", {
					attrs: {
						className: isSuccessfull ? "crm-entity-stream-content-event-successful" : "crm-entity-stream-content-event-missing"
					},
					text: statusText
				}));
			}
			header.appendChild(BX.create("SPAN", {
				attrs: {
					className: "crm-entity-stream-content-event-time"
				},
				text: this.formatTime(this.getCreatedTime())
			}));
			return header;
		}
		prepareContent() {
			const entityData = this.getAssociatedEntityData();
			let description = BX.prop.getString(entityData, "DESCRIPTION_RAW", "");
			if (description !== "") {
				//trim leading spaces
				description = description.replace(/^\s+/, '');
			}
			const communication = BX.prop.getObject(entityData, "COMMUNICATION", {});
			const communicationTitle = BX.prop.getString(communication, "TITLE", "");
			const communicationShowUrl = BX.prop.getString(communication, "SHOW_URL", "");
			const communicationValue = BX.prop.getString(communication, "VALUE", "");
			const communicationValueFormatted = BX.prop.getString(communication, "FORMATTED_VALUE", communicationValue);
			const callInfo = BX.prop.getObject(entityData, "CALL_INFO", null);
			const hasCallInfo = callInfo !== null;
			const durationText = hasCallInfo ? BX.prop.getString(callInfo, "DURATION_TEXT", "") : "";
			const hasTranscript = hasCallInfo ? BX.prop.getBoolean(callInfo, "HAS_TRANSCRIPT", "") : "";
			const isTranscriptPending = hasCallInfo ? BX.prop.getBoolean(callInfo, "TRANSCRIPT_PENDING", "") : "";
			const callId = hasCallInfo ? BX.prop.getString(callInfo, "CALL_ID", "") : "";
			const callComment = hasCallInfo ? BX.prop.getString(callInfo, "COMMENT", "") : "";
			const outerWrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section crm-entity-stream-section-history crm-entity-stream-section-call"
				}
			});
			outerWrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section-icon crm-entity-stream-section-icon-call"
				}
			}));
			if (this.isFixed()) BX.addClass(outerWrapper, 'crm-entity-stream-section-top-fixed');
			const wrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-event"
				}
			});
			outerWrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section-content"
				},
				children: [wrapper]
			}));

			//Header
			const header = this.prepareHeaderLayout();
			wrapper.appendChild(header);

			//region Context Menu
			if (this.isContextMenuEnabled()) {
				wrapper.appendChild(this.prepareContextMenuButton());
			}
			//endregion

			//Details
			const detailWrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail"
				}
			});
			wrapper.appendChild(detailWrapper);
			detailWrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail-title"
				},
				children: [BX.create("A", {
					attrs: {
						href: "#"
					},
					events: {
						"click": this._headerClickHandler
					},
					text: this.getTitle()
				})]
			}));

			//Content
			detailWrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail-description"
				},
				children: this.prepareMultilineCutOffElements(description, 128, this._headerClickHandler)
			}));
			if (hasCallInfo) {
				const callInfoWrapper = BX.create("DIV", {
					attrs: {
						className: "crm-entity-stream-content-detail-call crm-entity-stream-content-detail-call-inline"
					}
				});
				detailWrapper.appendChild(callInfoWrapper);
				this._mediaFileInfo = BX.prop.getObject(entityData, "MEDIA_FILE_INFO", null);
				if (this._mediaFileInfo !== null) {
					this._playerWrapper = this._history.getManager().renderAudioDummy(durationText, this._playerDummyClickHandler);
					callInfoWrapper.appendChild(this._playerWrapper);
					callInfoWrapper.appendChild(this._history.getManager().getAudioPlaybackRateSelector().render());
				}
				if (hasTranscript) {
					this._transcriptWrapper = BX.create("DIV", {
						attrs: {
							className: "crm-audio-transcript-wrap-container"
						},
						events: {
							click: function (e) {
								if (BX.Voximplant && BX.Voximplant.Transcript) {
									BX.Voximplant.Transcript.create({
										callId: callId
									}).show();
								}
							}
						},
						children: [BX.create("DIV", {
							attrs: {
								className: "crm-audio-transcript-icon"
							}
						}), BX.create("DIV", {
							attrs: {
								className: "crm-audio-transcript-conversation"
							},
							text: BX.message("CRM_TIMELINE_CALL_TRANSCRIPT")
						})]
					});
					callInfoWrapper.appendChild(this._transcriptWrapper);
				} else if (isTranscriptPending) {
					this._transcriptWrapper = BX.create("DIV", {
						attrs: {
							className: "crm-audio-transcript-wrap-container-pending"
						},
						children: [BX.create("DIV", {
							attrs: {
								className: "crm-audio-transcript-icon-pending"
							},
							html: '<svg class="crm-transcript-loader-circular" viewBox="25 25 50 50"><circle class="crm-transcript-loader-path" cx="50" cy="50" r="20" fill="none" stroke-miterlimit="10"></circle></svg>'
						}), BX.create("DIV", {
							attrs: {
								className: "crm-audio-transcript-conversation"
							},
							text: BX.message("CRM_TIMELINE_CALL_TRANSCRIPT_PENDING")
						})]
					});
					callInfoWrapper.appendChild(this._transcriptWrapper);
				}
				if (callComment) {
					detailWrapper.appendChild(BX.create("DIV", {
						attrs: {
							className: "crm-entity-stream-content-detail-description"
						},
						text: callComment
					}));
				}
			}
			const communicationWrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail-contact-info"
				}
			});
			detailWrapper.appendChild(communicationWrapper);

			//Communications
			if (communicationTitle !== "") {
				if (communicationShowUrl !== "") {
					communicationWrapper.appendChild(BX.create("A", {
						attrs: {
							href: communicationShowUrl
						},
						text: communicationTitle
					}));
				} else {
					communicationWrapper.appendChild(BX.create("SPAN", {
						text: communicationTitle
					}));
				}
			}
			if (communicationValueFormatted !== "") {
				if (communicationTitle !== "") {
					communicationWrapper.appendChild(BX.create("SPAN", {
						text: " "
					}));
				}
				communicationWrapper.appendChild(BX.create("SPAN", {
					attrs: {
						className: "crm-entity-stream-content-detail-email-address"
					},
					text: communicationValueFormatted
				}));
			}

			//region Author
			const authorNode = this.prepareAuthorLayout();
			if (authorNode) {
				wrapper.appendChild(authorNode);
			}
			//endregion

			//region  Actions
			this._actionContainer = BX.create("SPAN", {
				attrs: {
					className: "crm-entity-stream-content-detail-action"
				}
			});
			wrapper.appendChild(this._actionContainer);
			//endregion

			if (!this.isReadOnly()) {
				wrapper.appendChild(this.prepareFixedSwitcherLayout());
			}
			return outerWrapper;
		}
		prepareActions() {
			if (this.isReadOnly()) {
				return;
			}
			this._actions.push(HistoryCall.create("call", {
				item: this,
				container: this._actionContainer,
				entityData: this.getAssociatedEntityData(),
				activityEditor: this._activityEditor,
				ownerInfo: this._history.getOwnerInfo()
			}));
		}
		getRemoveMessage() {
			const entityData = this.getAssociatedEntityData();
			const direction = BX.prop.getInteger(entityData, "DIRECTION", 0);
			const messageName = direction === BX.CrmActivityDirection.incoming ? 'incomingCallRemove' : 'outgoingCallRemove';
			const title = BX.util.htmlspecialchars(this.getTitle());
			return this.getMessage(messageName).replace("#TITLE#", title);
		}
		onPlayerDummyClick(e) {
			const stubNode = this._playerWrapper.querySelector(".crm-audio-cap-wrap");
			if (stubNode) {
				BX.addClass(stubNode, "crm-audio-cap-wrap-loader");
			}
			this._history.getManager().getAudioPlaybackRateSelector().addPlayer(this._history.getManager().loadMediaPlayer("history_" + this.getId(), this._mediaFileInfo["URL"], this._mediaFileInfo["TYPE"], this._playerWrapper, this._mediaFileInfo["DURATION"], {
				playbackRate: this._history.getManager().getAudioPlaybackRateSelector().getRate()
			}));
		}
		static create(id, settings) {
			const self = new Call();
			self.initialize(id, settings);
			return self;
		}
	};

	/** @memberof BX.Crm.Timeline.Items */
	let Meeting$1 = class Meeting extends HistoryActivity {
		constructor() {
			super();
		}
		prepareHeaderLayout() {
			const header = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-header"
				}
			});
			header.appendChild(this.prepareTitleLayout());
			const markNode = this.prepareMarkLayout();
			if (markNode) {
				header.appendChild(markNode);
			}
			header.appendChild(this.prepareTimeLayout());
			return header;
		}
		prepareContent() {
			const entityData = this.getAssociatedEntityData();
			let description = BX.prop.getString(entityData, "DESCRIPTION_RAW", "");
			if (description !== "") {
				//trim leading spaces
				description = description.replace(/^\s+/, '');
			}
			const communication = BX.prop.getObject(entityData, "COMMUNICATION", {});
			const communicationTitle = BX.prop.getString(communication, "TITLE", "");
			const communicationShowUrl = BX.prop.getString(communication, "SHOW_URL", "");
			const communicationValue = BX.prop.getString(communication, "VALUE", "");
			const wrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section crm-entity-stream-section-history crm-entity-stream-section-meeting"
				}
			});
			wrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section-icon crm-entity-stream-section-icon-meeting"
				}
			}));
			if (this.isContextMenuEnabled()) {
				wrapper.appendChild(this.prepareContextMenuButton());
			}
			if (this.isFixed()) BX.addClass(wrapper, 'crm-entity-stream-section-top-fixed');
			const contentWrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-event"
				}
			});
			wrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section-content"
				},
				children: [contentWrapper]
			}));
			const header = this.prepareHeaderLayout();
			contentWrapper.appendChild(header);
			const detailWrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail"
				}
			});
			contentWrapper.appendChild(detailWrapper);
			detailWrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail-title"
				},
				children: [BX.create("A", {
					attrs: {
						href: "#"
					},
					events: {
						"click": this._headerClickHandler
					},
					text: this.getTitle()
				})]
			}));

			//Content
			detailWrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail-description"
				},
				children: this.prepareCutOffElements(description, 128, this._headerClickHandler)
			}));
			const communicationWrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail-contact-info"
				}
			});
			detailWrapper.appendChild(communicationWrapper);
			if (communicationTitle !== '') {
				communicationWrapper.appendChild(BX.create("SPAN", {
					text: this.getMessage("reciprocal") + ": "
				}));
				if (communicationShowUrl !== '') {
					communicationWrapper.appendChild(BX.create("A", {
						attrs: {
							href: communicationShowUrl
						},
						text: communicationTitle
					}));
				} else {
					communicationWrapper.appendChild(BX.create("SPAN", {
						text: communicationTitle
					}));
				}
			}
			communicationWrapper.appendChild(BX.create("SPAN", {
				text: " " + communicationValue
			}));

			//region Author
			const authorNode = this.prepareAuthorLayout();
			if (authorNode) {
				contentWrapper.appendChild(authorNode);
			}
			//endregion

			//region  Actions
			this._actionContainer = BX.create("SPAN", {
				attrs: {
					className: "crm-entity-stream-content-detail-action"
				}
			});
			contentWrapper.appendChild(this._actionContainer);
			//endregion

			if (!this.isReadOnly()) contentWrapper.appendChild(this.prepareFixedSwitcherLayout());
			return wrapper;
		}
		getRemoveMessage() {
			const title = BX.util.htmlspecialchars(this.getTitle());
			return this.getMessage('meetingRemove').replace("#TITLE#", title);
		}
		prepareActions() {}
		showActions(show) {
			if (this._actionContainer) {
				this._actionContainer.style.display = show ? "" : "none";
			}
		}
		static create(id, settings) {
			const self = new Meeting();
			self.initialize(id, settings);
			return self;
		}
	};

	/** @memberof BX.Crm.Timeline.Items */
	let Task$1 = class Task extends HistoryActivity {
		constructor() {
			super();
		}
		prepareHeaderLayout() {
			const header = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-header"
				}
			});
			header.appendChild(this.prepareTitleLayout());
			const markNode = this.prepareMarkLayout();
			if (markNode) {
				header.appendChild(markNode);
			}
			header.appendChild(this.prepareTimeLayout());
			return header;
		}
		prepareContent() {
			const entityData = this.getAssociatedEntityData();
			let description = BX.prop.getString(entityData, "DESCRIPTION_RAW", "");
			if (description !== "") {
				//trim leading spaces
				description = description.replace(/^\s+/, '');
			}
			const communication = BX.prop.getObject(entityData, "COMMUNICATION", {});
			const communicationTitle = BX.prop.getString(communication, "TITLE", "");
			const communicationShowUrl = BX.prop.getString(communication, "SHOW_URL", "");
			const wrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section crm-entity-stream-section-history crm-entity-stream-section-task"
				}
			});
			wrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section-icon crm-entity-stream-section-icon-task"
				}
			}));
			if (this.isContextMenuEnabled()) {
				wrapper.appendChild(this.prepareContextMenuButton());
			}
			if (this.isFixed()) BX.addClass(wrapper, 'crm-entity-stream-section-top-fixed');
			const contentWrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-event"
				}
			});
			wrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section-content"
				},
				children: [contentWrapper]
			}));
			const header = this.prepareHeaderLayout();
			contentWrapper.appendChild(header);
			const detailWrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail"
				}
			});
			contentWrapper.appendChild(detailWrapper);
			detailWrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail-title"
				},
				children: [BX.create("A", {
					attrs: {
						href: "#"
					},
					events: {
						"click": this._headerClickHandler
					},
					text: this.getTitle()
				})]
			}));

			//Content
			detailWrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail-description"
				},
				children: this.prepareCutOffElements(description, 128, this._headerClickHandler)
			}));
			const communicationWrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail-contact-info"
				}
			});
			detailWrapper.appendChild(communicationWrapper);
			if (communicationTitle !== '') {
				communicationWrapper.appendChild(BX.create("SPAN", {
					text: this.getMessage("reciprocal") + ": "
				}));
				if (communicationShowUrl !== '') {
					communicationWrapper.appendChild(BX.create("A", {
						attrs: {
							href: communicationShowUrl
						},
						text: communicationTitle
					}));
				} else {
					communicationWrapper.appendChild(BX.create("SPAN", {
						text: communicationTitle
					}));
				}
			}

			//region Author
			const authorNode = this.prepareAuthorLayout();
			if (authorNode) {
				contentWrapper.appendChild(authorNode);
			}
			//endregion

			//region  Actions
			this._actionContainer = BX.create("SPAN", {
				attrs: {
					className: "crm-entity-stream-content-detail-action"
				}
			});
			contentWrapper.appendChild(this._actionContainer);
			//endregion

			if (!this.isReadOnly()) contentWrapper.appendChild(this.prepareFixedSwitcherLayout());
			return wrapper;
		}
		prepareActions() {}
		getRemoveMessage() {
			const title = BX.util.htmlspecialchars(this.getTitle());
			return this.getMessage('taskRemove').replace("#TITLE#", title);
		}
		showActions(show) {
			if (this._actionContainer) {
				this._actionContainer.style.display = show ? "" : "none";
			}
		}
		static create(id, settings) {
			const self = new Task();
			self.initialize(id, settings);
			return self;
		}
	};

	/** @memberof BX.Crm.Timeline.Items */
	let WebForm$1 = class WebForm extends HistoryActivity {
		constructor() {
			super();
		}
		prepareHeaderLayout() {
			const header = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-header"
				}
			});
			header.appendChild(this.prepareTitleLayout());
			header.appendChild(this.prepareTimeLayout());
			return header;
		}
		prepareContent() {
			const wrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section crm-entity-stream-section-history crm-entity-stream-section-crmForm"
				}
			});
			wrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section-icon crm-entity-stream-section-icon-crmForm"
				}
			}));
			const contentWrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-event"
				}
			});
			wrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section-content"
				},
				children: [contentWrapper]
			}));
			if (this.isFixed()) BX.addClass(wrapper, 'crm-entity-stream-section-top-fixed');
			const header = this.prepareHeaderLayout();
			contentWrapper.appendChild(header);
			const detailWrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail"
				}
			});
			contentWrapper.appendChild(detailWrapper);
			detailWrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail-title"
				},
				children: [BX.create("A", {
					attrs: {
						href: "#"
					},
					events: {
						"click": this._headerClickHandler
					},
					text: this.getTitle()
				})]
			}));

			//region Author
			const authorNode = this.prepareAuthorLayout();
			if (authorNode) {
				contentWrapper.appendChild(authorNode);
			}
			//endregion

			//region  Actions
			this._actionContainer = BX.create("SPAN", {
				attrs: {
					className: "crm-entity-stream-content-detail-action"
				}
			});
			contentWrapper.appendChild(this._actionContainer);
			//endregion

			if (!this.isReadOnly()) contentWrapper.appendChild(this.prepareFixedSwitcherLayout());
			return wrapper;
		}
		prepareActions() {}
		showActions(show) {
			if (this._actionContainer) {
				this._actionContainer.style.display = show ? "" : "none";
			}
		}
		static create(id, settings) {
			const self = new WebForm();
			self.initialize(id, settings);
			return self;
		}
	};

	/** @memberof BX.Crm.Timeline.Items */
	let Request$1 = class Request extends HistoryActivity {
		constructor() {
			super();
		}
		prepareHeaderLayout() {
			const header = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-header"
				}
			});
			header.appendChild(this.prepareTitleLayout());
			header.appendChild(this.prepareTimeLayout());
			return header;
		}
		prepareContent() {
			const entityData = this.getAssociatedEntityData();
			let description = BX.prop.getString(entityData, "DESCRIPTION_RAW", "");
			if (description !== "") {
				//trim leading spaces
				description = description.replace(/^\s+/, '');
			}

			//var entityData = this.getAssociatedEntityData();
			const wrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section crm-entity-stream-section-today crm-entity-stream-section-robot"
				}
			});
			wrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section-icon crm-entity-stream-section-icon-robot"
				}
			}));
			if (this.isContextMenuEnabled()) {
				wrapper.appendChild(this.prepareContextMenuButton());
			}
			if (this.isFixed()) BX.addClass(wrapper, 'crm-entity-stream-section-top-fixed');
			const contentWrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-event"
				}
			});
			wrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section-content"
				},
				children: [contentWrapper]
			}));
			const header = this.prepareHeaderLayout();
			contentWrapper.appendChild(header);
			const detailWrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail"
				}
			});
			contentWrapper.appendChild(detailWrapper);
			detailWrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail-title"
				},
				children: [BX.create("A", {
					attrs: {
						href: "#"
					},
					events: {
						"click": this._headerClickHandler
					},
					text: this.getTitle()
				})]
			}));

			//Content
			detailWrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail-description"
				},
				children: this.prepareCutOffElements(description, 128, this._headerClickHandler)
			}));

			//region Author
			const authorNode = this.prepareAuthorLayout();
			if (authorNode) {
				contentWrapper.appendChild(authorNode);
			}
			//endregion

			//region  Actions
			this._actionContainer = BX.create("SPAN", {
				attrs: {
					className: "crm-entity-stream-content-detail-action"
				}
			});
			contentWrapper.appendChild(this._actionContainer);
			//endregion

			if (!this.isReadOnly()) contentWrapper.appendChild(this.prepareFixedSwitcherLayout());
			return wrapper;
		}
		prepareActions() {}
		showActions(show) {
			if (this._actionContainer) {
				this._actionContainer.style.display = show ? "" : "none";
			}
		}
		isEditable() {
			return false;
		}
		static create(id, settings) {
			const self = new Request();
			self.initialize(id, settings);
			return self;
		}
	};

	/** @memberof BX.Crm.Timeline.Actions */
	let OpenLine$2 = class OpenLine extends Activity$1 {
		constructor() {
			super();
			this._clickHandler = BX.delegate(this.onClick, this);
			this._button = null;
		}
		getButton() {
			return this._button;
		}
		onClick() {
			if (typeof window.top['BXIM'] === 'undefined') {
				// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-dialogs
				crm_timeline_dialog.alert({
					content: main_core.Tag.render`<div>${this.getMessage("openLineNotSupported")}</div>`
				});
				return;
			}
			let slug = "";
			const communication = BX.prop.getObject(this._entityData, "COMMUNICATION", null);
			if (communication) {
				if (BX.prop.getString(communication, "TYPE") === "IM") {
					slug = BX.prop.getString(communication, "VALUE");
				}
			}
			if (slug !== "") {
				window.top['BXIM'].openMessengerSlider(slug, {
					RECENT: 'N',
					MENU: 'N'
				});
			}
		}
		doLayout() {
			this._button = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-action-reply-btn"
				},
				events: {
					"click": this._clickHandler
				}
			});
			this._container.appendChild(this._button);
		}
		getMessage(name) {
			const m = OpenLine.messages;
			return m.hasOwnProperty(name) ? m[name] : name;
		}
		static create(id, settings) {
			const self = new OpenLine();
			self.initialize(id, settings);
			return self;
		}
		static messages = {};
	};

	/** @memberof BX.Crm.Timeline.Items */
	let OpenLine$1 = class OpenLine extends HistoryActivity {
		constructor() {
			super();
		}
		prepareHeaderLayout() {
			const header = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-header"
				}
			});
			header.appendChild(this.prepareTitleLayout());
			header.appendChild(this.prepareTimeLayout());
			return header;
		}
		prepareContent() {
			const entityData = this.getAssociatedEntityData();
			let description = BX.prop.getString(entityData, "DESCRIPTION_RAW", "");
			if (description !== "") {
				//trim leading spaces
				description = description.replace(/^\s+/, '');
			}
			const communication = BX.prop.getObject(entityData, "COMMUNICATION", {});
			const communicationTitle = BX.prop.getString(communication, "TITLE", "");
			const communicationShowUrl = BX.prop.getString(communication, "SHOW_URL", "");
			const wrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section crm-entity-stream-section-history crm-entity-stream-section-IM"
				}
			});
			wrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section-icon crm-entity-stream-section-icon-IM"
				}
			}));
			if (this.isContextMenuEnabled()) {
				wrapper.appendChild(this.prepareContextMenuButton());
			}
			if (this.isFixed()) BX.addClass(wrapper, 'crm-entity-stream-section-top-fixed');
			const contentWrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-event"
				}
			});
			wrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section-content"
				},
				children: [contentWrapper]
			}));
			const header = this.prepareHeaderLayout();
			contentWrapper.appendChild(header);
			const detailWrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail"
				}
			});
			contentWrapper.appendChild(detailWrapper);
			detailWrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail-title"
				},
				children: [BX.create("A", {
					attrs: {
						href: "#"
					},
					events: {
						"click": this._headerClickHandler
					},
					text: this.getTitle()
				})]
			}));

			//Content
			const entityDetailWrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail-IM"
				}
			});
			detailWrapper.appendChild(entityDetailWrapper);
			const messageWrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail-IM-messages"
				}
			});
			entityDetailWrapper.appendChild(messageWrapper);
			const openLineData = BX.prop.getObject(this.getAssociatedEntityData(), "OPENLINE_INFO", null);
			if (openLineData) {
				const messages = BX.prop.getArray(openLineData, "MESSAGES", []);
				let i = 0;
				const length = messages.length;
				for (; i < length; i++) {
					const message = messages[i];
					const isExternal = BX.prop.getBoolean(message, "IS_EXTERNAL", true);
					messageWrapper.appendChild(BX.create("DIV", {
						attrs: {
							className: isExternal ? "crm-entity-stream-content-detail-IM-message-incoming" : "crm-entity-stream-content-detail-IM-message-outgoing"
						},
						html: BX.prop.getString(message, "MESSAGE", "")
					}));
				}
			}
			const communicationWrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail-contact-info"
				}
			});
			detailWrapper.appendChild(communicationWrapper);
			if (communicationTitle !== '') {
				communicationWrapper.appendChild(BX.create("SPAN", {
					text: this.getMessage("reciprocal") + ": "
				}));
				if (communicationShowUrl !== '') {
					communicationWrapper.appendChild(BX.create("A", {
						attrs: {
							href: communicationShowUrl
						},
						text: communicationTitle
					}));
				} else {
					communicationWrapper.appendChild(BX.create("SPAN", {
						text: communicationTitle
					}));
				}
			}

			//region Author
			const authorNode = this.prepareAuthorLayout();
			if (authorNode) {
				contentWrapper.appendChild(authorNode);
			}
			//endregion

			//region  Actions
			this._actionContainer = BX.create("SPAN", {
				attrs: {
					className: "crm-entity-stream-content-detail-action"
				}
			});
			contentWrapper.appendChild(this._actionContainer);
			//endregion

			if (!this.isReadOnly()) contentWrapper.appendChild(this.prepareFixedSwitcherLayout());
			return wrapper;
		}
		prepareActions() {
			if (this.isReadOnly()) {
				return;
			}
			this._actions.push(OpenLine$2.create("openline", {
				item: this,
				container: this._actionContainer,
				entityData: this.getAssociatedEntityData(),
				activityEditor: this._activityEditor,
				ownerInfo: this._history.getOwnerInfo()
			}));
		}
		view() {
			if (typeof window.top['BXIM'] === 'undefined') {
				// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-dialogs
				crm_timeline_dialog.alert({
					content: main_core.Tag.render`<div>${this.getMessage("openLineNotSupported")}</div>`
				});
				return;
			}
			let slug = "";
			const communication = BX.prop.getObject(this.getAssociatedEntityData(), "COMMUNICATION", null);
			if (communication) {
				if (BX.prop.getString(communication, "TYPE") === "IM") {
					slug = BX.prop.getString(communication, "VALUE");
				}
			}
			if (slug !== "") {
				window.top['BXIM'].openMessengerSlider(slug, {
					RECENT: 'N',
					MENU: 'N'
				});
			}
		}
		static create(id, settings) {
			const self = new OpenLine();
			self.initialize(id, settings);
			return self;
		}
	};

	/** @memberof BX.Crm.Timeline.Items */
	let Rest$1 = class Rest extends HistoryActivity {
		constructor() {
			super();
		}
		prepareHeaderLayout() {
			const header = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-header"
				}
			});
			header.appendChild(this.prepareTitleLayout());
			header.appendChild(this.prepareTimeLayout());
			return header;
		}
		getTypeDescription() {
			const entityData = this.getAssociatedEntityData();
			if (entityData['APP_TYPE'] && entityData['APP_TYPE']['NAME']) {
				return entityData['APP_TYPE']['NAME'];
			}
			return super.getTypeDescription();
		}
		prepareContent() {
			const entityData = this.getAssociatedEntityData();
			let description = BX.prop.getString(entityData, "DESCRIPTION_RAW", "");
			if (description !== "") {
				//trim leading spaces
				description = description.replace(/^\s+/, '');
			}

			//var entityData = this.getAssociatedEntityData();
			const wrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section crm-entity-stream-section-today crm-entity-stream-section-rest"
				}
			});
			const iconNode = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section-icon crm-entity-stream-section-icon-rest"
				}
			});
			wrapper.appendChild(iconNode);
			if (entityData['APP_TYPE'] && entityData['APP_TYPE']['ICON_SRC']) {
				if (iconNode) {
					iconNode.style.backgroundImage = "url('" + entityData['APP_TYPE']['ICON_SRC'] + "')";
					iconNode.style.backgroundPosition = "center center";
					iconNode.style.backgroundSize = "cover";
					iconNode.style.backgroundColor = "transparent";
				}
			}
			if (this.isFixed()) BX.addClass(wrapper, 'crm-entity-stream-section-top-fixed');
			const contentWrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-event"
				}
			});
			wrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section-content"
				},
				children: [contentWrapper]
			}));
			const header = this.prepareHeaderLayout();
			contentWrapper.appendChild(header);
			const detailWrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail"
				}
			});
			contentWrapper.appendChild(detailWrapper);
			detailWrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail-title"
				},
				children: [BX.create("A", {
					attrs: {
						href: "#"
					},
					events: {
						"click": this._headerClickHandler
					},
					text: this.getTitle()
				})]
			}));

			//Content
			detailWrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail-description"
				},
				children: this.prepareCutOffElements(description, 128, this._headerClickHandler)
			}));

			//region Author
			const authorNode = this.prepareAuthorLayout();
			if (authorNode) {
				contentWrapper.appendChild(authorNode);
			}
			//endregion

			//region  Actions
			this._actionContainer = BX.create("SPAN", {
				attrs: {
					className: "crm-entity-stream-content-detail-action"
				}
			});
			contentWrapper.appendChild(this._actionContainer);
			//endregion

			if (!this.isReadOnly()) contentWrapper.appendChild(this.prepareFixedSwitcherLayout());
			return wrapper;
		}
		prepareActions() {}
		showActions(show) {
			if (this._actionContainer) {
				this._actionContainer.style.display = show ? "" : "none";
			}
		}
		static create(id, settings) {
			const self = new Rest();
			self.initialize(id, settings);
			return self;
		}
	};

	/** @memberof BX.Crm.Timeline.Actions */
	class Visit extends HistoryActivity {
		constructor() {
			super();
			this._playerDummyClickHandler = BX.delegate(this.onPlayerDummyClick, this);
			this._playerWrapper = null;
			this._transcriptWrapper = null;
			this._mediaFileInfo = null;
		}
		prepareHeaderLayout() {
			const header = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-header"
				}
			});
			header.appendChild(this.prepareTitleLayout());
			const entityData = this.getAssociatedEntityData();
			const visitInfo = BX.prop.getObject(entityData, "VISIT_INFO", {});
			const recordLength = BX.prop.getInteger(visitInfo, "RECORD_LENGTH", 0);
			const recordLengthFormatted = BX.prop.getString(visitInfo, "RECORD_LENGTH_FORMATTED_FULL", "");
			header.appendChild(BX.create("SPAN", {
				attrs: {
					className: "crm-entity-stream-content-event-time"
				},
				text: (recordLength > 0 ? recordLengthFormatted + ', ' + BX.message('CRM_TIMELINE_VISIT_AT') + ' ' : '') + this.formatTime(this.getCreatedTime())
			}));
			return header;
		}
		prepareContent() {
			const entityData = this.getAssociatedEntityData();
			const communication = BX.prop.getObject(entityData, "COMMUNICATION", {});
			const communicationTitle = BX.prop.getString(communication, "TITLE", "");
			const communicationShowUrl = BX.prop.getString(communication, "SHOW_URL", "");
			const visitInfo = BX.prop.getObject(entityData, "VISIT_INFO", {});
			const recordLength = BX.prop.getInteger(visitInfo, "RECORD_LENGTH", 0);
			const recordLengthFormatted = BX.prop.getString(visitInfo, "RECORD_LENGTH_FORMATTED_SHORT", "");
			const vkProfile = BX.prop.getString(visitInfo, "VK_PROFILE", "");
			const outerWrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section crm-entity-stream-section-history crm-entity-stream-section-visit"
				}
			});
			outerWrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section-icon crm-entity-stream-section-icon-visit"
				}
			}));
			const wrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-event"
				}
			});
			outerWrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section-content"
				},
				children: [wrapper]
			}));

			//Header
			const header = this.prepareHeaderLayout();
			wrapper.appendChild(header);

			//region Context Menu
			if (this.isContextMenuEnabled()) {
				wrapper.appendChild(this.prepareContextMenuButton());
			}
			//endregion

			//Details
			const detailWrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail crm-entity-stream-content-detail-call-inline"
				}
			});
			wrapper.appendChild(detailWrapper);
			this._mediaFileInfo = BX.prop.getObject(entityData, "MEDIA_FILE_INFO", null);
			if (this._mediaFileInfo !== null && recordLength > 0) {
				this._playerWrapper = this._history.getManager().renderAudioDummy(recordLengthFormatted, this._playerDummyClickHandler);
				detailWrapper.appendChild(
				//crm-entity-stream-content-detail-call
				this._playerWrapper);
				detailWrapper.appendChild(this._history.getManager().getAudioPlaybackRateSelector().render());
			}
			const communicationWrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail-contact-info"
				}
			});
			wrapper.appendChild(communicationWrapper);

			//Communications
			if (communicationTitle !== "") {
				communicationWrapper.appendChild(document.createTextNode(BX.message("CRM_TIMELINE_VISIT_WITH") + ' '));
				if (communicationShowUrl !== "") {
					communicationWrapper.appendChild(BX.create("A", {
						attrs: {
							href: communicationShowUrl
						},
						text: communicationTitle
					}));
				} else {
					communicationWrapper.appendChild(BX.create("SPAN", {
						text: communicationTitle
					}));
				}
			}
			if (BX.type.isNotEmptyString(vkProfile)) {
				communicationWrapper.appendChild(document.createTextNode(" "));
				communicationWrapper.appendChild(BX.create("a", {
					attrs: {
						className: "crm-entity-stream-content-detail-additional",
						target: "_blank",
						href: this.getVkProfileUrl(vkProfile)
					},
					text: BX.message('CRM_TIMELINE_VISIT_VKONTAKTE_PROFILE')
				}));
			}

			//region Author
			const authorNode = this.prepareAuthorLayout();
			if (authorNode) {
				wrapper.appendChild(authorNode);
			}
			//endregion

			return outerWrapper;
		}
		onPlayerDummyClick(e) {
			const stubNode = this._playerWrapper.querySelector(".crm-audio-cap-wrap");
			if (stubNode) {
				BX.addClass(stubNode, "crm-audio-cap-wrap-loader");
			}
			this._history.getManager().getAudioPlaybackRateSelector().addPlayer(this._history.getManager().loadMediaPlayer("history_" + this.getId(), this._mediaFileInfo["URL"], this._mediaFileInfo["TYPE"], this._playerWrapper, this._mediaFileInfo["DURATION"], {
				playbackRate: this._history.getManager().getAudioPlaybackRateSelector().getRate()
			}));
		}
		getVkProfileUrl(profile) {
			return 'https://vk.ru/' + BX.util.htmlspecialchars(profile);
		}
		view() {
			if (BX.getClass('BX.Crm.Restriction.Bitrix24') && BX.Crm.Restriction.Bitrix24.isRestricted('visit')) {
				return BX.Crm.Restriction.Bitrix24.getHandler('visit').call();
			}
			super.view();
		}
		edit() {
			if (BX.getClass('BX.Crm.Restriction.Bitrix24') && BX.Crm.Restriction.Bitrix24.isRestricted('visit')) {
				return BX.Crm.Restriction.Bitrix24.getHandler('visit').call();
			}
			super.edit();
		}
		static create(id, settings) {
			const self = new Visit();
			self.initialize(id, settings);
			return self;
		}
	}

	/** @memberof BX.Crm.Timeline.Actions */
	let Zoom$1 = class Zoom extends HistoryActivity {
		constructor() {
			super();
			this._videoDummy = null;
			this._audioDummy = null;
			this._videoPlayer = null;
			this._audioPlayer = null;
			this._audioLengthElement = null;
			this._recordings = [];
			this._currentRecordingIndex = 0;
			this.zoomActivitySubject = null;
			this._downloadWrapper = null;
			this._downloadSubject = null;
			this._downloadSubjectDetail = null;
			this._downloadVideoLink = null;
			this._downloadSeparator = null;
			this._downloadAudioLink = null;
			this._playVideoLink = null;
			this.detailZoomCopyVideoLink = null;
		}
		prepareHeaderLayout() {
			const header = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-header"
				}
			});
			header.appendChild(this.prepareTitleLayout());
			if (!this._data.hasOwnProperty('PROVIDER_DATA') || this._data["PROVIDER_DATA"]["ZOOM_EVENT_TYPE"] !== 'ZOOM_CONF_JOINED') {
				header.appendChild(this.prepareSuccessfulLayout());
			}
			header.appendChild(this.prepareTimeLayout());
			return header;
		}
		prepareSuccessfulLayout() {
			return BX.create("SPAN", {
				attrs: {
					className: "crm-entity-stream-content-event-successful"
				},
				text: BX.message('CRM_TIMELINE_ZOOM_SUCCESSFUL_ACTIVITY')
			});
		}
		prepareTitleLayout() {
			if (this._data.hasOwnProperty('PROVIDER_DATA') && this._data["PROVIDER_DATA"]["ZOOM_EVENT_TYPE"] === 'ZOOM_CONF_JOINED') {
				return BX.create("SPAN", {
					attrs: {
						className: "crm-entity-stream-content-event-title"
					},
					text: BX.message('CRM_TIMELINE_ZOOM_JOINED_CONFERENCE')
				});
			} else {
				return BX.create("SPAN", {
					attrs: {
						className: "crm-entity-stream-content-event-title"
					},
					text: BX.message('CRM_TIMELINE_ZOOM_CONFERENCE_END')
				});
			}
		}
		prepareContent() {
			const wrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section crm-entity-stream-section-history"
				}
			});
			let entityDetailWrapper;
			const zoomData = BX.prop.getObject(this.getAssociatedEntityData(), "ZOOM_INFO", null);
			const subject = BX.prop.getString(this.getAssociatedEntityData(), "SUBJECT", null);
			this._recordings = BX.prop.getArray(zoomData, "RECORDINGS", []);
			wrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section-icon crm-entity-stream-section-icon-zoom"
				}
			}));
			if (this.isFixed()) BX.addClass(wrapper, 'crm-entity-stream-section-top-fixed');
			const contentWrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-event"
				}
			});
			wrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section-content"
				},
				children: [contentWrapper]
			}));
			const header = this.prepareHeaderLayout();
			contentWrapper.appendChild(header);
			const detailWrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail"
				}
			});
			contentWrapper.appendChild(detailWrapper);
			if (this._data.hasOwnProperty('PROVIDER_DATA') && this._data["PROVIDER_DATA"]["ZOOM_EVENT_TYPE"] === 'ZOOM_CONF_JOINED') {
				entityDetailWrapper = BX.create("DIV", {
					attrs: {
						className: "crm-entity-stream-content-detail-description"
					},
					text: zoomData['CONF_URL']
				});
			} else {
				entityDetailWrapper = BX.create("DIV", {
					attrs: {
						className: "crm-entity-stream-content-detail-description"
					}
				});
				if (this._recordings.length > 0) {
					if (this._recordings.length > 1) {
						//render video parts header

						const tabs = this._recordings.map(function (recording, index) {
							return {
								id: index,
								title: BX.message("CRM_TIMELINE_ZOOM_MEETING_RECORD_PART").replace("#NUMBER#", index + 1),
								time: recording["AUDIO"] ? recording["AUDIO"]["LENGTH_FORMATTED"] : "",
								active: index === 0
							};
						});
						const tabsComponent = new Zoom.TabsComponent({
							tabs: tabs
						});
						tabsComponent.eventEmitter.subscribe("onTabChange", this._onTabChange.bind(this));
						detailWrapper.appendChild(tabsComponent.render());
					}
					this._videoDummy = BX.create("DIV", {
						props: {
							className: "crm-entity-stream-content-detail-zoom-video-wrap"
						},
						children: [BX.create("DIV", {
							props: {
								className: "crm-entity-stream-content-detail-zoom-video"
							},
							events: {
								click: this._onVideoDummyClick.bind(this)
							},
							children: [BX.create("DIV", {
								props: {
									className: "crm-entity-stream-content-detail-zoom-video-inner"
								},
								children: [BX.create("DIV", {
									props: {
										className: "crm-entity-stream-content-detail-zoom-video-btn"
									},
									dataset: {
										hint: BX.message("CRM_TIMELINE_ZOOM_LOGIN_REQUIRED"),
										'hintNoIcon': 'Y'
									}
								}), BX.create("SPAN", {
									props: {
										className: "crm-entity-stream-content-detail-zoom-video-text"
									},
									text: BX.message("CRM_TIMELINE_ZOOM_CLICK_TO_WATCH")
								})]
							})]
						})]
					});
					BX.UI.Hint.init(this._videoDummy);
					this._audioDummy = this._history.getManager().renderAudioDummy("00:15", this._onAudioDummyClick.bind(this));
					this._audioLengthElement = this._audioDummy.querySelector('.crm-audio-cap-time');
					if (zoomData['RECORDINGS'][0]['VIDEO']) {
						//video download link with token valid for 24h
						const videoLinkExpireTS = zoomData['RECORDINGS'][0]['VIDEO']['END_DATE_TS'] * 1000 + 60 * 60 * 23 * 1000;
						if (videoLinkExpireTS < Date.now()) {
							const videoLinkContainer = BX.create("DIV", {
								props: {
									className: "crm-entity-stream-content-detail-zoom-desc"
								}
							});
							this._playVideoLink = BX.create("DIV", {
								html: BX.message("CRM_TIMELINE_ZOOM_PLAY_LINK_VIDEO")
							});
							this._detailZoomCopyVideoLink = BX.create("A", {
								attrs: {
									className: 'ui-link ui-link-dashed'
								},
								text: BX.message("CRM_TIMELINE_ZOOM_COPY_PASSWORD")
							});
							videoLinkContainer.appendChild(this._playVideoLink);
							videoLinkContainer.appendChild(this._detailZoomCopyVideoLink);
							entityDetailWrapper.appendChild(videoLinkContainer);
						} else {
							entityDetailWrapper.appendChild(this._videoDummy);
						}
					}
					if (zoomData['RECORDINGS'][0]['AUDIO']) {
						const zoomAudioDetailWrapper = BX.create("DIV", {
							attrs: {
								className: "crm-entity-stream-content-detail-call crm-entity-stream-content-detail-call-inline"
							}
						});
						zoomAudioDetailWrapper.appendChild(this._audioDummy);
						zoomAudioDetailWrapper.appendChild(this._history.getManager().getAudioPlaybackRateSelector().render());
						entityDetailWrapper.appendChild(zoomAudioDetailWrapper);
					}
					this._downloadWrapper = BX.create("DIV", {
						props: {
							className: "crm-entity-stream-content-detail-zoom-desc"
						}
					});
					entityDetailWrapper.appendChild(this._downloadWrapper);
					this._downloadSubject = BX.create("SPAN", {
						props: {
							className: "crm-entity-stream-content-detail-zoom-desc-subject"
						}
					});
					this._downloadSubjectDetail = BX.create("SPAN", {
						props: {
							className: "crm-entity-stream-content-detail-zoom-desc-detail"
						}
					});
					this._downloadVideoLink = BX.create("A", {
						props: {
							className: "crm-entity-stream-content-detail-zoom-desc-link"
						},
						text: BX.message("CRM_TIMELINE_ZOOM_DOWNLOAD_VIDEO")
					});
					this._downloadSeparator = BX.create("SPAN", {
						props: {
							className: "crm-entity-stream-content-detail-zoom-desc-separate"
						},
						html: "&mdash;"
					});
					this._downloadAudioLink = BX.create("A", {
						props: {
							className: "crm-entity-stream-content-detail-zoom-desc-link"
						},
						text: BX.message("CRM_TIMELINE_ZOOM_DOWNLOAD_AUDIO")
					});
					this.setCurrentRecording(0);
				} else {
					this.zoomActivitySubject = BX.create("DIV", {
						attrs: {
							className: "crm-entity-stream-content-detail-title"
						},
						children: [BX.create("A", {
							attrs: {
								href: "#"
							},
							events: {
								"click": this._headerClickHandler
							},
							text: subject
						})]
					});
					entityDetailWrapper.appendChild(this.zoomActivitySubject);
					if (zoomData['HAS_RECORDING'] === 'Y') {
						entityDetailWrapper.appendChild(BX.create("DIV", {
							props: {
								className: "crm-entity-stream-content-detail-zoom-video"
							},
							children: [BX.create("DIV", {
								props: {
									className: "crm-entity-stream-content-detail-zoom-video-inner"
								},
								children: [BX.create("DIV", {
									props: {
										className: "crm-entity-stream-content-detail-zoom-video-img"
									}
								}), BX.create("SPAN", {
									props: {
										className: "crm-entity-stream-content-detail-zoom-video-text"
									},
									text: BX.message("CRM_TIMELINE_ZOOM_MEETING_RECORD_IN_PROCESS")
								})]
							})]
						}));
					}
				}
			}
			/*else
			{
				detailWrapper.appendChild(BX.create("span", {text: "456"}));
					var entityDetailWrapper = BX.create("DIV",
					{
						attrs: { className: "crm-entity-stream-content-detail-description" },
						text: BX.prop.getString(zoomData, "CONF_URL", "")
					}
				);
			}*/
			//Content //todo

			if (entityDetailWrapper) {
				detailWrapper.appendChild(entityDetailWrapper);
			}

			//region Author
			const authorNode = this.prepareAuthorLayout();
			if (authorNode) {
				contentWrapper.appendChild(authorNode);
			}
			//endregion

			return wrapper;
		}
		_onVideoDummyClick() {
			BX.UI.Hint.hide();
			const recording = this._recordings[this._currentRecordingIndex]["VIDEO"];
			if (!recording) {
				return;
			}
			this._videoPlayer = this._history.getManager().loadMediaPlayer("zoom_video_" + this.getId(), recording["DOWNLOAD_URL"], "video/mp4", this._videoDummy, recording["LENGTH"], {
				video: true,
				skin: "",
				width: 480,
				height: 270
			});
		}
		_onAudioDummyClick() {
			const recording = this._recordings[this._currentRecordingIndex]["AUDIO"];
			if (!recording) {
				return;
			}
			this._history.getManager().getAudioPlaybackRateSelector().addPlayer(this._audioPlayer = this._history.getManager().loadMediaPlayer("zoom_audio_" + this.getId(), recording["DOWNLOAD_URL"], "audio/mp4", this._audioDummy, recording["LENGTH"], {
				playbackRate: this._history.getManager().getAudioPlaybackRateSelector().getRate()
			}));
		}
		_onTabChange(event) {
			this.setCurrentRecording(event.data.tabId);
		}
		setCurrentRecording(recordingIndex) {
			this._currentRecordingIndex = recordingIndex;
			const videoRecording = this._recordings[this._currentRecordingIndex]["VIDEO"];
			const audioRecording = this._recordings[this._currentRecordingIndex]["AUDIO"];
			if (videoRecording) {
				this._videoDummy.hidden = false;
				if (this._videoPlayer) {
					this._videoPlayer.pause();
					this._videoPlayer.setSource(videoRecording["DOWNLOAD_URL"]);
					this._downloadVideoLink.href = videoRecording["DOWNLOAD_URL"];
				}
			} else {
				this._videoDummy.hidden = true;
			}
			if (audioRecording) {
				this._audioDummy.hidden = false;
				if (this._audioPlayer) {
					this._audioPlayer.pause();
					this._audioPlayer.setSource(audioRecording["DOWNLOAD_URL"]);
				}
				this._downloadAudioLink.href = audioRecording["DOWNLOAD_URL"];
				this._audioLengthElement.innerText = audioRecording["LENGTH_FORMATTED"];
			} else {
				this._audioDummy.hidden = true;
			}
			BX.clean(this._downloadWrapper);
			if (audioRecording || videoRecording) {
				const lengthHuman = audioRecording ? audioRecording["LENGTH_HUMAN"] : videoRecording["LENGTH_HUMAN"];
				this._downloadWrapper.appendChild(this._downloadSubject);
				this._downloadSubject.innerHTML = BX.util.htmlspecialchars(BX.message("CRM_TIMELINE_ZOOM_MEETING_RECORD").replace("#DURATION#", lengthHuman)) + " &mdash; ";
				this._downloadWrapper.appendChild(this._downloadSubjectDetail);
			}
			if (videoRecording) {
				this._downloadSubjectDetail.appendChild(this._downloadVideoLink);
				this._downloadVideoLink.href = videoRecording['DOWNLOAD_URL'];
				if (audioRecording) {
					this._downloadSubjectDetail.appendChild(this._downloadSeparator);
				}
				if (this._playVideoLink) {
					this._playVideoLink.lastElementChild.href = videoRecording["PLAY_URL"];
					this._downloadVideoLink.href = videoRecording["PLAY_URL"];
				}
				if (this._detailZoomCopyVideoLink) {
					BX.clipboard.bindCopyClick(this._detailZoomCopyVideoLink, {
						text: videoRecording['PASSWORD']
					});
				}
			}
			if (audioRecording) {
				this._downloadSubjectDetail.appendChild(this._downloadAudioLink);
				this._downloadAudioLink.href = audioRecording['DOWNLOAD_URL'];
			}
		}
		prepareActions() {}
		static create(id, settings) {
			const self = new Zoom();
			self.initialize(id, settings);

			//todo: remove debug
			if (!window['zoom']) {
				window['zoom'] = [];
			}
			window['zoom'].push(self);
			return self;
		}
	};
	Zoom$1.TabsComponent = class {
		constructor(config) {
			this.tabs = BX.prop.getArray(config, "tabs", []);
			this.elements = {
				container: null,
				tabs: {}
			};
			this.eventEmitter = new BX.Event.EventEmitter(this, 'Zoom.TabsComponent');
		}
		render() {
			if (this.elements.container) {
				return this.elements.container;
			}
			this.elements.container = BX.create("DIV", {
				props: {
					className: "crm-entity-stream-content-detail-zoom-section-wrapper"
				},
				children: [BX.create("DIV", {
					props: {
						className: "crm-entity-stream-content-detail-zoom-section-list"
					},
					children: this.tabs.map(this._renderTab, this)
				})]
			});
			return this.elements.container;
		}
		_renderTab(tabDescription) {
			const tabId = tabDescription.id;
			this.elements.tabs[tabId] = BX.create("DIV", {
				props: {
					className: "crm-entity-stream-content-detail-zoom-section" + (tabDescription.active ? " crm-entity-stream-content-detail-zoom-section-active" : "")
				},
				children: [BX.create("DIV", {
					props: {
						className: "crm-entity-stream-content-detail-zoom-section-inner"
					},
					children: [BX.create("DIV", {
						props: {
							className: "crm-entity-stream-content-detail-zoom-section-title"
						},
						text: tabDescription.title
					}), BX.create("DIV", {
						props: {
							className: "crm-entity-stream-content-detail-zoom-section-time"
						},
						text: tabDescription.time
					})]
				})],
				events: {
					click: function () {
						this.setActiveTab(tabDescription.id);
					}.bind(this)
				}
			});
			return this.elements.tabs[tabId];
		}
		setActiveTab(tabId) {
			if (!this.elements.tabs[tabId]) {
				throw new Error("Tab " + tabId + " is not found");
			}
			for (let id in this.elements.tabs) {
				if (!this.elements.tabs.hasOwnProperty(id)) {
					continue;
				}
				id = Number.parseInt(id, 10);
				if (id === tabId) {
					this.elements.tabs[id].classList.add("crm-entity-stream-content-detail-zoom-section-active");
				} else {
					this.elements.tabs[id].classList.remove("crm-entity-stream-content-detail-zoom-section-active");
				}
			}
			this.eventEmitter.emit("onTabChange", {
				tabId: tabId
			});
		}
	};

	/** @memberof BX.Crm.Timeline.Actions */
	class OrderModification extends History$1 {
		constructor() {
			super();
		}
		getMessage(name) {
			const m = OrderModification.messages;
			return m.hasOwnProperty(name) ? m[name] : name;
		}
		getTitle() {
			return this.getTextDataParam("TITLE");
		}
		getStatusInfo() {
			const statusInfo = {};
			let value = null;
			let classCode = null;
			const fieldName = this.getTextDataParam("CHANGED_ENTITY");
			const fields = this.getObjectDataParam('FIELDS');
			const entityData = this.getAssociatedEntityData();
			if (fieldName === BX.CrmEntityType.names.order) {
				if (BX.prop.get(fields, 'ORDER_CANCELED') === 'Y') {
					value = "canceled";
					classCode = "not-paid";
				} else if (BX.prop.get(fields, 'ORDER_DONE') === 'Y') {
					value = "done";
					classCode = "done";
				} else if (BX.prop.getString(entityData, "VIEWED", '') === 'Y') {
					value = "viewed";
					classCode = "done";
				} else if (BX.prop.getString(entityData, "SENT", '') === 'Y') {
					value = "sent";
					classCode = "sent";
				}
			}
			if (fieldName === BX.CrmEntityType.names.orderpayment) {
				const psStatusCode = BX.prop.get(fields, 'STATUS_CODE', false);
				if (psStatusCode) {
					if (psStatusCode === 'ERROR') {
						value = "orderPaymentError";
						classCode = "payment-error";
					}
				} else if (BX.prop.getString(entityData, "VIEWED", '') === 'Y') {
					value = "viewed";
					classCode = "done";
				} else if (BX.prop.getString(entityData, "SENT", '') === 'Y') {
					value = "sent";
					classCode = "sent";
				} else {
					value = BX.prop.get(fields, 'ORDER_PAID') === 'Y' ? "paid" : "unpaid";
					classCode = BX.prop.get(fields, 'ORDER_PAID') === 'Y' ? "paid" : "not-paid";
				}
			} else if (fieldName === BX.CrmEntityType.names.ordershipment && BX.prop.get(fields, 'ORDER_DEDUCTED', false)) {
				value = BX.prop.get(fields, 'ORDER_DEDUCTED') === 'Y' ? "deducted" : "unshipped";
				classCode = BX.prop.get(fields, 'ORDER_DEDUCTED') === 'Y' ? "shipped" : "not-shipped";
			} else if (fieldName === BX.CrmEntityType.names.ordershipment && BX.prop.get(fields, 'ORDER_ALLOW_DELIVERY', false)) {
				value = BX.prop.get(fields, 'ORDER_ALLOW_DELIVERY') === 'Y' ? "allowedDelivery" : "disallowedDelivery";
				classCode = BX.prop.get(fields, 'ORDER_ALLOW_DELIVERY') === 'Y' ? "allowed-delivery" : "disallowed-delivery";
			}
			if (value) {
				statusInfo.className = "crm-entity-stream-content-event-" + classCode;
				statusInfo.message = this.getMessage(value);
			}
			return statusInfo;
		}
		getHeaderChildren() {
			const children = [BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-event-title"
				},
				events: {
					click: this._headerClickHandler
				},
				text: this.getTitle()
			})];
			const statusInfo = this.getStatusInfo();
			if (BX.type.isNotEmptyObject(statusInfo)) {
				children.push(BX.create("SPAN", {
					attrs: {
						className: statusInfo.className
					},
					text: statusInfo.message
				}));
			}
			children.push(BX.create("SPAN", {
				attrs: {
					className: "crm-entity-stream-content-event-time"
				},
				text: this.formatTime(this.getCreatedTime())
			}));
			return children;
		}
		prepareContentDetails() {
			const entityData = this.getAssociatedEntityData();
			const entityTypeId = this.getAssociatedEntityTypeId();
			const entityId = this.getAssociatedEntityId();
			const title = BX.prop.getString(entityData, "TITLE");
			const htmlTitle = BX.prop.getString(entityData, "HTML_TITLE", "");
			const showUrl = BX.prop.getString(entityData, "SHOW_URL", "");
			const nodes = [];
			if (title !== "") {
				const descriptionNode = BX.create("DIV", {
					attrs: {
						className: "crm-entity-stream-content-detail-description"
					}
				});
				if (showUrl === "" || entityTypeId === this.getOwnerTypeId() && entityId === this.getOwnerId()) {
					descriptionNode.appendChild(BX.create("SPAN", {
						text: title + " " + htmlTitle
					}));
				} else {
					if (htmlTitle === "") {
						descriptionNode.appendChild(BX.create("A", {
							attrs: {
								href: showUrl
							},
							text: title
						}));
					} else {
						descriptionNode.appendChild(BX.create("SPAN", {
							text: title + " "
						}));
						descriptionNode.appendChild(BX.create("A", {
							attrs: {
								href: showUrl
							},
							text: htmlTitle
						}));
					}
				}
				const legend = BX.prop.getString(entityData, "LEGEND");
				if (legend !== "") {
					descriptionNode.appendChild(BX.create("SPAN", {
						html: " " + legend
					}));
				}
				const sublegend = BX.prop.getString(entityData, "SUBLEGEND", '');
				if (sublegend !== '') {
					descriptionNode.appendChild(BX.create("BR"));
					descriptionNode.appendChild(BX.create("SPAN", {
						text: " " + sublegend
					}));
				}
				nodes.push(descriptionNode);
			}
			return nodes;
		}
		prepareViewedContentDetails() {
			const entityData = this.getAssociatedEntityData();
			const entityTypeId = this.getAssociatedEntityTypeId();
			const entityId = this.getAssociatedEntityId();
			const title = BX.prop.getString(entityData, "TITLE");
			const showUrl = BX.prop.getString(entityData, "SHOW_URL", "");
			const nodes = [];
			if (title !== "") {
				const sublegend = BX.prop.getString(entityData, "SUBLEGEND", '');
				if (sublegend !== "") {
					const descriptionNode = BX.create("DIV", {
						attrs: {
							className: "crm-entity-stream-content-detail-description"
						},
						text: sublegend
					});
					nodes.push(descriptionNode);
				}
				if (entityTypeId === this.getOwnerTypeId() && entityId === this.getOwnerId()) {
					nodes.push(BX.create("SPAN", {
						text: title
					}));
				} else {
					nodes.push(BX.create("A", {
						attrs: {
							href: showUrl
						},
						text: title
					}));
				}
				const legend = BX.prop.getString(entityData, "LEGEND");
				if (legend !== "") {
					nodes.push(BX.create("SPAN", {
						html: " " + legend
					}));
				}
			}
			return nodes;
		}
		prepareSentContentDetails() {
			const entityData = this.getAssociatedEntityData();
			const entityTypeId = this.getAssociatedEntityTypeId();
			const entityId = this.getAssociatedEntityId();
			const title = BX.prop.getString(entityData, "TITLE");
			const showUrl = BX.prop.getString(entityData, 'SHOW_URL', '');
			const destination = BX.prop.getString(entityData, 'DESTINATION_TITLE', '');
			const nodes = [];
			if (title !== "") {
				const detailNode = BX.create('DIV', {
					attrs: {
						className: 'crm-entity-stream-content-detail-description'
					}
				});
				if (showUrl === "" || entityTypeId === this.getOwnerTypeId() && entityId === this.getOwnerId()) {
					detailNode.appendChild(BX.create("SPAN", {
						text: title
					}));
				} else {
					detailNode.appendChild(BX.create('A', {
						attrs: {
							href: showUrl
						},
						text: title
					}));
				}
				const legend = BX.prop.getString(entityData, "LEGEND");
				if (legend !== "") {
					detailNode.appendChild(BX.create("SPAN", {
						html: " " + legend
					}));
				}
				if (destination) {
					detailNode.appendChild(BX.create('SPAN', {
						attrs: {
							className: 'crm-entity-stream-content-detail-order-destination'
						},
						text: destination
					}));
				}
				nodes.push(detailNode);
				const sliderLinkNode = BX.create('A', {
					attrs: {
						href: "#"
					},
					text: this.getMessage('orderPaymentProcess'),
					events: {
						click: BX.proxy(this.startSalescenterApplication, this)
					}
				});
				nodes.push(sliderLinkNode);
			}
			return nodes;
		}
		startSalescenterApplication() {
			BX.loadExt('salescenter.manager').then(function () {
				const fields = this.getObjectDataParam('FIELDS'),
					ownerTypeId = BX.prop.get(fields, 'OWNER_TYPE_ID', BX.CrmEntityType.enumeration.deal);
				let ownerId = BX.prop.get(fields, 'OWNER_ID', 0);
				const paymentId = BX.prop.get(fields, 'PAYMENT_ID', 0),
					shipmentId = BX.prop.get(fields, 'SHIPMENT_ID', 0),
					orderId = BX.prop.get(fields, 'ORDER_ID', 0);

				// compatibility
				if (!ownerId) {
					ownerId = BX.prop.get(fields, 'DEAL_ID', 0);
				}
				BX.Salescenter.Manager.openApplication({
					disableSendButton: '',
					context: 'deal',
					ownerTypeId: ownerTypeId,
					ownerId: ownerId,
					mode: ownerTypeId === BX.CrmEntityType.enumeration.deal ? 'payment_delivery' : 'payment',
					templateMode: 'view',
					orderId: orderId,
					paymentId: paymentId,
					shipmentId: shipmentId
				});
			}.bind(this));
		}
		preparePaidPaymentContentDetails() {
			const entityData = this.getAssociatedEntityData(),
				title = BX.prop.getString(entityData, "TITLE"),
				date = BX.prop.getString(entityData, "DATE", ""),
				paySystemName = BX.prop.getString(entityData, "PAY_SYSTEM_NAME", ""),
				sum = BX.prop.getString(entityData, 'SUM', ''),
				currency = BX.prop.getString(entityData, 'CURRENCY', ''),
				nodes = [];
			if (title !== "") {
				const paymentDetail = BX.create("DIV", {
					attrs: {
						className: "crm-entity-stream-content-detail-payment"
					}
				});
				paymentDetail.appendChild(BX.create("DIV", {
					attrs: {
						className: "crm-entity-stream-content-detail-payment-value"
					},
					children: [BX.create('SPAN', {
						attrs: {
							className: "crm-entity-stream-content-detail-payment-text"
						},
						html: sum
					}), BX.create('SPAN', {
						attrs: {
							className: "crm-entity-stream-content-detail-payment-currency"
						},
						html: currency
					})]
				}));
				const logotip = BX.prop.getString(entityData, "LOGOTIP", null);
				if (logotip) {
					paymentDetail.appendChild(BX.create("DIV", {
						attrs: {
							className: "crm-entity-stream-content-detail-payment-logo"
						},
						style: {
							backgroundImage: "url(" + encodeURI(logotip) + ")"
						}
					}));
				}
				nodes.push(paymentDetail);
				const descriptionNode = BX.create("DIV", {
					attrs: {
						className: "crm-entity-stream-content-detail-description"
					},
					children: [BX.create('SPAN', {
						text: date
					}), BX.create('SPAN', {
						attrs: {
							className: "crm-entity-stream-content-detail-description-info"
						},
						text: this.getMessage('orderPaySystemTitle')
					}), BX.create('SPAN', {
						text: paySystemName
					})]
				});
				nodes.push(descriptionNode);
			}
			return nodes;
		}
		prepareContent() {
			const fields = this.getObjectDataParam('FIELDS'),
				isPaid = BX.prop.get(fields, 'ORDER_PAID') === 'Y',
				isClick = BX.prop.get(fields, 'PAY_SYSTEM_CLICK') === 'Y',
				isManualContinuePay = BX.prop.get(fields, 'MANUAL_CONTINUE_PAY') === 'Y',
				isManualAddCheck = BX.prop.get(fields, 'NEED_MANUAL_ADD_CHECK') === 'Y',
				entityId = this.getAssociatedEntityTypeId();
			if (entityId === BX.CrmEntityType.enumeration.orderpayment && isPaid) {
				return this.preparePaidPaymentContent();
			} else if (entityId === BX.CrmEntityType.enumeration.orderpayment && isClick) {
				return this.prepareClickedPaymentContent();
			} else if (entityId === BX.CrmEntityType.enumeration.order && isManualContinuePay) {
				return this.prepareManualContinuePayContent();
			} else if (entityId === BX.CrmEntityType.enumeration.orderpayment && isManualAddCheck) {
				return this.prepareManualAddCheck();
			}
			return this.prepareItemOrderContent();
		}
		prepareItemOrderContent() {
			const entityData = this.getAssociatedEntityData();
			const isViewed = BX.prop.getString(entityData, "VIEWED", '') === 'Y';
			const isSent = BX.prop.getString(entityData, "SENT", '') === 'Y';
			const fields = this.getObjectDataParam('FIELDS');
			const psStatusCode = BX.prop.get(fields, 'STATUS_CODE', false);
			const wrapper = BX.create("DIV", {
				attrs: {
					className: 'crm-entity-stream-section crm-entity-stream-section-history'
				}
			});
			wrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: 'crm-entity-stream-section-icon ' + this.getIconClassName()
				}
			}));
			const content = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-event"
				}
			});
			const header = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-header"
				},
				children: this.getHeaderChildren()
			});
			let contentChildren = null;
			if (isViewed) {
				contentChildren = this.prepareViewedContentDetails();
			} else if (isSent) {
				contentChildren = this.prepareSentContentDetails();
			} else if (psStatusCode === 'ERROR') {
				contentChildren = this.prepareErrorPaymentContentDetails();
			} else {
				contentChildren = this.prepareContentDetails();
			}
			content.appendChild(header);
			content.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail"
				},
				children: contentChildren
			}));

			//region Author
			const authorNode = this.prepareAuthorLayout();
			if (authorNode) {
				content.appendChild(authorNode);
			}
			//endregion

			wrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section-content"
				},
				children: [content]
			}));
			return wrapper;
		}
		preparePaidPaymentContent() {
			const wrapper = BX.create("DIV", {
				attrs: {
					className: 'crm-entity-stream-section'
				}
			});
			wrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: 'crm-entity-stream-section-icon crm-entity-stream-section-icon-wallet'
				}
			}));
			const header = [BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-event-title"
				},
				children: [BX.create("A", {
					attrs: {
						href: "#"
					},
					events: {
						click: this._headerClickHandler
					},
					text: this.getMessage('orderPaymentSuccessTitle')
				})]
			})];
			header.push(BX.create("SPAN", {
				attrs: {
					className: "crm-entity-stream-content-event-time"
				},
				text: this.formatTime(this.getCreatedTime())
			}));
			const content = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-event"
				}
			});
			const headerWrap = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-header"
				},
				children: header
			});
			const contentChildren = this.preparePaidPaymentContentDetails();
			content.appendChild(headerWrap);
			content.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail"
				},
				children: contentChildren
			}));

			//region Author
			const authorNode = this.prepareAuthorLayout();
			if (authorNode) {
				content.appendChild(authorNode);
			}
			//endregion

			wrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section-content"
				},
				children: [content]
			}));
			return wrapper;
		}
		prepareErrorPaymentContentDetails() {
			const entityData = this.getAssociatedEntityData(),
				date = BX.prop.getString(entityData, 'DATE', ''),
				fields = this.getObjectDataParam('FIELDS'),
				paySystemName = BX.prop.getString(fields, 'PAY_SYSTEM_NAME', ''),
				paySystemError = BX.prop.getString(fields, 'STATUS_DESCRIPTION', ''),
				nodes = [];
			const descriptionNode = BX.create('DIV', {
				attrs: {
					className: 'crm-entity-stream-content-detail-description'
				},
				children: [BX.create('SPAN', {
					text: date
				}), BX.create('SPAN', {
					attrs: {
						className: 'crm-entity-stream-content-detail-description-info'
					},
					text: this.getMessage('orderPaySystemTitle')
				}), BX.create('SPAN', {
					text: paySystemName
				})]
			});
			nodes.push(descriptionNode);
			const errorDetailNode = BX.create('DIV', {
				attrs: {
					className: 'crm-entity-stream-content-event-payment-initiate-pay-error'
				},
				text: this.getMessage('orderPaymentStatusErrorReason').replace("#PAYSYSTEM_ERROR#", paySystemError)
			});
			nodes.push(errorDetailNode);
			return nodes;
		}
		prepareClickedPaymentContent() {
			const wrapper = BX.create("DIV", {
				attrs: {
					className: 'crm-entity-stream-section crm-entity-stream-section-history'
				}
			});
			wrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: 'crm-entity-stream-section-icon ' + this.getIconClassName()
				}
			}));
			const header = [BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-event-title"
				},
				children: [BX.create("A", {
					attrs: {
						href: "#"
					},
					events: {
						click: this._headerClickHandler
					},
					text: this.getTitle()
				})]
			})];
			header.push(BX.create("SPAN", {
				attrs: {
					className: "crm-entity-stream-content-event-time"
				},
				text: this.formatTime(this.getCreatedTime())
			}));
			const content = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-event"
				}
			});
			const headerWrap = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-header"
				},
				children: header
			});
			const contentChildren = this.prepareClickedPaymentContentDetails();
			content.appendChild(headerWrap);
			content.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail"
				},
				children: contentChildren
			}));

			//region Author
			const authorNode = this.prepareAuthorLayout();
			if (authorNode) {
				content.appendChild(authorNode);
			}
			//endregion

			wrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section-content"
				},
				children: [content]
			}));
			return wrapper;
		}
		prepareClickedPaymentContentDetails() {
			const fields = this.getObjectDataParam('FIELDS'),
				paySystemName = BX.prop.getString(fields, 'PAY_SYSTEM_NAME', ''),
				nodes = [];
			if (paySystemName !== '') {
				const descriptionNode = BX.create("DIV", {
					attrs: {
						className: "crm-entity-stream-content-detail-description"
					}
				});
				descriptionNode.appendChild(BX.create('SPAN', {
					attrs: {
						className: "crm-entity-stream-content-clicked-description-info"
					},
					text: this.getMessage('orderPaymentPaySystemClick')
				}));
				descriptionNode.appendChild(BX.create('SPAN', {
					attrs: {
						className: "crm-entity-stream-content-clicked-description-name"
					},
					text: paySystemName
				}));
				nodes.push(descriptionNode);
			}
			return nodes;
		}
		prepareManualContinuePayContent() {
			const wrapper = BX.create("DIV", {
				attrs: {
					className: 'crm-entity-stream-section crm-entity-stream-section-history crm-entity-stream-section-advice'
				}
			});
			wrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: 'crm-entity-stream-section-icon crm-entity-stream-section-icon-advice'
				},
				children: [BX.create('i')]
			}));
			const content = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-advice-info"
				},
				text: this.getMessage('orderManualContinuePay')
			});
			wrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-advice-content"
				},
				children: [content]
			}));
			return wrapper;
		}
		prepareManualAddCheck() {
			const entityData = this.getAssociatedEntityData();
			const showUrl = BX.prop.getString(entityData, "SHOW_URL", "");
			const wrapper = BX.create("DIV", {
				attrs: {
					className: 'crm-entity-stream-section crm-entity-stream-section-history crm-entity-stream-section-advice'
				}
			});
			wrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: 'crm-entity-stream-section-icon crm-entity-stream-section-icon-advice'
				}
			}));
			const htmlTitle = this.getMessage('orderManualAddCheck').replace("#HREF#", showUrl);
			const content = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-advice-info"
				},
				html: htmlTitle
			});
			const link = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-advice-info"
				},
				children: [BX.create("A", {
					attrs: {
						className: "crm-entity-stream-content-detail-target",
						href: "#"
					},
					events: {
						click: BX.delegate(function (e) {
							top.BX.Helper.show('redirect=detail&code=13742126');
							e.preventDefault ? e.preventDefault() : e.returnValue = false;
						})
					},
					html: this.getMessage('orderManualAddCheckHelpLink')
				})]
			});
			wrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-advice-content"
				},
				children: [content, link]
			}));
			return wrapper;
		}
		getIconClassName() {
			return 'crm-entity-stream-section-icon-store';
		}
		static create(id, settings) {
			const self = new OrderModification();
			self.initialize(id, settings);
			return self;
		}
		static messages = {};
	}

	/** @memberof BX.Crm.Timeline.Items */
	class ExternalNoticeModification extends OrderModification {
		constructor() {
			super();
		}
		getIconClassName() {
			return 'crm-entity-stream-section-icon-restApp';
		}
		static create(id, settings) {
			const self = new ExternalNoticeModification();
			self.initialize(id, settings);
			return self;
		}
	}

	/** @memberof BX.Crm.Timeline.Items */
	class ExternalNoticeStatusModification extends ExternalNoticeModification {
		constructor() {
			super();
		}
		prepareContentDetails() {
			const nodes = [];
			const contentChildren = [];
			if (BX.type.isNotEmptyString(this.getTextDataParam("START_NAME"))) {
				contentChildren.push(BX.create("SPAN", {
					attrs: {
						className: "crm-entity-stream-content-detain-info-status"
					},
					text: this.getTextDataParam("START_NAME")
				}));
				contentChildren.push(BX.create("SPAN", {
					attrs: {
						className: "crm-entity-stream-content-detail-info-separator-icon"
					}
				}));
			}
			if (BX.type.isNotEmptyString(this.getTextDataParam("FINISH_NAME"))) {
				contentChildren.push(BX.create("SPAN", {
					attrs: {
						className: "crm-entity-stream-content-detain-info-status"
					},
					text: this.getTextDataParam("FINISH_NAME")
				}));
			}
			nodes.push(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail-info"
				},
				children: contentChildren
			}));
			return nodes;
		}
		static create(id, settings) {
			const self = new ExternalNoticeStatusModification();
			self.initialize(id, settings);
			return self;
		}
	}

	/** @memberof BX.Crm.Timeline.Items */
	class Creation extends History$1 {
		static messages = {};
		constructor() {
			super();
		}
		static create(id, settings) {
			const self = new Creation();
			self.initialize(id, settings);
			return self;
		}
		doInitialize() {
			super.doInitialize();
			if (!(this._activityEditor instanceof BX.CrmActivityEditor)) {
				throw "Creation. The field 'activityEditor' is not assigned.";
			}
		}
		getTitle() {
			const entityTypeId = this.getAssociatedEntityTypeId();
			const entityData = this.getAssociatedEntityData();
			if (entityTypeId === BX.CrmEntityType.enumeration.activity) {
				const typeId = BX.prop.getInteger(entityData, "TYPE_ID");
				const title = this.getMessage(typeId === BX.CrmActivityType.task ? "task" : "activity");
				return title.replace(/#TITLE#/gi, this.cutOffText(BX.prop.getString(entityData, "SUBJECT")), 64);
			}
			if (entityTypeId === BX.CrmEntityType.enumeration.storeDocument) {
				const docType = BX.prop.getString(entityData, "DOC_TYPE");
				if (docType === 'A') {
					return this.getMessage('arrivalDocument');
				}
				if (docType === 'S') {
					return this.getMessage('storeAdjustmentDocument');
				}
				if (docType === 'M') {
					return this.getMessage('movingDocument');
				}
				if (docType === 'D') {
					return this.getMessage('deductDocument');
				}
				if (docType === 'W') {
					return this.getMessage('shipmentDocument');
				}
				return '';
			}
			const entityTypeName = BX.CrmEntityType.resolveName(this.getAssociatedEntityTypeId()).toLowerCase();
			let msg = this.getMessage(entityTypeName);
			const isMessageNotFound = msg === entityTypeName;
			if (!BX.type.isNotEmptyString(msg) || isMessageNotFound) {
				msg = this.getTextDataParam("TITLE");
			}
			return msg;
		}
		getWrapperClassName() {
			return "crm-entity-stream-section-createEntity";
		}
		prepareContent() {
			const entityTypeId = this.getAssociatedEntityTypeId();
			if (entityTypeId === BX.CrmEntityType.enumeration.ordershipment || entityTypeId === BX.CrmEntityType.enumeration.orderpayment) {
				const data = this.getData();
				data.TYPE_CATEGORY_ID = Item$1.modification;
				if (data.hasOwnProperty('ASSOCIATED_ENTITY')) {
					data.ASSOCIATED_ENTITY.HTML_TITLE = '';
				}
				const createOrderEntityItem = this._history.createOrderEntityItem(data);
				return createOrderEntityItem.prepareContent();
			}
			return super.prepareContent();
		}
		prepareContentDetails() {
			const entityTypeId = this.getAssociatedEntityTypeId();
			const entityId = this.getAssociatedEntityId();
			const entityData = this.getAssociatedEntityData();
			if (entityTypeId === BX.CrmEntityType.enumeration.activity) {
				const link = BX.create("A", {
					attrs: {
						href: "#"
					},
					html: this.cutOffText(BX.prop.getString(entityData, "DESCRIPTION_RAW"), 128)
				});
				BX.bind(link, "click", this._headerClickHandler);
				return [link];
			}
			const title = BX.prop.getString(entityData, "TITLE", "");
			let htmlTitle = BX.prop.getString(entityData, "HTML_TITLE", "");
			const showUrl = BX.prop.getString(entityData, "SHOW_URL", "");
			if (entityTypeId === BX.CrmEntityType.enumeration.deal && BX.prop.getObject(entityData, "ORDER", null)) {
				const orderData = BX.prop.getObject(entityData, "ORDER", null);
				htmlTitle = this.getMessage('dealOrderTitle').replace("#ORDER_ID#", orderData.ID).replace("#DATE_TIME#", orderData.ORDER_DATE).replace("#HREF#", orderData.SHOW_URL).replace("#PRICE_WITH_CURRENCY#", orderData.SUM);
			}
			if (title !== "" || htmlTitle !== "") {
				const nodes = [];
				if (showUrl === "" || entityTypeId === this.getOwnerTypeId() && entityId === this.getOwnerId()) {
					const spanAttrs = htmlTitle !== "" ? {
						html: htmlTitle
					} : {
						text: title
					};
					nodes.push(BX.create("SPAN", spanAttrs));
				} else {
					let linkAttrs = {
						attrs: {
							href: showUrl
						},
						text: title
					};
					if (htmlTitle !== "") {
						linkAttrs = {
							attrs: {
								href: showUrl
							},
							html: htmlTitle
						};
					}
					nodes.push(BX.create("A", linkAttrs));
				}
				const legend = this.getTextDataParam("LEGEND");
				if (legend !== "") {
					nodes.push(BX.create("BR"));
					nodes.push(BX.create("SPAN", {
						text: legend
					}));
				}
				const baseEntityData = this.getObjectDataParam("BASE");
				const baseEntityInfo = BX.prop.getObject(baseEntityData, "ENTITY_INFO");
				if (baseEntityInfo) {
					nodes.push(BX.create("BR"));
					nodes.push(BX.create("SPAN", {
						text: BX.prop.getString(baseEntityData, "CAPTION") + ": "
					}));
					nodes.push(BX.create("A", {
						attrs: {
							href: BX.prop.getString(baseEntityInfo, "SHOW_URL", "#")
						},
						text: BX.prop.getString(baseEntityInfo, "TITLE", "")
					}));
				}
				return nodes;
			}
			return [];
		}
		view() {
			const entityTypeId = this.getAssociatedEntityTypeId();
			if (entityTypeId === BX.CrmEntityType.enumeration.activity) {
				const entityData = this.getAssociatedEntityData();
				const id = BX.prop.getInteger(entityData, "ID", 0);
				if (id > 0) {
					this._activityEditor.viewActivity(id);
				}
			}
		}
		getMessage(name) {
			const m = Creation.messages;
			return m.hasOwnProperty(name) ? m[name] : name;
		}
	}

	/** @memberof BX.Crm.Timeline.Items */
	class Restoration extends History$1 {
		constructor() {
			super();
		}
		getTitle() {
			return this.getTextDataParam("TITLE");
		}
		getWrapperClassName() {
			return "crm-entity-stream-section-restoreEntity";
		}
		prepareContentDetails() {
			const entityData = this.getAssociatedEntityData();
			const title = BX.prop.getString(entityData, "TITLE");
			return title !== "" ? [BX.create("SPAN", {
				text: title
			})] : [];
		}
		getMessage(name) {
			const m = Restoration.messages;
			return m.hasOwnProperty(name) ? m[name] : name;
		}
		static create(id, settings) {
			const self = new Restoration();
			self.initialize(id, settings);
			return self;
		}
		static messages = {};
	}

	/** @memberof BX.Crm.Timeline.Items */
	class Relation extends History$1 {
		constructor() {
			super();
		}
		getTitle() {
			return this.getMessage('title');
		}
		getWrapperClassName() {
			return "crm-entity-stream-section-createEntity";
		}
		prepareContentDetails() {
			const entityData = this.getAssociatedEntityData();
			let link = BX.prop.getString(entityData, "SHOW_URL", "");
			if (link.indexOf('/') !== 0) {
				link = '#';
			}
			const content = this.getMessage('contentTemplate').replace('#ENTITY_TYPE_CAPTION#', BX.Text.encode(BX.prop.getString(entityData, 'ENTITY_TYPE_CAPTION', ''))).replace('#LEGEND#', '').replace('#LINK#', BX.Text.encode(link)).replace('#LINK_TITLE#', BX.Text.encode(BX.prop.getString(entityData, "TITLE", '')));
			const nodes = [];
			nodes.push(BX.create('SPAN', {
				html: content
			}));
			return nodes;
		}
	}

	/** @memberof BX.Crm.Timeline.Items */
	class Link extends Relation {
		constructor() {
			super();
		}
		getIconClassName() {
			return "crm-entity-stream-section-icon crm-entity-stream-section-icon-link";
		}
		getMessage(name) {
			const m = Link.messages;
			return m.hasOwnProperty(name) ? m[name] : name;
		}
		static create(id, settings) {
			const self = new Link();
			self.initialize(id, settings);
			return self;
		}
		static messages = {};
	}

	/** @memberof BX.Crm.Timeline.Items */
	class Unlink extends Relation {
		constructor() {
			super();
		}
		getIconClassName() {
			return "crm-entity-stream-section-icon crm-entity-stream-section-icon-unlink";
		}
		getMessage(name) {
			const m = Unlink.messages;
			return m.hasOwnProperty(name) ? m[name] : name;
		}
		static create(id, settings) {
			const self = new Unlink();
			self.initialize(id, settings);
			return self;
		}
		static messages = {};
	}

	/** @memberof BX.Crm.Timeline.Items */
	class Mark extends History$1 {
		constructor() {
			super();
		}
		doInitialize() {
			super.doInitialize();
			if (!(this._activityEditor instanceof BX.CrmActivityEditor)) {
				throw "Mark. The field 'activityEditor' is not assigned.";
			}
		}
		getMessage(name) {
			const m = Mark.messages;
			if (m.hasOwnProperty(name)) {
				return m[name];
			}
			return super.getMessage(name);
		}
		getTitle() {
			let title = "";
			const entityData = this.getAssociatedEntityData();
			const associatedEntityTypeId = this.getAssociatedEntityTypeId();
			const typeCategoryId = this.getTypeCategoryId();
			if (associatedEntityTypeId === BX.CrmEntityType.enumeration.activity) {
				const entityTypeId = BX.prop.getInteger(entityData, "TYPE_ID", 0);
				const direction = BX.prop.getInteger(entityData, "DIRECTION", 0);
				const activityProviderId = BX.prop.getString(entityData, "PROVIDER_ID", '');
				if (entityTypeId === BX.CrmActivityType.email) {
					if (typeCategoryId === Mark$1.success) {
						title = this.getMessage((direction === BX.CrmActivityDirection.incoming ? "incomingEmail" : "outgoingEmail") + "SuccessMark");
					} else if (typeCategoryId === Mark$1.renew) {
						title = this.getMessage((direction === BX.CrmActivityDirection.incoming ? "incomingEmail" : "outgoingEmail") + "RenewMark");
					}
				} else if (entityTypeId === BX.CrmActivityType.call) {
					if (typeCategoryId === Mark$1.success) {
						title = this.getMessage((direction === BX.CrmActivityDirection.incoming ? "incomingCall" : "outgoingCall") + "SuccessMark");
					} else if (typeCategoryId === Mark$1.renew) {
						title = this.getMessage((direction === BX.CrmActivityDirection.incoming ? "incomingCall" : "outgoingCall") + "RenewMark");
					}
				} else if (entityTypeId === BX.CrmActivityType.meeting) {
					if (typeCategoryId === Mark$1.success) {
						title = this.getMessage("meetingSuccessMark");
					} else if (typeCategoryId === Mark$1.renew) {
						title = this.getMessage("meetingRenewMark");
					}
				} else if (entityTypeId === BX.CrmActivityType.task) {
					if (typeCategoryId === Mark$1.success) {
						title = this.getMessage("taskSuccessMark");
					} else if (typeCategoryId === Mark$1.renew) {
						title = this.getMessage("taskRenewMark");
					}
				} else if (entityTypeId === BX.CrmActivityType.provider) {
					if (activityProviderId === 'CRM_REQUEST') {
						if (typeCategoryId === Mark$1.success) {
							title = this.getMessage("requestSuccessMark");
						} else if (typeCategoryId === Mark$1.renew) {
							title = this.getMessage("requestRenewMark");
						}
					} else if (typeCategoryId === Mark$1.success) {
						title = this.getMessage("webformSuccessMark");
					} else if (typeCategoryId === Mark$1.renew) {
						title = this.getMessage("webformRenewMark");
					}
				}
			} else if (associatedEntityTypeId === BX.CrmEntityType.enumeration.deal) {
				if (typeCategoryId === Mark$1.success) {
					title = this.getMessage("dealSuccessMark");
				} else if (typeCategoryId === Mark$1.failed) {
					title = this.getMessage("dealFailedMark");
				}
			} else if (associatedEntityTypeId === BX.CrmEntityType.enumeration.order) {
				if (typeCategoryId === Mark$1.success) {
					title = this.getMessage("orderSuccessMark");
				} else if (typeCategoryId === Mark$1.failed) {
					title = this.getMessage("orderFailedMark");
				}
			} else {
				if (BX.CrmEntityType.isDefined(associatedEntityTypeId)) {
					if (typeCategoryId === Mark$1.success) {
						title = this.getMessage('entitySuccessMark');
					} else if (typeCategoryId === Mark$1.failed) {
						title = this.getMessage('entityFailedMark');
					}
				}
			}
			return title;
		}
		prepareTitleLayout() {
			const associatedEntityTypeId = this.getAssociatedEntityTypeId();
			if (associatedEntityTypeId === BX.CrmEntityType.enumeration.order) {
				return BX.create("SPAN", {
					attrs: {
						className: "crm-entity-stream-content-event-title"
					},
					text: this.getTitle()
				});
			} else {
				return BX.create("A", {
					attrs: {
						href: "#",
						className: "crm-entity-stream-content-event-title"
					},
					events: {
						"click": this._headerClickHandler
					},
					text: this.getTitle()
				});
			}
		}
		prepareContent() {
			const entityData = this.getAssociatedEntityData();
			const associatedEntityTypeId = this.getAssociatedEntityTypeId();
			const wrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section crm-entity-stream-section-completed"
				}
			});
			if (this.isFixed()) BX.addClass(wrapper, 'crm-entity-stream-section-top-fixed');

			//region Context Menu
			if (this.isContextMenuEnabled()) {
				wrapper.appendChild(this.prepareContextMenuButton());
			}
			//endregion

			const content = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-event"
				}
			});
			const header = this.prepareHeaderLayout();
			if (associatedEntityTypeId === BX.CrmEntityType.enumeration.activity) {
				const entityTypeId = BX.prop.getInteger(entityData, "TYPE_ID", 0);
				let iconClassName = "crm-entity-stream-section-icon";
				if (entityTypeId === BX.CrmActivityType.email) {
					iconClassName += " crm-entity-stream-section-icon-email";
				} else if (entityTypeId === BX.CrmActivityType.call) {
					iconClassName += " crm-entity-stream-section-icon-call";
				} else if (entityTypeId === BX.CrmActivityType.meeting) {
					iconClassName += " crm-entity-stream-section-icon-meeting";
				} else if (entityTypeId === BX.CrmActivityType.task) {
					iconClassName += " crm-entity-stream-section-icon-task";
				} else if (entityTypeId === BX.CrmActivityType.provider) {
					const providerId = BX.prop.getString(entityData, "PROVIDER_ID", "");
					if (providerId === "CRM_WEBFORM") {
						iconClassName += " crm-entity-stream-section-icon-crmForm";
					}
				}
				wrapper.appendChild(BX.create("DIV", {
					attrs: {
						className: iconClassName
					}
				}));
				content.appendChild(header);
				const detailWrapper = BX.create("DIV", {
					attrs: {
						className: "crm-entity-stream-content-detail"
					}
				});
				content.appendChild(detailWrapper);
				detailWrapper.appendChild(BX.create("DIV", {
					attrs: {
						className: "crm-entity-stream-content-detail-title"
					},
					children: [BX.create("A", {
						attrs: {
							href: "#"
						},
						events: {
							"click": this._headerClickHandler
						},
						text: this.cutOffText(BX.prop.getString(entityData, "SUBJECT", ""), 128)
					})]
				}));
				const summary = this.getTextDataParam("SUMMARY");
				if (summary !== "") {
					detailWrapper.appendChild(BX.create("DIV", {
						attrs: {
							className: "crm-entity-stream-content-detail-description"
						},
						text: summary
					}));
				}
			} else if (associatedEntityTypeId === BX.CrmEntityType.enumeration.order) {
				wrapper.appendChild(BX.create("DIV", {
					attrs: {
						className: "crm-entity-stream-section-icon crm-entity-stream-section-icon-info"
					}
				}));
				content.appendChild(header);
				content.appendChild(BX.create("DIV", {
					attrs: {
						className: "crm-entity-stream-content-detail"
					},
					text: this.cutOffText(this.getTextDataParam("MESSAGE"), 128)
				}));
			} else {
				wrapper.appendChild(BX.create("DIV", {
					attrs: {
						className: "crm-entity-stream-section-icon crm-entity-stream-section-icon-info"
					}
				}));
				content.appendChild(header);
				const innerWrapper = BX.create("DIV", {
					attrs: {
						className: "crm-entity-stream-content-detail"
					}
				});
				const associatedEntityTitle = this.cutOffText(BX.prop.getString(entityData, "TITLE", ""), 128);
				if (BX.CrmEntityType.isDefined(associatedEntityTypeId)) {
					let link = BX.prop.getString(entityData, 'SHOW_URL', '');
					if (link.indexOf('/') !== 0) {
						link = '#';
					}
					const contentTemplate = this.getMessage('entityContentTemplate').replace('#ENTITY_TYPE_CAPTION#', BX.Text.encode(BX.prop.getString(entityData, 'ENTITY_TYPE_CAPTION', ''))).replace('#LINK#', BX.Text.encode(link)).replace('#LINK_TITLE#', BX.Text.encode(associatedEntityTitle));
					innerWrapper.appendChild(BX.create('SPAN', {
						html: contentTemplate
					}));
				} else {
					innerWrapper.innerText = associatedEntityTitle;
				}
				content.appendChild(innerWrapper);
			}

			//region Author
			const authorNode = this.prepareAuthorLayout();
			if (authorNode) {
				content.appendChild(authorNode);
			}
			//endregion

			wrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section-content"
				},
				children: [content]
			}));
			if (!this.isReadOnly()) wrapper.appendChild(this.prepareFixedSwitcherLayout());
			return wrapper;
		}
		prepareContextMenuItems() {
			const menuItems = [];
			if (!this.isReadOnly()) {
				if (this.isFixed() || this._fixedHistory.findItemById(this._id)) menuItems.push({
					id: "unfasten",
					text: this.getMessage("menuUnfasten"),
					onclick: BX.delegate(this.unfasten, this)
				});else menuItems.push({
					id: "fasten",
					text: this.getMessage("menuFasten"),
					onclick: BX.delegate(this.fasten, this)
				});
			}
			return menuItems;
		}
		view() {
			const entityData = this.getAssociatedEntityData();
			const associatedEntityTypeId = this.getAssociatedEntityTypeId();
			if (associatedEntityTypeId === BX.CrmEntityType.enumeration.activity) {
				const id = BX.prop.getInteger(entityData, "ID", 0);
				if (id > 0) {
					this._activityEditor.viewActivity(id);
				}
			} else {
				const showUrl = BX.prop.getString(entityData, "SHOW_URL", "");
				if (showUrl !== "") {
					BX.Crm.Page.open(showUrl);
				}
			}
		}
		static create(id, settings) {
			const self = new Mark();
			self.initialize(id, settings);
			return self;
		}
		static messages = {};
	}

	/** @memberof BX.Crm.Timeline.Items */
	let Comment$2 = class Comment extends History$1 {
		constructor() {
			super();
			this._isCollapsed = false;
			this._isMenuShown = false;
			this._isFixed = false;
			this._hasFiles = false;
			this._postForm = null;
			this._editor = null;
			this._commentMessage = '';
			this._mode = EditorMode.view;
			this._streamContentEventBlock = '';
			this._playerWrappers = {};
			BX.Event.EventEmitter.subscribe("BX.Disk.Files:onShowFiles", BX.delegate(this.addPlayer, this));
		}
		doInitialize() {
			super.doInitialize();
			this._hasFiles = this.getTextDataParam("HAS_FILES") === 'Y';
		}
		getTitle() {
			return this.getMessage("comment");
		}
		onPlayerDummyClick(file) {
			const playerWrapper = this._playerWrappers[file.id];
			const stubNode = playerWrapper.querySelector(".crm-audio-cap-wrap");
			if (stubNode) {
				BX.addClass(stubNode, "crm-audio-cap-wrap-loader");
			}
			this._history.getManager().getAudioPlaybackRateSelector().addPlayer(this._history.getManager().loadMediaPlayer("history_" + this.getId() + '_' + file.id, file.url, 'audio/mp3', playerWrapper, null, {
				playbackRate: this._history.getManager().getAudioPlaybackRateSelector().getRate()
			}));
		}
		addPlayer(event) {
			if (event.data.entityValueId === parseInt(this.getId(), 10)) {
				this.files = event.data.files;
				event.data.files.forEach(function (file) {
					if (file.extension === 'mp3') {
						if (this._playerWrappers[file.id]) {
							return;
						}
						const callInfoWrapper = BX.create("DIV", {
							attrs: {
								className: "crm-entity-stream-content-detail-call crm-entity-stream-content-detail-call-inline"
							}
						});
						this._streamContentEventBlock.appendChild(callInfoWrapper);
						this._playerWrappers[file.id] = this._history.getManager().renderAudioDummy(null, this.onPlayerDummyClick.bind(this, file));
						this._playerWrappers[file.id].firstElementChild.classList.add("crm-audio-cap-wrap-without-duration-text");
						callInfoWrapper.appendChild(this._playerWrappers[file.id]);
						callInfoWrapper.appendChild(this._history.getManager().getAudioPlaybackRateSelector().render());
					}
				}.bind(this));
			}
		}
		prepareContent() {
			const wrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section crm-entity-stream-section-history crm-entity-stream-section-comment"
				}
			});
			if (this.isReadOnly()) {
				BX.addClass(wrapper, "crm-entity-stream-section-comment-read-only");
			}
			if (this.isFixed()) BX.addClass(wrapper, 'crm-entity-stream-section-top-fixed');
			wrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section-icon crm-entity-stream-section-icon-comment"
				}
			}));

			//region Context Menu
			if (this.isContextMenuEnabled()) {
				wrapper.appendChild(this.prepareContextMenuButton());
			}
			//endregion

			this._streamContentEventBlock = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-event"
				}
			});
			const header = this.prepareHeaderLayout();
			this._streamContentEventBlock.appendChild(header);
			if (!this.isReadOnly()) wrapper.appendChild(this.prepareFixedSwitcherLayout());
			const detailChildren = [];
			if (this._mode !== EditorMode.edit) {
				this._commentWrapper = BX.create("DIV", {
					attrs: {
						className: "crm-entity-stream-content-detail-description"
					}
				});
				BX.html(this._commentWrapper, this.getTextDataParam("COMMENT", ""));
				detailChildren.push(this._commentWrapper);
				if (!this.isReadOnly()) {
					BX.bind(this._commentWrapper, "click", BX.delegate(this.switchToEditMode, this));
					BX.bind(header, "click", BX.delegate(this.switchToEditMode, this));
				}
			} else {
				if (!BX.type.isDomNode(this._editorContainer)) this._editorContainer = BX.create("div", {
					attrs: {
						className: "crm-entity-stream-section-comment-editor"
					}
				});
				detailChildren.push(this._editorContainer);
				const buttons = BX.create("DIV", {
					attrs: {
						className: "crm-entity-stream-content-detail-comment-edit-btn-container"
					},
					children: [BX.create("button", {
						attrs: {
							className: "ui-btn ui-btn-xs ui-btn-primary"
						},
						html: this.getMessage("send"),
						events: {
							click: BX.delegate(this.save, this)
						}
					}), BX.create("a", {
						attrs: {
							className: "ui-btn ui-btn-xs ui-btn-link"
						},
						html: this.getMessage("cancel"),
						events: {
							click: BX.delegate(this.switchToViewMode, this)
						}
					})]
				});
				detailChildren.push(buttons);
			}
			this._streamContentEventBlock.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail"
				},
				children: detailChildren
			}));

			//region Author
			const authorNode = this.prepareAuthorLayout();
			if (authorNode) {
				this._streamContentEventBlock.appendChild(authorNode);
			}
			//endregion
			const cleanText = this.getTextDataParam("TEXT", "");
			const _hasInlineAttachment = this.getTextDataParam("HAS_INLINE_ATTACHMENT", "") === 'Y';
			if (cleanText.length <= 128 && !_hasInlineAttachment || this._mode === EditorMode.edit) {
				this._isCollapsed = false;
				wrapper.appendChild(BX.create("DIV", {
					attrs: {
						className: "crm-entity-stream-section-content"
					},
					children: [this._streamContentEventBlock]
				}));
			} else {
				this._isCollapsed = true;
				wrapper.appendChild(BX.create("DIV", {
					attrs: {
						className: "crm-entity-stream-section-content crm-entity-stream-section-content-collapsed"
					},
					children: [this._streamContentEventBlock]
				}));
				wrapper.querySelector(".crm-entity-stream-content-event").appendChild(BX.create("DIV", {
					attrs: {
						className: "crm-entity-stream-section-content-expand-btn-container"
					},
					children: [BX.create("A", {
						attrs: {
							className: "crm-entity-stream-section-content-expand-btn",
							href: "#"
						},
						events: {
							click: BX.delegate(this.onExpandButtonClick, this)
						},
						text: this.getMessage("expand")
					})]
				}));
			}
			if (this._mode === EditorMode.view && this._hasFiles) {
				this._textLoaded = false;
				this._fileBlock = BX.create("DIV", {
					attrs: {
						className: "crm-entity-stream-section-files-inner"
					},
					children: [BX.create("DIV", {
						attrs: {
							className: "crm-timeline-wait"
						}
					})]
				});
				wrapper.querySelector(".crm-entity-stream-section-content").appendChild(BX.create("DIV", {
					attrs: {
						className: "crm-entity-stream-section-files"
					},
					children: [this._fileBlock]
				}));
				BX.ready(BX.delegate(function () {
					window.setTimeout(BX.delegate(function () {
						this.loadContent(this._fileBlock, "GET_FILE_BLOCK");
					}, this), 100);
				}, this));
			}
			return wrapper;
		}
		prepareActions() {
			if (this._mode === EditorMode.view && BX.type.isDomNode(this._commentWrapper)) {
				this.registerImages(this._commentWrapper);
				if (!BX.getClass('BX.Disk.apiVersion')) {
					BX.viewElementBind(this._commentWrapper, {
						showTitle: true
					}, function (node) {
						return BX.type.isElementNode(node) && (node.getAttribute('data-bx-viewer') || node.getAttribute('data-bx-image'));
					});
				}
			}
		}
		loadContent(node, type) {
			if (!BX.type.isDomNode(node)) return;
			BX.ajax({
				url: this._history._serviceUrl,
				method: "POST",
				dataType: "json",
				data: {
					"ACTION": "GET_COMMENT_CONTENT",
					"ID": this.getId(),
					"ENTITY_TYPE_ID": this.getOwnerTypeId(),
					"ENTITY_ID": this.getOwnerId(),
					"TYPE": type
				},
				onsuccess: BX.delegate(function (result) {
					if (BX.type.isNotEmptyString(result.ERROR) && type === 'GET_FILE_BLOCK') {
						BX.remove(node);
						return;
					}
					if (BX.type.isNotEmptyString(result.BLOCK)) {
						const promise = BX.html(node, result.BLOCK);
						promise.then(BX.delegate(function () {
							this.registerImages(node);
							BX.LazyLoad.showImages();
						}, this));
					}
				}, this)
			});
		}
		loadEditor() {
			this._editorName = 'CrmTimeLineComment' + this._id + BX.util.getRandomString(4);
			if (this._postForm) {
				this._postForm.oEditor.SetContent(this._commentMessage);
				this._editor.ReInitIframe();
				return;
			}
			const actionData = {
				data: {
					id: this._id,
					name: this._editorName
				}
			};
			BX.ajax.runAction("crm.api.timeline.loadEditor", actionData).then(this.onLoadEditorSuccess.bind(this)).catch(this.switchToViewMode.bind(this));
		}
		onLoadEditorSuccess(result) {
			if (!BX.type.isDomNode(this._editorContainer)) this._editorContainer = BX.create("div", {
				attrs: {
					className: "crm-entity-stream-section-comment-editor"
				}
			});
			const html = BX.prop.getString(BX.prop.getObject(result, "data", {}), "html", '');
			BX.html(this._editorContainer, html).then(BX.delegate(this.showEditor, this));
		}
		showEditor() {
			if (LHEPostForm) {
				window.setTimeout(BX.delegate(function () {
					this._postForm = LHEPostForm.getHandler(this._editorName);
					this._editor = BXHtmlEditor.Get(this._editorName);
					BX.onCustomEvent(this._postForm.eventNode, 'OnShowLHE', [true]);
					this._commentMessage = this._postForm.oEditor.GetContent();
				}, this), 0);
			}
		}
		registerImages(node) {
			const commentImages = node.querySelectorAll('[data-bx-viewer="image"]');
			const commentImagesLength = commentImages.length;
			const idsList = [];
			if (commentImagesLength > 0) {
				for (let i = 0; i < commentImagesLength; ++i) {
					if (BX.type.isDomNode(commentImages[i])) {
						commentImages[i].id += BX.util.getRandomString(4);
						idsList.push(commentImages[i].id);
					}
				}
				if (idsList.length > 0) {
					BX.LazyLoad.registerImages(idsList);
				}
			}
			BX.LazyLoad.registerImages(idsList);
		}
		toggleMode(type) {
			this._mode = parseInt(type);
			this._hasFiles = this.getTextDataParam("HAS_FILES") === 'Y';
			this.refreshLayout();
			this.closeContextMenu();
		}
		switchToViewMode(e) {
			// if (LHEPostForm)
			// 	LHEPostForm.unsetHandler(this._editorName);
			this.toggleMode(EditorMode.view);
		}
		switchToEditMode(e) {
			const tagName = e.target.tagName.toLowerCase();
			if (tagName === 'a' || tagName === 'img' || BX.hasClass(e.target, "feed-con-file-changes-link-more") || BX.hasClass(e.target, "feed-com-file-inline") || BX.type.isNotEmptyString(document.getSelection().toString())) {
				return;
			}
			this.toggleMode(EditorMode.edit);
			window.setTimeout(BX.delegate(function () {
				this.loadEditor();
			}, this), 100);
		}
		prepareContextMenuItems() {
			if (this._isMenuShown) {
				return;
			}
			const menuItems = [];
			if (!this.isReadOnly()) {
				if (this._mode !== EditorMode.edit) {
					menuItems.push({
						id: "edit",
						text: this.getMessage("menuEdit"),
						onclick: BX.delegate(this.switchToEditMode, this)
					});
				} else {
					menuItems.push({
						id: "cancel",
						text: this.getMessage("menuCancel"),
						onclick: BX.delegate(this.switchToViewMode, this)
					});
				}
				menuItems.push({
					id: "remove",
					text: this.getMessage("menuDelete"),
					onclick: BX.delegate(this.processRemoval, this)
				});
				if (this.isFixed() || this._fixedHistory.findItemById(this._id)) menuItems.push({
					id: "unfasten",
					text: this.getMessage("menuUnfasten"),
					onclick: BX.delegate(this.unfasten, this)
				});else menuItems.push({
					id: "fasten",
					text: this.getMessage("menuFasten"),
					onclick: BX.delegate(this.fasten, this)
				});
			}
			return menuItems;
		}
		save(e) {
			const attachmentList = [];
			let text = "";
			if (this._postForm) {
				text = this._postForm.oEditor.GetContent();
				this._commentMessage = text;
				this._postForm.eventNode.querySelectorAll('input[name="UF_CRM_COMMENT_FILES[]"]').forEach(function (input) {
					attachmentList.push(input.value);
				});
			}
			if (!BX.type.isNotEmptyString(text)) {
				if (!this.emptyCommentMessage) {
					this.emptyCommentMessage = new BX.PopupWindow('timeline_empty_comment_' + this._id, e.target, {
						content: BX.message('CRM_TIMELINE_EMPTY_COMMENT_MESSAGE'),
						darkMode: true,
						autoHide: true,
						zIndex: 990,
						angle: {
							position: 'top',
							offset: 77
						},
						closeByEsc: true,
						bindOptions: {
							forceBindPosition: true
						}
					});
				}
				this.emptyCommentMessage.show();
				return;
			}
			if (this._isRequestRunning && BX.type.isNotEmptyString(text)) {
				return;
			}
			this._isRequestRunning = true;
			BX.ajax({
				url: this._history._serviceUrl,
				method: "POST",
				dataType: "json",
				data: {
					"ACTION": "UPDATE_COMMENT",
					"ID": this.getId(),
					"TEXT": text,
					"OWNER_TYPE_ID": this.getOwnerTypeId(),
					"OWNER_ID": this.getOwnerId(),
					"ATTACHMENTS": attachmentList
				},
				onsuccess: BX.delegate(this.onSaveSuccess, this),
				onfailure: BX.delegate(this.onRequestFailure, this)
			});
		}
		processRemoval() {
			this.closeContextMenu();
			this._detetionConfirmDlgId = "entity_timeline_deletion_" + this.getId() + "_confirm";
			let dlg = BX.Crm.ConfirmationDialog.get(this._detetionConfirmDlgId);
			if (!dlg) {
				dlg = BX.Crm.ConfirmationDialog.create(this._detetionConfirmDlgId, {
					title: this.getMessage("removeConfirmTitle"),
					content: this.getMessage('commentRemove'),
					background: 'vibrant'
				});
			}
			dlg.open().then(BX.delegate(this.onRemovalConfirm, this), BX.delegate(this.onRemovalCancel, this));
		}
		onRemovalConfirm(result) {
			if (BX.prop.getBoolean(result, "cancel", true)) {
				return;
			}
			this.remove();
		}
		onRemovalCancel() {}
		remove(e) {
			if (this._isRequestRunning) {
				return;
			}
			const history = this._history._manager.getHistory();
			const deleteItem = history.findItemById(this._id);
			if (deleteItem instanceof Comment) deleteItem.clearAnimate();
			const fixedHistory = this._history._manager.getFixedHistory();
			const deleteFixedItem = fixedHistory.findItemById(this._id);
			if (deleteFixedItem instanceof Comment) deleteFixedItem.clearAnimate();
			this._isRequestRunning = true;
			BX.ajax({
				url: this._history._serviceUrl,
				method: "POST",
				dataType: "json",
				data: {
					"ACTION": "DELETE_COMMENT",
					"OWNER_TYPE_ID": this.getOwnerTypeId(),
					"OWNER_ID": this.getOwnerId(),
					"ID": this.getId()
				},
				onsuccess: BX.delegate(this.onRemoveSuccess, this),
				onfailure: BX.delegate(this.onRequestFailure, this)
			});
		}
		refreshLayout() {
			this._playerWrappers = {};
			super.refreshLayout();
		}
		onSaveSuccess(data) {
			this._isRequestRunning = false;
			const itemData = BX.prop.getObject(data, "HISTORY_ITEM");
			const updateFixedItem = this._fixedHistory.findItemById(this._id);
			if (updateFixedItem instanceof Comment) {
				if (!BX.type.isNotEmptyString(itemData['IS_FIXED'])) itemData['IS_FIXED'] = 'Y';
				updateFixedItem.setData(itemData);
				updateFixedItem._id = BX.prop.getString(itemData, "ID");
				updateFixedItem.switchToViewMode();
			}
			const updateItem = this._history.findItemById(this._id);
			if (updateItem instanceof Comment) {
				updateItem.setData(itemData);
				updateItem._id = BX.prop.getString(itemData, "ID");
				updateItem.switchToViewMode();
			}
			this._postForm = null;
		}
		onRemoveSuccess(data) {}
		onRequestFailure(data) {
			this._isRequestRunning = this._isLocked = false;
		}
		onExpandButtonClick(e) {
			if (!this._wrapper) {
				return BX.PreventDefault(e);
			}
			const contentWrapper = this._wrapper.querySelector("div.crm-entity-stream-section-content");
			if (!contentWrapper) {
				return BX.PreventDefault(e);
			}
			if (this._hasFiles && BX.type.isDomNode(this._commentWrapper) && !this._textLoaded) {
				this._textLoaded = true;
				this.loadContent(this._commentWrapper, "GET_TEXT");
			}
			const eventWrapper = contentWrapper.querySelector(".crm-entity-stream-content-event");
			if (this._isCollapsed) {
				eventWrapper.style.maxHeight = eventWrapper.scrollHeight + 130 + "px";
				BX.removeClass(contentWrapper, "crm-entity-stream-section-content-collapsed");
				BX.addClass(contentWrapper, "crm-entity-stream-section-content-expand");
				setTimeout(BX.delegate(function () {
					eventWrapper.style.maxHeight = "";
				}, this), 300);
			} else {
				eventWrapper.style.maxHeight = eventWrapper.clientHeight + "px";
				BX.removeClass(contentWrapper, "crm-entity-stream-section-content-expand");
				BX.addClass(contentWrapper, "crm-entity-stream-section-content-collapsed");
				setTimeout(BX.delegate(function () {
					eventWrapper.style.maxHeight = "";
				}, this), 0);
			}
			this._isCollapsed = !this._isCollapsed;
			const button = contentWrapper.querySelector("a.crm-entity-stream-section-content-expand-btn");
			if (button) {
				button.innerHTML = this.getMessage(this._isCollapsed ? "expand" : "collapse");
			}
			return BX.PreventDefault(e);
		}
		static create(id, settings) {
			const self = new Comment();
			self.initialize(id, settings);
			return self;
		}
	};

	/** @memberof BX.Crm.Timeline.Items */
	let Wait$1 = class Wait extends HistoryActivity {
		constructor() {
			super();
		}
		getTitle() {
			return this.getMessage("wait");
		}
		prepareTitleLayout() {
			return BX.create("SPAN", {
				attrs: {
					className: "crm-entity-stream-content-event-title"
				},
				children: [BX.create("A", {
					attrs: {
						href: "#"
					},
					events: {
						"click": this._headerClickHandler
					},
					text: this.getTitle()
				})]
			});
		}
		prepareTimeLayout() {
			return BX.create("SPAN", {
				attrs: {
					className: "crm-entity-stream-content-event-time"
				},
				text: this.formatTime(this.getCreatedTime())
			});
		}
		prepareHeaderLayout() {
			const header = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-header"
				}
			});
			header.appendChild(this.prepareTitleLayout());
			header.appendChild(this.prepareTimeLayout());
			return header;
		}
		prepareContent() {
			const entityData = this.getAssociatedEntityData();
			let description = BX.prop.getString(entityData, "DESCRIPTION_RAW", "");
			if (description !== "") {
				description = BX.util.trim(description);
				description = BX.util.strip_tags(description);
				description = BX.util.nl2br(description);
			}
			const wrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section crm-entity-stream-section-history crm-entity-stream-section-wait"
				}
			});
			wrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section-icon crm-entity-stream-section-icon-complete"
				}
			}));
			const contentWrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-event"
				}
			});
			wrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section-content"
				},
				children: [contentWrapper]
			}));
			const header = this.prepareHeaderLayout();
			contentWrapper.appendChild(header);
			const detailWrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail"
				},
				html: description
			});
			contentWrapper.appendChild(detailWrapper);

			//region Author
			const authorNode = this.prepareAuthorLayout();
			if (authorNode) {
				contentWrapper.appendChild(authorNode);
			}
			//endregion

			//region  Actions
			this._actionContainer = BX.create("SPAN", {
				attrs: {
					className: "crm-entity-stream-content-detail-action"
				}
			});
			contentWrapper.appendChild(this._actionContainer);
			//endregion

			return wrapper;
		}
		prepareActions() {}
		showActions(show) {
			if (this._actionContainer) {
				this._actionContainer.style.display = show ? "" : "none";
			}
		}
		static create(id, settings) {
			const self = new Wait();
			self.initialize(id, settings);
			return self;
		}
	};

	/** @memberof BX.Crm.Timeline.Items */
	class Document extends HistoryActivity {
		constructor() {
			super();
		}
		getTitle() {
			const typeCategoryId = BX.prop.getInteger(this._data, "TYPE_CATEGORY_ID", 0);
			if (typeCategoryId === 3) {
				return BX.Loc.getMessage('CRM_TIMELINE_DOCUMENT_VIEWED');
			}
			return this.getMessage("document");
		}
		prepareTitleLayout() {
			return BX.create("SPAN", {
				attrs: {
					className: "crm-entity-stream-content-event-title"
				},
				children: [BX.create("A", {
					attrs: {
						href: "#"
					},
					events: {
						"click": BX.delegate(this.editDocument, this)
					},
					text: this.getTitle()
				})]
			});
		}
		prepareTitleStatusLayout() {
			const typeCategoryId = BX.prop.getInteger(this._data, "TYPE_CATEGORY_ID", 0);
			if (typeCategoryId === 3) {
				return BX.create("SPAN", {
					attrs: {
						className: "crm-entity-stream-content-event-done"
					},
					text: BX.Loc.getMessage('CRM_TIMELINE_DOCUMENT_VIEWED_STATUS')
				});
			}
			if (typeCategoryId === 2) {
				return BX.create("SPAN", {
					attrs: {
						className: "crm-entity-stream-content-event-sent"
					},
					text: BX.Loc.getMessage('CRM_TIMELINE_DOCUMENT_CREATED_STATUS')
				});
			}
			return null;
		}
		prepareTimeLayout() {
			return BX.create("SPAN", {
				attrs: {
					className: "crm-entity-stream-content-event-time"
				},
				text: this.formatTime(this.getCreatedTime())
			});
		}
		isContextMenuEnabled() {
			const typeCategoryId = BX.prop.getInteger(this._data, "TYPE_CATEGORY_ID", 0);
			return typeCategoryId !== 3;
		}
		prepareHeaderLayout() {
			const header = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-header"
				}
			});
			header.appendChild(this.prepareTitleLayout());
			const statusLayout = this.prepareTitleStatusLayout();
			if (statusLayout) {
				header.appendChild(statusLayout);
			}
			header.appendChild(this.prepareTimeLayout());
			return header;
		}
		prepareContent() {
			const text = this.getTextDataParam("COMMENT", "");
			const wrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section crm-entity-stream-section-history crm-entity-stream-section-document"
				}
			});
			if (this.isFixed()) {
				BX.addClass(wrapper, 'crm-entity-stream-section-top-fixed');
			}
			wrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section-icon crm-entity-stream-section-icon-document"
				}
			}));
			if (this.isContextMenuEnabled()) {
				wrapper.appendChild(this.prepareContextMenuButton());
			}
			if (!this.isReadOnly()) {
				wrapper.appendChild(this.prepareFixedSwitcherLayout());
			}
			const contentWrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-event"
				}
			});
			wrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section-content"
				},
				children: [contentWrapper]
			}));
			const header = this.prepareHeaderLayout();
			contentWrapper.appendChild(header);
			const detailWrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail"
				},
				html: text
			});
			const title = BX.findChildByClassName(detailWrapper, 'document-title-link');
			if (title) {
				BX.bind(title, 'click', BX.proxy(this.editDocument, this));
			}
			contentWrapper.appendChild(detailWrapper);

			//region Author
			const authorNode = this.prepareAuthorLayout();
			if (authorNode) {
				contentWrapper.appendChild(authorNode);
			}
			//endregion

			//region  Actions
			this._actionContainer = BX.create("SPAN", {
				attrs: {
					className: "crm-entity-stream-content-detail-action"
				}
			});
			contentWrapper.appendChild(this._actionContainer);
			//endregion

			return wrapper;
		}
		prepareActions() {}
		showActions(show) {
			if (this._actionContainer) {
				this._actionContainer.style.display = show ? "" : "none";
			}
		}
		prepareContextMenuItems() {
			const menuItems = [];
			if (!this.isReadOnly()) {
				menuItems.push({
					id: "edit",
					text: this.getMessage("menuEdit"),
					onclick: BX.delegate(this.editDocument, this)
				});
				menuItems.push({
					id: "remove",
					text: this.getMessage("menuDelete"),
					onclick: BX.delegate(this.confirmDelete, this)
				});
				if (this.isFixed() || this._fixedHistory.findItemById(this._id)) {
					menuItems.push({
						id: "unfasten",
						text: this.getMessage("menuUnfasten"),
						onclick: BX.delegate(this.unfasten, this)
					});
				} else {
					menuItems.push({
						id: "fasten",
						text: this.getMessage("menuFasten"),
						onclick: BX.delegate(this.fasten, this)
					});
				}
			}
			return menuItems;
		}
		confirmDelete() {
			this.closeContextMenu();
			this._detetionConfirmDlgId = "entity_timeline_deletion_" + this.getId() + "_confirm";
			let dlg = BX.Crm.ConfirmationDialog.get(this._detetionConfirmDlgId);
			if (!dlg) {
				dlg = BX.Crm.ConfirmationDialog.create(this._detetionConfirmDlgId, {
					title: this.getMessage("removeConfirmTitle"),
					content: this.getMessage('documentRemove'),
					background: 'vibrant'
				});
			}
			dlg.open().then(BX.delegate(this.onConfirmDelete, this), BX.DoNothing);
		}
		onConfirmDelete(result) {
			if (BX.prop.getBoolean(result, "cancel", true)) {
				return;
			}
			this.deleteDocument();
		}
		deleteDocument() {
			if (this._isRequestRunning) {
				return;
			}
			this._isRequestRunning = true;
			BX.ajax({
				url: this._history._serviceUrl,
				method: "POST",
				dataType: "json",
				data: {
					"ACTION": "DELETE_DOCUMENT",
					"OWNER_TYPE_ID": this.getOwnerTypeId(),
					"OWNER_ID": this.getOwnerId(),
					"ID": this.getId()
				},
				onsuccess: BX.delegate(function (result) {
					this._isRequestRunning = false;
					if (BX.type.isNotEmptyString(result.ERROR)) {
						// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-dialogs
						crm_timeline_dialog.alert({
							content: main_core.Tag.render`<div>${main_core.Text.encode(result.ERROR)}</div>`
						});
					} else {
						const deleteItem = this._history.findItemById(this._id);
						if (deleteItem instanceof Document) {
							deleteItem.clearAnimate();
						}
						const deleteFixedItem = this._fixedHistory.findItemById(this._id);
						if (deleteFixedItem instanceof Document) {
							deleteFixedItem.clearAnimate();
						}
					}
				}, this),
				onfailure: BX.delegate(function () {
					this._isRequestRunning = false;
				}, this)
			});
		}
		editDocument() {
			const documentId = this.getData().DOCUMENT_ID || 0;
			if (documentId > 0) {
				let url = '/bitrix/components/bitrix/crm.document.view/slider.php';
				url = BX.util.add_url_param(url, {
					documentId: documentId
				});
				if (BX.SidePanel) {
					BX.SidePanel.Instance.open(url, {
						width: 1060
					});
				} else {
					top.location.href = url;
				}
			}
		}
		updateWrapper() {
			const wrapper = this.getWrapper();
			if (wrapper) {
				const detailWrapper = BX.findChildByClassName(wrapper, 'crm-entity-stream-content-detail');
				if (detailWrapper) {
					BX.adjust(detailWrapper, {
						html: this.getTextDataParam("COMMENT", "")
					});
					const title = BX.findChildByClassName(detailWrapper, 'document-title-link');
					if (title) {
						BX.bind(title, 'click', BX.proxy(this.editDocument, this));
					}
				}
			}
		}
		static create(id, settings) {
			const self = new Document();
			self.initialize(id, settings);
			return self;
		}
	}

	/** @memberof BX.Crm.Timeline.Items */
	class Sender extends HistoryActivity {
		constructor() {
			super();
		}
		getDataSetting(name) {
			const settings = this.getObjectDataParam('SETTINGS') || {};
			return settings[name] || null;
		}
		getMessage(name) {
			const m = Sender.messages;
			return m.hasOwnProperty(name) ? m[name] : name;
		}
		getTitle() {
			return this.getDataSetting('messageName');
		}
		prepareTitleLayout() {
			const self = this;
			return BX.create("SPAN", {
				attrs: {
					className: "crm-entity-stream-content-event-title"
				},
				children: [this.isRemoved() ? BX.create("SPAN", {
					text: this.getTitle()
				}) : BX.create("A", {
					attrs: {
						href: ""
					},
					events: {
						"click": function (e) {
							if (BX.SidePanel) {
								BX.SidePanel.Instance.open(self.getDataSetting('path'));
							} else {
								top.location.href = self.getDataSetting('path');
							}
							e.preventDefault();
							e.stopPropagation();
						}
					},
					text: this.getTitle()
				})]
			});
		}
		prepareTimeLayout() {
			return BX.create("SPAN", {
				attrs: {
					className: "crm-entity-stream-content-event-time"
				},
				text: this.formatTime(this.getCreatedTime())
			});
		}
		prepareStatusLayout() {
			let layoutClassName, textCaption;
			if (this.getDataSetting('isError')) {
				textCaption = this.getMessage('error');
				layoutClassName = "crm-entity-stream-content-event-missing";
			} else if (this.getDataSetting('isUnsub')) {
				textCaption = this.getMessage('unsub');
				layoutClassName = "crm-entity-stream-content-event-missing";
			} else if (this.getDataSetting('isClick')) {
				textCaption = this.getMessage('click');
				layoutClassName = "crm-entity-stream-content-event-successful";
			} else {
				textCaption = this.getMessage('read');
				layoutClassName = "crm-entity-stream-content-event-skipped";
			}
			return BX.create("SPAN", {
				attrs: {
					className: layoutClassName
				},
				text: textCaption
			});
		}
		prepareHeaderLayout() {
			const header = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-header"
				}
			});
			header.appendChild(this.prepareTitleLayout());
			if (this.getDataSetting('isError') || this.getDataSetting('isRead') || this.getDataSetting('isUnsub')) {
				header.appendChild(this.prepareStatusLayout());
			}
			header.appendChild(this.prepareTimeLayout());
			return header;
		}
		isRemoved() {
			return !this.getDataSetting('letterTitle');
		}
		prepareContent() {
			const description = this.isRemoved() ? this.getMessage('removed') : this.getMessage('title') + ': ' + this.getDataSetting('letterTitle');
			const wrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section crm-entity-stream-section-history crm-entity-stream-section-wait"
				}
			});
			wrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section-icon crm-entity-stream-section-icon-complete"
				}
			}));
			const contentWrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-event"
				}
			});
			wrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section-content"
				},
				children: [contentWrapper]
			}));
			const header = this.prepareHeaderLayout();
			contentWrapper.appendChild(header);
			const detailWrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail"
				},
				html: description
			});
			contentWrapper.appendChild(detailWrapper);

			//region Author
			const authorNode = this.prepareAuthorLayout();
			if (authorNode) {
				contentWrapper.appendChild(authorNode);
			}
			//endregion

			return wrapper;
		}
		static create(id, settings) {
			const self = new Sender();
			self.initialize(id, settings);
			return self;
		}
	}

	/** @memberof BX.Crm.Timeline.Items */
	class Bizproc extends History$1 {
		constructor() {
			super();
		}
		getTitle() {
			const type = this.getTextDataParam("TYPE");
			if (type === 'AUTOMATION_DEBUG_INFORMATION') {
				return this.getMessage('automationDebugger');
			}
			return this.getMessage("bizproc");
		}
		prepareContent() {
			const wrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section crm-entity-stream-section-history crm-entity-stream-section-bp"
				}
			});
			wrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section-icon crm-entity-stream-section-icon-bp"
				}
			}));
			const content = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-event"
				}
			});
			const header = this.prepareHeaderLayout();
			content.appendChild(header);
			content.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail"
				},
				children: [BX.create("DIV", {
					attrs: {
						className: "crm-entity-stream-content-detail-description"
					},
					html: this.prepareContentTextHtml()
				})]
			}));

			//region Author
			const authorNode = this.prepareAuthorLayout();
			if (authorNode) {
				content.appendChild(authorNode);
			}
			//endregion

			wrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section-content"
				},
				children: [content]
			}));
			return wrapper;
		}
		prepareContentTextHtml() {
			const type = this.getTextDataParam("TYPE");
			if (type === 'ACTIVITY_ERROR') {
				return '<strong>#TITLE#</strong>: #ERROR_TEXT#'.replace('#TITLE#', BX.util.htmlspecialchars(this.getTextDataParam("ACTIVITY_TITLE"))).replace('#ERROR_TEXT#', BX.util.htmlspecialchars(this.getTextDataParam("ERROR_TEXT")));
			} else if (type === 'AUTOMATION_DEBUG_INFORMATION') {
				return BX.Text.encode(this.getTextDataParam('AUTOMATION_DEBUG_TEXT'));
			}
			const workflowName = this.getTextDataParam("WORKFLOW_TEMPLATE_NAME");
			const workflowStatus = this.getTextDataParam("WORKFLOW_STATUS_NAME");
			if (!workflowName || workflowStatus !== 'Created' && workflowStatus !== 'Completed' && workflowStatus !== 'Terminated') {
				return BX.util.htmlspecialchars(this.getTextDataParam("COMMENT"));
			}
			let label = BX.message('CRM_TIMELINE_BIZPROC_CREATED');
			if (workflowStatus === 'Completed') {
				label = BX.message('CRM_TIMELINE_BIZPROC_COMPLETED');
			} else if (workflowStatus === 'Terminated') {
				label = BX.message('CRM_TIMELINE_BIZPROC_TERMINATED');
			}
			return BX.util.htmlspecialchars(label).replace('#NAME#', '<strong>' + BX.util.htmlspecialchars(workflowName) + '</strong>');
		}
		static create(id, settings) {
			const self = new Bizproc();
			self.initialize(id, settings);
			return self;
		}
	}

	/** @memberof BX.Crm.Timeline.Streams */
	class History extends Steam {
		constructor() {
			super();
			this._items = [];
			this._wrapper = null;
			this._fixedHistory = null;
			this._emptySection = null;
			this._currentDaySection = null;
			this._lastDaySection = null;
			this._lastDate = null;
			this._anchor = null;
			this._history = this;
			this._enableLoading = false;
			this._navigation = null;
			this._scrollHandler = null;
			this._loadingWaiter = null;
			this._filterId = "";
			this._isFilterApplied = false;
			this._isFilterShown = false;
			this._isRequestRunning = false;
			this._filterButton = null;
			this._filterWrapper = null;
			this._filterResultStub = null;
		}
		doInitialize() {
			this._fixedHistory = this.getSetting("fixedHistory");
			this._ownerTypeId = this.getSetting("ownerTypeId");
			this._ownerId = this.getSetting("ownerId");
			this._serviceUrl = this.getSetting("serviceUrl", "");
			if (!this.isStubMode()) {
				let itemData = this.getSetting("itemData");
				if (!BX.type.isArray(itemData)) {
					itemData = [];
				}
				let i, length, item;
				for (i = 0, length = itemData.length; i < length; i++) {
					item = this.createItem(itemData[i]);
					if (item) {
						this._items.push(item);
					}
				}
				this._navigation = this.getSetting("navigation", {});
				this._filterWrapper = BX("timeline-filter");
				this._filterId = BX.prop.getString(this._settings, "filterId", this._id);
				this._isFilterShown = this._filterWrapper && BX.hasClass(this._filterWrapper, "crm-entity-stream-section-filter-show");
				this._isFilterApplied = BX.prop.getBoolean(this._settings, "isFilterApplied", false);
				BX.addCustomEvent("BX.Main.Filter:apply", this.onFilterApply.bind(this));
			}
		}
		layout() {
			this._wrapper = BX.create("DIV", {});
			this._container.appendChild(this._wrapper);
			const now = BX.prop.extractDate(new Date());
			let i, length, item;
			if (!this.isStubMode()) {
				if (this._filterWrapper) {
					const closeFilterButton = this._filterWrapper.querySelector(".crm-entity-stream-filter-close");
					if (closeFilterButton) {
						BX.bind(closeFilterButton, "click", this.onFilterClose.bind(this));
					}
				}
				for (i = 0, length = this._items.length; i < length; i++) {
					item = this._items[i];
					item.setContainer(this._wrapper);
					const created = item.getCreatedDate();
					if (this._lastDate === null || this._lastDate.getTime() !== created.getTime()) {
						this._lastDate = created;
						if (now.getTime() === created.getTime()) {
							this._currentDaySection = this._lastDaySection = this.createCurrentDaySection();
							this._wrapper.appendChild(this._currentDaySection);
						} else {
							this._lastDaySection = this.createDaySection(this._lastDate);
							this._wrapper.appendChild(this._lastDaySection);
						}
					}
					item._lastDate = this._lastDate;
					item.layout();
				}
				this.enableLoading(this._items.length > 0);
				this.refreshLayout();
			} else {
				this._currentDaySection = this._lastDaySection = this.createCurrentDaySection();
				this._wrapper.appendChild(this._currentDaySection);
				this._wrapper.appendChild(BX.create("DIV", {
					attrs: {
						className: "crm-entity-stream-section crm-entity-stream-section-createEntity crm-entity-stream-section-last"
					},
					children: [BX.create("DIV", {
						attrs: {
							className: "crm-entity-stream-section-icon crm-entity-stream-section-icon-info"
						}
					}), BX.create("DIV", {
						attrs: {
							className: "crm-entity-stream-section-content"
						},
						children: [BX.create("DIV", {
							attrs: {
								className: "crm-entity-stream-content-event"
							},
							children: [BX.create("DIV", {
								attrs: {
									className: "crm-entity-stream-content-header"
								}
							}), BX.create("DIV", {
								attrs: {
									className: "crm-entity-stream-content-detail"
								},
								text: BX.message("CRM_TIMELINE_HISTORY_STUB")
							})]
						})]
					})]
				}));
			}
			this._manager.processHistoryLayoutChange();
		}
		refreshLayout() {
			if (this._filterWrapper) {
				if (this._wrapper.firstChild && this._filterWrapper !== this._wrapper.firstChild) {
					this._wrapper.insertBefore(this._filterWrapper, this._wrapper.firstChild);
				} else if (!this._wrapper.firstChild && this._filterWrapper.parentNode !== this._wrapper) {
					this._wrapper.appendChild(this._filterWrapper);
				}
			}
			this.adjustFilterButton();
			const length = this._items.length;
			if (length === 0 && this._isFilterApplied) {
				if (!this._filterEmptyResultSection) {
					this._filterEmptyResultSection = this.createFilterEmptyResultSection();
				}
				this._wrapper.appendChild(this._filterEmptyResultSection);
				return;
			}
			if (this._filterEmptyResultSection) {
				this._filterEmptyResultSection = BX.remove(this._filterEmptyResultSection);
			}
			if (length === 0) {
				return;
			}
			for (let i = 0; i < length - 1; i++) {
				const item = this._items[i];
				if (item.isTerminated()) {
					item.markAsTerminated(false);
				}
			}
			this._items[length - 1].markAsTerminated(true);
		}
		calculateItemIndex(item) {
			return 0;
		}
		checkItemForTermination(item) {
			return this.getLastItem() === item;
		}
		hasContent() {
			return this._items.length > 0 || this._isFilterApplied || this._isStubMode;
		}
		getItems() {
			return this._items;
		}
		setItems(items) {
			this._items = items;
		}
		getItemByIndex(index) {
			return index < this._items.length ? this._items[index] : null;
		}
		getItemCount() {
			return this._items.length;
		}
		getItemsByAssociatedEntity($entityTypeId, entityId) {
			if (!BX.type.isNumber($entityTypeId)) {
				$entityTypeId = parseInt($entityTypeId);
			}
			if (!BX.type.isNumber(entityId)) {
				entityId = parseInt(entityId);
			}
			if (isNaN($entityTypeId) || $entityTypeId <= 0 || isNaN(entityId) || entityId <= 0) {
				return [];
			}
			const results = [];
			for (let i = 0, l = this._items.length; i < l; i++) {
				const item = this._items[i];
				if (item.getAssociatedEntityTypeId() === $entityTypeId && item.getAssociatedEntityId() === entityId) {
					results.push(item);
				}
			}
			return results;
		}
		createFilterEmptyResultSection() {
			return BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section crm-entity-stream-section-filter-empty"
				},
				children: [BX.create("DIV", {
					attrs: {
						className: "crm-entity-stream-section-content"
					},
					children: [BX.create("DIV", {
						attrs: {
							className: "crm-entity-stream-filter-empty"
						},
						children: [BX.create("DIV", {
							attrs: {
								className: "crm-entity-stream-filter-empty-img"
							}
						}), BX.create("DIV", {
							attrs: {
								className: "crm-entity-stream-filter-empty-text"
							},
							text: this.getMessage("filterEmptyResultStub")
						})]
					})]
				})]
			});
		}
		adjustFilterButton() {
			if (!this._filterWrapper) {
				return;
			}
			if (!this._isFilterShown && this._items.length === 0) {
				if (!this._emptySection) {
					this._emptySection = this.createEmptySection();
				}
				this._wrapper.insertBefore(this._emptySection, this._filterWrapper);
			} else if (this._emptySection) {
				this._emptySection = BX.remove(this._emptySection);
			}
			if (!this._filterButton) {
				this._filterButton = BX.create("BUTTON", {
					attrs: {
						className: "crm-entity-stream-filter-label"
					},
					text: this.getMessage("filterButtonCaption")
				});
				BX.bind(this._filterButton, "click", function (e) {
					this.showFilter();
				}.bind(this));
			}
			const section = this._wrapper.querySelector(".crm-entity-stream-section-today-label, .crm-entity-stream-section-planned-label, .crm-entity-stream-section-history-label");
			if (section) {
				const sectionWrapper = section.querySelector(".crm-entity-stream-section-content");
				if (sectionWrapper) {
					if (this._filterButton.parentNode !== sectionWrapper) {
						sectionWrapper.appendChild(this._filterButton);
					}
				}
			}
			if (this._isFilterApplied) {
				BX.addClass(this._filterButton, "crm-entity-stream-filter-label-active");
			} else {
				BX.removeClass(this._filterButton, "crm-entity-stream-filter-label-active");
			}
		}
		showFilter(params) {
			if (!this._filterWrapper) {
				return;
			}
			BX.removeClass(this._filterWrapper, "crm-entity-stream-section-filter-hide");
			BX.addClass(this._filterWrapper, "crm-entity-stream-section-filter-show");
			this._isFilterShown = true;
			if (BX.prop.getBoolean(params, "enableAdjust", true)) {
				this.adjustFilterButton();
			}
		}
		hideFilter(params) {
			if (!this._filterWrapper) {
				return;
			}
			BX.removeClass(this._filterWrapper, "crm-entity-stream-section-filter-show");
			BX.addClass(this._filterWrapper, "crm-entity-stream-section-filter-hide");
			this._isFilterShown = false;
			if (BX.prop.getBoolean(params, "enableAdjust", true)) {
				this.adjustFilterButton();
			}
		}
		onFilterClose(e) {
			this.hideFilter();
			window.setTimeout(function () {
				const filter = BX.Main.filterManager.getById(this._filterId);
				if (filter) {
					filter.resetFilter();
				}
			}.bind(this), 500);
		}
		createEmptySection() {
			return BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section crm-entity-stream-section-planned-label"
				},
				children: [BX.create("DIV", {
					attrs: {
						className: "crm-entity-stream-section-content"
					}
				})]
			});
		}
		createCurrentDaySection() {
			let formattedDate = this.formatDate(BX.prop.extractDate(new Date()));
			formattedDate = formattedDate[0].toUpperCase() + formattedDate.substring(1);
			return BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section crm-entity-stream-section-today-label"
				},
				children: [BX.create("DIV", {
					attrs: {
						className: "crm-entity-stream-section-content"
					},
					children: [BX.create("DIV", {
						attrs: {
							className: "crm-entity-stream-today-label"
						},
						text: formattedDate
					})]
				})]
			});
		}
		createDaySection(date) {
			let formattedDate = this.formatDate(date);
			formattedDate = formattedDate[0].toUpperCase() + formattedDate.substring(1);
			return BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section crm-entity-stream-section-history-label"
				},
				children: [BX.create("DIV", {
					attrs: {
						className: "crm-entity-stream-section-content"
					},
					children: [BX.create("DIV", {
						attrs: {
							className: "crm-entity-stream-history-label"
						},
						text: formattedDate
					})]
				})]
			});
		}
		createAnchor(index) {
			if (this._emptySection) {
				this._emptySection = BX.remove(this._emptySection);
			}
			if (this._currentDaySection === null) {
				this._currentDaySection = this.createCurrentDaySection();
				if (this._wrapper.firstChild) {
					this._wrapper.insertBefore(this._currentDaySection, this._wrapper.firstChild);
				} else {
					this._wrapper.appendChild(this._currentDaySection);
				}
			}
			if (this._anchor === null) {
				this._anchor = BX.create("DIV", {
					attrs: {
						className: "crm-entity-stream-section crm-entity-stream-section-shadow"
					}
				});
				if (this._currentDaySection.nextSibling) {
					this._wrapper.insertBefore(this._anchor, this._currentDaySection.nextSibling);
				} else {
					this._wrapper.appendChild(this._anchor);
				}
			}
			return this._anchor;
		}
		createActivityItem(data) {
			const typeId = BX.prop.getInteger(data, "TYPE_ID", Item$1.undefined);
			const typeCategoryId = BX.prop.getInteger(data, "TYPE_CATEGORY_ID", 0);
			const providerId = BX.prop.getString(BX.prop.getObject(data, "ASSOCIATED_ENTITY", {}), "PROVIDER_ID", "");
			if (typeId !== Item$1.activity) {
				return null;
			}
			if (typeCategoryId === BX.CrmActivityType.email) {
				return Email$1.create(data["ID"], {
					history: this._history,
					fixedHistory: this._fixedHistory,
					container: this._wrapper,
					activityEditor: this._activityEditor,
					data: data
				});
			}
			if (typeCategoryId === BX.CrmActivityType.call) {
				return Call$1.create(data["ID"], {
					history: this._history,
					fixedHistory: this._fixedHistory,
					container: this._wrapper,
					activityEditor: this._activityEditor,
					data: data
				});
			} else if (typeCategoryId === BX.CrmActivityType.meeting) {
				return Meeting$1.create(data["ID"], {
					history: this._history,
					fixedHistory: this._fixedHistory,
					container: this._wrapper,
					activityEditor: this._activityEditor,
					data: data
				});
			} else if (typeCategoryId === BX.CrmActivityType.task) {
				return Task$1.create(data["ID"], {
					history: this._history,
					fixedHistory: this._fixedHistory,
					container: this._wrapper,
					activityEditor: this._activityEditor,
					data: data
				});
			} else if (typeCategoryId === BX.CrmActivityType.provider) {
				if (providerId === "CRM_WEBFORM") {
					return WebForm$1.create(data["ID"], {
						history: this._history,
						fixedHistory: this._fixedHistory,
						container: this._wrapper,
						activityEditor: this._activityEditor,
						data: data
					});
				} else if (providerId === 'CRM_REQUEST') {
					return Request$1.create(data["ID"], {
						history: this._history,
						fixedHistory: this._fixedHistory,
						container: this._wrapper,
						activityEditor: this._activityEditor,
						data: data
					});
				} else if (providerId === "IMOPENLINES_SESSION") {
					return OpenLine$1.create(data["ID"], {
						history: this._history,
						fixedHistory: this._fixedHistory,
						container: this._wrapper,
						activityEditor: this._activityEditor,
						data: data
					});
				} else if (providerId === 'REST_APP') {
					return Rest$1.create(data["ID"], {
						history: this._history,
						fixedHistory: this._fixedHistory,
						container: this._wrapper,
						activityEditor: this._activityEditor,
						data: data
					});
				} else if (providerId === 'VISIT_TRACKER') {
					return Visit.create(data["ID"], {
						history: this,
						fixedHistory: this._fixedHistory,
						container: this._wrapper,
						activityEditor: this._activityEditor,
						data: data
					});
				} else if (providerId === 'ZOOM') {
					return Zoom$1.create(data["ID"], {
						history: this,
						fixedHistory: this._fixedHistory,
						container: this._wrapper,
						activityEditor: this._activityEditor,
						data: data
					});
				} else if (providerId === 'CRM_CALL_TRACKER') {
					return Call$1.create(data["ID"], {
						history: this,
						fixedHistory: this._fixedHistory,
						container: this._wrapper,
						activityEditor: this._activityEditor,
						data: data
					});
				}
			}
			return HistoryActivity.create(data["ID"], {
				history: this._history,
				fixedHistory: this._fixedHistory,
				container: this._wrapper,
				activityEditor: this._activityEditor,
				data: data
			});
		}
		createExternalNotificationItem(data) {
			const typeId = BX.prop.getInteger(data, "TYPE_CATEGORY_ID", 0);
			const changedFieldName = BX.prop.getString(data, 'CHANGED_FIELD_NAME', '');
			if (typeId === Item$1.modification && changedFieldName === 'STATUS_ID') {
				return ExternalNoticeStatusModification.create(data["ID"], {
					history: this._history,
					container: this._wrapper,
					activityEditor: this._activityEditor,
					data: data
				});
			}
			return ExternalNoticeModification.create(data["ID"], {
				history: this._history,
				container: this._wrapper,
				activityEditor: this._activityEditor,
				data: data
			});
		}
		createItem(data) {
			if (data.hasOwnProperty('type')) {
				return crm_timeline_item.ConfigurableItem.create(data.id, {
					timelineId: this.getId(),
					container: this.getWrapper(),
					itemClassName: this.getItemClassName(),
					useShortTimeFormat: this.getStreamType() === crm_timeline_item.StreamType.history,
					isReadOnly: this.isReadOnly(),
					currentUser: this._manager.getCurrentUser(),
					ownerTypeId: this._manager.getOwnerTypeId(),
					ownerId: this._manager.getOwnerId(),
					streamType: this.getStreamType(),
					data: data
				});
			}
			const typeId = BX.prop.getInteger(data, "TYPE_ID", Item$1.undefined);
			BX.prop.getInteger(data, "TYPE_CATEGORY_ID", 0);
			if (typeId === Item$1.activity) {
				return this.createActivityItem(data);
			} else if (typeId === Item$1.externalNotification) {
				return this.createExternalNotificationItem(data);
			} else if (typeId === Item$1.creation) {
				return Creation.create(data["ID"], {
					history: this._history,
					container: this._wrapper,
					activityEditor: this._activityEditor,
					data: data
				});
			} else if (typeId === Item$1.restoration) {
				return Restoration.create(data["ID"], {
					history: this._history,
					container: this._wrapper,
					data: data
				});
			} else if (typeId === Item$1.link) {
				return Link.create(data["ID"], {
					history: this,
					container: this._wrapper,
					activityEditor: this._activityEditor,
					data: data
				});
			} else if (typeId === Item$1.unlink) {
				return Unlink.create(data["ID"], {
					history: this,
					container: this._wrapper,
					activityEditor: this._activityEditor,
					data: data
				});
			} else if (typeId === Item$1.mark) {
				return Mark.create(data["ID"], {
					history: this._history,
					container: this._wrapper,
					activityEditor: this._activityEditor,
					fixedHistory: this._fixedHistory,
					data: data
				});
			} else if (typeId === Item$1.comment) {
				return Comment$2.create(data["ID"], {
					history: this._history,
					fixedHistory: this._fixedHistory,
					container: this._wrapper,
					activityEditor: this._activityEditor,
					data: data
				});
			} else if (typeId === Item$1.wait) {
				return Wait$1.create(data["ID"], {
					history: this._history,
					fixedHistory: this._fixedHistory,
					container: this._wrapper,
					activityEditor: this._activityEditor,
					data: data
				});
			} else if (typeId === Item$1.document) {
				return Document.create(data["ID"], {
					history: this._history,
					fixedHistory: this._fixedHistory,
					container: this._wrapper,
					activityEditor: this._activityEditor,
					data: data
				});
			} else if (typeId === Item$1.sender) {
				return Sender.create(data["ID"], {
					history: this,
					container: this._wrapper,
					activityEditor: this._activityEditor,
					data: data
				});
			} else if (typeId === Item$1.modification) {
				return Modification.create(data["ID"], {
					history: this._history,
					container: this._wrapper,
					activityEditor: this._activityEditor,
					data: data
				});
			} else if (typeId === Item$1.conversion) {
				return Conversion.create(data["ID"], {
					history: this._history,
					container: this._wrapper,
					activityEditor: this._activityEditor,
					data: data
				});
			} else if (typeId === Item$1.bizproc) {
				return Bizproc.create(data["ID"], {
					history: this._history,
					fixedHistory: this._fixedHistory,
					container: this._wrapper,
					activityEditor: this._activityEditor,
					data: data
				});
			}
			return History$1.create(data["ID"], {
				history: this._history,
				fixedHistory: this._fixedHistory,
				container: this._wrapper,
				activityEditor: this._activityEditor,
				data: data
			});
		}
		getWrapper() {
			return this._wrapper;
		}
		getItemClassName() {
			return 'crm-entity-stream-section crm-entity-stream-section-history';
		}
		addItem(item, index) {
			if (!BX.type.isNumber(index) || index < 0) {
				index = this.calculateItemIndex(item);
			}
			if (index < this._items.length) {
				this._items.splice(index, 0, item);
			} else {
				this._items.push(item);
			}
			this.refreshLayout();
			this._manager.processHistoryLayoutChange();
		}
		deleteItem(item) {
			const index = this.getItemIndex(item);
			if (index < 0) {
				return;
			}
			item.clearLayout();
			this.removeItemByIndex(index);
			this.refreshLayout();
			this._manager.processHistoryLayoutChange();
		}
		resetLayout() {
			let i;
			for (i = this._items.length - 1; i >= 0; i--) {
				this._items[i].clearLayout();
			}
			this._items = [];
			this._currentDaySection = this._lastDaySection = this._emptySection = this._filterEmptyResultSection = null;
			this._anchor = null;
			this._lastDate = null;

			//Clean wrapper. Skip filter for prevent trembling.
			const children = [];
			let child;
			for (i = 0; child = this._wrapper.children[i]; i++) {
				if (child !== this._filterWrapper) {
					children.push(child);
				}
			}
			for (i = 0; child = children[i]; i++) {
				this._wrapper.removeChild(child);
			}
		}
		onWindowScroll(e) {
			if (!this._loadingWaiter || !this._enableLoading || this._isRequestRunning) {
				return;
			}
			const pos = this._loadingWaiter.getBoundingClientRect();
			if (pos.top <= document.documentElement.clientHeight) {
				this.loadItems();
			}
		}
		onFilterApply(id, data, ctx, promise, params) {
			if (id !== this._filterId) {
				return;
			}
			params.autoResolve = false;
			this._isFilterApplied = BX.prop.getString(data, "action", "") === "apply";
			this._isRequestRunning = true;
			BX.CrmDataLoader.create(this._id, {
				serviceUrl: this.getSetting("serviceUrl", ""),
				action: "GET_HISTORY_ITEMS",
				params: {
					"GUID": this._id,
					"OWNER_TYPE_ID": this._manager.getOwnerTypeId(),
					"OWNER_ID": this._manager.getOwnerId()
				}
			}).load(function (sender, result) {
				this.resetLayout();
				this.bulkCreateItems(BX.prop.getArray(result, "HISTORY_ITEMS", []));
				this.setNavigation(BX.prop.getObject(result, "HISTORY_NAVIGATION", {}));
				this.refreshLayout();
				if (this._items.length > 0) {
					this._manager.processHistoryLayoutChange();
				}
				promise.fulfill();
				this._isRequestRunning = false;
			}.bind(this));
		}
		bulkCreateItems(itemData) {
			const length = itemData.length;
			if (length === 0) {
				return;
			}
			if (this._filterEmptyResultSection) {
				this._filterEmptyResultSection = BX.remove(this._filterEmptyResultSection);
			}
			const now = BX.prop.extractDate(new Date());
			let i, item;
			for (i = 0; i < length; i++) {
				const itemId = BX.prop.getInteger(itemData[i], 'id', BX.prop.getInteger(itemData[i], 'ID', 0));
				if (itemId <= 0) {
					continue;
				}
				if (this.findItemById(itemId) !== null) {
					continue;
				}
				item = this.createItem(itemData[i]);
				this._items.push(item);
				const created = item.getCreatedDate();
				if (this._lastDate === null || this._lastDate.getTime() !== created.getTime()) {
					this._lastDate = created;
					if (now.getTime() === created.getTime()) {
						this._currentDaySection = this._lastDaySection = this.createCurrentDaySection();
						this._wrapper.appendChild(this._currentDaySection);
					} else {
						this._lastDaySection = this.createDaySection(this._lastDate);
						this._wrapper.appendChild(this._lastDaySection);
					}
				}
				item.layout();
			}
		}
		loadItems() {
			this._isRequestRunning = true;
			BX.CrmDataLoader.create(this._id, {
				serviceUrl: this.getSetting("serviceUrl", ""),
				action: "GET_HISTORY_ITEMS",
				params: {
					"GUID": this._id,
					"OWNER_TYPE_ID": this._manager.getOwnerTypeId(),
					"OWNER_ID": this._manager.getOwnerId(),
					"NAVIGATION": this._navigation
				}
			}).load(function (sender, result) {
				this.bulkCreateItems(BX.prop.getArray(result, "HISTORY_ITEMS", []));
				this.setNavigation(BX.prop.getObject(result, "HISTORY_NAVIGATION", {}));
				this.refreshLayout();
				if (this._items.length > 0) {
					this._manager.processHistoryLayoutChange();
				}
				this._isRequestRunning = false;
			}.bind(this));
		}
		getNavigation() {
			return this._navigation;
		}
		setNavigation(navigation) {
			if (!BX.type.isPlainObject(navigation)) {
				navigation = {};
			}
			this._navigation = navigation;
			this.enableLoading(BX.prop.getString(this._navigation, "OFFSET_TIMESTAMP", "") !== "");
		}
		isLoadingEnabled() {
			return this._enableLoading;
		}
		enableLoading(enable) {
			enable = !!enable;
			if (this._enableLoading === enable) {
				return;
			}
			this._enableLoading = enable;
			if (this._enableLoading) {
				if (this._items.length > 0) {
					this._loadingWaiter = this._items[this._items.length - 1].getWrapper();
				}
				if (!this._scrollHandler) {
					this._scrollHandler = BX.delegate(this.onWindowScroll, this);
					BX.bind(window, "scroll", this._scrollHandler);
				}
			} else {
				this._loadingWaiter = null;
				if (this._scrollHandler) {
					BX.unbind(window, "scroll", this._scrollHandler);
					this._scrollHandler = null;
				}
			}
		}
		getMessage(name) {
			const m = History.messages;
			return m.hasOwnProperty(name) ? m[name] : name;
		}
		animateItemAdding(item) {
			return new Promise(resolve => {
				Expand.create(item.getWrapper(), resolve).run();
			});
		}
		static create(id, settings) {
			const self = new History();
			self.initialize(id, settings);
			History.instances[self.getId()] = self;
			return self;
		}
		static messages = {};
		static instances = {};
	}

	/** @memberof BX.Crm.Timeline.Streams */
	class FixedHistory extends History {
		constructor() {
			super();
			this._items = [];
			this._wrapper = null;
			this._fixedHistory = this;
			this._history = this;
			this._isRequestRunning = false;
		}
		doInitialize() {
			const datetimeFormat = BX.message("FORMAT_DATETIME").replace(/:SS/, "");
			this._timeFormat = BX.date.convertBitrixFormat(datetimeFormat);
			let itemData = this.getSetting("itemData");
			if (!BX.type.isArray(itemData)) {
				itemData = [];
			}
			let i, length, item;
			for (i = 0, length = itemData.length; i < length; i++) {
				item = this.createItem(itemData[i]);
				item._isFixed = true;
				this._items.push(item);
			}
		}
		setHistory(history) {
			this._history = history;
		}
		checkItemForTermination(item) {
			return false;
		}
		layout() {
			this._wrapper = BX.create("DIV", {});
			this.createAnchor();
			this._container.insertBefore(this._wrapper, this._editorContainer.nextElementSibling);
			for (let i = 0; i < this._items.length; i++) {
				this._items[i].setContainer(this._wrapper);
				this._items[i].layout();
			}
			this.refreshLayout();
			this._manager.processHistoryLayoutChange();
		}
		refreshLayout() {}
		formatDate(date) {}
		createCurrentDaySection() {}
		createDaySection(date) {}
		createAnchor(index) {
			this._anchor = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section-fixed-anchor"
				}
			});
			this._wrapper.appendChild(this._anchor);
		}
		onWindowScroll(e) {}
		onItemsLoad(sender, result) {}
		loadItems() {
			this._isRequestRunning = true;
			BX.CrmDataLoader.create(this._id, {
				serviceUrl: this.getSetting("serviceUrl", ""),
				action: "GET_FIXED_HISTORY_ITEMS",
				params: {
					"OWNER_TYPE_ID": this._manager.getOwnerTypeId(),
					"OWNER_ID": this._manager.getOwnerId()
				}
			}).load(BX.delegate(this.onItemsLoad, this));
		}
		addItem(item, index) {
			super.addItem(item, index);
			if (item instanceof CompatibleItem) {
				item._isFixed = true;
			}
		}
		getItemClassName() {
			return 'crm-entity-stream-section crm-entity-stream-section-history crm-entity-stream-section-top-fixed';
		}
		getStreamType() {
			return crm_timeline_item.StreamType.pinned;
		}
		static create(id, settings) {
			let self = new FixedHistory();
			self.initialize(id, settings);
			this.instances[self.getId()] = self;
			return self;
		}
	}
	FixedHistory.instances = {};

	/** @memberof BX.Crm.Timeline.Tools */
	class SchedulePostponeController {
		constructor() {
			this._item = null;
		}
		initialize(id, settings) {
			this._id = BX.type.isNotEmptyString(id) ? id : BX.util.getRandomString(4);
			this._settings = settings ? settings : {};
			this._item = BX.prop.get(this._settings, "item", null);
		}
		getTitle() {
			return this.getMessage("title");
		}
		getCommandList() {
			return [{
				name: "postpone_hour_1",
				title: this.getMessage("forOneHour")
			}, {
				name: "postpone_hour_2",
				title: this.getMessage("forTwoHours")
			}, {
				name: "postpone_hour_3",
				title: this.getMessage("forThreeHours")
			}, {
				name: "postpone_day_1",
				title: this.getMessage("forOneDay")
			}, {
				name: "postpone_day_2",
				title: this.getMessage("forTwoDays")
			}, {
				name: "postpone_day_3",
				title: this.getMessage("forThreeDays")
			}];
		}
		processCommand(command) {
			if (command.indexOf("postpone") !== 0) {
				return false;
			}
			let offset = 0;
			if (command === "postpone_hour_1") {
				offset = 3600;
			} else if (command === "postpone_hour_2") {
				offset = 7200;
			} else if (command === "postpone_hour_3") {
				offset = 10800;
			} else if (command === "postpone_day_1") {
				offset = 86400;
			} else if (command === "postpone_day_2") {
				offset = 172800;
			} else if (command === "postpone_day_3") {
				offset = 259200;
			}
			if (offset > 0 && this._item) {
				this._item.postpone(offset);
			}
			return true;
		}
		getMessage(name) {
			const m = SchedulePostponeController.messages;
			return m.hasOwnProperty(name) ? m[name] : name;
		}
		static create(id, settings) {
			const self = new SchedulePostponeController();
			self.initialize(id, settings);
			return self;
		}
		static messages = {};
	}

	/** @memberof BX.Crm.Timeline.Items.Scheduled */
	class Activity extends Scheduled {
		constructor() {
			super();
			this._postponeController = null;
		}
		getTypeId() {
			return Item$1.activity;
		}
		isDone() {
			const status = BX.prop.getInteger(this.getAssociatedEntityData(), "STATUS");
			return status === BX.CrmActivityStatus.completed || status === BX.CrmActivityStatus.autoCompleted;
		}
		setAsDone(isDone) {
			isDone = !!isDone;
			if (this.isDone() === isDone) {
				return;
			}
			const id = BX.prop.getInteger(this.getAssociatedEntityData(), "ID", 0);
			if (id > 0) {
				this._activityEditor.setActivityCompleted(id, isDone, BX.delegate(this.onSetAsDoneCompleted, this));
			}
		}
		postpone(offset) {
			const id = this.getSourceId();
			if (id > 0 && offset > 0) {
				this._activityEditor.postponeActivity(id, offset, BX.delegate(this.onPosponeCompleted, this));
			}
		}
		view() {
			const id = BX.prop.getInteger(this.getAssociatedEntityData(), "ID", 0);
			if (id > 0) {
				this._activityEditor.viewActivity(id);
			}
		}
		edit() {
			this.closeContextMenu();
			const associatedEntityTypeId = this.getAssociatedEntityTypeId();
			if (associatedEntityTypeId === BX.CrmEntityType.enumeration.activity) {
				const entityData = this.getAssociatedEntityData();
				const id = BX.prop.getInteger(entityData, "ID", 0);
				if (id > 0) {
					this._activityEditor.editActivity(id);
				}
			}
		}
		processRemoval() {
			this.closeContextMenu();
			this._detetionConfirmDlgId = "entity_timeline_deletion_" + this.getId() + "_confirm";
			let dlg = BX.Crm.ConfirmationDialog.get(this._detetionConfirmDlgId);
			if (!dlg) {
				dlg = BX.Crm.ConfirmationDialog.create(this._detetionConfirmDlgId, {
					title: this.getMessage("removeConfirmTitle"),
					content: this.getRemoveMessage(),
					background: 'vibrant'
				});
			}
			dlg.open().then(BX.delegate(this.onRemovalConfirm, this), BX.delegate(this.onRemovalCancel, this));
		}
		getRemoveMessage() {
			return this.getMessage('removeConfirm');
		}
		onRemovalConfirm(result) {
			if (BX.prop.getBoolean(result, "cancel", true)) {
				return;
			}
			this.remove();
		}
		onRemovalCancel() {}
		remove() {
			const associatedEntityTypeId = this.getAssociatedEntityTypeId();
			if (associatedEntityTypeId === BX.CrmEntityType.enumeration.activity) {
				const entityData = this.getAssociatedEntityData();
				const id = BX.prop.getInteger(entityData, "ID", 0);
				if (id > 0) {
					const activityEditor = this._activityEditor;
					const item = activityEditor.getItemById(id);
					if (item) {
						activityEditor.deleteActivity(id, true);
					} else {
						const activityType = activityEditor.getSetting('ownerType', '');
						const activityId = activityEditor.getSetting('ownerID', '');
						const serviceUrl = BX.util.add_url_param(activityEditor.getSetting('serviceUrl', ''), {
							id: id,
							action: 'get_activity',
							ownertype: activityType,
							ownerid: activityId
						});
						BX.ajax({
							'url': serviceUrl,
							'method': 'POST',
							'dataType': 'json',
							'data': {
								'ACTION': 'GET_ACTIVITY',
								'ID': id,
								'OWNER_TYPE': activityType,
								'OWNER_ID': activityId
							},
							onsuccess: BX.delegate(function (data) {
								if (typeof data['ACTIVITY'] !== 'undefined') {
									activityEditor._handleActivityChange(data['ACTIVITY']);
									window.setTimeout(BX.delegate(this.remove, this), 500);
								}
							}, this),
							onfailure: function (data) {}
						});
					}
				}
			}
		}
		getDeadline() {
			const entityData = this.getAssociatedEntityData();
			const time = BX.parseDate(entityData["DEADLINE_SERVER"], false, "YYYY-MM-DD", "YYYY-MM-DD HH:MI:SS");
			if (!time) {
				return null;
			}
			return new crm_timeline_tools.DatetimeConverter(time).toUserTime().getValue();
		}
		getLightTime() {
			const entityData = this.getAssociatedEntityData();
			const time = BX.parseDate(entityData["LIGHT_TIME_SERVER"], false, "YYYY-MM-DD", "YYYY-MM-DD HH:MI:SS");
			if (!time) {
				return null;
			}
			return new crm_timeline_tools.DatetimeConverter(time).toUserTime().getValue();
		}
		getCreatedDate() {
			const entityData = this.getAssociatedEntityData();
			const time = BX.parseDate(entityData["CREATED_SERVER"], false, "YYYY-MM-DD", "YYYY-MM-DD HH:MI:SS");
			if (!time) {
				return null;
			}
			return new crm_timeline_tools.DatetimeConverter(time).toUserTime().getValue();
		}
		isIncomingChannel() {
			if (this.isDone()) {
				return false;
			}
			const entityData = this.getAssociatedEntityData();
			return entityData.hasOwnProperty('IS_INCOMING_CHANNEL') && entityData.IS_INCOMING_CHANNEL === 'Y';
		}
		markAsDone(isDone) {
			isDone = !!isDone;
			this.getAssociatedEntityData()["STATUS"] = isDone ? BX.CrmActivityStatus.completed : BX.CrmActivityStatus.waiting;
		}
		getPrepositionText(direction) {
			return this.getMessage(direction === BX.CrmActivityDirection.incoming ? "from" : "to");
		}
		getTypeDescription(direction) {
			return "";
		}
		isContextMenuEnabled() {
			return !!this.getDeadline() && this.canPostpone() || this.canComplete();
		}
		prepareContent(options) {
			let timeText = '';
			const isIncomingChannel = this.isIncomingChannel();
			if (isIncomingChannel) {
				timeText = this.formatDateTime(this.getCreatedDate());
			} else {
				const deadline = this.getDeadline();
				timeText = deadline ? this.formatDateTime(deadline) : this.getMessage("termless");
			}
			const entityData = this.getAssociatedEntityData();
			const direction = BX.prop.getInteger(entityData, "DIRECTION", 0);
			const isDone = this.isDone();
			const subject = BX.prop.getString(entityData, "SUBJECT", "");
			let description = BX.prop.getString(entityData, "DESCRIPTION_RAW", "");
			const communication = BX.prop.getObject(entityData, "COMMUNICATION", {});
			const title = BX.prop.getString(communication, "TITLE", "");
			const showUrl = BX.prop.getString(communication, "SHOW_URL", "");
			const communicationValue = BX.prop.getString(communication, "TYPE", "") !== "" ? BX.prop.getString(communication, "VALUE", "") : "";
			let wrapperClassName = this.getWrapperClassName();
			if (wrapperClassName !== "") {
				wrapperClassName = this._schedule.getItemClassName() + " " + wrapperClassName;
			} else {
				wrapperClassName = this._schedule.getItemClassName();
			}
			const wrapper = BX.create("DIV", {
				attrs: {
					className: wrapperClassName
				}
			});
			let iconClassName = this.getIconClassName();
			if (this.isCounterEnabled()) {
				iconClassName += " crm-entity-stream-section-counter";
			}
			if (isIncomingChannel) {
				iconClassName += " crm-entity-stream-section-counter --incoming-counter";
			}
			wrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: iconClassName
				}
			}));

			//region Context Menu
			if (this.isContextMenuEnabled()) {
				wrapper.appendChild(this.prepareContextMenuButton());
			}
			//endregion

			const contentWrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section-content"
				}
			});
			wrapper.appendChild(contentWrapper);

			//region Details
			if (description !== "") {
				//trim leading spaces
				description = description.replace(/^\s+/, '');
			}
			const contentInnerWrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-event"
				}
			});
			contentWrapper.appendChild(contentInnerWrapper);
			this._deadlineNode = BX.create("SPAN", {
				attrs: {
					className: "crm-entity-stream-content-event-time"
				},
				text: timeText
			});
			const headerWrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-header"
				}
			});
			headerWrapper.appendChild(BX.create("SPAN", {
				attrs: {
					className: "crm-entity-stream-content-event-title"
				},
				text: this.getTypeDescription(direction)
			}));
			const statusNode = this.getStatusNode();
			if (statusNode) {
				headerWrapper.appendChild(statusNode);
			}
			headerWrapper.appendChild(this._deadlineNode);
			contentInnerWrapper.appendChild(headerWrapper);
			const detailWrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail"
				}
			});
			contentInnerWrapper.appendChild(detailWrapper);
			detailWrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail-title"
				},
				children: [BX.create("A", {
					attrs: {
						href: "#"
					},
					events: {
						"click": this._headerClickHandler
					},
					text: subject
				})]
			}));
			detailWrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail-description"
				},
				text: this.cutOffText(description, 128)
			}));
			const additionalDetails = this.prepareDetailNodes();
			if (BX.type.isArray(additionalDetails)) {
				let i = 0;
				const length = additionalDetails.length;
				for (; i < length; i++) {
					detailWrapper.appendChild(additionalDetails[i]);
				}
			}
			const members = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail-contact-info"
				}
			});
			if (title !== '') {
				members.appendChild(BX.create("SPAN", {
					text: this.getPrepositionText(direction) + ": "
				}));
				if (showUrl !== '') {
					members.appendChild(BX.create("A", {
						attrs: {
							href: showUrl
						},
						text: title
					}));
				} else {
					members.appendChild(BX.create("SPAN", {
						text: title
					}));
				}
			}
			if (communicationValue !== '') {
				const communicationNode = this.prepareCommunicationNode(communicationValue);
				if (communicationNode) {
					members.appendChild(communicationNode);
				}
			}
			detailWrapper.appendChild(members);
			//endregion
			//region Set as Done Button
			const setAsDoneButton = BX.create("INPUT", {
				attrs: {
					type: "checkbox",
					className: "crm-entity-stream-planned-apply-btn",
					checked: isDone
				},
				events: {
					change: this._setAsDoneButtonHandler
				}
			});
			if (!this.canComplete()) {
				setAsDoneButton.disabled = true;
			}
			const buttonContainer = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail-planned-action"
				},
				children: [setAsDoneButton]
			});
			contentInnerWrapper.appendChild(buttonContainer);
			//endregion

			//region Author
			const authorNode = this.prepareAuthorLayout();
			if (authorNode) {
				contentInnerWrapper.appendChild(authorNode);
			}
			//endregion

			//region  Actions
			this._actionContainer = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail-action"
				}
			});
			contentInnerWrapper.appendChild(this._actionContainer);
			//endregion

			return wrapper;
		}
		getStatusNode() {
			return null;
		}
		prepareCommunicationNode(communicationValue) {
			return BX.create("SPAN", {
				text: " " + communicationValue
			});
		}
		prepareDetailNodes() {
			return [];
		}
		prepareContextMenuItems() {
			const menuItems = [];
			if (!this.isReadOnly()) {
				if (this.isEditable()) {
					menuItems.push({
						id: "edit",
						text: this.getMessage("menuEdit"),
						onclick: BX.delegate(this.edit, this)
					});
				}
				menuItems.push({
					id: "remove",
					text: this.getMessage("menuDelete"),
					onclick: BX.delegate(this.processRemoval, this)
				});
			}
			if (this.canPostpone()) {
				const handler = BX.delegate(this.onContextMenuItemSelect, this);
				if (!this._postponeController) {
					this._postponeController = SchedulePostponeController.create("", {
						item: this
					});
				}
				const postponeMenu = {
					id: "postpone",
					text: this._postponeController.getTitle(),
					items: []
				};
				const commands = this._postponeController.getCommandList();
				let i = 0;
				const length = commands.length;
				for (; i < length; i++) {
					const command = commands[i];
					postponeMenu.items.push({
						id: command["name"],
						text: command["title"],
						onclick: handler
					});
				}
				menuItems.push(postponeMenu);
			}
			return menuItems;
		}
		onContextMenuItemSelect(e, item) {
			this.closeContextMenu();
			if (this._postponeController) {
				this._postponeController.processCommand(item.id);
			}
		}
		static create(id, settings) {
			const self = new Activity();
			self.initialize(id, settings);
			return self;
		}
	}

	/** @memberof BX.Crm.Timeline.Items.Scheduled */
	class Call extends Activity {
		constructor() {
			super();
		}
		getWrapperClassName() {
			return 'crm-entity-stream-section-call';
		}
		getIconClassName() {
			return "crm-entity-stream-section-icon crm-entity-stream-section-icon-call";
		}
		prepareActions() {
			if (this.isReadOnly()) {
				return;
			}
			this._actions.push(BX.CrmScheduleCallAction.create("call", {
				item: this,
				container: this._actionContainer,
				entityData: this.getAssociatedEntityData(),
				activityEditor: this._activityEditor,
				ownerInfo: this._schedule.getOwnerInfo()
			}));
		}
		getTypeDescription(direction) {
			const entityData = this.getAssociatedEntityData();
			const callInfo = BX.prop.getObject(entityData, "CALL_INFO", null);
			const callTypeText = callInfo !== null ? BX.prop.getString(callInfo, "CALL_TYPE_TEXT", "") : "";
			if (callTypeText !== "") {
				return callTypeText;
			}
			return this.getMessage(direction === BX.CrmActivityDirection.incoming ? "incomingCall" : "outgoingCall");
		}
		getRemoveMessage() {
			const entityData = this.getAssociatedEntityData();
			const direction = BX.prop.getInteger(entityData, "DIRECTION", 0);
			let title = BX.prop.getString(entityData, "SUBJECT", "");
			const messageName = direction === BX.CrmActivityDirection.incoming ? 'incomingCallRemove' : 'outgoingCallRemove';
			title = BX.util.htmlspecialchars(title);
			return this.getMessage(messageName).replace("#TITLE#", title);
		}
		static create(id, settings) {
			const self = new Call();
			self.initialize(id, settings);
			return self;
		}
	}

	/** @memberof BX.Crm.Timeline.Items.Scheduled */
	class CallTracker extends Call {
		constructor() {
			super();
		}
		getStatusNode() {
			const entityData = this.getAssociatedEntityData();
			const callInfo = BX.prop.getObject(entityData, "CALL_INFO", null);
			if (!callInfo) {
				return false;
			}
			if (!BX.prop.getBoolean(callInfo, "HAS_STATUS", false)) {
				return false;
			}
			const isSuccessfull = BX.prop.getBoolean(callInfo, "SUCCESSFUL", false);
			const statusText = BX.prop.getString(callInfo, "STATUS_TEXT", "");
			return BX.create("DIV", {
				attrs: {
					className: isSuccessfull ? "crm-entity-stream-content-event-successful" : "crm-entity-stream-content-event-missing"
				},
				text: statusText
			});
		}
		static create(id, settings) {
			const self = new CallTracker();
			self.initialize(id, settings);
			return self;
		}
	}

	/** @memberof BX.Crm.Timeline.Items.Scheduled */
	class Email extends Activity {
		constructor() {
			super();
		}
		getWrapperClassName() {
			return "crm-entity-stream-section-email";
		}
		getIconClassName() {
			return "crm-entity-stream-section-icon crm-entity-stream-section-icon-email";
		}
		prepareActions() {
			if (this.isReadOnly()) {
				return;
			}
			this._actions.push(BX.CrmScheduleEmailAction.create("email", {
				item: this,
				container: this._actionContainer,
				entityData: this.getAssociatedEntityData(),
				activityEditor: this._activityEditor
			}));
		}
		getTypeDescription(direction) {
			return this.getMessage(direction === BX.CrmActivityDirection.incoming ? "incomingEmail" : "outgoingEmail");
		}
		getRemoveMessage() {
			const entityData = this.getAssociatedEntityData();
			let title = BX.prop.getString(entityData, "SUBJECT", "");
			title = BX.util.htmlspecialchars(title);
			return this.getMessage('emailRemove').replace("#TITLE#", title);
		}
		isEditable() {
			return false;
		}
		static create(id, settings) {
			const self = new Email();
			self.initialize(id, settings);
			return self;
		}
	}

	/** @memberof BX.Crm.Timeline.Items.Scheduled */
	class Meeting extends Activity {
		constructor() {
			super();
		}
		getWrapperClassName() {
			return "";
		}
		getIconClassName() {
			return "crm-entity-stream-section-icon crm-entity-stream-section-icon-meeting";
		}
		prepareActions() {}
		getPrepositionText() {
			return this.getMessage("reciprocal");
		}
		getRemoveMessage() {
			const entityData = this.getAssociatedEntityData();
			let title = BX.prop.getString(entityData, "SUBJECT", "");
			title = BX.util.htmlspecialchars(title);
			return this.getMessage('meetingRemove').replace("#TITLE#", title);
		}
		getTypeDescription() {
			return this.getMessage("meeting");
		}
		static create(id, settings) {
			const self = new Meeting();
			self.initialize(id, settings);
			return self;
		}
	}

	/** @memberof BX.Crm.Timeline.Items.Scheduled */
	class OpenLine extends Activity {
		constructor() {
			super();
		}
		getWrapperClassName() {
			return "crm-entity-stream-section-IM";
		}
		getIconClassName() {
			return "crm-entity-stream-section-icon crm-entity-stream-section-icon-IM";
		}
		prepareActions() {
			if (this.isReadOnly()) {
				return;
			}
			this._actions.push(OpenLine$2.create("openline", {
				item: this,
				container: this._actionContainer,
				entityData: this.getAssociatedEntityData(),
				activityEditor: this._activityEditor,
				ownerInfo: this._schedule.getOwnerInfo()
			}));
		}
		getTypeDescription() {
			return this.getMessage("openLine");
		}
		getPrepositionText(direction) {
			return this.getMessage("reciprocal");
		}
		prepareCommunicationNode(communicationValue) {
			return null;
		}
		prepareDetailNodes() {
			const wrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail-IM"
				}
			});
			const messageWrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail-IM-messages"
				}
			});
			wrapper.appendChild(messageWrapper);
			const openLineData = BX.prop.getObject(this.getAssociatedEntityData(), "OPENLINE_INFO", null);
			if (openLineData) {
				const messages = BX.prop.getArray(openLineData, "MESSAGES", []);
				let i = 0;
				const length = messages.length;
				for (; i < length; i++) {
					const message = messages[i];
					const isExternal = BX.prop.getBoolean(message, "IS_EXTERNAL", true);
					messageWrapper.appendChild(BX.create("DIV", {
						attrs: {
							className: isExternal ? "crm-entity-stream-content-detail-IM-message-incoming" : "crm-entity-stream-content-detail-IM-message-outgoing"
						},
						html: BX.prop.getString(message, "MESSAGE", "")
					}));
				}
			}
			return [wrapper];
		}
		view() {
			if (typeof window.top['BXIM'] === 'undefined') {
				// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-dialogs
				crm_timeline_dialog.alert({
					content: main_core.Tag.render`<div>${this.getMessage("openLineNotSupported")}</div>`
				});
				return;
			}
			let slug = "";
			const communication = BX.prop.getObject(this.getAssociatedEntityData(), "COMMUNICATION", null);
			if (communication) {
				if (BX.prop.getString(communication, "TYPE") === "IM") {
					slug = BX.prop.getString(communication, "VALUE");
				}
			}
			if (slug !== "") {
				window.top['BXIM'].openMessengerSlider(slug, {
					RECENT: 'N',
					MENU: 'N'
				});
			}
		}
		static create(id, settings) {
			const self = new OpenLine();
			self.initialize(id, settings);
			return self;
		}
	}

	/** @memberof BX.Crm.Timeline.Items.Scheduled */
	class Request extends Activity {
		constructor() {
			super();
		}
		getWrapperClassName() {
			return "";
		}
		getIconClassName() {
			return "crm-entity-stream-section-icon crm-entity-stream-section-icon-robot";
		}
		getTypeDescription() {
			return this.getMessage("activityRequest");
		}
		isEditable() {
			return false;
		}
		static create(id, settings) {
			const self = new Request();
			self.initialize(id, settings);
			return self;
		}
	}

	/** @memberof BX.Crm.Timeline.Items.Scheduled */
	class Rest extends Activity {
		constructor() {
			super();
		}
		getWrapperClassName() {
			return "";
		}
		getIconClassName() {
			return "crm-entity-stream-section-icon crm-entity-stream-section-icon-rest";
		}
		prepareContent(options) {
			const wrapper = super.prepareContent(options);
			const data = this.getAssociatedEntityData();
			if (data['APP_TYPE'] && data['APP_TYPE']['ICON_SRC']) {
				const iconNode = wrapper.querySelector('.' + this.getIconClassName().replace(/\s+/g, '.'));
				if (iconNode) {
					iconNode.style.backgroundImage = "url('" + data['APP_TYPE']['ICON_SRC'] + "')";
					iconNode.style.backgroundPosition = "center center";
					iconNode.style.backgroundSize = "cover";
					iconNode.style.backgroundColor = "transparent";
				}
			}
			return wrapper;
		}
		getTypeDescription() {
			const entityData = this.getAssociatedEntityData();
			if (entityData['APP_TYPE'] && entityData['APP_TYPE']['NAME']) {
				return entityData['APP_TYPE']['NAME'];
			}
			return this.getMessage("restApplication");
		}
		static create(id, settings) {
			const self = new Rest();
			self.initialize(id, settings);
			return self;
		}
	}

	/** @memberof BX.Crm.Timeline.Items.Scheduled */
	class Task extends Activity {
		constructor() {
			super();
		}
		getWrapperClassName() {
			return "crm-entity-stream-section-planned-task";
		}
		getIconClassName() {
			return "crm-entity-stream-section-icon crm-entity-stream-section-icon-task";
		}
		getTypeDescription() {
			return this.getMessage("task");
		}
		getPrepositionText(direction) {
			return this.getMessage("reciprocal");
		}
		getRemoveMessage() {
			const entityData = this.getAssociatedEntityData();
			let title = BX.prop.getString(entityData, "SUBJECT", "");
			title = BX.util.htmlspecialchars(title);
			return this.getMessage('taskRemove').replace("#TITLE#", title);
		}
		static create(id, settings) {
			const self = new Task();
			self.initialize(id, settings);
			return self;
		}
	}

	/** @memberof BX.Crm.Timeline.Items.Scheduled */
	class Wait extends Scheduled {
		constructor() {
			super();
			this._postponeController = null;
		}
		getTypeId() {
			return Item$1.wait;
		}
		getWrapperClassName() {
			return "crm-entity-stream-section-wait";
		}
		getIconClassName() {
			return "crm-entity-stream-section-icon crm-entity-stream-section-icon-wait";
		}
		prepareActions() {}
		isCounterEnabled() {
			return false;
		}
		getDeadline() {
			const entityData = this.getAssociatedEntityData();
			const time = BX.parseDate(entityData["DEADLINE_SERVER"], false, "YYYY-MM-DD", "YYYY-MM-DD HH:MI:SS");
			if (!time) {
				return null;
			}
			return new crm_timeline_tools.DatetimeConverter(time).toUserTime().getValue();
		}
		isDone() {
			return BX.prop.getString(this.getAssociatedEntityData(), "COMPLETED", "N") === "Y";
		}
		setAsDone(isDone) {
			isDone = !!isDone;
			if (this.isDone() === isDone) {
				return;
			}
			const id = this.getAssociatedEntityId();
			if (id > 0) {
				const editor = BX.Crm.Timeline?.MenuBar?.getDefault()?.getItemById('wait');
				if (editor) {
					editor.complete(id, isDone, BX.delegate(this.onSetAsDoneCompleted, this));
				}
			}
		}
		postpone(offset) {
			const id = this.getAssociatedEntityId();
			if (id > 0 && offset > 0) {
				const editor = BX.Crm.Timeline?.MenuBar?.getDefault()?.getItemById('wait');
				if (editor) {
					editor.postpone(id, offset, BX.delegate(this.onPosponeCompleted, this));
				}
			}
		}
		isContextMenuEnabled() {
			return !!this.getDeadline() && this.canPostpone();
		}
		prepareContent() {
			const deadline = this.getDeadline();
			const timeText = deadline ? this.formatDateTime(deadline) : this.getMessage("termless");
			const entityData = this.getAssociatedEntityData();
			const isDone = this.isDone();
			let description = BX.prop.getString(entityData, "DESCRIPTION_RAW", "");
			let wrapperClassName = this.getWrapperClassName();
			if (wrapperClassName !== "") {
				wrapperClassName = "crm-entity-stream-section crm-entity-stream-section-planned" + " " + wrapperClassName;
			} else {
				wrapperClassName = "crm-entity-stream-section crm-entity-stream-section-planned";
			}
			const wrapper = BX.create("DIV", {
				attrs: {
					className: wrapperClassName
				}
			});
			let iconClassName = this.getIconClassName();
			if (this.isCounterEnabled()) {
				iconClassName += " crm-entity-stream-section-counter";
			}
			wrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: iconClassName
				}
			}));

			//region Context Menu
			if (this.isContextMenuEnabled()) {
				wrapper.appendChild(this.prepareContextMenuButton());
			}
			//endregion

			const contentWrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section-content"
				}
			});
			wrapper.appendChild(contentWrapper);

			//region Details
			if (description !== "") {
				description = BX.util.trim(description);
				description = BX.util.strip_tags(description);
				description = this.cutOffText(description, 512);
				description = BX.util.nl2br(description);
			}
			const contentInnerWrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-event"
				}
			});
			contentWrapper.appendChild(contentInnerWrapper);
			this._deadlineNode = BX.create("SPAN", {
				attrs: {
					className: "crm-entity-stream-content-event-time"
				},
				text: timeText
			});
			const headerWrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-header"
				},
				children: [BX.create("SPAN", {
					attrs: {
						className: "crm-entity-stream-content-event-title"
					},
					text: this.getMessage("wait")
				}), this._deadlineNode]
			});
			contentInnerWrapper.appendChild(headerWrapper);
			const detailWrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail"
				}
			});
			contentInnerWrapper.appendChild(detailWrapper);
			detailWrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail-description"
				},
				html: description
			}));
			const members = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail-contact-info"
				}
			});
			detailWrapper.appendChild(members);
			//endregion

			//region Set as Done Button
			const setAsDoneButton = BX.create("INPUT", {
				attrs: {
					type: "checkbox",
					className: "crm-entity-stream-planned-apply-btn",
					checked: isDone
				},
				events: {
					change: this._setAsDoneButtonHandler
				}
			});
			if (!this.canComplete()) {
				setAsDoneButton.disabled = true;
			}
			const buttonContainer = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail-planned-action"
				},
				children: [setAsDoneButton]
			});
			contentInnerWrapper.appendChild(buttonContainer);
			//endregion

			//region Author
			const authorNode = this.prepareAuthorLayout();
			if (authorNode) {
				contentInnerWrapper.appendChild(authorNode);
			}
			//endregion

			//region  Actions
			this._actionContainer = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail-action"
				}
			});
			contentInnerWrapper.appendChild(this._actionContainer);
			//endregion

			return wrapper;
		}
		prepareContextMenuItems() {
			const menuItems = [];
			const handler = BX.delegate(this.onContextMenuItemSelect, this);
			if (!this._postponeController) {
				this._postponeController = SchedulePostponeController.create("", {
					item: this
				});
			}
			const postponeMenu = {
				id: "postpone",
				text: this._postponeController.getTitle(),
				items: []
			};
			const commands = this._postponeController.getCommandList();
			let i = 0;
			const length = commands.length;
			for (; i < length; i++) {
				const command = commands[i];
				postponeMenu.items.push({
					id: command["name"],
					text: command["title"],
					onclick: handler
				});
			}
			menuItems.push(postponeMenu);
			return menuItems;
		}
		onContextMenuItemSelect(e, item) {
			this.closeContextMenu();
			if (this._postponeController) {
				this._postponeController.processCommand(item.id);
			}
		}
		getTypeDescription() {
			return this.getMessage("wait");
		}
		static create(id, settings) {
			const self = new Wait();
			self.initialize(id, settings);
			return self;
		}
	}

	/** @memberof BX.Crm.Timeline.Items.Scheduled */
	class WebForm extends Activity {
		constructor() {
			super();
		}
		getWrapperClassName() {
			return "";
		}
		getIconClassName() {
			return "crm-entity-stream-section-icon crm-entity-stream-section-icon-crmForm";
		}
		prepareActions() {}
		getPrepositionText() {
			return this.getMessage("from");
		}
		getTypeDescription() {
			return this.getMessage("webform");
		}
		static create(id, settings) {
			const self = new WebForm();
			self.initialize(id, settings);
			return self;
		}
	}

	/** @memberof BX.Crm.Timeline.Items.Scheduled */
	class Zoom extends Activity {
		constructor() {
			super();
		}
		getWrapperClassName() {
			return "crm-entity-stream-section-zoom";
		}
		getIconClassName() {
			return "crm-entity-stream-section-icon crm-entity-stream-section-icon-zoom";
		}
		getTypeDescription() {
			return this.getMessage("zoom");
		}
		getPrepositionText(direction) {}
		prepareCommunicationNode(communicationValue) {
			return null;
		}
		prepareContent(options) {
			const deadline = this.getDeadline();
			const timeText = deadline ? this.formatDateTime(deadline) : this.getMessage("termless");
			const entityData = this.getAssociatedEntityData();
			const direction = BX.prop.getInteger(entityData, "DIRECTION", 0);
			const isDone = this.isDone();
			BX.prop.getString(entityData, "SUBJECT", "");
			let description = BX.prop.getString(entityData, "DESCRIPTION_RAW", "");
			const communication = BX.prop.getObject(entityData, "COMMUNICATION", {});
			BX.prop.getString(communication, "TITLE", "");
			BX.prop.getString(communication, "SHOW_URL", "");
			BX.prop.getString(communication, "TYPE", "") !== "" ? BX.prop.getString(communication, "VALUE", "") : "";
			let wrapperClassName = this.getWrapperClassName();
			if (wrapperClassName !== "") {
				wrapperClassName = "crm-entity-stream-section crm-entity-stream-section-planned" + " " + wrapperClassName;
			} else {
				wrapperClassName = "crm-entity-stream-section crm-entity-stream-section-planned";
			}
			const wrapper = BX.create("DIV", {
				attrs: {
					className: wrapperClassName
				}
			});
			let iconClassName = this.getIconClassName();
			if (this.isCounterEnabled()) {
				iconClassName += " crm-entity-stream-section-counter";
			}
			wrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: iconClassName
				}
			}));

			//region Context Menu
			if (this.isContextMenuEnabled()) {
				wrapper.appendChild(this.prepareContextMenuButton());
			}
			//endregion

			const contentWrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section-content"
				}
			});
			wrapper.appendChild(contentWrapper);

			//region Details
			if (description !== "") {
				//trim leading spaces
				description = description.replace(/^\s+/, '');
			}
			const contentInnerWrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-event"
				}
			});
			contentWrapper.appendChild(contentInnerWrapper);
			this._deadlineNode = BX.create("SPAN", {
				attrs: {
					className: "crm-entity-stream-content-event-time"
				},
				text: timeText
			});
			const headerWrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-header"
				},
				children: [BX.create("SPAN", {
					attrs: {
						className: "crm-entity-stream-content-event-title"
					},
					text: this.getTypeDescription(direction)
				}), this._deadlineNode]
			});
			contentInnerWrapper.appendChild(headerWrapper);
			const detailWrapper = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail"
				}
			});
			contentInnerWrapper.appendChild(detailWrapper);
			if (entityData['ZOOM_INFO']) {
				const topic = entityData['ZOOM_INFO']['TOPIC'];
				const duration = entityData['ZOOM_INFO']['DURATION'];
				const startTime = BX.parseDate(entityData['ZOOM_INFO']['CONF_START_TIME'], false, "YYYY-MM-DD", "YYYY-MM-DD HH:MI:SS");
				const date = new crm_timeline_tools.DatetimeConverter(startTime).toUserTime().toDatetimeString({
					delimiter: ', '
				});
				const detailZoomMessage = BX.create("span", {
					text: this.getMessage("zoomCreatedMessage").replace("#CONFERENCE_TITLE#", topic).replace("#DATE_TIME#", date).replace("#DURATION#", duration)
				});
				const detailZoomInfoLink = BX.create("A", {
					attrs: {
						href: entityData['ZOOM_INFO']['CONF_URL'],
						target: "_blank"
					},
					text: entityData['ZOOM_INFO']['CONF_URL']
				});
				const detailZoomInfo = BX.create("DIV", {
					attrs: {
						className: "crm-entity-stream-content-detail-zoom-info"
					},
					children: [detailZoomMessage, detailZoomInfoLink]
				});
				detailWrapper.appendChild(detailZoomInfo);
				const detailZoomCopyInviteLink = BX.create("A", {
					attrs: {
						className: 'ui-link ui-link-dashed',
						"data-url": entityData['ZOOM_INFO']['CONF_URL']
					},
					text: this.getMessage("zoomCreatedCopyInviteLink")
				});
				BX.clipboard.bindCopyClick(detailZoomCopyInviteLink, {
					text: entityData['ZOOM_INFO']['CONF_URL']
				});
				const detailZoomStartConferenceButton = BX.create("BUTTON", {
					attrs: {
						className: 'ui-btn ui-btn-sm ui-btn-primary'
					},
					text: this.getMessage("zoomCreatedStartConference"),
					events: {
						"click": function () {
							window.open(entityData['ZOOM_INFO']['CONF_URL']);
						}
					}
				});
				const detailZoomCopyInviteLinkWrapper = BX.create("DIV", {
					attrs: {
						className: "crm-entity-stream-content-detail-zoom-link-wrapper"
					},
					children: [detailZoomCopyInviteLink]
				});
				detailWrapper.appendChild(detailZoomCopyInviteLinkWrapper);
				detailWrapper.appendChild(detailZoomStartConferenceButton);
			}
			const additionalDetails = this.prepareDetailNodes();
			if (BX.type.isArray(additionalDetails)) {
				let i = 0;
				const length = additionalDetails.length;
				for (; i < length; i++) {
					detailWrapper.appendChild(additionalDetails[i]);
				}
			}

			//endregion
			//region Set as Done Button
			const setAsDoneButton = BX.create("INPUT", {
				attrs: {
					type: "checkbox",
					className: "crm-entity-stream-planned-apply-btn",
					checked: isDone
				},
				events: {
					change: this._setAsDoneButtonHandler
				}
			});
			if (!this.canComplete()) {
				setAsDoneButton.disabled = true;
			}
			const buttonContainer = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail-planned-action"
				},
				children: [setAsDoneButton]
			});
			contentInnerWrapper.appendChild(buttonContainer);
			//endregion

			//region Author
			const authorNode = this.prepareAuthorLayout();
			if (authorNode) {
				contentInnerWrapper.appendChild(authorNode);
			}
			//endregion

			//region  Actions
			this._actionContainer = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-content-detail-action"
				}
			});
			contentInnerWrapper.appendChild(this._actionContainer);
			//endregion

			return wrapper;
		}
		prepareDetailNodes() {}
		static create(id, settings) {
			const self = new Zoom();
			self.initialize(id, settings);
			return self;
		}
	}

	/** @memberof BX.Crm.Timeline.Streams */
	class Schedule extends Steam {
		constructor() {
			super();
			this._items = [];
			this._history = null;
			this._wrapper = null;
			this._anchor = null;
			this._stub = null;
		}
		doInitialize() {
			if (!this.isStubMode()) {
				let itemData = this.getSetting("itemData");
				if (!BX.type.isArray(itemData)) {
					itemData = [];
				}
				let i, length, item;
				for (i = 0, length = itemData.length; i < length; i++) {
					item = this.createItem(itemData[i]);
					if (item) {
						this._items.push(item);
					}
				}
			}
		}
		layout() {
			this._wrapper = BX.create("DIV", {});
			this._container.appendChild(this._wrapper);
			const label = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-planned-label"
				},
				text: this.getMessage("planned")
			});
			const wrapperClassName = "crm-entity-stream-section crm-entity-stream-section-planned-label";
			this._wrapper.appendChild(BX.create("DIV", {
				attrs: {
					className: wrapperClassName
				},
				children: [BX.create("DIV", {
					attrs: {
						className: "crm-entity-stream-section-content"
					},
					children: [label]
				})]
			}));
			if (this.isStubMode()) {
				this.addStub();
			} else {
				const length = this._items.length;
				if (length === 0) {
					this.addStub();
				} else {
					for (let i = 0; i < length; i++) {
						const item = this._items[i];
						item.setContainer(this._wrapper);
						item.layout();
					}
				}
			}
			this.refreshLayout();
			this._manager.processSheduleLayoutChange();
		}
		refreshLayout() {
			BX.onCustomEvent('Schedule:onBeforeRefreshLayout', [this]);
			const length = this._items.length;
			if (length === 0) {
				this.addStub();
				if (this._history && this._history.hasContent()) {
					BX.removeClass(this._stub, "crm-entity-stream-section-last");
				} else {
					BX.addClass(this._stub, "crm-entity-stream-section-last");
				}
				const stubIcon = this._stub.querySelector(".crm-entity-stream-section-icon");
				if (stubIcon) {
					if (this._manager.isStubCounterEnabled()) {
						BX.addClass(stubIcon, "crm-entity-stream-section-counter");
					} else {
						BX.removeClass(stubIcon, "crm-entity-stream-section-counter");
					}
				}
				return;
			}
			let i, item;
			if (this._history && this._history.hasContent()) {
				for (i = 0; i < length; i++) {
					item = this._items[i];
					if (item.isTerminated()) {
						item.markAsTerminated(false);
					}
				}
			} else {
				if (length > 1) {
					for (i = 0; i < length - 1; i++) {
						item = this._items[i];
						if (item.isTerminated()) {
							item.markAsTerminated(false);
						}
					}
				}
				this._items[length - 1].markAsTerminated(true);
			}
		}
		formatDateTime(time) {
			return new crm_timeline_tools.DatetimeConverter(time).toDatetimeString({
				delimiter: ', '
			});
		}
		checkItemForTermination(item) {
			if (this._history && this._history.getItemCount() > 0) {
				return false;
			}
			return this.getLastItem() === item;
		}
		getItems() {
			return this._items;
		}
		setItems(items) {
			this._items = items;
		}
		calculateItemIndex(item) {
			const sort = item.getSort();
			for (let i = 0; i < this._items.length; i++) {
				const curSort = this._items[i].getSort();
				for (let j = 0; j < curSort.length; j++) {
					if (sort.length <= j || sort[j] !== curSort[j]) {
						if (sort[j] < curSort[j]) {
							return i;
						}
						break;
					}
				}
			}
			return this._items.length;
		}
		getItemCount() {
			return this._items.length;
		}
		getItemByAssociatedEntity($entityTypeId, entityId) {
			if (!BX.type.isNumber($entityTypeId)) {
				$entityTypeId = parseInt($entityTypeId);
			}
			if (!BX.type.isNumber(entityId)) {
				entityId = parseInt(entityId);
			}
			if (isNaN($entityTypeId) || $entityTypeId <= 0 || isNaN(entityId) || entityId <= 0) {
				return null;
			}
			for (let i = 0, length = this._items.length; i < length; i++) {
				const item = this._items[i];
				if (item.getAssociatedEntityTypeId() === $entityTypeId && item.getAssociatedEntityId() === entityId) {
					return item;
				}
			}
			return null;
		}
		getItemByData(itemData) {
			if (!BX.type.isPlainObject(itemData)) {
				return null;
			}
			return this.getItemByAssociatedEntity(BX.prop.getInteger(itemData, "ASSOCIATED_ENTITY_TYPE_ID", 0), BX.prop.getInteger(itemData, "ASSOCIATED_ENTITY_ID", 0));
		}
		getItemByIndex(index) {
			return index < this._items.length ? this._items[index] : null;
		}
		createItem(data) {
			const entityTypeID = BX.prop.getInteger(data, "ASSOCIATED_ENTITY_TYPE_ID", 0);
			const entityID = BX.prop.getInteger(data, "ASSOCIATED_ENTITY_ID", 0);
			const entityData = BX.prop.getObject(data, "ASSOCIATED_ENTITY", {});
			let itemId = BX.CrmEntityType.resolveName(entityTypeID) + "_" + entityID.toString();
			if (data.hasOwnProperty('type')) {
				itemId = data.id;
				return crm_timeline_item.ConfigurableItem.create(itemId, {
					timelineId: this.getId(),
					container: this.getWrapper(),
					itemClassName: this.getItemClassName(),
					isReadOnly: this.isReadOnly(),
					currentUser: this._manager.getCurrentUser(),
					ownerTypeId: this._manager.getOwnerTypeId(),
					ownerId: this._manager.getOwnerId(),
					streamType: this.getStreamType(),
					data: data
				});
			}
			if (entityTypeID === BX.CrmEntityType.enumeration.wait) {
				return Wait.create(itemId, {
					schedule: this,
					container: this._wrapper,
					activityEditor: this._activityEditor,
					data: data
				});
			} else
				// if(entityTypeID === BX.CrmEntityType.enumeration.activity)
				{
					const typeId = BX.prop.getInteger(entityData, "TYPE_ID", 0);
					const providerId = BX.prop.getString(entityData, "PROVIDER_ID", "");
					if (typeId === BX.CrmActivityType.email) {
						return Email.create(itemId, {
							schedule: this,
							container: this._wrapper,
							activityEditor: this._activityEditor,
							data: data
						});
					} else if (typeId === BX.CrmActivityType.call) {
						return Call.create(itemId, {
							schedule: this,
							container: this._wrapper,
							activityEditor: this._activityEditor,
							data: data
						});
					} else if (typeId === BX.CrmActivityType.meeting) {
						return Meeting.create(itemId, {
							schedule: this,
							container: this._wrapper,
							activityEditor: this._activityEditor,
							data: data
						});
					} else if (typeId === BX.CrmActivityType.task) {
						return Task.create(itemId, {
							schedule: this,
							container: this._wrapper,
							activityEditor: this._activityEditor,
							data: data
						});
					} else if (typeId === BX.CrmActivityType.provider) {
						if (providerId === "CRM_WEBFORM") {
							return WebForm.create(itemId, {
								schedule: this,
								container: this._wrapper,
								activityEditor: this._activityEditor,
								data: data
							});
						} else if (providerId === "CRM_REQUEST") {
							return Request.create(itemId, {
								schedule: this,
								container: this._wrapper,
								activityEditor: this._activityEditor,
								data: data
							});
						} else if (providerId === "IMOPENLINES_SESSION") {
							return OpenLine.create(itemId, {
								schedule: this,
								container: this._wrapper,
								activityEditor: this._activityEditor,
								data: data
							});
						} else if (providerId === "ZOOM") {
							return Zoom.create(itemId, {
								schedule: this,
								container: this._wrapper,
								activityEditor: this._activityEditor,
								data: data
							});
						} else if (providerId === "REST_APP") {
							return Rest.create(itemId, {
								schedule: this,
								container: this._wrapper,
								activityEditor: this._activityEditor,
								data: data
							});
						} else if (providerId === 'CRM_CALL_TRACKER') {
							return CallTracker.create(itemId, {
								schedule: this,
								container: this._wrapper,
								activityEditor: this._activityEditor,
								data: data
							});
						}
					}
				}
			return null;
		}
		getWrapper() {
			return this._wrapper;
		}
		getItemClassName() {
			return 'crm-entity-stream-section crm-entity-stream-section-planned';
		}
		getStreamType() {
			return crm_timeline_item.StreamType.scheduled;
		}
		async addItem(item, index) {
			if (!BX.type.isNumber(index) || index < 0) {
				index = this.calculateItemIndex(item);
			}
			if (index < this._items.length) {
				this._items.splice(index, 0, item);
			} else {
				this._items.push(item);
			}
			await this.removeStub();
			this.refreshLayout();
			this._manager.processSheduleLayoutChange();
		}
		getHistory() {
			return this._history;
		}
		setHistory(history) {
			this._history = history;
		}
		createAnchor(index) {
			this._anchor = BX.create("DIV", {
				attrs: {
					className: "crm-entity-stream-section crm-entity-stream-section-shadow"
				}
			});
			if (index >= 0 && index < this._items.length) {
				this._wrapper.insertBefore(this._anchor, this._items[index].getWrapper());
			} else {
				this._wrapper.appendChild(this._anchor);
			}
			return this._anchor;
		}
		deleteItem(item) {
			const index = this.getItemIndex(item);
			if (index < 0) {
				return;
			}
			item.clearLayout();
			this.removeItemByIndex(index);
			this.refreshLayout();
			this._manager.processSheduleLayoutChange();
		}
		transferItemToHistory(item, historyItemData) {
			const index = this.getItemIndex(item);
			if (index < 0) {
				return;
			}
			this.removeItemByIndex(index);
			this.refreshLayout();
			this._manager.processSheduleLayoutChange();
			const historyItem = this._history.createItem(historyItemData);
			this._history.addItem(historyItem, 0);
			historyItem.layout({
				add: false
			});
			const animation = ItemNew.create("", {
				initialItem: item,
				finalItem: historyItem,
				anchor: this._history.createAnchor(),
				events: {
					complete: BX.delegate(this.onTransferComplete, this)
				}
			});
			animation.run();
		}
		onTransferComplete() {
			this._history.refreshLayout();
			if (this._items.length === 0) {
				this.addStub();
			}
		}
		onItemMarkedAsDone(item, params) {}
		addStub() {
			if (!this._stub) {
				const canAddTodo = !!BX.Crm.Timeline?.MenuBar?.getDefault()?.getItemById('todo');
				this.createStub();
				if (canAddTodo && !this.isReadOnly()) {
					BX.bind(this._stub, "click", BX.delegate(this.focusOnTodoEditor, this));
				}
				const label = this._wrapper.querySelector('.crm-entity-stream-section.crm-entity-stream-section-planned-label');
				main_core.Dom.style(this._stub, {
					opacity: 0,
					overflow: 'hidden'
				});
				main_core.Dom.insertAfter(this._stub, label);
				const height = main_core.Dom.getPosition(this._stub).height;
				main_core.Dom.style(this._stub, {
					height: 0,
					marginBottom: 0
				});
				requestAnimationFrame(() => {
					main_core.Dom.style(this._stub, {
						opacity: 1,
						height: height ? `${height}px` : null,
						marginBottom: '15px',
						overflow: null
					});
				});
			}
			if (this._history && this._history.getItemCount() > 0) {
				BX.removeClass(this._stub, "crm-entity-stream-section-last");
			} else {
				BX.addClass(this._stub, "crm-entity-stream-section-last");
			}
		}
		createStub() {
			let stubClassName = "crm-entity-stream-section crm-entity-stream-section-planned crm-entity-stream-section-notTask";
			let stubIconClassName = "crm-entity-stream-section-icon crm-entity-stream-section-icon-info";
			const canAddTodo = !!BX.Crm.Timeline?.MenuBar?.getDefault()?.getItemById('todo');
			if (canAddTodo && !this.isReadOnly()) {
				stubClassName += ' --active';
			}
			let stubMessage = this.getMessage("stub");
			const ownerTypeId = this._manager.getOwnerTypeId();
			if (ownerTypeId === BX.CrmEntityType.enumeration.lead) {
				stubMessage = this.getMessage("leadStub");
			} else if (ownerTypeId === BX.CrmEntityType.enumeration.deal) {
				stubMessage = this.getMessage("dealStub");
			}
			if (this._manager.isStubCounterEnabled()) {
				stubIconClassName += " crm-entity-stream-section-counter";
			}
			this._stub = BX.create("DIV", {
				attrs: {
					className: stubClassName
				},
				children: [BX.create("DIV", {
					attrs: {
						className: stubIconClassName
					}
				}), BX.create("DIV", {
					attrs: {
						className: "crm-entity-stream-section-content"
					},
					children: [BX.create("DIV", {
						attrs: {
							className: "crm-entity-stream-content-event"
						},
						children: [BX.create("DIV", {
							attrs: {
								className: "crm-entity-stream-content-title"
							},
							text: this.getMessage("stubTitle")
						}), BX.create("DIV", {
							attrs: {
								className: "crm-entity-stream-content-detail"
							},
							text: stubMessage
						})]
					})]
				})]
			});
		}
		removeStub() {
			return new Promise((resolve, reject) => {
				const isStubVisible = main_core.Dom.getPosition(this._stub).height !== 0;
				if (this._stub && isStubVisible) {
					const overlay = main_core.Tag.render`<div class="crm-entity-stream-section-content-overlay"></div>`;
					main_core.Dom.style(overlay, 'opacity', 0);
					main_core.bindOnce(overlay, 'transitionend', () => {
						main_core.Dom.style(this._stub, 'position', 'absolute');
						setTimeout(() => {
							main_core.Dom.remove(this._stub);
							this._stub = null;
						}, 200);
						resolve(true);
					});
					const stubContent = this._stub.querySelector('.crm-entity-stream-section-content');
					main_core.Dom.append(overlay, stubContent);
					setTimeout(() => {
						main_core.Dom.style(overlay, 'opacity', 1);
					}, 50);
				} else {
					main_core.Dom.remove(this._stub);
					this._stub = null;
					resolve(true);
				}
			});
		}
		focusOnTodoEditor() {
			const menuBar = BX.Crm.Timeline.MenuBar.getDefault();
			if (menuBar) {
				menuBar.setActiveItemById('todo');
				const todoEditor = menuBar.getItemById('todo');
				todoEditor?.focus();
			}
		}
		getMessage(name) {
			const m = Schedule.messages;
			return m.hasOwnProperty(name) ? m[name] : name;
		}
		animateItemAdding(item) {
			if (this._stub) {
				const newBLockStartHeight = this._stub ? this._stub.offsetHeight : 73;
				const wrapper = item instanceof crm_timeline_item.ConfigurableItem ? item.getLayoutComponent().$refs.timelineCard : item.getWrapper();
				return new Promise(resolve => {
					Expand.create(wrapper, resolve, {
						startHeight: newBLockStartHeight
					}).run();
				});
			}
			return new Promise(resolve => {
				Expand.create(item.getWrapper(), resolve, {}).run();
			});
		}
		static create(id, settings) {
			const self = new Schedule();
			self.initialize(id, settings);
			Schedule.items[self.getId()] = self;
			return self;
		}
		static items = {};
		static messages = {};
	}

	/** @memberof BX.Crm.Timeline.Tools */
	class AudioPlaybackRateSelector {
		constructor(params) {
			this.name = params.name || 'crm-timeline-audio-playback-rate-selector';
			this.menuId = this.name + '-menu';
			if (BX.Type.isArray(params.availableRates)) {
				this.availableRates = params.availableRates;
			} else {
				this.availableRates = [1, 1.5, 2, 3];
			}
			this.currentRate = this.normalizeRate(params.currentRate);
			this.textMessageCode = params.textMessageCode;
			this.renderedItems = [];
			this.players = [];
		}
		isRateCurrent(rateDescription, rate) {
			return rateDescription.rate && rate === rateDescription.rate || rate === rateDescription;
		}
		normalizeRate(rate) {
			rate = parseFloat(rate);
			let i = 0;
			const length = this.availableRates.length;
			for (; i < length; i++) {
				if (this.isRateCurrent(this.availableRates[i], rate)) {
					return rate;
				}
			}
			return this.availableRates[0].rate || this.availableRates[0];
		}
		getMenuItems() {
			const selectedRate = this.getRate();
			return this.availableRates.map(function (item) {
				return {
					text: (item.text || item) + '',
					html: (item.html || item) + '',
					className: this.isRateCurrent(item, selectedRate) ? 'menu-popup-item-text-active' : null,
					onclick: function () {
						this.setRate(item.rate || item);
					}.bind(this)
				};
			}.bind(this));
		}
		getPopup(node) {
			let popupMenu = BX.Main.MenuManager.getMenuById(this.menuId);
			if (popupMenu) {
				const popupWindow = popupMenu.getPopupWindow();
				if (popupWindow) {
					popupWindow.setBindElement(node);
				}
			} else {
				popupMenu = BX.Main.MenuManager.create({
					id: this.menuId,
					bindElement: node,
					items: this.getMenuItems(),
					className: 'crm-audio-cap-speed-popup'
				});
			}
			return popupMenu;
		}
		getRate() {
			return this.normalizeRate(this.currentRate);
		}
		setRate(rate) {
			this.getPopup().destroy();
			rate = this.normalizeRate(rate);
			if (this.currentRate === rate) {
				return;
			}
			this.currentRate = rate;
			BX.userOptions.save("crm", this.name, 'rate', rate);
			for (let i = 0, length = this.renderedItems.length; i < length; i++) {
				const textNode = this.renderedItems[i].querySelector('.crm-audio-cap-speed-text');
				if (textNode) {
					textNode.innerHTML = this.getText();
				}
			}
			for (let i = 0, length = this.players.length; i < length; i++) {
				this.players[i].vjsPlayer.playbackRate(this.getRate());
			}
		}
		getText() {
			let text;
			if (this.textMessageCode) {
				text = BX.Loc.getMessage(this.textMessageCode);
			}
			if (!text) {
				text = '#RATE#';
			}
			return text.replace('#RATE#', '<span>' + this.getRate() + 'x</span>');
		}
		render() {
			const item = BX.Dom.create('div', {
				attrs: {
					className: 'crm-audio-cap-speed-wrapper'
				},
				children: [BX.Dom.create('div', {
					attrs: {
						className: 'crm-audio-cap-speed'
					},
					children: [BX.Dom.create('div', {
						attrs: {
							className: 'crm-audio-cap-speed-text'
						},
						html: this.getText()
					})]
				})],
				events: {
					click: function (event) {
						event.preventDefault();
						this.getPopup(event.target).show();
					}.bind(this)
				}
			});
			this.renderedItems.push(item);
			return item;
		}
		addPlayer(player) {
			if (BX.Fileman.Player && player instanceof BX.Fileman.Player) {
				this.players.push(player);
			}
		}
	}

	/* eslint-disable */


	/** @memberof BX.Crm.Timeline */
	class Manager {
		#itemPullActionProcessor = null;
		constructor() {
			this._id = "";
			this._settings = {};
			this._container = null;
			this._ownerTypeId = 0;
			this._ownerId = 0;
			this._ownerInfo = null;
			this._progressSemantics = "";
			this._chat = null;
			this._schedule = null;
			this._history = null;
			this._fixedHistory = null;
			this._activityEditor = null;
			this._userId = 0;
			this._readOnly = false;
			this._currentUser = null;
			this._pingSettings = null;
			this._calendarSettings = null;
			this._colorSettings = null;
			this._pullTagName = "";
		}
		initialize(id, settings) {
			this._id = BX.type.isNotEmptyString(id) ? id : BX.util.getRandomString(4);
			this._settings = settings ? settings : {};
			this._ownerTypeId = parseInt(this.getSetting("ownerTypeId"));
			this._ownerId = parseInt(this.getSetting("ownerId"));
			this._ownerInfo = this.getSetting("ownerInfo");
			this._progressSemantics = BX.prop.getString(this._settings, "progressSemantics", "");
			this._spotlightFastenShowed = this.getSetting("spotlightFastenShowed", true);
			this._audioPlaybackRate = parseFloat(this.getSetting("audioPlaybackRate", 1));
			const containerId = this.getSetting("containerId");
			if (!BX.type.isNotEmptyString(containerId)) {
				throw "Manager. A required parameter 'containerId' is missing.";
			}
			this._container = BX(containerId);
			if (!BX.type.isElementNode(this._container)) {
				throw "Manager. Container node is not found.";
			}
			this._editorContainer = BX(this.getSetting("editorContainer"));
			this._userId = BX.prop.getInteger(this._settings, "userId", 0);
			this._readOnly = BX.prop.getBoolean(this._settings, "readOnly", false);
			this._currentUser = BX.prop.getObject(this._settings, "currentUser", null);
			this._pingSettings = BX.prop.getObject(this._settings, "pingSettings", null);
			this._calendarSettings = BX.prop.getObject(this._settings, "calendarSettings", null);
			this._colorSettings = BX.prop.getObject(this._settings, "colorSettings", null);
			const activityEditorId = this.getSetting("activityEditorId");
			if (BX.type.isNotEmptyString(activityEditorId)) {
				this._activityEditor = BX.CrmActivityEditor.items[activityEditorId];
				if (!(this._activityEditor instanceof BX.CrmActivityEditor)) {
					throw "BX.CrmTimeline. Activity editor instance is not found.";
				}
			}
			const ajaxId = this.getSetting("ajaxId");
			const currentUrl = this.getSetting("currentUrl");
			const serviceUrl = this.getSetting("serviceUrl");
			this._chat = EntityChat.create(this._id, {
				manager: this,
				container: this._container,
				data: this.getSetting("chatData"),
				isStubMode: this._ownerId <= 0,
				readOnly: this._readOnly
			});
			this._schedule = Schedule.create(this._id, {
				manager: this,
				container: this._container,
				activityEditor: this._activityEditor,
				itemData: this.getSetting("scheduleData"),
				templates: this.getSetting("templates"),
				isStubMode: this._ownerId <= 0,
				ajaxId: ajaxId,
				serviceUrl: serviceUrl,
				currentUrl: currentUrl,
				userId: this._userId,
				readOnly: this._readOnly
			});
			this._fixedHistory = FixedHistory.create(this._id, {
				manager: this,
				container: this._container,
				editorContainer: this._editorContainer,
				activityEditor: this._activityEditor,
				itemData: this.getSetting("fixedData"),
				templates: this.getSetting("templates"),
				isStubMode: this._ownerId <= 0,
				ajaxId: ajaxId,
				serviceUrl: serviceUrl,
				currentUrl: currentUrl,
				userId: this._userId,
				readOnly: this._readOnly
			});
			this._history = History.create(this._id, {
				manager: this,
				container: this._container,
				fixedHistory: this._fixedHistory,
				activityEditor: this._activityEditor,
				itemData: this.getSetting("historyData"),
				templates: this.getSetting("templates"),
				navigation: this.getSetting("historyNavigation", {}),
				filterId: BX.prop.getString(this._settings, "historyFilterId", this._id),
				isFilterApplied: BX.prop.getBoolean(this._settings, "isHistoryFilterApplied", false),
				isStubMode: this._ownerId <= 0,
				ajaxId: ajaxId,
				serviceUrl: serviceUrl,
				currentUrl: currentUrl,
				userId: this._userId,
				readOnly: this._readOnly
			});
			this._schedule.setHistory(this._history);
			this._fixedHistory.setHistory(this._history);
			this._chat.layout();
			this._schedule.layout();
			this._fixedHistory.layout();
			this._history.layout();
			this._pullTagName = BX.prop.getString(this._settings, "pullTagName", "");
			if (this._pullTagName !== "") {
				BX.addCustomEvent("onPullEvent-crm", BX.delegate(this.onPullEvent, this));
				this.extendWatch();
				this.#itemPullActionProcessor = new PullActionProcessor({
					scheduleStream: this._schedule,
					fixedHistoryStream: this._fixedHistory,
					historyStream: this._history,
					ownerTypeId: this._ownerTypeId,
					ownerId: this._ownerId,
					userId: this._userId
				});
			}
			BX.addCustomEvent(window, "Crm.EntityProgress.Change", BX.delegate(this.onEntityProgressChange, this));
			BX.ready(function () {
				window.addEventListener("scroll", BX.throttle(function () {
					BX.LazyLoad.onScroll();
				}, 80));
			});
		}
		extendWatch() {
			if (BX.type.isFunction(BX.PULL) && this._pullTagName !== "") {
				BX.PULL.extendWatch(this._pullTagName);
				window.setTimeout(BX.delegate(this.extendWatch, this), 60000);
			}
		}
		onPullEvent(command, params) {
			if (this._pullTagName !== BX.prop.getString(params, "TAG", "")) {
				return;
			}
			if (command === 'timeline_item_action') {
				this.#itemPullActionProcessor.processAction(params);
				return;
			}
			if (command === "timeline_chat_create") {
				this.processChatCreate(params);
			} else if (command === "timeline_activity_add") {
				this.processActivityExternalAdd(params);
			} else if (command === "timeline_activity_update") {
				this.processActivityExternalUpdate(params);
			} else if (command === "timeline_activity_delete") {
				this.processActivityExternalDelete(params);
			} else if (command === "timeline_comment_add") {
				this.processCommentExternalAdd(params);
			} else if (command === "timeline_comment_update") {
				this.processCommentExternalUpdate(params);
			} else if (command === "timeline_comment_delete") {
				this.processCommentExternalDelete(params);
			} else if (command === "timeline_changed_binding") {
				this.processChangeBinding(params);
			} else if (command === "timeline_item_update") {
				this.processItemExternalUpdate(params);
			} else if (command === "timeline_wait_add") {
				this.processWaitExternalAdd(params);
			} else if (command === "timeline_wait_update") {
				this.processWaitExternalUpdate(params);
			} else if (command === "timeline_wait_delete") {
				this.processWaitExternalDelete(params);
			} else if (command === "timeline_bizproc_status") {
				this.processBizprocStatus(params);
			} else if (command === "timeline_scoring_add") {
				this.processScoringExternalAdd(params);
			}
		}
		processChatCreate(params) {
			if (this._chat) {
				this._chat.setData(BX.prop.getObject(params, "CHAT_DATA", {}));
				this._chat.refreshLayout();
			}
		}
		processActivityExternalAdd(params) {
			let entityData, scheduleItemData, historyItemData, scheduleItem, historyItem;
			entityData = BX.prop.getObject(params, "ENTITY", null);
			scheduleItemData = BX.prop.getObject(params, "SCHEDULE_ITEM", null);
			historyItemData = BX.prop.getObject(params, "HISTORY_ITEM", null);
			if (entityData && historyItemData && !BX.type.isPlainObject(historyItemData["ASSOCIATED_ENTITY"])) {
				historyItemData["ASSOCIATED_ENTITY"] = entityData;
			}
			if (scheduleItemData !== null && this._schedule.getItemByData(scheduleItemData) === null) {
				scheduleItem = this.addScheduleItem(scheduleItemData);
				scheduleItem.addWrapperClass("crm-entity-stream-section-updated", 1000);
			}
			if (historyItemData !== null) {
				historyItem = this._history.findItemById(BX.prop.getString(historyItemData, "ID"));
				if (!historyItem) {
					historyItem = this.addHistoryItem(historyItemData);
					Expand.create(historyItem.getWrapper(), null).run();
				}
			}
		}
		processActivityExternalUpdate(params) {
			let entityData, scheduleItemData, scheduleItem, historyItemData, historyItem, fixedHistoryItem;
			entityData = BX.prop.getObject(params, "ENTITY", null);
			scheduleItemData = BX.prop.getObject(params, "SCHEDULE_ITEM", null);
			historyItemData = BX.prop.getObject(params, "HISTORY_ITEM", null);
			if (entityData) {
				if (historyItemData && !BX.type.isPlainObject(historyItemData["ASSOCIATED_ENTITY"])) {
					historyItemData["ASSOCIATED_ENTITY"] = entityData;
				}
				const entityId = BX.prop.getInteger(entityData, "ID", 0);
				const historyItems = this._history.getItemsByAssociatedEntity(BX.CrmEntityType.enumeration.activity, entityId);
				for (let i = 0, length = historyItems.length; i < length; i++) {
					historyItem = historyItems[i];
					historyItem.setAssociatedEntityData(entityData);
					historyItem.refreshLayout();
				}
				const fixedHistoryItems = this._fixedHistory.getItemsByAssociatedEntity(BX.CrmEntityType.enumeration.activity, entityId);
				for (let i = 0, length = fixedHistoryItems.length; i < length; i++) {
					fixedHistoryItem = fixedHistoryItems[i];
					fixedHistoryItem.setAssociatedEntityData(entityData);
					fixedHistoryItem.refreshLayout();
				}
			}
			if (scheduleItemData !== null) {
				scheduleItem = this._schedule.getItemByAssociatedEntity(BX.CrmEntityType.enumeration.activity, BX.prop.getInteger(scheduleItemData, "ASSOCIATED_ENTITY_ID"));
				if (scheduleItem) {
					scheduleItem.setData(scheduleItemData);
					if (!scheduleItem.isDone()) {
						this._schedule.refreshItem(scheduleItem);
					} else {
						if (historyItemData) {
							this._schedule.transferItemToHistory(scheduleItem, historyItemData);
							//History data are already processed
							historyItemData = null;
						} else {
							this._schedule.deleteItem(scheduleItem);
						}
					}
				} else if (!Scheduled.isDone(scheduleItemData)) {
					scheduleItem = this.addScheduleItem(scheduleItemData);
					scheduleItem.addWrapperClass("crm-entity-stream-section-updated", 1000);
				}
			}
			if (historyItemData !== null) {
				historyItem = this._history.findItemById(BX.prop.getString(historyItemData, "ID"));
				if (!historyItem) {
					historyItem = this.addHistoryItem(historyItemData);
					Expand.create(historyItem.getWrapper(), null).run();
				} else {
					historyItem.setData(historyItemData);
					historyItem.refreshLayout();
					fixedHistoryItem = this._fixedHistory.findItemById(BX.prop.getString(historyItemData, "ID"));
					if (fixedHistoryItem) {
						fixedHistoryItem.setData(historyItemData);
						fixedHistoryItem.refreshLayout();
					}
				}
			}
		}
		processActivityExternalDelete(params) {
			const entityId = BX.prop.getInteger(params, "ENTITY_ID", 0);
			const historyItems = this._history.getItemsByAssociatedEntity(BX.CrmEntityType.enumeration.activity, entityId);
			for (let i = 0, length = historyItems.length; i < length; i++) {
				this._history.deleteItem(historyItems[i]);
			}
			const fixedHistoryItems = this._fixedHistory.getItemsByAssociatedEntity(BX.CrmEntityType.enumeration.activity, entityId);
			for (let i = 0, length = fixedHistoryItems.length; i < length; i++) {
				this._fixedHistory.deleteItem(fixedHistoryItems[i]);
			}
			const scheduleItem = this._schedule.getItemByAssociatedEntity(BX.CrmEntityType.enumeration.activity, entityId);
			if (scheduleItem) {
				this._schedule.deleteItem(scheduleItem);
			}
		}
		processCommentExternalAdd(params) {
			let historyItemData, historyItem;
			historyItemData = BX.prop.getObject(params, "HISTORY_ITEM", null);
			if (historyItemData !== null) {
				window.setTimeout(BX.delegate(function () {
					if (!this._history.findItemById(historyItemData['ID'])) {
						historyItem = this.addHistoryItem(historyItemData);
						Expand.create(historyItem.getWrapper(), null).run();
					}
				}, this), 1500);
			}
		}
		processCommentExternalUpdate(params) {
			const entityId = BX.prop.getInteger(params, "ENTITY_ID", 0);
			const historyItemData = BX.prop.getObject(params, "HISTORY_ITEM", null);
			const updateItem = this._history.findItemById(entityId);
			if (updateItem instanceof Comment && historyItemData !== null) {
				updateItem.setData(historyItemData);
				updateItem.switchToViewMode();
			}
			const updateFixedItem = this._fixedHistory.findItemById(entityId);
			if (updateFixedItem instanceof Comment && historyItemData !== null) {
				updateFixedItem.setData(historyItemData);
				updateFixedItem.switchToViewMode();
			}
		}
		processCommentExternalDelete(params) {
			const entityId = BX.prop.getInteger(params, "ENTITY_ID", 0);
			window.setTimeout(BX.delegate(function () {
				const deleteItem = this._history.findItemById(entityId);
				if (deleteItem instanceof Comment) {
					this._history.deleteItem(deleteItem);
				}
				const deleteFixedItem = this._fixedHistory.findItemById(entityId);
				if (deleteFixedItem instanceof Comment) {
					this._fixedHistory.deleteItem(deleteFixedItem);
				}
			}, this), 1200);
		}
		processChangeBinding(params) {
			const entityId = BX.prop.getString(params, "OLD_ID", 0);
			const entityNewId = BX.prop.getString(params, "NEW_ID", 0);
			const item = this._history.findItemById(entityId);
			if (item instanceof crm_timeline_item.Item) {
				item._id = entityNewId;
				const itemData = item.getData();
				itemData.ID = entityNewId;
				item.setData(itemData);
			}
			const fixedItem = this._fixedHistory.findItemById(entityId);
			if (fixedItem instanceof crm_timeline_item.Item) {
				fixedItem._id = entityNewId;
				const fixedItemData = fixedItem.getData();
				fixedItemData.ID = entityNewId;
				fixedItem.setData(fixedItemData);
			}
		}
		processItemExternalUpdate(params) {
			const entityId = BX.prop.getInteger(params, "ENTITY_ID", 0);
			const historyItemData = BX.prop.getObject(params, "HISTORY_ITEM", null);
			const historyItem = this._history.findItemById(entityId);
			if (historyItem && historyItemData !== null) {
				historyItem.setData(historyItemData);
				historyItem.markAsTerminated(this._history.checkItemForTermination(historyItem));
				historyItem.refreshLayout();
				if (historyItem.isTerminated()) {
					BX.addClass(historyItem._wrapper, "crm-entity-stream-section-last");
				}
			}
		}
		processWaitExternalAdd(params) {
			const scheduleItemData = BX.prop.getObject(params, "SCHEDULE_ITEM", null);
			if (scheduleItemData !== null) {
				this.addScheduleItem(scheduleItemData);
			}
		}
		processWaitExternalUpdate(params) {
			let entityData, scheduleItemData, scheduleItem, historyItemData, historyItem;
			entityData = BX.prop.getObject(params, "ENTITY", null);
			scheduleItemData = BX.prop.getObject(params, "SCHEDULE_ITEM", null);
			historyItemData = BX.prop.getObject(params, "HISTORY_ITEM", null);
			if (entityData) {
				if (historyItemData && !BX.type.isPlainObject(historyItemData["ASSOCIATED_ENTITY"])) {
					historyItemData["ASSOCIATED_ENTITY"] = entityData;
				}
				const entityId = BX.prop.getInteger(entityData, "ID", 0);
				const historyItems = this._history.getItemsByAssociatedEntity(BX.CrmEntityType.enumeration.wait, entityId);
				let i = 0;
				const length = historyItems.length;
				for (; i < length; i++) {
					historyItem = historyItems[i];
					historyItem.setAssociatedEntityData(entityData);
					historyItem.refreshLayout();
				}
			}
			if (scheduleItemData !== null) {
				scheduleItem = this._schedule.getItemByAssociatedEntity(BX.CrmEntityType.enumeration.wait, BX.prop.getInteger(scheduleItemData, "ASSOCIATED_ENTITY_ID"));
				if (!scheduleItem) {
					this.addScheduleItem(scheduleItemData);
				} else {
					scheduleItem.setData(scheduleItemData);
					if (!scheduleItem.isDone()) {
						this._schedule.refreshItem(scheduleItem);
					} else {
						if (historyItemData) {
							this._schedule.transferItemToHistory(scheduleItem, historyItemData);
							//History data are already processed
							historyItemData = null;
						} else {
							this._schedule.deleteItem(scheduleItem);
						}
					}
				}
			}
			if (historyItemData !== null) {
				historyItem = this._history.findItemById(BX.prop.getString(historyItemData, "ID"));
				if (!historyItem) {
					historyItem = this.addHistoryItem(historyItemData);
					Expand.create(historyItem.getWrapper(), null).run();
				} else {
					historyItem.setData(historyItemData);
					historyItem.refreshLayout();
				}
			}
		}
		processWaitExternalDelete(params) {
			const entityId = BX.prop.getInteger(params, "ENTITY_ID", 0);
			const historyItems = this._history.getItemsByAssociatedEntity(BX.CrmEntityType.enumeration.wait, entityId);
			let i = 0;
			const length = historyItems.length;
			for (; i < length; i++) {
				this._history.deleteItem(historyItems[i]);
			}
			const scheduleItem = this._schedule.getItemByAssociatedEntity(BX.CrmEntityType.enumeration.wait, entityId);
			if (scheduleItem) {
				this._schedule.deleteItem(scheduleItem);
			}
		}
		processBizprocStatus(params) {
			let historyItemData, historyItem;
			historyItemData = BX.prop.getObject(params, "HISTORY_ITEM", null);
			if (historyItemData !== null) {
				historyItem = this.addHistoryItem(historyItemData);
				Expand.create(historyItem.getWrapper(), null).run();
			}
		}
		processScoringExternalAdd(params) {
			let historyItemData, historyItem;
			historyItemData = BX.prop.getObject(params, "HISTORY_ITEM", null);
			if (historyItemData !== null) {
				historyItem = this.addHistoryItem(historyItemData);
				Expand.create(historyItem.getWrapper(), null).run();
			}
		}
		onEntityProgressChange(sender, eventArgs) {
			if (BX.prop.getInteger(eventArgs, "entityTypeId", 0) !== this._ownerTypeId || BX.prop.getInteger(eventArgs, "entityId", 0) !== this._ownerId) {
				return;
			}
			const semantics = BX.prop.getString(eventArgs, "semantics", "");
			if (semantics === this._progressSemantics) {
				return;
			}
			this._progressSemantics = semantics;
			this._schedule.refreshLayout();
		}
		getId() {
			return this._id;
		}
		getSetting(name, defaultval) {
			return this._settings.hasOwnProperty(name) ? this._settings[name] : defaultval;
		}
		getOwnerTypeId() {
			return this._ownerTypeId;
		}
		getOwnerId() {
			return this._ownerId;
		}
		getOwnerInfo() {
			return this._ownerInfo;
		}
		isStubCounterEnabled() {
			return false;
		}
		getSchedule() {
			return this._schedule;
		}
		getHistory() {
			return this._history;
		}
		getFixedHistory() {
			return this._fixedHistory;
		}
		processSheduleLayoutChange() {}
		processHistoryLayoutChange() {
			this._schedule.refreshLayout();
		}
		addScheduleItem(data) {
			const item = this._schedule.createItem(data);
			const index = this._schedule.calculateItemIndex(item);
			const anchor = this._schedule.createAnchor(index);
			this._schedule.addItem(item, index);
			item.layout({
				anchor: anchor
			});
			return item;
		}
		addHistoryItem(data) {
			const item = this._history.createItem(data);
			const index = this._history.calculateItemIndex(item);
			const historyAnchor = this._history.createAnchor(index);
			this._history.addItem(item, index);
			item.layout({
				anchor: historyAnchor
			});
			return item;
		}
		renderAudioDummy(durationText, onClick) {
			return BX.create("DIV", {
				attrs: {
					className: "crm-audio-cap-wrap-container"
				},
				children: [BX.create("DIV", {
					attrs: {
						className: "crm-audio-cap-wrap"
					},
					children: [BX.create("DIV", {
						attrs: {
							className: "crm-audio-cap-time"
						},
						text: durationText
					})],
					events: {
						click: onClick
					}
				})]
			});
		}
		loadMediaPlayer(id, filePath, mediaType, node, duration, options) {
			if (!duration) {
				duration = 0;
			}
			if (!options) {
				options = {};
			}
			const player = new BX.Fileman.Player(id, {
				sources: [{
					src: filePath,
					type: mediaType
				}],
				isAudio: !options.video,
				skin: options.hasOwnProperty('skin') ? options.skin : 'vjs-timeline_player-skin',
				width: options.width || 350,
				height: options.height || 30,
				duration: duration,
				playbackRate: options.playbackRate || null,
				onInit: function (player) {
					player.vjsPlayer.controlBar.removeChild('timeDivider');
					player.vjsPlayer.controlBar.removeChild('durationDisplay');
					player.vjsPlayer.controlBar.removeChild('fullscreenToggle');
					player.vjsPlayer.controlBar.addChild('timeDivider');
					player.vjsPlayer.controlBar.addChild('durationDisplay');
					if (!player.isPlaying()) {
						player.play();
					}
				}
			});
			BX.cleanNode(node, false);
			node.appendChild(player.createElement());
			player.init();
			// todo remove this after player will be able to get float playbackRate
			if (options.playbackRate > 1) {
				player.vjsPlayer.playbackRate(options.playbackRate);
			}
			return player;
		}
		onActivityCreated(activity, data) {
			//Already processed in onPullEvent
		}
		isSpotlightShowed() {
			return this._spotlightFastenShowed;
		}
		setSpotlightShowed() {
			this._spotlightFastenShowed = true;
		}
		getCurrentUser() {
			if (BX.type.isObjectLike(this._currentUser) && this._userId > 0) {
				this._currentUser.userId = this._userId;
			}
			return this._currentUser;
		}
		getPingSettings() {
			if (BX.type.isObjectLike(this._pingSettings) && Object.keys(this._pingSettings).length > 0) {
				return this._pingSettings;
			}
			return null;
		}
		getCalendarSettings() {
			if (BX.type.isObjectLike(this._calendarSettings) && Object.keys(this._calendarSettings).length > 0) {
				return this._calendarSettings;
			}
			return null;
		}
		getColorSettings() {
			if (BX.type.isObjectLike(this._colorSettings) && Object.keys(this._colorSettings).length > 0) {
				return this._colorSettings;
			}
			return null;
		}
		getAudioPlaybackRateSelector() {
			if (!this.audioPlaybackRateSelector) {
				this.audioPlaybackRateSelector = new AudioPlaybackRateSelector({
					name: 'timeline_audio_playback',
					currentRate: this._audioPlaybackRate,
					availableRates: [{
						rate: 1,
						html: BX.Loc.getMessage('CRM_TIMELINE_PLAYBACK_RATE_SELECTOR_RATE_1').replace('#RATE#', '<span class="crm-audio-cap-speed-param">1x</span>')
					}, {
						rate: 1.5,
						html: BX.Loc.getMessage('CRM_TIMELINE_PLAYBACK_RATE_SELECTOR_RATE_1.5').replace('#RATE#', '<span class="crm-audio-cap-speed-param">1.5x</span>')
					}, {
						rate: 2,
						html: BX.Loc.getMessage('CRM_TIMELINE_PLAYBACK_RATE_SELECTOR_RATE_2').replace('#RATE#', '<span class="crm-audio-cap-speed-param">2x</span>')
					}, {
						rate: 3,
						html: BX.Loc.getMessage('CRM_TIMELINE_PLAYBACK_RATE_SELECTOR_RATE_3').replace('#RATE#', '<span class="crm-audio-cap-speed-param">3x</span>')
					}],
					textMessageCode: 'CRM_TIMELINE_PLAYBACK_RATE_SELECTOR_TEXT'
				});
			}
			return this.audioPlaybackRateSelector;
		}
		hasScheduledItems() {
			return this._schedule.getItems().length > 0;
		}
		static create(id, settings) {
			const self = new Manager();
			self.initialize(id, settings);
			Manager.instances[self.getId()] = self;
			return self;
		}
		static getDefault() {
			return Manager.#defaultInstance;
		}
		static setDefault(instance) {
			Manager.#defaultInstance = instance;
		}
		static getById(id) {
			return Manager.instances[id] || null;
		}
		static #defaultInstance = null;
		static instances = {};
	}

	/** @memberof BX.Crm.Timeline.Tools */
	class WorkflowEventManager {
		constructor(settings) {
			this.hasRunningWorkflow = settings.hasRunningWorkflow;
			this.hasWaitingWorkflowTask = settings.hasWaitingWorkflowTask;
			this.workflowTaskActivityId = settings.workflowTaskActivityId;
			this.workflowFirstTourClosed = settings.workflowFirstTourClosed;
			this.workflowTaskStatusTitle = settings.workflowTaskStatusTitle;
			this.init();
		}
		init() {
			this.handleRunningWorkflow();
			this.handleWaitingWorkflowTask();
			this.subscribeToTimelineEvents();
			this.subscribeToPullEvents();
		}
		handleRunningWorkflow() {
			if (!this.hasRunningWorkflow) {
				return;
			}
			this.runFirstAutomationTour();
		}
		runFirstAutomationTour() {
			if (!document.querySelector('#crm_entity_bp_starter')) {
				return;
			}
			main_core_events.EventEmitter.emit('BX.Crm.Timeline.Bizproc::onAfterWorkflowStarted', {
				stepId: 'on-after-started-workflow',
				target: '#crm_entity_bp_starter'
			});
		}
		handleWaitingWorkflowTask() {
			if (!this.hasWaitingWorkflowTask) {
				return;
			}
			if (this.workflowFirstTourClosed) {
				this.runSecondAutomationTour(`ACTIVITY_${this.workflowTaskActivityId}`);
			} else {
				main_core_events.EventEmitter.subscribe('UI.Tour.Guide:onFinish', event => {
					const eventData = event.data;
					const stepId = eventData?.guide?.steps?.[0]?.id;
					if (stepId === 'on-after-started-workflow') {
						this.runSecondAutomationTour(`ACTIVITY_${this.workflowTaskActivityId}`);
					}
				});
			}
		}
		runSecondAutomationTour(activityId = null) {
			if (!activityId) {
				return;
			}
			const task = document.querySelector(`div[data-id="${activityId}"]`);
			if (task && this.isElementInViewport(task)) {
				main_core_events.EventEmitter.emit('BX.Crm.Timeline.Bizproc::onAfterCreatedTask', {
					stepId: 'on-after-created-task',
					target: task.querySelector('.crm-timeline__card-status')
				});
			}
		}
		subscribeToTimelineEvents() {
			main_core_events.EventEmitter.subscribe('BX.Crm.Timeline.Items.Bizproc:onAfterItemLayout', event => {
				const eventData = event.data;
				if (eventData?.options?.add === false) {
					return;
				}
				const isWorkflowStarted = eventData?.type === 'BizprocWorkflowStarted';
				if (isWorkflowStarted) {
					this.runFirstAutomationTour();
				}
				const isBizprocTask = eventData?.type === 'Activity:BizprocTask';
				if (eventData?.target && this.isElementInViewport(eventData?.target) && isBizprocTask) {
					main_core_events.EventEmitter.subscribe('UI.Tour.Guide:onFinish', params => {
						const paramsData = params.data;
						const stepId = paramsData?.guide?.steps?.[0]?.id;
						const card = eventData?.target.querySelector('.crm-timeline__card');
						const activityId = card.getAttribute('data-id');
						if (stepId === 'on-after-started-workflow' && activityId) {
							this.runSecondAutomationTour(activityId);
						}
					});
				}
			});
		}
		subscribeToPullEvents() {
			main_core_events.EventEmitter.subscribe('onPullEvent-crm', event => {
				const eventData = event.data?.[1];
				const isUpdateAction = eventData?.action === 'update';
				const itemLayout = eventData?.item?.layout;
				const itemTypeTask = eventData?.item?.type === 'Activity:BizprocTask';
				const itemId = eventData?.id;
				if (isUpdateAction && itemLayout && itemId && itemTypeTask) {
					const card = document.querySelector(`div[data-id="${itemId}"]`);
					const isSecondaryStatus = itemLayout?.header?.tags?.status?.title === this.workflowTaskStatusTitle;
					if (isSecondaryStatus && card) {
						main_core_events.EventEmitter.emit('BX.Crm.Timeline.Bizproc::onAfterCompletedTask', {
							stepId: 'on-after-completed-task',
							target: card.querySelector('.crm-timeline__card-top_checkbox')
						});
					}
				}
			});
		}
		isElementInViewport(element) {
			const rect = element.getBoundingClientRect();
			return rect.bottom > 0 && rect.top < (window.innerHeight || document.documentElement.clientHeight);
		}
	}

	/** @memberof BX.Crm.Timeline.Actions */
	class SchedulePostpone extends Activity$1 {
		constructor() {
			super();
			this._button = null;
			this._clickHandler = BX.delegate(this.onClick, this);
			this._isMenuShown = false;
			this._menu = false;
		}
		doLayout() {
			this._button = BX.create("DIV", {
				attrs: {
					className: this._isEnabled ? "crm-entity-stream-planned-action-aside" : "crm-entity-stream-planned-action-aside-disabled"
				},
				text: this.getMessage("postpone")
			});
			if (this._isEnabled) {
				BX.bind(this._button, "click", this._clickHandler);
			}
			this._container.appendChild(this._button);
		}
		openMenu() {
			if (this._isMenuShown) {
				return;
			}
			const handler = BX.delegate(this.onMenuItemClick, this);
			const menuItems = [{
				id: "hour_1",
				text: this.getMessage("forOneHour"),
				onclick: handler
			}, {
				id: "hour_2",
				text: this.getMessage("forTwoHours"),
				onclick: handler
			}, {
				id: "hour_3",
				text: this.getMessage("forThreeHours"),
				onclick: handler
			}, {
				id: "day_1",
				text: this.getMessage("forOneDay"),
				onclick: handler
			}, {
				id: "day_2",
				text: this.getMessage("forTwoDays"),
				onclick: handler
			}, {
				id: "day_3",
				text: this.getMessage("forThreeDays"),
				onclick: handler
			}];
			BX.PopupMenu.show(this._id, this._button, menuItems, {
				offsetTop: 0,
				offsetLeft: 16,
				events: {
					onPopupShow: BX.delegate(this.onMenuShow, this),
					onPopupClose: BX.delegate(this.onMenuClose, this),
					onPopupDestroy: BX.delegate(this.onMenuDestroy, this)
				}
			});
			this._menu = BX.PopupMenu.currentItem;
		}
		closeMenu() {
			if (!this._isMenuShown) {
				return;
			}
			if (this._menu) {
				this._menu.close();
			}
		}
		onClick() {
			if (!this._isEnabled) {
				return;
			}
			if (this._isMenuShown) {
				this.closeMenu();
			} else {
				this.openMenu();
			}
		}
		onMenuItemClick(e, item) {
			this.closeMenu();
			let offset = 0;
			if (item.id === "hour_1") {
				offset = 3600;
			} else if (item.id === "hour_2") {
				offset = 7200;
			} else if (item.id === "hour_3") {
				offset = 10800;
			} else if (item.id === "day_1") {
				offset = 86400;
			} else if (item.id === "day_2") {
				offset = 172800;
			} else if (item.id === "day_3") {
				offset = 259200;
			}
			if (offset > 0 && this._item) {
				this._item.postpone(offset);
			}
		}
		onMenuShow() {
			this._isMenuShown = true;
		}
		onMenuClose() {
			if (this._menu && this._menu.popupWindow) {
				this._menu.popupWindow.destroy();
			}
		}
		onMenuDestroy() {
			this._isMenuShown = false;
			this._menu = null;
			if (typeof BX.PopupMenu.Data[this._id] !== "undefined") {
				delete BX.PopupMenu.Data[this._id];
			}
		}
		getMessage(name) {
			const m = SchedulePostpone.messages;
			return m.hasOwnProperty(name) ? m[name] : name;
		}
		static create(id, settings) {
			const self = new SchedulePostpone();
			self.initialize(id, settings);
			return self;
		}
		static messages = {};
	}

	/** @memberof BX.Crm.Timeline.Animation */
	let Comment$1 = class Comment {
		constructor() {
			this._node = null;
			this._anchor = null;
			this._nodeParent = null;
			this._startPosition = null;
			this._events = null;
		}
		initialize(node, anchor, startPosition, events) {
			this._node = node;
			this._anchor = anchor;
			this._nodeParent = node.parentNode;
			this._startPosition = startPosition;
			this._events = BX.type.isPlainObject(events) ? events : {};
		}
		run() {
			BX.addClass(this._node, 'crm-entity-stream-section-animate-start');
			this._node.style.position = "absolute";
			this._node.style.width = this._startPosition.width + "px";
			this._node.style.height = this._startPosition.height + "px";
			this._node.style.top = this._startPosition.top - 30 + "px";
			this._node.style.left = this._startPosition.left + "px";
			this._node.style.opacity = 0;
			this._node.style.zIndex = 960;
			document.body.appendChild(this._node);
			const nodeOpacityAnim = new BX.easing({
				duration: 350,
				start: {
					opacity: 0
				},
				finish: {
					opacity: 100
				},
				transition: BX.easing.makeEaseOut(BX.easing.transitions.quart),
				step: BX.proxy(function (state) {
					this._node.style.opacity = state.opacity / 100;
				}, this),
				complete: BX.proxy(function () {
					if (BX.type.isFunction(this._events["start"])) {
						this._events["start"]();
					}
					const shift = Shift.create(this._node, this._anchor, this._startPosition, false, {
						complete: BX.delegate(this.finish, this)
					});
					shift.run();
				}, this)
			});
			nodeOpacityAnim.animate();
			if (BX.type.isFunction(this._events["complete"])) {
				this._events["complete"]();
			}
		}
		finish() {
			this._node.style.position = "";
			this._node.style.width = "";
			this._node.style.height = "";
			this._node.style.top = "";
			this._node.style.left = "";
			this._node.style.opacity = "";
			this._node.style.zIndex = "";
			this._anchor.style.height = "";
			this._anchor.parentNode.insertBefore(this._node, this._anchor.nextSibling);
			setTimeout(BX.delegate(function () {
				BX.removeClass(this._node, 'crm-entity-stream-section-animate-start');
				BX.remove(this._anchor);
			}, this), 0);
		}
		static create(node, anchor, startPosition, events) {
			const self = new Comment();
			self.initialize(node, anchor, startPosition, events);
			return self;
		}
	};

	const Streams = {
		History,
		FixedHistory,
		EntityChat,
		Schedule
	};
	const Tools = {
		SchedulePostponeController,
		AudioPlaybackRateSelector,
		WorkflowEventManager
	};
	const Actions = {
		Activity: Activity$1,
		Call: Call$2,
		HistoryCall,
		ScheduleCall,
		Email: Email$2,
		HistoryEmail,
		ScheduleEmail,
		OpenLine: OpenLine$2,
		SchedulePostpone
	};
	const ScheduledItems = {
		Activity: Activity,
		Email: Email,
		Call: Call,
		CallTracker,
		Meeting: Meeting,
		Task: Task,
		WebForm: WebForm,
		Wait: Wait,
		Request: Request,
		Rest: Rest,
		OpenLine: OpenLine,
		Zoom: Zoom
	};
	const Items = {
		History: History$1,
		HistoryActivity,
		Comment: Comment$2,
		Modification,
		Mark,
		Creation,
		Restoration,
		Relation,
		Link,
		Unlink,
		Email: Email$1,
		Call: Call$1,
		Meeting: Meeting$1,
		Task: Task$1,
		WebForm: WebForm$1,
		Wait: Wait$1,
		Document,
		Sender,
		Bizproc,
		Request: Request$1,
		Rest: Rest$1,
		OpenLine: OpenLine$1,
		Zoom: Zoom$1,
		Conversion,
		Visit,
		ExternalNoticeModification,
		ExternalNoticeStatusModification,
		ScheduledBase: Scheduled,
		Scheduled: ScheduledItems
	};
	const Animations = {
		Item: Item,
		ItemNew,
		Expand,
		Shift,
		Comment: Comment$1,
		Fasten
	};

	exports.Action = Action;
	exports.Actions = Actions;
	exports.Animations = Animations;
	exports.CompatibleItem = CompatibleItem;
	exports.Items = Items;
	exports.Manager = Manager;
	exports.Stream = Steam;
	exports.Streams = Streams;
	exports.Tools = Tools;
	exports.Types = types;

})(this.BX.Crm.Timeline = this.BX.Crm.Timeline || {}, BX.Crm.Timeline, BX, BX.Main, BX.Crm.Timeline, BX.Vue3, BX, BX.UI.IconSet, BX, BX.UI.Analytics, BX.UI.Notification, BX.UI, BX.UI.System, BX.UI, BX.Vue3.Directives, BX.Main, BX.UI.IconSet, BX.Vue3.Components, BX.Crm.Field, BX.Event, window, BX.UI.System.Label, BX.UI, BX.Crm.Timeline);
//# sourceMappingURL=timeline.bundle.js.map
