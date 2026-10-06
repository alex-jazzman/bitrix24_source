/* eslint-disable */
(function (main_core, main_sidepanel) {
	'use strict';

	/**
	 * SidePanel anchor rules for CRM URLs that must open as sliders from any context
	 * (including chat windows). The extension rides intranet.sidepanel.bindings as a rel
	 * dependency, so it is loaded on every portal page instead of via main/OnEpilog.
	 *
	 * Each rule is `forceAnchorBinding: true` so that it intercepts regardless of the
	 * SliderManager's global anchor-binding flag in the current document.
	 */

	const sliderManager = main_sidepanel.SidePanel.Instance;

	// Inside a SidePanel slider iframe (a slider that renders a portal page is a full hit
	// that reloads this whole extension chain) SidePanel.Instance resolves to the top-window
	// manager, which already intercepts these links via SliderManager.handleSliderLoad.
	// Re-binding from here would only re-push the same rules into the top manager's
	// cross-realm anchorRules array on each slider open. Mirrors the guard in
	// intranet.sidepanel.bindings, which this extension is loaded alongside.
	const isSliderIframe = window !== window.top && (window.location.search.includes('IFRAME=') || window.location.search.includes('IFRAME%3D'));
	if (!isSliderIframe && main_core.Type.isObject(sliderManager)) {
		sliderManager.bindAnchors({
			rules: [{
				condition: ['/crm/copilot-call-assessment/summary/'],
				options: {
					cacheable: false,
					allowChangeHistory: false,
					width: 700
				},
				forceAnchorBinding: true
			}, {
				condition: ['/crm/ai-report-drawer/'],
				options: {
					cacheable: false,
					allowChangeHistory: false,
					width: 800,
					contentClassName: 'crm-ai-report-drawer-slider',
					copyLinkLabel: true,
					newWindowLabel: false
				},
				forceAnchorBinding: true
			}]
		});
	}

})(BX, BX.SidePanel);
//# sourceMappingURL=bindings.bundle.js.map
