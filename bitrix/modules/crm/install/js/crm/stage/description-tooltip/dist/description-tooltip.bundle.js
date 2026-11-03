/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, main_core, main_popup, ui_a11y, ui_bbcode_formatter_htmlFormatter, ui_hint) {
	'use strict';

	class ActiveTooltipRegistry {
		#activeTooltip = null;
		#suspensionTokens = new Set();
		activate(tooltip) {
			if (this.#suspensionTokens.size > 0) {
				return false;
			}
			if (this.#activeTooltip === tooltip) {
				return true;
			}
			const previousTooltip = this.#activeTooltip;
			this.#activeTooltip = tooltip;
			previousTooltip?.hideImmediately();
			return true;
		}
		deactivate(tooltip) {
			if (this.#activeTooltip === tooltip) {
				this.#activeTooltip = null;
			}
		}
		suspend() {
			const token = Symbol('stage-description-tooltip-suspension');
			this.#suspensionTokens.add(token);
			const activeTooltip = this.#activeTooltip;
			this.#activeTooltip = null;
			activeTooltip?.hideImmediately();
			return {
				release: () => {
					this.#suspensionTokens.delete(token);
				}
			};
		}
	}
	const activeTooltipRegistry = new ActiveTooltipRegistry();

	function isPopupContainerMouseLeave(target, popupContainer) {
		return popupContainer !== null && target === popupContainer;
	}

	function isSameVisibleTooltip(currentBindElement, popupContainer, nextBindElement) {
		return popupContainer !== null && currentBindElement === nextBindElement;
	}

	const allowedDescriptionNodeNames = new Set(['#root', '#text', '#tab', '#linebreak', 'p', 'b', 'i', 'u', 's', 'url']);
	const allowedDescriptionHtmlTags = new Set(['A', 'B', 'BR', 'I', 'P', 'S', 'U']);
	class StageDescriptionHtmlFormatter extends ui_bbcode_formatter_htmlFormatter.HtmlFormatter {
		getNodeFormatter(node) {
			if (allowedDescriptionNodeNames.has(node.getName())) {
				return super.getNodeFormatter(node);
			}
			return this.runOnUnknown({
				node,
				formatter: this,
				data: this.getData() ?? {}
			});
		}
	}
	const formatter = new StageDescriptionHtmlFormatter();
	const tooltipIdPrefix = `crm-stage-description-tooltip-${main_core.Text.getRandom()}`;
	const tooltipHideDelay = 700;
	let tooltipIdCounter = 0;
	function centerStageDescriptionPopup(popup, bindElement) {
		const popupContainer = popup.getPopupContainer();
		const anchorWidth = main_core.Type.isElementNode(bindElement) ? bindElement.offsetWidth : null;
		const popupWidth = popupContainer.offsetWidth;
		const angleElement = popupContainer.querySelector('.popup-window-angly');
		const angleWidth = angleElement?.offsetWidth;
		const angleLeftOffset = main_popup.Popup.getOption('angleLeftOffset');
		if (!main_core.Type.isNumber(anchorWidth) || !main_core.Type.isNumber(popupWidth) || popupWidth <= 0 || !main_core.Type.isNumber(angleWidth) || !main_core.Type.isNumber(angleLeftOffset)) {
			return;
		}
		popup.setOffset({
			offsetLeft: angleLeftOffset + (anchorWidth - popupWidth) / 2
		});
		popup.setAngle({
			offset: (popupWidth - angleWidth) / 2
		});
	}
	function adjustStageDescriptionPopup(popup, bindElement) {
		centerStageDescriptionPopup(popup, bindElement);
		popup.adjustPosition({
			forceBindPosition: true
		});
	}
	function getNextStageDescriptionTooltipId() {
		tooltipIdCounter++;
		return `${tooltipIdPrefix}-${tooltipIdCounter}`;
	}
	function formatDescription(description, descriptionFormatter) {
		if (!main_core.Type.isStringFilled(description)) {
			return '';
		}
		try {
			const formattedDescription = descriptionFormatter.format({
				source: description
			});
			if (!formattedDescription) {
				throw new Error('Stage description formatter returned empty content');
			}
			return sanitizeFormattedDescription(formattedDescription);
		} catch {
			return main_core.Text.encode(description).trim().replaceAll(/\r?\n/g, '<br>');
		}
	}
	function sanitizeFormattedDescription(formattedDescription) {
		const container = document.createElement('div');
		container.appendChild(formattedDescription);
		[...container.querySelectorAll('*')].forEach(element => {
			if (!allowedDescriptionHtmlTags.has(element.tagName)) {
				element.replaceWith(...element.childNodes);
				return;
			}
			const className = element.getAttribute('class');
			const href = element.tagName === 'A' ? element.getAttribute('href') ?? '' : '';
			[...element.attributes].forEach(attribute => element.removeAttribute(attribute.name));
			if (className) {
				element.className = className;
			}
			if (element.tagName !== 'A') {
				return;
			}
			if (!/^https?:\/\//i.test(href)) {
				element.replaceWith(...element.childNodes);
				return;
			}
			element.setAttribute('href', href);
		});
		return container.innerHTML.trim();
	}
	function getStageDescriptionTooltipContent(options, descriptionFormatter = formatter) {
		const name = options.showName && main_core.Type.isStringFilled(options.name) ? main_core.Text.encode(options.name).trim() : '';
		const description = formatDescription(options.description, descriptionFormatter);
		if (!main_core.Type.isStringFilled(name) && !main_core.Type.isStringFilled(description)) {
			return '';
		}
		return `
		<div class="crm-stage-description-tooltip" data-testid="crm-stage-description-tooltip">
			${main_core.Type.isStringFilled(name) ? `<p class="crm-stage-description-tooltip__name">${name}</p>` : ''}
			${main_core.Type.isStringFilled(description) ? `<div class="crm-stage-description-tooltip__description">${description}</div>` : ''}
		</div>
	`;
	}
	class StageDescriptionTooltip {
		#hideTimeout = null;
		#popupContainer = null;
		#resizeObserver = null;
		#hint = ui_hint.Hint.createInstance({
			id: getNextStageDescriptionTooltipId(),
			popupParameters: {
				angle: true,
				className: 'ui-hint-popup crm-stage-description-tooltip-popup',
				darkMode: false,
				offsetTop: 2,
				maxWidth: 340,
				background: 'var(--ui-color-bg-content-inapp, #0056bf)',
				padding: 6,
				targetContainer: document.body,
				events: {
					onPopupShow: popup => this.#handlePopupShow(popup),
					onPopupClose: () => this.#handlePopupClose()
				}
			}
		});
		#bindElement = null;
		#focusElement = null;
		#visibleContent = null;
		#handlePopupMouseEnter = () => {
			this.#cancelScheduledHide();
		};
		#handlePopupMouseLeave = event => {
			if (!isPopupContainerMouseLeave(event.target, this.#popupContainer)) {
				return;
			}
			event.stopImmediatePropagation();
			if (this.#isFocusWithinTooltip()) {
				return;
			}
			this.hide();
		};
		#handleFocusIn = () => {
			this.#cancelScheduledHide();
		};
		#handleFocusOut = event => {
			if (this.#isWithinTooltip(event.relatedTarget)) {
				this.#cancelScheduledHide();
				return;
			}
			this.hide();
		};
		#handleBindElementKeyDown = event => {
			if (event.key === 'Escape') {
				this.#closeFromKeyboard(event);
				return;
			}
			if (event.key !== 'Tab' || event.shiftKey || !this.#popupContainer) {
				return;
			}
			const firstPopupTarget = ui_a11y.FocusNavigator.getFirst(this.#popupContainer, {
				tabbableOnly: true
			});
			if (firstPopupTarget) {
				event.preventDefault();
				ui_a11y.FocusNavigator.focusTarget(firstPopupTarget, {
					focusVisible: true
				});
			}
		};
		#handlePopupKeyDown = event => {
			if (event.key === 'Escape') {
				this.#closeFromKeyboard(event);
				return;
			}
			if (event.key !== 'Tab' || !this.#popupContainer) {
				return;
			}
			const activeElement = ui_a11y.FocusNavigator.getActiveElement(this.#popupContainer);
			const firstPopupTarget = ui_a11y.FocusNavigator.getFirst(this.#popupContainer, {
				tabbableOnly: true
			});
			const lastPopupTarget = ui_a11y.FocusNavigator.getLast(this.#popupContainer, {
				tabbableOnly: true
			});
			if (event.shiftKey && activeElement === firstPopupTarget) {
				event.preventDefault();
				ui_a11y.FocusNavigator.restoreFocus(this.#focusElement, {
					focusVisible: true
				});
				return;
			}
			if (!event.shiftKey && activeElement === lastPopupTarget && this.#focusElement) {
				const focusElement = this.#focusElement;
				const nextTarget = ui_a11y.FocusNavigator.getNext(document.body, {
					from: focusElement,
					tabbableOnly: true,
					accept: element => !this.#popupContainer?.contains(element)
				});
				event.preventDefault();
				this.hideImmediately();
				if (nextTarget) {
					ui_a11y.FocusNavigator.focusTarget(nextTarget, {
						focusVisible: true
					});
				} else {
					ui_a11y.FocusNavigator.restoreFocus(focusElement, {
						focusVisible: true
					});
				}
			}
		};
		#closeFromKeyboard(event) {
			event.preventDefault();
			event.stopPropagation();
			const focusElement = this.#focusElement;
			this.hideImmediately();
			ui_a11y.FocusNavigator.restoreFocus(focusElement, {
				focusVisible: true
			});
		}
		#handlePopupShow(popup) {
			adjustStageDescriptionPopup(popup, this.#bindElement);
			this.#observeBindElementResize(popup, this.#bindElement);
			this.#bindPopupContainer(popup.getPopupContainer());
		}
		#handlePopupClose() {
			activeTooltipRegistry.deactivate(this);
			this.#cancelScheduledHide();
			this.#unbindPopupContainer();
			this.#unbindBindElement();
			this.#disconnectResizeObserver();
			this.#bindElement = null;
			this.#focusElement = null;
			this.#visibleContent = null;
		}
		#bindPopupContainer(popupContainer) {
			this.#unbindPopupContainer();
			this.#popupContainer = popupContainer;
			this.#popupContainer.classList.add('ui-hint-popup-interactivity');
			this.#popupContainer.addEventListener('mouseenter', this.#handlePopupMouseEnter);
			this.#popupContainer.addEventListener('mouseleave', this.#handlePopupMouseLeave, true);
			this.#popupContainer.addEventListener('focusin', this.#handleFocusIn);
			this.#popupContainer.addEventListener('focusout', this.#handleFocusOut);
			this.#popupContainer.addEventListener('keydown', this.#handlePopupKeyDown);
			this.#bindBindElement();
		}
		#unbindPopupContainer() {
			if (!this.#popupContainer) {
				return;
			}
			this.#popupContainer.removeEventListener('mouseenter', this.#handlePopupMouseEnter);
			this.#popupContainer.removeEventListener('mouseleave', this.#handlePopupMouseLeave, true);
			this.#popupContainer.removeEventListener('focusin', this.#handleFocusIn);
			this.#popupContainer.removeEventListener('focusout', this.#handleFocusOut);
			this.#popupContainer.removeEventListener('keydown', this.#handlePopupKeyDown);
			this.#popupContainer.classList.remove('ui-hint-popup-interactivity');
			this.#popupContainer = null;
		}
		#bindBindElement() {
			if (!this.#focusElement) {
				return;
			}
			this.#focusElement.addEventListener('focusin', this.#handleFocusIn);
			this.#focusElement.addEventListener('focusout', this.#handleFocusOut);
			this.#focusElement.addEventListener('keydown', this.#handleBindElementKeyDown);
		}
		#unbindBindElement() {
			if (!this.#focusElement) {
				return;
			}
			this.#focusElement.removeEventListener('focusin', this.#handleFocusIn);
			this.#focusElement.removeEventListener('focusout', this.#handleFocusOut);
			this.#focusElement.removeEventListener('keydown', this.#handleBindElementKeyDown);
		}
		#isWithinTooltip(target) {
			return Boolean(main_core.Type.isElementNode(target) && (this.#focusElement?.contains(target) || this.#popupContainer?.contains(target)));
		}
		#isFocusWithinTooltip() {
			return this.#isWithinTooltip(ui_a11y.FocusNavigator.getActiveElement(this.#popupContainer));
		}
		#observeBindElementResize(popup, bindElement) {
			this.#disconnectResizeObserver();
			if (!main_core.Type.isFunction(window.ResizeObserver) || !main_core.Type.isElementNode(bindElement)) {
				return;
			}
			this.#resizeObserver = new window.ResizeObserver(() => {
				if (popup.isShown()) {
					adjustStageDescriptionPopup(popup, bindElement);
					this.#hint.fixPopupAngle(bindElement);
				}
			});
			this.#resizeObserver.observe(bindElement);
		}
		#disconnectResizeObserver() {
			this.#resizeObserver?.disconnect();
			this.#resizeObserver = null;
		}
		show(options) {
			this.#cancelScheduledHide();
			if (!main_core.Type.isElementNode(options.bindElement)) {
				this.hideImmediately();
				return;
			}
			if (isSameVisibleTooltip(this.#bindElement, this.#popupContainer, options.bindElement) && this.#hasSameVisibleContent(options)) {
				return;
			}
			const content = getStageDescriptionTooltipContent(options);
			if (!main_core.Type.isStringFilled(content)) {
				this.hideImmediately();
				return;
			}
			if (!activeTooltipRegistry.activate(this)) {
				return;
			}
			this.#unbindBindElement();
			this.#bindElement = options.bindElement;
			this.#focusElement = main_core.Type.isElementNode(options.focusElement) ? options.focusElement : options.bindElement;
			this.#visibleContent = {
				name: options.name,
				description: options.description,
				showName: options.showName
			};
			this.#hint.show(this.#bindElement, content, true);
			this.#hint.fixPopupAngle(this.#bindElement);
		}
		#hasSameVisibleContent(options) {
			return this.#visibleContent?.name === options.name && this.#visibleContent.description === options.description && this.#visibleContent.showName === options.showName;
		}
		hide() {
			this.#cancelScheduledHide();
			if (!this.#bindElement) {
				return;
			}
			this.#hideTimeout = window.setTimeout(() => this.hideImmediately(), tooltipHideDelay);
		}
		hideImmediately() {
			activeTooltipRegistry.deactivate(this);
			this.#cancelScheduledHide();
			this.#unbindPopupContainer();
			this.#unbindBindElement();
			this.#disconnectResizeObserver();
			this.#visibleContent = null;
			if (this.#bindElement) {
				this.#hint.hide(this.#bindElement);
				this.#bindElement = null;
			}
			this.#focusElement = null;
		}
		#cancelScheduledHide() {
			if (this.#hideTimeout === null) {
				return;
			}
			clearTimeout(this.#hideTimeout);
			this.#hideTimeout = null;
		}
	}

	const stageDescriptionTooltipCoordinator = {
		suspend: () => activeTooltipRegistry.suspend()
	};

	exports.StageDescriptionTooltip = StageDescriptionTooltip;
	exports.getStageDescriptionTooltipContent = getStageDescriptionTooltipContent;
	exports.stageDescriptionTooltipCoordinator = stageDescriptionTooltipCoordinator;

})(this.BX.Crm.Stage = this.BX.Crm.Stage || {}, BX, BX.Main, BX.UI.Accessibility, BX.UI.BBCode.Formatter, BX.UI);
//# sourceMappingURL=description-tooltip.bundle.js.map
