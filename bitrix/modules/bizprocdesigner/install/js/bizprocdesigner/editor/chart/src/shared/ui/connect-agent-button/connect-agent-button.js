import { FeaturePromotersRegistry } from 'ui.info-helper';
import { BIcon, Outline, Solid } from 'ui.icon-set.api.vue';
import 'ui.icon-set.solid';
import { BInput, InputDesign } from 'ui.system.input.vue';
import { Chip, ChipDesign, ChipSize } from 'ui.system.chip.vue';
import { HeadlineSm, TextSm, TextXs, Text2Xs } from 'ui.system.typography.vue';
import { Popup } from 'ui.vue3.components.popup';
import { RichLoc } from 'ui.vue3.components.rich-loc';
import { Button } from 'ui.vue3.components.button';
import { ButtonSize, AirButtonStyle } from 'ui.buttons';
import { MessageBox } from 'ui.dialogs.messagebox';
import { UI } from 'ui.notification';

import { useLoc } from '../../composables';
import { handleResponseError, formatExpiration } from '../../utils';
import { connectAgent, revokeAgent, regenerateAgent, agentStatus } from '../../api/agent-webhook';

import './connect-agent-button.css';

const UPSELL_PROMOTER_CODE = 'ai_assistant';

// Gap between the trigger and the popup: given to main.popup as the offset it places
// the popup by, and counted again in the ceiling the popup is held to.
const POPUP_OFFSET_TOP = 6;

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
		Chip,
		HeadlineSm,
		TextSm,
		TextXs,
		Text2Xs,
		Popup,
		RichLoc,
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
			solid: Solid,
			chipDesign: ChipDesign,
			chipSize: ChipSize,
			inputDesign: InputDesign,
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
				// The promo header is painted edge to edge, so the popup keeps no
				// padding of its own and rounds itself instead of the default 0.
				padding: 0,
				borderRadius: 'var(--ui-border-radius-lg)',
				autoHide: true,
				closeByEsc: true,
				animation: 'fading',
				offsetTop: POPUP_OFFSET_TOP,
				ariaLabel: this.getMessage('BIZPROCDESIGNER_EDITOR_CONNECT_AGENT_POPUP_TITLE'),
			};
		},
		statusText(): string
		{
			// The text and the design of the chip are read from the same source: the
			// server reports a connected agent whose token carries no expiration, and
			// a success-coloured chip saying "not connected" is what that used to give.
			if (!this.connected)
			{
				return this.getMessage('BIZPROCDESIGNER_EDITOR_CONNECT_AGENT_STATUS_NOT_CONNECTED');
			}

			if (!this.expiresAt)
			{
				return this.getMessage('BIZPROCDESIGNER_EDITOR_CONNECT_AGENT_STATUS_CONNECTED');
			}

			return formatExpiration(this.expiresAt, this.getMessage);
		},
		hintText(): string
		{
			// The promo header carries the value proposition, and a fresh command
			// is explained by the steps next to it. The only state left without
			// its own copy is a reopened popup of an already connected agent.
			if (this.connected && !this.command)
			{
				return this.getMessage('BIZPROCDESIGNER_EDITOR_CONNECT_AGENT_POPUP_HINT_CONNECTED');
			}

			return '';
		},
		gptIconGradient(): string
		{
			// The icon is a mask over a background, so the background takes a
			// gradient the same way it takes a color: BitrixGPT branding for the
			// AI marks of this popup, assembled from design tokens only.
			return [
				'linear-gradient(263.02deg,',
				'var(--ui-color-design-filled-bitrix-gpt-bg-gradient-5) 2.92%,',
				'var(--ui-color-design-filled-bitrix-gpt-bg-gradient-4) 25.99%,',
				'var(--ui-color-design-filled-bitrix-gpt-bg-gradient-3) 49.07%,',
				'var(--ui-color-design-filled-bitrix-gpt-bg-gradient-2) 76.77%,',
				'var(--ui-color-design-filled-bitrix-gpt-bg-gradient-1) 86%)',
			].join(' ');
		},
		watermarkGradient(): string
		{
			// The decorative layer is a step brighter than the tinted header, so it
			// reads as part of the surface: soft palette instead of opacity.
			return [
				'linear-gradient(135deg,',
				'var(--ui-color-accent-soft-blue-2) 0%,',
				'var(--ui-color-accent-soft-violet-2) 50%,',
				'var(--ui-color-accent-soft-red-2) 100%)',
			].join(' ');
		},
		statusChipDesign(): string
		{
			return this.connected ? ChipDesign.FilledSuccess : ChipDesign.Outline;
		},
		triggerIconColor(): string
		{
			// The muted state is a secondary token, not opacity on the whole button.
			if (this.locked || this.isLoading)
			{
				return 'var(--ui-color-base-5)';
			}

			if (this.isPopupShown)
			{
				return 'var(--ui-color-accent-main-primary)';
			}

			return 'var(--ui-color-base-4)';
		},
		benefits(): string[]
		{
			return [
				this.getMessage('BIZPROCDESIGNER_EDITOR_CONNECT_AGENT_BENEFIT_SCHEMA'),
				this.getMessage('BIZPROCDESIGNER_EDITOR_CONNECT_AGENT_BENEFIT_SETTINGS'),
				this.getMessage('BIZPROCDESIGNER_EDITOR_CONNECT_AGENT_BENEFIT_SCOPE'),
			];
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

			// popup 460px - paddings (44px) - step indent (36px) - input paddings
			// and copy icon (~52px) ≈ 48 chars/row
			const charsPerRow = 48;
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

			// The trigger is a toggle: a click on it while the popup is open closes
			// it instead of refetching the status and reopening the same popup.
			if (this.isPopupShown)
			{
				this.isPopupShown = false;

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
		/**
		 * The popup is rendered in document.body and opens downwards, so the room it may grow
		 * into is the viewport below its own top edge. Only that edge is measured here; the
		 * ceiling itself is a viewport expression in the stylesheet, so a window resized in
		 * HEIGHT while the popup is open re-fits it without a new measurement. Anything that
		 * moved the trigger itself would need one, and nothing here does: it sits in the
		 * toolbar pinned to the top of the editor shell, which neither scrolls with the page
		 * nor reflows with the width. Without the trigger there is nothing to measure from,
		 * and the stylesheet falls back to the whole viewport.
		 */
		getPopupStyle(): Object
		{
			const triggerEl = this.$refs.button;
			if (!triggerEl)
			{
				return {};
			}

			const popupTop = Math.round(triggerEl.getBoundingClientRect().bottom) + POPUP_OFFSET_TOP;

			return { '--bp-connect-agent-popup-top': `${popupTop}px` };
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
				'bp-connect-agent-button--active': isPopupShown,
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
				:color="triggerIconColor"
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
				:style="getPopupStyle()"
			>
				<div class="bp-connect-agent-popup__promo">
					<div class="bp-connect-agent-popup__promo-content">
						<div class="bp-connect-agent-popup__kicker">
							<BIcon
								:name="solid.AI_STARS"
								:size="18"
								:color="gptIconGradient"
								aria-hidden="true"
							/>
							<Text2Xs
								class="bp-connect-agent-popup__kicker-text"
								tag="div"
							>
								{{ getMessage('BIZPROCDESIGNER_EDITOR_CONNECT_AGENT_PROMO_KICKER') }}
							</Text2Xs>
						</div>
						<HeadlineSm tag="div">
							{{ getMessage('BIZPROCDESIGNER_EDITOR_CONNECT_AGENT_PROMO_TITLE') }}
						</HeadlineSm>
						<TextSm
							class="bp-connect-agent-popup__promo-text"
							tag="div"
						>
							{{ getMessage('BIZPROCDESIGNER_EDITOR_CONNECT_AGENT_PROMO_TEXT') }}
						</TextSm>
						<div
							class="bp-connect-agent-popup__status"
							data-testid="bizprocdesigner-connect-agent-status"
							aria-live="polite"
						>
							<Chip
								:design="statusChipDesign"
								:size="chipSize.Sm"
								:text="statusText"
								rounded
							/>
						</div>
					</div>
					<span
						class="bp-connect-agent-popup__watermark"
						aria-hidden="true"
					>
						<BIcon
							:name="outline.EARTH"
							:size="196"
							:color="watermarkGradient"
						/>
					</span>
					<span
						class="bp-connect-agent-popup__spark bp-connect-agent-popup__spark--lower"
						aria-hidden="true"
					>
						<BIcon
							:name="solid.AI_STARS"
							:size="28"
							:color="watermarkGradient"
						/>
					</span>
					<span
						class="bp-connect-agent-popup__spark bp-connect-agent-popup__spark--upper"
						aria-hidden="true"
					>
						<BIcon
							:name="solid.AI_STARS"
							:size="18"
							:color="watermarkGradient"
						/>
					</span>
				</div>
				<div
					class="bp-connect-agent-popup__body"
					data-testid="bizprocdesigner-connect-agent-popup-body"
				>
					<div
						v-if="isUrlInvalidated"
						class="bp-connect-agent-popup__warning"
						aria-live="polite"
					>
						<TextSm tag="div">{{ urlInvalidatedText }}</TextSm>
					</div>
					<div
						v-if="!connected"
						class="bp-connect-agent-popup__benefits"
					>
						<div
							v-for="benefit in benefits"
							:key="benefit"
							class="bp-connect-agent-popup__benefit"
						>
							<BIcon
								:name="solid.CHECK"
								:size="20"
								:color="gptIconGradient"
								aria-hidden="true"
							/>
							<TextSm tag="div">{{ benefit }}</TextSm>
						</div>
					</div>
					<template v-if="command">
						<div class="bp-connect-agent-popup__step">
							<TextXs
								class="bp-connect-agent-popup__step-number"
								tag="div"
								aria-hidden="true"
							>1</TextXs>
							<div class="bp-connect-agent-popup__step-content">
								<TextSm
									class="bp-connect-agent-popup__step-title"
									tag="div"
								>
									{{ getMessage('BIZPROCDESIGNER_EDITOR_CONNECT_AGENT_STEP_COPY_TITLE') }}
								</TextSm>
								<TextXs
									class="bp-connect-agent-popup__secret-note"
									tag="div"
								>
									<RichLoc
										:text="getMessage('BIZPROCDESIGNER_EDITOR_CONNECT_AGENT_POPUP_SECRET_WARNING')"
										placeholder="[secret]"
										tag="span"
									>
										<template #secret="{ text }">
											<span class="bp-connect-agent-popup__secret-accent">{{ text }}</span>
										</template>
									</RichLoc>
								</TextXs>
								<BInput
									data-testid="bizprocdesigner-connect-agent-command"
									:modelValue="command"
									:design="inputDesign.Primary"
									:rowsQuantity="commandRows"
									resize="none"
									readonly
									copyable
									stretched
								/>
								<TextXs
									class="bp-connect-agent-popup__step-text"
									tag="div"
								>
									{{ getMessage('BIZPROCDESIGNER_EDITOR_CONNECT_AGENT_STEP_COPY_TEXT') }}
								</TextXs>
							</div>
						</div>
						<div class="bp-connect-agent-popup__step">
							<TextXs
								class="bp-connect-agent-popup__step-number"
								tag="div"
								aria-hidden="true"
							>2</TextXs>
							<div class="bp-connect-agent-popup__step-content">
								<TextSm
									class="bp-connect-agent-popup__step-title"
									tag="div"
								>
									{{ getMessage('BIZPROCDESIGNER_EDITOR_CONNECT_AGENT_STEP_PROMPT_TITLE') }}
								</TextSm>
								<TextXs
									class="bp-connect-agent-popup__step-text"
									tag="div"
								>
									{{ getMessage('BIZPROCDESIGNER_EDITOR_CONNECT_AGENT_STEP_PROMPT_TEXT') }}
								</TextXs>
							</div>
						</div>
					</template>
					<TextXs
						v-if="hintText"
						class="bp-connect-agent-popup__hint"
						tag="div"
					>
						{{ hintText }}
					</TextXs>
					<div class="bp-connect-agent-popup__actions">
						<Button
							v-if="!connected"
							:text="getMessage('BIZPROCDESIGNER_EDITOR_CONNECT_AGENT_BTN_CONNECT')"
							:style="buttonStyle.FILLED_BITRIX_GPT"
							:size="buttonSize.LARGE"
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
			</div>
		</Popup>
	`,
};
