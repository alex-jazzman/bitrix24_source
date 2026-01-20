import './header-logo.css';
import { useLoc } from '../../../../shared/composables';
import type { GetMessage } from '../../../../shared/composables';

type HeaderLogoSetup = {
	getMessage: GetMessage
};

// @vue/component
export const HeaderLogo = {
	name: 'header-logo',
	setup(): HeaderLogoSetup
	{
		const { getMessage } = useLoc();

		return {
			getMessage,
		};
	},
	template: `
		<div class="editor-chart-catalog-header-logo">
			<span class="ui-node-catalog-header__logo-text">
				{{ getMessage('BIZPROCDESIGNER_EDITOR_LOGO_TEXT') }}
			</span>
		</div>
	`,
};
