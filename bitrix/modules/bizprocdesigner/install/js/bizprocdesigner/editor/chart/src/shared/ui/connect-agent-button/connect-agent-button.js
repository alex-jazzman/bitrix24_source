import { FeaturePromotersRegistry } from 'ui.info-helper';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { BInput, InputDesign } from 'ui.system.input.vue';
import { Alert } from 'ui.system.alert.vue';
import { AlertDesign } from 'ui.system.alert';
import { Popup } from 'ui.vue3.components.popup';
import { Button } from 'ui.vue3.components.button';
import { ButtonSize, AirButtonStyle } from 'ui.buttons';
import { MessageBox } from 'ui.dialogs.messagebox';
import { UI } from 'ui.notification';

import { useLoc } from '../../composables';
import { handleResponseError, formatExpiration } from '../../utils';
import { connectAgent, revokeAgent, regenerateAgent, agentStatus } from '../../api/agent-webhook';

import './connect-agent-button.css';

const UPSELL_PROMOTER_CODE = 'ai_assistant';

type ConnectCommands = {
	claude: string,
	codex: string,
	universal: string,
};

// @vue/component
export const ConnectAgentButton = {
	name: 'ConnectAgentButton',
	components: {
		BIcon,
		BInput,
		Alert,
		Popup,
		Button,
	},
	props: {
		templateId: {
			type: Number,
			default: 0,
		},
		locked: {
			type: Boolean,
			default: false,
		},
	},
	setup(): Object
	{
		const { getMessage } = useLoc();

		return {
			getMessage,
			outline: Outline,
			inputDesign: InputDesign,
			alertDesign: AlertDesign,
			buttonSize: ButtonSize,
			buttonStyle: AirButtonStyle,
		};
	},
	data(): {
		isLoading: boolean,
		isPopupShown: boolean,
		command: string,
		connected: boolean,
		expiresAt: ?number,
		isUrlInvalidated: boolean,
	}
	{
		return {
			isLoading: false,
			isPopupShown: false,
			command: '',
			connected: false,
			expiresAt: null,
			isUrlInvalidated: false,
		};
	},
	computed: {
		popupOptions(): Object
		{
			return {
				bindElement: this.$refs.button,
				width: 460,
				autoHide: true,
				closeByEsc: true,
				animation: 'fading',
				offsetTop: 6,
				ariaLabel: this.getMessage('BIZPROCDESIGNER_EDITOR_CONNECT_AGENT_POPUP_TITLE'),
			};
		},
		statusText(): string
		{
			return formatExpiration(this.expiresAt, this.getMessage);
		},
		hintText(): string
		{
			if (this.command)
			{
				return this.getMessage('BIZPROCDESIGNER_EDITOR_CONNECT_AGENT_POPUP_HINT');
			}

			if (this.connected)
			{
				return this.getMessage('BIZPROCDESIGNER_EDITOR_CONNECT_AGENT_POPUP_HINT_CONNECTED');
			}

			return this.getMessage('BIZPROCDESIGNER_EDITOR_CONNECT_AGENT_POPUP_HINT_CONNECT');
		},
		urlInvalidatedText(): string
		{
			if (this.command)
			{
				return this.getMessage('BIZPROCDESIGNER_EDITOR_CONNECT_AGENT_URL_INVALIDATED_WARNING');
			}

			return this.getMessage('BIZPROCDESIGNER_EDITOR_CONNECT_AGENT_URL_INVALIDATED_WARNING_REVOKE');
		},
		commandRows(): number
		{
			if (!this.command)
			{
				return 3;
			}

			// popup 460px - paddings (32px) - input paddings/copy-icon (~40px) ≈ 55 chars/row
			const charsPerRow = 55;
			const rows = this.command
				.split('\n')
				.reduce(
					(total, line) => total + Math.max(1, Math.ceil(line.length / charsPerRow)),
					0,
				)
			;

			return Math.min(rows + 1, 10);
		},
	},
	watch: {
		templateId(): void
		{
			this.command = '';
			this.connected = false;
			this.expiresAt = null;
			this.isUrlInvalidated = false;
			this.isPopupShown = false;
		},
	},
	methods: {
		async handleClick(): Promise<void>
		{
			if (this.locked)
			{
				FeaturePromotersRegistry.getPromoter({ code: UPSELL_PROMOTER_CODE })?.show();

				return;
			}

			if (this.isLoading || this.templateId <= 0)
			{
				return;
			}

			this.isLoading = true;

			// The active template is a store-driven prop and may switch while the
			// request is in flight. Remember the template this call belongs to and
			// drop the result if the editor moved on, so another template's status
			// or secret never lands in the popup and never reopens it.
			const tid = this.templateId;

			try
			{
				const response = await agentStatus(tid);

				if (this.templateId !== tid)
				{
					return;
				}

				this.connected = Boolean(response?.data?.connected);
				this.expiresAt = response?.data?.expiresAt ?? null;
				this.command = '';
				this.isUrlInvalidated = false;
				this.isPopupShown = true;
			}
			catch (response)
			{
				handleResponseError(response);
			}
			finally
			{
				this.isLoading = false;
			}
		},
		async handleConnect(): Promise<void>
		{
			if (this.isLoading || this.templateId <= 0)
			{
				return;
			}

			this.isLoading = true;
			const tid = this.templateId;

			try
			{
				const response = await connectAgent(tid);

				if (this.templateId !== tid)
				{
					return;
				}

				const commands: ?ConnectCommands = response?.data?.commands;
				if (!commands?.universal)
				{
					// A successful response may still carry the secret webhook URL
					// in commands.claude/codex; never pass it to the logging helper.
					this.notifyGenericError();

					return;
				}

				this.command = commands.universal;
				this.connected = Boolean(response?.data?.connected);
				this.expiresAt = response?.data?.expiresAt ?? null;
				this.isUrlInvalidated = false;
			}
			catch (response)
			{
				handleResponseError(response);
			}
			finally
			{
				this.isLoading = false;
				if (this.templateId === tid)
				{
					this.isPopupShown = true;
				}
			}
		},
		handleRegenerate(): void
		{
			if (this.isLoading || this.templateId <= 0)
			{
				return;
			}

			// The confirm dialog opens over the popup: an autoHide click on it
			// counts as a click outside the popup and would destroy it together
			// with the fresh command. Freeze the popup while the dialog is open,
			// unfreeze once it closes.
			this.freeze();

			MessageBox.confirm(
				this.getMessage('BIZPROCDESIGNER_EDITOR_CONNECT_AGENT_REGENERATE_CONFIRM'),
				this.getMessage('BIZPROCDESIGNER_EDITOR_CONNECT_AGENT_POPUP_TITLE'),
				async (messageBox) => {
					messageBox.close();

					try
					{
						await this.regenerate();
					}
					finally
					{
						this.unfreeze();
					}
				},
				this.getMessage('BIZPROCDESIGNER_EDITOR_CONNECT_AGENT_BTN_REGENERATE'),
				(messageBox) => {
					messageBox.close();
					this.unfreeze();
				},
				this.getMessage('BIZPROCDESIGNER_EDITOR_FRAME_BLOCK_BUTTON_ABORT'),
			);
		},
		async regenerate(): Promise<void>
		{
			this.isLoading = true;
			const tid = this.templateId;

			try
			{
				const response = await regenerateAgent(tid);

				if (this.templateId !== tid)
				{
					return;
				}

				const commands: ?ConnectCommands = response?.data?.commands;
				if (!commands?.universal)
				{
					// A successful response may still carry the secret webhook URL
					// in commands.claude/codex; never pass it to the logging helper.
					this.notifyGenericError();

					return;
				}

				this.command = commands.universal;
				this.connected = true;
				this.expiresAt = response?.data?.expiresAt ?? null;
				this.isUrlInvalidated = true;
			}
			catch (response)
			{
				handleResponseError(response);
			}
			finally
			{
				this.isLoading = false;
			}
		},
		async handleRevoke(): Promise<void>
		{
			if (this.isLoading || this.templateId <= 0)
			{
				return;
			}

			this.isLoading = true;
			const tid = this.templateId;

			try
			{
				const response = await revokeAgent(tid);

				if (this.templateId !== tid)
				{
					return;
				}

				if (response?.data?.connected !== false)
				{
					handleResponseError(response);

					return;
				}

				this.command = '';
				this.connected = false;
				this.expiresAt = null;
				this.isUrlInvalidated = true;
			}
			catch (response)
			{
				handleResponseError(response);
			}
			finally
			{
				this.isLoading = false;
			}
		},
		freeze(): void
		{
			this.$refs.popup?.freeze();
		},
		unfreeze(): void
		{
			this.$refs.popup?.unfreeze();
		},
		handlePopupClose(): void
		{
			this.isPopupShown = false;
		},
		notifyGenericError(): void
		{
			UI.Notification.Center.notify({
				content: this.getMessage('BIZPROCDESIGNER_EDITOR_CONNECT_AGENT_ERROR'),
				autoHideDelay: 4000,
			});
		},
	},
	template: `
		<button
			ref="button"
			class="bp-connect-agent-button"
			data-testid="bizprocdesigner-connect-agent-button"
			:class="{
				'bp-connect-agent-button--loading': isLoading,
				'bp-connect-agent-button--locked': locked,
			}"
			:disabled="isLoading && !locked"
			:title="locked
				? getMessage('BIZPROCDESIGNER_CONNECT_AGENT_LOCKED_HINT')
				: getMessage('BIZPROCDESIGNER_EDITOR_CONNECT_AGENT_BUTTON_TITLE')"
			:aria-label="locked
				? getMessage('BIZPROCDESIGNER_CONNECT_AGENT_LOCKED_HINT')
				: getMessage('BIZPROCDESIGNER_EDITOR_CONNECT_AGENT_BUTTON_TITLE')"
			@click="handleClick"
		>
			<BIcon
				:name="outline.AI_ROBOT"
				:size="24"
				color="var(--ui-color-base-4)"
				aria-hidden="true"
			/>
		</button>
		<Popup
			ref="popup"
			v-if="isPopupShown"
			:options="popupOptions"
			@close="handlePopupClose"
		>
			<div
				class="bp-connect-agent-popup"
				data-testid="bizprocdesigner-connect-agent-popup"
			>
				<div class="bp-connect-agent-popup__title">
					{{ getMessage('BIZPROCDESIGNER_EDITOR_CONNECT_AGENT_POPUP_TITLE') }}
				</div>
				<div
					v-if="hintText"
					class="bp-connect-agent-popup__hint"
				>
					{{ hintText }}
				</div>
				<div
					class="bp-connect-agent-popup__status"
					data-testid="bizprocdesigner-connect-agent-status"
					aria-live="polite"
				>
					{{ statusText }}
				</div>
				<BInput
					v-if="command"
					data-testid="bizprocdesigner-connect-agent-command"
					:modelValue="command"
					:design="inputDesign.LightGrey"
					:rowsQuantity="commandRows"
					resize="none"
					readonly
					copyable
					stretched
				/>
				<Alert
					v-if="command"
					:design="alertDesign.tintedWarning"
				>
					{{ getMessage('BIZPROCDESIGNER_EDITOR_CONNECT_AGENT_POPUP_SECRET_WARNING') }}
				</Alert>
				<Alert
					v-if="isUrlInvalidated"
					:design="alertDesign.tintedAlert"
					aria-live="polite"
				>
					{{ urlInvalidatedText }}
				</Alert>
				<div class="bp-connect-agent-popup__actions">
					<Button
						v-if="!connected"
						:text="getMessage('BIZPROCDESIGNER_EDITOR_CONNECT_AGENT_BTN_CONNECT')"
						:style="buttonStyle.FILLED"
						:size="buttonSize.SMALL"
						:disabled="isLoading"
						:dataset="{ testid: 'bizprocdesigner-connect-agent-connect-btn' }"
						@click="handleConnect"
					/>
					<Button
						v-if="connected"
						:text="getMessage('BIZPROCDESIGNER_EDITOR_CONNECT_AGENT_BTN_REGENERATE')"
						:style="buttonStyle.OUTLINE_ACCENT_2"
						:size="buttonSize.SMALL"
						:disabled="isLoading"
						:dataset="{ testid: 'bizprocdesigner-connect-agent-regenerate-btn' }"
						@click="handleRegenerate"
					/>
					<Button
						v-if="connected"
						:text="getMessage('BIZPROCDESIGNER_EDITOR_CONNECT_AGENT_BTN_REVOKE')"
						:style="buttonStyle.PLAIN"
						:size="buttonSize.SMALL"
						:disabled="isLoading"
						:dataset="{ testid: 'bizprocdesigner-connect-agent-revoke-btn' }"
						@click="handleRevoke"
					/>
				</div>
			</div>
		</Popup>
	`,
};
