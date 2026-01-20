/**
 * @module ai/mcp-selector/ui/item
 */
jn.define('ai/mcp-selector/ui/item', (require, exports, module) => {
	const { createTestIdGenerator } = require('utils/test');
	const { withCurrentDomain } = require('utils/url');
	const { Loc } = require('loc');
	const { EntityCell, EntityCellMode } = require('ui-system/blocks/entity-cell');
	const { Type } = require('type');

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

			if (
				Type.isArrayFilled(authorizations)
				&& authorizations.some((auth) => selectedAuthId === auth.id)
			)
			{
				return true;
			}

			return selectedAuthId === id;
		}

		render()
		{
			const { isActive, disableDivider, iconUrl, name, subtitle, isLink, isDisabled } = this.props;

			let mode = isLink ? EntityCellMode.GROUP : EntityCellMode.SINGLE;
			if (isDisabled)
			{
				mode = EntityCellMode.LOCKED;
			}

			return EntityCell({
				title: name,
				subtitle,
				avatar: iconUrl.startsWith('http') ? iconUrl : withCurrentDomain(iconUrl),
				badgeHeader: isActive ? Loc.getMessage('MCP_SELECTOR_STATUS_CHIP_CONNECTED') : null,
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
