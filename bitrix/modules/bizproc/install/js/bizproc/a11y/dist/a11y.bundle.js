/* eslint-disable */
this.BX = this.BX || {};
this.BX.Bizproc = this.BX.Bizproc || {};
(function (exports, main_core, ui_a11y, main_core_events) {
	'use strict';

	const DIALOG_CLASS = 'bizproc-a11y-dialog';
	function setupDialog(container, options = {}) {
		const label = main_core.Type.isStringFilled(options.label) ? options.label : main_core.Loc.getMessage('BIZPROC_JS_A11Y_DIALOG_DEFAULT_LABEL');
		main_core.Dom.attr(container, {
			role: 'dialog',
			'aria-modal': 'true',
			'aria-label': label
		});
		main_core.Dom.addClass(container, DIALOG_CLASS);
		const focusTrap = new ui_a11y.FocusTrap(container, {
			initialFocus: ['[data-autofocus]', 'container'],
			restoreFocus: options.restoreTo ?? true,
			looped: options.looped ?? true,
			isolateOutside: true
		});
		focusTrap.activate();
		return {
			destroy() {
				focusTrap.destroy();
				main_core.Dom.attr(container, {
					role: null,
					'aria-modal': null,
					'aria-label': null
				});
				main_core.Dom.removeClass(container, DIALOG_CLASS);
			}
		};
	}
	function setBusy(container, isBusy) {
		main_core.Dom.attr(container, 'aria-busy', isBusy ? 'true' : null);
	}

	function announce(message, options = {}) {
		const announcer = options.inTopWindow === true ? resolveTopAnnouncer() : ui_a11y.LiveAnnouncer;
		announcer.announce(message, options.assertive === true ? 'assertive' : 'polite');
	}
	function resolveTopAnnouncer() {
		try {
			const topWindow = window.top;
			return topWindow?.BX?.UI?.Accessibility?.LiveAnnouncer ?? ui_a11y.LiveAnnouncer;
		} catch {
			return ui_a11y.LiveAnnouncer;
		}
	}

	const NATIVE_ACTIVATABLE_SELECTOR = 'button, a[href], input, select, textarea';
	const FOCUSABLE_CLASS = 'bizproc-a11y-focusable';
	function makeActivatable(element, handler) {
		main_core.Event.bind(element, 'click', handler);
		main_core.Dom.addClass(element, FOCUSABLE_CLASS);
		if (element.matches(NATIVE_ACTIVATABLE_SELECTOR)) {
			return;
		}
		if (!element.hasAttribute('role')) {
			main_core.Dom.attr(element, 'role', 'button');
		}
		if (!element.hasAttribute('tabindex')) {
			main_core.Dom.attr(element, 'tabindex', '0');
		}
		main_core.Event.bind(element, 'keydown', event => {
			if (event.target !== element) {
				return;
			}
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault();
				element.click();
			}
		});
	}

	function visuallyHidden(text) {
		const node = new ui_a11y.VisuallyHidden();
		node.textContent = text;
		return node;
	}

	const DEFAULT_CONTROL_SELECTOR$1 = 'input:not([type="hidden"]), select, textarea';
	function readLabel(labelNode) {
		return (labelNode.textContent ?? '').replaceAll('*', '').replace(/:\s*$/, '').trim();
	}
	function hasAccessibleName(control) {
		const labels = control.labels;
		return Boolean(control.getAttribute('aria-label') || control.getAttribute('aria-labelledby') || labels !== null && labels !== undefined && labels.length > 0);
	}
	function labelFormControls(root, options) {
		if (!main_core.Type.isDomNode(root)) {
			return;
		}
		if (!main_core.Type.isStringFilled(options?.blockSelector) || !main_core.Type.isStringFilled(options?.labelSelector)) {
			return;
		}
		const controlSelector = main_core.Type.isStringFilled(options.controlSelector) ? options.controlSelector : DEFAULT_CONTROL_SELECTOR$1;
		root.querySelectorAll(options.blockSelector).forEach(block => {
			const labelNode = block.querySelector(options.labelSelector);
			if (!labelNode) {
				return;
			}
			const label = readLabel(labelNode);
			if (label === '') {
				return;
			}
			const content = main_core.Type.isStringFilled(options.contentSelector) ? block.querySelector(options.contentSelector) : block;
			if (!content) {
				return;
			}
			content.querySelectorAll(controlSelector).forEach(control => {
				if (!hasAccessibleName(control)) {
					control.setAttribute('aria-label', label);
				}
			});
		});
	}

	const DEFAULT_CONTROL_SELECTOR = 'input:not([type="hidden"]), select, textarea';
	const KEPT_DESCRIPTION_ATTRIBUTE = 'data-bizproc-a11y-kept-describedby';
	function collectControls(root, options) {
		const selector = main_core.Type.isStringFilled(options?.controlSelector) ? options?.controlSelector : DEFAULT_CONTROL_SELECTOR;
		return [...root.querySelectorAll(selector)];
	}
	function isControlOfField(control, name) {
		const controlName = control.name;
		return controlName === name || controlName === `${name}[]`;
	}
	function describeWithMessage(control, messageId) {
		const current = control.getAttribute('aria-describedby');
		if (current !== null && !control.hasAttribute(KEPT_DESCRIPTION_ATTRIBUTE)) {
			main_core.Dom.attr(control, KEPT_DESCRIPTION_ATTRIBUTE, current);
		}
		const ids = (current ?? '').split(' ').filter(id => id !== '');
		if (!ids.includes(messageId)) {
			ids.push(messageId);
		}
		main_core.Dom.attr(control, 'aria-describedby', ids.join(' '));
	}
	function markInvalidControls(root, fields, options) {
		if (!main_core.Type.isDomNode(root) || !main_core.Type.isArrayFilled(fields)) {
			return null;
		}
		const controls = collectControls(root, options);
		let first = null;
		fields.forEach(field => {
			if (!main_core.Type.isStringFilled(field?.name)) {
				return;
			}
			controls.filter(control => isControlOfField(control, field.name)).forEach(control => {
				main_core.Dom.attr(control, 'aria-invalid', 'true');
				if (main_core.Type.isStringFilled(field.messageId)) {
					describeWithMessage(control, field.messageId);
				}
				first ??= control;
			});
		});
		return first;
	}
	function clearInvalidControls(root, options) {
		if (!main_core.Type.isDomNode(root)) {
			return;
		}
		collectControls(root, options).filter(control => control.hasAttribute('aria-invalid')).forEach(control => {
			main_core.Dom.attr(control, 'aria-invalid', null);
			const kept = control.getAttribute(KEPT_DESCRIPTION_ATTRIBUTE);
			main_core.Dom.attr(control, 'aria-describedby', kept === '' ? null : kept);
			main_core.Dom.attr(control, KEPT_DESCRIPTION_ATTRIBUTE, null);
		});
	}
	function findUnfilledRequiredControl(root, options) {
		if (!main_core.Type.isDomNode(root)) {
			return null;
		}
		return collectControls(root, options).find(control => control.getAttribute('aria-required') === 'true' && control.value === '') ?? null;
	}

	const GRID_UPDATED_EVENT = 'Grid::updated';
	const ROW_ACTIONS_SELECTOR = '.main-grid-row-action-button';
	const CHECKBOX_SELECTOR = 'input.main-grid-row-checkbox, input.main-grid-check-all';
	const DEFAULT_ACTIVE_CLASS = 'main-grid-cell-content-action-active';
	function getActiveClass(toggle) {
		return main_core.Type.isStringFilled(toggle.activeClass) ? toggle.activeClass : DEFAULT_ACTIVE_CLASS;
	}
	function labelColumnHeaders(container, columnLabels) {
		Object.entries(columnLabels).forEach(([dataName, label]) => {
			if (!main_core.Type.isStringFilled(label)) {
				return;
			}
			const header = container.querySelector(`.main-grid-cell-head[data-name="${dataName}"]`);
			if (!header || header.querySelector('visually-hidden')) {
				return;
			}
			main_core.Dom.append(visuallyHidden(label), header);
		});
	}
	function hideServiceFrame(gridId) {
		const serviceFrame = document.getElementById(`main-grid-tmp-frame-${gridId}`);
		if (serviceFrame) {
			main_core.Dom.attr(serviceFrame, {
				'aria-hidden': 'true',
				tabindex: '-1'
			});
		}
	}
	function enhanceToggles(container, toggles) {
		toggles.forEach(toggle => {
			if (!main_core.Type.isStringFilled(toggle?.selector) || !main_core.Type.isStringFilled(toggle?.label)) {
				return;
			}
			const activeClass = getActiveClass(toggle);
			container.querySelectorAll(toggle.selector).forEach(button => {
				if (!main_core.Dom.hasClass(button, FOCUSABLE_CLASS)) {
					makeActivatable(button, () => {});
					main_core.Dom.attr(button, 'aria-label', toggle.label);
				}
				main_core.Dom.attr(button, 'aria-pressed', main_core.Dom.hasClass(button, activeClass) ? 'true' : 'false');
			});
		});
	}
	function enhanceGrid(container, options = {}) {
		if (!main_core.Type.isDomNode(container)) {
			return;
		}
		if (main_core.Type.isStringFilled(options.rowActionsLabel)) {
			container.querySelectorAll(ROW_ACTIONS_SELECTOR).forEach(button => {
				main_core.Dom.attr(button, {
					'aria-label': options.rowActionsLabel,
					'aria-haspopup': 'menu'
				});
			});
		}
		if (options.checkboxesFromTitle === true) {
			container.querySelectorAll(CHECKBOX_SELECTOR).forEach(checkbox => {
				if (!checkbox.getAttribute('aria-label') && main_core.Type.isStringFilled(checkbox.title)) {
					main_core.Dom.attr(checkbox, 'aria-label', checkbox.title);
				}
			});
		}
		if (main_core.Type.isPlainObject(options.columnLabels)) {
			labelColumnHeaders(container, options.columnLabels);
		}
		if (main_core.Type.isArrayFilled(options.toggles)) {
			enhanceToggles(container, options.toggles);
		}
		if (main_core.Type.isStringFilled(options.gridId)) {
			hideServiceFrame(options.gridId);
		}
	}
	function subscribeGridUpdated(gridId, handler) {
		if (!main_core.Type.isStringFilled(gridId) || !main_core.Type.isFunction(handler)) {
			return {
				destroy: () => {}
			};
		}
		const eventHandler = event => {
			if (event?.getCompatData?.()?.[0]?.getId?.() !== gridId) {
				return;
			}
			handler();
		};
		main_core_events.EventEmitter.subscribe(GRID_UPDATED_EVENT, eventHandler);
		return {
			destroy() {
				main_core_events.EventEmitter.unsubscribe(GRID_UPDATED_EVENT, eventHandler);
			}
		};
	}

	exports.announce = announce;
	exports.clearInvalidControls = clearInvalidControls;
	exports.enhanceGrid = enhanceGrid;
	exports.findUnfilledRequiredControl = findUnfilledRequiredControl;
	exports.labelFormControls = labelFormControls;
	exports.makeActivatable = makeActivatable;
	exports.markInvalidControls = markInvalidControls;
	exports.setBusy = setBusy;
	exports.setupDialog = setupDialog;
	exports.subscribeGridUpdated = subscribeGridUpdated;
	exports.visuallyHidden = visuallyHidden;

})(this.BX.Bizproc.A11y = this.BX.Bizproc.A11y || {}, BX, BX.UI.Accessibility, BX.Event);
//# sourceMappingURL=a11y.bundle.js.map
