import { Dom, Loc, Reflection, Tag, Text } from 'main.core';
import { EventEmitter } from 'main.core.events';
import 'ui.icon-set.outline';
import { Center as NotificationCenter } from 'ui.notification';
import { Switcher, SwitcherSize } from 'ui.switcher';

import { ShareBanDialog } from 'biconnector.share-ban-dialog';

import { type ShareSettingBlockOptions } from './types';

import './style.css';

export const CHANGE_EVENT = 'BIConnector.ShareSetting:onChange';

export class ShareSettingBlock
{
	#dashboardId: number;
	#isBanned: boolean;
	#canChange: boolean;
	#switcher: Switcher;
	#switcherNode: HTMLElement;
	#stateNode: HTMLElement;
	#descriptionNode: HTMLElement;

	constructor(options: ShareSettingBlockOptions)
	{
		this.#dashboardId = options.dashboardId;
		this.#isBanned = options.state.isBanned;
		this.#canChange = options.state.canChange;

		this.#switcherNode = Tag.render`
			<span class="biconnector-share-setting__switcher" data-testid="biconnector-share-setting-toggle"></span>
		`;
		this.#stateNode = Tag.render`<span class="biconnector-share-setting__state"></span>`;
		this.#descriptionNode = Tag.render`<div class="biconnector-share-setting__description"></div>`;

		this.#switcher = new Switcher({
			node: this.#switcherNode,
			size: SwitcherSize.medium,
			useAirDesign: true,
			accessible: true,
			ariaLabelledBy: this.#getTitleId(),
			checked: !this.#isBanned,
			disabled: !this.#canChange,
			handlers: {
				toggled: () => {
					void this.#change(!this.#switcher.isChecked());
				},
			},
		});
	}

	render(): HTMLElement
	{
		this.#renderState();

		return Tag.render`
			<div class="biconnector-share-setting" data-testid="biconnector-share-setting-block">
				<div class="ui-entity-editor-section-header biconnector-share-setting__header">
					<div class="ui-entity-editor-header-title">
						<div
							class="ui-entity-editor-header-title-text biconnector-share-setting__title"
							id="${this.#getTitleId()}"
						>
							<span class="ui-icon-set --o-link biconnector-share-setting__title-icon"></span>
							<span>${Text.encode(phrase('BICONNECTOR_SHARE_SETTING_TITLE'))}</span>
						</div>
					</div>
				</div>
				${this.#descriptionNode}
				<div class="biconnector-share-setting__control">
					${this.#switcherNode}
					${this.#stateNode}
				</div>
				${this.#canChange ? '' : this.#renderNoRightHint()}
			</div>
		`;
	}

	async #change(isBanning: boolean): Promise<void>
	{
		const wasBanned = this.#isBanned;

		this.#switcher.setLoading(true);
		const isBanned = isBanning
			? await ShareBanDialog.ban(this.#dashboardId)
			: await ShareBanDialog.unban(this.#dashboardId)
		;
		this.#switcher.setLoading(false);

		this.#isBanned = isBanned ?? wasBanned;
		this.#switcher.check(!this.#isBanned, false);
		this.#renderState();

		if (isBanned === null || isBanned === wasBanned)
		{
			return;
		}

		getTopEmitter().emit(CHANGE_EVENT, { dashboardId: this.#dashboardId, isBanned });
		NotificationCenter.notify({
			content: Text.encode(phrase(
				isBanned ? 'BICONNECTOR_SHARE_SETTING_APPLIED_BANNED' : 'BICONNECTOR_SHARE_SETTING_APPLIED_ALLOWED',
			)),
		});
	}

	#renderState(): void
	{
		this.#stateNode.textContent = phrase(
			this.#isBanned ? 'BICONNECTOR_SHARE_SETTING_STATE_BANNED' : 'BICONNECTOR_SHARE_SETTING_STATE_ALLOWED',
		);
		this.#descriptionNode.textContent = phrase(
			this.#isBanned ? 'BICONNECTOR_SHARE_SETTING_DESCRIPTION_BANNED' : 'BICONNECTOR_SHARE_SETTING_DESCRIPTION_ALLOWED',
		);
		Dom.attr(this.#stateNode, 'data-state', this.#isBanned ? 'banned' : 'allowed');
	}

	#getTitleId(): string
	{
		return `biconnector-share-setting-title-${this.#dashboardId}`;
	}

	#renderNoRightHint(): HTMLElement
	{
		return Tag.render`
			<div class="biconnector-share-setting__hint" data-testid="biconnector-share-setting-no-right">
				${Text.encode(phrase('BICONNECTOR_SHARE_SETTING_NO_RIGHT'))}
			</div>
		`;
	}
}

// The settings open in a slider frame, while the listeners live on the page under it.
function getTopEmitter(): typeof EventEmitter
{
	return (Reflection.getClass('top.BX.Event.EventEmitter') as typeof EventEmitter | null) ?? EventEmitter;
}

function phrase(code: string): string
{
	return Loc.getMessage(code) ?? '';
}
