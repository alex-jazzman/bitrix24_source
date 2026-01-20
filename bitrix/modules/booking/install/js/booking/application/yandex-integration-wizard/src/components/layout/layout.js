import { createNamespacedHelpers } from 'ui.vue3.vuex';
import { Loader, LoaderType } from 'booking.component.loader';
import { Model } from 'booking.const';

import './layout.css';

const { mapGetters } = createNamespacedHelpers(Model.YandexIntegrationWizard);

// @vue/component
export const YandexIntegrationWizardLayout = {
	name: 'YandexIntegrationWizardLayout',
	components: {
		Loader,
	},
	setup(): Object
	{
		return {
			LoaderType,
		};
	},
	computed: {
		...mapGetters(['isFetching']),
	},
	template: `
		<div class="yandex-integration-wizard-layout">
			<div class="yandex-wizard__wrapper">
				<slot name="header"/>
				<div
					class="yandex-wizard__content"
					:class="{ '--loading': isFetching }"
				>
					<slot/>
				</div>
				<Loader
					v-show="isFetching"
					class = "yandex-wizard__loader"
					:options="{ type: LoaderType.DEFAULT }"
				/>
			</div>
			<slot name="footer"/>
		</div>
	`,
};
