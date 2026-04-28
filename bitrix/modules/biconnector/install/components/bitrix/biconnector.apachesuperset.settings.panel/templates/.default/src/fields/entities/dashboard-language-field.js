import { Tag, Dom, Loc, Type, ajax } from 'main.core';
import 'ui.forms';
import { EventEmitter } from 'main.core.events';
import { Loader } from 'main.loader';
import { PageObject } from 'main.pageobject';

export class DashboardLanguageField extends BX.UI.EntityEditorCustom
{
	#currentLanguage = '';
	#initialLanguage = '';
	#languageChanged = false;
	#languageInfoContainer;
	#loader;

	static create(id, settings): DashboardLanguageField
	{
		const self = new this(id, settings);
		self.initialize(id, settings);

		return self;
	}

	initialize(id, settings): void
	{
		super.initialize(id, settings);

		const fieldSettings = settings.model.getData();
		this.#currentLanguage = fieldSettings.currentLanguage || '';
		this.#initialLanguage = this.#currentLanguage;

		EventEmitter.subscribe('biconnector:onGlobalSettingsChange', this.#refreshLanguageInfo.bind(this));
	}

	layout(options): void
	{
		this.ensureWrapperCreated({ classNames: ['ui-entity-editor-field-text'] });
		this.adjustWrapper();

		this._innerWrapper = Tag.render`<div class='ui-entity-editor-content-block ui-ctl-custom'></div>`;
		Dom.append(this._innerWrapper, this._wrapper);

		const languageInfoContainer = this.#getLanguageInfoContainer();
		this.#languageInfoContainer = languageInfoContainer;

		Dom.append(languageInfoContainer, this._innerWrapper);

		this.registerLayout(options);
		this._hasLayout = true;

		this.#ensureSettingsSliderCloseHandler();
	}

	#getCurrentLanguageBlock(): String
	{
		return `
			<div class='biconnector-dashboard-language-current-block'>
				${this.#currentLanguage}
			</div>
		`;
	}

	#getCurrentLanguage(): String
	{
		return Loc.getMessage('BICONNECTOR_SUPERSET_SETTINGS_CURRENT_DASHBOARD_LANGUAGE_MSGVER_1')
			.replace('[div]', '<div class="biconnector-dashboard-language-current-title">')
			.replace('[/div]', '</div>')
			.replace('#LANGUAGE#', this.#getCurrentLanguageBlock())
		;
	}

	#getLanguageInfoContainer(): HTMLElement
	{
		return Tag.render`
			<div class="biconnector-dashboard-language-info">
				<div class="biconnector-dashboard-language-current">
					${this.#getCurrentLanguage()}
				</div>
			</div>
		`;
	}

	#refreshLanguageInfo(): void
	{
		if (!Type.isDomNode(this.#languageInfoContainer))
		{
			return;
		}

		this.#showLoader();

		ajax
			.runComponentAction(
				'bitrix:biconnector.apachesuperset.setting',
				'getDashboardLanguage',
				{ mode: 'class' },
			)
			.then((response) => {
				const language = response.data?.currentLanguage;
				if (Type.isStringFilled(language))
				{
					this.#currentLanguage = language;
					this.#languageChanged = this.#currentLanguage !== this.#initialLanguage;

					const currentLanguageNode = this.#languageInfoContainer.querySelector('.biconnector-dashboard-language-current');
					if (Type.isDomNode(currentLanguageNode))
					{
						currentLanguageNode.innerHTML = this.#getCurrentLanguage();
					}
				}

				this.#loader?.hide();
			})
			.catch(() => this.#loader?.hide())
		;
	}

	#showLoader(): void
	{
		if (!Type.isDomNode(this.#languageInfoContainer))
		{
			return;
		}

		if (!this.#loader)
		{
			this.#loader = new Loader({
				target: this.#languageInfoContainer,
				size: 40,
			});
		}

		this.#loader.show();
	}

	#ensureSettingsSliderCloseHandler(): void
	{
		const hostWindow = PageObject.getRootWindow().window;
		const hostBX = hostWindow?.BX;

		if (!hostBX?.SidePanel?.Instance)
		{
			return;
		}

		const slider = hostBX.SidePanel.Instance.getSliderByWindow?.(window);
		if (!slider)
		{
			return;
		}

		const sliderCloseHandler = () => {
			if (this.#shouldReloadHostWindow(hostWindow))
			{
				hostWindow.location.reload();
			}
		};

		EventEmitter.subscribeOnce(slider, 'SidePanel.Slider:onCloseComplete', sliderCloseHandler);
	}

	#shouldReloadHostWindow(hostWindow): boolean
	{
		if (!this.#languageChanged)
		{
			return false;
		}

		const pathname = hostWindow?.location?.pathname || '';

		return pathname === '/bi/dashboard/';
	}
}
