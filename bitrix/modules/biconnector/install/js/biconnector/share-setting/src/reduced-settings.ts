import { Dom, Loc, Tag, Text, Type } from 'main.core';
import { DateTimeFormat } from 'main.date';

import { ShareSettingBlock } from './share-setting-block';
import { type ReducedSettingsOptions } from './types';

type InfoRow = {
	code: string,
	value: string,
};

export class ReducedSettings
{
	#options: ReducedSettingsOptions;

	constructor(options: ReducedSettingsOptions)
	{
		this.#options = options;
	}

	render(): HTMLElement
	{
		const block = new ShareSettingBlock({
			dashboardId: this.#options.dashboardId,
			state: this.#options.shareSetting,
		});

		const layout: HTMLElement = Tag.render`
			<div class="biconnector-share-setting-reduced --ui-context-content-light" data-testid="biconnector-share-setting-reduced">
				<div class="biconnector-share-setting-reduced__notice" role="note">
					${Text.encode(Loc.getMessage('BICONNECTOR_SHARE_SETTING_REDUCED_HINT') ?? '')}
				</div>
				${this.#renderBaseInfo()}
				<div class="biconnector-share-setting-reduced__section">
					${block.render()}
				</div>
			</div>
		`;

		Dom.append(layout, this.#options.container);

		return layout;
	}

	#renderBaseInfo(): HTMLElement
	{
		const rows = this.#getInfoRows().map(({ code, value }) => Tag.render`
			<div class="biconnector-share-setting-reduced__row">
				<dt class="biconnector-share-setting-reduced__label">${Text.encode(Loc.getMessage(code) ?? '')}</dt>
				<dd class="biconnector-share-setting-reduced__value">${Text.encode(value)}</dd>
			</div>
		`);

		return Tag.render`
			<dl class="biconnector-share-setting-reduced__section biconnector-share-setting-reduced__info">
				${rows}
			</dl>
		`;
	}

	#getInfoRows(): InfoRow[]
	{
		const { dashboard } = this.#options;
		const rows: InfoRow[] = [
			{ code: 'BICONNECTOR_SHARE_SETTING_FIELD_TITLE', value: dashboard.title },
		];

		if (dashboard.owner)
		{
			rows.push({ code: 'BICONNECTOR_SHARE_SETTING_FIELD_OWNER', value: dashboard.owner.name });
		}

		if (Type.isArrayFilled(dashboard.groups))
		{
			rows.push({ code: 'BICONNECTOR_SHARE_SETTING_FIELD_GROUPS', value: dashboard.groups.join(', ') });
		}

		rows.push({ code: 'BICONNECTOR_SHARE_SETTING_FIELD_DATE_CREATE', value: formatDate(dashboard.dateCreateTimestamp) });

		if (dashboard.dateModifyTimestamp)
		{
			rows.push({ code: 'BICONNECTOR_SHARE_SETTING_FIELD_DATE_MODIFY', value: formatDate(dashboard.dateModifyTimestamp) });
		}

		return rows;
	}
}

function formatDate(timestamp: number): string
{
	return DateTimeFormat.format(DateTimeFormat.getFormat('LONG_DATE_FORMAT'), timestamp);
}
