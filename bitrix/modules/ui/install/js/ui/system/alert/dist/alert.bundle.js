/* eslint-disable */
this.BX = this.BX || {};
this.BX.UI = this.BX.UI || {};
this.BX.UI.System = this.BX.UI.System || {};
(function (exports, main_core, ui_system_typography, ui_iconSet_api_core, ui_iconSet_outline, ui_system_typography_vue, ui_iconSet_api_vue) {
	'use strict';

	const AlertDesign = Object.freeze({
		tinted: 'tinted',
		tintedSuccess: 'tinted-success',
		tintedWarning: 'tinted-warning',
		tintedAlert: 'tinted-alert'
	});

	let Alert$1 = class Alert {
		#design;
		#leftImage;
		#hasCloseButton;
		#content;
		#container;
		#onCloseButtonClick;
		#closeButton;
		constructor(options = {}) {
			this.#design = AlertDesign.tinted;
			if (options.design) {
				this.design = options.design;
			}
			this.#hasCloseButton = options.hasCloseButton === true;
			this.#content = options.content || null;
			this.#leftImage = options.leftImage || null;
			this.#onCloseButtonClick = options.events?.closeButtonClick || null;
		}
		render() {
			if (this.#container) {
				return this.#container.root;
			}
			this.#container = main_core.Tag.render`
			<div class="ui-system-alert ui-system-alert__scope">
				<div class="ui-system-alert-inner">
					<div class="ui-system-alert__left-image"></div>
					<div ref="content" class="ui-system-alert__content"></div>
				</div>
			</div>
		`;
			this.design = this.#design;
			this.leftImage = this.#leftImage;
			this.hasCloseButton = this.#hasCloseButton;
			this.content = this.#content;
			return this.#container.root;
		}
		destroy() {
			if (this.#closeButton && this.#onCloseButtonClick) {
				main_core.Event.unbind(this.#closeButton, 'click', this.#onCloseButtonClick);
			}
			if (this.#container?.root) {
				main_core.Dom.remove(this.#container.root);
			}
			this.#closeButton = null;
			this.#container = null;
			this.#content = null;
			this.#onCloseButtonClick = null;
		}
		get content() {
			return this.#content;
		}
		set content(content) {
			if (this.#container) {
				this.#container.content.innerHTML = '';
				if (main_core.Type.isString(content)) {
					main_core.Dom.append(ui_system_typography.Text.render(content, {
						size: '2xs'
					}), this.#container.content);
				} else if (main_core.Type.isDomNode(content)) {
					main_core.Dom.append(content, this.#container.content);
				}
			}
			this.#content = content;
		}
		get design() {
			return this.#design;
		}
		set design(design) {
			if (!Object.values(AlertDesign).includes(design)) {
				return;
			}
			this.#updateContainerDesignClassname(design);
			this.#design = design;
		}
		get leftImage() {
			return this.#leftImage;
		}
		set leftImage(image) {
			if (this.#container?.root) {
				if (image) {
					main_core.Dom.style(this.#container.root, '--ui-alert-left-image', `url(${main_core.Text.encode(image)})`);
					main_core.Dom.addClass(this.#container.root, '--has-left-image');
				} else {
					main_core.Dom.style(this.#container.root, '--ui-alert-left-image', 'none');
					main_core.Dom.removeClass(this.#container.root, '--has-left-image');
				}
			}
			this.#leftImage = image;
		}
		get hasCloseButton() {
			return this.#hasCloseButton;
		}
		set hasCloseButton(value) {
			if (this.#container?.root) {
				if (value === true) {
					if (!this.#closeButton) {
						this.#closeButton = this.#renderCloseButton();
					}
					main_core.Dom.append(this.#closeButton, this.#container.root);
					main_core.Dom.addClass(this.#container.root, '--has-close-button');
				} else {
					if (this.#closeButton) {
						main_core.Dom.remove(this.#closeButton);
					}
					main_core.Dom.removeClass(this.#container.root, '--has-close-button');
				}
			}
			this.#hasCloseButton = value === true;
		}
		get onClose() {
			return this.#onCloseButtonClick;
		}
		set onClose(callback) {
			if (this.#closeButton && this.#onCloseButtonClick) {
				main_core.Event.unbind(this.#closeButton, 'click', this.#onCloseButtonClick);
			}
			this.#onCloseButtonClick = main_core.Type.isFunction(callback) ? callback : null;
			if (this.#closeButton && this.#onCloseButtonClick) {
				main_core.Event.bind(this.#closeButton, 'click', this.#onCloseButtonClick);
			}
		}
		get container() {
			return this.#container?.root || null;
		}
		#updateContainerDesignClassname(design) {
			if (this.#container?.root) {
				main_core.Dom.removeClass(this.#container.root, `--${this.#design}`);
				main_core.Dom.addClass(this.#container.root, `--${design}`);
			}
		}
		#renderCloseButton() {
			const icon = new ui_iconSet_api_core.Icon({
				icon: ui_iconSet_api_core.Outline.CROSS_S,
				size: 24
			});
			const button = main_core.Tag.render`
			<button
				class="ui-system-alert__close-button --ui-hoverable"
				aria-label="${main_core.Text.encode(main_core.Loc.getMessage('UI_SYSTEM_ALERT_CLOSE_BUTTON_LABEL_ARIA'))}"
				title="${main_core.Text.encode(main_core.Loc.getMessage('UI_SYSTEM_ALERT_CLOSE_BUTTON_LABEL_ARIA'))}"
			>${icon.render()}</button>
		`;
			if (this.#onCloseButtonClick) {
				main_core.Event.bind(button, 'click', this.#onCloseButtonClick);
			}
			return button;
		}
	};

	const Alert = {
		name: 'Alert',
		components: {
			Text2Xs: ui_system_typography_vue.Text2Xs,
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			design: {
				type: String,
				required: false,
				default: AlertDesign.tinted,
				validator: value => {
					return Object.values(AlertDesign).includes(value);
				}
			},
			hasCloseButton: {
				type: Boolean,
				required: false,
				default: false
			},
			leftImage: {
				type: String,
				required: false,
				default: null
			}
		},
		emits: ['closeButtonClick'],
		computed: {
			closeIcon() {
				return ui_iconSet_api_vue.Outline.CROSS_S;
			},
			rootClasses() {
				return ['ui-system-alert', 'ui-system-alert__scope', `--${this.design}`, {
					'--has-close-button': this.hasCloseButton,
					'--has-left-image': Boolean(this.leftImage)
				}];
			},
			leftImageStyle() {
				if (!this.leftImage) {
					return {};
				}
				return {
					'--ui-alert-left-image': `url(${this.leftImage})`
				};
			}
		},
		methods: {
			handleCloseClick() {
				this.$emit('closeButtonClick');
			}
		},
		template: `
		<div :class="rootClasses" :style="leftImageStyle">
			<div class="ui-system-alert-inner">
				<div class="ui-system-alert__left-image"></div>
				<div class="ui-system-alert__content">
					<Text2Xs>
						<slot></slot>
					</Text2Xs>
				</div>
			</div>
			<button
				v-if="hasCloseButton"
				class="ui-system-alert__close-button --ui-hoverable"
				:aria-label="$Bitrix.Loc.getMessage('UI_SYSTEM_ALERT_CLOSE_BUTTON_LABEL_ARIA')"
				:title="closeButtonLabel"
				@click="handleCloseClick"
			>
				<BIcon :name="closeIcon" :size="24" />
			</button>
		</div>
	`
	};

	var vue = /*#__PURE__*/Object.freeze({
		__proto__: null,
		Alert: Alert
	});

	exports.Alert = Alert$1;
	exports.AlertDesign = AlertDesign;
	exports.Vue = vue;

})(this.BX.UI.System.Alert = this.BX.UI.System.Alert || {}, BX, BX.UI.System.Typography, BX.UI.IconSet, window, BX.UI.System.Typography.Vue, BX.UI.IconSet);
//# sourceMappingURL=alert.bundle.js.map
