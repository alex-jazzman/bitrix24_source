import {
	PublishDropdownButton as PublishDropdownButtonFeature,
	PublishMainDropdownOption,
	PublishUserDropdownOption,
	PublishFullDropdownOption,
} from '../../../../features/blocks';

// @vue/component
export const PublishDropdownButton = {
	name: 'PublishDropdownButton',
	components:
	{
		PublishDropdownButtonFeature,
		PublishMainDropdownOption,
		PublishUserDropdownOption,
		PublishFullDropdownOption,
	},
	template: `
		<PublishDropdownButtonFeature>
			<PublishMainDropdownOption/>
			<PublishUserDropdownOption/>
			<PublishFullDropdownOption/>
		</PublishDropdownButtonFeature>
	`,
};
