import { Dom, Event, Loc, Tag, ajax } from 'main.core';
import { Lottie } from 'ui.lottie';
import { Dialog } from 'ui.system.dialog';
import DashboardLoadingAnimation from './biconnector-dashboard-loading.json';
import DotsAnimation from './biconnector-dots-animation.json';
import { PasswordInput, InputSize, InputDesign } from 'ui.system.input';
import { Button, ButtonSize, AirButtonStyle } from 'ui.buttons';
import { SkeletonRenderer } from 'biconnector.apache-superset-dashboard-skeleton';
import { ApacheSupersetEmbeddedLoader } from 'biconnector.apache-superset-embedded-loader';
import { ApacheSupersetAnalytics } from 'biconnector.apache-superset-analytics';

export class Share
{
	#config;
	#loaderNode: HTMLElement;
	#dialog: Dialog;
	#lockErrorNode: HTMLElement | null = null;
	#installingPollTimer: ?number = null;
	#storageKeyPrefix = 'biconnector_share_password_';
	#storageTtlMs = 60 * 60 * 1000; // 1 hour

	constructor(config)
	{
		this.#config = config;
		this.#loaderNode = document.querySelector('.biconnector-dashboard__loader');

		SkeletonRenderer.render(this.#loaderNode);

		if (config.dashboardTitle)
		{
			this.#setTitle(config.dashboardTitle);
		}

		this.#handleStatus(config.status);
		this.#initPull(config.pullConfig);
	}

	#setTitle(title: string): void
	{
		const titleNode = document.querySelector('.dashboard-header-selector-text');
		if (titleNode)
		{
			titleNode.textContent = title;
			titleNode.title = title;
		}
	}

	#getStorageKey(): string
	{
		return this.#storageKeyPrefix + this.#config.token;
	}

	#getSavedCredentials(): { hash?: string, password?: string } | null
	{
		try
		{
			const raw = localStorage.getItem(this.#getStorageKey());
			if (!raw)
			{
				return null;
			}

			const parsed = JSON.parse(raw);
			if (parsed.expiresAt < Date.now())
			{
				localStorage.removeItem(this.#getStorageKey());

				return null;
			}

			if (parsed.hash)
			{
				return { hash: parsed.hash };
			}

			if (parsed.password)
			{
				return { password: parsed.password };
			}

			return null;
		}
		catch (e)
		{
			return null;
		}
	}

	#getSavedPasswordHash(): string | null
	{
		return this.#getSavedCredentials()?.hash ?? null;
	}

	async #savePasswordHash(password: string): void
	{
		try
		{
			const canUseSubtle = !!(crypto && crypto.subtle);
			const hash = canUseSubtle
				? await this.#hashPassword(password)
				: null
			;

			const data = JSON.stringify({
				hash,
				password: canUseSubtle ? null : password,
				expiresAt: Date.now() + this.#storageTtlMs,
			});
			localStorage.setItem(this.#getStorageKey(), data);
		}
		catch (e)
		{
			// Ignore localStorage/crypto errors
		}
	}

	#removeSavedPasswordHash(): void
	{
		try
		{
			localStorage.removeItem(this.#getStorageKey());
		}
		catch (e)
		{
			// Ignore localStorage errors
		}
	}

	async #hashPassword(password: string): string
	{
		if (crypto.subtle)
		{
			const data = new TextEncoder().encode(password);
			const hashBuffer = await crypto.subtle.digest('SHA-256', data);

			return Array.from(new Uint8Array(hashBuffer))
				.map((b) => b.toString(16).padStart(2, '0'))
				.join('')
			;
		}

		// Fallback for non-secure contexts (HTTP dev environments).
		// Simple hash -- not for security, just for session persistence.
		let hash = 0;
		for (let i = 0; i < password.length; i++)
		{
			hash = ((hash << 5) - hash + password.charCodeAt(i)) | 0;
		}

		return 'fb_' + Math.abs(hash).toString(16);
	}

	#sendAnalytics(event: string, status: string = 'success'): void
	{
		const params = { c_element: 'get_access_pop_up', status };
		if (this.#config.dashboardType)
		{
			params.type = this.#config.dashboardType;
		}

		ApacheSupersetAnalytics.sendAnalytics('share', event, params);
	}

	#handleStatus(status: string): void
	{
		switch (status)
		{
			case 'READY':
				this.#sendAnalytics('login_successful');
				this.#embedDashboard(
					this.#config.embeddedParams,
					this.#config.lockedExternalFilters,
					this.#config.urlParams,
				);
				break;
			case 'PASSWORD_REQUIRED':
				this.#handlePasswordRequired();
				break;
			case 'NOT_FOUND':
				this.#sendAnalytics('report_not_found');
				this.#showNotFoundHint();
				break;
			case 'ERROR':
			default:
				this.#sendAnalytics('access_blocked');
				this.#showErrorHint();
				break;
		}
	}

	#handleInstalling(): void
	{
		// Show loading overlay on top of skeleton
		this.#showInstallingOverlay();

		// Poll checkPassword every 10s -- when dashboard becomes ready,
		// response will contain embeddedParams instead of INSTALLING status.
		this.#installingPollTimer = setInterval(() => {
			this.#pollDashboardStatus();
		}, 10000);
	}

	#pollDashboardStatus(): void
	{
		const saved = this.#getSavedCredentials();
		if (!saved)
		{
			return;
		}

		const data: Object = { token: this.#config.token };
		if (saved.hash)
		{
			data.passwordHash = saved.hash;
		}
		else if (saved.password)
		{
			data.password = saved.password;
		}
		else
		{
			return;
		}

		ajax.runComponentAction(
			'bitrix:biconnector.apachesuperset.dashboard.share',
			'checkPassword',
			{
				mode: 'ajax',
				data,
			},
		)
			.then((response) => {
				if (response.data.status === 'INSTALLING')
				{
					return;
				}

				clearInterval(this.#installingPollTimer);
				this.#sendAnalytics('login_successful');
				this.#embedDashboard(
					response.data.embeddedParams,
					response.data.lockedExternalFilters,
					response.data.urlParams,
				);
			})
			.catch(() => {});
	}

	#initPull(pullConfig): void
	{
		if (!pullConfig || !BX.PULL)
		{
			return;
		}

		BX.PULL.start(pullConfig);

		BX.PULL.subscribe({
			moduleId: 'biconnector',
			command: 'shareRevoked',
			callback: () => {
				location.reload();
			},
		});
	}

	#handlePasswordRequired(): void
	{
		const saved = this.#getSavedCredentials();
		if (saved?.hash)
		{
			this.#checkPasswordByHash(saved.hash);
		}
		else if (saved?.password)
		{
			this.#checkPassword(saved.password);
		}
		else
		{
			this.#showPasswordPopup();
		}
	}

	#showDialog(content: HTMLElement, width: number): void
	{
		this.#dialog = new Dialog({
			content,
			width,
			borderRadius: 20,
			hasOverlay: true,
			hasCloseButton: false,
			closeByClickOutside: false,
			closeByEsc: false,
			hasVerticalPadding: false,
			hasHorizontalPadding: false,
		});

		this.#dialog.show();
	}

	#showInstallingOverlay(): void
	{
		if (this.#dialog)
		{
			this.#dialog.hide();
		}

		const loadingAnimationContainer = Tag.render`
			<div class="biconnector-dashboard__loading-animation"></div>
		`;

		Lottie.loadAnimation({
			container: loadingAnimationContainer,
			renderer: 'svg',
			loop: false,
			autoplay: true,
			animationData: DashboardLoadingAnimation,
		});

		const title = Loc.getMessage('BICONNECTOR_SHARE_INSTALLING_TITLE');

		const container = Tag.render`
			<div class="biconnector-dashboard__hint biconnector-dashboard__hint__loading">
				${loadingAnimationContainer}
				<div class="biconnector-dashboard__hint_title">
					${title}<span class="biconnector-dashboard__dots-animation"></span>
				</div>
			</div>
		`;

		const dotsContainer = container.querySelector('.biconnector-dashboard__dots-animation');
		Lottie.loadAnimation({
			container: dotsContainer,
			renderer: 'svg',
			loop: true,
			autoplay: true,
			animationData: DotsAnimation,
		});

		const hintContainer = this.#loaderNode.querySelector('.biconnector-dashboard__hint_container');
		if (hintContainer)
		{
			Dom.clean(hintContainer);
			Dom.append(container, hintContainer);
		}
	}

	#showErrorHint(): void
	{
		const hintContainer = this.#loaderNode.querySelector('.biconnector-dashboard__hint_container');
		if (!hintContainer)
		{
			return;
		}

		const hint = Tag.render`
			<div class="biconnector-dashboard__hint biconnector-share__hint--error">
				<div class="biconnector-share__error-icon"></div>
				<div class="biconnector-dashboard__hint_title">
					${Loc.getMessage('BICONNECTOR_SHARE_ERROR_TITLE')}
				</div>
				<div class="biconnector-dashboard__hint_desc">
					${Loc.getMessage('BICONNECTOR_SHARE_ERROR_DESC')}
				</div>
			</div>
		`;

		Dom.clean(hintContainer);
		Dom.append(hint, hintContainer);
	}

	#showNotFoundHint(): void
	{
		const hintContainer = this.#loaderNode.querySelector('.biconnector-dashboard__hint_container');
		if (!hintContainer)
		{
			return;
		}

		const hint = Tag.render`
			<div class="biconnector-dashboard__hint biconnector-share__hint--not-found">
				<div class="biconnector-share__not-found-icon"></div>
				<div class="biconnector-dashboard__hint_title">
					${Loc.getMessage('BICONNECTOR_SHARE_NOT_FOUND_TITLE')}
				</div>
			</div>
		`;

		Dom.clean(hintContainer);
		Dom.append(hint, hintContainer);
	}

	#showPasswordPopup(): void
	{
		let passwordInput = null;

		const submitButton = new Button({
			text: Loc.getMessage('BICONNECTOR_SHARE_CONTINUE_BTN'),
			size: ButtonSize.MEDIUM,
			style: AirButtonStyle.FILLED,
			useAirDesign: true,
			disabled: true,
			onclick: () => {
				this.#submitPassword(passwordInput, submitButton);
			},
		});

		passwordInput = new PasswordInput({
			label: Loc.getMessage('BICONNECTOR_SHARE_PASSWORD_LABEL'),
			placeholder: Loc.getMessage('BICONNECTOR_SHARE_PASSWORD_LABEL'),
			size: InputSize.Md,
			design: InputDesign.Outline,
			onInput: () => {
				const hasValue = passwordInput.getValue().length > 0;
				submitButton.setDisabled(!hasValue);
				if (hasValue)
				{
					Dom.removeClass(submitButton.getContainer(), 'ui-btn-disabled');
				}
				passwordInput.setError('');
				this.#hideLockError();
			},
		});

		const inputWrapper = passwordInput.render();

		const labelNode = inputWrapper.querySelector('.ui-system-input-label');
		if (labelNode)
		{
			Dom.addClass(labelNode, 'biconnector-share__field-label--required');
		}

		const inputElement = inputWrapper.querySelector('input');

		if (inputElement)
		{
			Event.bind(inputElement, 'keydown', (e) => {
				if (e.key === 'Enter' && passwordInput.getValue().length > 0)
				{
					this.#submitPassword(passwordInput, submitButton);
				}
			});
		}

		const content = Tag.render`
			<div class="biconnector-share__popup biconnector-share__popup--centered">
				<div class="biconnector-share__popup-logo">
					<img class="biconnector-share__popup-logo-img biconnector-share__popup-logo-img--portal" src="${this.#config.portalLogo}" alt="">
					<img class="biconnector-share__popup-logo-img biconnector-share__popup-logo-img--builder" src="${this.#config.biBuilderLogo}" alt="">
				</div>
				<div class="biconnector-share__popup-character"></div>
				<div class="biconnector-share__popup-title biconnector-share__popup-title--centered">
					${Loc.getMessage('BICONNECTOR_SHARE_PASSWORD_TITLE')}
				</div>
				<div class="biconnector-share__popup-desc biconnector-share__popup-desc--centered">
					${Loc.getMessage('BICONNECTOR_SHARE_PASSWORD_DESC', { '#BR#': '<br>' })}
				</div>
				${this.#lockErrorNode = Tag.render`<div class="biconnector-share__lock-error" style="display: none;"></div>`}
				<div class="biconnector-share__input-wrapper">
					${inputWrapper}
				</div>
				<div class="biconnector-share__popup-footer biconnector-share__popup-footer--centered">
					${submitButton.render()}
				</div>
			</div>
		`;

		this.#showDialog(content, 400);
		inputElement?.focus();
	}

	#showLockError(message: string): void
	{
		if (this.#lockErrorNode)
		{
			this.#lockErrorNode.textContent = message;
			this.#lockErrorNode.style.display = '';
		}
	}

	#hideLockError(): void
	{
		if (this.#lockErrorNode)
		{
			this.#lockErrorNode.style.display = 'none';
		}
	}

	#submitPassword(passwordInput: PasswordInput, submitButton: Button): void
	{
		submitButton.setWaiting(true);
		const password = passwordInput.getValue();

		this.#checkPassword(password, false)
			.then(() => {
				if (this.#dialog)
				{
					this.#dialog.hide();
				}
			})
			.catch((response) => {
				submitButton.setWaiting(false);

				const errorCode = response?.errors?.[0]?.code;
				if (errorCode === 'WRONG_PASSWORD')
				{
					submitButton.setDisabled(false);
					this.#sendAnalytics('wrong_password');
					passwordInput.setError(Loc.getMessage('BICONNECTOR_SHARE_WRONG_PASSWORD'));
				}
				else if (errorCode === 'LOGIN_LOCKED')
				{
					submitButton.setDisabled(true);
					const minutes = response?.errors?.[0]?.customData?.minutes ?? 5;
					this.#showLockError(
						Loc.getMessage('BICONNECTOR_SHARE_LOGIN_LOCKED')
							.replace('#MINUTES#', minutes),
					);
				}
				else
				{
					submitButton.setDisabled(false);
					this.#sendAnalytics('access_blocked');
					if (this.#dialog)
					{
						this.#dialog.hide();
					}
					this.#showErrorHint();
				}
			});
	}

	#checkPassword(password: string): Promise
	{
		return ajax.runComponentAction(
			'bitrix:biconnector.apachesuperset.dashboard.share',
			'checkPassword',
			{
				mode: 'ajax',
				data: {
					token: this.#config.token,
					password,
				},
			},
		)
			.then(async (response) => {
				await this.#savePasswordHash(password);

				if (response.data.status === 'INSTALLING')
				{
					this.#config.dashboardId = response.data.dashboardId;
					this.#handleInstalling();

					return response;
				}

				this.#sendAnalytics('login_successful');
				this.#embedDashboard(
					response.data.embeddedParams,
					response.data.lockedExternalFilters,
					response.data.urlParams,
				);

				return response;
			});
	}

	#checkPasswordByHash(passwordHash: string): void
	{
		ajax.runComponentAction(
			'bitrix:biconnector.apachesuperset.dashboard.share',
			'checkPassword',
			{
				mode: 'ajax',
				data: {
					token: this.#config.token,
					passwordHash,
				},
			},
		)
			.then((response) => {
				if (response.data.status === 'INSTALLING')
				{
					this.#config.dashboardId = response.data.dashboardId;
					this.#handleInstalling();

					return;
				}

				this.#sendAnalytics('login_successful');
				this.#embedDashboard(
					response.data.embeddedParams,
					response.data.lockedExternalFilters,
					response.data.urlParams,
				);
			})
			.catch((response) => {
				this.#removeSavedPasswordHash();

				const errorCode = response?.errors?.[0]?.code;
				if (errorCode === 'WRONG_PASSWORD' || errorCode === 'LOGIN_LOCKED')
				{
					this.#showPasswordPopup();
				}
				else
				{
					this.#showErrorHint();
				}
			});
	}

	#embedDashboard(embeddedParams, lockedExternalFilters?: Object, urlParams?: Object): void
	{
		Dom.clean(this.#loaderNode);

		const iframeContainer = Tag.render`
			<div class="dashboard-iframe"></div>
		`;
		Dom.append(iframeContainer, this.#loaderNode);
		Dom.addClass(this.#loaderNode, 'biconnector-dashboard__loader--ready');

		const loader = new ApacheSupersetEmbeddedLoader({
			id: embeddedParams.uuid,
			supersetDomain: embeddedParams.supersetDomain,
			mountPoint: iframeContainer,
			fetchGuestToken: embeddedParams.guestToken,
			debug: false,
			dashboardUiConfig: {
				hideTitle: true,
				hideTab: true,
				hideChartControls: true,
				filters: {
					expanded: true,
					visible: true,
					nativeFilters: embeddedParams.nativeFilters || undefined,
				},
				urlParams: urlParams ?? {},
			},
			onTokenExpired: () => {
				return ajax.runComponentAction(
					'bitrix:biconnector.apachesuperset.dashboard.share',
					'refreshShareToken',
					{
						mode: 'ajax',
						data: {
							token: this.#config.token,
							passwordHash: this.#getSavedCredentials()?.hash ?? '',
							password: this.#getSavedCredentials()?.password ?? '',
						},
					},
				).then((response) => response.data.guestToken);
			},
		});

		loader.embedDashboard().then(() => {
			// Always signal shared mode to lock all external filters.
			// Even with empty object, this sets isLocked=true in Superset,
			// ensuring external filters are never interactive for shared links.
			loader.setLockedExternalFilters(lockedExternalFilters ?? {});
		});
	}
}
