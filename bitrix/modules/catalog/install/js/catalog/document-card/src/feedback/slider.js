import {Type, Uri} from "main.core";

export default class Slider
{
	static openFeedbackForm()
	{
		BX.UI.Feedback.Form.open(Slider.getFeedbackParams());
	}

	static openIntegrationRequestForm(event, params={})
	{
		if (event && Type.isFunction(event.preventDefault))
		{
			event.preventDefault();
		}

		if(!Type.isPlainObject(params))
		{
			params = {};
		}

		let url = (new Uri('/bitrix/components/bitrix/catalog.feedback/slider.php'));

		url.setQueryParams({feedback_type: 'integration_request'});
		url.setQueryParams(params);

		return Slider.open(url.toString(), {width: 735});
	}

	static open(url, options)
	{
		if(!Type.isPlainObject(options))
		{
			options = {};
		}
		options = {...{cacheable: false, allowChangeHistory: false, events: {}}, ...options};
		return new Promise((resolve) =>
		{
			if(Type.isString(url) && url.length > 1)
			{
				options.events.onClose = function(event)
				{
					resolve(event.getSlider());
				};
				BX.SidePanel.Instance.open(url, options);
			}
			else
			{
				resolve();
			}
		});
	}

	static getFeedbackParams(): Object
	{
		return {
			id: `catalog-feedback-${parseInt(Math.random() * 1000, 10)}`,
			forms: [
				{ id: 384, lang: 'ru', sec: '0pskpd', zones: ['ru', 'by', 'kz'] },
				{ id: 392, lang: 'en', sec: 'siqjqa', zones: ['en', 'ua'] },
				{ id: 388, lang: 'es', sec: '53t2bu', zones: ['es'] },
				{ id: 390, lang: 'de', sec: 'mhglfc', zones: ['de'] },
				{ id: 386, lang: 'com.br', sec: 't6tdpy', zones: ['com.br'] },
			],
		};
	}
}
