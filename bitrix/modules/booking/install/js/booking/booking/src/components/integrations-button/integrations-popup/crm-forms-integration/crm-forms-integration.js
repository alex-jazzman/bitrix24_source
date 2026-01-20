import { CrmFormsContent } from 'booking.component.crm-forms-popup';
import { BackButton } from '../components/back-button';

// @vue/component
export const CrmFormsIntegration = {
	name: 'CrmFormsIntegration',
	components: {
		CrmFormsContent,
		BackButton,
	},
	emits: ['update:view'],
	template: `
		<CrmFormsContent>
			<template #icon>
				<BackButton @click="$emit('update:view', 'IntegrationList')"/>
			</template>
		</CrmFormsContent>
	`,
};
