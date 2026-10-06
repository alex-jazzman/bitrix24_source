BX.ready(
	function () {
		BX.namespace('BX.rest.integration');
		if (BX.rest.integration.grid)
		{
			return;
		}

		var Grid = function () {};

		Grid.prototype =
		{
			init: function (options) {
				this.gridId = options.gridId;
				// todo delete this hack
				// it is here to prevent grid's title changing after filter apply
				if(window !== window.top && BX.type.isFunction(top.BX.ajax.UpdatePageData))
				{
					top.BX.ajax.UpdatePageData = (function() {});
				}
			},
			reloadData: function () {
				if (restIntegrationGridComponent.gridId.length > 0)
				{
					var reloadParams = {apply_filter: 'Y'};
					var gridObject = BX.Main.gridManager.getById(restIntegrationGridComponent.gridId);
					if (gridObject.hasOwnProperty('instance'))
					{
						gridObject.instance.reloadTable('POST', reloadParams);
					}
				}
			},
			delete: function (id, code) {
				var messageBox = BX.UI.Dialogs.MessageBox.create({
					message: BX.message('REST_INTEGRATION_GRID_CONFIRM_DELETE_POPUP_TEXT'),
					title: BX.message('REST_INTEGRATION_GRID_CONFIRM_DELETE_POPUP_TITLE'),
					okCaption: BX.message('REST_INTEGRATION_GRID_CONFIRM_DELETE_POPUP_OK_BUTTON_TEXT'),
					buttons: BX.UI.Dialogs.MessageBoxButtons.OK_CANCEL,
					onOk: function(messageBox) {
						return BX.ajax.runComponentAction(
							'bitrix:rest.integration.grid',
							'delete',
							{
								mode: 'class',
								signedParameters: restIntegrationGridComponent.signetParameters,
								data:
									{
										id: id
									},
								analyticsLabel:
									{
										type: 'integrationDelete',
										integrationCode: code
									}
							}
						).then(
							function (response)
							{
								messageBox.close();
								if (!!response.data && !!response.data.result)
								{
									if (response.data.result === 'success')
									{
										BX.rest.integration.grid.reloadData();
									}
									else if (!!response.data.errors)
									{
										var key;
										for(key in response.data.errors)
										{
											BX.UI.Notification.Center.notify(
												{
													content: response.data.errors[key]
												}
											);
										}
									}
								}
							}
						);
					},
				});
				messageBox.getOkButton().setColor(BX.UI.Button.Color.DANGER);
				messageBox.getOkButton().getContainer().setAttribute('data-test-id', 'rest-integration-grid-confirm-delete-ok');
				messageBox.getCancelButton().getContainer().setAttribute('data-test-id', 'rest-integration-grid-confirm-delete-cancel');
				messageBox.getPopupWindow().getPopupContainer().setAttribute('data-test-id', 'rest-integration-grid-confirm-delete-popup');
				messageBox.show();
			}
		};
		BX.rest.integration.grid = new Grid();

		try {
			const url = new URL(window.location.href);
			if (url.searchParams.has('by') || url.searchParams.has('order'))
			{
				url.searchParams.delete('by');
				url.searchParams.delete('order');
				window.history.replaceState({}, '', url.toString());
			}
		}
		catch (error)
		{
		}
	}
);
