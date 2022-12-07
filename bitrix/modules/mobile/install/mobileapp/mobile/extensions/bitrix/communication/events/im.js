/**
 * @module communication/events/im
 */
jn.define('communication/events/im', (require, exports, module) => {

	const { BaseEvent } = require('communication/events/base');
	const { isEmpty, has } = require('utils/object');

	const DialogOpener = () => {
		try
		{
			const { DialogOpener } = require('im/messenger/api/dialog-opener');

			return DialogOpener;
		}
		catch (e)
		{
			console.log(e, 'DialogOpener not found');

			return null;
		}
	};

	const IM_EVENTS = {
		openLine: 'OPENLINE',
	};

	class ImEvent extends BaseEvent
	{
		prepareValue(value)
		{
			if (isEmpty(value))
			{
				return null;
			}

			if (!has(value, ['params', 'titleParams']))
			{
				return value;
			}

			const { params: { titleParams, ...restParams } } = value;

			return {
				...value,
				params: {
					...restParams,
					dialogTitleParams: titleParams,
				},
			};
		}

		open()
		{
			const { event, params, callback } = this.getValue();

			if (!event || isEmpty(params))
			{
				return;
			}

			switch (event.toUpperCase())
			{
				case IM_EVENTS.openLine:

					if (typeof params.value === 'string')
					{
						params.userCode = params.value;
					}
					this.showOpenLine(params, callback);

					break;
				default:
					Application.openUrl(params.value);
					break;
			}
		}

		showOpenLine(params, callback)
		{
			const imOpener = DialogOpener();
			if (this.isApiVersionGreaterThan45 && imOpener)
			{
				imOpener
					.openLine(params)
					.then(() => {
						if (callback)
						{
							callback();
						}
					})
					.catch(console.error);
			}
			else
			{
				BX.postComponentEvent(
					'ImMobile.Messenger.Openlines:open',
					[{ userCode: params.userCode }],
					'im.messenger',
				);
			}
		}
	}

	module.exports = { ImEvent };

})
;