import { Tag } from 'main.core';

export function createSectionDivider(): HTMLElement
{
	// Same separator as the favorites block, styled by mail.directorymenu; leads the block.
	return Tag.render`<div class="mail-favorites-menu-separator mail-favorites-menu-separator--leading"></div>`;
}
