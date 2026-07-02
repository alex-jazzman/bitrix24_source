/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, main_core, main_core_events, main_popup, ui_buttons) {
	'use strict';

	class ItemInfo {
		#entityTypeName;
		#entityId;
		#entityTypeTitle;
		#entityTitle;
		#isMy;
		#isHidden;
		#entityUrl;
		#relatedEntityTitle = "";
		#responsible;
		#communications;
		#matchIndex;
		constructor() {
			this.#communications = {
				phone: [],
				email: []
			};
			this.#matchIndex = {
				phone: [],
				email: []
			};
			this.#responsible = {
				id: 0,
				fullName: "",
				profileUrl: "",
				photoUrl: ""
			};
		}
		toPlainObject() {
			return {
				entityTypeName: this.#entityTypeName,
				entityId: this.#entityId,
				entityTypeTitle: this.#entityTypeTitle,
				entityTitle: this.#entityTitle,
				isMy: this.#isMy,
				isHidden: this.#isHidden,
				entityUrl: this.#entityUrl,
				relatedEntityTitle: this.#relatedEntityTitle,
				responsible: this.#responsible,
				communications: this.#communications,
				matchIndex: this.#matchIndex
			};
		}
		set entityTypeName(value) {
			this.#entityTypeName = value;
		}
		get entityTypeName() {
			return this.#entityTypeName;
		}
		set entityId(value) {
			this.#entityId = value;
		}
		get entityId() {
			return this.#entityId;
		}
		set entityTypeTitle(value) {
			this.#entityTypeTitle = value;
		}
		get entityTypeTitle() {
			return this.#entityTypeTitle;
		}
		set entityTitle(value) {
			this.#entityTitle = value;
		}
		get entityTitle() {
			return this.#entityTitle;
		}
		set isMy(value) {
			this.#isMy = value;
		}
		get isMy() {
			return this.#isMy;
		}
		set isHidden(value) {
			this.#isHidden = value;
		}
		get isHidden() {
			return this.#isHidden;
		}
		set entityUrl(value) {
			this.#entityUrl = value;
		}
		get entityUrl() {
			return this.#entityUrl;
		}
		set relatedEntityTitle(value) {
			this.#relatedEntityTitle = value;
		}
		get relatedEntityTitle() {
			return this.#relatedEntityTitle;
		}
		set responsible(value) {
			this.#responsible = value;
		}
		get responsible() {
			return this.#responsible;
		}
		#addCommunicationValue(communicationType, value, isMatched) {
			if (this.#communications[communicationType].indexOf(value) < 0) {
				if (isMatched) {
					this.#matchIndex[communicationType].push(this.#communications[communicationType].length);
				}
				this.#communications[communicationType].push(value);
			}
		}
		#addCommunicationList(communicationType, list, matchIndex) {
			for (let i = 0; i < list.length; i++) {
				this.#addCommunicationValue(communicationType, list[i], matchIndex.includes(i.toString()));
			}
		}
		addPhones(values, matchIndex) {
			const matchIndexPhone = BX.prop.getArray(matchIndex, "PHONE", []);
			this.#addCommunicationList("phone", values, matchIndexPhone);
		}
		addEmails(values, matchIndex) {
			const matchIndexEmail = BX.prop.getArray(matchIndex, "EMAIL", []);
			this.#addCommunicationList("email", values, matchIndexEmail);
		}
	}
	class SummaryList extends main_core_events.EventEmitter {
		#handleWindowResize;
		constructor() {
			super();
			this.setEventNamespace('crm.entity-editor.summary-list.close');
			this.id = '';
			this.popupId = '';
			this.settings = {};
			this.anchor = null;
			this.wrapper = null;
			this.clientSearchBox = null;
			this.enableEntitySelect = false;
			this.items = [];
			this.padding = 0;
			this.#handleWindowResize = null;
		}
		initialize(id, settings) {
			this.id = BX.type.isNotEmptyString(id) ? id : BX.util.getRandomString(4);
			this.popupId = this.id + "_popup";
			if (main_core.Type.isPlainObject(settings)) {
				this.settings = settings;
				this.anchor = BX.prop.getElementNode(settings, "anchor", null);
				this.wrapper = BX.prop.getElementNode(settings, "wrapper", null);
				this.clientSearchBox = BX.prop.get(settings, "clientSearchBox", null);
				this.enableEntitySelect = BX.prop.getBoolean(settings, "enableEntitySelect", false);
			}
			this.padding = BX.prop.getInteger(settings, 'padding', 11);
		}
		show() {
			const popup = main_popup.PopupManager.create({
				id: this.popupId,
				cacheable: false,
				padding: this.padding,
				contentPadding: 0,
				content: this.getLayout(),
				closeIcon: {
					top: '11px',
					right: '5px'
				},
				borderRadius: '12px',
				closeByEsc: false,
				background: this.#getPopupBackgroundColor(),
				animation: {
					closeAnimationType: 'animation',
					showClassName: 'crm-dups-popup-open',
					closeClassName: 'crm-dups-popup-close'
				}
			});
			if (!this.#handleWindowResize) {
				this.#handleWindowResize = this.adjustPosition.bind(this);
				main_core.bind(window, 'resize', this.#handleWindowResize);
			}
			popup.subscribe('onDestroy', () => {
				this.emit('close', this);
			});
			popup.subscribe("onFirstShow", event => {
				event.target.getZIndexComponent().subscribe("onZIndexChange", event => {
					if (event.target.getZIndex() !== 850) {
						event.target.setZIndex(850);
					}
				});
			});
			popup.show();
			this.adjustPosition();
		}
		getController() {
			const controller = BX.prop.get(this.settings, "controller", null);
			return controller instanceof BX.CrmDupController ? controller : null;
		}
		getTargetEntityTypeName() {
			const controller = this.getController();
			return controller ? controller.getEntityTypeName() : "";
		}
		getDuplicateData() {
			const controller = this.getController();
			return controller ? controller.getDuplicateData() : {};
		}
		getGroup(groupId) {
			const controller = main_core.Type.isStringFilled(groupId) ? this.getController() : null;
			return controller ? controller.getGroup(groupId) : null;
		}
		getGroupSummaryTitle(groupId, groupData) {
			if (main_core.Type.isPlainObject(groupData) && groupData.hasOwnProperty("totalText") && main_core.Type.isStringFilled(groupData['totalText'])) {
				const group = this.getGroup(groupId);
				const title = group ? group.getSummaryTitle() : "";
				if (main_core.Type.isStringFilled(title)) {
					return groupData['totalText'] + " " + title;
				}
			}
			return "";
		}
		getLayoutData() {
			const result = {
				title: "",
				groups: []
			};
			const data = this.getDuplicateData();
			let totalItemCount = 0;
			for (const groupId in data) {
				if (!data.hasOwnProperty(groupId)) {
					continue;
				}
				const groupData = main_core.Type.isPlainObject(data[groupId]) ? data[groupId] : {};
				const items = main_core.Type.isArray(groupData["items"]) ? groupData["items"] : [];
				const groupInfo = {
					title: this.getGroupSummaryTitle(groupId, groupData),
					items: []
				};
				const entityTypeIdMap = [];
				for (let i = 0; i < items.length; i++) {
					const item = items[i];
					const entities = main_core.Type.isArray(item["ENTITIES"]) ? item["ENTITIES"] : [];
					for (let j = 0; j < entities.length; j++) {
						const entity = entities[j];
						const entityTypeId = this.getEntityTypeId(entity);
						if (!BX.CrmEntityType.isDefined(entityTypeId)) {
							continue;
						}
						const entityTypeName = BX.CrmEntityType.resolveName(entityTypeId);
						const entityId = this.getEntityId(entity);
						let needAdd = false;
						if (!entityTypeIdMap.hasOwnProperty(entityTypeName)) {
							entityTypeIdMap[entityTypeName] = [entityId];
							needAdd = true;
						} else {
							const isExists = entityTypeIdMap[entityTypeName].indexOf(entityId) >= 0;
							if (!isExists) {
								entityTypeIdMap[entityTypeName].push(entityId);
								needAdd = true;
							}
						}
						if (needAdd) {
							groupInfo.items.push(this.prepareItemInfo(entity));
						}
					}
				}
				if (groupInfo.items.length > 0) {
					totalItemCount += groupInfo.items.length;
					result.groups.push(groupInfo);
				}
			}
			result.title = main_core.Loc.getMessage("DUPLICATE_SUMMARY_LIST_TOTAL_COUNT_TITLE", {
				"#COUNT#": totalItemCount
			});
			return result;
		}
		getEntityTypeId(entity) {
			return main_core.Type.isStringFilled(entity["ENTITY_TYPE_ID"]) ? parseInt(entity["ENTITY_TYPE_ID"]) : 0;
		}
		getEntityId(entity) {
			return main_core.Type.isStringFilled(entity["ENTITY_ID"]) ? parseInt(entity["ENTITY_ID"]) : 0;
		}
		prepareItemInfo(entity) {
			const itemInfo = new ItemInfo();
			const entityTypeId = this.getEntityTypeId(entity);
			itemInfo.entityTypeName = BX.CrmEntityType.resolveName(entityTypeId);
			itemInfo.entityId = this.getEntityId(entity);
			itemInfo.entityTypeTitle = BX.prop.getString(entity, 'CATEGORY_NAME', BX.CrmEntityType.getCaption(entityTypeId));
			itemInfo.entityTitle = BX.prop.getString(entity, "TITLE", "");
			itemInfo.isMy = entityTypeId === BX.CrmEntityType.enumeration.company && BX.prop.getString(entity, "IS_MY_COMPANY", "") === "Y";
			itemInfo.isHidden = BX.prop.getString(entity, "IS_HIDDEN", "") === "Y";
			itemInfo.entityUrl = BX.prop.getString(entity, "URL", "");
			itemInfo.responsible = {
				id: BX.prop.getInteger(entity, "RESPONSIBLE_ID", 0),
				fullName: BX.prop.getString(entity, "RESPONSIBLE_FULL_NAME", ""),
				profileUrl: BX.prop.getString(entity, "RESPONSIBLE_URL", "#"),
				photoUrl: BX.prop.getString(entity, "RESPONSIBLE_PHOTO_URL", "#")
			};
			const matchIndex = BX.prop.getObject(entity, "MATCH_INDEX", {
				PHONE: [],
				EMAIL: []
			});
			itemInfo.addPhones(BX.prop.getArray(entity, "PHONE", []), matchIndex);
			itemInfo.addEmails(BX.prop.getArray(entity, "EMAIL", []), matchIndex);
			return itemInfo.toPlainObject();
		}
		renderItemDetails(item) {
			let content = "";
			const communications = item["communications"];
			const matchIndex = BX.prop.getObject(item, "matchIndex", {
				phone: [],
				email: []
			});
			["phone", "email"].forEach(type => {
				const maxItems = 5;
				let needDots = false;
				if (!needDots && communications[type].length > maxItems) {
					needDots = true;
				}
				if (communications[type].length > 0) {
					for (let i = 0; i < communications[type].length; i++) {
						if (i >= maxItems) {
							break;
						}
						if (content.length > 0) {
							content += ", ";
						}
						const isMatched = matchIndex[type].includes(i);
						const value = main_core.Text.encode(communications[type][i]);
						content += isMatched ? "<span class=\"crm-dups-item-details-matched\">" + value + "</span>" : value;
					}
					if (needDots) {
						content += ", ...";
					}
				}
			});
			return content;
		}
		renderHiddenItem(item) {
			return main_core.Tag.render`
			<div class="crm-dups-item">
				<div class="crm-dups-item-top">
					<div class="crm-dups-item-header">
						<div class="crm-dups-item-type">${main_core.Text.encode(item["entityTypeTitle"])}</div>
						<span class="crm-dups-item-title-hidden">${main_core.Text.encode(item["entityTitle"])}</span>
						<div class="crm-dups-item-rel-title hidden"></div>
					</div>
					<div class="crm-dups-item-photo bx-ui-tooltip-photo">
						<span
							class="bx-ui-tooltip-info-data-photo no-photo"
							style="width: 20px; height: 20px;"
						></span>
					</div>
				</div>
				<div class="crm-dups-item-details">
				</div>
			</div>
		`;
		}
		renderVisibleItem(item) {
			return main_core.Tag.render`
			<div class="crm-dups-item">
				<div class="crm-dups-item-top">
					<div class="crm-dups-item-header">
						<div class="crm-dups-item-type">${main_core.Text.encode(item["entityTypeTitle"])}</div>
						<a
							href="${main_core.Text.encode(item["entityUrl"])}"
							class="crm-dups-item-title">${main_core.Text.encode(item["entityTitle"])}</a>
						<div class="crm-dups-item-rel-title hidden"></div>
					</div>
					${this.#renderResponsible(item["responsible"])}
				</div>
				<div class="crm-dups-item-details">
					${this.renderItemDetails(item)}
				</div>
					${this.#renderAddButton({
			"type": item["entityTypeName"],
			"id": item["entityId"],
			"title": item["entityTitle"],
			"isMy": item["isMy"]
		})}
			</div>
		`;
		}
		renderItem(item) {
			return item["isHidden"] ? this.renderHiddenItem(item) : this.renderVisibleItem(item);
		}
		getLayout() {
			const layoutData = this.getLayoutData();
			if (!(main_core.Type.isStringFilled(layoutData["title"]) && main_core.Type.isArrayFilled(layoutData["groups"]))) {
				return "";
			}
			return main_core.Tag.render`
			<div class="crm-dups-wrapper">
				<div class="crm-dups-header">${main_core.Text.encode(layoutData["title"])}</div>
				<div class="crm-dups-list">${layoutData["groups"].map(group => main_core.Tag.render`
					<div class="crm-dups-group">
						<div class="crm-dups-group-header">${main_core.Text.encode(group["title"])}</div>
						<div class="crm-dups-group-items">${group["items"].map(item => main_core.Tag.render`
							${this.renderItem(item)}
						`)}</div>
					</div>
				`)}</div>
			</div>
		`;
		}
		adjustPosition() {
			const popup = main_popup.PopupManager.getPopupById(this.popupId);
			if (!popup || !popup.isShown() || !main_core.Type.isDomNode(this.anchor) || !main_core.Type.isDomNode(this.wrapper)) {
				return;
			}
			const wrapperRect = this.wrapper.getBoundingClientRect();
			const itemRect = this.anchor.getBoundingClientRect();
			const viewRect = document.documentElement.getBoundingClientRect();
			const viewTop = -viewRect.top;
			const viewBottom = viewRect.height - viewRect.top;
			const offsetLeft = -viewRect.left + wrapperRect.left + wrapperRect.width + this.padding;
			const popupHeight = popup.getPopupContainer().clientHeight;
			let popupVerticalPosition;
			let angleOffset;
			const itemVerticalCenter = viewTop + itemRect.top + itemRect.height / 2;
			if (itemVerticalCenter < viewTop) {
				popupVerticalPosition = viewTop + itemRect.top - this.padding;
				angleOffset = this.padding + itemRect.height / 2;
			} else if (itemVerticalCenter > viewBottom) {
				popupVerticalPosition = viewTop + itemRect.bottom + this.padding - popupHeight;
				angleOffset = popupHeight - this.padding - itemRect.height / 2;
			} else if (popupHeight < viewRect.height) {
				let verticalOffset = 0;
				popupVerticalPosition = itemVerticalCenter - popupHeight / 2;
				if (popupVerticalPosition < viewTop) {
					verticalOffset = viewTop - popupVerticalPosition;
				} else if (viewBottom < popupVerticalPosition + popupHeight) {
					verticalOffset = viewBottom - popupVerticalPosition - popupHeight;
				}
				popupVerticalPosition += verticalOffset;
				angleOffset = itemVerticalCenter - popupVerticalPosition;
			} else {
				popupVerticalPosition = viewTop;
				angleOffset = itemVerticalCenter - popupVerticalPosition;
				if (angleOffset < 0) {
					angleOffset += popupHeight;
				}
			}
			angleOffset -= this.padding;
			popup.setBindElement({
				left: offsetLeft,
				top: popupVerticalPosition
			});
			popup.setAngle({
				position: "left",
				offset: angleOffset
			});
			popup.adjustPosition();
			setTimeout(() => popup.getZIndexComponent().setZIndex(850), 0);
		}
		isShown() {
			const popup = main_popup.PopupManager.getPopupById(this.popupId);
			return popup && popup.isShown();
		}
		close() {
			const popup = main_popup.PopupManager.getPopupById(this.popupId);
			popup ? popup.close() : null;
			main_core.unbind(document, 'resize', this.#handleWindowResize);
			this.#handleWindowResize = null;
		}
		#getPopupBackgroundColor() {
			const bodyStyles = getComputedStyle(document.body);
			return bodyStyles?.getPropertyValue("--ui-color-background-primary") || '#FFFFFF';
		}
		#renderResponsible(options) {
			const isPhoto = main_core.Type.isStringFilled(options["photoUrl"]) && options["photoUrl"] !== "#";
			const noPhotoClass = isPhoto ? "" : " no-photo";
			const backgroundStyle = isPhoto ? ` background: url('${main_core.Text.encode(options["photoUrl"])}') no-repeat center; background-size: cover;` : "";
			const responsibleContainer = main_core.Tag.render`<div class="crm-dups-item-photo bx-ui-tooltip-photo">
			<a
				href="${main_core.Text.encode(options["profileUrl"])}"
				class="bx-ui-tooltip-info-data-photo${noPhotoClass}"
				style="width: 20px; height: 20px;${backgroundStyle}"
				data-hint="${main_core.Text.encode(options["fullName"])}"
				data-hint-no-icon
			></a>
		</div>`;
			BX.UI.Hint.popupParameters = {
				padding: 10
			};
			BX.UI.Hint.init(responsibleContainer);
			return responsibleContainer;
		}
		#renderAddButton(options) {
			if (!this.enableEntitySelect || options.hasOwnProperty("isMy") && options["isMy"] || main_core.Type.isPlainObject(options) && options.hasOwnProperty("type") && options["type"] !== this.getTargetEntityTypeName()) {
				return "";
			}
			const btn = new ui_buttons.Button({
				round: true,
				color: ui_buttons.Button.Color.LIGHT_BORDER,
				size: ui_buttons.Button.Size.EXTRA_SMALL,
				text: main_core.Loc.getMessage('DUPLICATE_SUMMARY_LIST_ITEM_ADD_BUTTON'),
				context: {
					type: options["type"],
					id: options["id"],
					title: BX.prop.getString(options, "title", "")
				},
				onclick: (btn, e) => {
					e.stopPropagation();
					this.onAddButtonClick(btn.getContext());
				}
			});
			return main_core.Tag.render`<div class="crm-dups-item-add-btn">${btn.render()}</div>`;
		}
		onAddButtonClick(context) {
			if (this.clientSearchBox) {
				main_core_events.EventEmitter.emit(this.clientSearchBox, 'onSelectEntityExternal', context);
			}
			this.close();
		}
		static create(id, settings) {
			const self = new SummaryList();
			self.initialize(id, settings);
			return self;
		}
	}

	exports.SummaryList = SummaryList;

})(this.BX.Crm.Duplicate = this.BX.Crm.Duplicate || {}, BX, BX.Event, BX.Main, BX.UI);
//# sourceMappingURL=summary-list.bundle.js.map
