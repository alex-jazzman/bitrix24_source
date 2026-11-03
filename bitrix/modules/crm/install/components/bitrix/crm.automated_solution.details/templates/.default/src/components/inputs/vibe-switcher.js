import { ajax as Ajax, Runtime, Type } from 'main.core';
import { LiveAnnouncer } from 'ui.a11y';
import { Alert } from 'ui.system.alert.vue';
import { BLine } from 'ui.system.skeleton.vue';
import { Switcher } from 'ui.vue3.components.switcher';

const WidgetStatus = Object.freeze({
	hidden: 'hidden',
	loading: 'loading',
	ready: 'ready',
	empty: 'empty',
	error: 'error',
});

export const VibeSwitcher = {
	components: {
		Alert,
		BLine,
		Switcher,
	},
	props: {
		readOnly: Boolean,
	},
	data(): Object
	{
		return {
			widgetStatus: WidgetStatus.hidden,
			widgetLoadingWidth: 0,
		};
	},
	computed: {
		isVibeFeatureEnabled(): boolean
		{
			return this.$store.state.isVibeFeatureEnabled;
		},
		isVibeEnabled: {
			get(): boolean
			{
				return this.$store.state.automatedSolution.isVibeEnabled;
			},
			set(isVibeEnabled: boolean): void
			{
				this.$store.dispatch('setIsVibeEnabled', isVibeEnabled);
			},
		},
		isVibeAvailable(): boolean
		{
			return this.$store.state.isVibeAvailable;
		},
		isVibeSettingsPending(): boolean
		{
			return this.$store.state.isVibeSettingsPending;
		},
		vibeId(): number
		{
			return this.$store.state.automatedSolution.vibeId;
		},
		automatedSolutionId(): ?number
		{
			return this.$store.state.automatedSolution.id;
		},
		canLoadVibeSettings(): boolean
		{
			return (
				this.isVibeFeatureEnabled
				&& !this.readOnly
				&& this.isVibeAvailable
				&& this.isVibeEnabled
				&& this.vibeId > 0
			);
		},
		vibeSettingsContext(): string
		{
			return [
				this.canLoadVibeSettings,
				this.automatedSolutionId,
				this.vibeId,
			].join(':');
		},
		isWidgetLoading(): boolean
		{
			return this.widgetStatus === WidgetStatus.loading;
		},
		isWidgetReady(): boolean
		{
			return this.widgetStatus === WidgetStatus.ready;
		},
		isWidgetEmpty(): boolean
		{
			return this.widgetStatus === WidgetStatus.empty;
		},
		isWidgetError(): boolean
		{
			return this.widgetStatus === WidgetStatus.error;
		},
		isWidgetVisible(): boolean
		{
			return this.widgetStatus !== WidgetStatus.hidden;
		},
	},
	watch: {
		isVibeSettingsPending(isVibeSettingsPending: boolean): void
		{
			if (isVibeSettingsPending)
			{
				void this.$nextTick(() => this.updateWidgetLoadingWidth());
			}
		},
		vibeSettingsContext(): void
		{
			if (this.canLoadVibeSettings)
			{
				void this.loadVibeSettings();
			}
			else
			{
				this.hideVibeSettings();
			}
		},
	},
	created(): void
	{
		this.vibeSettingsRequestId = 0;
		this.isDestroyed = false;
	},
	mounted(): void
	{
		if (this.canLoadVibeSettings)
		{
			void this.loadVibeSettings();
		}
	},
	beforeUnmount(): void
	{
		this.isDestroyed = true;
		this.vibeSettingsRequestId++;
	},
	methods: {
		handleVibeSwitcherKeydown(event: KeyboardEvent): void
		{
			if (event.key !== 'Enter' && event.key !== ' ' && event.code !== 'Space')
			{
				return;
			}

			event.preventDefault();
			this.handleVibeSwitcherToggle(!this.isVibeEnabled);
		},
		handleVibeSwitcherToggle(isVibeEnabled: boolean): void
		{
			if (!isVibeEnabled)
			{
				this.hideVibeSettings();
			}

			this.isVibeEnabled = isVibeEnabled;
		},
		setWidgetStatus(status: $Values<typeof WidgetStatus>): void
		{
			if (this.widgetStatus === status)
			{
				return;
			}

			this.widgetStatus = status;
			const messages = {
				[WidgetStatus.loading]: 'CRM_AUTOMATED_SOLUTION_DETAILS_VIBE_SETTINGS_LOADING',
				[WidgetStatus.ready]: 'CRM_AUTOMATED_SOLUTION_DETAILS_VIBE_SETTINGS_LOADED',
				[WidgetStatus.empty]: 'CRM_AUTOMATED_SOLUTION_DETAILS_VIBE_SETTINGS_EMPTY',
				[WidgetStatus.error]: 'CRM_AUTOMATED_SOLUTION_DETAILS_VIBE_SETTINGS_LOAD_ERROR',
			};
			const messageCode = messages[status];
			if (messageCode)
			{
				LiveAnnouncer.announce(
					this.$Bitrix.Loc.getMessage(messageCode),
					status === WidgetStatus.error ? 'assertive' : 'polite',
				);
			}
		},
		hideVibeSettings(): void
		{
			this.widgetLoadingWidth = 0;

			if (this.widgetStatus === WidgetStatus.hidden)
			{
				return;
			}

			this.vibeSettingsRequestId++;
			this.setWidgetStatus(WidgetStatus.hidden);
		},
		isVibeSettingsRequestCurrent(
			requestId: number,
			automatedSolutionId: ?number,
			vibeId: number,
		): boolean
		{
			return (
				requestId === this.vibeSettingsRequestId
				&& !this.isDestroyed
				&& this.canLoadVibeSettings
				&& this.automatedSolutionId === automatedSolutionId
				&& this.vibeId === vibeId
				&& this.isVibeEnabled
			);
		},
		async loadVibeSettings(): Promise<void>
		{
			if (!this.canLoadVibeSettings)
			{
				this.hideVibeSettings();

				return;
			}

			const slider = BX.SidePanel.Instance.getSliderByWindow(window);
			if (slider)
			{
				slider.setWidth(1100);
				slider.adjustLayout();
			}

			const requestId = ++this.vibeSettingsRequestId;
			const automatedSolutionId = this.automatedSolutionId;
			const vibeId = this.vibeId;
			this.widgetLoadingWidth = 0;
			this.setWidgetStatus(WidgetStatus.loading);
			await this.$nextTick();

			if (!this.isVibeSettingsRequestCurrent(requestId, automatedSolutionId, vibeId))
			{
				return;
			}

			this.updateWidgetLoadingWidth();

			try
			{
				const response = await Ajax.runAction(
					'crm.automatedsolution.getVibeSettings',
					{
						data: {
							automatedSolutionId,
						},
					},
				);

				if (!this.isVibeSettingsRequestCurrent(requestId, automatedSolutionId, vibeId))
				{
					return;
				}

				if (response.status !== 'success')
				{
					this.widgetLoadingWidth = 0;
					this.setWidgetStatus(WidgetStatus.error);

					return;
				}

				const html = response.data?.html;
				if (!Type.isStringFilled(html) || html.trim() === '')
				{
					this.widgetLoadingWidth = 0;
					this.setWidgetStatus(WidgetStatus.empty);

					return;
				}

				this.widgetLoadingWidth = 0;
				this.setWidgetStatus(WidgetStatus.ready);
				await this.$nextTick();

				if (!this.isVibeSettingsRequestCurrent(requestId, automatedSolutionId, vibeId))
				{
					return;
				}

				const settingsWrapper = this.$refs.settingsWrapper;
				if (!Type.isDomNode(settingsWrapper))
				{
					this.setWidgetStatus(WidgetStatus.error);

					return;
				}

				await Runtime.html(settingsWrapper, html);

				if (
					!this.isVibeSettingsRequestCurrent(requestId, automatedSolutionId, vibeId)
					|| settingsWrapper !== this.$refs.settingsWrapper
				)
				{
					return;
				}
			}
			catch (error)
			{
				if (!this.isVibeSettingsRequestCurrent(requestId, automatedSolutionId, vibeId))
				{
					return;
				}

				this.setWidgetStatus(WidgetStatus.error);
				this.widgetLoadingWidth = 0;
				// eslint-disable-next-line no-console
				console.error('Error fetching Vibe settings:', error);
			}
		},
		updateWidgetLoadingWidth(): void
		{
			const widgetContainer = this.$refs.widgetContainer;
			if (Type.isDomNode(widgetContainer) && widgetContainer.clientWidth > 0)
			{
				this.widgetLoadingWidth = widgetContainer.clientWidth;

				return;
			}

			const componentRoot = this.$el;
			this.widgetLoadingWidth = Type.isDomNode(componentRoot) ? componentRoot.clientWidth : 0;
		},
	},
	template: `
		<div class="ui-form-row crm-automated-solution-details-form-label-xs">
			<div class="ui-form-label">
				<div
					id="crm-automated-solution-details-vibe-switcher-label"
					class="ui-ctl-label-text"
				>
					{{ $Bitrix.Loc.getMessage('CRM_AUTOMATED_SOLUTION_DETAILS_ENABLE_VIBE') }}
				</div>
			</div>
			<div class="ui-form-content">
				<div
					v-if="!isVibeAvailable"
					class="ui-alert ui-alert-warning"
				>
					<span class="ui-alert-message">
						{{ $Bitrix.Loc.getMessage('CRM_AUTOMATED_SOLUTION_DETAILS_VIBE_NOT_AVAILABLE') }}
					</span>
				</div>
				<Switcher
					v-else
					class="crm-automated-solution-details-vibe-switcher"
					data-testid="crm-automated-solution-details-vibe-switcher"
					role="switch"
					tabindex="0"
					:aria-checked="isVibeEnabled"
					aria-labelledby="crm-automated-solution-details-vibe-switcher-label"
					:is-checked="isVibeEnabled"
					@check="handleVibeSwitcherToggle(true)"
					@uncheck="handleVibeSwitcherToggle(false)"
					@keydown="handleVibeSwitcherKeydown"
				/>
			</div>
			<div
				v-if="isVibeAvailable && (isVibeSettingsPending || isWidgetVisible)"
				ref="widgetContainer"
				:aria-busy="isVibeSettingsPending || isWidgetLoading ? 'true' : null"
				data-testid="crm-automated-solution-details-vibe-settings"
			>
				<BLine
					v-if="isVibeSettingsPending || isWidgetLoading"
					:height="430"
					:radius="8"
					:width="widgetLoadingWidth"
				/>
				<Alert v-else-if="isWidgetEmpty">
					{{ $Bitrix.Loc.getMessage('CRM_AUTOMATED_SOLUTION_DETAILS_VIBE_SETTINGS_EMPTY') }}
				</Alert>
				<Alert v-else-if="isWidgetError">
					{{ $Bitrix.Loc.getMessage('CRM_AUTOMATED_SOLUTION_DETAILS_VIBE_SETTINGS_LOAD_ERROR') }}
				</Alert>
				<div
					v-else-if="isWidgetReady"
					ref="settingsWrapper"
				></div>
			</div>
		</div>
	`,
};
