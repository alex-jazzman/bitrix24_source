/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, crm_categoryModel) {
	'use strict';

	let instance = null;

	/**
	 * @memberOf BX.Crm
	 */
	class CategoryList {
		#items = {};
		#isProgress = false;
		static get Instance() {
			if (window.top !== window && main_core.Reflection.getClass('top.BX.Crm.CategoryList')) {
				return window.top.BX.Crm.CategoryList.Instance;
			}
			if (instance === null) {
				instance = new CategoryList();
			}
			return instance;
		}
		getItems(entityTypeId) {
			return new Promise((resolve, reject) => {
				if (this.#items.hasOwnProperty(entityTypeId)) {
					resolve(this.#items[entityTypeId]);
					return;
				}
				this.#loadItems(entityTypeId).then(categories => {
					this.#items[entityTypeId] = categories;
					resolve(categories);
				}).catch(error => {
					this.#items[entityTypeId] = [];
					reject(error);
				});
			});
		}
		setItems(entityTypeId, items) {
			this.#items[entityTypeId] = items;
			return this;
		}
		#loadItems(entityTypeId) {
			return new Promise((resolve, reject) => {
				if (this.#isProgress) {
					reject('CategoryList is already loading');
					return;
				}
				this.#isProgress = true;
				main_core.ajax.runAction('crm.category.list', {
					data: {
						entityTypeId
					}
				}).then(response => {
					this.#isProgress = false;
					const categories = [];
					response.data.categories.forEach(category => {
						categories.push(new crm_categoryModel.CategoryModel(category));
					});
					resolve(categories);
				}).catch(response => {
					this.#isProgress = false;
					reject("CategoryList error: " + response.errors.map(({
						message
					}) => message).join("; "));
				});
			});
		}
	}

	exports.CategoryList = CategoryList;

})(this.BX.Crm = this.BX.Crm || {}, BX, BX.Crm.Models);
//# sourceMappingURL=category-list.bundle.js.map
