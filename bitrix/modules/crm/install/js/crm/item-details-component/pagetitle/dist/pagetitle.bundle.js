/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
this.BX.Crm.ItemDetailsComponent = this.BX.Crm.ItemDetailsComponent || {};
(function (exports, crm_categoryModel, main_core, main_core_events, main_popup, ui_notification, ui_dialogs_messagebox) {
	'use strict';

	class Logger {
		#prefix;
		constructor(prefix) {
			this.#prefix = prefix;
		}
		warn(message, ...params) {
			// eslint-disable-next-line no-console
			console.warn(this.#format(message), ...params);
		}
		error(message, ...params) {
			// eslint-disable-next-line no-console
			console.error(this.#format(message), ...params);
		}
		#format(message) {
			return `${this.#prefix}: ${message}`;
		}
	}
	const logger = new Logger('crm.item-details-component.pagetitle');

	/**
	 * Renders category change control, typically in the details card header near title.
	 * WARNING! On successful change, the page is reloaded with window.location.reload or window.location.href.
	 * It's a feature :)
	 *
	 * @memberOf BX.Crm.ItemDetailsComponent.PageTitle
	 *
	 * @mixes EventEmitter
	 *
	 * @emits BX.Crm.ItemDetailsComponent.CategoryChanger:onProgressStart
	 * @emits BX.Crm.ItemDetailsComponent.CategoryChanger:onProgressStop
	 */
	class CategoryChanger {
		#entityTypeId;
		#id;
		#categoryId;
		#categories;
		#editorGuid = null;
		#labelTemplate;
		#menuId;
		#logger;
		#isProgress = false;
		constructor({
			entityTypeId,
			entityId,
			categoryId,
			categories,
			editorGuid,
			labelTemplate
		}) {
			this.#entityTypeId = entityTypeId;
			this.#id = entityId;
			this.#categoryId = categoryId;
			this.#categories = categories;
			this.#editorGuid = editorGuid;
			this.#labelTemplate = main_core.Type.isStringFilled(labelTemplate) ? labelTemplate : '#CATEGORY#';
			this.#menuId = `item-category-changer-${this.#entityTypeId}-${this.#id}`;
			this.#logger = logger;
			main_core_events.EventEmitter.makeObservable(this, 'BX.Crm.ItemDetailsComponent.CategoryChanger');
		}
		static renderToTarget(target, params) {
			const changer = new CategoryChanger({
				...params,
				categories: params.categories.map(category => new crm_categoryModel.CategoryModel(category))
			});
			const realTarget = main_core.Type.isDomNode(target) ? target : document.querySelector(target);
			if (!realTarget) {
				logger.warn('target not found, skip rendering');
				return null;
			}
			main_core.Dom.append(changer.render(), realTarget);
			return changer;
		}
		render() {
			const current = this.#getCurrentCategory();
			if (!current) {
				this.#logger.warn('current category not found, skip rendering');
				return null;
			}
			const label = this.#labelTemplate.replace('#CATEGORY#', current.getName());
			const element = main_core.Tag.render`
			<div class="crm-details-pagetitle-legend-container">
				<a href="#" onclick="${this.#onCategorySelectorClick.bind(this)}">
					${main_core.Text.encode(label)}
				</a>
			</div>
		`;
			if (this.#isNew()) {
				main_core.Dom.addClass(element, '--new');
			}
			return element;
		}
		#onCategorySelectorClick(event) {
			const items = [];
			for (const category of this.#categories) {
				items.push({
					text: category.getName(),
					onclick: this.#onCategorySelect.bind(this, category.getId())
				});
			}
			main_popup.MenuManager.show({
				id: this.#menuId,
				bindElement: event.target,
				items
			});
		}
		#onCategorySelect(wantCategoryId) {
			if (wantCategoryId === this.#categoryId) {
				main_popup.MenuManager.destroy(this.#menuId);
				return;
			}
			if (this.#isProgress) {
				return;
			}
			if (this.#isEditorChanged()) {
				this.#showUnsavedChangesDialog(this.#changeCategory.bind(this, wantCategoryId));
			} else {
				this.#changeCategory(wantCategoryId);
			}
		}
		#changeCategory(wantCategoryId) {
			this.#startProgress();
			if (this.#isNew()) {
				this.#reloadPageWhenCategoryChanged(wantCategoryId);
			} else {
				this.#changeCategoryViaAjax(wantCategoryId);
			}
		}
		#reloadPageWhenCategoryChanged(wantCategoryId) {
			const url = new main_core.Uri(window.location.href);
			// for factory-based details
			url.setQueryParam('categoryId', wantCategoryId);
			// for crm.deal.details
			url.setQueryParam('category_id', wantCategoryId);
			setTimeout(() => {
				window.location.href = url.toString();
				this.#stopProgress();
			});
		}
		#changeCategoryViaAjax(wantCategoryId) {
			main_core.ajax.runAction('crm.controller.item.update', {
				analyticsLabel: 'crmItemDetailsChangeCategory',
				data: {
					entityTypeId: this.#entityTypeId,
					id: this.#id,
					fields: {
						categoryId: wantCategoryId
					}
				}
			}).then(() => {
				setTimeout(() => {
					window.location.reload();
					this.#stopProgress();
				});
			}).catch(response => {
				this.#logger.warn('error changing category via ajax', response);
				const message = response?.errors?.[0]?.message || 'Something went wrong';
				BX.UI.Notification.Center.notify({
					content: message,
					position: 'top-right',
					autoHideDelay: 3000
				});
				this.#stopProgress();
			});
		}
		#showUnsavedChangesDialog(onOk) {
			const entityTypeName = BX.CrmEntityType?.resolveName(this.#entityTypeId);
			const dynamicKey = `CRM_ITEM_PAGETITLE_CATEGORY_CHANGER_CONFIRM_DIALOG_MESSAGE_${entityTypeName}`;
			const message = main_core.Loc.hasMessage(dynamicKey) ? main_core.Loc.getMessage(dynamicKey) : main_core.Loc.getMessage('CRM_ITEM_PAGETITLE_CATEGORY_CHANGER_CONFIRM_DIALOG_MESSAGE');
			ui_dialogs_messagebox.MessageBox.show({
				modal: true,
				title: main_core.Loc.getMessage('CRM_ITEM_PAGETITLE_CATEGORY_CHANGER_CONFIRM_DIALOG_TITLE'),
				message,
				minHeight: 100,
				buttons: ui_dialogs_messagebox.MessageBoxButtons.OK_CANCEL,
				okCaption: main_core.Loc.getMessage('CRM_ITEM_PAGETITLE_CATEGORY_CHANGER_CONFIRM_DIALOG_OK_BTN'),
				onOk: messageBox => {
					messageBox.close();
					onOk();
				},
				onCancel: messageBox => messageBox.close()
			});
		}
		#startProgress() {
			if (this.#isProgress) {
				return;
			}
			this.#isProgress = true;
			this.emit('onProgressStart');
		}
		#stopProgress() {
			if (!this.#isProgress) {
				return;
			}
			this.#isProgress = false;
			this.emit('onProgressStop');
		}
		#isEditorChanged() {
			const editor = this.#getEditor();
			return Boolean(editor?.hasChangedControls() || editor?.hasChangedControllers());
		}
		#getEditor() {
			if (this.#editorGuid) {
				return BX.Crm?.EntityEditor?.get(this.#editorGuid);
			}
			return BX.Crm?.EntityEditor?.getDefault();
		}
		#isNew() {
			return this.#id <= 0;
		}
		#getCurrentCategory() {
			return this.#categories.find(category => category.getId() === this.#categoryId);
		}
	}

	exports.CategoryChanger = CategoryChanger;

})(this.BX.Crm.ItemDetailsComponent.PageTitle = this.BX.Crm.ItemDetailsComponent.PageTitle || {}, BX.Crm.Models, BX, BX.Event, BX.Main, BX.UI.Notification, BX.UI.Dialogs);
//# sourceMappingURL=pagetitle.bundle.js.map
