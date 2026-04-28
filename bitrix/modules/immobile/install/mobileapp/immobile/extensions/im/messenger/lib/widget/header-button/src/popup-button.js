/**
 * @module im/messenger/lib/widget/header-button/popup-button
 */
jn.define('im/messenger/lib/widget/header-button/popup-button', (require, exports, module) => {
	const { Type } = require('type');

	/**
	 * @class PopupButton
	 */
	class PopupButton
	{
		/**
		 * @param {HeaderPopupButtonConfig} options
		 * @return {PopupButton}
		 */
		static create(options)
		{
			return new this(options);
		}

		/**
		 * @param {HeaderPopupButtonConfig} options
		 */
		constructor(options)
		{
			this.id = options.id;
			this.title = options.title;
			this.getTitle = options.getTitle;
			this.callback = options.callback;
			this.sectionCode = Type.isStringFilled(options.sectionCode) ? options.sectionCode : 'general';
			this.checked = options.checked ?? false;
			this.iconName = Type.isStringFilled(options.iconName) ? options.iconName : '';
			this.shouldShow = Type.isFunction(options.shouldShow) ? options.shouldShow : async () => true;
		}

		toPopupMenuButton()
		{
			return {
				id: this.id,
				title: Type.isFunction(this.getTitle) ? this.getTitle() : this.title,
				iconName: this.iconName,
				sectionCode: this.sectionCode,
				checked: Type.isFunction(this.checked) ? this.checked() : this.checked,
				callback: this.callback,
			};
		}
	}

	module.exports = { PopupButton };
});
