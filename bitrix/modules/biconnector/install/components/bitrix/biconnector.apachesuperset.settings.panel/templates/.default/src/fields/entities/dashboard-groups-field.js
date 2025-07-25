/* eslint-disable no-underscore-dangle,@bitrix24/bitrix24-rules/no-pseudo-private */
import { Dom, Event, Loc, Tag, Text, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';
import 'ui.forms';
import 'ui.buttons';
import { DashboardParametersSelector } from 'biconnector.dashboard-parameters-selector';
import type { Parameter } from 'biconnector.dashboard-parameters-selector';

export class DashboardGroupsField extends BX.UI.EntityEditorCustom
{
	#groups: Set;
	#scopes: Set;
	#params: Set;
	#scopeParamsMap: {[scopeCode: string]: Parameter[]};

	static create(id, settings): this
	{
		const self = new this(id, settings);
		self.initialize(id, settings);

		return self;
	}

	initialize(id, settings)
	{
		super.initialize(id, settings);
		this.#scopes = new Set();
		const scopes = this._model.getField('SCOPE', []);
		scopes.forEach((scopeCode) => {
			this.#scopes.add(scopeCode);
		});

		this.#params = new Set();
		const params = this._model.getField('PARAMS', []);
		params.forEach((param) => {
			this.#params.add(param);
		});

		this.#groups = new Set();
		const groups = this._model.getField('GROUPS', []);
		groups.forEach((groupId) => {
			this.#groups.add(Text.toNumber(groupId));
		});

		this.#scopeParamsMap = this._model.getField('SCOPE_PARAMS_MAP', {});

		EventEmitter.subscribe('BIConnector.DashboardParamsSelector:onChange', this.onChange.bind(this));
	}

	layout(options: {})
	{
		this.ensureWrapperCreated({ classNames: ['ui-entity-editor-field-text'] });
		this.adjustWrapper();
		this._innerWrapper = Tag.render`<div class='ui-entity-editor-content-block ui-ctl-custom'></div>`;

		const message = Loc.getMessage(
			'BICONNECTOR_SUPERSET_SETTINGS_GROUP_FIELD_HINT',
			{
				'#HINT_LINK#': '<link></link>',
			},
		);

		const hint = Tag.render`
			<div class="biconnector-superset-settings-panel-range__hint">
				${message}
			</div>
		`;

		const link = Tag.render`
			<a class="biconnector-superset-settings-panel-range__hint-link">
				${Loc.getMessage('BICONNECTOR_SUPERSET_SETTINGS_DASHBOARD_HINT_LINK')}
			</a>
		`;

		Event.bind(link, 'click', () => {
			top.BX.Helper.show('redirect=detail&code=25556500');
		});

		Dom.replace(hint.querySelector('link'), link);
		Dom.insertBefore(hint, this._container);

		Dom.append(this._innerWrapper, this._wrapper);
		const selectorParams = {
			groups: this.#groups,
			scopes: this.#scopes,
			params: this.#params,
			scopeParamsMap: this.#scopeParamsMap,
		};

		const selector = new DashboardParametersSelector(selectorParams);
		Dom.append(selector.getLayout(), this._innerWrapper);

		this.registerLayout(options);
		this._hasLayout = true;
	}

	save(): void
	{
		if (Type.isDomNode(this._innerWrapper))
		{
			const oldSaveBlock = this._innerWrapper.querySelector('.save-block');
			if (Type.isDomNode(oldSaveBlock))
			{
				Dom.remove(oldSaveBlock);
			}

			const saveBlock = Tag.render`<div class="save-block"></div>`;
			for (const group of this.#groups)
			{
				Dom.append(Tag.render`<input type="hidden" name="${this.getName()}[GROUPS][]" value="${group}">`, saveBlock);
			}

			for (const scope of this.#scopes)
			{
				Dom.append(Tag.render`<input type="hidden" name="${this.getName()}[SCOPE][]" value="${scope}">`, saveBlock);
			}

			for (const param of this.#params)
			{
				Dom.append(Tag.render`<input type="hidden" name="${this.getName()}[PARAMS][]" value="${param}">`, saveBlock);
			}
			Dom.append(saveBlock, this._innerWrapper);
		}

		this._model.setField(this.getName(), [...this.#groups]);
	}

	onChange(params): void
	{
		const { isChanged } = params.data;
		if (isChanged)
		{
			this.markAsChanged();

			return;
		}

		this._isChanged = false;
	}
}
