(() => {
	const { mailsAddedFromServer } = jn.require('mail/statemanager/redux/slices/messages');
	const { foldersAdded } = jn.require('mail/statemanager/redux/slices/folders');
	const { getChainPromise } = jn.require('mail/message/tools/connector');
	const { MessageChain } = jn.require('mail/chain');
	const { MailDialog } = jn.require('mail/dialog');

	const store = jn.require('statemanager/redux/store');
	const { AnalyticsEvent } = jn.require('analytics');
	const { dispatch } = store;

	layout.setTitle({ text: BX.message('MESSAGE_VIEW_TITLE') });

	const id = BX.componentParameters.get('threadId', null);
	const isCrmMessage = Number(BX.componentParameters.get('isCrmMessage', 1));
	const folder = String(BX.componentParameters.get('folder', 'default'));
	const source = String(BX.componentParameters.get('source', 'mail'));
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
					source: isCrmMessage ? 'crm' : source,
				};

				dispatch(mailsAddedFromServer(response.data.list));
				if (!isCrmMessage)
				{
					dispatch(foldersAdded(response.data.properties.dirs));
				}

				if (startEmailSender)
				{
					messageChainParams.startEmailSender = startEmailSender;
				}

				new AnalyticsEvent({
					tool: 'mail',
					category: 'mail_general_ops',
					event: 'mail_view',
					c_section: isCrmMessage ? 'crm' : source,
					c_sub_section: folder,
				}).send();

				layout.showComponent(new MessageChain(messageChainParams));
			});
		}
	}).catch(() => {
		MailDialog.show({
			type: MailDialog.MAIL_TYPE_LOST_MESSAGE_TYPE,
			needsToCloseLayout: false,
			layoutWidget: this.layout,
		});
	});
})();
