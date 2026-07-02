/**
 * @module mail/mailbox/folders-settings/src/sync-folders-list
 */
jn.define('mail/mailbox/folders-settings/src/sync-folders-list', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');
	const { Loc } = require('loc');
	const { Color, Indent } = require('tokens');
	const { Checkbox } = require('ui-system/form/checkbox');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { Text4, Text5 } = require('ui-system/typography/text');
	const { FoldersSettingsTree } = require('mail/mailbox/folders-settings/src/folders-tree');

	class SyncFoldersList extends PureComponent
	{
		constructor(props)
		{
			super(props);

			this.tree = new FoldersSettingsTree();
		}

		render()
		{
			return View(
				{
					testId: 'mailbox-folders-settings-sync-list',
				},
				this.renderSelectAllRow(),
				View(
					{
						style: {
							marginTop: Indent.XL2.toNumber(),
						},
					},
					...this.renderFolderNodes(this.props.folders),
				),
			);
		}

		renderSelectAllRow()
		{
			const checked = this.tree.isAllSelected(this.props.folders);
			const disabled = this.tree.hasUnloadedChildren(this.props.folders);
			const textColor = disabled ? Color.base4 : Color.base1;

			return View(
				{
					testId: 'mailbox-folders-settings-select-all-row',
					style: {
						flexDirection: 'row',
						alignItems: 'center',
					},
					onClick: disabled ? null : this.props.onSelectAllPress,
				},
				new Checkbox({
					testId: 'mailbox-folders-settings-select-all-checkbox',
					checked,
					disabled,
					useState: false,
				}),
				View(
					{
						style: {
							marginLeft: Indent.XL.toNumber(),
						},
					},
					Text4({
						testId: 'mailbox-folders-settings-select-all-text',
						text: Loc.getMessage('MAILBOX_FOLDERS_SETTINGS_SELECT_ALL'),
						color: textColor,
					}),
				),
			);
		}

		renderFolderNodes(nodes)
		{
			return nodes.map((node, index) => this.renderFolderNode(node, index)).filter(Boolean);
		}

		renderFolderNode(node, index)
		{
			const children = node.expanded && node.childrenLoaded && node.children.length > 0
				? View(
					{
						style: {
							marginTop: Indent.M.toNumber(),
						},
					},
					...this.renderFolderNodes(node.children),
				)
				: null
			;

			return View(
				{
					testId: `mailbox-folders-settings-folder-${node.dirMd5}`,
					style: {
						marginTop: index === 0 ? 0 : Indent.XL.toNumber(),
					},
				},
				this.renderFolderRow(node),
				children,
			);
		}

		renderFolderRow(node)
		{
			const canExpand = this.tree.canExpandNode(node, this.props.maxLevel);
			const titleColor = node.isDisabled ? Color.base4 : Color.base1;

			return View(
				{
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						paddingLeft: Math.max(0, node.level - 1) * Indent.XL3.toNumber(),
					},
				},
				View(
					{
						onClick: () => this.props.onFolderRowPress(node.dirMd5),
					},
					new Checkbox({
						testId: `mailbox-folders-settings-folder-checkbox-${node.dirMd5}`,
						checked: node.isSync,
						disabled: node.isDisabled,
						useState: false,
					}),
				),
				View(
					{
						style: {
							flex: 1,
							flexDirection: 'row',
							flexWrap: 'wrap',
							alignItems: 'center',
							marginLeft: Indent.XL.toNumber(),
						},
						onClick: () => this.props.onFolderRowPress(node.dirMd5),
					},
					Text4({
						testId: `mailbox-folders-settings-folder-title-${node.dirMd5}`,
						text: this.tree.getFolderDisplayName(node),
						color: titleColor,
					}),
					node.totalChildrenCount > 0
						? View(
							{
								style: {
									marginLeft: Indent.XS.toNumber(),
								},
							},
							Text5({
								testId: `mailbox-folders-settings-folder-counter-${node.dirMd5}`,
								text: `(${node.syncChildrenCount}/${node.totalChildrenCount})`,
								color: Color.base4,
							}),
						)
						: null,
				),
				canExpand
					? View(
						{
							style: {
								width: 24,
								alignItems: 'center',
								justifyContent: 'center',
								marginLeft: Indent.S.toNumber(),
							},
							onClick: () => this.props.onFolderExpandPress(node.dirMd5),
						},
						node.isLoading
							? Loader({
								style: {
									width: 20,
									height: 20,
								},
								tintColor: Color.accentMainPrimary.toHex(),
								animating: true,
							})
							: IconView({
								testId: `mailbox-folders-settings-folder-expand-${node.dirMd5}`,
								icon: node.expanded ? Icon.CHEVRON_UP : Icon.CHEVRON_DOWN,
								color: Color.base4,
								size: 20,
							}),
					)
					: null,
			);
		}
	}

	module.exports = { SyncFoldersList };
});
