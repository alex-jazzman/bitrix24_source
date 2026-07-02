/**
 * @module im/messenger/controller/folder/selector/selector-list
 */
jn.define('im/messenger/controller/folder/selector/selector-list', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');
	const { Color } = require('tokens');
	const { FolderLoadableButton } = require('im/messenger/controller/folder/lib/ui/loadable-button');
	const { Checkbox } = require('ui-system/form/checkbox');

	class FolderSelectorList extends LayoutComponent
	{
		// JaNative doesn't propagate props to existing class-component children
		// on parent setState — push the new enabled state through the ref.
		// Use as setState callback so it lands after the new ref is bound.
		#syncSaveEnabled = () => {
			this.saveButton?.setEnabled(this.isChanged);
		};

		constructor(props)
		{
			super(props);

			this.saveButton = null;
			this.initialSelectedFolderIds = new Set(props.selectedFolderIds || []);
			this.state = {
				folders: (props.folders || []).map((f) => ({
					...f,
					isChecked: this.initialSelectedFolderIds.has(f.id),
				})),
			};
		}

		render()
		{
			return View(
				{
					style: {
						flex: 1,
						backgroundColor: Color.bgContentPrimary.toHex(),
					},
				},
				ScrollView(
					{
						style: { flex: 1 },
					},
					View(
						{},
						...this.state.folders.map((folder, index) => this.renderFolderItem(folder, index)),
						View({ style: { height: 80 } }),
					),
				),
				this.renderButton(this.isChanged),
			);
		}

		get isChanged()
		{
			const selectedFolderIds = new Set(
				this.state.folders
					.filter((folder) => folder.isChecked)
					.map((folder) => folder.id),
			);

			if (selectedFolderIds.size !== this.initialSelectedFolderIds.size)
			{
				return true;
			}

			return [...selectedFolderIds].some((folderId) => !this.initialSelectedFolderIds.has(folderId));
		}

		/**
		 * Move the saved baseline to the current selection — call after a successful
		 * REST round-trip. Triggers a re-render so `isChanged` reads as false and
		 * the save button auto-disables via `enabled: this.isChanged`.
		 */
		markSaved()
		{
			this.initialSelectedFolderIds = new Set(
				this.state.folders
					.filter((folder) => folder.isChecked)
					.map((folder) => folder.id),
			);
			this.setState({}, this.#syncSaveEnabled);
		}

		renderFolderItem(folder, index)
		{
			return View(
				{
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						paddingLeft: 18,
						paddingRight: 18,
						paddingTop: 14,
						paddingBottom: 15,
					},
					onClick: () => this.toggleFolder(index),
				},
				Image({
					style: {
						width: 40,
						height: 40,
						marginRight: 12,
					},
					uri: this.props.folderIconUri,
				}),
				View(
					{
						style: { flex: 1 },
					},
					Text({
						text: folder.title,
						style: {
							fontSize: 17,
							color: Color.base1.toHex(),
						},
						numberOfLines: 1,
						ellipsize: 'end',
					}),
				),
				this.renderCheckbox(folder),
				View({
					style: {
						position: 'absolute',
						bottom: 0,
						left: 70,
						right: 0,
						height: 1,
						backgroundColor: Color.bgSeparatorSecondary.toHex(),
					},
				}),
			);
		}

		renderCheckbox(folder)
		{
			return new Checkbox({
				testId: `folder-selector-checkbox-${folder.id}`,
				size: 24,
				checked: folder.isChecked,
				useState: false,
			});
		}

		renderButton(isChanged)
		{
			return View(
				{
					style: {
						paddingHorizontal: 24,
						paddingTop: 12,
						paddingBottom: 46,
						borderTopWidth: 1,
						borderTopColor: Color.bgSeparatorPrimary.toHex(),
						backgroundColor: Color.bgContentPrimary.toHex(),
					},
				},
				new FolderLoadableButton({
					testId: 'folder-selector-save-button',
					text: Loc.getMessage('IMMOBILE_FOLDER_PICKER_SAVE_BUTTON'),
					enabled: isChanged,
					ref: (btn) => {
						this.saveButton = btn;
					},
					onClick: () => {
						const selected = this.state.folders
							.filter((f) => f.isChecked)
							.map((f) => f.id);

						this.props.onComplete?.(selected);
					},
				}),
			);
		}

		toggleFolder(index)
		{
			const folders = [...this.state.folders];
			folders[index] = { ...folders[index], isChecked: !folders[index].isChecked };
			this.setState({ folders }, this.#syncSaveEnabled);
		}
	}

	module.exports = { FolderSelectorList };
});
