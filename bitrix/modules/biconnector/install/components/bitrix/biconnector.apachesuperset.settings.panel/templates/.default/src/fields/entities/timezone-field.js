import { Tag, Dom, Loc, Type, ajax } from 'main.core';
import 'ui.forms';
import { EventEmitter } from 'main.core.events';
import { Loader } from 'main.loader';
import { PageObject } from 'main.pageobject';

export class TimeZoneField extends BX.UI.EntityEditorCustom
{
	#currentTimeZone = '';
	#timeZoneInfoContainer;
	#loader;

	static create(id, settings): TimeZoneField
	{
		const self = new this(id, settings);
		self.initialize(id, settings);

		return self;
	}

	initialize(id, settings): void
	{
		super.initialize(id, settings);

		const fieldSettings = settings.model.getData();
		this.#currentTimeZone = fieldSettings.currentTimeZone || '';

		EventEmitter.subscribe('biconnector:onGlobalSettingsChange', this.#refreshTimeZoneInfo.bind(this));
	}

	layout(options): void
	{
		this.ensureWrapperCreated({ classNames: ['ui-entity-editor-field-text'] });
		this.adjustWrapper();

		const message = Loc.getMessage(
			'BICONNECTOR_SUPERSET_SETTINGS_GLOBAL_SETTINGS_SECTION_HINT',
		);

		const hint = Tag.render`
			<div class="biconnector-superset-settings-panel-range__hint">
				${message}
			</div>
		`;

		Dom.insertBefore(hint, this._container);

		this._innerWrapper = Tag.render`<div class='ui-entity-editor-content-block ui-ctl-custom'></div>`;
		Dom.append(this._innerWrapper, this._wrapper);

		const timeZoneInfoContainer = this.#getTimeZoneInfoContainer();
		this.#timeZoneInfoContainer = timeZoneInfoContainer;

		Dom.append(timeZoneInfoContainer, this._innerWrapper);

		this.registerLayout(options);
		this._hasLayout = true;
	}

	#getCurrentTimeZoneBlock(): String
	{
		return `
			<div class='biconnector-dashboard-timezone-current-block'>
				${this.#currentTimeZone}
			</div>
		`;
	}

	#getCurrentTimeZone(): String
	{
		return Loc.getMessage('BICONNECTOR_SUPERSET_SETTINGS_CURRENT_TIMEZONE')
			.replace('[div]', '<div class="biconnector-dashboard-timezone-current-title">')
			.replace('[/div]', '</div>')
			.replace('#TIME_ZONE#', this.#getCurrentTimeZoneBlock())
		;
	}

	#getTimeZoneInfoContainer(): HTMLElement
	{
		return Tag.render`
			<div class="biconnector-dashboard-timezone-info">
				<div class="biconnector-dashboard-timezone-current">
					${this.#getCurrentTimeZone()}
				</div>
			</div>
		`;
	}

	#refreshTimeZoneInfo(): void
	{
		if (!Type.isDomNode(this.#timeZoneInfoContainer))
		{
			return;
		}

		this.#showLoader();

		ajax
			.runComponentAction(
				'bitrix:biconnector.apachesuperset.setting',
				'getTimeZone',
				{ mode: 'class' },
			)
			.then((response) => {
				const timeZone = response.data?.currentTimeZone;
				this.#currentTimeZone = timeZone;

				const currentTimeZoneNode = this.#timeZoneInfoContainer.querySelector('.biconnector-dashboard-timezone-current');
				if (Type.isDomNode(currentTimeZoneNode))
				{
					currentTimeZoneNode.innerHTML = this.#getCurrentTimeZone();
				}

				this.#loader?.hide();
			})
			.catch(() => this.#loader?.hide())
		;
	}

	#showLoader(): void
	{
		if (!Type.isDomNode(this.#timeZoneInfoContainer))
		{
			return;
		}

		if (!this.#loader)
		{
			this.#loader = new Loader({
				target: this.#timeZoneInfoContainer,
				size: 40,
			});
		}

		this.#loader.show();
	}
}
