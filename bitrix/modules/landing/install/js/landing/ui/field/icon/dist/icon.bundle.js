/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
this.BX.Landing.UI = this.BX.Landing.UI || {};
(function (exports, main_core, landing_ui_panel_iconpanel, landing_ui_field_image, landing_ui_card_iconoptionscard) {
	'use strict';

	/**
	 * @memberOf BX.Landing.UI.Field
	 */
	class Icon {
		constructor(data) {
			const self = Reflect.construct(landing_ui_field_image.Image, [data], new.target);
			self.uploadButton.layout.innerText = BX.Landing.Loc.getMessage("LANDING_ICONS_FIELD_BUTTON_REPLACE");
			self.editButton.layout.hidden = true;
			self.clearButton.layout.hidden = true;
			self.dropzone.removeEventListener("dragover", self.onDragOver);
			self.dropzone.removeEventListener("dragleave", self.onDragLeave);
			self.dropzone.removeEventListener("drop", self.onDrop);
			self.preview.removeEventListener("dragenter", self.onImageDragEnter);
			self.options = new landing_ui_card_iconoptionscard.IconOptionsCard();
			main_core.Dom.append(self.options.getLayout(), self.right);
			self.onOptionClick = self.onOptionClick.bind(self);
			self.options.subscribe('onChange', self.onOptionClick);
			const sourceClassList = self.content.classList;
			const newClassList = [];
			landing_ui_panel_iconpanel.IconPanel.getLibraries().then(function (libraries) {
				if (libraries.length === 0) {
					this.uploadButton.disable();
				} else {
					libraries.forEach(library => {
						library.categories.forEach(category => {
							category.items.forEach(item => {
								let itemClasses = '';
								if (main_core.Type.isObject(item)) {
									itemClasses = item.options.join(' ');
								} else {
									itemClasses = item;
								}
								const iconClasses = itemClasses.split(" ");
								iconClasses.forEach(iconClass => {
									if (sourceClassList.indexOf(iconClass) !== -1 && newClassList.indexOf(iconClass) === -1) {
										newClassList.push(iconClass);
									}
								});
							});
						});
					});
					this.icon.innerHTML = "<span class=\"test " + newClassList.join(" ") + "\"></span>";
				}
				this.options.setOptionsByItem(newClassList);
			}.bind(self));
			return self;
		}
		onUploadClick(event) {
			event.preventDefault();
			landing_ui_panel_iconpanel.IconPanel.getInstance().show().then(result => {
				this.options.setOptions(result.iconOptions, result.iconClassName);
				this.setValue({
					type: "icon",
					classList: result.iconClassName.split(" ")
				});
			});
		}
		onOptionClick(event) {
			const classList = event.getData().option.split(' ');
			this.setValue({
				type: 'icon',
				classList
			});
		}

		/**
		 * Checks whether the current value differs from the stored one.
		 *
		 * @returns {boolean} True if the value has changed, false otherwise.
		 */
		isChanged() {
			const previous = this.prepareValue(this.content);
			const current = this.prepareValue(this.getValue());
			return !this.isEqual(previous, current);
		}

		/**
		 * Compares two objects by value.
		 * Assumes objects are already normalized.
		 *
		 * @param {Object} a
		 * @param {Object} b
		 * @returns {boolean}
		 */
		isEqual(a, b) {
			return JSON.stringify(a) === JSON.stringify(b);
		}

		/**
		 * Prepares a value for comparison:
		 * - clones the object
		 * - normalizes classList
		 * - normalizes url
		 *
		 * @param {Object} value
		 * @returns {Object}
		 */
		prepareValue(value) {
			const prepared = BX.Landing.Utils.clone(value);
			prepared.classList = this.normalizeClassList(prepared.classList);
			prepared.url = this.normalizeUrl(prepared.url);
			return prepared;
		}

		/**
		 * Normalizes a CSS class list:
		 * - converts string to array
		 * - ensures array type
		 * - adds selector class if missing
		 * - removes duplicates
		 * - sorts alphabetically
		 *
		 * @param {string|string[]|null|undefined} classList
		 * @returns {string[]}
		 */
		normalizeClassList(classList) {
			let list = classList;
			if (main_core.Type.isString(list)) {
				list = list.split(' ');
			}
			if (!Array.isArray(list)) {
				list = [];
			}
			this.addSelectorClass(list);
			return BX.Landing.Utils.arrayUnique(list).sort();
		}

		/**
		 * Adds a class extracted from this.selector into the class list.
		 *
		 * Example:
		 *  ".button@hover" -> "button"
		 *
		 * @param {string[]} classList
		 * @returns {void}
		 */
		addSelectorClass(classList) {
			if (!this.selector) {
				return;
			}
			const selectorClass = this.selector.split('@')[0].replace('.', '');
			if (selectorClass && !classList.includes(selectorClass)) {
				classList.push(selectorClass);
			}
		}

		/**
		 * Normalizes a URL value into a predictable object structure.
		 *
		 * @param {string|Object|null|undefined} url
		 * @returns {Object} Normalized URL object
		 */
		normalizeUrl(url) {
			let value = url;
			if (main_core.Type.isString(value)) {
				value = BX.Landing.Utils.decodeDataValue(value);
			}
			if (!main_core.Type.isPlainObject(value)) {
				return this.getEmptyUrl();
			}
			const result = {
				...this.getEmptyUrl(),
				enabled: true,
				...value
			};
			if (result.href === '' || result.href === '#') {
				result.enabled = false;
			}
			return result;
		}

		/**
		 * Returns an empty (disabled) URL object.
		 *
		 * @returns {{ text: string, href: string, target: string, enabled: boolean }}
		 */
		getEmptyUrl() {
			return {
				text: '',
				href: '',
				target: '',
				enabled: false
			};
		}
		getValue() {
			var classList = this.classList;
			if (this.selector) {
				var selectorClassname = this.selector.split("@")[0].replace(".", "");
				classList = main_core.Runtime.clone(this.classList).concat([selectorClassname]);
				classList = BX.Landing.Utils.arrayUnique(classList);
			}
			return {
				type: "icon",
				src: "",
				id: -1,
				alt: "",
				classList: classList,
				url: Object.assign({}, this.url.getValue(), {
					enabled: true
				})
			};
		}
		reset() {
			this.setValue({
				type: "icon",
				src: "",
				id: -1,
				alt: "",
				classList: [],
				url: ''
			});
		}
	}
	Object.setPrototypeOf(Icon, landing_ui_field_image.Image);
	Object.setPrototypeOf(Icon.prototype, landing_ui_field_image.Image.prototype);

	exports.Icon = Icon;

})(this.BX.Landing.UI.Field = this.BX.Landing.UI.Field || {}, BX, BX.Landing.UI.Panel, BX.Landing.UI.Field, BX.Landing.UI.Card);
//# sourceMappingURL=icon.bundle.js.map
