// @vue/component
export const Preset = {
	props: {
		presetData: {
			type: Object,
			default: () => ({}),
		},
		currentPresetId: {
			type: String,
			default: 'social',
		},
	},

	data(): Object
	{
		return {
			PRESET_ID: {
				CRM: 'crm',
				TASKS: 'tasks',
				SOCIAL: 'social',
				SITES: 'sites',
				SYNC: 'sync',
			},
			activePresetId: this.currentPresetId,
		};
	},
	computed: {
		isCurrentPresetCrm(): Boolean
		{
			return this.activePresetId === this.PRESET_ID.CRM;
		},
		isCurrentPresetTasks(): Boolean
		{
			return this.activePresetId === this.PRESET_ID.TASKS;
		},
		isCurrentPresetSocial(): Boolean
		{
			return this.activePresetId === this.PRESET_ID.SOCIAL;
		},
		isCurrentPresetLanding(): Boolean
		{
			return this.activePresetId === this.PRESET_ID.SITES;
		},
		isCurrentPresetSync(): Boolean
		{
			return this.activePresetId === this.PRESET_ID.SYNC;
		},
	},
	methods: {
		setCurrentPreset(presetId)
		{
			this.activePresetId = presetId;
		},
	},
	template: `
		<form method="POST" name="left-menu-preset-form">
			<div class="left-menu-popup-header">
				<span class="left-menu-popup-header-item" id="preset-popup-title">
					{{ $Bitrix.Loc.getMessage('MENU_PRESET_TITLE') }}
				</span>
			</div><!--left-menu-popup-header-->
			<div class="left-menu-popup-description">
				<span class="left-menu-popup-description-item">
					{{ $Bitrix.Loc.getMessage('MENU_PRESET_DESC') }}
				</span>
			</div><!--left-menu-popup-description-->
			<div class="left-menu-popup-card-container" role="radiogroup" aria-labelledby="preset-popup-title">
				<template v-if="presetData.CRM_PRESET_AVAILABLE">
					<label 
						class="left-menu-popup-card-item js-left-menu-preset-item"
						:class="{'left-menu-popup-selected': isCurrentPresetCrm}"
						for="presetTypeCrm"
						@click="setCurrentPreset(PRESET_ID.CRM)"
					>
						<div class="left-menu-popup-card-item-title">
							{{ $Bitrix.Loc.getMessage('MENU_PRESET_CRM_TITLE') }}
						</div>
						<div class="left-menu-popup-card-item-icon-box left-menu-popup-icon-crm" aria-hidden="true">
							<div class="left-menu-popup-card-item-icon"></div>
						</div>
						<div class="left-menu-popup-card-item-info" id="presetCrmDesc">
							{{ $Bitrix.Loc.getMessage('MENU_PRESET_CRM_DESC11') }}
						</div>
						<div class="left-menu-popup-card-item-description">
							{{ $Bitrix.Loc.getMessage('MENU_PRESET_CRM_DESC2') }}
						</div>
						<input 
							type="radio" 
							name="presetType"
							:value="PRESET_ID.CRM"
							id="presetTypeCrm" 
							class="menu-visually-hidden"
							aria-describedby="presetCrmDesc"
							:checked="isCurrentPresetCrm"
						>
					</label>
				</template>

				<template v-if="presetData.TASKS_PRESET_AVAILABLE">
					<label 
						class="left-menu-popup-card-item js-left-menu-preset-item"
						:class="{'left-menu-popup-selected': isCurrentPresetTasks}"
						for="presetTypeTasks"
						@click="setCurrentPreset(PRESET_ID.TASKS)"
					>
						<div class="left-menu-popup-card-item-title">
							{{ $Bitrix.Loc.getMessage('MENU_PRESET_TASKS_TITLE1') }}
						</div>
						<div class="left-menu-popup-card-item-icon-box left-menu-popup-icon-task" aria-hidden="true">
							<div class="left-menu-popup-card-item-icon"></div>
						</div>
						<div class="left-menu-popup-card-item-info" id="presetTasksDesc">
							{{ $Bitrix.Loc.getMessage('MENU_PRESET_TASKS_DESC11') }}
						</div>
						<div class="left-menu-popup-card-item-description">
							{{ $Bitrix.Loc.getMessage('MENU_PRESET_TASKS_DESC2') }}
						</div>
						<input 
							type="radio" 
							name="presetType"
							:value="PRESET_ID.TASKS"
							id="presetTypeTasks"
							class="menu-visually-hidden"
							aria-describedby="presetTasksDesc"
							:checked="isCurrentPresetTasks"
						>
					</label>
				</template>

				<label 
					class="left-menu-popup-card-item js-left-menu-preset-item"
					:class="{'left-menu-popup-selected': isCurrentPresetSocial}"
					for="presetTypeSocial"
					@click="setCurrentPreset(PRESET_ID.SOCIAL)"
				>
					<div class="left-menu-popup-card-item-title">
						{{ $Bitrix.Loc.getMessage('MENU_PRESET_SOCIAL_TITLE1_1') }}
					</div>
					<div class="left-menu-popup-card-item-icon-box left-menu-popup-icon-communication"
						 aria-hidden="true">
						<div class="left-menu-popup-card-item-icon"></div>
					</div>
					<div class="left-menu-popup-card-item-info" id="presetSocialDesc">
						{{ $Bitrix.Loc.getMessage('MENU_PRESET_SOCIAL_DESC11') }}
					</div>
					<div class="left-menu-popup-card-item-description">
						{{ $Bitrix.Loc.getMessage('MENU_PRESET_SOCIAL_DESC2') }}
					</div>
					<input 
						type="radio" 
						name="presetType"
						:value="PRESET_ID.SOCIAL"
						id="presetTypeSocial"
						class="menu-visually-hidden"
						aria-describedby="presetSocialDesc"
						:checked="isCurrentPresetSocial"
					>
				</label>

				<template v-if="presetData.SITES_PRESET_AVAILABLE">
					<label 
						class="left-menu-popup-card-item js-left-menu-preset-item"
						:class="{'left-menu-popup-selected': isCurrentPresetLanding}"
						for="presetTypeSites"
						@click="setCurrentPreset(PRESET_ID.SITES)"
					>
						<div class="left-menu-popup-card-item-title">
							{{ $Bitrix.Loc.getMessage('MENU_PRESET_SITES_TITLE') }}
						</div>
						<div class="left-menu-popup-card-item-icon-box left-menu-popup-icon-website" aria-hidden="true">
							<div class="left-menu-popup-card-item-icon"></div>
						</div>
						<div class="left-menu-popup-card-item-info" id="presetSitesDesc">
							{{ $Bitrix.Loc.getMessage('MENU_PRESET_SITES_DESC1') }}
						</div>
						<div class="left-menu-popup-card-item-description">
							{{ $Bitrix.Loc.getMessage('MENU_PRESET_SITES_DESC2') }}
						</div>
						<input 
							type="radio" 
							name="presetType"
							:value="PRESET_ID.SITES"
							id="presetTypeSites"
							class="menu-visually-hidden"
							aria-describedby="presetSitesDesc"
							:checked="isCurrentPresetLanding"
						>	   
					</label>
				</template>

				<template v-if="presetData.SYNC_PRESET_AVAILABLE">
					<label
						class="left-menu-popup-card-item js-left-menu-preset-item"
						:class="{'left-menu-popup-selected': isCurrentPresetSync}"
						for="presetTypeSync"
						@click="setCurrentPreset(PRESET_ID.SYNC)"
					>
						<div class="left-menu-popup-card-item-title">
							{{ $Bitrix.Loc.getMessage('MENU_PRESET_SYNC_TITLE') }}
						</div>
						<div class="left-menu-popup-card-item-icon-box left-menu-popup-icon-sync" aria-hidden="true">
							<div class="left-menu-popup-card-item-icon"></div>
						</div>
						<div class="left-menu-popup-card-item-info" id="presetSyncDesc">
							{{ $Bitrix.Loc.getMessage('MENU_PRESET_SYNC_DESC1') }}
						</div>
						<div class="left-menu-popup-card-item-description">
							{{ $Bitrix.Loc.getMessage('MENU_PRESET_SYNC_DESC2') }}
						</div>
						<input
							type="radio"
							name="presetType"
							:value="PRESET_ID.SYNC"
							id="presetTypeSync"
							class="menu-visually-hidden"
							aria-describedby="presetSyncDesc"
							:checked="isCurrentPresetSync"
						>
					</label>
				</template>
			</div><!--left-menu-popup-card-container-->
		</form>
		<div class="left-menu-popup-border"></div>
	`,
};
