import { Tag } from 'main.core';
import { ShareSettingBlock, type ShareSettingState } from 'biconnector.share-setting';

// The block applies the setting by its own request, so the field takes no part in the form save.
export class ShareSettingField
{
	#block: ShareSettingBlock;

	constructor(dashboardId: number, state: ShareSettingState)
	{
		this.#block = new ShareSettingBlock({ dashboardId, state });
	}

	render(): HTMLElement
	{
		return Tag.render`
			<div class="ui-entity-editor-section-edit dashboard-edit-section dashboard-edit-share-setting-section">
				<div class="ui-entity-editor-section-content">
					<div class="ui-entity-editor-content-block">
						${this.#block.render()}
					</div>
				</div>
			</div>
		`;
	}
}
