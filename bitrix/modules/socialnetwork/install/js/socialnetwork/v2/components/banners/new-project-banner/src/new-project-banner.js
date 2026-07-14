import { RichLoc } from 'ui.vue3.components.rich-loc';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import './new-project-banner.css';

const HELPDESK_CODE = '28397818';

// @vue/component
export const NewProjectBanner = {
	name: 'NewProjectBanner',
	components: {
		BIcon,
		RichLoc,
	},
	emits: ['close'],
	setup(): Object
	{
		return {
			Outline,
		};
	},
	methods: {
		showHelpDesk(): void
		{
			top.BX.Helper.show(`redirect=detail&code=${HELPDESK_CODE}`);
		},
		close(): void
		{
			this.$emit('close');
		},
	},
	template: `
		<div class="sonet--new-project-banner">
			<div class="sonet--new-project-banner--content">
				<p class="sonet--new-project-banner--title">
					{{ loc('SONET_EXT_NEW_PROJECT_BANNER_TITLE') }}
				</p>
				<div class="sonet--new-project-banner--description">
					<p>
						<RichLoc
							:text="loc('SONET_EXT_NEW_PROJECT_BANNER_DESCRIPTION')"
							:placeholder="['[helpdesklink]', '[nbsp]']"
						>
							<template #helpdesklink="{ text }">
								<span class="sonet--new-project-banner--link" @click="showHelpDesk">
									{{ text }}
								</span>
							</template>
							<template #nbsp>
								{{ '&nbsp;' }}
							</template>
						</RichLoc>
					</p>
				</div>
			</div>
			<div class="sonet--new-project-banner--close">
				<button type="button" class="sonet--new-project-banner--close-btn" @click="close">
					<BIcon :name="Outline.CROSS_L" hoverable/>
				</button>
			</div>
		</div>
	`,
};
