/* eslint-disable */
this.BX = this.BX || {};
this.BX.Sign = this.BX.Sign || {};
this.BX.Sign.V2 = this.BX.Sign.V2 || {};
(function (exports, main_core, main_core_events, humanresources_hcmlink_dataMapper, ui_entitySelector) {
	'use strict';

	const EntityTypes = Object.freeze({
		User: 'user',
		Company: 'company',
		Role: 'structure-node-role'
	});

	const maxPreviewUserAvatarCount = 6;
	const defaultAvatarLink = '/bitrix/js/socialnetwork/entity-selector/src/images/default-user.svg';
	class HcmLinkMapping extends main_core_events.EventEmitter {
		#api;
		#documentUid = null;
		#integrationId = null;
		#employeeIds = [];
		#participantsIds = [];
		#container = null;
		#usersPreviewContainer = null;
		#enabled = false;
		constructor(options) {
			super();
			this.#api = options.api;
			this.setEventNamespace('BX.Sign.V2.B2e.HcmLinkMapping');
			this.#container = this.render();
		}
		render() {
			if (this.#container) {
				return this.#container;
			}
			const {
				root,
				syncButton
			} = main_core.Tag.render`
			<div class="sign-b2e-hcm-link-party-checker-container --orange">
				<div class="sign-b2e-hcm-link-party-checker-wrapper">
					<div class="sign-b2e-hcm-link-party-checker-wrapper-part --left">
						<div class="sign-b2e-hcm-link-party-checker-title">
							${main_core.Loc.getMessage('SIGN_V2_B2E_HCM_LINK_MAPPING_TITLE')}
						</div>
						<div class="sign-b2e-hcm-link-party-checker-description">
							${main_core.Loc.getMessage('SIGN_V2_B2E_HCM_LINK_MAPPING_TEXT')}
						</div>
					</div>
					<div class="sign-b2e-hcm-link-party-checker-wrapper-part --right">
						${this.#getUsersPreviewContainer()}
						<div class="sign-b2e-hcm-link-party-checker__action-button" ref="syncButton">
							${main_core.Loc.getMessage('SIGN_V2_B2E_HCM_LINK_MAPPING_SYNC_BUTTON')}
						</div>
					</div>
				</div>
			</div>
		`;
			main_core.Event.bind(syncButton, 'click', () => this.#openMapper());
			this.#container = root;
			this.hide();
			return this.#container;
		}
		setEnabled(value) {
			this.#enabled = value;
		}
		setDocumentUid(uid) {
			this.#documentUid = uid;
		}
		async check() {
			if (!main_core.Type.isStringFilled(this.#documentUid)) {
				return true;
			}
			const {
				integrationId,
				userIds,
				allUserIds
			} = await this.#api.checkNotMappedMembersHrIntegration(this.#documentUid);
			this.#participantsIds = allUserIds;
			this.#employeeIds = userIds;
			this.#integrationId = integrationId;
			if (this.#employeeIds.length > 0) {
				await this.#updateUsersPreview();
			}
			return !main_core.Type.isArrayFilled(this.#employeeIds);
		}
		#openMapper() {
			humanresources_hcmlink_dataMapper.Mapper.openSlider({
				companyId: this.#integrationId,
				userIds: new Set(this.#participantsIds),
				mode: humanresources_hcmlink_dataMapper.Mapper.MODE_DIRECT
			}, {
				onCloseHandler: () => {
					this.emit('update');
				}
			});
		}
		hide() {
			main_core.Dom.hide(this.#container);
		}
		show() {
			main_core.Dom.show(this.#container);
		}
		#loadUsersAvatarMap(userIds) {
			return new Promise(resolve => {
				const dialog = new ui_entitySelector.Dialog({
					entities: [{
						id: EntityTypes.User
					}],
					events: {
						'onLoad': event => {
							const users = dialog.getSelectedItems();
							const avatarByUserMap = new Map();
							users.forEach(item => {
								avatarByUserMap.set(Number(item.id), item.avatar);
							});
							resolve(avatarByUserMap);
						}
					},
					preselectedItems: userIds.map(userId => ['user', userId])
				});
				dialog.load();
			});
		}
		async #updateUsersPreview() {
			const usersCount = this.#employeeIds.length;
			const userIds = this.#employeeIds.slice(0, maxPreviewUserAvatarCount);
			const usersAvatarMap = await this.#loadUsersAvatarMap(userIds);
			main_core.Dom.clean(this.#getUsersPreviewContainer());
			const userAvatarContainer = main_core.Tag.render`
			<div class="sign-b2e-hcm-link-party-checker-users-avatar-container"></div>
		`;
			userIds.forEach(userId => {
				const avatarLink = usersAvatarMap.get(userId) ?? defaultAvatarLink;
				const previewElement = main_core.Tag.render`
				<div class="sign-b2e-hcm-link-party-checker-user-preview --orange">
					<img src="${avatarLink}">
				</div>
			`;
				main_core.Dom.append(previewElement, userAvatarContainer);
			});
			main_core.Dom.append(userAvatarContainer, this.#getUsersPreviewContainer());
			const additionalUserCount = usersCount - maxPreviewUserAvatarCount;
			if (additionalUserCount > 0) {
				const counterElement = main_core.Tag.render`
				<div class="sign-b2e-hcm-link-party-checker-users-preview-counter">
					${main_core.Loc.getMessage('SIGN_V2_B2E_HCM_LINK_EMPLOYEE_USERS_COUNT_PLUS', {
				'#COUNT#': additionalUserCount
			})}
				</div>
			`;
				main_core.Dom.append(counterElement, this.#getUsersPreviewContainer());
			}
		}
		#getUsersPreviewContainer() {
			if (!this.#usersPreviewContainer) {
				this.#usersPreviewContainer = main_core.Tag.render`
				<div class="sign-b2e-hcm-link-party-checker-users-preview-container"></div>
			`;
			}
			return this.#usersPreviewContainer;
		}
	}

	exports.HcmLinkMapping = HcmLinkMapping;

})(this.BX.Sign.V2.B2e = this.BX.Sign.V2.B2e || {}, BX, BX.Event, BX.Humanresources.Hcmlink, BX.UI.EntitySelector);
//# sourceMappingURL=hcm-link-mapping.bundle.js.map
