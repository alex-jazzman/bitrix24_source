/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, ui_buttons) {
	'use strict';

	class VibecodeButton {
		#button;
		constructor() {
			const settings = main_core.Extension.getSettings('vibecodeconnector.vibecode-button');
			const href = settings.get('href');
			const brand = settings.get('brand') === 'alaio' ? 'alaio' : 'bitrix24';
			const brandName = settings.get('brandName') ?? '';
			this.#button = new ui_buttons.Button({
				useAirDesign: true,
				link: href,
				text: brandName,
				icon: ui_buttons.ButtonIcon.VIBECODE,
				size: ui_buttons.ButtonSize.SMALL,
				className: 'vibecodeconnector-vibecode-button',
				dataset: {
					vibecodeBrand: brand,
					testid: 'vibecode-button'
				},
				props: {
					target: '_blank',
					rel: 'noopener noreferrer'
				}
			});
			this.#button.addClass('--ui-context-edge-dark');
			this.#button.startShimmer();
		}
		render() {
			return this.#button.render();
		}
		setCollapsed(collapsed = true) {
			this.#button.setCollapsed(collapsed);
			return this;
		}
	}
	function startServerButtonsShimmer() {
		const selector = '.vibecodeconnector-vibecode-button[data-btn-uniqid]';
		const start = node => {
			if (node.querySelector('.ui-button__shimmer')) {
				return;
			}
			const button = ui_buttons.ButtonManager.createFromNode(node);
			if (button instanceof ui_buttons.Button) {
				button.startShimmer();
			}
		};
		const attachWithin = root => {
			root.querySelectorAll(selector).forEach(node => start(node));
		};
		attachWithin(document);
		new MutationObserver(mutations => {
			mutations.forEach(({
				addedNodes
			}) => {
				addedNodes.forEach(node => {
					if (node instanceof Element) {
						if (node.matches(selector)) {
							start(node);
						}
						attachWithin(node);
					}
				});
			});
		}).observe(document.documentElement, {
			childList: true,
			subtree: true
		});
	}
	startServerButtonsShimmer();

	exports.VibecodeButton = VibecodeButton;

})(this.BX.Vibecodeconnector = this.BX.Vibecodeconnector || {}, BX, BX.UI);
//# sourceMappingURL=vibecode-button.bundle.js.map
