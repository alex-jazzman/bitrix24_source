(function() {
	'use strict';

	BX.namespace('BX.Landing.UI.Button');

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
	BX.Landing.UI.Button.TableColorAction = function(id, options, textNode)
	{
		BX.Landing.UI.Button.EditorAction.apply(this, arguments);
		this.id = id;
		this.options = options;
		this.textNode = textNode;
		if (this.id !== 'tableBgColor')
		{
			BX.Dom.addClass(this.layout, 'landing-ui-button-editor-action-color');
		}

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

		BX.Landing.UI.Button.TableColorAction.instances.push(this);
	};

	BX.Landing.UI.Button.TableColorAction.instances = [];

	BX.Landing.UI.Button.TableColorAction.prototype = {
		constructor: BX.Landing.UI.Button.TableColorAction,
		__proto__: BX.Landing.UI.Button.EditorAction.prototype,

		/**
		 * Handles event on this button click
		 * @param {MouseEvent} event
		 */
		onClick(event)
		{
			event.preventDefault();
			event.stopPropagation();

			BX.Dom.addClass(this.layout, '--wait');
			this.loader.show();

			const editorPanelInstance = BX.Landing.UI.Panel.EditorPanel.getInstance();
			let contentRoot = null;
			const currentElement = editorPanelInstance.currentElement;
			if (BX.Landing.PageObject.getRootWindow().document === currentElement.ownerDocument)
			{
				contentRoot = editorPanelInstance.layout.ownerDocument.body;
			}
			else
			{
				contentRoot = BX.Landing.PageObject.getEditorWindow();
			}
			this.colorField.createPopup({
				bindElement: editorPanelInstance.layout,
				contentRoot,
				isNeedCalcPopupOffset: false,
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
			editorPanelInstance.subscribe('onButtonClick', (e) => {
				this.colorField.colorPopup.getPopup().close();
			});
			BX.addCustomEvent('BX.Landing.Editor:disable', () => {
				this.colorField.colorPopup.getPopup().close();
			});

			this.colorField.colorPopup.onPopupOpenClick(event, this.layout);
		},

		/**
		 * Handles event on color selected
		 * @param {string} color - Selected color
		 */
		onColorSelected(color)
		{
			if (this.id === 'tableTextColor')
			{
				this.applyColorInTableCells(color);
			}

			if (this.id === 'tableBgColor')
			{
				this.applyBgInTableCells(color);
			}
		},

		onPopupShow()
		{
			this.loader.hide();
			BX.Dom.removeClass(this.layout, '--wait');

			setTimeout(() => {
				BX.Landing.UI.Panel.EditorPanel.getInstance().resetPlacementType();
				BX.Landing.UI.Panel.EditorPanel.getInstance().enableSimpleScrollMode();
			}, 100);
		},

		onPopupClose()
		{
			BX.Landing.UI.Panel.EditorPanel.getInstance().disableSimpleScrollMode();
		},

		/**
		 * Apply selected color to text in table cells
		 * @param {string} color - Selected color
		 */
		applyColorInTableCells(color)
		{
			const setTd = [...this.options.setTd];
			setTd.forEach((td) => {
				if (td.nodeType === 1)
				{
					BX.Dom.style(td, 'color', color);
				}
			});
			if (this.options.target === 'table')
			{
				this.options.table.setAttribute('text-color', color);
			}
		},

		/**
		 * Apply selected text color when changed table style
		 * @param {string} color - Needed color for dark or light table style
		 * @param {object} options - All options
		 */
		prepareOptionsForApplyColorInTableCells(color, options)
		{
			this.options = options;
			this.applyColorInTableCells(color);
		},

		/**
		 * Apply selected background color to table cells
		 * @param {string} color - Selected color
		 */
		applyBgInTableCells(color)
		{
			const setTd = [...this.options.setTd];
			setTd.forEach((td) => {
				if (
					td.nodeType === 1
					&& !BX.Dom.hasClass(td, 'landing-table-col-dnd')
					&& !BX.Dom.hasClass(td, 'landing-table-row-dnd')
					&& !BX.Dom.hasClass(td, 'landing-table-th-select-all')
				)
				{
					BX.Dom.style(td, 'background-color', color);
				}
			});
			if (this.options.target === 'table')
			{
				this.options.table.setAttribute('bg-color', color);
			}
		},

		/**
		 * @param contextDocument document
		 */
		setContextDocument(contextDocument)
		{
			BX.Landing.UI.Button.EditorAction.prototype.setContextDocument.apply(this, arguments);
		},
	};
})();
