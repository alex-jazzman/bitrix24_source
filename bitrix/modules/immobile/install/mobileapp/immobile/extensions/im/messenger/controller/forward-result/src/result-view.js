/**
 * @module im/messenger/controller/forward-result/src/result-view
 */
jn.define('im/messenger/controller/forward-result/src/result-view', (require, exports, module) => {
	const { Color, Component, Indent } = require('tokens');
	const { Box } = require('ui-system/layout/box');
	const { BoxFooter } = require('ui-system/layout/dialog-footer');
	const { AreaList } = require('ui-system/layout/area-list');
	const { Area } = require('ui-system/layout/area');
	const { Text3, Text5 } = require('ui-system/typography/text');
	const { Button, ButtonSize } = require('ui-system/form/buttons/button');
	const { Loc } = require('im/messenger/loc');

	const TEST_ID = 'forward-result';
	const phraseByReason = {
		notWritable: 'IMMOBILE_MESSENGER_FORWARD_RESULT_REASON_NOT_WRITABLE',
		chatUnavailable: 'IMMOBILE_MESSENGER_FORWARD_RESULT_REASON_CHAT_UNAVAILABLE',
		fileUnavailable: 'IMMOBILE_MESSENGER_FORWARD_RESULT_REASON_FILE_UNAVAILABLE',
		storageFull: 'IMMOBILE_MESSENGER_FORWARD_RESULT_REASON_STORAGE_FULL',
		retryable: 'IMMOBILE_MESSENGER_FORWARD_RESULT_REASON_RETRYABLE',
	};

	const hasRetryableResult = (result) => result.failedRecipients.some(({ retryable }) => retryable);
	const getReasonText = (reason) => Loc.getMessage(
		phraseByReason[reason] ?? 'IMMOBILE_MESSENGER_FORWARD_RESULT_REASON_RETRYABLE',
	);
	const getResultRows = (result) => {
		if (result.failedRecipients.length === 0)
		{
			return [{
				title: Loc.getMessage('IMMOBILE_MESSENGER_FORWARD_RESULT_SUCCESS'),
				reason: null,
			}];
		}

		const reasons = new Set(result.failedRecipients.map(({ reason }) => reason));
		if (result.succeededRecipients === 0 && reasons.size === 1)
		{
			return [{
				title: Loc.getMessage('IMMOBILE_MESSENGER_FORWARD_RESULT_NOT_SENT'),
				reason: result.failedRecipients[0].reason,
			}];
		}

		return result.failedRecipients.map(({ recipient, reason }) => ({
			title: recipient.title ?? String(recipient.id),
			reason,
		}));
	};

	class ForwardResultView extends LayoutComponent
	{
		/**
		 * @param {ForwardResultViewProps} props
		 */
		constructor(props)
		{
			super(props);
			this.state = {
				result: props.result,
				isRetrying: false,
			};
			this.isDisposed = false;
		}

		updateResult(result)
		{
			if (this.isDisposed)
			{
				return;
			}

			this.setState({ result, isRetrying: false });
		}

		dispose()
		{
			this.isDisposed = true;
		}

		render()
		{
			return Box(
				{
					testId: TEST_ID,
					safeArea: { bottom: true },
					backgroundColor: Color.bgContentPrimary,
					footer: this.#renderRetryButton(),
				},
				AreaList(
					{ testId: `${TEST_ID}-list` },
					...this.#getRows().map((row, index) => this.#renderRow(row, index)),
				),
			);
		}

		#getRows()
		{
			return getResultRows(this.state.result);
		}

		#renderRetryButton()
		{
			if (!hasRetryableResult(this.state.result))
			{
				return null;
			}

			return BoxFooter(
				{
					safeArea: true,
					testId: `${TEST_ID}-footer`,
				},
				Button({
					testId: `${TEST_ID}-retry`,
					text: Loc.getMessage('IMMOBILE_MESSENGER_FORWARD_RESULT_RETRY_BUTTON'),
					stretched: true,
					size: ButtonSize.L,
					loading: this.state.isRetrying,
					disabled: this.state.isRetrying,
					style: { marginVertical: Indent.L.toNumber() },
					onClick: () => this.#retry(),
				}),
			);
		}

		async #retry()
		{
			if (this.state.isRetrying || !this.props.onRetry)
			{
				return;
			}

			this.setState({ isRetrying: true });
			try
			{
				const result = await this.props.onRetry();
				if (result)
				{
					this.updateResult(result);
				}
				else if (!this.isDisposed)
				{
					this.setState({ isRetrying: false });
				}
			}
			catch (error)
			{
				if (!this.isDisposed)
				{
					this.setState({ isRetrying: false });
				}
			}
		}

		#renderRow(row, index)
		{
			const rowTestId = `${TEST_ID}-row-${index}`;
			const reasonText = row.reason ? getReasonText(row.reason) : null;
			const rowContent = [
				Text3({
					testId: `${rowTestId}-title`,
					text: row.title,
					color: Color.base1,
					accent: true,
				}),
			];
			if (reasonText)
			{
				rowContent.push(Text5({
					testId: `${rowTestId}-reason`,
					text: reasonText,
					color: Color.base3,
					style: { marginTop: Indent.XS.toNumber() },
				}));
			}

			return Area(
				{ testId: rowTestId },
				View(
					{
						accessible: true,
						accessibilityLabel: reasonText ? `${row.title}, ${reasonText}` : row.title,
						style: {
							paddingHorizontal: Component.paddingLr.toNumber(),
							paddingVertical: Indent.L.toNumber(),
						},
					},
					...rowContent,
				),
			);
		}
	}

	module.exports = { ForwardResultView, getResultRows, getReasonText, hasRetryableResult };
});
