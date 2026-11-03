/* eslint-disable */
this.BX = this.BX || {};
this.BX.BIConnector = this.BX.BIConnector || {};
(function (exports, main_core, main_core_events, ui_iconSet_outline, ui_notification, ui_switcher, biconnector_shareBanDialog, main_date) {
	'use strict';

	const CHANGE_EVENT = 'BIConnector.ShareSetting:onChange';
	class ShareSettingBlock {
		#dashboardId;
		#isBanned;
		#canChange;
		#switcher;
		#switcherNode;
		#stateNode;
		#descriptionNode;
		constructor(options) {
			this.#dashboardId = options.dashboardId;
			this.#isBanned = options.state.isBanned;
			this.#canChange = options.state.canChange;
			this.#switcherNode = main_core.Tag.render`
			<span class="biconnector-share-setting__switcher" data-testid="biconnector-share-setting-toggle"></span>
		`;
			this.#stateNode = main_core.Tag.render`<span class="biconnector-share-setting__state"></span>`;
			this.#descriptionNode = main_core.Tag.render`<div class="biconnector-share-setting__description"></div>`;
			this.#switcher = new ui_switcher.Switcher({
				node: this.#switcherNode,
				size: ui_switcher.SwitcherSize.medium,
				useAirDesign: true,
				accessible: true,
				ariaLabelledBy: this.#getTitleId(),
				checked: !this.#isBanned,
				disabled: !this.#canChange,
				handlers: {
					toggled: () => {
						void this.#change(!this.#switcher.isChecked());
					}
				}
			});
		}
		render() {
			this.#renderState();
			return main_core.Tag.render`
			<div class="biconnector-share-setting" data-testid="biconnector-share-setting-block">
				<div class="ui-entity-editor-section-header biconnector-share-setting__header">
					<div class="ui-entity-editor-header-title">
						<div
							class="ui-entity-editor-header-title-text biconnector-share-setting__title"
							id="${this.#getTitleId()}"
						>
							<span class="ui-icon-set --o-link biconnector-share-setting__title-icon"></span>
							<span>${main_core.Text.encode(phrase('BICONNECTOR_SHARE_SETTING_TITLE'))}</span>
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
		async #change(isBanning) {
			const wasBanned = this.#isBanned;
			this.#switcher.setLoading(true);
			const isBanned = isBanning ? await biconnector_shareBanDialog.ShareBanDialog.ban(this.#dashboardId) : await biconnector_shareBanDialog.ShareBanDialog.unban(this.#dashboardId);
			this.#switcher.setLoading(false);
			this.#isBanned = isBanned ?? wasBanned;
			this.#switcher.check(!this.#isBanned, false);
			this.#renderState();
			if (isBanned === null || isBanned === wasBanned) {
				return;
			}
			getTopEmitter().emit(CHANGE_EVENT, {
				dashboardId: this.#dashboardId,
				isBanned
			});
			ui_notification.Center.notify({
				content: main_core.Text.encode(phrase(isBanned ? 'BICONNECTOR_SHARE_SETTING_APPLIED_BANNED' : 'BICONNECTOR_SHARE_SETTING_APPLIED_ALLOWED'))
			});
		}
		#renderState() {
			this.#stateNode.textContent = phrase(this.#isBanned ? 'BICONNECTOR_SHARE_SETTING_STATE_BANNED' : 'BICONNECTOR_SHARE_SETTING_STATE_ALLOWED');
			this.#descriptionNode.textContent = phrase(this.#isBanned ? 'BICONNECTOR_SHARE_SETTING_DESCRIPTION_BANNED' : 'BICONNECTOR_SHARE_SETTING_DESCRIPTION_ALLOWED');
			main_core.Dom.attr(this.#stateNode, 'data-state', this.#isBanned ? 'banned' : 'allowed');
		}
		#getTitleId() {
			return `biconnector-share-setting-title-${this.#dashboardId}`;
		}
		#renderNoRightHint() {
			return main_core.Tag.render`
			<div class="biconnector-share-setting__hint" data-testid="biconnector-share-setting-no-right">
				${main_core.Text.encode(phrase('BICONNECTOR_SHARE_SETTING_NO_RIGHT'))}
			</div>
		`;
		}
	}
	function getTopEmitter() {
		return main_core.Reflection.getClass('top.BX.Event.EventEmitter') ?? main_core_events.EventEmitter;
	}
	function phrase(code) {
		return main_core.Loc.getMessage(code) ?? '';
	}

	class ReducedSettings {
		#options;
		constructor(options) {
			this.#options = options;
		}
		render() {
			const block = new ShareSettingBlock({
				dashboardId: this.#options.dashboardId,
				state: this.#options.shareSetting
			});
			const layout = main_core.Tag.render`
			<div class="biconnector-share-setting-reduced --ui-context-content-light" data-testid="biconnector-share-setting-reduced">
				<div class="biconnector-share-setting-reduced__notice" role="note">
					${main_core.Text.encode(main_core.Loc.getMessage('BICONNECTOR_SHARE_SETTING_REDUCED_HINT') ?? '')}
				</div>
				${this.#renderBaseInfo()}
				<div class="biconnector-share-setting-reduced__section">
					${block.render()}
				</div>
			</div>
		`;
			main_core.Dom.append(layout, this.#options.container);
			return layout;
		}
		#renderBaseInfo() {
			const rows = this.#getInfoRows().map(({
				code,
				value
			}) => main_core.Tag.render`
			<div class="biconnector-share-setting-reduced__row">
				<dt class="biconnector-share-setting-reduced__label">${main_core.Text.encode(main_core.Loc.getMessage(code) ?? '')}</dt>
				<dd class="biconnector-share-setting-reduced__value">${main_core.Text.encode(value)}</dd>
			</div>
		`);
			return main_core.Tag.render`
			<dl class="biconnector-share-setting-reduced__section biconnector-share-setting-reduced__info">
				${rows}
			</dl>
		`;
		}
		#getInfoRows() {
			const {
				dashboard
			} = this.#options;
			const rows = [{
				code: 'BICONNECTOR_SHARE_SETTING_FIELD_TITLE',
				value: dashboard.title
			}];
			if (dashboard.owner) {
				rows.push({
					code: 'BICONNECTOR_SHARE_SETTING_FIELD_OWNER',
					value: dashboard.owner.name
				});
			}
			if (main_core.Type.isArrayFilled(dashboard.groups)) {
				rows.push({
					code: 'BICONNECTOR_SHARE_SETTING_FIELD_GROUPS',
					value: dashboard.groups.join(', ')
				});
			}
			rows.push({
				code: 'BICONNECTOR_SHARE_SETTING_FIELD_DATE_CREATE',
				value: formatDate(dashboard.dateCreateTimestamp)
			});
			if (dashboard.dateModifyTimestamp) {
				rows.push({
					code: 'BICONNECTOR_SHARE_SETTING_FIELD_DATE_MODIFY',
					value: formatDate(dashboard.dateModifyTimestamp)
				});
			}
			return rows;
		}
	}
	function formatDate(timestamp) {
		return main_date.DateTimeFormat.format(main_date.DateTimeFormat.getFormat('LONG_DATE_FORMAT'), timestamp);
	}

	exports.ReducedSettings = ReducedSettings;
	exports.ShareSettingBlock = ShareSettingBlock;

})(this.BX.BIConnector.ShareSetting = this.BX.BIConnector.ShareSetting || {}, BX, BX.Event, window, BX.UI.Notification, BX.UI, BX.BIConnector, BX.Main);
//# sourceMappingURL=share-setting.bundle.js.map
