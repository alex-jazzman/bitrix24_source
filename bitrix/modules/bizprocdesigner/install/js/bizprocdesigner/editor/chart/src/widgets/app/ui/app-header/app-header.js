import { storeToRefs } from 'ui.vue3.pinia';
import {
	AppHeader as AppHeaderEntity,
	AppHeaderDivider,
	LogoLayout,
	LogoBackBtn,
	LogoTitle,
} from '../../../../entities/app';
import {
	diagramStore as useDiagramStore,
} from '../../../../entities/blocks';

// @vue/component
export const AppHeader = {
	name: 'AppHeader',
	components: {
		AppHeaderEntity,
		AppHeaderDivider,
		LogoLayout,
		LogoBackBtn,
		LogoTitle,
	},
	setup(): {...}
	{
		const diagramStore = useDiagramStore();
		const { companyName } = storeToRefs(diagramStore);

		return {
			companyName,
		};
	},
	template: `
		<AppHeaderEntity>
			<template #left>
				<LogoLayout>
					<template #back-btn>
						<LogoBackBtn/>
					</template>

					<template #title>
						<LogoTitle :companyName="companyName"/>
					</template>
				</LogoLayout>
			</template>

			<template #right>
				<slot name="templateName"/>
				<AppHeaderDivider/>
				<slot name="autosaveStatus"/>
				<AppHeaderDivider/>
				<slot name="diagramMenu"/>
				<slot name="publishButton"/>
			</template>
		</AppHeaderEntity>
	`,
};
