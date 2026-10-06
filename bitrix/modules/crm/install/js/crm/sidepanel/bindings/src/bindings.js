import { Type } from 'main.core';
import { SidePanel } from 'main.sidepanel';

/**
 * SidePanel anchor rules for CRM URLs that must open as sliders from any context
 * (including chat windows). The extension rides intranet.sidepanel.bindings as a rel
 * dependency, so it is loaded on every portal page instead of via main/OnEpilog.
 *
 * Each rule is `forceAnchorBinding: true` so that it intercepts regardless of the
 * SliderManager's global anchor-binding flag in the current document.
 */

const sliderManager = SidePanel.Instance;

const isSliderIframe = window !== window.top
	&& (window.location.search.includes('IFRAME=') || window.location.search.includes('IFRAME%3D'));

if (!isSliderIframe && Type.isObject(sliderManager))
{
	sliderManager.bindAnchors({
		rules: [
			{
				condition: ['/crm/copilot-call-assessment/summary/'],
				options: {
					cacheable: false,
					allowChangeHistory: false,
					width: 700,
				},
				forceAnchorBinding: true,
			},
			{
				condition: ['/crm/ai-report-drawer/'],
				options: {
					cacheable: false,
					allowChangeHistory: false,
					width: 800,
					contentClassName: 'crm-ai-report-drawer-slider',
					copyLinkLabel: true,
					newWindowLabel: false,
				},
				forceAnchorBinding: true,
			},
		],
	});
}
