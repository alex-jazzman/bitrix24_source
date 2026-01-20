;(function() {
	"use strict";

	BX.namespace("BX.Landing.UI.Button");


	/**
	 * Implements interface for works with color picker button
	 *
	 * @extends {BX.Landing.UI.Button.EditorAction}
	 *
	 * @param {string} id - Action id
	 * @param {?object} [options]
	 *
	 * @constructor
	 */
	BX.Landing.UI.Button.ColorAction = function(id, options)
	{
		BX.Landing.UI.Button.EditorAction.apply(this, arguments);
		this.id = id;
		this.options = options;

		this.colorField = new BX.Landing.UI.Field.ColorField({
			subtype: 'color',
		});

		this.loader = new BX.Loader({
			target: this.layout,
			size: 30,
		});
		const loaderNode = this.loader.layout;
		if (loaderNode)
		{
			BX.Dom.style(loaderNode, 'width', '28px');
			BX.Dom.style(loaderNode, 'height', '42px');
		}

		BX.Landing.UI.Button.ColorAction.instances.push(this);
	};

	BX.Landing.UI.Button.ColorAction.instances = [];

	BX.Landing.UI.Button.ColorAction.hideAll = function() {};

	BX.Landing.UI.Button.ColorAction.prototype = {
		constructor: BX.Landing.UI.Button.ColorAction,
		__proto__: BX.Landing.UI.Button.EditorAction.prototype,


		/**
		 * Handles event on this button click
		 * @param {MouseEvent} event
		 */
		onClick: function(event)
		{
			event.preventDefault();
			event.stopPropagation();

			BX.Dom.addClass(this.layout, '--wait');
			this.loader.show();

			let contentRoot = null;
			const currentElement = BX.Landing.UI.Panel.EditorPanel.getInstance().currentElement;
			if (BX.Landing.PageObject.getRootWindow().document === currentElement.ownerDocument)
			{
				contentRoot = BX.Landing.UI.Panel.EditorPanel.getInstance().layout.ownerDocument.body;
			}
			else
			{
				contentRoot = BX.Landing.PageObject.getEditorWindow();
			}
			this.colorField.createPopup({
				bindElement: BX.Landing.UI.Panel.EditorPanel.getInstance().layout,
				contentRoot,
				isNeedCalcPopupOffset: false,
				analytics: this.getAnalyticsParams(),
			});
			this.colorField.colorPopup.subscribe('onPopupShow', (e) => {
				this.onPopupShow(e.data);
			});
			this.colorField.colorPopup.subscribe('onPopupClose', (e) => {
				this.onPopupClose(e.data);
			});
			this.colorField.colorPopup.subscribe('onHexColorPopupChange', (e) => {
				this.onColorSelected(e.data);
			});

			const selection = this.contextDocument.getSelection();
			if (selection.rangeCount > 0)
			{
				this.savedRange = selection.getRangeAt(0).cloneRange();
			}

			this.colorField.colorPopup.onPopupOpenClick(event, this.layout);
		},


		/**
		 * Handles event on color selected
		 * @param {string} color - Selected color
		 */
		onColorSelected: function(color)
		{
			if (this.savedRange)
			{
				const selection = this.contextDocument.getSelection();
				selection.removeAllRanges();
				selection.addRange(this.savedRange);
			}

			this.contextDocument.execCommand(this.id, false, color);

			const selection = this.contextDocument.getSelection();
			if (selection.rangeCount > 0)
			{
				this.savedRange = selection.getRangeAt(0).cloneRange();
			}
		},

		onPopupShow: function()
		{
			this.loader.hide();
			BX.Dom.removeClass(this.layout, '--wait');

			setTimeout(() => {
				BX.Landing.UI.Panel.EditorPanel.getInstance().resetPlacementType();
				BX.Landing.UI.Panel.EditorPanel.getInstance().enableSimpleScrollMode();
			}, 100);
		},

		onPopupClose: function()
		{
			BX.Landing.UI.Panel.EditorPanel.getInstance().disableSimpleScrollMode();
		},

		/**
		 * @param Document document
		 */
		setContextDocument: function(contextDocument)
		{
			BX.Landing.UI.Button.EditorAction.prototype.setContextDocument.apply(this, arguments);
		},

		getAnalyticsParams: function()
		{
			let cSubSection = null;
			if (this.id === 'foreColor')
			{
				cSubSection = 'text';
			}

			if (this.id === 'hiliteColor')
			{
				cSubSection = 'backdrop';
			}

			return {
				category: 'inline_editor',
				c_sub_section: cSubSection,
			};
		},
	};
})();