/**
 * @module tasks/layout/fields/result-v2/list/src/list-item-content
 */
jn.define('tasks/layout/fields/result-v2/list/src/list-item-content', (require, exports, module) => {
	const { Color, Indent } = require('tokens');
	const { PureComponent } = require('layout/pure-component');
	const { Avatar } = require('ui-system/blocks/avatar');
	const { connect } = require('statemanager/redux/connect');
	const { Text4, Text5 } = require('ui-system/typography/text');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { FriendlyDate } = require('layout/ui/friendly-date');
	const { FormatterTypes } = require('layout/ui/friendly-date/formatter-factory');
	const { BBCodeParser } = require('bbcode/parser');
	const { PropTypes } = require('utils/validation');
	const { selectResultById } = require('tasks/statemanager/redux/slices/tasks-results-v2');

	class ListItemContent extends PureComponent
	{
		get #result()
		{
			return this.props.result;
		}

		get #testId()
		{
			return `TASK_RESULT_LIST_ITEM_${this.#result.id}`;
		}

		render()
		{
			if (!this.#result)
			{
				return View({ style: { display: 'none' } });
			}

			return View(
				{
					style: {
						flexDirection: 'row',
						paddingLeft: Indent.XL3.toNumber(),
						paddingTop: Indent.XL2.toNumber(),
						backgroundColor: Color.bgContentPrimary.withPressed(),
					},
					testId: this.#testId,
				},
				this.#renderCreator(),
				View(
					{
						style: {
							flex: 1,
							marginLeft: Indent.XL.toNumber(),
							paddingRight: Indent.XL3.toNumber(),
							paddingBottom: Indent.XL2.toNumber(),
							borderBottomWidth: (this.props.showBorder ? 1 : 0),
							borderBottomColor: Color.bgSeparatorSecondary.toHex(),
						},
					},
					this.#renderText(),
					View(
						{
							style: {
								flexDirection: 'row',
								height: 20,
								alignItems: 'center',
								marginTop: Indent.XS2.toNumber(),
							},
						},
						this.#renderDate(),
						this.#renderFiles(),
					),
				),
			);
		}

		#renderCreator()
		{
			return Avatar({
				id: this.#result.authorId,
				size: 32,
				testId: `${this.#testId}_CREATOR`,
				withRedux: true,
			});
		}

		#renderText()
		{
			return Text4({
				color: Color.base1,
				text: new BBCodeParser().parse(this.#result.text).toPlainText(),
				numberOfLines: 2,
				ellipsize: 'end',
				testId: `${this.#testId}_TEXT`,
			});
		}

		#renderDate()
		{
			return new FriendlyDate({
				style: {
					color: Color.base3.toHex(),
				},
				formatType: FormatterTypes.HUMAN_DATE,
				timeSeparator: '',
				showTime: true,
				useTimeAgo: true,
				timestamp: this.#result.createdAtTs,
				testId: `${this.#testId}_DATE`,
			});
		}

		#renderFiles()
		{
			if (!this.#result.files || this.#result.files.length === 0)
			{
				return null;
			}

			return View(
				{
					style: {
						flexDirection: 'row',
						marginLeft: Indent.M.toNumber(),
					},
				},
				IconView({
					color: Color.base3,
					iconSize: {
						width: 20,
						height: 20,
					},
					icon: Icon.ATTACH,
				}),
				Text5({
					color: Color.base3,
					text: this.#result.files.length.toString(),
					testId: `${this.#testId}_FILES`,
				}),
			);
		}
	}

	ListItemContent.defaultProps = {
		showBorder: true,
	};

	ListItemContent.propTypes = {
		id: PropTypes.number.isRequired,
		result: PropTypes.object.isRequired,
		showBorder: PropTypes.bool,
	};

	const mapStateToProps = (state, ownProps) => {
		const resultId = ownProps.id;
		const result = selectResultById(state, resultId);

		if (!result)
		{
			return { result };
		}

		const {
			id,
			authorId,
			createdAtTs,
			status,
			text,
			files,
		} = result;

		return {
			result: {
				id,
				authorId,
				createdAtTs,
				status,
				text,
				files,
			},
		};
	};

	module.exports = {
		ListItemContent: connect(mapStateToProps)(ListItemContent),
	};
});
