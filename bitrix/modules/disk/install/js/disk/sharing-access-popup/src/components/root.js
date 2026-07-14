import { SharingAccessWrapper } from './wrapper';
import { SharingAccessButtons } from './accessibility-selection-buttons';
import { SharingAccessMainSettings } from './main-settings';

// @vue/component
export const RootApp = {
	name: 'SharingAccessRoot',
	components: {
		SharingAccessWrapper,
		SharingAccessButtons,
		SharingAccessMainSettings,
	},
	props: {
		objectId: { type: [Number, String], required: true },
		uniqueCode: { type: String, default: null },
		initialTab: { type: String, default: null },
		mode: { type: String, default: 'default' },
		closeDialog: { type: Function, required: true },
	},
	data()
	{
		return {
			isPublic: this.initialTab === 'public',
		};
	},
	template: `
		<SharingAccessWrapper>
			<SharingAccessButtons v-model:isPublic="isPublic" />
			<SharingAccessMainSettings
				:objectId="objectId"
				:uniqueCode="uniqueCode"
				:mode="mode"
				:closeDialog="closeDialog"
				v-model:isPublic="isPublic"
			/>
		</SharingAccessWrapper>
	`,
};
