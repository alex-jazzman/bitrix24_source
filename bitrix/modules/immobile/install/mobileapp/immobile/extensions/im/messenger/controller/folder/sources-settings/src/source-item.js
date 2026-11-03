/**
 * @module im/messenger/controller/folder/sources-settings/source-item
 */
jn.define('im/messenger/controller/folder/sources-settings/source-item', (require, exports, module) => {
	const { Type } = require('type');
	const { Color, Indent } = require('tokens');
	const { IconView } = require('ui-system/blocks/icon');
	const { Switcher, SwitcherSize } = require('ui-system/blocks/switcher');
	const { Text3, Text5 } = require('ui-system/typography/text');
	const { Loc } = require('im/messenger/loc');
	const { FolderSourceIcon } = require('im/messenger/controller/folder/sources-settings/source-icon');

	const ICON_SIZE = 32;
	const TEST_ID_PREFIX = 'folder-sources-item';

	/**
	 * A row of the sources list: the glyph of the source, the title, the description the
	 * server sent for it, the note of a locked source and a switcher the draft owns. The
	 * whole row takes the tap: with `useState: false` the switcher stays unclickable and
	 * holds no state of its own.
	 *
	 * @extends {LayoutComponent<FolderSourceItemProps>}
	 */
	class FolderSourceItem extends LayoutComponent
	{
		render()
		{
			const { code, isLast } = this.props;

			return View(
				{
					testId: `${TEST_ID_PREFIX}-${code}`,
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						paddingLeft: Indent.XL3.toNumber(),
					},
					onClick: this.#handleClick,
				},
				this.#renderIcon(),
				// the separator starts where the text does and runs to the edge of the screen,
				// so it belongs to the part of the row that stands next to the glyph
				View(
					{
						style: {
							flex: 1,
							flexDirection: 'row',
							alignItems: 'center',
							paddingRight: Indent.XL3.toNumber(),
							paddingVertical: Indent.XL.toNumber(),
							borderBottomWidth: isLast ? 0 : 1,
							borderBottomColor: Color.bgSeparatorSecondary.toHex(),
						},
					},
					this.#renderText(),
					this.#renderSwitcher(),
				),
			);
		}

		#renderIcon()
		{
			const { code } = this.props;

			return IconView({
				testId: `${TEST_ID_PREFIX}-icon-${code}`,
				icon: FolderSourceIcon.getByFolderCode(code),
				size: ICON_SIZE,
				color: Color.accentSoftBorderBlue,
				style: {
					marginRight: Indent.XL2.toNumber(),
				},
			});
		}

		#renderText()
		{
			const { code, title, description, togglable } = this.props;

			// nothing is substituted on the client for an empty text: a description the server
			// left empty is a regular state of the contract, so it hides itself alone and the
			// row stays visible and switchable
			return View(
				{
					style: {
						flex: 1,
					},
				},
				Type.isStringFilled(title)
					? Text3({
						testId: `${TEST_ID_PREFIX}-title-${code}`,
						text: title,
						// a locked source is muted down to the title: the row stays readable
						// while nothing on it promises a tap
						color: togglable ? Color.base1 : Color.base4,
						numberOfLines: 1,
						ellipsize: 'end',
					})
					: null,
				Type.isStringFilled(description)
					? Text5({
						testId: `${TEST_ID_PREFIX}-description-${code}`,
						text: description,
						color: Color.base3,
						numberOfLines: 2,
						ellipsize: 'end',
						style: {
							marginTop: Indent.XS2.toNumber(),
						},
					})
					: null,
				togglable ? null : this.#renderLockedNote(code),
			);
		}

		// The description of a locked source is about the chats behind it and says nothing about the
		// dead switcher, so the restriction is spelled out under it. A hint on hover has no place on
		// touch, hence a line of the row and not a tooltip.
		#renderLockedNote(code)
		{
			return Text5({
				testId: `${TEST_ID_PREFIX}-locked-note-${code}`,
				text: Loc.getMessage('IMMOBILE_FOLDER_SOURCES_LOCKED_NOTE'),
				color: Color.base3,
				style: {
					marginTop: Indent.XS2.toNumber(),
				},
			});
		}

		#renderSwitcher()
		{
			const { code, enabled, togglable } = this.props;

			// no onClick on purpose: with `useState: false` the wrapper leaves the switcher
			// unclickable, and the tap belongs to the row
			return Switcher({
				testId: `${TEST_ID_PREFIX}-switcher-${code}`,
				checked: Boolean(enabled),
				disabled: !togglable,
				useState: false,
				size: SwitcherSize.L,
				style: {
					marginLeft: Indent.XL.toNumber(),
				},
			});
		}

		#handleClick = () => {
			const { folderId, togglable, onToggle } = this.props;

			// a locked switcher does not flip itself and the row does not ask for it either:
			// the muted switcher is the whole explanation, no toast follows
			if (!togglable)
			{
				return;
			}

			onToggle?.(folderId);
		};
	}

	module.exports = { FolderSourceItem };
});
