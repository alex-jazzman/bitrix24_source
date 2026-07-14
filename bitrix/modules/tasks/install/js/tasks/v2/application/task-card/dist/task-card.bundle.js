/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports, main_core, main_popup, ui_system_skeleton, tasks_v2_lib_idUtils) {
	'use strict';

	const settings = main_core.Extension.getSettings('tasks.v2.application.task-card');
	const load = top.BX.Runtime.loadExtension;
	class TaskCard {
		static showCompactCard(params = {}) {
			if (window !== top) {
				void load('tasks.v2.application.task-card').then(exports => exports.TaskCard.showCompactCard(params));
				return;
			}
			const hasMandatoryUserFields = tasks_v2_lib_idUtils.idUtils.isTemplate(params.taskId ?? 0) ? settings.hasMandatoryTemplateUserFields : settings.hasMandatoryTaskUserFields;
			if (hasMandatoryUserFields && settings.formV2Enabled) {
				this.showFullCard(params);
				return;
			}
			const id = `tasks-compact-card-${params.taskId}`;
			if (main_popup.PopupManager.getPopupById(id)) {
				return;
			}
			const content = main_core.Tag.render`<div/>`;
			void ui_system_skeleton.renderSkeleton('/bitrix/js/tasks/v2/application/task-card/src/skeleton.html?v=2', content);
			let card = null;
			const popup = new main_popup.Popup({
				id,
				className: 'tasks-compact-card-popup',
				width: 580,
				minHeight: 324,
				borderRadius: '16px',
				noAllPaddings: true,
				content,
				cacheable: false,
				closeByEsc: true,
				events: {
					onAfterClose: () => card?.unmount()
				},
				overlay: {
					opacity: 100,
					backgroundColor: '#0363',
					blur: 'blur(2px)'
				}
			});
			void load('tasks.v2.application.task-compact-card').then(exports => {
				card = new exports.TaskCompactCard(params);
				card.mount(popup);
			});
			popup.show();
		}
		static showFullCard(params = {}) {
			let card = null;
			const options = {
				contentCallback: async slider => {
					const exports = await load('tasks.v2.application.task-full-card');
					card = new exports.TaskFullCard(params);
					return card.mount(slider);
				},
				events: {
					onClose: event => card?.onClose(event),
					onCloseComplete: () => {
						if (card) {
							card.onCloseComplete();
						} else if (params.closeCompleteUrl) {
							location.href = params.closeCompleteUrl;
						}
					}
				}
			};
			BX.SidePanel.Instance.open(params.url ?? this.getUrl(params.taskId), options);
		}
		static embedFullCard(params) {
			let card = null;
			let unmounted = false;
			const loading = load('tasks.v2.application.task-full-card');
			return {
				mount: container => {
					const skeleton = main_core.Tag.render`<div style="width: 100%; height: 100%" />`;
					main_core.Dom.append(skeleton, container);
					void ui_system_skeleton.renderSkeleton('/bitrix/js/tasks/v2/application/task-card/src/skeleton-full-embedded.html?v=1', skeleton);
					void loading.then(exports => {
						if (unmounted) {
							return;
						}
						main_core.Dom.remove(skeleton, container);
						card = new exports.TaskFullCard(params);
						void card.mountEmbedded(container);
					});
				},
				unmount: () => {
					unmounted = true;
					card?.unmountEmbedded();
				},
				taskId: params?.taskId,
				taskUrl: TaskCard.getUrl(params.taskId)
			};
		}
		static getUrl(entityId, groupId) {
			const template = String(entityId).split('template')[1];
			const id = Number(template) || template || entityId;
			const isReal = Number.isInteger(id);
			const path = (entityId?.startsWith?.('template') ? settings.templatePath : groupId ? settings.groupTaskPath : settings.userTaskPath).replace('#user_id#', settings.userId).replace('#group_id#', groupId).replace('#task_id#', isReal ? id : 0).replace('#template_id#', isReal ? id : 0).replace('#action#', isReal ? 'view' : 'edit');
			if (isReal) {
				return path;
			}
			return new main_core.Uri(path).setQueryParam('id', id).toString();
		}
	}

	exports.TaskCard = TaskCard;

})(this.BX.Tasks.V2.Application = this.BX.Tasks.V2.Application || {}, BX, BX.Main, BX.UI.System, BX.Tasks.V2.Lib);
//# sourceMappingURL=task-card.bundle.js.map
