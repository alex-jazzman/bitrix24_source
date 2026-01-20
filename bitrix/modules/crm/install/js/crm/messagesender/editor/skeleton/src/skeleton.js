import { Dom, Tag } from 'main.core';
import { Line } from 'ui.system.skeleton';
import './skeleton.css';

const RADIUS = 8;
const DEFAULT_PADDING = 'var(--ui-space-inset-lg)';

export type SkeletonOptions = {
	layout: {
		padding: string,
		paddingTop: ?string,
		paddingBottom: ?string,
		paddingLeft: ?string,
		paddingRight: ?string,
	},
};

export class Skeleton
{
	#skeleton: ?HTMLElement = null;
	#options: SkeletonOptions;

	constructor(options: SkeletonOptions)
	{
		this.#options = options ?? {};
	}

	render(): HTMLElement
	{
		if (this.#skeleton)
		{
			return this.#skeleton;
		}

		// noinspection MagicNumberJS
		this.#skeleton = Tag.render`
			<div class="crm-messagesender-editor-skeleton">
				<div class="crm-messagesender-editor-skeleton-header">
					<div class="crm-messagesender-editor-skeleton-header-left">
						${Line(133, 32, RADIUS)}
						${Line(220, 32, RADIUS)}
					</div>
					${Line(132, 32, RADIUS)}
				</div>
				<div class="crm-messagesender-editor-skeleton-body"></div>
				<div class="crm-messagesender-editor-skeleton-add">
					${Line(126, 10, RADIUS)}
					${Line(126, 10, RADIUS)}
				</div>
				<div class="crm-messagesender-editor-skeleton-footer">
					${Line(103, 34, RADIUS)}
					${Line(100, 11, RADIUS)}
				</div>
			</div>
		`;

		Dom.style(this.#skeleton, {
			paddingTop: this.#options.layout.paddingTop ?? this.#options.layout.padding ?? DEFAULT_PADDING,
			paddingBottom: this.#options.layout.paddingBottom ?? this.#options.layout.padding ?? DEFAULT_PADDING,
			paddingLeft: this.#options.layout.paddingLeft ?? this.#options.layout.padding ?? DEFAULT_PADDING,
			paddingRight: this.#options.layout.paddingRight ?? this.#options.layout.padding ?? DEFAULT_PADDING,
		});

		return this.#skeleton;
	}

	renderTo(target: HTMLElement): void
	{
		Dom.append(this.render(), target);
	}
}
