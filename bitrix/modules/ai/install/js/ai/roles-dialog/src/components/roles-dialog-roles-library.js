import { BIcon } from 'ui.icon-set.api.vue';
import { Actions, Main, Outline } from 'ui.icon-set.api.core';
import { Runtime, Event } from 'main.core';
import type { AnalyticsOptions } from 'ui.analytics';
import '../css/roles-dialog-roles-library.css';

export const RolesDialogRolesLibrary = {
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
		async sendAnalytics(): void
		{
			try
			{
				const { sendData } = await Runtime.loadExtension('ui.analytics');

				const sendDataOptions: AnalyticsOptions = {
					event: 'open_list',
					status: 'success',
					tool: 'ai',
					category: 'roles_saving',
					c_section: 'roles_picker',
				};

				sendData(sendDataOptions);
			}
			catch (e)
			{
				console.error('AI: RolesDialog: Can\'t send analytics', e);
			}
		},

		handleClick(): ?Function
		{
			if (BX.SidePanel)
			{
				this.sendAnalytics();
				BX.SidePanel.Instance.open(
					'/bitrix/components/bitrix/ai.role.library.grid/slider.php',
					{
						cacheable: false,
						events: {
							onCloseStart: () => {
								Event.EventEmitter.emit('update');
							},
						},
					},
				);
			}
			else
			{
				window.location.href = '/bitrix/components/bitrix/ai.prompt.library.grid/slider.php';
			}
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
};
