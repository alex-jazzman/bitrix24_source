/**
 * @module im/messenger/controller/folder/sources-settings/settings-list
 */
jn.define('im/messenger/controller/folder/sources-settings/settings-list', (require, exports, module) => {
	const { Color, Indent } = require('tokens');
	const { Loc } = require('im/messenger/loc');
	const { Box } = require('ui-system/layout/box');
	const { BoxFooter } = require('ui-system/layout/dialog-footer');
	const { Text4, Text5 } = require('ui-system/typography/text');
	const { FolderLoadableButton } = require('im/messenger/controller/folder/lib/ui/loadable-button');
	const { FolderSourcesSettingsHeader } = require('im/messenger/controller/folder/sources-settings/header');
	const { FolderSourceItem } = require('im/messenger/controller/folder/sources-settings/source-item');

	const TEST_ID_PREFIX = 'folder-sources-settings';

	/**
	 * The body of the composition settings sheet: the header, the note about the mandatory base,
	 * the list of sources and the footer. Nothing is switched on the fly: a tap moves the draft
	 * alone, and the composition of the folder stays as it was until the save goes through.
	 *
	 * @extends {LayoutComponent<FolderSourcesSettingsListProps>}
	 */
	class FolderSourcesSettingsList extends LayoutComponent
	{
		// FolderLoadableButton.componentWillReceiveProps() assigns its state directly, without
		// setState, so a new enabled prop never repaints the button: the value has to reach it
		// through the ref. Use as setState callback so the push lands after the re-render.
		#syncSaveEnabled = () => {
			this.saveButton?.setEnabled(this.props.draft.isChanged());
		};

		/**
		 * @param {FolderSourcesSettingsListProps} props
		 */
		constructor(props)
		{
			super(props);

			this.saveButton = null;
			this.state = {};
		}

		render()
		{
			return Box(
				{
					testId: TEST_ID_PREFIX,
					withScroll: true,
					footer: this.#renderFooter(),
				},
				new FolderSourcesSettingsHeader(),
				this.#renderMandatoryNote(),
				this.#renderSectionTitle(),
				...this.#renderItems(),
			);
		}

		/**
		 * Moves the baseline of the draft to what the server saved and re-renders, so that the
		 * save button reads the composition as unchanged again.
		 *
		 * @param {Array<string>} appliedCodes - the composition of the updateSources answer
		 */
		markSaved(appliedCodes)
		{
			this.props.draft.markSaved(appliedCodes);
			this.setState({}, this.#syncSaveEnabled);
		}

		#renderMandatoryNote()
		{
			return Text5({
				testId: `${TEST_ID_PREFIX}-mandatory-note`,
				text: Loc.getMessage('IMMOBILE_FOLDER_SOURCES_MANDATORY_NOTE'),
				color: Color.base3,
				style: {
					marginHorizontal: Indent.XL3.toNumber(),
					marginTop: Indent.XL.toNumber(),
					marginBottom: Indent.XL4.toNumber(),
				},
			});
		}

		#renderSectionTitle()
		{
			return Text4({
				testId: `${TEST_ID_PREFIX}-section-title`,
				text: Loc.getMessage('IMMOBILE_FOLDER_SOURCES_SECTION_TITLE'),
				color: Color.base4,
				style: {
					marginHorizontal: Indent.XL3.toNumber(),
					marginBottom: Indent.M.toNumber(),
				},
			});
		}

		#renderItems()
		{
			const items = this.props.draft.getItems();

			return items.map((item, index) => new FolderSourceItem({
				...item,
				isLast: index === items.length - 1,
				onToggle: this.#handleToggle,
			}));
		}

		#renderFooter()
		{
			return BoxFooter(
				{
					testId: `${TEST_ID_PREFIX}-footer`,
					style: {
						borderTopWidth: 1,
						borderTopColor: Color.bgSeparatorPrimary.toHex(),
						backgroundColor: Color.bgContentPrimary.toHex(),
					},
				},
				// the screen is a page of its own and the navigation bar carries the way back,
				// so the footer holds the save alone
				new FolderLoadableButton({
					testId: `${TEST_ID_PREFIX}-save-button`,
					text: Loc.getMessage('IMMOBILE_FOLDER_SOURCES_SAVE_BUTTON'),
					enabled: this.props.draft.isChanged(),
					ref: (button) => {
						this.saveButton = button;
					},
					onClick: () => this.props.onSave?.(),
				}),
			);
		}

		#handleToggle = (folderId) => {
			this.props.draft.toggle(folderId);
			this.setState({}, this.#syncSaveEnabled);
		};
	}

	module.exports = { FolderSourcesSettingsList };
});
