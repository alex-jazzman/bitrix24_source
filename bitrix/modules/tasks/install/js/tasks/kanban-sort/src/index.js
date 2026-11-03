import { KanbanSort } from './kanban-sort';
import { KanbanSortMenu } from './kanban-sort-menu/kanban-sort-menu';
import { KanbanAjaxComponent } from './kanban-component/kanban-ajax-component';
import { KanbanSortComparator } from './kanban-sort-comparator/kanban-sort-comparator';

// the sort is created by the onclick of a menu item, so the loaded extension is all there is
// when the settings menu opens for the first time
KanbanSort.observeSettingsMenu();

export {
	KanbanSort,
	KanbanSortMenu,
	KanbanAjaxComponent,
	KanbanSortComparator,
}
