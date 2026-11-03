import { Tag, Uri } from 'main.core';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';

type PublicationOptions = {
	siteId: number,
	landingId: number,
	url: string
};

type AjaxResult = {
	type: string,
	result: any
};

/**
example:
var instance = new BX.Landing.Dialog.Publication.getInstance({
	landingId: this.id,
	siteId: this.siteId,
	url: this.url
});
instance.publication(
	(mode !== 'landing') ? 'site' : 'landing'
);
*/

export class Publication
{
	static instance: ?Publication = null;
	dialog: ?MessageBox = null;
	siteId: number;
	landingId: number;
	url: string;

	constructor(options: PublicationOptions)
	{
		this.siteId = options.siteId;
		this.landingId = options.landingId;
		this.url = options.url;
	}

	static getInstance(options: PublicationOptions): Publication
	{
		if (!Publication.instance)
		{
			Publication.instance = new Publication(options);
		}
		return Publication.instance;
	}

	publication(mode: string)
	{
		const action = (mode === 'site') ? 'Site::publication' : 'Landing::publication';
		const data = {
			data: (mode === 'site')
			? {
				id: this.siteId
			}
			: {
				lid: this.landingId
			},
			actionType: 'rest',
			sessid: BX.message('bitrix_sessid')
		};

		this.renderPopup();

		BX.ajax({
			url: Uri.addParam(window.location.href, {action}),
			data,
			dataType: 'json',
			method: 'POST',
			onsuccess: (result: AjaxResult) => {
				if (result.type === 'error')
				{
					console.log(result.result);
					this.renderErrorPopupContent(result.result[0].error_description);
				}
				else
				{
					this.renderSuccessPopupContent();
				}
			}
		});
	}

	renderPopup()
	{
		if (!this.dialog)
		{
			this.dialog = new MessageBox({
				title: 'Publication',
				message: '',
				useAirDesign: true,
				buttons: MessageBoxButtons.OK,
				onOk: () => this.dialog.close(),
				popupOptions: {
					closeByEsc: true,
					minHeight: false,
					minWidth: 260,
					maxWidth: 300,
					width: false,
					animation: 'fading-slide',
				},
			});
		}

		this.renderWaitPopupContent();
		this.dialog.show();
	}

	renderContent(status: HTMLElement)
	{
		this.dialog.setMessage(Tag.render`
			<div class="ui-publication" style="padding: 0 25px;">
				<div>Publication dialog</div>
				<div>URL: <a href="${this.url}" target="_blank">${this.url}</a></div>
				${status}
			</div>
		`);
	}

	renderWaitPopupContent()
	{
		this.renderContent(Tag.render`
			<span class="ui-publication-name">Please wait...</span>
		`);
	}

	renderSuccessPopupContent()
	{
		this.renderContent(Tag.render`
			<span class="ui-publication-name">SUCCESS!</span>
		`);
	}

	renderErrorPopupContent(error: string)
	{
		this.renderContent(Tag.render`
			<span class="ui-publication-name">ERROR! ${error}</span>
		`);
	}
}