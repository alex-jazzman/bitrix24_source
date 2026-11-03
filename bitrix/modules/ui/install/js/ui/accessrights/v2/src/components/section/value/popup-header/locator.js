import { BIcon } from 'ui.icon-set.api.vue';
import '../../../../css/value/popup-header/locator.css';

export const Locator = {
	name: 'Locator',
	components: { BIcon },
	inject: ['section', 'right'],
	computed: {
		parentRight(): ?Object {
			if (!this.right.group)
			{
				return null;
			}

			return this.section.rights.get(this.right.group) ?? null;
		},
		rightTitleText(): string {
			if (!this.parentRight)
			{
				return this.right.title;
			}

			return this.$Bitrix.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_RIGHT_TITLE_WITH_PARENT', {
				'#PARENT#': this.parentRight.title,
				'#RIGHT#': this.right.title,
			});
		},
		titleParts(): { before: string, after: string } {
			const template = this.$Bitrix.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_RIGHTS_TO');
			const [before = '', after = ''] = template.split('#RIGHT#');

			return { before, after };
		},
		sectionText(): string {
			if (this.section.sectionSubTitle)
			{
				return this.$Bitrix.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_SECTION_TITLE_WITH_SUBTITLE', {
					'#TITLE#': this.section.sectionTitle,
					'#SUBTITLE#': this.section.sectionSubTitle,
				});
			}

			return this.section.sectionTitle;
		},
		iconColor(): string {
			return 'var(--ui-color-design-outline-content-label)';
		},
	},
	template: `
		<div class="ui-access-rights-v2-cell-popup-header-locator">
			<p class="ui-access-rights-v2-cell-popup-header-title">
				<span>{{ titleParts.before }}</span><span class="ui-access-rights-v2-cell-popup-header-title-right" :title="rightTitleText">{{ rightTitleText }}</span><span>{{ titleParts.after }}</span>
			</p>
			<div class="ui-access-rights-v2-cell-popup-header-section">
				<BIcon
					v-if="section.sectionIcon"
					:name="section.sectionIcon.type"
					:color="iconColor"
					:size="18"
				/>
				<span
					class="ui-access-rights-v2-text-ellipsis ui-access-rights-v2-cell-popup-header-section-title"
					:title="sectionText"
				>{{ sectionText }}</span>
			</div>
		</div>
	`,
};
