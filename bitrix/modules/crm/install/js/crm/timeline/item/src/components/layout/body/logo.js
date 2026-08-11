import { Text } from 'main.core';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { Action } from '../../../action';

const ICON_TO_BICON_MAP = Object.freeze({
	'call': Outline.PHONE_UP,
	'call-default': Outline.PHONE_UP,
	'call-incoming': Outline.PHONE_IN,
	'call-outgoing': Outline.PHONE_OUT,
	'mail-income-unread': Outline.MAIL,
	'mail-income-read': Outline.MAIL_OPEN,
	'mail-outcome': Outline.MAIL_SEND,
	'email': Outline.MAIL,
	'document': Outline.FILE,
	'document-signed': Outline.DOCUMENT_SIGN,
	'document-print': Outline.DOCUMENT_PRINT,
	'document-addition': Outline.FORM,
	'document-draft': Outline.FILE,
	'shop': Outline.PACKAGE,
	'shop-eye': Outline.SEEN_ITEMS,
	'list-check': Outline.CHECK_LIST,
	'check': Outline.SEEN_ITEMS,
	'sms': Outline.SMS,
	'comment': Outline.MESSAGE,
	'openline': Outline.MESSAGES,
	'channel-chat': Outline.OPEN_CHANNELS,
	'channel-whatsapp': Outline.WHATSAPP,
	'channel-web-form': Outline.CRM_FORM,
	'task-activity': Outline.TASK,
	'unread-comment': Outline.NEW_MESSAGE,
	'bank-card': Outline.BANK_CARD,
	'calendar-share': Outline.CALENDAR_SHARE,
	'delivery': Outline.DELIVERY,
	'notification': Outline.NOTIFICATION,
	'repeat-sale': Outline.REPEAT_SALES,
	'bizproc': Outline.BUSINES_PROCESS_STAGES,
	'bizproc-task': Outline.BUSINES_PROCESS_STAGES,
});

export const Logo = {
	components: {
		BIcon,
	},
	props: {
		type: String,
		addIcon: String,
		addIconType: String,
		icon: String,
		iconType: String,
		backgroundUrl: String,
		backgroundSize: Number,
		inCircle: {
			type: Boolean,
			required: false,
			default: false,
		},
		action: Object,
	},
	data() {
		return {
			currentIcon: this.icon,
		}
	},
	computed: {
		className(): string
		{
			return [
				'crm-timeline__card-logo',
				`--${this.type}`, {
				'--clickable': this.action,
				}
			];
		},

		iconClassname()
		{
			return [
				'crm-timeline__card-logo_icon',
				`--${this.currentIcon}`,
				{
					'--in-circle': this.inCircle,
					[`--type-${this.iconType}`]: !!this.iconType && !this.backgroundUrl,
					'--custom-bg': !!this.backgroundUrl,
				},
			];
		},

		addIconClassname() {
			return [
				'crm-timeline__card-logo_add-icon',
				`--type-${this.addIconType}`,
				`--icon-${this.addIcon}`
			]
		},

		iconInteriorStyle()
		{
			const result = {};

			if (this.backgroundUrl)
			{
				result.backgroundImage = 'url(' + encodeURI(Text.encode(this.backgroundUrl)) + ')';
			}

			if (this.backgroundSize)
			{
				result.backgroundSize = parseInt(this.backgroundSize) + 'px';
			}

			return result;
		},

		useBIcon(): boolean
		{
			return ICON_TO_BICON_MAP.hasOwnProperty(this.currentIcon) && !this.backgroundUrl;
		},

		bIconName(): string
		{
			return ICON_TO_BICON_MAP[this.currentIcon] || '';
		},

		bIconColor(): string
		{
			if (this.iconType === 'failure')
			{
				return 'var(--ui-color-accent-main-alert)';
			}

			if (this.iconType === 'secondary')
			{
				return 'var(--ui-color-background-secondary)';
			}

			return 'var(--ui-color-accent-main-primary-alt-2)';
		},
	},
	watch: {
		icon(newIcon): void
		{
			this.currentIcon = newIcon;
		}
	},
	methods: {
		executeAction() {
			if (!this.action)
			{
				return;
			}

			const action = new Action(this.action);
			action.execute(this);
		},
		setIcon(icon: String) {
			this.currentIcon = icon;
		}
	},
	template: `
		<div :class="className" @click="executeAction">
			<div class="crm-timeline__card-logo_content">
				<div :class="iconClassname">
					<BIcon
						v-if="useBIcon"
						:name="bIconName"
						:size="48"
						:color="bIconColor"
					/>
					<i v-else :style="iconInteriorStyle"></i>
				</div>
				<div :class="addIconClassname" v-if="addIcon">
					<i></i>
				</div>
			</div>
		</div>
	`
};
