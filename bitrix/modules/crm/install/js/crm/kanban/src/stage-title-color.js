import { Dom } from 'main.core';

const darkTitleClass = 'main-kanban-column-title-dark';

export function applyStageTitleTextColor(title, textColor)
{
	Dom.toggleClass(title, darkTitleClass, textColor === '#ffffff');
}
