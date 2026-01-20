import { Extension, Loc } from 'main.core';

const ARTICLE_CODE = '23240682';
const DISCLAIMER_ARTICLE_RU_CODE = '20412666';
const DISCLAIMER_ARTICLE_CODE = '25775495';

export const RecommendationBlock = {
	props: {
		recommendations: {
			type: String,
			default: null,
		},
		summary: {
			type: String,
			default: null,
		},
		useInRating: {
			type: Boolean,
			default: false,
		},
	},

	methods: {
		showArticle(): void
		{
			window.top.BX?.Helper?.show(`redirect=detail&code=${ARTICLE_CODE}`);
		},
	},

	computed: {
		disclaimer(): string
		{
			const language = Loc.getMessage('LANGUAGE_ID');
			const region = Extension.getSettings('crm.ai.call').get('region');

			let code = DISCLAIMER_ARTICLE_CODE;
			if (['ru', 'by', 'kz', 'uz'].includes(language ?? region))
			{
				code = DISCLAIMER_ARTICLE_RU_CODE;
			}

			return Loc.getMessage('CRM_COPILOT_CALL_QUALITY_EXPLANATION_DISCLAIMER_MSGVER_1', {
				'#LINK_START#': `<a onclick='window.top.BX?.Helper?.show(\`redirect=detail&code=${code}\`)' href="#">`,
				'#LINK_END#': '</a>',
			});
		},
	},

	template: `
		<div class="call-quality__explanation --copilot-content">
			<div class="call-quality__explanation__container ">
				<div class="call-quality__explanation-title">
					{{ $Bitrix.Loc.getMessage('CRM_COPILOT_CALL_QUALITY_EXPLANATION_TITLE') }}
				</div>
				<div class="call-quality__explanation-text">
					<div 
						v-if="!useInRating"
						class="call-quality__explanation-badge"
					>
						<div>
							{{ $Bitrix.Loc.getMessage('CRM_COPILOT_CALL_QUALITY_EXPLANATION_NOT_IN_RATING') }}
							<div
								class="call-quality__explanation-badge-article ui-icon-set --help"
								@click="showArticle"
							></div>
						</div>
					</div>
					<p>
						{{ summary }}
					</p>
					<p>
						{{ recommendations }}
					</p>
				</div>
				<div class="call-quality__explanation-disclaimer" v-html="disclaimer">
				</div>
			</div>
		</div>
	`,
};
