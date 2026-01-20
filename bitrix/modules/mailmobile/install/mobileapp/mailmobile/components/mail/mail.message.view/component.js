(() => {
	const { getChainPromise } = jn.require('mail/message/tools/connector');
	const { MessageChain } = jn.require('mail/chain');
	const { MailDialog } = jn.require('mail/dialog');

	layout.setTitle({ text: BX.message('MESSAGE_VIEW_TITLE') });

	const id = BX.componentParameters.get('threadId', null);
	const isCrmMessage = Number(BX.componentParameters.get('isCrmMessage', 1));
	const startEmailSender = BX.componentParameters.get('startEmailSender', null);

	getChainPromise(id, isCrmMessage).then((response) => {
		if ((response?.data?.list?.length ?? 0) === 0)
		{
			MailDialog.show({
				type: MailDialog.MAIL_TYPE_LOST_MESSAGE_TYPE,
				needsToCloseLayout: false,
				layoutWidget: this.layout,
			});
		}
		else
		{
			BX.onViewLoaded(() => {
				const messageChainParams = {
					isCrmMessage,
					threadId: id,
					chain: response.data,
					widget: this.layout,
				};

				if (startEmailSender)
				{
					messageChainParams.startEmailSender = startEmailSender;
				}

				layout.showComponent(new MessageChain(messageChainParams));
			});
		}
	});
})();
