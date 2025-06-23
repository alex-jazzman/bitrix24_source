import { Dom, Tag } from 'main.core';
import { Circle, Line } from 'ui.system.skeleton';

import './task-card-skeleton.css';

export class TaskCardSkeleton
{
	#layout: {
		compactCardSkeleton: HTMLElement,
	};

	constructor()
	{
		this.#layout = {};
	}

	renderCompactCardSkeleton(): HTMLElement
	{
		this.#layout.compactCardSkeleton = Tag.render`
			<div class="tasks-task-compact-card-skeleton">
				<div class="tasks-task-compact-card-skeleton-fields">
					<div class="tasks-task-compact-card-skeleton-fields-title">
						${new Line({ width: 240, height: 18, borderRadius: 60 }).render()}
						<div class="tasks-task-card-skeleton-group --icons">
							${new Circle({ size: 18 }).render()}
							${new Circle({ size: 18 }).render()}
						</div>
					</div>
					<div class="tasks-task-compact-card-skeleton-fields-description">
						${new Line({ width: 80, height: 12, borderRadius: 60 }).render()}
					</div>
					<div class="tasks-task-compact-card-skeleton-fields-list">
						<div class="tasks-task-compact-card-skeleton-fields-list-row">
							<div class="tasks-task-card-skeleton-group">
								${new Line({ width: 100, height: 12, borderRadius: 60 }).render()}
							</div>
							<div class="tasks-task-card-skeleton-group">
								${new Circle({ size: 22 }).render()}
								${new Line({ width: 130, height: 12, borderRadius: 60 }).render()}
							</div>
						</div>
						<div class="tasks-task-compact-card-skeleton-fields-list-row">
							<div class="tasks-task-card-skeleton-group">
								${new Line({ width: 100, height: 12, borderRadius: 60 }).render()}
							</div>
							<div class="tasks-task-card-skeleton-group">
								${new Circle({ size: 22 }).render()}
								${new Line({ width: 130, height: 12, borderRadius: 60 }).render()}
							</div>
						</div>
					</div>
				</div>
				<div class="tasks-task-compact-card-skeleton-chips">
					${new Line({ height: 34, borderRadius: 8 }).render()}
				</div>
				<div class="tasks-task-compact-card-skeleton-footer">
					<div class="tasks-task-card-skeleton-group">
						${new Line({ width: 84, height: 34, borderRadius: 8 }).render()}
						${new Line({ width: 84, height: 34, borderRadius: 8 }).render()}
					</div>
					<div style="margin-right: 6px;">
						${new Line({ width: 97, height: 12, borderRadius: 60 }).render()}
					</div>
				</div>
			</div>
		`;

		return this.#layout.compactCardSkeleton;
	}

	removeCompactCardSkeleton(): void
	{
		Dom.remove(this.#layout.compactCardSkeleton);
	}
}
