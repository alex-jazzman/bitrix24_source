import { Tag } from 'main.core';
import { Loader } from 'main.loader';

import './wrapper.css';

type WidgetWrapper = {
	wrapperContainer: HTMLElement;
	contentContainer: HTMLElement;
};

export function renderWidgetWrapper(contextClass: string): WidgetWrapper
{
	const contentContainer: HTMLElement = Tag.render`
		<div class="intranet-ai-chat-panel__content"></div>
	`;

	new Loader({
		size: 144,
		color: 'rgba(255, 255, 255, 0.6)',
		target: contentContainer,
		offset: { top: '-50px' },
	}).show();

	const wrapperContainer: HTMLElement = Tag.render`
		<div class="intranet-ai-chat-panel ${contextClass}">
			${contentContainer}
			<div class="intranet-ai-chat-panel__background">
				<div class="intranet-ai-chat-panel__background_header"></div>
			</div>
		</div>
	`;

	return { wrapperContainer, contentContainer };
}
