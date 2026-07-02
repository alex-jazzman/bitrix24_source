/**
 * @module mail/mailbox/folders-settings/src/folders-assignments
 */
jn.define('mail/mailbox/folders-settings/src/folders-assignments', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');
	const { Loc } = require('loc');
	const { Color, Indent } = require('tokens');
	const { ChipButton, ChipButtonDesign, ChipButtonMode, ChipButtonSize } = require('ui-system/blocks/chips/chip-button');
	const { Text4 } = require('ui-system/typography/text');

	class FoldersAssignments extends PureComponent
	{
		render()
		{
			return View(
				{
					testId: 'mailbox-folders-settings-assign-list',
				},
				this.renderAssignmentRow({
					testId: 'mailbox-folders-settings-outcome',
					text: Loc.getMessage('MAILBOX_FOLDERS_SETTINGS_ASSIGN_OUTCOME'),
					value: this.props.outcomeLabel,
					onClick: this.props.onOutcomePress,
				}),
				View(
					{
						style: {
							marginTop: Indent.XL2.toNumber(),
						},
					},
					this.renderAssignmentRow({
						testId: 'mailbox-folders-settings-trash',
						text: Loc.getMessage('MAILBOX_FOLDERS_SETTINGS_ASSIGN_TRASH'),
						value: this.props.trashLabel,
						onClick: this.props.onTrashPress,
					}),
				),
				View(
					{
						style: {
							marginTop: Indent.XL2.toNumber(),
						},
					},
					this.renderAssignmentRow({
						testId: 'mailbox-folders-settings-spam',
						text: Loc.getMessage('MAILBOX_FOLDERS_SETTINGS_ASSIGN_SPAM'),
						value: this.props.spamLabel,
						onClick: this.props.onSpamPress,
					}),
				),
			);
		}

		renderAssignmentRow({ testId, text, value, onClick })
		{
			return View(
				{
					testId,
					style: {
						flexDirection: 'row',
						flexWrap: 'wrap',
						alignItems: 'center',
					},
				},
				Text4({
					testId: `${testId}-text`,
					text,
					color: Color.base1,
				}),
				View(
					{
						style: {
							marginLeft: Indent.XS.toNumber(),
							marginTop: Indent.XS2.toNumber(),
						},
					},
					this.renderChipSelector({
						testId: `${testId}-chip`,
						text: value,
						onClick,
					}),
				),
			);
		}

		renderChipSelector({ testId, text, onClick })
		{
			return ChipButton({
				testId,
				text,
				mode: ChipButtonMode.OUTLINE,
				design: ChipButtonDesign.PRIMARY,
				size: ChipButtonSize.S,
				dropdown: true,
				onClick,
			});
		}
	}

	module.exports = { FoldersAssignments };
});
