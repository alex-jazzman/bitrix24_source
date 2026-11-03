const isStringFilled = (value) => {
	return typeof value === 'string' && value.trim() !== '';
};

export const isCollaborationMenuItem = (node) => {
	return node?.dataset.collaborationMenu === 'Y';
};

export const handleCollaborationMenuItemClick = (itemNode, linkNode, event) => {
	if (!isCollaborationMenuItem(itemNode) || !linkNode.matches('a.menu-item-link'))
	{
		return false;
	}
	if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)
	{
		return false;
	}

	const menuId = itemNode.dataset.topMenuId;
	const entryUrl = itemNode.dataset.collaborationEntryUrl;
	if (!isStringFilled(menuId) || !isStringFilled(entryUrl))
	{
		return false;
	}

	const bitrix = globalThis;
	const collaborationMenu = bitrix.BX?.Intranet?.Bitrix24?.Template?.getCollaborationMenu();
	if (collaborationMenu?.openFirstItem(menuId, entryUrl) !== true)
	{
		return false;
	}

	event.preventDefault();
	event.stopPropagation();

	return true;
};

export const resolveFirstPageLink = (firstPageLink, node) => {
	if (firstPageLink !== null || isCollaborationMenuItem(node))
	{
		return firstPageLink;
	}

	return isStringFilled(node.dataset.link) ? node.dataset.link : null;
};

export const canApplyTopMenuFirstItem = (node) => {
	return !isCollaborationMenuItem(node);
};

export const resolveLinkedTopMenuId = (
	menuId,
	collaborationItem,
	collaborationMenuId,
	legacyMenuId,
) => {
	if (collaborationItem?.dataset.topMenuId === menuId)
	{
		return menuId;
	}

	if (isStringFilled(collaborationMenuId) && isStringFilled(legacyMenuId) && menuId === collaborationMenuId)
	{
		return legacyMenuId;
	}

	return menuId;
};
