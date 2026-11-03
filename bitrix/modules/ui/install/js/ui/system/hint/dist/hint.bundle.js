/* eslint-disable */
this.BX = this.BX || {};
this.BX.UI = this.BX.UI || {};
this.BX.UI.System = this.BX.UI.System || {};
(function (exports, main_core, main_core_events, ui_iconSet_api_core, ui_iconSet_main, ui_iconSet_outline, ui_designTokens_air, ui_system_tooltip) {
	'use strict';

	const HintSize = Object.freeze({
		Md: 'md',
		Lg: 'lg',
		Xl: 'xl'
	});
	const HintTrigger = Object.freeze({
		Hover: 'hover',
		Click: 'click'
	});
	const DEFAULT_SIZE = HintSize.Md;
	const DEFAULT_TRIGGER = HintTrigger.Hover;

	const EVENT_NAMESPACE = 'BX.UI.System.Hint';
	const BLOCK_CLASS = 'ui-system-hint';
	const ARIA_LABEL_PHRASE = 'UI_SYSTEM_HINT_BUTTON_LABEL_ARIA';
	const TOOLTIP_TRIGGER = Object.freeze({
		[HintTrigger.Hover]: [ui_system_tooltip.TooltipTrigger.Hover, ui_system_tooltip.TooltipTrigger.Focus],
		[HintTrigger.Click]: [ui_system_tooltip.TooltipTrigger.Click, ui_system_tooltip.TooltipTrigger.Focus]
	});
	const isSize = value => {
		return Object.values(HintSize).includes(value);
	};
	const isTrigger = value => {
		return Object.values(HintTrigger).includes(value);
	};
	const normalizeOptions = raw => {
		const tooltipOptions = main_core.Type.isPlainObject(raw.tooltipOptions) ? raw.tooltipOptions : null;
		const onClick = main_core.Type.isFunction(raw.onClick) ? raw.onClick : null;
		if (tooltipOptions !== null && onClick !== null) {
			console.warn(`${EVENT_NAMESPACE}: the "onClick" option is read in the action mode alone - a hint given ` + '"tooltipOptions" answers a click with its bubble.');
		}
		return {
			size: isSize(raw.size) ? raw.size : DEFAULT_SIZE,
			filled: raw.filled === true,
			tooltipOptions,
			onClick,
			ariaLabel: main_core.Type.isStringFilled(raw.ariaLabel) ? raw.ariaLabel : main_core.Loc.getMessage(ARIA_LABEL_PHRASE) ?? ''
		};
	};
	class Hint extends main_core_events.EventEmitter {
		#options;
		#container;
		#tooltip = null;
		#destroyed = false;
		constructor(options = {}) {
			super();
			this.setEventNamespace(EVENT_NAMESPACE);
			this.#options = normalizeOptions(options);
			this.#container = this.#renderButton();
			if (options.events) {
				this.subscribeFromOptions(options.events);
			}
			const tooltipOptions = this.#options.tooltipOptions;
			if (tooltipOptions === null) {
				main_core.Event.bind(this.#container, 'click', this.#handleClick);
			} else {
				this.#tooltip = this.#createTooltip(tooltipOptions);
			}
		}
		render() {
			return this.#container;
		}
		getContainer() {
			return this.#container;
		}
		destroy() {
			if (this.#destroyed) {
				return;
			}
			this.#destroyed = true;
			this.#tooltip?.destroy();
			this.#tooltip = null;
			main_core.Event.unbind(this.#container, 'click', this.#handleClick);
			main_core.Dom.remove(this.#container);
			this.unsubscribeAll();
		}
		#renderButton() {
			const options = this.#options;
			const modifiers = `--${options.size}${options.filled ? ' --filled' : ''}`;
			const button = main_core.Tag.render`
			<button type="button" class="${BLOCK_CLASS} ${modifiers}">
				${this.#renderIcon()}
			</button>
		`;
			main_core.Dom.attr(button, 'aria-label', options.ariaLabel);
			return button;
		}
		#renderIcon() {
			return new ui_iconSet_api_core.Icon({
				icon: this.#options.filled ? ui_iconSet_api_core.Main.HELP : ui_iconSet_api_core.Outline.QUESTION
			}).render();
		}
		#createTooltip(options) {
			const tooltipOptions = {
				target: this.#container,
				content: options.content,
				html: options.html,
				maxWidth: options.maxWidth,
				position: options.position,
				trigger: TOOLTIP_TRIGGER[isTrigger(options.trigger) ? options.trigger : DEFAULT_TRIGGER],
				showDelay: options.showDelay,
				hideDelay: options.hideDelay,
				events: {
					onShow: this.#handleTooltipShow,
					onHide: this.#handleTooltipHide
				}
			};
			return new ui_system_tooltip.Tooltip(tooltipOptions);
		}
		#handleClick = () => {
			this.#options.onClick?.();
		};
		#handleTooltipShow = () => {
			this.emit('onShow', {});
		};
		#handleTooltipHide = () => {
			this.emit('onHide', {});
		};
	}

	exports.DEFAULT_SIZE = DEFAULT_SIZE;
	exports.Hint = Hint;
	exports.HintSize = HintSize;
	exports.HintTrigger = HintTrigger;

})(this.BX.UI.System.Hint = this.BX.UI.System.Hint || {}, BX, BX.Event, BX.UI.IconSet, window, window, window, BX.UI.System.Tooltip);
//# sourceMappingURL=hint.bundle.js.map
