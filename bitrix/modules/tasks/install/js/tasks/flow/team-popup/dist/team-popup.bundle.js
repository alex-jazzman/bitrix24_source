/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
(function (exports, main_core, main_core_events, main_loader, main_popup, tasks_sidePanelIntegration) {
	'use strict';

	class TeamAjax {
		#flowId;
		#pageSize = 10;
		#pageNum = 1;
		#pages = {};
		constructor(flowId) {
			this.#flowId = flowId;
		}
		async get() {
			if (this.#pages[this.#pageNum]) {
				return {
					page: [],
					members: Object.values(this.#pages).flat()
				};
			}
			const {
				data,
				error
			} = await main_core.ajax.runAction('tasks.flow.Team.list', {
				data: {
					flowData: {
						id: this.#flowId
					}
				},
				navigation: {
					page: this.#pageNum,
					size: this.#pageSize
				}
			}).catch(response => ({
				data: [],
				error: response.errors[0]
			}));
			if (error) {
				this.#consoleError('getList', error);
			}
			const members = data;
			this.#pages[this.#pageNum] = members;
			if (members.length >= this.#pageSize) {
				this.#pageNum++;
			}
			return {
				page: members,
				members: Object.values(this.#pages).flat()
			};
		}
		#consoleError(action, error) {
			// eslint-disable-next-line no-console
			console.error(`TeamPopup: ${action} error`, error);
		}
	}

	class TeamMember {
		#data;
		constructor(data) {
			this.#data = data;
		}
		render() {
			return main_core.Tag.render`
			<div class="tasks-flow__team-popup_member" data-id="tasks-flow-team-popup-member-${this.#data.id}">
				${this.#renderIcon()}
				<div class="tasks-flow__team-popup_member-name-content">
					<a class="tasks-flow__team-popup_member-name" href="${main_core.Text.encode(this.#data.pathToProfile)}">
						${main_core.Text.encode(this.#data.name)}
					</a>
					${this.#renderWorkPosition()}
				</div>
			</div>
		`;
		}
		#renderIcon() {
			let photoIcon = '<i></i>';
			if (main_core.Type.isStringFilled(this.#data.avatar)) {
				photoIcon = `<i style="background-image: url('${encodeURI(this.#data.avatar)}')"></i>`;
			}
			return main_core.Tag.render`
			<a href="${main_core.Text.encode(this.#data.pathToProfile)}">
				<div class="tasks-flow__team-popup_member-avatar ui-icon ui-icon-common-user">
					${photoIcon}
				</div>
			</a>
		`;
		}
		#renderWorkPosition() {
			if (!main_core.Type.isStringFilled(this.#data.workPosition)) {
				return '';
			}
			return main_core.Tag.render`
			<span class="tasks-flow__team-popup_member-position">
				${main_core.Text.encode(this.#data.workPosition)}
			</span>
		`;
		}
	}

	class TeamPopup {
		static instances = {};
		#params;
		#layout;
		#teamAjax;
		#members = [];
		constructor(params) {
			this.#params = params;
			this.#layout = {};
			this.#teamAjax = new TeamAjax(this.#params.flowId);
			void this.#load();
			this.#subscribeEvents();
		}
		static showInstance(params) {
			this.getInstance(params).show(params.bindElement);
		}
		static getInstance(params) {
			this.instances[params.flowId] ??= new this(params);
			return this.instances[params.flowId];
		}
		static removeInstance(flowId) {
			if (Object.hasOwn(this.instances, flowId)) {
				delete this.instances[flowId];
			}
		}
		#subscribeEvents() {
			main_core_events.EventEmitter.subscribe('BX.Tasks.Flow.EditForm:afterSave', event => {
				const flowId = event.data?.id ?? 0;
				TeamPopup.removeInstance(flowId);
			});
		}
		async #load() {
			if (this.#layout.loader) {
				return;
			}
			this.#showLoader();
			let {
				members,
				page
			} = await this.#teamAjax.get();
			if (!main_core.Type.isNil(this.#params.excludeMembers)) {
				const isNeedToExclude = member => this.#params.excludeMembers.includes(Number(member.id));
				page = page.filter(member => !isNeedToExclude(member));
				members = members.filter(member => !isNeedToExclude(member));
			}
			this.#members = members;
			page.forEach(data => main_core.Dom.append(new TeamMember(data).render(), this.#layout.members));
			this.#destroyLoader();
		}
		show(bindElement) {
			const popup = this.getPopup();
			popup.setContent(this.#render());
			popup.setBindElement(bindElement);
			popup.show();
		}
		getPopup() {
			const id = `tasks-flow-team-popup-${this.#params.flowId}`;
			if (main_popup.PopupManager.getPopupById(id)) {
				return main_popup.PopupManager.getPopupById(id);
			}
			const popup = new main_popup.Popup({
				id,
				className: 'tasks-flow__team-popup',
				width: 200,
				padding: 2,
				autoHide: true,
				closeByEsc: true,
				events: {
					onShow: () => {
						if (this.#layout.loader) {
							this.#showLoader();
						}
					}
				}
			});
			new tasks_sidePanelIntegration.SidePanelIntegration(popup);
			return popup;
		}
		#render() {
			this.#layout.wrap = main_core.Tag.render`
			<div class="tasks-flow__team-popup_container">
				<div class="tasks-flow__team-popup_content">
					<div class="tasks-flow__team-popup_content-box">
						<span class="tasks-flow__team-popup_label">
							<span class="tasks-flow__team-popup_label-text">
								${main_core.Loc.getMessage('TASKS_FLOW_TEAM_POPUP_LABEL')}
							</span>
						</span>
						${this.#renderMembers()}
					</div>
				</div>
			</div>
		`;
			return this.#layout.wrap;
		}
		#renderMembers() {
			this.#layout.members = main_core.Tag.render`
			<div class="tasks-flow__team-popup_members">
				${this.#members.map(data => new TeamMember(data).render())}
			</div>
		`;
			main_core.Event.bind(this.#layout.members, 'scroll', () => {
				const scrollTop = this.#layout.members.scrollTop;
				const maxScroll = this.#layout.members.scrollHeight - this.#layout.members.offsetHeight;
				if (Math.abs(scrollTop - maxScroll) < 1) {
					void this.#load();
				}
			});
			return this.#layout.members;
		}
		#showLoader() {
			this.#destroyLoader();
			const targetPosition = main_core.Dom.getPosition(this.#layout.members);
			const size = 40;
			this.#layout.loader = new main_loader.Loader({
				target: this.#layout.members,
				size,
				mode: 'inline',
				offset: {
					left: `${targetPosition.width / 2 - size / 2}px`
				}
			});
			void this.#layout.loader.show();
		}
		#destroyLoader() {
			this.#layout.loader?.destroy();
			this.#layout.loader = null;
		}
	}

	exports.TeamPopup = TeamPopup;

})(this.BX.Tasks.Flow = this.BX.Tasks.Flow || {}, BX, BX.Event, BX, BX.Main, BX.Tasks);
//# sourceMappingURL=team-popup.bundle.js.map
