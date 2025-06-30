import type { BitrixVueComponentProps } from 'ui.vue3';
import { Popup as MainPopup, PopupManager, type PopupOptions } from 'main.popup';
import { BIcon, Set } from 'ui.icon-set.api.vue';

export const DeletionWarningPopup: BitrixVueComponentProps = {
	emits: ['confirm', 'close'],
	props: {},
	data(): Object
	{
		return {
			popupInstance: null,
			popupId: 'biconnector-dashboard-deletion',
			dontShow: false,
		};
	},
	computed: {
		popupOptions(): PopupOptions
		{
			return {
				id: this.popupId,
				content: this.$refs.content,
				width: 400,
				padding: 18,
				autoHide: true,
				overlay: true,
				events: {
					onPopupClose: this.closePopup,
					onPopupDestroy: this.closePopup,
				},
				fixed: true,
			};
		},
		set(): Set
		{
			return Set;
		},
	},
	methods: {
		closePopup(): void
		{
			PopupManager.getPopupById(this.popupId)?.destroy();
			this.popupInstance = null;
			this.$emit('close');
		},
		onConfirm(): void
		{
			this.$emit('confirm', { dontShow: this.dontShow });
			this.closePopup();
		},
		getPopupText(): string
		{
			return this.$Bitrix.Loc.getMessage('BI_GROUP_SAVE_WARN_TEXT')
				.replace('[link]', '<a class="ui-link ui-link-primary ui-link-dashed group-warn-popup-box-link" onclick="top.BX.Helper.show(`redirect=detail&code=25556500`)">')
				.replace('[/link]', '</a>')
			;
		},
	},
	mounted(): void
	{
		if (!this.popupInstance)
		{
			this.popupInstance = new MainPopup(this.popupOptions);
		}

		this.popupInstance.show();
	},
	beforeUnmount(): void
	{
		this.closePopup();
	},
	components: {
		BIcon,
	},
	template: `
		<div ref="content" class="group-warn-popup">
			<div class="group-warn-popup-title-block">
				<div class="group-warn-popup-title">{{ $Bitrix.Loc.getMessage('BI_GROUP_SAVE_WARN_TITLE') }}</div>
				<BIcon
					:name="set.CROSS_30"
					:size="18"
					color="#BDC1C6"
					:class="'group-warn-popup-close'"
					@click="closePopup"
				></BIcon>
			</div>
			<div class="group-warn-popup-box" v-html="getPopupText()"></div>
			<label class="group-warn-popup-checkbox">
				<input type="checkbox" v-model="dontShow"/>
				<span class="group-warn-popup-checkbox-text">{{ $Bitrix.Loc.getMessage('BI_GROUP_SAVE_WARN_DONT_SHOW') }}</span>
			</label>
			<div class="group-warn-popup-separator"></div>
			<div class="group-warn-popup-buttons">
				<div class="ui-btn ui-btn-sm ui-btn-primary" @click="onConfirm">{{ $Bitrix.Loc.getMessage('BI_GROUP_SAVE_WARN_YES') }}</div>
				<div class="ui-btn ui-btn-sm ui-btn-light-border" @click="closePopup">{{ $Bitrix.Loc.getMessage('BI_GROUP_SAVE_WARN_NO') }}</div>
			</div>
		</div>
	`,
};
