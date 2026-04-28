/**
 * @module ai/mcp-selector/ui/item
 */
jn.define('ai/mcp-selector/ui/item', (require, exports, module) => {
	const { createTestIdGenerator } = require('utils/test');
	const { withCurrentDomain } = require('utils/url');
	const { Loc } = require('loc');
	const { EntityCell, EntityCellMode } = require('ui-system/blocks/entity-cell');
	const { Type } = require('type');
	const { ChipStatusDesign } = require('ui-system/blocks/chips/chip-status');

	class MCPSelectorItem extends LayoutComponent
	{
		/**
		 * @param {MCPSelectorItemProps} props
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				prefix: 'mcp-selector-item',
				context: this,
			});
		}

		get isDisabled()
		{
			return this.props.isDisabled === true;
		}

		get isLink()
		{
			return this.props.isLink === true;
		}

		get isSelected()
		{
			const { selectedAuthId, id, authorizations = [] } = this.props;

			if (Type.isArrayFilled(authorizations))
			{
				return authorizations.some((auth) => {
					return selectedAuthId === auth.id && auth.serverId === id;
				});
			}

			return selectedAuthId === id;
		}

		render()
		{
			const {
				isActive,
				disableDivider,
				iconUrl,
				name,
				subtitle,
				isLink,
				isDisabled,
				authorizations,
				isAuthorization,
			} = this.props;

			let mode = isLink ? EntityCellMode.GROUP : EntityCellMode.SINGLE;
			if (isDisabled)
			{
				mode = EntityCellMode.LOCKED;
			}

			const badgeHeader = (isActive && Type.isArrayFilled(authorizations))
				? Loc.getMessage('MCP_SELECTOR_STATUS_CHIP_CONNECTED')
				: Loc.getMessage('MCP_SELECTOR_STATUS_CHIP_NOT_CONNECTED');

			let preparedSubtitle = subtitle;
			if (Type.isArrayFilled(authorizations))
			{
				preparedSubtitle = authorizations.length > 1 ? Loc.getMessage('MCP_SELECTOR_ITEM_MANY_AUTH') : authorizations[0].name;
			}

			return EntityCell({
				title: name,
				subtitle: preparedSubtitle,
				avatar: iconUrl.startsWith('http') ? iconUrl : withCurrentDomain(iconUrl),
				badgeHeader: (isAuthorization || isDisabled) ? null : badgeHeader,
				badgeDesign:
					(isActive && Type.isArrayFilled(authorizations))
						? ChipStatusDesign.SUCCESS
						: ChipStatusDesign.NEUTRAL,
				divider: !disableDivider,
				mode,
				checked: this.isSelected,
				onClick: this.onClick,
				nextLevel: isLink,
			});
		}

		onClick = () => {
			const { onSelect, id, serverId, isAuthorization } = this.props;

			if (isAuthorization)
			{
				onSelect({ authId: id, serverId });
			}
			else
			{
				onSelect({ serverId: id });
			}
		};
	}

	module.exports = {
		MCPSelectorItem: (props) => new MCPSelectorItem(props),
	};
});
