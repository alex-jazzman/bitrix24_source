import {Dom, Runtime, Type} from 'main.core';
import {IconPanel} from 'landing.ui.panel.iconpanel';
import {Image} from 'landing.ui.field.image'
import {IconOptionsCard} from 'landing.ui.card.iconoptionscard';


import './css/style.css';

/**
 * @memberOf BX.Landing.UI.Field
 */
export class Icon extends Image
{
	constructor(data)
	{
		super(data);
		this.uploadButton.layout.innerText = BX.Landing.Loc.getMessage("LANDING_ICONS_FIELD_BUTTON_REPLACE");
		this.editButton.layout.hidden = true;
		this.clearButton.layout.hidden = true;

		this.dropzone.removeEventListener("dragover", this.onDragOver);
		this.dropzone.removeEventListener("dragleave", this.onDragLeave);
		this.dropzone.removeEventListener("drop", this.onDrop);
		this.preview.removeEventListener("dragenter", this.onImageDragEnter);

		this.options = new IconOptionsCard();
		Dom.append(this.options.getLayout(), this.right);
		this.onOptionClick = this.onOptionClick.bind(this);
		this.options.subscribe('onChange', this.onOptionClick);

		const sourceClassList = this.content.classList;
		const newClassList = [];
		IconPanel
			.getLibraries()
			.then(function (libraries)
			{
				if (libraries.length === 0)
				{
					this.uploadButton.disable();
				}
				else
				{
					libraries.forEach(library => {
						library.categories.forEach(category => {
							category.items.forEach(item => {
								let itemClasses = '';
								if (Type.isObject(item))
								{
									itemClasses = item.options.join(' ');
								}
								else
								{
									itemClasses = item;
								}

								const iconClasses = itemClasses.split(" ");
								iconClasses.forEach(iconClass => {
									if (
										sourceClassList.indexOf(iconClass) !== -1
										&& newClassList.indexOf(iconClass) === -1
									)
									{
										newClassList.push(iconClass);
									}
								});
							});
						});
					});

					this.icon.innerHTML = "<span class=\"test " + newClassList.join(" ") + "\"></span>";
				}

				this.options.setOptionsByItem(newClassList);
			}.bind(this));
	}

	onUploadClick(event)
	{
		event.preventDefault();

		IconPanel
			.getInstance()
			.show()
			.then(result => {
				this.options.setOptions(result.iconOptions, result.iconClassName);
				this.setValue({
					type: "icon",
					classList: result.iconClassName.split(" ")
				});
			});
	}

	onOptionClick(event)
	{
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
	isChanged(): boolean
	{
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
	isEqual(a: Object, b: Object): boolean
	{
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
	prepareValue(value): Object
	{
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
	normalizeClassList(classList: string | string[] | null | undefined): string[]
	{
		let list = classList;

		if (Type.isString(list))
		{
			list = list.split(' ');
		}

		if (!Array.isArray(list))
		{
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
	addSelectorClass(classList: string[]): void
	{
		if (!this.selector)
		{
			return;
		}

		const selectorClass = this.selector
			.split('@')[0]
			.replace('.', '');

		if (selectorClass && !classList.includes(selectorClass))
		{
			classList.push(selectorClass);
		}
	}

	/**
	 * Normalizes a URL value into a predictable object structure.
	 *
	 * @param {string|Object|null|undefined} url
	 * @returns {Object} Normalized URL object
	 */
	normalizeUrl(url: string | Object | null | undefined): Object
	{
		let value = url;

		if (Type.isString(value))
		{
			value = BX.Landing.Utils.decodeDataValue(value);
		}

		if (!Type.isPlainObject(value))
		{
			return this.getEmptyUrl();
		}

		const result = {
			...this.getEmptyUrl(),
			enabled: true,
			...value,
		};

		if (result.href === '' || result.href === '#')
		{
			result.enabled = false;
		}

		return result;
	}

	/**
	 * Returns an empty (disabled) URL object.
	 *
	 * @returns {{ text: string, href: string, target: string, enabled: boolean }}
	 */
	getEmptyUrl(): Object
	{
		return {
			text: '',
			href: '',
			target: '',
			enabled: false,
		};
	}

	getValue()
	{
		var classList = this.classList;

		if (this.selector)
		{
			var selectorClassname = this.selector.split("@")[0].replace(".", "");
			classList = Runtime.clone(this.classList).concat([selectorClassname]);
			classList = BX.Landing.Utils.arrayUnique(classList);
		}

		return {
			type: "icon",
			src: "",
			id: -1,
			alt: "",
			classList: classList,
			url: Object.assign({}, this.url.getValue(), {enabled: true}),
		};
	}

	reset()
	{
		this.setValue({
			type: "icon",
			src: "",
			id: -1,
			alt: "",
			classList: [],
			url: '',
		});
	}
}