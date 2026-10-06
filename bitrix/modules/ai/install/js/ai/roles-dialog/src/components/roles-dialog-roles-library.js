import { BIcon } from 'ui.icon-set.api.vue';
import { Actions, Main, Outline } from 'ui.icon-set.api.core';
import '../css/roles-dialog-roles-library.css';

export const getRolesDialogRolesLibrary = (onOpenRolesLibrary: () => void) => ({
	components: {
		BIcon,
	},
	props: {
		useRedesign: {
			type: Boolean,
			required: false,
			default: false,
		},
	},
	computed: {
		chevronRightIconName(): string
		{
			return Actions.CHEVRON_RIGHT;
		},
		rolesLibraryIconName(): string
		{
			return this.useRedesign ? Outline.ROLES_LIBRARY : Main.ROLES_LIBRARY;
		},
		rolesLibraryIconSize(): number
		{
			return this.useRedesign ? 24 : 32;
		},
	},
	methods: {
		handleClick(): void
		{
			onOpenRolesLibrary();
		},
	},
	template: `
		<div @click="handleClick" class="ai__roles-dialog_roles-library-wrapper">
			<div class="ai__roles-dialog_roles-library">
				<div class="ai__roles-dialog_roles-library-inner">
				<div class="ai__roles-dialog_roles-library-title-wrapper">
					<b-icon :size="rolesLibraryIconSize" :name="rolesLibraryIconName"></b-icon>
					<span class="ai__roles-dialog_roles-library-title">
						{{ $Bitrix.Loc.getMessage('AI_COPILOT_ROLES_LIBRARY_TITLE') }}
					</span>
					<div class="ai__roles-dialog_roles-library-label-new">
					</div>
				</div>
					<b-icon :size="16" :name="chevronRightIconName"></b-icon>
				</div>
			</div>
		</div>
	`,
});
