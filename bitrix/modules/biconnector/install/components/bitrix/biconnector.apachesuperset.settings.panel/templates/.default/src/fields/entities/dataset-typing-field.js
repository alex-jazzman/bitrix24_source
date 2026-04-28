/* eslint-disable no-underscore-dangle */
/* eslint-disable @bitrix24/bitrix24-rules/no-pseudo-private */
import { Tag, Dom, Loc, Type } from 'main.core';
import { Switcher, SwitcherSize } from 'ui.switcher';
import 'ui.forms';

export class DatasetTypingField extends BX.UI.EntityEditorCustom
{
	#isEnabled: boolean;
	#initialEnabled: boolean;
	#isLocked: boolean;

	static create(id, settings): DatasetTypingField
	{
		const self = new this(id, settings);
		self.initialize(id, settings);

		return self;
	}

	initialize(id, settings)
	{
		super.initialize(id, settings);
		const data = this._schemeElement?.getData?.() ?? {};
		const value = this._model.getField(this.getName(), 'N');
		this.#isLocked = data.disabled === true;
		this.#isEnabled = this.#isLocked ? true : value === 'Y';
		this.#initialEnabled = this.#isEnabled;
	}

	layout(options: {})
	{
		this.ensureWrapperCreated({ classNames: ['ui-entity-editor-field-text'] });
		this.adjustWrapper();

		this.layoutHint();

		this._innerWrapper = Tag.render`<div class='ui-entity-editor-content-block ui-ctl-custom'></div>`;
		Dom.append(this._innerWrapper, this._wrapper);

		Dom.append(this.buildSwitcher(), this._innerWrapper);

		this.registerLayout(options);
		this._hasLayout = true;
	}

	layoutHint(): void
	{
		const hintContainer = Tag.render`
			<div class="biconnector-superset-settings-panel-range__hint">
				${Loc.getMessage('BICONNECTOR_SUPERSET_SETTINGS_DATASET_TYPING_HINT')}
			</div>
		`;

		Dom.insertBefore(hintContainer, this._container);
	}

	onChange(): void
	{
		if (this.#initialEnabled !== this.#isEnabled)
		{
			this.markAsChanged();

			return;
		}

		this._isChanged = false;
	}

	save()
	{
		if (Type.isDomNode(this._innerWrapper))
		{
			const oldSaveBlock = this._innerWrapper.querySelector('.save-block');
			if (Type.isDomNode(oldSaveBlock))
			{
				Dom.remove(oldSaveBlock);
			}

			const saveBlock = Tag.render`<div class="save-block"></div>`;
			Dom.append(
				Tag.render`<input type="hidden" name="${this.getName()}" value="${this.#isEnabled ? 'Y' : 'N'}">`,
				saveBlock,
			);
			Dom.append(saveBlock, this._innerWrapper);
		}

		this._model.setField(this.getName(), this.#isEnabled ? 'Y' : 'N');
	}

	buildSwitcher(): HTMLElement
	{
		const switcherNode = this.buildSwitcherNode();
		const content = this.buildSwitcherContent(switcherNode);
		this.initTypingSwitcher(switcherNode);

		return content;
	}

	buildSwitcherNode(): HTMLElement
	{
		return Tag.render`<div class="biconnector-superset-settings-panel-switcher__control"></div>`;
	}

	buildSwitcherContent(switcherNode: HTMLElement): HTMLElement
	{
		const label = Tag.render`
			<div class="biconnector-superset-settings-panel-switcher__label">
				${Loc.getMessage('BICONNECTOR_SUPERSET_SETTINGS_DATASET_TYPING_TOGGLE')}
			</div>
		`;

		return Tag.render`
			<div class="biconnector-superset-settings-panel-switcher">
				${switcherNode}
				${label}
			</div>
		`;
	}

	initTypingSwitcher(switcherNode: HTMLElement): void
	{
		new Switcher({
			node: switcherNode,
			size: SwitcherSize.extraLarge,
			checked: this.#isEnabled,
			disabled: this.#isLocked,
			handlers: {
				toggled: () => {
					if (this.#isLocked)
					{
						return;
					}

					this.#isEnabled = !this.#isEnabled;
					this._model.setField(this.getName(), this.#isEnabled ? 'Y' : 'N');
					this.onChange();
				},
			},
		});
	}
}
