import { Logger } from 'im.v2.lib.logger';
import { SettingsSection } from 'im.v2.const';
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
	watch:
	{
		// layout can be reopened without a section - restore it on every empty entityId
		entityId: {
			immediate: true,
			handler(): void
			{
				this.setInitialSection();
			},
		},
	},
	created()
	{
		Logger.warn('Content: Settings created');
	},
	methods:
	{
		setInitialSection(): void
		{
			if (!this.entityId)
			{
				void Messenger.openSettings({ onlyPanel: SettingsSection.appearance });
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
