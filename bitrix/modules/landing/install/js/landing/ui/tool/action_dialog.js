;(function() {
	"use strict";

	BX.namespace("BX.Landing.UI.Tool");


	function createPopup(options = {})
	{
		return new BX.UI.Dialogs.MessageBox({
			title: options.title || BX.Landing.Loc.getMessage("LANDING_ACTION_DIALOG_TITLE"),
			message: options.content || "",
			useAirDesign: true,
			modal: true,
			popupOptions: {
				autoHide: true,
				...options.popupOptions,
			},
		});
	}

	function createConfirmButton(text, callback, options = {})
	{
		return new BX.UI.Button({
			id: "action_dialog_confirm",
			props: {id: 'action_dialog_confirm'},
			text: text || BX.Landing.Loc.getMessage("LANDING_ACTION_DIALOG_CONFIRM_BUTTON"),
			events: {click: callback},
			useAirDesign: true,
			style: BX.UI.Button.AirStyle.FILLED,
			wide: options.wide === true,
		});
	}

	function createCancelButton(text, callback)
	{
		return new BX.UI.Button({
			id: "action_dialog_cancel",
			props: {id: 'action_dialog_cancel'},
			text: text || BX.Landing.Loc.getMessage("LANDING_ACTION_DIALOG_CANCEL_BUTTON"),
			events: {click: callback},
			useAirDesign: true,
			style: BX.UI.Button.AirStyle.OUTLINE,
		});
	}


	/**
	 * Implements interface of confirm / alert dialog
	 * @constructor
	 */
	BX.Landing.UI.Tool.ActionDialog = function() {
		this.popup = null;
	};


	/**
	 * Stores instance of BX.Landing.UI.Tool.ActionDialog
	 * @static
	 * @type {BX.Landing.UI.Tool.ActionDialog}
	 */
	BX.Landing.UI.Tool.ActionDialog.instance = null;


	/**
	 * Gets instance of BX.Landing.UI.Tool.ActionDialog
	 * @static
	 * @returns {BX.Landing.UI.Tool.ActionDialog}
	 */
	BX.Landing.UI.Tool.ActionDialog.getInstance = function()
	{
		if (!BX.Landing.UI.Tool.ActionDialog.instance)
		{
			BX.Landing.UI.Tool.ActionDialog.instance = new BX.Landing.UI.Tool.ActionDialog();
		}

		return BX.Landing.UI.Tool.ActionDialog.instance;
	};


	BX.Landing.UI.Tool.ActionDialog.prototype = {
		/**
		 * Shows dialog window
		 * @param {{
		 * 		[type]: ?string
		 * 		[title]: !string,
		 * 		[content]: !string,
		 * 		[confirm]: !string,
		 * 		[cancel]: !string
		 * }} [options]
		 * @returns {Promise}
		 */
		show: function(options)
		{
			options = typeof options === "object" ? options : {};
			options.title = options.title || BX.Landing.Loc.getMessage("LANDING_ACTION_DIALOG_TITLE");
			options.content = options.content || BX.Landing.Loc.getMessage("LANDING_ACTION_DIALOG_CONTENT");
			this.popup = createPopup(options);
			return new Promise(function(resolve, reject) {
				this.popup.setButtons([
					createConfirmButton(options.confirm, function() {
						resolve();
						this.close();
					}.bind(this), {
						wide: options.type === 'alert',
					}),
					options.type !== "alert" ?
						createCancelButton(options.cancel, function() {
							reject();
							this.close();
						}.bind(this)) :
						""
				]);
				this.popup.show();
			}.bind(this));
		},


		/**
		 * Closes dialog window
		 */
		close: function()
		{
			if (this.popup)
			{
				this.popup.close();
			}
		}

	};
})();