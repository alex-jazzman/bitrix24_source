import { Tag } from 'main.core';

import '../../css/skeletons/composite-right-sidebar-skeleton.css';

export const createRightSidebarSkeleton = (): HTMLElement => {
	return Tag.render`
		<div class="right-sidebar-skeleton">
			<div class="right-sidebar-skeleton__header"></div>
			<div class="right-sidebar-skeleton__chat"></div>
		</div>
	`;
};
