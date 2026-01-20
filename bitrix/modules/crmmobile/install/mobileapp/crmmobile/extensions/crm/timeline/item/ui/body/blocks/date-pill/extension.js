/**
 * @module crm/timeline/item/ui/body/blocks/date-pill
 */
jn.define('crm/timeline/item/ui/body/blocks/date-pill', (require, exports, module) => {
	const { TimelineItemBodyBlock } = require('crm/timeline/item/ui/body/blocks/base');
	const { DatePill } = require('layout/ui/date-pill');
	const { datetime } = require('utils/date/formats');
	const { Moment } = require('utils/date');

	/**
	 * @class TimelineItemBodyDatePill
	 */
	class TimelineItemBodyDatePill extends TimelineItemBodyBlock
	{
		render()
		{
			return new DatePill({
				...this.props,
				onClick: this.onClick.bind(this),
				ref: (ref) => {
					this.datePillRef = ref;
				},
			});
		}

		onClick()
		{
			if (!this.props.action)
			{
				return;
			}

			const { actionParams, type } = this.props.action;

			if (type === 'jsEvent')
			{
				this.emitAction(this.props.action);

				return;
			}

			this.openDatePicker(actionParams);
		}

		openDatePicker(actionParams)
		{
			dialogs.showDatePicker(
				{
					type: this.props.withTime ? 'datetime' : 'date',
					value: Moment.createFromTimestamp(this.props.value).date.getTime(),
				},
				(eventName, ms) => {
					if (!ms)
					{
						return;
					}

					const moment = new Moment(ms);

					this.datePillRef?.setState({ moment }, () => {
						this.emitAction({
							...this.props.action,
							actionParams: {
								...actionParams,
								value: moment.format(datetime()),
								valueTs: moment.timestamp,
							},
						});
					});
				},
			);
		}
	}

	module.exports = { TimelineItemBodyDatePill };
});
