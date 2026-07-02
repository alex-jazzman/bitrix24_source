/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, main_core, main_kanban, main_popup, d3, ui_notification, ui_analytics) {
	'use strict';

	function _interopNamespaceDefault(e) {
		var n = Object.create(null);
		if (e) {
			Object.keys(e).forEach(function (k) {
				if (k !== 'default') {
					var d = Object.getOwnPropertyDescriptor(e, k);
					Object.defineProperty(n, k, d.get ? d : {
						enumerable: true,
						get: function () { return e[k]; }
					});
				}
			});
		}
		n.default = e;
		return Object.freeze(n);
	}

	var d3__namespace = /*#__PURE__*/_interopNamespaceDefault(d3);

	function createStub() {
		return main_core.Tag.render`<div class="crm-st-kanban-stub"></div>`;
	}

	function isLine(value) {
		return main_core.Type.isArray(value) && value.length === 2 && value.every(main_core.Type.isNumber);
	}

	function isOverlap(line1, line2) {
		if (!isLine(line1) || !isLine(line2)) {
			throw new Error('Invalid lines. Line should be Array<number>');
		}
		const a1 = Math.min(...line1);
		const a2 = Math.max(...line1);
		const b1 = Math.min(...line2);
		const b2 = Math.max(...line2);
		return a1 >= b1 && a1 <= b2 || a2 >= b1 && a2 <= b2 || b1 >= a1 && b1 <= a2 || b2 >= a1 && b2 <= a2;
	}

	const isValidRect = rect => main_core.Type.isNumber(rect.left) && main_core.Type.isNumber(rect.top) && main_core.Type.isNumber(rect.width) && main_core.Type.isNumber(rect.height);
	function makeRelativeRect(rect1, rect2) {
		if (!isValidRect(rect1) || !isValidRect(rect2)) {
			throw new Error('Invalid rect. Rect should includes x, y, width and height props with a number value');
		}
		return {
			left: rect2.left - rect1.left,
			top: rect2.top - rect1.top,
			right: rect2.left - rect1.left + rect2.width,
			bottom: rect2.top - rect1.top + rect2.height,
			width: rect2.width,
			height: rect2.height
		};
	}

	function isRect(value) {
		return main_core.Type.isNumber(value.left) && main_core.Type.isNumber(value.top) && main_core.Type.isNumber(value.width) && main_core.Type.isNumber(value.height);
	}

	function getMiddlePoint(rect) {
		if (!isRect(rect)) {
			throw new Error('Invalid rect. Rect should includes x, y, width and height props with a number value');
		}
		return {
			middleX: rect.left + rect.width / 2,
			middleY: rect.top + rect.height / 2
		};
	}

	/**
	 * Implements interface for works with marker
	 */
	class Marker extends main_core.Event.EventEmitter {
		static instances = [];
		static paths = [];
		static getMarkerFromPoint(point) {
			return Marker.instances.find(marker => marker.isReceiverIntersecting(point));
		}
		static emitReceiverDragOutForAll(exclude = null) {
			Marker.instances.forEach(marker => {
				if (marker !== exclude) {
					marker.onReceiverDragOut();
				}
			});
		}
		static getAllLinks() {
			return Marker.instances.reduce((/* Set */acc, marker) => [...marker.links].reduce((subAcc, link) => subAcc.add(link), acc), new Set());
		}
		static getAllStubLinks() {
			return Marker.instances.reduce((/* Set */acc, marker) => [...marker.stubLinks].reduce((subAcc, link) => subAcc.add(link), acc), new Set());
		}
		static highlightLink(...targets) {
			Marker.getAllLinks().forEach(link => {
				if (!targets.includes(link)) {
					if ([...targets].every(item => item.from !== link.from)) {
						main_core.Dom.addClass(link.from.dispatcher, 'crm-st-fade');
						main_core.Dom.addClass(link.from.receiver, 'crm-st-fade');
						main_core.Dom.addClass(link.from.getTunnelButton(), 'crm-st-fade');
					}
					main_core.Dom.addClass(link.to.dispatcher, 'crm-st-fade');
					main_core.Dom.addClass(link.to.receiver, 'crm-st-fade');
					main_core.Dom.addClass(link.node.node(), 'crm-st-fade');
					main_core.Dom.addClass(link.arrow.select('path').node(), 'crm-st-fade');
				} else {
					const node = link.node.node();
					node.parentNode.appendChild(node);
					const arrowMarker = link.arrow.node();
					const defs = arrowMarker.closest('defs');
					main_core.Dom.insertAfter(arrowMarker, defs.firstChild);
				}
			});
		}
		static unhighlightLinks() {
			Marker.getAllLinks().forEach(link => {
				main_core.Dom.removeClass(link.from.dispatcher, 'crm-st-fade');
				main_core.Dom.removeClass(link.from.receiver, 'crm-st-fade');
				main_core.Dom.removeClass(link.from.getTunnelButton(), 'crm-st-fade');
				main_core.Dom.removeClass(link.to.dispatcher, 'crm-st-fade');
				main_core.Dom.removeClass(link.to.receiver, 'crm-st-fade');
				main_core.Dom.removeClass(link.node.node(), 'crm-st-fade');
				main_core.Dom.removeClass(link.arrow.select('path').node(), 'crm-st-fade');
			});
		}
		static blurLinks(marker) {
			Marker.getAllLinks().forEach(link => {
				if (link.from === marker || link.to === marker) {
					main_core.Dom.addClass(link.node.node(), 'crm-st-blur-link');
					main_core.Dom.addClass(link.from.getTunnelButton(), 'crm-st-blur-link');
				}
			});
		}
		static unblurLinks() {
			Marker.getAllLinks().forEach(link => {
				main_core.Dom.removeClass(link.node.node(), 'crm-st-blur-link');
				main_core.Dom.removeClass(link.from.getTunnelButton(), 'crm-st-blur-link');
				main_core.Dom.removeClass(link.to.getTunnelButton(), 'crm-st-blur-link');
			});
		}
		static removeAllLinks() {
			Marker.instances.forEach(marker => {
				const preventSave = true;
				marker.removeAllLinks(preventSave);
			});
			Marker.instances.forEach(marker => {
				marker.removeAllStubLinks();
			});
		}
		static restoreAllLinks() {
			const preventSave = true;
			Marker.getAllLinks().forEach(link => {
				link.from.links.delete(link);
				link.from.addLinkTo(link.to, link.robotAction, preventSave);
			});
		}
		static adjustLinks() {
			Marker.getAllLinks().forEach((link, index) => {
				const path = link.from.getLinkPath(link.to);
				link.node.style('transition', 'none');
				d3__namespace.select(link.from.getTunnelButton()).style('transition', 'none');
				link.from.showTunnelButton(path);
				link.node.attr('d', d3__namespace.line()(path));
				link.path = path;
				clearTimeout(Marker.adjustLinksTimeoutIds[index]);
				Marker.adjustLinksTimeoutIds[index] = setTimeout(() => {
					link.node.style('transition', null);
					d3__namespace.select(link.from.getTunnelButton()).style('transition', null);
				}, 1000);
			});
		}
		static adjustLinksTimeoutIds = {};

		// Links from this marker
		links = new Set();
		stubLinks = new Set();
		cache = new main_core.Cache.MemoryCache();
		constructor(options) {
			super();
			this.dispatcher = options.dispatcher;
			this.receiver = options.receiver;
			this.point = options.point;
			this.container = options.container;
			this.intermediateXPoints = options.intermediateXPoints;
			this.name = options.name;
			this.data = options.data;
			const linksRoot = this.getLinksRoot();

			// Add arrow marker
			if (!linksRoot.select('defs').node()) {
				linksRoot.append('svg:defs').append('filter').attr('id', 'crm-st-blur').append('feGaussianBlur').attr('stdDeviation', '2');
				linksRoot.select('#crm-st-blur').append('feColorMatrix').attr('type', 'saturate').attr('values', '0');
			}
			this.onDispatcherMouseDown = this.onDispatcherMouseDown.bind(this);
			this.onMarkerRootMouseUp = this.onMarkerRootMouseUp.bind(this);
			this.onMarkerRootMouseMove = this.onMarkerRootMouseMove.bind(this);
			d3__namespace.select(this.dispatcher).on('mousedown', this.onDispatcherMouseDown);
			Marker.instances.push(this);
		}
		disable() {
			this.disabled = true;
		}
		enable() {
			this.disabled = false;
		}
		isEnabled() {
			return !this.disabled;
		}
		getMarkerRoot() {
			return this.cache.remember('markerRoot', () => {
				const markerRoot = d3__namespace.select(this.container).select('.crm-st-svg-root');
				if (markerRoot.node()) {
					return markerRoot;
				}
				return d3__namespace.select(this.container).append('svg').attr('class', 'crm-st-svg-root');
			});
		}
		getMarkerRootRect() {
			return this.getMarkerRoot().node().getBoundingClientRect();
		}
		getLinksRoot() {
			return this.cache.remember('linksRoot', () => {
				const linksRoot = d3__namespace.select(this.container).select('.crm-st-svg-links-root');
				if (linksRoot.node()) {
					return linksRoot;
				}
				return d3__namespace.select(this.container).append('svg').attr('class', 'crm-st-svg-links-root');
			});
		}
		getMarkerLine() {
			return this.cache.remember('markerLine', this.getMarkerRoot().append('line').attr('class', 'crm-st-svg-marker'));
		}
		removeMarkerLine() {
			this.getMarkerLine().remove();
			this.cache.delete('markerLine');
		}
		getDispatcherRect() {
			const relativeRect = makeRelativeRect(this.getMarkerRootRect(), this.dispatcher.getBoundingClientRect());
			return {
				...relativeRect,
				...getMiddlePoint(relativeRect)
			};
		}
		getReceiverRect() {
			const relativeRect = makeRelativeRect(this.getMarkerRootRect(), this.receiver.getBoundingClientRect());
			return {
				...relativeRect,
				...getMiddlePoint(relativeRect)
			};
		}
		getPointRect() {
			const relativeRect = makeRelativeRect(this.getMarkerRootRect(), this.point.getBoundingClientRect());
			return {
				...relativeRect,
				...getMiddlePoint(relativeRect)
			};
		}
		getMarkerRootMousePosition() {
			if (main_core.Type.isFunction(d3__namespace.pointer)) {
				const [x, y] = d3__namespace.pointer(this.getMarkerRootMouseMoveEvent(), this.getMarkerRoot().node());
				return {
					x,
					y
				};
			}
			const [x, y] = d3__namespace.mouse(this.getMarkerRoot().node());
			return {
				x,
				y
			};
		}

		/** @private */
		onReceiverDragOver(from, to) {
			if (!this.hovered) {
				this.hovered = true;
				this.emit('Marker:receiver:dragOver', {
					from,
					to
				});
			}
		}

		/** @private */
		onReceiverDragOut() {
			if (this.hovered) {
				this.hovered = false;
				this.emit('Marker:receiver:dragOut');
			}
		}

		/** @private */
		onDispatcherMouseDown() {
			const {
				middleX,
				middleY
			} = this.getDispatcherRect();
			this.getMarkerLine().attr('x1', middleX).attr('y1', middleY).attr('x2', middleX).attr('y2', middleY);
			this.getMarkerRoot().style('z-index', '222').on('mousemove', this.onMarkerRootMouseMove).on('mouseup', this.onMarkerRootMouseUp);
			this.emit('Marker:dragStart');
		}
		setMarkerRootMouseMoveEvent(event) {
			this.cache.set('markerRootMouseMoveEvent', event);
		}
		getMarkerRootMouseMoveEvent() {
			return this.cache.get('markerRootMouseMoveEvent');
		}

		/** @private */
		onMarkerRootMouseMove(event) {
			this.setMarkerRootMouseMoveEvent(event);
			const {
				x,
				y
			} = this.getMarkerRootMousePosition();
			this.getMarkerLine().attr('x2', x).attr('y2', y);
			this.emit('Marker:drag');
			const destinationMarker = this.getDestinationMarker();
			if (destinationMarker && destinationMarker.isEnabled()) {
				if (destinationMarker !== this) {
					destinationMarker.onReceiverDragOver(this, destinationMarker);
				}
			}
			Marker.emitReceiverDragOutForAll(destinationMarker);
		}

		/** @private */
		onMarkerRootMouseUp() {
			this.getMarkerRoot().on('mousemove', null).on('mouseup', null).style('z-index', null);
			this.removeMarkerLine();

			// @todo refactoring
			Marker.instances.forEach(marker => marker.onReceiverDragOut());
			const destinationMarker = this.getDestinationMarker();
			const event = new main_core.Event.BaseEvent({
				data: {
					from: this,
					to: destinationMarker
				}
			});
			this.emit('Marker:dragEnd', event);
			if (destinationMarker && destinationMarker.isEnabled()) {
				if (destinationMarker && !event.isDefaultPrevented()) {
					if (!this.data.column.data.isCategoryEditable) {
						this.emit('Marker:error', {
							message: main_core.Loc.getMessage('CRM_ST_TUNNEL_EDIT_ACCESS_DENIED')
						});
						return;
					}
					this.addLinkTo(destinationMarker, 'copy');
				}
			}
		}
		getTunnelMenu() {
			return this.cache.remember('tunnelMenu', () => new main_popup.PopupMenuWindow({
				bindElement: this.getTunnelButton(),
				items: this.getTunnelMenuItems([...this.links][0]),
				events: {
					onPopupClose: () => this.deactivateTunnelButton(),
					onPopupShow: () => this.activateTunnelButton()
				}
			}));
		}
		getTunnelMenuItems(link) {
			const self = this;
			const onRobotActionChange = function (robotAction) {
				if (!main_core.Type.isNil(link) && link.robotAction !== robotAction) {
					self.changeRobotAction(link, robotAction);
					link.robotAction = robotAction;
				}
				this.getParentMenuWindow().close();
				this.getParentMenuWindow().getMenuItems()[0].setText(main_core.Loc.getMessage(`CRM_ST_ROBOT_ACTION_${robotAction.toUpperCase()}`));
			};
			const robotAction = main_core.Type.isNil(link) ? 'COPY' : link.robotAction.toUpperCase();
			return [{
				text: main_core.Loc.getMessage(`CRM_ST_ROBOT_ACTION_${robotAction}`),
				items: [{
					text: main_core.Loc.getMessage('CRM_ST_ACTION_COPY'),
					onclick() {
						onRobotActionChange.call(this, 'copy');
					}
				}, {
					text: main_core.Loc.getMessage('CRM_ST_ACTION_MOVE'),
					onclick() {
						onRobotActionChange.call(this, 'move');
					}
				}]
			}, {
				text: main_core.Loc.getMessage('CRM_ST_SETTINGS'),
				onclick() {
					self.editLink(link);
					this.close();
				}
			}, {
				text: main_core.Loc.getMessage('CRM_ST_REMOVE'),
				onclick() {
					self.removeLink(link);
					const parentMenu = this.getParentMenuWindow();
					if (parentMenu) {
						parentMenu.removeMenuItem(this.getParentMenuItem().id);
					}
				}
			}];
		}
		changeRobotAction(link, action) {
			this.emit('Marker:changeRobotAction', {
				link,
				action,
				onChangeRobotEnd: () => this.emit('Marker:editLink', {
					link
				})
			});
		}
		editLink(link) {
			this.emit('Marker:editLink', {
				link
			});
		}
		addLinkTo(destination, robotAction, preventSave = false) {
			if (![...this.links].some(link => link.to === destination)) {
				const linksRoot = this.getLinksRoot();
				const path = this.getLinkPath(destination);
				const line = d3__namespace.line();
				const fromId = this.data.column.getId().replace(':', '-');
				const toId = destination.data.column.getId().replace(':', '-');
				const arrowId = `${fromId}-${toId}`;
				const arrow = linksRoot.select('defs').append('svg:marker').attr('id', arrowId).attr('refX', 8).attr('refY', 6).attr('markerWidth', 30).attr('markerHeight', 30).attr('markerUnits', 'userSpaceOnUse').attr('orient', 'auto').append('path').attr('d', 'M 0 0 12 6 0 12 3 6').attr('class', 'crm-st-svg-link-arrow').select(function selectCallback() {
					return this.parentNode;
				});
				const linkNode = linksRoot.append('path').attr('class', 'crm-st-svg-link').attr('marker-end', `url(#${arrowId})`).attr('d', line(path));
				this.showTunnelButton(path);
				const link = {
					from: this,
					to: destination,
					node: linkNode,
					robotAction,
					arrow,
					path
				};
				this.emit('Marker:linkFrom', {
					link,
					preventSave
				});
				destination.emit('Marker:linkTo', {
					link,
					preventSave
				});
				this.links.add(link);
				const menu = this.getTunnelsListMenu();
				const id = menu.getMenuItems().length;
				menu.addMenuItem({
					id: `#${id}`,
					text: main_core.Text.encode(destination.name),
					events: {
						onMouseEnter() {
							Marker.highlightLink(link);
						},
						onMouseLeave() {
							Marker.unhighlightLinks();
						}
					},
					items: this.getTunnelMenuItems(link)
				});
			}
			if (this.links.size > 1) {
				this.setTunnelsCounterValue(this.links.size);
			}
		}
		addStubLinkTo(destination) {
			setTimeout(() => {
				if (![...this.stubLinks].some(link => link.to === destination)) {
					const linksRoot = this.getLinksRoot();
					const path = this.getLinkPath(destination);
					const line = d3__namespace.line();
					const fromId = this.data.column.getId().replace(':', '-');
					const toId = destination.data.column.getId().replace(':', '-');
					const arrowId = `${fromId}-${toId}`;
					const arrow = linksRoot.select('defs').append('svg:marker').attr('id', arrowId).attr('refX', 8).attr('refY', 6).attr('markerWidth', 30).attr('markerHeight', 30).attr('markerUnits', 'userSpaceOnUse').attr('orient', 'auto').append('path').attr('d', 'M 0 0 12 6 0 12 3 6').attr('class', 'crm-st-svg-link-arrow crm-st-svg-link-arrow-stub').select(function selectCallback() {
						return this.parentNode;
					});
					const linkNode = linksRoot.append('path').attr('class', 'crm-st-svg-link crm-st-svg-link-stub').attr('marker-end', `url(#${arrowId})`).attr('d', line(path));
					this.showTunnelStubButton(path);
					const link = {
						from: this,
						to: destination,
						node: linkNode,
						arrow,
						path
					};
					this.emit('Marker:stubLinkFrom', {
						link,
						preventSave: true
					});
					destination.emit('Marker:stubLinkTo', {
						link,
						preventSave: true
					});
					this.stubLinks.add(link);
				}
			});
		}
		updateLink(link, newTo, preventSave = false) {
			const path = this.getLinkPath(newTo);
			const line = d3__namespace.line();
			const oldTo = link.to;
			link.node.attr('d', line(path));
			link.path = path;
			link.to = newTo;
			this.emit('Marker:linkFrom', {
				link,
				preventSave
			});
			newTo.emit('Marker:linkTo', {
				link,
				preventSave
			});
			if (!oldTo.isLinked()) {
				oldTo.emit('Marker:unlink');
			}
		}
		removeLink(link, preventSave = false) {
			// @todo refactoring

			link.hidden = true;
			if (!preventSave) {
				this.links.delete(link);
			}
			link.node.remove();
			link.arrow.remove();
			if (!this.isLinkedFrom()) {
				main_core.Dom.remove(link.from.getTunnelButton());
				this.getTunnelMenu().destroy();
				this.deactivateTunnelButton();
				this.cache.delete('tunnelMenu');
			}
			this.setTunnelsCounterValue(this.links.size);
			const visibleLinks = [...this.links].filter(item => !item.hidden);
			if (visibleLinks.length <= 1) {
				if (this.getTunnelsListMenu().getPopupWindow().isShown()) {
					this.getTunnelMenu().destroy();
					this.cache.delete('tunnelMenu');
					this.getTunnelMenu().show();
				}
				this.getTunnelsListMenu().destroy();
				this.deactivateTunnelButton();
				this.cache.delete('tunnelsListMenu');
			}
			link.from.emit('Marker:removeLinkFrom', {
				link,
				preventSave
			});
			if (!link.from.isLinked()) {
				link.from.emit('Marker:unlink', {
					preventSave
				});
			}
			link.to.emit('Marker:removeTo', {
				link,
				preventSave
			});
			if (!link.to.isLinked()) {
				link.to.emit('Marker:unlink', {
					preventSave
				});
			}
		}
		removeAllLinks(preventSave = false) {
			this.links.forEach(link => this.removeLink(link, preventSave));
		}
		removeStubLink(link) {
			this.stubLinks.delete(link);
			link.node.remove();
			link.arrow.remove();
			if (!this.isLinkedStub()) {
				main_core.Dom.remove(link.from.getStubTunnelButton());
			}
			link.from.emit('Marker:removeStubLink', {
				link
			});
			link.from.emit('Marker:removeStubLinkFrom', {
				link
			});
			if (!link.from.isLinkedStub()) {
				link.from.emit('Marker:unlinkStub');
			}
			link.to.emit('Marker:removeStubTo', {
				link
			});
			if (!link.to.isLinkedStub()) {
				link.to.emit('Marker:unlinkStub');
			}
		}
		removeAllStubLinks() {
			this.stubLinks.forEach(link => this.removeStubLink(link));
		}
		isLinked() {
			return [...Marker.getAllLinks()].some(item => !item.hidden && (item.from === this || item.to === this));
		}
		isLinkedFrom() {
			return [...Marker.getAllLinks()].some(item => !item.hidden && item.from === this);
		}
		isLinkedTo() {
			return [...Marker.getAllLinks()].some(item => !item.hidden && item.to === this);
		}
		isLinkedStub() {
			return [...Marker.getAllLinks()].some(item => !item.hidden && (item.from === this || item.to === this));
		}
		showTunnelButton(path) {
			const button = this.getTunnelButton();
			const category = this.getCategory();
			const left = path[0][0];
			main_core.Tag.style(button)`
			bottom: 0px;
			left: ${left}px;
			transform: translate3d(-50%, 50%, 0);
		`;
			if (!category.contains(button)) {
				main_core.Dom.append(button, category);
			}
		}
		getStubTunnelButton() {
			return this.cache.remember('tunnelStubButton', () => {
				const button = main_core.Runtime.clone(this.getTunnelButton());
				main_core.Dom.addClass(button, 'crm-st-tunnel-button-stub');
				return button;
			});
		}
		showTunnelStubButton(path) {
			const button = this.getStubTunnelButton();
			const category = this.getCategory();
			const left = path[0][0];
			main_core.Tag.style(button)`
			bottom: 0px;
			left: ${left}px;
			transform: translate3d(-50%, 50%, 0);
		`;
			if (!category.contains(button)) {
				main_core.Dom.append(button, category);
			}
		}
		getTunnelButton() {
			const canEdit = this.data.column.data.isCategoryEditable;
			return this.cache.remember('tunnelButton', () => main_core.Tag.render`
				<div class="crm-st-tunnel-button" 
					 onmouseenter="${this.onTunnelButtonMouseEnter.bind(this)}"
					 onmouseleave="${Marker.onTunnelButtonMouseLeave}"
					 onclick="${this.onTunnelButtonClick.bind(this)}"
					 title="${main_core.Loc.getMessage('CRM_ST_TUNNEL_BUTTON_TITLE')}"
					 style="${!canEdit ? 'pointer-events: none;' : ''}"
				>${main_core.Loc.getMessage('CRM_ST_TUNNEL_BUTTON_LABEL')}</div>
			`);
		}

		/** @private */
		onTunnelButtonMouseEnter() {
			Marker.highlightLink(...this.links);
		}

		/** @private */
		static onTunnelButtonMouseLeave() {
			Marker.unhighlightLinks();
		}

		/** @private */
		onTunnelButtonClick() {
			if (BX.Crm.Restriction.Bitrix24.isRestricted('automation')) {
				BX.Crm.Restriction.Bitrix24.getHandler('automation').call();
			} else if (this.links.size > 1) {
				if (this.isTunnelButtonActive()) {
					this.getTunnelsListMenu().close();
					return;
				}
				this.getTunnelsListMenu().show();
			} else {
				this.getTunnelMenu().show();
			}
		}
		getTunnelsListMenu() {
			return this.cache.remember('tunnelsListMenu', new main_popup.PopupMenuWindow({
				bindElement: this.getTunnelButton(),
				items: [],
				closeByEsc: true,
				menuShowDelay: 0,
				events: {
					onPopupClose: () => this.deactivateTunnelButton(),
					onPopupShow: () => this.activateTunnelButton()
				}
			}));
		}
		activateTunnelButton() {
			main_core.Dom.addClass(this.getTunnelButton(), 'crm-st-tunnel-button-active');
		}
		deactivateTunnelButton() {
			main_core.Dom.removeClass(this.getTunnelButton(), 'crm-st-tunnel-button-active');
		}
		isTunnelButtonActive() {
			return main_core.Dom.hasClass(this.getTunnelButton(), 'crm-st-tunnel-button-active');
		}
		getTunnelsCounter() {
			return this.cache.remember('tunnelsCounter', main_core.Tag.render`<span class="crm-st-tunnel-button-counter">0</span>`);
		}
		setTunnelsCounterValue(value) {
			const tunnelButton = this.getTunnelButton();
			const tunnelsCounter = this.getTunnelsCounter();
			if (value > 1) {
				if (!tunnelButton.contains(tunnelsCounter)) {
					main_core.Dom.append(tunnelsCounter, tunnelButton);
				}
				tunnelsCounter.innerText = value;
			} else {
				tunnelsCounter.innerText = 0;
				main_core.Dom.remove(tunnelsCounter);
			}
		}
		getCategory() {
			return this.receiver.closest('.crm-st-category');
		}
		getIntermediateXPoints() {
			if (main_core.Type.isArray(this.intermediateXPoints)) {
				const markerRootRect = this.getMarkerRootRect();
				return this.intermediateXPoints.map(value => value - markerRootRect.left);
			}
			if (main_core.Type.isFunction(this.intermediateXPoints)) {
				const markerRootRect = this.getMarkerRootRect();
				return this.intermediateXPoints().map(value => value - markerRootRect.left);
			}
			return [];
		}
		getNearestIntermediateXPoint(x) {
			return this.getIntermediateXPoints().reduce((prev, curr) => Math.abs(curr - x) < Math.abs(prev - x) ? curr : prev);
		}
		getLinkPath(target) {
			const targetPosition = target.getPointRect();
			const currentPosition = this.getDispatcherRect();
			const baseOffset = 80;
			const markerMargin = 10;
			const path = [];
			path.push([currentPosition.middleX, currentPosition.middleY]);
			path.push([currentPosition.middleX, currentPosition.middleY + baseOffset]);
			if (currentPosition.middleY !== targetPosition.middleY) {
				const intermediateX = this.getNearestIntermediateXPoint(targetPosition.middleX);
				path.push([intermediateX, currentPosition.middleY + baseOffset]);
				path.push([intermediateX, targetPosition.middleY + baseOffset / 3 - markerMargin / 3]);
				path.push([targetPosition.middleX, targetPosition.middleY + baseOffset / 3 - markerMargin / 3]);
			} else {
				path.push([targetPosition.middleX, targetPosition.middleY + baseOffset]);
			}
			path.push([targetPosition.middleX, targetPosition.middleY + markerMargin]);
			const lineOffset = 4;
			return [...Marker.getAllLinks()].reduce((acc, link) => {
				const {
					from,
					path: currentPath
				} = link;
				if (from !== this) {
					/**
					 * Horizon lines
					 * 1x -> 2x
					 * 3x -> 4x
					 */

					if (acc[1][1] === currentPath[1][1]) {
						if (isOverlap([acc[1][0], acc[2][0]], [currentPath[1][0], currentPath[2][0]])) {
							acc[1][1] += lineOffset;
							acc[2][1] += lineOffset;
						}
					}
					if (currentPath.length === 6) {
						if (acc[1][1] === currentPath[3][1]) {
							if (isOverlap([acc[1][0], acc[2][0]], [currentPath[3][0], currentPath[4][0]])) {
								acc[1][1] += lineOffset;
								acc[2][1] += lineOffset;
							}
						}
					}
					if (acc.length === 6) {
						if (acc[3][1] === currentPath[1][1]) {
							if (isOverlap([acc[3][0], acc[4][0]], [currentPath[1][0], currentPath[2][0]])) {
								acc[3][1] += lineOffset;
								acc[4][1] += lineOffset;
							}
						}
						if (currentPath.length === 6) {
							if (acc[3][1] === currentPath[3][1]) {
								if (isOverlap([acc[3][0], acc[4][0]], [currentPath[3][0], currentPath[4][0]])) {
									acc[3][1] += lineOffset;
									acc[4][1] += lineOffset;
								}
							}
						}
					}

					/**
					 * Vertical line
					 * 2y -> 3y
					 */

					if (acc.length === 6) {
						if (acc[2][0] === currentPath[2][0]) {
							if (isOverlap([acc[2][1], acc[3][1]], [currentPath[2][1], currentPath[3][1]])) {
								acc[2][0] += lineOffset;
								acc[3][0] += lineOffset;
							}
						}
					}
				}
				return acc;
			}, [...path]);
		}
		getDestinationMarker() {
			const mousePosition = this.getMarkerRootMousePosition();
			const destinationMarker = Marker.getMarkerFromPoint(mousePosition);
			if (destinationMarker && destinationMarker !== this) {
				return destinationMarker;
			}
			return null;
		}
		isReceiverIntersecting(point) {
			const receiverRect = this.getReceiverRect();
			const heightOffset = 10;
			return point.x > receiverRect.left && point.x < receiverRect.right && point.y > receiverRect.top && point.y < receiverRect.bottom + heightOffset;
		}
		blurLinks() {
			Marker.blurLinks(this);
		}
		getData() {
			return this.data;
		}
	}

	function isLinkInSameCategory(event) {
		const columnFrom = event.data.from.data.column;
		const columnTo = event.data.to.data.column;
		const dataFrom = columnFrom.getData();
		const dataTo = columnTo.getData();
		return String(dataFrom.category.id) === String(dataTo.category.id);
	}

	function isCycleLink(event) {
		const columnFrom = event.data.from.data.column;
		const columnTo = event.data.to.data.column;
		return [...Marker.getAllLinks()].some(item => {
			return item.from === columnTo.marker && item.to === columnFrom.marker;
		});
	}

	if (BX.Kanban.Pagination) {
		BX.Kanban.Pagination.prototype.adjust = () => {};
	}
	class Column extends main_kanban.Kanban.Column {
		constructor(options) {
			super(options);
			this.currentName = this.getName();
			this.marker = new Marker({
				dispatcher: this.getDot(),
				receiver: this.getHeader(),
				point: this.getDot(),
				container: this.getData().appContainer,
				intermediateXPoints: () => this.getIntermediateXPoints(),
				name: `${this.getData().categoryName} (${this.getName()})`,
				data: {
					column: this
				}
			});
			this.marker.subscribe('Marker:dragStart', this.onMarkerDragStart.bind(this)).subscribe('Marker:receiver:dragOver', this.onMarkerDragOver.bind(this)).subscribe('Marker:receiver:dragOut', this.onMarkerDragOut.bind(this)).subscribe('Marker:dragEnd', this.onMarkerDragEnd.bind(this)).subscribe('Marker:linkFrom', this.onMarkerLinkFrom.bind(this)).subscribe('Marker:stubLinkFrom', this.onMarkerStubLinkFrom.bind(this)).subscribe('Marker:linkTo', this.onMarkerLinkTo.bind(this)).subscribe('Marker:stubLinkTo', this.onMarkerStubLinkTo.bind(this)).subscribe('Marker:removeLinkFrom', this.onRemoveLinkFrom.bind(this)).subscribe('Marker:changeRobotAction', this.onChangeRobotAction.bind(this)).subscribe('Marker:editLink', this.onEditLink.bind(this)).subscribe('Marker:unlink', this.onMarkerUnlink.bind(this)).subscribe('Marker:unlinkStub', this.onMarkerUnlinkStub.bind(this)).subscribe('Marker:error', this.onMarkerError.bind(this));
			this.onTransitionStart = this.onTransitionStart.bind(this);
			this.onTransitionEnd = this.onTransitionEnd.bind(this);
		}
		isAllowedTransitionProperty(propertyName) {
			return ['width', 'min-width', 'max-width', 'transform'].includes(propertyName);
		}
		onTransitionStart(event) {
			if (event.srcElement === this.getContainer() && this.isAllowedTransitionProperty(event.propertyName)) {
				clearInterval(this.intervalId);
				this.intervalId = setInterval(Marker.adjustLinks, 16);
			}
		}
		onTransitionEnd(event) {
			if (event.srcElement === this.getContainer() && this.isAllowedTransitionProperty(event.propertyName)) {
				clearInterval(this.intervalId);
				this.intervalId = null;
			}
		}
		setOptions(options) {
			super.setOptions(options);
			if (main_core.Type.isFunction(options.data.onLink)) {
				this.onLinkHandler = options.data.onLink;
			}
			if (main_core.Type.isFunction(options.data.onRemoveLinkFrom)) {
				this.onRemoveLinkFromHandler = options.data.onRemoveLinkFrom;
			}
			if (main_core.Type.isFunction(options.data.onChangeRobotAction)) {
				this.onChangeRobotAction = options.data.onChangeRobotAction;
			}
			if (main_core.Type.isFunction(options.data.onEditLink)) {
				this.onEditLinkhandler = options.data.onEditLink;
			}
			if (main_core.Type.isFunction(options.data.onNameChange)) {
				this.onNameChangeHandler = options.data.onNameChange;
			}
			if (main_core.Type.isFunction(options.data.onColorChange)) {
				this.onColorChangeHandler = options.data.onColorChange;
			}
			if (main_core.Type.isFunction(options.data.onAddColumn)) {
				this.onAddColumnHandler = options.data.onAddColumn;
			}
			if (main_core.Type.isFunction(options.data.onRemove)) {
				this.onRemoveHandler = options.data.onRemove;
			}
			if (main_core.Type.isFunction(options.data.onChange)) {
				this.onChangeHandler = options.data.onChange;
			}
			if (main_core.Type.isFunction(options.data.onError)) {
				this.onErrorHandler = options.data.onError;
			}
			if (this.marker) {
				this.marker.container = this.getData().appContainer;
				if (main_core.Type.isFunction(this.marker.cache.clear)) {
					this.marker.cache.clear();
				}
			}
		}
		onMarkerError(event) {
			this.onErrorHandler(event.data);
		}
		onEditLink(event) {
			this.onEditLinkhandler(event.data);
		}
		onMarkerLinkFrom(event) {
			this.onLinkHandler(event.data);
			this.activateDot();
		}
		onMarkerStubLinkFrom() {
			this.activateStubDot();
		}
		onMarkerStubLinkTo() {
			this.activateStubDot();
		}
		onRemoveLinkFrom(event) {
			this.onRemoveLinkFromHandler(event.data);
		}
		onMarkerLinkTo() {
			this.activateDot();
		}
		getIntermediateXPoints() {
			const {
				progressStagesGroup,
				successStagesGroup,
				failStagesGroup
			} = this.getData().stagesGroups;
			const progressRect = progressStagesGroup.getBoundingClientRect();
			const successRect = successStagesGroup.getBoundingClientRect();
			const failRect = failStagesGroup.getBoundingClientRect();
			const offset = 15;
			return [progressRect.left + offset, successRect.left - offset, successRect.left + offset, successRect.right - offset, successRect.right + offset, failRect.right - offset / 2];
		}
		onMarkerDragStart() {
			this.activateDot();
		}
		onMarkerDragOver(event) {
			if (isLinkInSameCategory(event) || isCycleLink(event)) {
				event.preventDefault();
				this.disallowDot();
				return;
			}
			this.allowDot();
			this.highlightDot();
		}
		onMarkerDragOut() {
			this.allowDot();
			this.unhighlightDot();
		}
		onMarkerDragEnd(event) {
			if (!this.marker.isLinked()) {
				this.deactivateDot();
			}
			if (event.data.from && event.data.to) {
				if (isLinkInSameCategory(event) || isCycleLink(event)) {
					event.preventDefault();
				}
			}
		}
		onMarkerUnlink() {
			this.deactivateDot();
			this.deactivateStubDot();
		}
		onMarkerUnlinkStub() {
			this.deactivateStubDot();
		}
		activateDot() {
			main_core.Dom.addClass(this.getDot(), 'crm-st-kanban-column-dot-active');
		}
		deactivateDot() {
			main_core.Dom.removeClass(this.getDot(), 'crm-st-kanban-column-dot-active');
		}
		activateStubDot() {
			main_core.Dom.addClass(this.getDot(), 'crm-st-kanban-column-dot-active-stub');
		}
		deactivateStubDot() {
			main_core.Dom.removeClass(this.getDot(), 'crm-st-kanban-column-dot-active-stub');
		}
		highlightDot() {
			main_core.Dom.addClass(this.getDot(), 'crm-st-kanban-column-dot-highlight');
		}
		unhighlightDot() {
			main_core.Dom.removeClass(this.getDot(), 'crm-st-kanban-column-dot-highlight');
		}
		allowDot() {
			main_core.Dom.removeClass(this.getDot(), 'crm-st-kanban-column-dot-disallow');
		}
		disallowDot() {
			main_core.Dom.addClass(this.getDot(), 'crm-st-kanban-column-dot-disallow');
		}
		getBody() {
			return createStub();
		}
		getDot() {
			if (!main_core.Type.isDomNode(this.dot)) {
				const title = main_core.Loc.getMessage('CRM_ST_DOT_TITLE');
				this.dot = main_core.Tag.render`<div class="crm-st-kanban-column-dot" title="${title}">
				<span class="crm-st-kanban-column-dot-disallow-icon"> </span>
				<span class="crm-st-kanban-column-dot-pulse"> </span>
			</div>`;
			}
			return this.dot;
		}
		getHeader() {
			const header = super.getHeader();
			if (!this.headerDotted) {
				this.headerDotted = true;
				const dot = this.getDot();
				main_core.Event.bind(dot, 'mousedown', event => event.stopPropagation());
				main_core.Event.bind(dot, 'mouseup', event => event.stopPropagation());
				main_core.Event.bind(dot, 'mousemove', event => event.stopPropagation());
				main_core.Dom.append(dot, header);
			}
			return header;
		}
		getSubTitle() {
			return createStub();
		}
		getContainer() {
			const container = super.getContainer();
			main_core.Dom.addClass(container, 'crm-st-kanban-column');
			main_core.Event.bind(container, 'transitionstart', this.onTransitionStart);
			main_core.Event.bind(container, 'transitionend', this.onTransitionEnd);
			return container;
		}
		getTotalItem() {
			this.layout.total = createStub();
			return this.layout.total;
		}
		handleTextBoxBlur(event) {
			super.handleTextBoxBlur(event);
			setTimeout(() => {
				if (this.currentName !== this.getName()) {
					this.onNameChangeHandler(this);
					this.currentName = this.getName();
					main_core.Tag.attrs(this.getHeader())`
					title: ${this.getName()};
				`;
				}
			}, 500);
		}
		onColorSelected(color) {
			super.onColorSelected(color);
			this.onColorChangeHandler(this);
		}
		handleAddColumnButtonClick(event) {
			this.onAddColumnHandler(this);
		}
		handleRemoveButtonClick(event) {
			this.getConfirmDialog().setContent(main_core.Loc.getMessage('CRM_ST_CONFIRM_STAGE_REMOVE_TEXT'));
			super.handleRemoveButtonClick(event);
		}
		handleConfirmButtonClick() {
			// @todo refactoring

			const event = new main_core.Event.BaseEvent({
				data: {
					column: this,
					onConfirm: () => {
						Marker.getAllLinks().forEach(link => {
							if (String(link.to.data.column.id) === String(this.id)) {
								link.from.removeLink(link);
							}
							if (String(link.from.data.column.id) === String(this.id)) {
								link.from.removeLink(link);
							}
						});
						super.handleConfirmButtonClick();
						setTimeout(() => {
							Marker.removeAllLinks();
							Marker.restoreAllLinks();
						});
					},
					onCancel: () => {
						this.getConfirmDialog().close();
					}
				}
			});
			this.onRemoveHandler(event);
		}
		switchToEditMode() {
			super.switchToEditMode();
		}
		applyEditMode() {
			const title = BX.util.trim(this.getTitleTextBox().value);
			const colorChanged = this.colorChanged;
			let titleChanged = false;
			if (title.length > 0 && this.getName() !== title) {
				titleChanged = true;
			}
			super.applyEditMode();
			if (titleChanged || colorChanged) {
				this.onChangeHandler(this);
			}
			Marker.adjustLinks();
		}
		onColumnDrag(x, y) {
			super.onColumnDrag(x, y);
			Marker.adjustLinks();
		}
		resetRectArea() {
			super.resetRectArea();
			clearTimeout(this.resetRectAreaTimeoutId);
			this.resetRectAreaTimeoutId = setTimeout(() => {
				Marker.adjustLinks();
			}, 200);
		}
	}

	class Grid extends main_kanban.Kanban.Grid {
		emitter = new main_core.Event.EventEmitter();
		adjustLayout() {}
		adjustHeight() {}
		getEmptyStub() {
			return createStub();
		}
		getDropZoneArea() {
			const area = super.getDropZoneArea();
			main_core.Dom.addClass(area.getContainer(), 'crm-st-kanban-stub');
			return area;
		}
		getGridContainer() {
			const container = super.getGridContainer();
			main_core.Dom.addClass(container, 'crm-st-kanban-grid');
			return container;
		}
		getInnerContainer() {
			const container = super.getInnerContainer();
			main_core.Dom.addClass(container, 'crm-st-kanban-inner');
			return container;
		}
		getOuterContainer() {
			const container = super.getOuterContainer();
			main_core.Dom.addClass(container, 'crm-st-kanban');
			return container;
		}
		getLeftEar() {
			return createStub();
		}
		getRightEar() {
			return createStub();
		}
		onColumnDragStart(column) {
			super.onColumnDragStart(column);
			Marker.adjustLinks();
		}
		onColumnDragStop(column) {
			super.onColumnDragStop(column);
			this.emitter.emit('Kanban.Grid:columns:sort');
			setTimeout(() => {
				Marker.adjustLinks();
			});
			this.getColumns().forEach(column => {
				clearInterval(column.intervalId);
			});
		}
		getColumns() {
			this.columnsOrder.sort((a, b) => {
				if (a.getContainer().parentNode) {
					const aIndex = [...a.getContainer().parentNode.children].indexOf(a.getContainer());
					const bIndex = [...b.getContainer().parentNode.children].indexOf(b.getContainer());
					return aIndex > bIndex ? 1 : -1;
				}
			});
			return this.columnsOrder;
		}
	}

	class Backend {
		static component = 'bitrix:crm.sales.tunnels';
		static entityTypeId = 2;
		static request({
			action,
			data,
			analyticsLabel
		}) {
			return new Promise((resolve, reject) => {
				main_core.ajax.runComponentAction(Backend.component, action, {
					mode: 'class',
					data: {
						data,
						entityTypeId: Backend.entityTypeId
					},
					analyticsLabel
				}).then(resolve, reject);
			});
		}
		static createCategory(data) {
			return Backend.request({
				action: 'createCategory',
				analyticsLabel: {
					component: Backend.component,
					action: 'create.new.category'
				},
				data
			});
		}
		static getCategory(data) {
			return Backend.request({
				action: 'getCategory',
				analyticsLabel: {
					component: Backend.component,
					action: 'get.category'
				},
				data
			});
		}
		static updateCategory(data) {
			return Backend.request({
				action: 'updateCategory',
				analyticsLabel: {
					component: Backend.component,
					action: 'update.category'
				},
				data
			});
		}
		static removeCategory(data) {
			return Backend.request({
				action: 'removeCategory',
				analyticsLabel: {
					component: Backend.component,
					action: 'remove.category'
				},
				data
			});
		}
		static accessCategory(data) {
			return Backend.request({
				action: 'accessCategory',
				analyticsLabel: {
					component: Backend.component,
					action: 'access.category'
				},
				data
			});
		}
		static copyAccessCategory(data) {
			return Backend.request({
				action: 'copyAccessCategory',
				analyticsLabel: {
					component: Backend.component,
					action: 'access.category'
				},
				data
			});
		}
		static createRobot(data) {
			return Backend.request({
				action: 'createRobot',
				analyticsLabel: {
					component: Backend.component,
					action: 'create.robot'
				},
				data
			});
		}
		static removeRobot(data) {
			return Backend.request({
				action: 'removeRobot',
				analyticsLabel: {
					component: Backend.component,
					action: 'remove.robot'
				},
				data
			});
		}
		static getRobotSettingsDialog(data) {
			return Backend.request({
				action: 'getRobotSettingsDialog',
				analyticsLabel: {
					component: Backend.component,
					action: 'settings.robot'
				},
				data
			});
		}
		static addStage(data) {
			return Backend.request({
				action: 'addStage',
				analyticsLabel: {
					component: Backend.component,
					action: 'add.stage'
				},
				data
			});
		}
		static removeStage(data) {
			return Backend.request({
				action: 'removeStage',
				analyticsLabel: {
					component: Backend.component,
					action: 'remove.stage'
				},
				data
			});
		}
		static updateStage(data) {
			return Backend.request({
				action: 'updateStage',
				analyticsLabel: {
					component: Backend.component,
					action: 'update.stage'
				},
				data
			});
		}
		static updateStages(data) {
			return Backend.request({
				action: 'updateStages',
				analyticsLabel: {
					component: Backend.component,
					action: 'update.stages'
				},
				data
			});
		}
		static getCategories() {
			return Backend.request({
				action: 'getCategories',
				analyticsLabel: {
					component: Backend.component,
					action: 'get.categories'
				}
			});
		}
	}

	class Category extends main_core.Event.EventEmitter {
		static instances = [];
		static createGrid(options) {
			return new Grid({
				renderTo: options.renderTo,
				canEditColumn: options.editable === true,
				canRemoveColumn: options.editable === true,
				canAddColumn: options.editable === true,
				canSortColumn: options.editable === true,
				columnType: options.columnType || 'BX.Crm.SalesTunnels.Kanban.Column',
				dropzoneType: 'BX.Crm.SalesTunnels.Kanban.DropZone',
				columns: options.columns
			});
		}
		constructor(options) {
			super();
			Category.instances.push(this);
			this.renderTo = options.renderTo;
			this.appContainer = options.appContainer;
			this.id = options.id;
			this.name = options.name;
			this.access = options.access;
			this.sort = Number.parseInt(options.sort);
			this.default = Boolean(options.default);
			this.generatorsCount = Number(options.generatorsCount);
			this.generatorsListUrl = options.generatorsListUrl;
			this.stages = options.stages;
			this.robotsSettingsLink = options.robotsSettingsLink.replace('{category}', this.id);
			this.generatorSettingsLink = options.generatorSettingsLink;
			this.permissionEditLink = options.permissionEditLink.replace('{category}', this.id);
			this.cache = new main_core.Cache.MemoryCache();
			this.drawed = false;
			this.allowWrite = Boolean(options.allowWrite);
			this.isCategoryEditable = Boolean(options.isCategoryEditable);
			this.areStagesEditable = Boolean(options.areStagesEditable);
			this.isAvailableGenerator = options.isAvailableGenerator;
			this.isAutomationEnabled = options.isAutomationEnabled;
			this.isStagesEnabled = options.isStagesEnabled;
			this.entityTypeId = options.entityTypeId;
			if (!options.lazy) {
				this.draw();
			}
			if (this.generatorsCount > 0) {
				this.showGeneratorLinkIcon();
			}
			const dragButton = this.getDragButton();
			dragButton.onbxdragstart = this.onDragStart.bind(this);
			dragButton.onbxdrag = this.onDrag.bind(this);
			dragButton.onbxdragstop = this.onDragStop.bind(this);
			jsDD.registerObject(dragButton, 40);
			this.adjustRobotsLinkIcon();
			this.getProgressKanban().emitter.subscribe('Kanban.Grid:removeColumn', event => {
				this.emit('Category:removeStage', event);
			}).subscribe('Kanban.Grid:columns:sort', () => {
				setTimeout(() => {
					this.emit('Column:sort', {
						columns: this.getAllColumns()
					});
				}, 500);
			});
			this.getSuccessKanban().emitter.subscribe('Kanban.Grid:removeColumn', event => {
				this.emit('Category:removeStage', event);
			}).subscribe('Kanban.Grid:columns:sort', () => {
				setTimeout(() => {
					this.emit('Column:sort', {
						columns: this.getAllColumns()
					});
				}, 500);
			});
			this.getFailKanban().emitter.subscribe('Kanban.Grid:removeColumn', event => {
				this.emit('Category:removeStage', event);
			}).subscribe('Kanban.Grid:columns:sort', () => {
				setTimeout(() => {
					this.emit('Column:sort', {
						columns: this.getAllColumns()
					});
				}, 500);
			});
			if (!this.isCategoryEditable) {
				main_core.Dom.addClass(this.getContainer(), 'crm-st-category-editing-disabled');
			}
			if (!this.isAutomationEnabled) {
				main_core.Dom.addClass(this.getContainer(), 'crm-st-category-automation-disabled');
				this.getAllColumns().forEach(column => {
					column.marker.disable();
				});
			}
			if (!this.isStagesEnabled) {
				main_core.Dom.addClass(this.getContainer(), 'crm-st-category-stages-stub');
			}
			if (!this.isAvailableGenerator) {
				main_core.Dom.addClass(this.getContainer(), 'crm-st-category-generator-disabled');
			}
		}
		hasTunnels() {
			if (!this.isAutomationEnabled) {
				return false;
			}
			return this.getAllColumns().some(column => column.marker.links.size > 0);
		}
		getRectArea() {
			return this.cache.remember('rectArea', () => {
				const rectArea = main_core.pos(this.getContainer());
				rectArea.middle = rectArea.top + rectArea.height / 2;
				return rectArea;
			});
		}
		getIndex() {
			return [...this.getContainer().parentNode.querySelectorAll('.crm-st-category')].findIndex(item => item === this.getContainer());
		}
		getNextCategorySibling() {
			return Category.instances.find((category, index) => index > this.getIndex()) || null;
		}

		/** @private */
		onDragStart() {
			main_core.Dom.addClass(this.getContainer(), 'crm-st-category-drag');
			Marker.removeAllLinks();

			// eslint-disable-next-line
			this.dragOffset = jsDD.start_y - this.getRectArea().top;
			this.dragIndex = this.getIndex();
			this.dragTargetCategory = this.dragTargetCategory || this;
		}

		/** @private */
		onDrag(x, y) {
			main_core.Tag.style(this.getContainer())`
			transform: translate3d(0px, ${y - this.dragOffset - this.getRectArea().top}px, 0px);
		`;
			const categoryHeight = this.getRectArea().height;
			Category.instances.forEach((category, curIndex) => {
				if (category === this || main_core.Dom.hasClass(category.getContainer(), 'crm-st-category-stub')) {
					return;
				}
				const categoryContainer = category.getContainer();
				const categoryRectArea = category.getRectArea();
				const categoryMiddle = categoryRectArea.middle;
				if (y > categoryMiddle && curIndex > this.dragIndex && categoryContainer.style.transform !== `translate3d(0px, ${-categoryHeight}px, 0px)`) {
					main_core.Tag.style(categoryContainer)`
					transition: 200ms;
					transform: translate3d(0px, ${-categoryHeight}px, 0px);
				`;
					this.dragTargetCategory = category.getNextCategorySibling();
					category.cache.delete('rectArea');
				}
				if (y < categoryMiddle && curIndex < this.dragIndex && categoryContainer.style.transform !== `translate3d(0px, ${categoryHeight}px, 0px)`) {
					main_core.Tag.style(categoryContainer)`
					transition: 200ms;
					transform: translate3d(0px, ${categoryHeight}px, 0px);
				`;
					this.dragTargetCategory = category;
					category.cache.delete('rectArea');
				}
				const moveBackTop = y < categoryMiddle && curIndex > this.dragIndex && categoryContainer.style.transform !== '' && categoryContainer.style.transform !== 'translate3d(0, 0, 0)';
				const moveBackBottom = y > categoryMiddle && curIndex < this.dragIndex && categoryContainer.style.transform !== '' && categoryContainer.style.transform !== 'translate3d(0, 0, 0)';
				if (moveBackBottom || moveBackTop) {
					main_core.Tag.style(categoryContainer)`
					transition: 200ms;
					transform: translate3d(0px, 0px, 0px);
				`;
					this.dragTargetCategory = category;
					if (!moveBackTop && main_core.Dom.hasClass(category.getNextCategorySibling(), 'crm-st-category-stub')) {
						this.dragTargetCategory = category.getNextCategorySibling();
					}
					category.cache.delete('rectArea');
				}
			});
		}

		/** @private */
		onDragStop() {
			main_core.Dom.removeClass(this.getContainer(), 'crm-st-category-drag');
			requestAnimationFrame(() => {
				Marker.restoreAllLinks();
			});
			Category.instances.forEach(category => {
				main_core.Tag.style(category.getContainer())`
				transform: null;
				transition: null;
			`;
				category.cache.delete('rectArea');
			});
			if (this.dragTargetCategory) {
				main_core.Dom.insertBefore(this.getContainer(), this.dragTargetCategory.getContainer());
			} else {
				main_core.Dom.append(this.getContainer(), this.getContainer().parentElement);
			}
			const before = Category.instances.map(item => item.getIndex());
			Category.instances.sort((a, b) => a.getIndex() > b.getIndex() ? 1 : -1);
			const after = Category.instances.map(item => item.getIndex());
			if (JSON.stringify(before) !== JSON.stringify(after)) {
				this.emit('Category:sort');
			}
		}
		getContainer() {
			return this.cache.remember('container', () => main_core.Tag.render`
				<div class="crm-st-category" data-id="${this.id}">
					<div class="crm-st-category-action">
						${this.getDragButton()}
					</div>
					<div class="crm-st-category-info">
						${this.getTitleContainer()}
						<div class="crm-st-category-info-links">
							<div class="crm-st-category-info-links-item">
								${this.getRobotsLink()}
								${this.getRobotsHelpLink()}
							</div>
							<div class="crm-st-category-info-links-item">
								${this.getGeneratorLink()}
								${this.getGeneratorHelpLink()}
							</div>
						</div>
					</div>
					<div class="crm-st-category-stages">
						${this.getProgressContainer()}
						${this.getSuccessContainer()}
						${this.getFailContainer()}
					</div>
				</div>
			`);
		}
		getRobotsHelpLink() {
			return this.cache.remember('robotsHelpLink', () => {
				const onClick = () => {
					if (window.top.BX.Helper) {
						window.top.BX.Helper.show('redirect=detail&code=6908975');
					}
				};
				return main_core.Tag.render`
				<span 
					class="crm-st-category-info-links-help crm-st-automation" 
					onclick="${onClick}"
					title="${main_core.Text.encode(main_core.Loc.getMessage('CRM_ST_ROBOTS_HELP_BUTTON'))}"
					> </span>
			`;
			});
		}
		getGeneratorHelpLink() {
			return this.cache.remember('generatorHelpLink', () => {
				const onClick = () => {
					if (window.top.BX.Helper) {
						window.top.BX.Helper.show('redirect=detail&code=7530721');
					}
				};
				return main_core.Tag.render`
				<span 
					class="crm-st-category-info-links-help crm-st-generator" 
					onclick="${onClick}"
					title="${main_core.Text.encode(main_core.Loc.getMessage('CRM_ST_GENERATOR_HELP_BUTTON'))}"
					> </span>
			`;
			});
		}
		getProgressContainer() {
			return this.cache.remember('progressContainer', () => main_core.Tag.render`
				<div class="crm-st-category-stages-group crm-st-category-stages-group-in-progress">
					<div class="crm-st-category-stages-group-header">
						<span class="crm-st-category-stages-group-header-text">
							${main_core.Loc.getMessage(this.isStagesEnabled ? 'CRM_ST_STAGES_GROUP_IN_PROGRESS' : 'CRM_ST_STAGES_DISABLED')}
						</span>
					</div>
					${this.getProgressStagesContainer()}
				</div>
			`);
		}
		getProgressStagesContainer() {
			return this.cache.remember('progressStagesContainer', () => main_core.Tag.render`
				<div class="crm-st-category-stages-list"></div>
			`);
		}
		getProgressKanban() {
			return this.cache.remember('progressKanban', () => Category.createGrid({
				renderTo: this.getProgressStagesContainer(),
				editable: this.areStagesEditable,
				columns: this.stages.P.map(stage => new Column({
					id: stage.STATUS_ID,
					name: stage.NAME,
					color: stage.COLOR.replace('#', ''),
					data: this.getColumnData(stage)
				}))
			}));
		}
		getSuccessContainer() {
			return this.cache.remember('successContainer', () => main_core.Tag.render`
				<div class="crm-st-category-stages-group crm-st-category-stages-group-success">
					<div class="crm-st-category-stages-group-header">
						<span class="crm-st-category-stages-group-in-success"> </span> 
						<span class="crm-st-category-stages-group-header-text">
							${this.isStagesEnabled ? main_core.Loc.getMessage('CRM_ST_STAGES_GROUP_SUCCESS') : ''}
						</span>
					</div>
					${this.getSuccessStagesContainer()}
				</div>
			`);
		}
		getSuccessStagesContainer() {
			return this.cache.remember('successStagesContainer', () => main_core.Tag.render`
				<div class="crm-st-category-stages-list"></div>
			`);
		}
		getSuccessKanban() {
			return this.cache.remember('successKanban', () => Category.createGrid({
				renderTo: this.getSuccessStagesContainer(),
				editable: this.areStagesEditable,
				columns: this.stages.S.map(stage => new Column({
					id: stage.STATUS_ID,
					name: stage.NAME,
					color: stage.COLOR.replace('#', ''),
					data: this.getColumnData(stage),
					canRemove: false,
					canSort: false
				}))
			}));
		}
		getFailContainer() {
			return this.cache.remember('failContainer', () => main_core.Tag.render`
				<div class="crm-st-category-stages-group crm-st-category-stages-group-fail">
					<div class="crm-st-category-stages-group-header">
						<span class="crm-st-category-stages-group-in-fail"> </span> 
						<span class="crm-st-category-stages-group-header-text">
							${this.isStagesEnabled ? main_core.Loc.getMessage('CRM_ST_STAGES_GROUP_FAIL') : ''}
						</span>
					</div>
					${this.getFailStagesContainer()}
				</div>
			`);
		}
		getFailStagesContainer() {
			return this.cache.remember('failStagesContainer', () => main_core.Tag.render`
				<div class="crm-st-category-stages-list"></div>
			`);
		}
		getFailKanban() {
			return this.cache.remember('failKanban', () => Category.createGrid({
				renderTo: this.getFailStagesContainer(),
				editable: this.areStagesEditable,
				columns: this.stages.F.map(stage => new Column({
					id: stage.STATUS_ID,
					name: stage.NAME,
					color: stage.COLOR.replace('#', ''),
					data: this.getColumnData(stage)
				}))
			}));
		}
		getColumnData(stage) {
			return {
				stageId: stage.ID,
				entityId: stage.ENTITY_ID,
				stage,
				onLink: link => {
					this.emit('Column:link', link);
					this.adjustRobotsLinkIcon();
				},
				onRemoveLinkFrom: link => {
					this.emit('Column:removeLinkFrom', link);
					this.adjustRobotsLinkIcon();
				},
				onChangeRobotAction: event => {
					this.emit('Column:changeRobotAction', event);
				},
				onEditLink: link => {
					this.emit('Column:editLink', link);
					this.adjustRobotsLinkIcon();
				},
				onNameChange: column => {
					this.emit('Column:nameChange', {
						column
					});
				},
				onColorChange: column => {
					this.emit('Column:colorChange', {
						column
					});
				},
				onAddColumn: column => {
					this.emit('Column:addColumn', {
						column
					});
				},
				onRemove: event => {
					this.emit('Column:remove', event);
				},
				onChange: column => {
					this.emit('Column:change', {
						column
					});
				},
				onSort: () => {
					this.emit('Column:sort', {
						columns: this.getAllColumns()
					});
				},
				onError: event => {
					this.emit('Column:error', event);
				},
				category: this,
				appContainer: this.appContainer,
				categoryContainer: this.getFailContainer(),
				stagesGroups: {
					progressStagesGroup: this.getProgressContainer(),
					successStagesGroup: this.getSuccessContainer(),
					failStagesGroup: this.getFailContainer()
				},
				currentStageGroup: this.getFailContainer(),
				categoryName: this.getTitle().textContent,
				isCategoryEditable: this.isCategoryEditable,
				areStagesEditable: this.areStagesEditable
			};
		}

		/** @private */
		onRightsLinkClick(event) {
			event.preventDefault();

			// eslint-disable-next-line
			BX.SidePanel.Instance.open(this.robotsSettingsLink, {
				cacheable: false,
				events: {
					onClose: () => {
						this.emit('Category:slider:close');
						this.emit('Category:slider:robots:close');
					}
				}
			});
		}
		getRobotsLink() {
			return this.cache.remember('robotsLink', () => {
				if (!this.isAutomationEnabled) {
					return '<span></span>';
				}
				const isRestricted = BX.Crm.Restriction.Bitrix24.isRestricted('automation');
				const onClick = isRestricted ? BX.Crm.Restriction.Bitrix24.getHandler('automation') : this.onRobotsLinkClick.bind(this);
				return main_core.Tag.render`
				${isRestricted ? '<span class="tariff-lock"></span>' : ''}
				<span class="crm-st-category-info-links-link crm-st-robots-link crm-st-automation" onclick="${onClick}">
					${main_core.Loc.getMessage('CRM_ST_ROBOT_SETTINGS_LINK_LABEL')}
				</span>
			`;
			});
		}

		/** @private */
		onRobotsLinkClick(event) {
			event.preventDefault();
			// eslint-disable-next-line
			BX.SidePanel.Instance.open(this.robotsSettingsLink, {
				cacheable: false,
				events: {
					onClose: () => {
						this.emit('Category:slider:close');
						this.emit('Category:slider:robots:close');
					}
				}
			});
		}
		getGeneratorLink() {
			return this.cache.remember('generatorLink', () => {
				if (!this.isAvailableGenerator) {
					return '<span></span>';
				}
				const isRestricted = BX.Crm.Restriction.Bitrix24.isRestricted('generator');
				const onClick = isRestricted ? BX.Crm.Restriction.Bitrix24.getHandler('generator') : this.onGeneratorLinkClick.bind(this);
				return main_core.Tag.render`
				${isRestricted ? '<span class="tariff-lock"></span>' : ''}
				<span class="crm-st-category-info-links-link crm-st-generator-link crm-st-generator" onclick="${onClick}">
					${main_core.Loc.getMessage('CRM_ST_GENERATOR_SETTINGS_LINK_LABEL')}
				</span>
			`;
			});
		}

		/** @private */
		onGeneratorLinkClick(event) {
			event.preventDefault();

			// eslint-disable-next-line
			BX.SidePanel.Instance.open(this.generatorSettingsLink, {
				cacheable: false,
				events: {
					onClose: () => {
						this.emit('Category:slider:close');
						this.emit('Category:slider:generator:close', {
							category: this
						});
					}
				}
			});
		}
		getEditButton() {
			return this.cache.remember('editButton', () => main_core.Tag.render`
				<span 
					class="crm-st-edit-button" 
					onmousedown="${this.onEditButtonClick.bind(this)}"
					title="${main_core.Loc.getMessage('CRM_ST_EDIT_CATEGORY_TITLE')}"
					> </span>
			`);
		}
		activateEditButton() {
			main_core.Dom.addClass(this.getEditButton(), 'crm-st-edit-button-active');
		}
		deactivateEditButton() {
			main_core.Dom.removeClass(this.getEditButton(), 'crm-st-edit-button-active');
		}
		onEditButtonClick(event) {
			if (event) {
				event.preventDefault();
			}
			if (this.isTitleEditEnabled()) {
				this.disableTitleEdit();
				this.saveTitle();
				return;
			}
			this.enableTitleEdit();
		}
		showTitleEditor(value = null) {
			const titleEditor = this.getTitleEditor();
			const {
				textContent
			} = this.getTitle();
			titleEditor.value = main_core.Type.isString(value) ? value : main_core.Text.decode(textContent);
			main_core.Tag.style(titleEditor)`
			display: block;
		`;
		}
		hideTitleEditor() {
			const titleEditor = this.getTitleEditor();
			main_core.Tag.style(titleEditor)`
			display: null;
		`;
		}
		focusOnTitleEditor() {
			const titleEditor = this.getTitleEditor();
			titleEditor.focus();
			const title = this.getTitle();
			const titleLength = title.textContent.length;
			titleEditor.setSelectionRange(titleLength, titleLength);
		}
		showTitle() {
			main_core.Tag.style(this.getTitle())`
			display: null;
		`;
		}
		hideTitle() {
			main_core.Tag.style(this.getTitle())`
			display: none;
		`;
		}
		saveTitle() {
			const title = this.getTitle();
			const titleEditor = this.getTitleEditor();
			const {
				value
			} = titleEditor;
			const newTitle = value.trim() || main_core.Loc.getMessage('CRM_ST_TITLE_EDITOR_PLACEHOLDER2');
			if (title.textContent !== newTitle) {
				title.textContent = newTitle;
				main_core.Dom.attr(title, 'title', newTitle);
				this.name = newTitle;
				this.emit('Category:title:save', {
					categoryId: this.id,
					value: newTitle
				});
			}
		}
		enableTitleEdit(value = null) {
			this.hideTitle();
			this.showTitleEditor(value);
			this.activateEditButton();
			this.focusOnTitleEditor();
		}
		disableTitleEdit() {
			this.showTitle();
			this.hideTitleEditor();
			this.deactivateEditButton();
		}
		isTitleEditEnabled() {
			return main_core.Dom.hasClass(this.getEditButton(), 'crm-st-edit-button-active');
		}
		getOptionButton() {
			return this.cache.remember('optionButton', () => {
				return main_core.Tag.render`
				<span 
					class="crm-st-option-button" 
					onclick="${this.onOptionButtonClick.bind(this)}" 
					title="${main_core.Loc.getMessage('CRM_ST_EDIT_RIGHTS_CATEGORY')}"
					> </span>
			`;
			});
		}
		onOptionButtonClick() {
			const onMenuItemClick = (event, item) => {
				this.emit('Category:access', {
					categoryId: this.id,
					access: item.dataset.access,
					onConfirm: () => {},
					onCancel: () => {}
				});
				main_core.Dom.addClass(item.getContainer(), 'menu-popup-item-accept');
				main_core.Dom.removeClass(item.getContainer(), 'menu-popup-no-icon');
				this.access = item.dataset.access;
				this.menuWindow.getMenuItems().forEach(itemOther => {
					if (itemOther === item) {
						return;
					}
					main_core.Dom.removeClass(itemOther.getContainer(), 'menu-popup-item-accept');
					main_core.Dom.addClass(itemOther.getContainer(), 'menu-popup-no-icon');
				});
				this.menuWindow.close();
			};
			const onSubMenuItemClick = (event, item) => {
				this.emit('Category:access:copy', {
					categoryId: this.id,
					donorCategoryId: item.dataset.categoryId,
					onConfirm: () => {},
					onCancel: () => {}
				});
				this.access = item.dataset.access;
				this.menuWindow.getMenuItems().forEach(itemOther => {
					if (itemOther.dataset === null) {
						return;
					}
					if (this.access === itemOther.dataset.access) {
						main_core.Dom.addClass(itemOther.getContainer(), 'menu-popup-item-accept');
						main_core.Dom.removeClass(itemOther.getContainer(), 'menu-popup-no-icon');
					} else {
						main_core.Dom.removeClass(itemOther.getContainer(), 'menu-popup-item-accept');
						main_core.Dom.addClass(itemOther.getContainer(), 'menu-popup-no-icon');
					}
				});
				this.menuWindow.close();
			};
			const items = Category.instances.filter(category => {
				return this.id !== category.id && category.id !== 'stub';
			}).map(category => {
				return {
					text: main_core.Text.encode(category.name),
					dataset: {
						categoryId: category.id,
						access: category.access
					},
					onclick: onSubMenuItemClick
				};
			});
			const myItemsText = this.entityTypeId === BX.CrmEntityType.enumeration.deal ? main_core.Loc.getMessage('CRM_MENU_RIGHTS_CATEGORY_OWN_FOR_ALL_MSGVER_1') : main_core.Loc.getMessage('CRM_MENU_RIGHTS_CATEGORY_OWN_FOR_ELEMENT_MSGVER_1');
			this.menuWindow = new main_popup.Menu({
				id: `crm-tunnels-menu-${main_core.Text.getRandom().toLowerCase()}`,
				bindElement: this.getOptionButton(),
				items: [{
					text: main_core.Loc.getMessage('CRM_MENU_RIGHTS_CATEGORY_ALL_FOR_ALL_MSGVER_1'),
					dataset: {
						access: 'X'
					}
				}, {
					text: main_core.Loc.getMessage('CRM_MENU_RIGHTS_CATEGORY_NONE_FOR_ALL_MSGVER_1'),
					dataset: {
						access: ''
					}
				}, {
					text: myItemsText,
					dataset: {
						access: 'A'
					}
				}, items.length > 0 ? {
					text: main_core.Loc.getMessage('CRM_MENU_RIGHTS_CATEGORY_COPY_FROM_TUNNELS2'),
					items: items
				} : null, {
					delimiter: true
				}, {
					text: main_core.Loc.getMessage('CRM_MENU_RIGHTS_CATEGORY_CUSTOM'),
					dataset: {
						access: false
					},
					className: this.access !== 'A' && this.access !== 'X' && this.access !== '' ? 'menu-popup-item-accept' : '',
					href: this.permissionEditLink,
					target: '_blank',
					onclick: (event, item) => {
						item.getMenuWindow().close();
					}
				}].filter(preItem => preItem !== null).map(preItem => {
					if (preItem.dataset) {
						if (this.access === preItem.dataset.access) {
							preItem.className = 'menu-popup-item-accept';
						}
						if (!preItem.onclick) {
							preItem.onclick = onMenuItemClick;
						}
					}
					return preItem;
				}),
				events: {
					onClose: function () {
						main_core.Dom.removeClass(this.getOptionButton(), 'crm-st-option-button-active');
						main_core.Dom.removeClass(this.getActionsButtons(), 'crm-st-category-action-buttons-active');
						setTimeout(this.removeBlur.bind(this), 200);
					}.bind(this)
				},
				angle: true,
				offsetLeft: 9
			});
			main_core.Dom.addClass(this.getActionsButtons(), 'crm-st-category-action-buttons-active');
			main_core.Dom.addClass(this.getOptionButton(), 'crm-st-option-button-active');
			this.menuWindow.show();
			this.addBlur();
		}
		getRemoveButton() {
			return this.cache.remember('removeButton', () => {
				const button = main_core.Tag.render`
				<span 
					class="crm-st-remove-button" 
					onclick="${this.onRemoveButtonClick.bind(this)}" 
					title="${main_core.Loc.getMessage('CRM_ST_REMOVE_CATEGORY2')}"
					> </span>
			`;
				if (this.default) {
					main_core.Tag.style(button)`
					display: none;
				`;
				}
				return button;
			});
		}
		onRemoveButtonClick() {
			this.showConfirmRemovePopup().then(({
				confirm
			}) => {
				if (confirm) {
					this.emit('Category:remove', {
						categoryId: this.id,
						onConfirm: () => {
							this.remove();
						},
						onCancel: () => {
							this.removeBlur();
						}
					});
					return;
				}
				this.removeBlur();
			});
			this.addBlur();
		}
		getAllColumns() {
			const progressColumns = this.getProgressKanban().getColumns().sort((a, b) => a.getIndex() > b.getIndex() ? 1 : -1);
			const successColumn = this.getSuccessKanban().getColumns().sort((a, b) => a.getIndex() > b.getIndex() ? 1 : -1);
			const failColumns = this.getFailKanban().getColumns().sort((a, b) => a.getIndex() > b.getIndex() ? 1 : -1);
			return [...progressColumns, ...successColumn, ...failColumns];
		}
		addBlur() {
			main_core.Dom.addClass(this.getContainer(), 'crm-st-blur');
			this.getAllColumns().forEach(column => {
				column.marker.blurLinks();
			});
		}
		removeBlur() {
			main_core.Dom.removeClass(this.getContainer(), 'crm-st-blur');
			Marker.unblurLinks();
		}
		remove() {
			main_core.Dom.remove(this.getContainer());
			Marker.getAllLinks().forEach(link => {
				const columnFrom = link.from.data.column;
				const categoryFrom = columnFrom.getData().category;
				const columnTo = link.to.data.column;
				const categoryTo = columnTo.getData().category;
				if (String(categoryFrom.id) === String(this.id)) {
					link.from.removeLink(link);
				}
				if (String(categoryTo.id) === String(this.id)) {
					link.to.removeLink(link);
				}
			});
			Marker.getAllStubLinks().forEach(link => {
				const columnFrom = link.from.data.column;
				const categoryFrom = columnFrom.getData().category;
				const columnTo = link.to.data.column;
				const categoryTo = columnTo.getData().category;
				if (String(categoryFrom.id) === String(this.id)) {
					link.from.removeStubLink(link);
				}
				if (String(categoryTo.id) === String(this.id)) {
					link.to.removeStubLink(link);
				}
			});
			Category.instances = Category.instances.filter(item => item !== this);
		}
		getTitle() {
			const safeTitle = main_core.Text.encode(this.name);
			return this.cache.remember('title', () => main_core.Tag.render`
				<h3 class="crm-st-category-info-title" title="${safeTitle}">${safeTitle}</h3>
			`);
		}
		getTitleEditor() {
			return this.cache.remember('titleEditor', () => {
				const onKeyDown = this.onTitleEditorKeyDown.bind(this);
				const onBlur = this.onTitleEditorBlur.bind(this);
				return main_core.Tag.render`
				<input class="crm-st-category-info-title-editor" 
					 onkeydown="${onKeyDown}"
					 onblur="${onBlur}"
					 value="${main_core.Text.encode(this.name)}"
					 placeholder="${main_core.Loc.getMessage('CRM_ST_TITLE_EDITOR_PLACEHOLDER2')}"
				 >
			`;
			});
		}
		onTitleEditorKeyDown(event) {
			event.stopPropagation();
			if (this.isTitleEditEnabled()) {
				if (event.key.startsWith('Enter')) {
					this.onEditButtonClick();
				}
				if (event.key.startsWith('Esc')) {
					this.disableTitleEdit();
				}
			}
		}
		onTitleEditorBlur() {
			if (this.isTitleEditEnabled()) {
				this.onEditButtonClick();
			}
		}
		getActionsButtons() {
			return this.cache.remember('getActionsButtons', () => main_core.Tag.render`
				<div class="crm-st-category-action-buttons">
					${this.isCategoryEditable ? this.getEditButton() : ''}
					${this.isCategoryEditable ? this.getOptionButton() : ''}
					${this.isCategoryEditable ? this.getRemoveButton() : ''}
				</div>
			`);
		}
		getTitleContainer() {
			return this.cache.remember('titleContainer', () => main_core.Tag.render`
				<div class="crm-st-category-info-title-container">
					${this.getTitle()}
					${this.getTitleEditor()}
					${this.getActionsButtons()}
				</div>
			`);
		}
		getDragButton() {
			return this.cache.remember('dragButton', () => main_core.Tag.render`
				<span 
					class="crm-st-category-action-drag"
					title="${main_core.Loc.getMessage('CRM_ST_CATEGORY_DRAG_BUTTON2')}"
					>&nbsp;</span>
			`);
		}
		isDrawed() {
			return this.drawed;
		}
		draw() {
			if (!this.isDrawed()) {
				this.drawed = true;
				main_core.Dom.append(this.getContainer(), this.renderTo);
				this.getProgressKanban().draw();
				this.getSuccessKanban().draw();
				this.getFailKanban().draw();
			}
		}
		getKanbanColumn(columnId) {
			const columns = [...this.getProgressKanban().getColumns(), ...this.getSuccessKanban().getColumns(), ...this.getFailKanban().getColumns()];
			return columns.find(column => columnId === column.getId() || columnId === column.getData().statusId);
		}
		showConfirmRemovePopup() {
			return new Promise(resolve => {
				void new main_popup.PopupWindow({
					width: 400,
					overlay: {
						opacity: 30
					},
					titleBar: main_core.Loc.getMessage('CRM_ST_REMOVE_CATEGORY_CONFIRM_POPUP_TITLE2').replace('#name#', this.getTitle().textContent),
					content: main_core.Loc.getMessage('CRM_ST_REMOVE_CATEGORY_CONFIRM_POPUP_DESCRIPTION2'),
					buttons: [new main_popup.PopupWindowButton({
						text: main_core.Loc.getMessage('CRM_ST_REMOVE_CATEGORY_CONFIRM_REMOVE_BUTTON_LABEL2'),
						className: 'popup-window-button-decline',
						events: {
							click() {
								resolve({
									confirm: true
								});
								this.popupWindow.destroy();
							}
						}
					}), new main_popup.PopupWindowButtonLink({
						text: main_core.Loc.getMessage('CRM_ST_REMOVE_CATEGORY_CONFIRM_CANCEL_BUTTON_LABEL'),
						events: {
							click() {
								resolve({
									confirm: false
								});
								this.popupWindow.destroy();
							}
						}
					})]
				}).show();
			});
		}
		getRobotsLinkIcon() {
			return this.cache.remember('robotsLinkIcon', () => main_core.Tag.render`
				<span class="crm-st-robots-link-icon"> </span>
			`);
		}
		showRobotsLinkIcon() {
			main_core.Dom.insertAfter(this.getRobotsLinkIcon(), this.getRobotsLink());
		}
		hideRobotsLinkIcon() {
			main_core.Dom.remove(this.getRobotsLinkIcon());
		}
		adjustRobotsLinkIcon() {
			setTimeout(() => {
				if (this.hasTunnels()) {
					this.showRobotsLinkIcon();
					return;
				}
				this.hideRobotsLinkIcon();
			});
		}
		getGeneratorLinkIcon() {
			return this.cache.remember('generatorLinkIcon', () => {
				const onClick = () => BX.SidePanel.Instance.open(this.generatorsListUrl);
				return main_core.Tag.render`
				<span class="crm-st-generator-link-icon" onclick="${onClick}">${this.generatorsCount}</span>
			`;
			});
		}
		showGeneratorLinkIcon() {
			main_core.Dom.insertAfter(this.getGeneratorLinkIcon(), this.getGeneratorLink());
		}
	}

	class CategoryStub extends Category {
		constructor(options) {
			super(options);
			main_core.Dom.addClass(this.getContainer(), 'crm-st-category-stub');
			main_core.Dom.removeClass(this.getContainer(), 'crm-st-category-automation-disabled');
			this.getAllColumns().forEach(column => {
				column.marker.disable();
			});
		}
	}

	function createStageStubs(count) {
		return Array.from({
			length: count
		}).map((item, index) => {
			return {
				STATUS_ID: `stub_${index}`,
				COLOR: 'F1F5F7',
				NAME: 'category stub'
			};
		});
	}

	function makeErrorMessageFromResponse(response) {
		if (response.data && response.data.errors && main_core.Type.isArray(response.data.errors) && response.data.errors.length > 0) {
			return response.data.errors.reduce((acc, errorText) => {
				return `${acc}${main_core.Text.encode(errorText)}<br>`;
			}, '');
		}
		if (response.errors && main_core.Type.isArray(response.errors) && response.errors.length > 0) {
			return response.errors.reduce((result, error) => {
				return `${result}${main_core.Text.encode(error.message ? error.message : error)}<br>`;
			}, '');
		}
		return main_core.Loc.getMessage('CRM_ST_SAVE_ERROR2');
	}

	class Manager {
		static lastInstance = null;
		constructor(options) {
			this.container = options.container;
			this.entityTypeId = options.entityTypeId;
			this.documentType = options.documentType;
			this.addCategoryButtonTop = options.addCategoryButtonTop;
			this.helpButton = options.helpButton;
			this.categoriesOptions = options.categories;
			this.robotsUrl = options.robotsUrl;
			this.generatorUrl = options.generatorUrl;
			this.permissionEditUrl = options.permissionEditUrl;
			this.analyticsLabels = options.analyticsLabels;
			this.tunnelScheme = options.tunnelScheme;
			this.isCategoryEditable = Boolean(options.isCategoryEditable);
			this.isCategoryCreatable = Boolean(options.isCategoryCreatable);
			this.areStagesEditable = Boolean(options.areStagesEditable);
			this.isAvailableGenerator = options.isAvailableGenerator;
			this.isStagesEnabled = options.isStagesEnabled;
			this.isAutomationEnabled = options.isAutomationEnabled && this.isStagesEnabled;
			this.categories = new Map();
			this.cache = new main_core.Cache.MemoryCache();
			this.isChanged = false;
			this.initCategories();
			this.initTunnels();
			Backend.entityTypeId = this.entityTypeId;
			if (this.isCategoryCreatable) {
				setTimeout(() => {
					if (!this.hasTunnels()) {
						this.showCategoryStub();
					}
				});
			}
			main_core.Event.bind(this.getAddCategoryButton(), 'click', this.onAddCategoryClick.bind(this));
			main_core.Event.bind(this.addCategoryButtonTop, 'click', this.onAddCategoryTopClick.bind(this));
			main_core.Event.bind(this.helpButton, 'click', this.onHelpButtonClick.bind(this));
			this.constructor.lastInstance = this;
			ui_analytics.sendData(this.analyticsLabels.openSliderLabel);
		}
		hasTunnels() {
			return this.getTunnels().length > 0;
		}
		getContainer() {
			return this.cache.remember('container', () => {
				return document.querySelector('.crm-st');
			});
		}
		getAppContainer() {
			return this.cache.remember('appContainer', () => {
				return this.getContainer().querySelector('.crm-st-container');
			});
		}
		getCategoriesContainer() {
			return this.cache.remember('categoriesContainer', () => {
				return this.getAppContainer().querySelector('.crm-st-categories');
			});
		}
		getAddCategoryButton() {
			return this.cache.remember('addCategoryButton', () => {
				return this.getContainer().querySelector('.crm-st-add-category-btn');
			});
		}
		getMaxSort() {
			return [...this.categories.values()].reduce((acc, curr) => {
				return acc > curr.sort ? acc : curr.sort;
			}, 0);
		}
		onAddCategoryClick(event) {
			event.preventDefault();
			const analyticsLabelElement = event.currentTarget === this.addCategoryButtonTop ? 'green_button' : 'gray_button';
			if (!this.isCategoryCreatable) {
				return Promise.resolve(false);
			}
			if (BX.Crm.Restriction.Bitrix24.isRestricted('dealCategory')) {
				const restrictionData = BX.Crm.Restriction.Bitrix24.getData('dealCategory');
				if (restrictionData && restrictionData.quantityLimit <= this.categories.size) {
					BX.Crm.Restriction.Bitrix24.getHandler('dealCategory').call();
					return Promise.resolve(false);
				}
			}
			return Backend.createCategory({
				name: main_core.Loc.getMessage('CRM_ST_TITLE_EDITOR_PLACEHOLDER2'),
				sort: this.getMaxSort() + 10
			}).then(response => {
				this.addCategoryFromOptions(response.data);
				this.isChanged = true;
				const allStages = this.getStages();
				const newStages = [...response.data.STAGES.P, ...response.data.STAGES.S, ...response.data.STAGES.F];
				newStages.forEach(item => allStages.push(item));
				const category = this.getCategory(response.data.ID);
				category.enableTitleEdit('');
				category.getAllColumns().forEach(column => {
					this.tunnelScheme.stages.push({
						categoryId: column.getData().category.id,
						stageId: column.getId(),
						locked: false,
						tunnels: []
					});
				});
				if (this.isShownCategoryStub()) {
					this.hideCategoryStub();
				}
				this.analyticsLabels.createFunnelLabel.status = 'success';
			}).catch(response => {
				this.analyticsLabels.createFunnelLabel.status = 'error';
				this.showErrorPopup(makeErrorMessageFromResponse(response));
			}).finally(() => {
				this.analyticsLabels.createFunnelLabel.c_element = analyticsLabelElement;
				ui_analytics.sendData(this.analyticsLabels.createFunnelLabel);
			});
		}
		onAddCategoryTopClick(event) {
			this.onAddCategoryClick(event).then(success => {
				if (success) {
					window.scrollTo(0, document.body.scrollHeight);
				}
			});
		}
		onHelpButtonClick(event) {
			event.preventDefault();
			top.BX.Helper?.show('redirect=detail&code=20732764');
		}
		getCategoryStub() {
			return this.cache.remember('categoryStub', () => {
				return new CategoryStub({
					renderTo: this.getCategoriesContainer(),
					appContainer: this.getAppContainer(),
					id: 'stub',
					name: 'stub',
					default: false,
					stages: {
						P: createStageStubs(5),
						S: createStageStubs(1),
						F: createStageStubs(2)
					},
					sort: 0,
					robotsSettingsLink: this.robotsUrl,
					generatorSettingsLink: this.generatorUrl,
					permissionEditLink: this.permissionEditUrl,
					lazy: true,
					isAvailableGenerator: true,
					isStagesEnabled: this.isStagesEnabled,
					isAutomationEnabled: true
				});
			});
		}
		showCategoryStub() {
			this.shownCategoryStub = true;
			const categoryStub = this.getCategoryStub();
			categoryStub.draw();
			const firstCategory = [...this.categories.values()][0];
			const [columnFrom] = firstCategory.getSuccessKanban().getColumns();
			const [columnTo] = categoryStub.getProgressKanban().getColumns();
			if (this.isAutomationEnabled) {
				columnFrom.marker.addStubLinkTo(columnTo.marker, true);
			}
		}
		hideCategoryStub() {
			this.shownCategoryStub = false;
			this.getCategoryStub().remove();
			this.cache.delete('categoryStub');
		}
		isShownCategoryStub() {
			return this.shownCategoryStub;
		}
		adjustCategoryStub() {
			if (!this.hasTunnels()) {
				this.showCategoryStub();
				return;
			}
			this.hideCategoryStub();
		}
		addCategoryFromOptions(options) {
			let stages = options.STAGES;
			if (!this.isStagesEnabled) {
				stages = {
					P: createStageStubs(5),
					S: createStageStubs(1),
					F: createStageStubs(2)
				};
			}
			const category = new Category({
				renderTo: this.getCategoriesContainer(),
				appContainer: this.getAppContainer(),
				id: options.ID,
				name: options.NAME,
				default: options.IS_DEFAULT,
				stages: stages,
				sort: options.SORT,
				access: options.ACCESS,
				robotsSettingsLink: this.robotsUrl,
				generatorSettingsLink: this.generatorUrl,
				permissionEditLink: this.permissionEditUrl,
				generatorsCount: options.RC_COUNT,
				generatorsListUrl: options.RC_LIST_URL,
				isCategoryEditable: this.isCategoryEditable,
				areStagesEditable: this.areStagesEditable,
				isAvailableGenerator: this.isAvailableGenerator,
				isAutomationEnabled: this.isAutomationEnabled,
				isStagesEnabled: this.isStagesEnabled,
				entityTypeId: this.entityTypeId
			});
			category.subscribe('Category:title:save', event => {
				const {
					categoryId,
					value
				} = event.data;
				Backend.updateCategory({
					id: categoryId,
					fields: {
						NAME: value
					}
				}).then(() => {
					ui_notification.UI.Notification.Center.notify({
						content: main_core.Loc.getMessage('CRM_ST_NOTIFICATION_CHANGES_SAVED'),
						autoHideDelay: 1500,
						category: 'save'
					});
					this.isChanged = true;
					this.analyticsLabels.renameFunnelLabel.status = 'success';
				}).catch(response => {
					this.analyticsLabels.renameFunnelLabel.status = 'error';
					this.showErrorPopup(makeErrorMessageFromResponse(response));
				}).finally(() => {
					ui_analytics.sendData(this.analyticsLabels.renameFunnelLabel);
				});
			}).subscribe('Category:access', event => {
				const {
					categoryId,
					access
				} = event.data;
				Backend.accessCategory({
					id: categoryId,
					access: access
				}).then(() => {
					ui_notification.UI.Notification.Center.notify({
						content: main_core.Loc.getMessage('CRM_ST_NOTIFICATION_CHANGES_SAVED'),
						autoHideDelay: 1500,
						category: 'save'
					});
				}).catch(response => {
					this.showErrorPopup(makeErrorMessageFromResponse(response));
				});
			}).subscribe('Category:access:copy', event => {
				const {
					categoryId,
					donorCategoryId
				} = event.data;
				Backend.copyAccessCategory({
					id: categoryId,
					donorId: donorCategoryId
				}).then(() => {
					ui_notification.UI.Notification.Center.notify({
						content: main_core.Loc.getMessage('CRM_ST_NOTIFICATION_CHANGES_SAVED'),
						autoHideDelay: 1500,
						category: 'save'
					});
				}).catch(response => {
					this.showErrorPopup(makeErrorMessageFromResponse(response));
				});
			}).subscribe('Category:remove', event => {
				Backend.removeCategory({
					id: event.data.categoryId
				}).then(() => {
					event.data.onConfirm();
					ui_notification.UI.Notification.Center.notify({
						content: main_core.Loc.getMessage('CRM_ST_NOTIFICATION_CHANGES_SAVED'),
						autoHideDelay: 1500,
						category: 'save'
					});
					setTimeout(() => {
						if (this.isShownCategoryStub()) {
							this.hideCategoryStub();
							this.showCategoryStub();
							return;
						}
						this.adjustCategoryStub();
						Marker.adjustLinks();
					});
					this.isChanged = true;
					this.analyticsLabels.deleteFunnelLabel.status = 'success';
				}).catch(response => {
					event.data.onCancel();
					this.analyticsLabels.deleteFunnelLabel.status = 'error';
					this.showErrorPopup(makeErrorMessageFromResponse(response));
				}).finally(() => {
					ui_analytics.sendData(this.analyticsLabels.deleteFunnelLabel);
				});
			}).subscribe('Column:link', event => {
				if (!this.isAutomationEnabled) {
					return;
				}
				if (!event.data.preventSave) {
					if (BX.Crm.Restriction.Bitrix24.isRestricted('automation')) {
						return BX.Crm.Restriction.Bitrix24.getHandler('automation').call();
					}
					const from = {
						category: event.data.link.from.getData().column.getData().category.id,
						stage: event.data.link.from.getData().column.data.stage.STATUS_ID
					};
					const to = {
						category: event.data.link.to.getData().column.getData().category.id,
						stage: event.data.link.to.getData().column.data.stage.STATUS_ID
					};
					const robotAction = event.data.link.robotAction;
					Backend.createRobot({
						from,
						to,
						robotAction
					}).then(response => {
						ui_notification.UI.Notification.Center.notify({
							content: main_core.Loc.getMessage('CRM_ST_NOTIFICATION_CHANGES_SAVED'),
							autoHideDelay: 1500,
							category: 'save'
						});
						const stage = this.getStages().find(item => {
							return String(item.CATEGORY_ID) === String(response.data.tunnel.srcCategory) && String(item.STATUS_ID) === String(response.data.tunnel.srcStage);
						});
						stage.TUNNELS.push(response.data.tunnel);
						this.analyticsLabels.createTunnelLabel.status = 'success';
					}).catch(response => {
						const link = event.data.link;
						link.from.removeLink(link);
						this.analyticsLabels.createTunnelLabel.status = 'error';
						this.showErrorPopup(makeErrorMessageFromResponse(response));
					}).finally(() => {
						ui_analytics.sendData(this.analyticsLabels.createTunnelLabel);
					});
				}
				this.hideCategoryStub();
			}).subscribe('Column:removeLinkFrom', event => {
				if (!this.isAutomationEnabled) {
					return;
				}
				if (!event.data.preventSave) {
					const columnFrom = event.data.link.from.getData().column;
					const columnTo = event.data.link.to.getData().column;
					const srcCategory = columnFrom.getData().category.id;
					const srcStage = columnFrom.getId();
					const dstCategory = columnTo.getData().category.id;
					const dstStage = columnTo.getId();
					const tunnel = this.getTunnelByLink(event.data.link);
					if (tunnel) {
						if (BX.Crm.Restriction.Bitrix24.isRestricted('automation')) {
							return BX.Crm.Restriction.Bitrix24.getHandler('automation').call();
						}
						const requestOptions = {
							srcCategory,
							srcStage,
							dstCategory,
							dstStage,
							robot: tunnel.robot
						};
						Backend.removeRobot(requestOptions).then(() => {
							ui_notification.UI.Notification.Center.notify({
								content: main_core.Loc.getMessage('CRM_ST_NOTIFICATION_CHANGES_SAVED'),
								autoHideDelay: 1500,
								category: 'save'
							});
							this.analyticsLabels.deleteTunnelLabel.status = 'success';
						}).catch(response => {
							this.analyticsLabels.deleteTunnelLabel.status = 'error';
							this.showErrorPopup(makeErrorMessageFromResponse(response));
						}).finally(() => {
							ui_analytics.sendData(this.analyticsLabels.deleteTunnelLabel);
						});
						const stage = this.getStageDataById(srcStage);
						stage.TUNNELS = stage.TUNNELS.filter(item => {
							return !(String(item.srcStage) === String(srcStage) && String(item.srcCategory) === String(srcCategory) && String(item.dstStage) === String(dstStage) && String(item.dstCategory) === String(dstCategory));
						});
						this.adjustCategoryStub();
					}
				}
			}).subscribe('Column:changeRobotAction', event => {
				if (!this.isAutomationEnabled || event.data.preventSave) {
					return;
				}
				if (BX.Crm.Restriction.Bitrix24.isRestricted('automation')) {
					return BX.Crm.Restriction.Bitrix24.getHandler('automation').call();
				}
				const columnFrom = event.data.link.from.getData().column;
				const columnTo = event.data.link.to.getData().column;
				const srcCategory = columnFrom.getData().category.id;
				const srcStage = columnFrom.getId();
				const dstCategory = columnTo.getData().category.id;
				const dstStage = columnTo.getId();
				const tunnel = this.getTunnelByLink(event.data.link);
				if (tunnel) {
					const from = {
						category: srcCategory,
						stage: srcStage
					};
					const to = {
						category: dstCategory,
						stage: dstStage
					};
					Backend.removeRobot(tunnel).then(() => {
						Backend.createRobot({
							from,
							to,
							robotAction: event.data.link.robotAction
						}).then(response => {
							ui_notification.UI.Notification.Center.notify({
								content: main_core.Loc.getMessage('CRM_ST_NOTIFICATION_CHANGES_SAVED'),
								autoHideDelay: 1500,
								category: 'save'
							});
							const stage = this.getStageDataById(srcStage);
							const index = stage.TUNNELS.findIndex(item => {
								return String(item.srcStage) === String(srcStage) && String(item.srcCategory) === String(srcCategory) && String(item.dstStage) === String(dstStage) && String(item.dstCategory) === String(dstCategory);
							});
							if (index >= 0) {
								stage.TUNNELS[index] = response.data.tunnel;
							}
							event.data.onChangeRobotEnd();
						}).catch(response => this.showErrorPopup(makeErrorMessageFromResponse(response)));
					}).catch(response => this.showErrorPopup(makeErrorMessageFromResponse(response)));
				}
			}).subscribe('Column:editLink', event => {
				if (!this.isAutomationEnabled) {
					return;
				}
				const tunnel = this.getTunnelByLink(event.data.link);

				// eslint-disable-next-line
				BX.Bizproc.Automation.API.showRobotSettings(tunnel.robot, this.documentType, tunnel.srcStage, robot => {
					tunnel.robot = robot.serialize();
					Backend.request({
						action: 'updateRobot',
						analyticsLabel: {
							component: Backend.component,
							action: 'update.robot'
						},
						data: tunnel
					}).then(() => {
						ui_notification.UI.Notification.Center.notify({
							content: main_core.Loc.getMessage('CRM_ST_NOTIFICATION_CHANGES_SAVED'),
							autoHideDelay: 1500,
							category: 'save'
						});
						tunnel.dstCategory = robot.getProperty('CategoryId');
						tunnel.dstStage = robot.getProperty('StageId');
						const category = this.getCategory(tunnel.dstCategory);
						const column = category.getKanbanColumn(tunnel.dstStage);
						event.data.link.from.updateLink(event.data.link, column.marker, true);
						this.adjustCategoryStub();
					}).catch(response => {
						this.showErrorPopup(makeErrorMessageFromResponse(response));
					});
				});
			}).subscribe('Category:sort', () => {
				const results = Category.instances.filter(category => category.id !== 'stub').map((category, index) => {
					return Backend.updateCategory({
						id: category.id,
						fields: {
							SORT: (index + 1) * 100
						}
					});
				});
				Promise.all(results).then(() => {
					ui_notification.UI.Notification.Center.notify({
						content: main_core.Loc.getMessage('CRM_ST_NOTIFICATION_CHANGES_SAVED'),
						autoHideDelay: 1500,
						category: 'save'
					});
					this.isChanged = true;
				});
			}).subscribe('Column:remove', event => {
				if (!main_core.Type.isNil(event.data.column.data.stageId)) {
					const hasTunnels = this.isAutomationEnabled ? [...Marker.getAllLinks()].some(item => {
						return event.data.column.marker === item.from || event.data.column.marker === item.to;
					}) : false;
					Backend.removeStage({
						statusId: event.data.column.getId(),
						stageId: event.data.column.data.stageId,
						entityId: event.data.column.data.entityId
					}).then(() => {
						event.data.onConfirm();
						if (!hasTunnels) {
							ui_notification.UI.Notification.Center.notify({
								content: main_core.Loc.getMessage('CRM_ST_NOTIFICATION_CHANGES_SAVED'),
								autoHideDelay: 1500,
								category: 'save'
							});
							this.isChanged = true;
						}
						this.analyticsLabels.deleteStageLabel.status = 'success';
					}).catch(response => {
						event.data.onCancel();
						this.analyticsLabels.deleteStageLabel.status = 'error';
						this.showErrorPopup(makeErrorMessageFromResponse(response));
					}).finally(() => {
						ui_analytics.sendData(this.analyticsLabels.deleteStageLabel);
					});
				}
			}).subscribe('Column:change', event => {
				Backend.updateStage({
					statusId: event.data.column.getId(),
					stageId: event.data.column.data.stageId,
					entityId: event.data.column.data.entityId,
					name: event.data.column.getName(),
					sort: event.data.column.data.stage.SORT,
					color: event.data.column.getColor()
				}).then(({
					data
				}) => {
					if (data.success) {
						ui_notification.UI.Notification.Center.notify({
							content: main_core.Loc.getMessage('CRM_ST_NOTIFICATION_CHANGES_SAVED'),
							autoHideDelay: 1500,
							category: 'save'
						});
						this.isChanged = true;
						this.analyticsLabels.renameStageLabel.status = 'success';
					} else {
						this.analyticsLabels.renameStageLabel.status = 'error';
						this.showErrorPopup(makeErrorMessageFromResponse({
							data
						}));
					}
					ui_analytics.sendData(this.analyticsLabels.renameStageLabel);
				});
			}).subscribe('Column:addColumn', event => {
				Backend.addStage({
					name: event.data.column.getGrid().getMessage('COLUMN_TITLE_PLACEHOLDER'),
					sort: (() => {
						const {
							column
						} = event.data;
						return Number(column.data.stage.SORT) + 1;
					})(),
					entityId: (() => {
						const {
							column
						} = event.data;
						return column.data.stage.ENTITY_ID;
					})(),
					color: BX.Kanban.Column.DEFAULT_COLOR,
					semantics: (() => {
						const {
							column
						} = event.data;
						return column.data.stage.SEMANTICS;
					})(),
					categoryId: (() => {
						const {
							column
						} = event.data;
						return column.data.category.id;
					})()
				}).then(({
					data
				}) => {
					ui_notification.UI.Notification.Center.notify({
						content: main_core.Loc.getMessage('CRM_ST_NOTIFICATION_CHANGES_SAVED'),
						autoHideDelay: 1500,
						category: 'save'
					});
					this.isChanged = true;
					const {
						stage
					} = data;
					const prevColumn = event.data.column;
					const grid = prevColumn.getGrid();
					const category = this.getCategory(prevColumn.data.category.id);
					stage.TUNNELS = [];
					this.getStages().push(stage);
					const targetId = grid.getNextColumnSibling(prevColumn);
					// column.getGrid().removeColumn(column);
					const column = grid.addColumn({
						id: stage.STATUS_ID,
						name: stage.NAME,
						color: stage.COLOR.replace('#', ''),
						data: category.getColumnData(stage),
						targetId
					});
					column.switchToEditMode();
					Marker.adjustLinks();
					this.analyticsLabels.createStageLabel.status = 'success';
				}).catch(response => {
					this.analyticsLabels.createStageLabel.status = 'error';
					this.showErrorPopup(makeErrorMessageFromResponse(response));
				}).finally(() => {
					ui_analytics.sendData(this.analyticsLabels.createStageLabel);
				});
			}).subscribe('Column:sort', event => {
				const sortData = event.data.columns.map((column, index) => {
					const newSorting = (index + 1) * 100;
					const columnData = {
						statusId: column.getId(),
						stageId: column.data.stageId,
						entityId: column.data.entityId,
						name: column.getName(),
						sort: newSorting,
						color: column.getColor()
					};
					column.data.stage.SORT = newSorting;
					return columnData;
				});
				Backend.updateStages(sortData).then(({
					data
				}) => {
					const success = data.every(item => {
						return item.success;
					});
					if (success) {
						ui_notification.UI.Notification.Center.notify({
							content: main_core.Loc.getMessage('CRM_ST_NOTIFICATION_CHANGES_SAVED'),
							autoHideDelay: 1500,
							category: 'save'
						});
						this.isChanged = true;
						this.analyticsLabels.updateStageLabel.status = 'success';
					} else {
						this.analyticsLabels.updateStageLabel.status = 'error';
						this.showErrorPopup(makeErrorMessageFromResponse({
							data
						}));
					}
					ui_analytics.sendData(this.analyticsLabels.updateStageLabel);
				});
			}).subscribe('Category:slider:close', () => {
				this.reload();
			}).subscribe('Column:error', event => {
				this.showErrorPopup(makeErrorMessageFromResponse({
					data: {
						errors: [event.data.message]
					}
				}));
			});
			this.categories.set(String(options.ID), category);
		}
		showErrorPopup(message) {
			if (!this.errorPopup) {
				this.errorPopup = new main_popup.PopupWindow({
					titleBar: main_core.Loc.getMessage('CRM_ST_ERROR_POPUP_TITLE'),
					width: 350,
					closeIcon: true,
					buttons: [new main_popup.PopupWindowButtonLink({
						id: 'close',
						text: main_core.Loc.getMessage('CRM_ST_ERROR_POPUP_CLOSE_BUTTON_LABEL'),
						events: {
							click() {
								this.popupWindow.close();
							}
						}
					})]
				});
			}
			this.errorPopup.setContent(message);
			this.errorPopup.show();
		}
		getSlider() {
			// eslint-disable-next-line
			return BX.SidePanel.Instance.getSlider(window.location.pathname);
		}
		reload() {
			const slider = this.getSlider();
			if (slider) {
				slider.reload();
			}
		}
		getStageDataById(id) {
			return this.getStages().find(stage => String(stage.STATUS_ID) === String(id));
		}
		getTunnelByLink(link) {
			const columnFrom = link.from.getData().column;
			const columnTo = link.to.getData().column;
			const srcCategory = columnFrom.getData().category.id;
			const srcStage = columnFrom.getId();
			const dstCategory = columnTo.getData().category.id;
			const dstStage = columnTo.getId();
			const stageFrom = this.getStageDataById(srcStage);
			if (stageFrom) {
				return stageFrom.TUNNELS.find(item => {
					return String(item.srcCategory) === String(srcCategory) && String(item.srcStage) === String(srcStage) && String(item.dstCategory) === String(dstCategory) && String(item.dstStage) === String(dstStage);
				});
			}
			return null;
		}
		getCategory(id) {
			return this.categories.get(String(id));
		}
		getStages() {
			return this.cache.remember('allStages', () => {
				return this.categoriesOptions.reduce((acc, category) => {
					return [...acc, ...category.STAGES.P, ...category.STAGES.S, ...category.STAGES.F];
				}, []);
			});
		}
		getTunnels() {
			return this.getStages().reduce((acc, stage) => {
				return [...acc, ...(stage.TUNNELS || [])];
			}, []);
		}
		initCategories() {
			this.categoriesOptions.map(categoryOptions => {
				this.addCategoryFromOptions(categoryOptions);
			});
		}
		initTunnels() {
			if (!this.isAutomationEnabled) {
				return;
			}
			this.getStages().filter(stage => {
				return main_core.Type.isArray(stage.TUNNELS) && stage.TUNNELS.length;
			}).forEach(stage => {
				stage.TUNNELS.forEach(tunnel => {
					const categoryFrom = this.getCategory(tunnel.srcCategory);
					const categoryTo = this.getCategory(tunnel.dstCategory);
					if (categoryFrom && categoryTo) {
						const columnFrom = categoryFrom.getKanbanColumn(tunnel.srcStage);
						const columnTo = categoryTo.getKanbanColumn(tunnel.dstStage);
						if (columnFrom && columnTo) {
							const preventEvent = true;
							columnFrom.marker.addLinkTo(columnTo.marker, tunnel.robotAction, preventEvent);
						}
					}
				});
			});
		}
		static getLastInstance() {
			return this.lastInstance;
		}
	}

	const Kanban = {
		Column,
		Grid
	};

	exports.Kanban = Kanban;
	exports.Manager = Manager;

})(this.BX.Crm.SalesTunnels = this.BX.Crm.SalesTunnels || {}, BX, BX, BX.Main, BX.Main, BX, BX.UI.Analytics);
//# sourceMappingURL=script.js.map
