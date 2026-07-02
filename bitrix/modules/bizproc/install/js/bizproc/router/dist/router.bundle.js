/* eslint-disable */
this.BX = this.BX || {};
(function (exports, sidepanel, main_core) {
	'use strict';

	class Router {
		static #startSliderWidth = 970;
		static init() {
			if (top !== window) {
				top.BX.Runtime.loadExtension('bizproc.router').then(({
					Router: BizprocRouter
				}) => {
					BizprocRouter.init();
				}).catch(e => console.error(e));
				return;
			}
			this.#bind();
		}
		static #bind() {
			top.BX.SidePanel.Instance.bindAnchors({
				rules: [{
					condition: ['/rpa/task/'],
					options: {
						width: 580,
						cacheable: false,
						allowChangeHistory: false
					}
				}, {
					condition: ['/company/personal/bizproc/([a-zA-Z0-9\\.]+)/'],
					options: {
						cacheable: false,
						loader: 'bizproc:workflow-info',
						width: this.#detectSliderWidth()
					}
				}, {
					condition: ['/bitrix/components/bitrix/bizproc.storage.item.list/'],
					options: {
						width: this.#detectSliderWidth(),
						cacheable: false,
						allowChangeHistory: false
					}
				}, {
					condition: ['/bitrix/components/bitrix/bizproc.storage.list/'],
					options: {
						width: this.#detectSliderWidth(),
						cacheable: false,
						allowChangeHistory: false
					}
				}]
			});
		}
		static #detectSliderWidth() {
			if (window.innerWidth < 1500) {
				return null; // default slider width
			}
			return 1500 + Math.floor((window.innerWidth - 1500) / 3);
		}
		static #openSlider(url, options) {
			top.BX.Runtime.loadExtension('sidepanel').then(() => {
				BX.SidePanel.Instance.open(url, options);
			}).catch(response => console.error(response.errors));
		}
		static openWorkflowLog(workflowId) {
			const url = `/bitrix/components/bitrix/bizproc.log/slider.php?WORKFLOW_ID=${workflowId}`;
			const options = {
				width: this.#detectSliderWidth(),
				cacheable: false
			};
			this.#openSlider(url, options);
		}
		static openWorkflow(workflowId) {
			const url = `/company/personal/bizproc/${workflowId}/`;
			const options = {
				width: this.#detectSliderWidth(),
				cacheable: false,
				loader: 'bizproc:workflow-info'
			};
			this.#openSlider(url, options);
		}
		static openWorkflowTask(taskId, userId) {
			let url = `/company/personal/bizproc/${taskId}/`;
			if (userId > 0) {
				url += `?USER_ID=${userId}`;
			}
			const options = {
				width: this.#detectSliderWidth(),
				cacheable: false,
				loader: 'bizproc:workflow-info'
			};
			this.#openSlider(url, options);
		}
		static openUserProcessesStart(options) {
			const sliderOptions = {
				width: this.#startSliderWidth,
				cacheable: false,
				loader: 'bizproc:start-process-page',
				...options
			};
			let url = '/bizproc/start/';
			if (options && options.requestMethod === 'get' && options.requestParams) {
				url = BX.Uri.addParam(url, options.requestParams);
			}
			this.#openSlider(url, sliderOptions);
		}
		static openWorkflowStartList(options) {
			const sliderOptions = {
				width: this.#startSliderWidth,
				cacheable: false,
				loader: 'bizproc:start-process-page',
				...options
			};
			let url = '/bitrix/components/bitrix/bizproc.workflow.start.list/';
			if (options && options.requestMethod === 'get' && options.requestParams) {
				url = BX.Uri.addParam(url, options.requestParams);
			}
			this.#openSlider(url, sliderOptions);
		}
		static openWorkflowAutoStartParameters(options) {
			const sliderOptions = {
				width: 900,
				cacheable: false,
				allowChangeHistory: false,
				...options
			};
			let url = '/bitrix/components/bitrix/bizproc.workflow.start/';
			if (options && options.requestMethod === 'get' && options.requestParams) {
				url = BX.Uri.addParam(url, options.requestParams);
			}
			this.#openSlider(url, sliderOptions);
		}
		static openWorkflowChangeConstants(params) {
			const url = Router.#createEditConstantSlider(params);
			const sliderOptions = {
				width: 900,
				cacheable: false,
				allowChangeHistory: false
			};
			this.#openSlider(url, sliderOptions);
		}
		static #createEditConstantSlider(params) {
			let url = main_core.Uri.addParam('/bitrix/components/bitrix/bizproc.workflow.start/', {
				sessid: main_core.Loc.getMessage('bitrix_sessid'),
				action: 'CHANGE_CONSTANTS'
			});
			const templateId = main_core.Text.toInteger(params.templateId);
			if (templateId > 0) {
				url = main_core.Uri.addParam(url, {
					templateId
				});
			}
			if (params.signedDocumentType) {
				url = main_core.Uri.addParam(url, {
					signedDocumentType: params.signedDocumentType
				});
			}
			return url;
		}
		static openStorageEdit(options) {
			const sliderOptions = {
				width: this.#startSliderWidth,
				cacheable: false,
				...options
			};
			let url = '/bitrix/components/bitrix/bizproc.storage.edit/';
			if (options && options.requestMethod === 'get' && options.requestParams) {
				url = BX.Uri.addParam(url, options.requestParams);
			}
			this.#openSlider(url, sliderOptions);
		}
		static openStorageFieldList(options) {
			const sliderOptions = {
				width: this.#detectSliderWidth(),
				cacheable: false,
				...options
			};
			let url = '/bitrix/components/bitrix/bizproc.storage.field.list/';
			if (options && options.requestMethod === 'get' && options.requestParams) {
				url = BX.Uri.addParam(url, options.requestParams);
			}
			this.#openSlider(url, sliderOptions);
		}
		static openStorageFieldEdit(options) {
			const sliderOptions = {
				width: this.#startSliderWidth,
				cacheable: false,
				...options
			};
			let url = '/bitrix/components/bitrix/bizproc.storage.field.edit/';
			if (options && options.requestMethod === 'get' && options.requestParams) {
				url = BX.Uri.addParam(url, options.requestParams);
			}
			this.#openSlider(url, sliderOptions);
		}
		static openStorageList(options) {
			const sliderOptions = {
				width: this.#detectSliderWidth(),
				cacheable: false,
				...options
			};
			const url = '/bitrix/components/bitrix/bizproc.storage.list/';
			this.#openSlider(url, sliderOptions);
		}
		static openStorageItemList(options) {
			const sliderOptions = {
				width: this.#startSliderWidth,
				cacheable: false,
				...options
			};
			let url = '/bitrix/components/bitrix/bizproc.storage.item.list/';
			if (options && options.requestMethod === 'get' && options.requestParams) {
				url = BX.Uri.addParam(url, options.requestParams);
			}
			this.#openSlider(url, sliderOptions);
		}
	}

	exports.Router = Router;

})(this.BX.Bizproc = this.BX.Bizproc || {}, BX, BX);
//# sourceMappingURL=router.bundle.js.map
