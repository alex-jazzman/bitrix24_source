/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
(function (exports, main_core, landing_env, landing_node_img) {
	'use strict';

	const encodeDataValue = BX.Landing.Utils.encodeDataValue;
	const decodeDataValue = BX.Landing.Utils.decodeDataValue;
	const data = BX.Landing.Utils.data;
	const attr = BX.Landing.Utils.attr;
	class Icon extends landing_node_img.Img {
		constructor(options) {
			super(options);
			this.type = 'icon';
			if (getSelectionPicker()) {
				// the inherited Img title promises image editing by click;
				// a selection-only icon is not edited at all
				this.node.removeAttribute('title');
				// a mousedown bubbling into a host text node would turn it
				// editable right under the selected icon; the click itself
				// is stopped in onClick
				this.node.addEventListener('mousedown', event => event.stopPropagation());
			}
		}

		/**
		 * Gets form field
		 * @return {BX.Landing.UI.Field.BaseField}
		 */
		getField() {
			if (this.field) {
				this.field.content = this.getValue();
			} else {
				const value = this.getValue();
				if (value.url) {
					value.url = decodeDataValue(value.url);
				}
				const disableLink = !!this.node.closest('a');
				this.field = new BX.Landing.UI.Field.Icon({
					selector: this.selector,
					title: this.manifest.name,
					disableLink: disableLink,
					content: value,
					dimensions: this.manifest.dimensions || {}
				});
			}
			return this.field;
		}

		/**
		 * Sets node value
		 * @param value - Path to image
		 * @param {?boolean} [preventSave = false]
		 * @param {?boolean} [preventHistory = false]
		 * @return {Promise<any>}
		 */
		setValue(value, preventSave = false, preventHistory = false) {
			this.lastValue = this.lastValue || this.getValue();
			this.preventSave(preventSave);
			return setIconValue(this.node, value).then(() => {
				if (value.url) {
					const url = this.preparePseudoUrl(value.url);
					if (url !== null) {
						attr(this.node, 'data-pseudo-url', url);
					}
				}
				this.onChange(preventHistory);
				if (!preventHistory) {
					BX.Landing.History.getInstance().push();
				}
				this.lastValue = this.getValue();
			});
		}

		/**
		 * Gets node value
		 * @return {{src: string}}
		 */
		getValue() {
			return {
				type: 'icon',
				src: '',
				id: -1,
				alt: '',
				classList: getIconClassList(this.node.className),
				url: encodeDataValue(getPseudoUrl(this))
			};
		}

		/**
		 * In the AI mode with the copilot element picker enabled the icon is
		 * selection-only: no floating upload panel, and the click toggles the
		 * icon selection (see onClick). With the picker disabled the icon
		 * keeps the Img behavior untouched.
		 */
		initFloatingPanel() {
			if (!isElementPickerEnabled()) {
				super.initFloatingPanel();
			}
		}
		onClick(event) {
			BX.Event.EventEmitter.emit('BX.Landing.Node.Icon:onClick');
			const picker = getSelectionPicker();
			// the same activation guard as the Img branches: while a text node is
			// being edited the click stays unhandled, reaches the editor document
			// and closes the inline editor / compact panels first
			if (picker && this.canActivateOnClick()) {
				// selection-only: the click must not reach the host node (a link
				// would navigate, a text node would open its editor) nor the
				// picker document handler (it would toggle the selection twice)
				event.preventDefault();
				event.stopPropagation();
				picker.toggleSelection(this);
				return;
			}
			super.onClick(event);
		}
	}
	BX.Landing.Node.Icon = Icon;

	/**
	 * Same soft reference as in img.js: no hard dependency on the extension.
	 * @return {boolean}
	 */
	function isElementPickerEnabled() {
		const picker = BX.Landing.Copilot && BX.Landing.Copilot.ElementPicker;
		return Boolean(picker && picker.isEnabled());
	}

	/**
	 * The picker instance when the icon must be selection-only: the element
	 * picker is enabled and the editor runs in the AI mode.
	 */
	// eslint-disable-next-line flowtype/require-return-type
	function getSelectionPicker() {
		if (!isElementPickerEnabled() || landing_env.Env.getInstance().isBlockControlsEnabled()) {
			return null;
		}
		return BX.Landing.Copilot.ElementPicker.getInstance();
	}

	// eslint-disable-next-line flowtype/require-return-type
	function getPseudoUrl(node) {
		const url = data(node.node, 'data-pseudo-url');
		return url || '';
	}

	/**
	 * Gets icon class list
	 * @param {string} className
	 * @return {string[]}
	 */
	function getIconClassList(className) {
		return className.split(' ');
	}

	/**
	 * Sets icon value or converts to span and sets value
	 * @param {BX.Landing.Node.Icon} node
	 * @param {object} value
	 * @return {Promise<any>}
	 */
	function setIconValue(node, value) {
		return BX.Landing.UI.Panel.IconPanel.getLibraries().then(libraries => {
			libraries.forEach(library => {
				library.categories.forEach(category => {
					category.items.forEach(item => {
						const className = BX.Type.isObject(item) ? item.options.join(' ') : item;
						const classList = className.split(' ');
						classList.forEach(classItem => {
							if (classItem) {
								main_core.Dom.removeClass(node, classItem);
							}
						});
					});
				});
			});
			value.classList.forEach(className => {
				main_core.Dom.addClass(node, className);
			});
		});
	}

	exports.Icon = Icon;

})(this.BX.Landing.Node = this.BX.Landing.Node || {}, BX, BX.Landing, BX.Landing.Node);
//# sourceMappingURL=icon.bundle.js.map
