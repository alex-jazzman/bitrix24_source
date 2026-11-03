/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
this.BX.Crm.MessageSender = this.BX.Crm.MessageSender || {};
this.BX.Crm.MessageSender.CustomTemplate = this.BX.Crm.MessageSender.CustomTemplate || {};
(function (exports, main_core, main_core_events) {
	'use strict';

	/**
	 * Bridges PHP-driven CRM list events to the JS form layer.
	 *
	 * The list grid (PHP component crm.messagesender.custom_template.list)
	 * emits intent events from toolbar buttons and row actions; init() wires
	 * the once-per-page subscriptions for the CRM-specific create/edit flows,
	 * which open the CRM template form. The editor pulls in the full message
	 * editor stack (Vue, Lexical, entity-selector, ...), so it is loaded lazily
	 * only when a create/edit flow is actually triggered — opening the grid must
	 * not pay that cost. Deletion is owned by the generic
	 * messageservice.custom-template.list component script, so it is not wired
	 * here. The component template invokes init() from an inline script so
	 * subscriptions are deferred until the extension has finished loading.
	 *
	 * Subscribed events (all under namespace
	 * `BX.MessageService.CustomTemplate.List`):
	 *   - `onCreateRequested({ gridId, zoneId, sceneId, targetId })`
	 *   - `onEditRequested({ gridId, sceneId, targetId, templateId, title, body })`
	 */

	const reloadGrid = gridId => {
		BX.Main.gridManager.getInstanceById(gridId)?.reload();
	};
	const showOpenError = error => {
		const message = error?.errors?.[0]?.message;
		// Lazy-load so opening the grid does not eagerly pull ui.notification — it is only
		// needed in this rare error path after a failed lazy load / form open.
		// eslint-disable-next-line promise/no-promise-in-callback
		void main_core.Runtime.loadExtension('ui.notification').then(({
			Center
		}) => {
			Center.notify({
				useAirDesign: true,
				content: main_core.Type.isStringFilled(message) ? message : main_core.Loc.getMessage('CRM_MS_CT_LIST_ERROR_GENERIC')
			});
		}).catch(() => {});
	};
	let isInitialised = false;
	function init() {
		// Bitrix re-uses the extension on partial page reloads (PJAX, slider
		// re-entry) — guard against duplicate subscriptions stacking up.
		if (isInitialised) {
			return;
		}
		isInitialised = true;
		main_core_events.EventEmitter.subscribe('BX.MessageService.CustomTemplate.List:onCreateRequested', event => {
			const {
				gridId,
				sceneId,
				targetId
			} = event.getData();
			void main_core.Runtime.loadExtension('crm.messagesender.custom-template.editor').then(({
				openCustomTemplateForm
			}) => openCustomTemplateForm({
				mode: 'create',
				scene: sceneId,
				targetId
			})).then(dto => {
				if (dto) {
					reloadGrid(gridId);
				}
			}).catch(showOpenError);
		});
		main_core_events.EventEmitter.subscribe('BX.MessageService.CustomTemplate.List:onEditRequested', event => {
			const {
				gridId,
				templateId,
				sceneId,
				targetId,
				title,
				body
			} = event.getData();
			void main_core.Runtime.loadExtension('crm.messagesender.custom-template.editor').then(({
				openCustomTemplateForm
			}) => openCustomTemplateForm({
				mode: 'edit',
				templateId,
				scene: sceneId,
				targetId,
				titleInitial: title,
				bodyInitial: body
			})).then(dto => {
				if (dto) {
					reloadGrid(gridId);
				}
			}).catch(showOpenError);
		});
	}

	exports.init = init;

})(this.BX.Crm.MessageSender.CustomTemplate.List = this.BX.Crm.MessageSender.CustomTemplate.List || {}, BX, BX.Event);
//# sourceMappingURL=list.bundle.js.map
