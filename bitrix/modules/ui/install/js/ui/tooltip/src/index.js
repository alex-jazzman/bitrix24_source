import { Browser, Event, Type } from 'main.core';
import { Interceptor } from './intercept';

import { Tooltip } from './tooltip.js';
import { TooltipBalloon } from './balloon.js';

import './css/style.css';

Event.ready(() => {
	if (
		Browser.isAndroid()
		|| Browser.isIOS()
	)
	{
		return;
	}

	Event.bind(document, 'mouseover', (e) => {
		const node = e.target;
		if (!Type.isElementNode(node))
		{
			return;
		}

		const userId = node.getAttribute('bx-tooltip-user-id');
		const loader = node.getAttribute('bx-tooltip-loader');
		const context = node.getAttribute('bx-tooltip-context');

		if (
			Type.isStringFilled(context)
			&& Interceptor.try(context, userId, node)
		)
		{
			return;
		}

		let tooltipId = userId; // don't use integer value!

		if (Type.isStringFilled(loader))
		{
			let loaderHash = 0;

			[...loader].forEach((c, i) => {
				loaderHash = (31 * loaderHash + loader.charCodeAt(i)) << 0;
			});

			tooltipId = loaderHash + userId;
		}

		if (Type.isStringFilled(userId))
		{
			if (null == Tooltip.tooltipsList[tooltipId])
			{
				Tooltip.tooltipsList[tooltipId] = new TooltipBalloon({
					userId: userId,
					node: node,
					loader: loader,
				});
			}
			else
			{
				Tooltip.tooltipsList[tooltipId].node = node;
				Tooltip.tooltipsList[tooltipId].create();
			}

			e.preventDefault();
		}
	});
});

export {
	Tooltip,
	TooltipBalloon,
};
