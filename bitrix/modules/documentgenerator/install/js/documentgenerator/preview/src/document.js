import { ajax as Ajax, Loc, Type } from 'main.core';
import { PopupWindowButton } from 'main.popup';
import { openUrl, parseUrl, showMessage } from './helpers';

/**
 * @memberOf BX.Crm.DocumentGenerator
 */
export class Document
{
	static isProcessing = false;

	static askAboutUsingPreviousDocumentNumber(provider, templateId, value, onsuccess, ondecline): void
	{
		if (Type.isString(provider) && (parseInt(templateId, 10) > 0) && Type.isFunction(onsuccess))
		{
			if (Document.isProcessing === true)
			{
				return;
			}

			try
			{
				Document.isProcessing = true;
				Ajax.runAction('documentgenerator.api.document.list', {
					data: {
						select: ['id', 'number'],
						filter: {
							'=provider': provider.toLowerCase(),
							'=templateId': templateId,
							'=value': value,
						},
						order: { id: 'desc' },
					},
					navigation: {
						size: 1,
					},
				}).then((response) => {
					Document.isProcessing = false;
					if (response.data.documents.length > 0)
					{
						const previousNumber = response.data.documents[0].number;
						showMessage(Loc.getMessage('DOCGEN_PREVIEW_DO_USE_OLD_NUMBER'), [
							new PopupWindowButton({
								text: Loc.getMessage('DOCGEN_PREVIEW_NEW_BUTTON'),
								className: 'ui-btn ui-btn-md ui-btn-primary',
								events: {
									click() {
										onsuccess();
										this.popupWindow.destroy();
									},
								},
							}),
							new PopupWindowButton({
								text: Loc.getMessage('DOCGEN_PREVIEW_OLD_BUTTON'),
								className: 'ui-btn ui-btn-md ui-btn-primary',
								events: {
									click() {
										onsuccess(previousNumber);
										this.popupWindow.destroy();
									},
								},
							}),
						], Loc.getMessage('DOCGEN_PREVIEW_NUMBER_TITLE'), ondecline);
					}
					else
					{
						onsuccess();
					}
				}).catch(() => {
					Document.isProcessing = false;
					if (Type.isFunction(ondecline))
					{
						ondecline();
					}
				});
			}
			catch
			{
				Document.isProcessing = false;
				if (Type.isFunction(ondecline))
				{
					ondecline();
				}
			}
		}
	}

	static onBeforeCreate(viewUrl, params, loaderPath, moduleId): void
	{
		const urlParams = parseUrl(viewUrl, 'params');
		const provider = decodeURIComponent(urlParams.providerClassName).toLowerCase();
		const templateId = urlParams.templateId;
		const value = urlParams.value;
		const sliderWidth = Object.hasOwn(params, 'sliderWidth') ? params.sliderWidth : null;

		if (Object.hasOwn(urlParams, 'documentId'))
		{
			openUrl(viewUrl, loaderPath, sliderWidth);
		}
		else
		{
			Ajax.runAction('documentgenerator.api.dataprovider.isPrintable', {
				data: {
					provider,
					value,
					options: {},
					module: moduleId,
				},
			}).then(() => {
				if (Object.hasOwn(urlParams, 'documentId'))
				{
					openUrl(viewUrl, loaderPath, sliderWidth);
				}
				else
				{
					Document.askAboutUsingPreviousDocumentNumber(provider, templateId, value, (previousNumber) => {
						if (previousNumber)
						{
							viewUrl = BX.util.add_url_param(viewUrl, { number: previousNumber });
						}
						openUrl(viewUrl, loaderPath, sliderWidth);
					});
				}
			}).catch((reason) => {
				showMessage(
					reason.errors.map((error) => error.message).join('<br>'),
					[new PopupWindowButton({
						text: Loc.getMessage('DOCGEN_PREVIEW_CONTINUE_BUTTON'),
						className: 'ui-btn ui-btn-md ui-btn-success',
						events: { click(e) { this.popupWindow.close(); BX.PreventDefault(e); } },
					})],
					Loc.getMessage('DOCGEN_PREVIEW_PRINT_TITLE'),
				);
			});
		}
	}
}
