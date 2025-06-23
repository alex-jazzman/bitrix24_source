import { Dom } from 'main.core';

import '../../../../css/content-blocks/internal/copilot/footer-text.css';

const HELP_ARTICLE_CODE = '20412666';

export default {
	computed: {
		getText(): string
		{
			return this.$Bitrix.Loc.getMessage(
				'CRM_TIMELINE_ITEM_COPILOT_WARNING_TEXT',
				{
					'#LINK_START#': '<a class="crm-timeline-block-internal-copilot-footer-more">',
					'#LINK_END#': '</a>',
				},
			);
		},
	},

	methods: {
		openHelpArticle(event: PointerEvent): void
		{
			if (!Dom.hasClass(event.target, 'crm-timeline-block-internal-copilot-footer-more'))
			{
				return;
			}

			if (top.BX && top.BX.Helper)
			{
				top.BX.Helper.show(`redirect=detail&code=${HELP_ARTICLE_CODE}`);
			}
		},
	},

	template: `
		<div 
			class="crm-timeline-block-internal-copilot-footer"
			v-html="getText"
			@click="openHelpArticle"
		></div>
	`,
};
