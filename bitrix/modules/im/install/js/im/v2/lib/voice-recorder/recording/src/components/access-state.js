import { Loc } from 'main.core';
import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';
import { TextMd, TextSm } from 'ui.system.typography.vue';

import { openHelpdeskArticle } from 'im.v2.lib.helpdesk';

import { RecordingErrorCode } from '../const/recording-state';

import './css/recording-panel.css';

const ICON_SIZE = 24;

// the article walking the user through the browsers and the desktop application is named here and
// nowhere else: it is written by the support team, and its identifier is a placeholder until then
const HELP_ARTICLE_CODE = '00000000';

// the button stays out of the screen while the code above is a placeholder: an offer leading to an
// article that does not exist is worse than no offer. Flip to true once the article is written
const HELP_ARTICLE_AVAILABLE = false;

// every refusal is repaired in a place of its own, so every refusal names that place itself. The
// help article is offered only where a permission stands in the way: a missing or occupied
// device is not repaired through settings at all
const AccessStateView = {
	[RecordingErrorCode.accessDeniedInSession]: {
		icon: OutlineIcons.MICROPHONE_OFF,
		titlePhrase: 'IM_TEXTAREA_VOICE_RECORDER_DENIED_SESSION_TITLE',
		textPhrase: 'IM_TEXTAREA_VOICE_RECORDER_DENIED_SESSION_TEXT',
		withHelp: true,
	},
	[RecordingErrorCode.accessDeniedPermanently]: {
		icon: OutlineIcons.LOCK_2,
		titlePhrase: 'IM_TEXTAREA_VOICE_RECORDER_DENIED_FOREVER_TITLE',
		textPhrase: 'IM_TEXTAREA_VOICE_RECORDER_DENIED_FOREVER_TEXT',
		withHelp: true,
	},
	[RecordingErrorCode.deviceNotFound]: {
		icon: OutlineIcons.MICROPHONE_OFF,
		titlePhrase: 'IM_TEXTAREA_VOICE_RECORDER_DEVICE_NOT_FOUND_TITLE',
		textPhrase: 'IM_TEXTAREA_VOICE_RECORDER_DEVICE_NOT_FOUND_TEXT',
		withHelp: false,
	},
	[RecordingErrorCode.deviceBusy]: {
		icon: OutlineIcons.MICROPHONE_OFF,
		titlePhrase: 'IM_TEXTAREA_VOICE_RECORDER_DEVICE_BUSY_TITLE',
		textPhrase: 'IM_TEXTAREA_VOICE_RECORDER_DEVICE_BUSY_TEXT',
		withHelp: false,
	},
	[RecordingErrorCode.accessDeniedBySystem]: {
		icon: OutlineIcons.DESKTOP_MACOS,
		titlePhrase: 'IM_TEXTAREA_VOICE_RECORDER_DENIED_BY_SYSTEM_TITLE',
		textPhrase: 'IM_TEXTAREA_VOICE_RECORDER_DENIED_BY_SYSTEM_TEXT',
		withHelp: true,
	},
};

// the announcer of the page drops what a message has past its own limit, and the way out of a
// refusal stands at the end of the text: the parts are separated here and read out one by one
export const ANNOUNCEMENT_SEPARATOR = '\n';

// announced with the very words shown on the screen: a state read out differently confuses
export const getAccessStateAnnouncement = (code: string): string => {
	const { titlePhrase, textPhrase } = AccessStateView[code];

	return [Loc.getMessage(titlePhrase), Loc.getMessage(textPhrase)].join(ANNOUNCEMENT_SEPARATOR);
};

// @vue/component
export const AccessState = {
	name: 'VoiceRecordingAccessState',
	components: { BIcon, TextMd, TextSm },
	props:
	{
		code: {
			type: String,
			required: true,
		},
	},
	emits: ['close'],
	computed:
	{
		ICON_SIZE: () => ICON_SIZE,
		view(): Object
		{
			return AccessStateView[this.code];
		},
		title(): string
		{
			return this.loc(this.view.titlePhrase);
		},
		text(): string
		{
			return this.loc(this.view.textPhrase);
		},
		withHelp(): boolean
		{
			return HELP_ARTICLE_AVAILABLE && this.view.withHelp;
		},
		helpText(): string
		{
			return this.loc('IM_TEXTAREA_VOICE_RECORDER_ACCESS_HELP');
		},
		// the visible text leans on the description next to it, which a pass over the controls alone
		// never reaches: the accessible name says what the button leads to on its own
		helpLabel(): string
		{
			return this.loc('IM_TEXTAREA_VOICE_RECORDER_ACCESS_HELP_LABEL');
		},
		closeText(): string
		{
			return this.loc('IM_TEXTAREA_VOICE_RECORDER_ACCESS_CLOSE');
		},
	},
	methods:
	{
		openHelpArticle()
		{
			openHelpdeskArticle(HELP_ARTICLE_CODE);
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-im-voice-recording-access" data-testid="im-textarea-recording-access">
			<div class="bx-im-voice-recording-access__message">
				<div class="bx-im-voice-recording-access__icon">
					<BIcon :name="view.icon" :size="ICON_SIZE" />
				</div>
				<div class="bx-im-voice-recording-access__text">
					<TextMd
						accent
						tag="div"
						data-testid="im-textarea-recording-access-title"
					>{{ title }}</TextMd>
					<TextSm
						tag="div"
						class="bx-im-voice-recording-access__description"
						data-testid="im-textarea-recording-access-text"
					>{{ text }}</TextSm>
				</div>
			</div>
			<div class="bx-im-voice-recording-access__actions">
				<button
					v-if="withHelp"
					:aria-label="helpLabel"
					class="bx-im-voice-recording-access__help"
					type="button"
					tabindex="0"
					data-testid="im-textarea-recording-access-help"
					@click="openHelpArticle"
				>
					<TextSm>{{ helpText }}</TextSm>
				</button>
				<button
					class="bx-im-voice-recording-access__close"
					type="button"
					tabindex="0"
					data-testid="im-textarea-recording-access-close"
					@click="$emit('close')"
				>
					<TextSm>{{ closeText }}</TextSm>
				</button>
			</div>
		</div>
	`,
};
