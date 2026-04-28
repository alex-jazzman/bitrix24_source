import { LocMixin } from 'sign.v2.b2e.vue-util';

// @vue/component
export const PlaceholderSearchNotConfigured = {
	name: 'PlaceholderSearchNotConfigured',
	mixins: [LocMixin],
	template: `
		<div class="sign-placeholders-nothing-found-container">
			<div class="sign-placeholders-nothing-configured-img"></div>
			<div class="sign-placeholders-nothing-found-text-container">
				<div class="sign-placeholders-nothing-found-title">
					{{ loc('PLACEHOLDER_LIST_NOTHING_CONFIGURED_TITLE') }}
				</div>
				<div class="sign-placeholders-nothing-found-description">
					{{ loc('PLACEHOLDER_LIST_NOTHING_CONFIGURED_DESCRIPTION') }}
				</div>
			</div>
		</div>
	`,
};
