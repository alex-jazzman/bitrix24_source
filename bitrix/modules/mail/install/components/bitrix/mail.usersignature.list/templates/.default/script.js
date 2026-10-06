;(function ()
{
	BX.namespace('BX.Mail.UserSignature.List');

	BX.Mail.UserSignature.List = {
		gridId: 'mail-usersignature-grid'
	};

	BX.Mail.UserSignature.List.init = function()
	{
		BX.addCustomEvent('SidePanel.Slider:onMessage', function(message)
		{
			if(message.getEventId() === 'mail-add-signature')
			{
				var data = message.getData();
				var userSignatureId = data.userSignatureId;
				if(userSignatureId > 0)
				{
					var grid = BX.Main.gridManager.getById(BX.Mail.UserSignature.List.gridId);
					if(grid)
					{
						grid.instance.reloadTable('GET', {}, function()
						{
							BX.Mail.UserSignature.List.highlightRow(userSignatureId);
						});
					}
				}
			}
		});
	};

	BX.Mail.UserSignature.List.openUrl = function(url)
	{
		if(BX.SidePanel)
		{
			BX.SidePanel.Instance.open(url, {width: 760, cacheable: false});
		}
		else
		{
			location.href = viewUrl;
		}
	};

	BX.Mail.UserSignature.List.delete = function(signatureId)
	{
		if(confirm(BX.message('MAIL_SIGNATURE_DELETE_CONFIRM')))
		{
			BX.Mail.UserSignature.List.doDelete(signatureId);
		}
	};

	/**
	 * Deletes a shared signature. The action is available only to users who can manage shared
	 * signatures, and it warns about the mailboxes the signature is assigned to.
	 *
	 * @param {number|string} signatureId
	 * @param {number} assignedMailboxCount number of affected mailboxes
	 */
	BX.Mail.UserSignature.List.deleteShared = function(signatureId, assignedMailboxCount)
	{
		assignedMailboxCount = parseInt(assignedMailboxCount, 10) || 0;

		if (assignedMailboxCount < 1)
		{
			BX.Mail.UserSignature.List.doDelete(signatureId);

			return;
		}

		var messageBox = new BX.UI.Dialogs.MessageBox({
			title: BX.message('MAIL_SIGNATURE_DELETE_SHARED_CONFIRM_TITLE'),
			message: BX.message('MAIL_SIGNATURE_DELETE_SHARED_CONFIRM_ASSIGNED')
				.replace('#COUNT#', assignedMailboxCount),
			useAirDesign: true,
			modal: true,
			buttons: BX.UI.Dialogs.MessageBoxButtons.OK_CANCEL,
			okCaption: BX.message('MAIL_SIGNATURE_DELETE_SHARED_CONFIRM_OK'),
			onOk: function()
			{
				messageBox.close();
				BX.Mail.UserSignature.List.doDelete(signatureId);
			},
			onCancel: function()
			{
				messageBox.close();
			}
		});

		messageBox.show();
	};

	/**
	 * Deletes a row of the grid whatever its scope is. Every row is named by its identifier in the
	 * unified model, so both kinds go to the single endpoint over that model; it checks the right
	 * over the row itself, which for a personal signature means its owner alone.
	 *
	 * @param {number|string} signatureId
	 */
	BX.Mail.UserSignature.List.doDelete = function(signatureId)
	{
		BX.ajax.runAction('mail.api.signature.delete', {
			data: {
				id: signatureId
			}
		}).then(function()
		{
			BX.UI.Notification.Center.notify({
				content: BX.message('MAIL_SIGNATURE_DELETED_SUCCESS')
			});
			var grid = BX.Main.gridManager.getById(BX.Mail.UserSignature.List.gridId);
			if(grid)
			{
				grid.instance.reloadTable('GET');
			}
		}, function(response)
		{
			BX.Mail.UserSignature.List.showError(response.errors.pop().message);
		});
	};

	BX.Mail.UserSignature.List.showError = function(message)
	{
		var alert = new BX.UI.Alert({
			color: BX.UI.Alert.Color.DANGER,
			icon: BX.UI.Alert.Icon.DANGER,
			text: message
		});
		BX.adjust(BX('signature-alert-container'), {
			html: ''
		});
		BX.append(alert.getContainer(), BX('signature-alert-container'));
	};

	BX.Mail.UserSignature.List.highlightRow = function(userSignatureId)
	{
		var grid = BX.Main.gridManager.getById(BX.Mail.UserSignature.List.gridId);
		if(grid)
		{
			var newRow = grid.instance.getRows().getById(userSignatureId);
			if(newRow)
			{
				newRow.select();
			}
		}
	};

})();
