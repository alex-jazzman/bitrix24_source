/**
 * @module im/messenger/controller/folder/sources-settings/header
 */
jn.define('im/messenger/controller/folder/sources-settings/header', (require, exports, module) => {
	const { Color, Corner, Indent } = require('tokens');
	const { Text2 } = require('ui-system/typography/text');
	const { Loc } = require('im/messenger/loc');
	const { MessengerIcon, IconType } = require('im/messenger/assets/icon');

	const ILLUSTRATION_SIZE = 78;
	const NAME_FIELD_HEIGHT = 42;
	const TEST_ID_PREFIX = 'folder-sources-settings-header';

	/**
	 * The header of the composition settings sheet: the illustration of the screen and the name of
	 * the folder next to it. The name is a line of text and not an input: the All folder is not
	 * renamed, so a field would promise an action the screen does not have.
	 */
	class FolderSourcesSettingsHeader extends LayoutComponent
	{
		render()
		{
			return View(
				{
					testId: TEST_ID_PREFIX,
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						paddingHorizontal: Indent.XL3.toNumber(),
						paddingTop: Indent.L.toNumber(),
						paddingBottom: Indent.XL3.toNumber(),
					},
				},
				this.#renderIllustration(),
				this.#renderTitle(),
			);
		}

		#renderIllustration()
		{
			return View(
				{
					style: {
						width: ILLUSTRATION_SIZE,
						height: ILLUSTRATION_SIZE,
					},
				},
				Image({
					testId: `${TEST_ID_PREFIX}-illustration`,
					style: {
						width: ILLUSTRATION_SIZE,
						height: ILLUSTRATION_SIZE,
					},
					uri: MessengerIcon.getByType(IconType.folderSettings),
					resizeMode: 'contain',
				}),
			);
		}

		#renderTitle()
		{
			// the plate repeats the shape of the name input of the neighbouring folder form,
			// and its muted fill and text stand for the field the name of the All folder is
			// never typed into
			return View(
				{
					style: {
						flex: 1,
						height: NAME_FIELD_HEIGHT,
						justifyContent: 'center',
						marginLeft: Indent.XL2.toNumber(),
						paddingHorizontal: Indent.XL2.toNumber(),
						borderRadius: Corner.M.toNumber(),
						backgroundColor: Color.base7.toHex(),
					},
				},
				Text2({
					testId: `${TEST_ID_PREFIX}-title`,
					text: Loc.getMessage('IMMOBILE_FOLDER_SOURCES_TITLE'),
					color: Color.base5,
					numberOfLines: 1,
					ellipsize: 'end',
				}),
			);
		}
	}

	module.exports = { FolderSourcesSettingsHeader };
});
