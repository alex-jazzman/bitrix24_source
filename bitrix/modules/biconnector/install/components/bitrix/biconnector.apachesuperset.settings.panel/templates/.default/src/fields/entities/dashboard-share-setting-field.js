/* eslint-disable no-underscore-dangle,@bitrix24/bitrix24-rules/no-pseudo-private */
import { Dom, Tag, Text } from 'main.core';
import { ShareSettingBlock } from 'biconnector.share-setting';

/**
 * The block applies the setting by its own request, so the field has no value to save or to roll back.
 */
export class DashboardShareSettingField extends BX.UI.EntityEditorCustom
{
	#blockNode: ?HTMLElement = null;

	static create(id, settings): this
	{
		const self = new this(id, settings);
		self.initialize(id, settings);

		return self;
	}

	layout(options: {})
	{
		if (this._hasLayout)
		{
			return;
		}

		this.ensureWrapperCreated({ classNames: ['ui-entity-editor-field-text'] });
		this.adjustWrapper();

		this._innerWrapper = Tag.render`<div class="ui-entity-editor-content-block"></div>`;
		Dom.append(this.#getBlockNode(), this._innerWrapper);
		Dom.append(this._innerWrapper, this._wrapper);

		this.registerLayout(options);
		this._hasLayout = true;
	}

	#getBlockNode(): HTMLElement
	{
		if (!this.#blockNode)
		{
			const data = this._schemeElement.getData();
			this.#blockNode = new ShareSettingBlock({
				dashboardId: Text.toInteger(data.dashboardId),
				state: {
					isBanned: Boolean(data.state?.isBanned),
					canChange: Boolean(data.state?.canChange),
				},
			}).render();
		}

		return this.#blockNode;
	}

	hasContentToDisplay(): boolean
	{
		return true;
	}

	getValue(): string
	{
		return '';
	}

	save(): void
	{}
}
