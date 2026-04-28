import { createNamespacedHelpers } from 'ui.vue3.vuex';
import { Loader, LoaderType } from 'booking.component.loader';
import { Model } from 'booking.const';

import './layout.css';

const { mapGetters } = createNamespacedHelpers(Model.YandexIntegrationWizard);
const WRAPPER_CLASS = 'booking-yiw__wrapper';

// @vue/component
export const YandexIntegrationWizardLayout = {
	name: 'YandexIntegrationWizardLayout',
	components: {
		Loader,
	},
	provide(): { menuTimeZoneContainerClass: string }
	{
		return {
			menuTimeZoneContainerClass: WRAPPER_CLASS,
		};
	},
	setup(): { LoaderType: typeof LoaderType, wrapperClass: string }
	{
		return {
			LoaderType,
			wrapperClass: WRAPPER_CLASS,
		};
	},
	computed: {
		...mapGetters(['isFetching']),
	},
	template: `
		<div class="booking-yiw__layout">
			<div :class="wrapperClass">
				<slot name="header"/>
				<div
					class="booking-yiw__content"
					:class="{ '--loading': isFetching }"
				>
					<slot/>
				</div>
				<Loader
					v-show="isFetching"
					class="booking-yiw__loader"
					:options="{ type: LoaderType.DEFAULT }"
				/>
			</div>
			<slot name="footer"/>
		</div>
	`,
};
