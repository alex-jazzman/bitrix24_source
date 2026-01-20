import { Logger } from 'im.v2.lib.logger';
import { Settings } from 'im.v2.const';
import { Messenger } from 'im.public';

import { SectionList } from './components/section-list';
import { SectionContent } from './components/section-content';

import './css/settings-content.css';

// @vue/component
export const SettingsContent = {
	name: 'SettingsContent',
	components: { SectionList, SectionContent },
	props:
	{
		entityId: {
			type: String,
			required: true,
		},
	},
	computed:
	{
		sections(): string[]
		{
			return Object.keys(Settings);
		},
	},
	created()
	{
		Logger.warn('Content: Settings created');
		this.setInitialSection();
	},
	methods:
	{
		setInitialSection(): void
		{
			if (!this.entityId)
			{
				const [firstSection] = this.sections;
				void Messenger.openSettings({ onlyPanel: firstSection });
			}
		},
		onSectionClick(sectionId: string)
		{
			void Messenger.openSettings({ onlyPanel: sectionId });
		},
	},
	template: `
		<div v-if="entityId" class="bx-im-content-settings__container">
			<SectionList :activeSection="entityId" @sectionClick="onSectionClick" />
			<SectionContent :activeSection="entityId" />
		</div>
	`,
};
