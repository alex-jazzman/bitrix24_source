/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
(function (exports, main_core, main_core_events, main_loader, main_popup, tasks_flow_teamPopup, tasks_sidePanelIntegration, ui_label, ui_buttons, ui_infoHelper) {
	'use strict';

	class SegmentButton {
		#params;
		#segments;
		constructor(params) {
			this.#params = params;
			this.#segments = params.segments;
		}
		render() {
			return main_core.Tag.render`
			<div class="tasks-flow__segment-button">
				${this.#segments.map(segment => this.#renderSegment(segment))}
			</div>
		`;
		}
		#renderSegment(segment) {
			segment.node = main_core.Tag.render`
			<div class="tasks-flow__segment-button-segment ${segment.isActive ? '--active' : ''}">
				${segment.title}
			</div>
		`;
			main_core.Event.bind(segment.node, 'click', () => this.#selectSegment(segment));
			return segment.node;
		}
		#selectSegment(selectedSegment) {
			this.#segments.forEach(segment => {
				main_core.Dom.removeClass(segment.node, '--active');
				if (segment.id === selectedSegment.id) {
					main_core.Dom.addClass(segment.node, '--active');
				}
			});
			this.#params.onSegmentSelected(selectedSegment);
		}
	}

	class ViewAjax {
		#flowId;
		#pageSize = 7;
		#pageNum = 1;
		#pages = {};
		constructor(flowId) {
			this.#flowId = flowId;
		}
		async getViewFormData() {
			const {
				data
			} = await main_core.ajax.runAction('tasks.flow.View.Flow.get', {
				data: {
					flowId: this.#flowId
				}
			});
			return {
				flow: data.flow,
				team: data.team.map(member => this.#convertUserToEntity(member)),
				teamCount: data.teamCount,
				owner: this.#convertUserToEntity(data.owner),
				creator: this.#convertUserToEntity(data.creator),
				project: data.project,
				link: data.link,
				isFeatureEnabled: data.isFeatureEnabled
			};
		}
		#convertUserToEntity(user) {
			return {
				name: user.name,
				avatar: user.avatar,
				url: user.pathToProfile
			};
		}
		async getSimilarFlows() {
			if (this.#pages[this.#pageNum]) {
				return {
					page: [],
					similarFlows: Object.values(this.#pages).flat()
				};
			}
			const {
				data: page
			} = await main_core.ajax.runAction('tasks.flow.View.SimilarFlow.list', {
				data: {
					flowId: this.#flowId
				},
				navigation: {
					page: this.#pageNum,
					size: this.#pageSize
				}
			});
			this.#pages[this.#pageNum] = page;
			if (page.length >= this.#pageSize) {
				this.#pageNum++;
			}
			return {
				page,
				similarFlows: Object.values(this.#pages).flat()
			};
		}
	}

	class SimilarFlows {
		#flowId;
		#viewAjax;
		#createTaskButtonClickHandler;
		#similarFlows = [];
		#layout;
		constructor(params) {
			this.#flowId = params.flowId;
			this.#layout = {};
			this.isFeatureEnabled = params.isFeatureEnabled;
			this.#viewAjax = new ViewAjax(params.flowId);
			this.#createTaskButtonClickHandler = params.createTaskButtonClickHandler ?? null;
		}
		async #load() {
			this.#layout.emptyState?.remove();
			const loader = new main_loader.Loader({
				target: this.#layout.wrap,
				size: 60
			});
			void loader.show();
			const {
				page,
				similarFlows
			} = await this.#viewAjax.getSimilarFlows();
			const isFirstPageLoaded = !main_core.Type.isArrayFilled(this.#similarFlows) && main_core.Type.isArrayFilled(similarFlows);
			if (isFirstPageLoaded) {
				main_core.Dom.append(this.#renderSimilarFlowsListTitle(), this.#layout.wrap);
			}
			this.#similarFlows = similarFlows;
			page.forEach(data => main_core.Dom.append(this.#renderSimilarFlow(data), this.#layout.wrap));
			if (!main_core.Type.isArrayFilled(this.#similarFlows)) {
				main_core.Dom.append(this.#renderEmptyState(), this.#layout.wrap);
			}
			loader.destroy();
		}
		show() {
			main_core.Dom.style(this.#layout.wrap, 'display', '');
			if (!main_core.Type.isArrayFilled(this.#similarFlows)) {
				main_core.Dom.style(this.#layout.wrap, 'overflow', 'hidden');
				this.#load().then(() => main_core.Dom.style(this.#layout.wrap, 'overflow', ''));
			}
		}
		hide() {
			main_core.Dom.style(this.#layout.wrap, 'display', 'none');
		}
		render() {
			this.#layout.wrap = main_core.Tag.render`
			<div class="tasks-flow__view-form_similar-flows">
				${this.#similarFlows.map(flow => this.#renderSimilarFlow(flow))}
			</div>
		`;
			main_core.Event.bind(this.#layout.wrap, 'scroll', () => {
				const scrollTop = this.#layout.wrap.scrollTop;
				const maxScroll = this.#layout.wrap.scrollHeight - this.#layout.wrap.offsetHeight;
				if (Math.abs(scrollTop - maxScroll) < 1) {
					void this.#load();
				}
			});
			return this.#layout.wrap;
		}
		#renderSimilarFlowsListTitle() {
			return main_core.Tag.render`
			<div class="tasks-flow__view-form_similar-flows-title">
				${main_core.Loc.getMessage('TASKS_FLOW_VIEW_FORM_SIMILAR_FLOWS_TITLE')}
			</div>
		`;
		}
		#renderSimilarFlow(flow) {
			const button = new ui_buttons.Button({
				color: ui_buttons.Button.Color.SECONDARY_LIGHT,
				size: ui_buttons.Button.Size.EXTRA_SMALL,
				round: true,
				text: main_core.Loc.getMessage('TASKS_FLOW_VIEW_FORM_CREATE_TASK'),
				noCaps: true,
				onclick: () => {
					this.#createTaskButtonClickHandler?.();
					if (this.isFeatureEnabled) {
						BX.SidePanel.Instance.open(flow.createTaskUri);
					} else {
						ui_infoHelper.FeaturePromotersRegistry.getPromoter({
							code: 'limit_tasks_flows'
						}).show();
					}
				}
			});
			return main_core.Tag.render`
			<div class="tasks-flow__view-form_similar-flow">
				<div class="tasks-flow__view-form_similar-flow-name" title="${main_core.Text.encode(flow.name)}">
					${main_core.Text.encode(flow.name)}
				</div>
				${button.render()}
			</div>
		`;
		}
		#renderEmptyState() {
			this.#layout.emptyState = main_core.Tag.render`
			<div class="tasks-flow__view-form_similar-flows-empty-state">
				<div class="tasks-flow__view-form_similar-flows-empty-state-icon"></div>
				<div class="tasks-flow__view-form_similar-flows-empty-state-text">
					${main_core.Loc.getMessage('TASKS_FLOW_VIEW_FORM_NO_SIMILAR_FLOWS')}
				</div>
			</div>
		`;
			return this.#layout.emptyState;
		}
	}

	class ViewForm {
		static instances = {};
		#params;
		#layout;
		#notificationList = new Set();
		#viewAjax;
		#selectedSegment;
		#viewFormData;
		constructor(params) {
			this.#params = params;
			this.#layout = {};
			this.#viewAjax = new ViewAjax(this.#params.flowId);
			this.overlay = main_core.Type.isBoolean(params.overlay) ? params.overlay : true;
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
				ViewForm.removeInstance(flowId);
			});
		}
		async #load() {
			this.#viewFormData = await this.#viewAjax.getViewFormData();
			this.getPopup().setContent(this.#render());
		}
		show(bindElement) {
			const popup = this.getPopup();
			popup.setContent(this.#render());
			popup.setBindElement(bindElement);
			popup.show();
		}
		isShown() {
			return this.getPopup()?.isShown() ?? false;
		}
		getPopup() {
			const id = `tasks-flow-view-popup-${this.#params.flowId}`;
			if (main_popup.PopupManager.getPopupById(id)) {
				return main_popup.PopupManager.getPopupById(id);
			}
			if (!this.#layout.popup) {
				let className = 'tasks-flow__view-popup';
				if (main_core.Type.isStringFilled(this.#params.popupClassname)) {
					className += ` ${this.#params.popupClassname}`;
				}
				const popup = new main_popup.Popup({
					id,
					className,
					animation: 'fading-slide',
					minWidth: 347,
					maxWidth: 347,
					padding: 0,
					borderRadius: 12,
					autoHide: true,
					overlay: this.overlay,
					closeByEsc: true,
					autoHideHandler: ({
						target
					}) => {
						const isSelf = popup.getPopupContainer().contains(target);
						const isTeam = this.#layout.teamPopup?.getPopup().getPopupContainer().contains(target);
						return !isSelf && !isTeam;
					}
				});
				new tasks_sidePanelIntegration.SidePanelIntegration(popup);
				this.#layout.popup = popup;
			}
			return this.#layout.popup;
		}
		#render() {
			if (!this.#viewFormData) {
				return this.#renderLoader();
			}
			return main_core.Tag.render`
			<div class="tasks-flow__view-form">
				${this.#renderHeader()}
				${this.#renderContent()}
			</div>
		`;
		}
		#renderLoader() {
			const loaderContainer = main_core.Tag.render`
			<div class="tasks-flow__view-form-loader" style="width: 347px; height: 300px;">
			</div>
		`;
			void new main_loader.Loader({
				target: loaderContainer
			}).show();
			return loaderContainer;
		}
		#renderHeader() {
			return main_core.Tag.render`
			<div class="tasks-flow__view-form_header">
				<div class="tasks-flow__view-form_header-title">
					${this.#renderTitle()}
					<div class="tasks-flow__view-form-header_title-efficiency">
						${this.#renderEfficiencyLabel(this.#viewFormData.flow.efficiency)}
					</div>
				</div>
				<div class="tasks-flow__view-form-header_description">
					${this.#renderDescription(this.#viewFormData.flow.description)}
				</div>
			</div>
		`;
		}
		#renderDescription(description) {
			const descriptionNode = main_core.Tag.render`
			<div 
				class="tasks-flow__view-form_header-description" 
				title="${main_core.Text.encode(description)}"
			></div>
		`;
			descriptionNode.innerText = description;
			return descriptionNode;
		}
		#renderEfficiencyLabel(efficiency) {
			return new ui_label.Label({
				text: `${efficiency}%`,
				color: efficiency < 60 ? ui_label.LabelColor.DANGER : ui_label.LabelColor.SUCCESS,
				size: ui_label.LabelSize.SM,
				fill: true
			}).render();
		}
		#renderTitle() {
			const title = main_core.Tag.render`
			<div class="tasks-flow__view-form-header_title-link">
				<div
					class="tasks-flow__view-form-header_title-text"
					title="${main_core.Text.encode(this.#viewFormData.flow.name)}"
				>
					${main_core.Text.encode(this.#viewFormData.flow.name)}
				</div>
				<div 
					class="tasks-flow__view-form-header_title-link-icon ui-icon-set --link-3"
					style="--ui-icon-set__icon-size: 16px;"
					title="${main_core.Loc.getMessage('TASKS_FLOW_VIEW_FORM_LINK_TITLE')}"
				></div>
			</div>
		`;
			main_core.Event.bind(title, 'click', () => {
				const notificationId = 'copy-link';
				if (!this.#notificationList.has(notificationId)) {
					const flowURL = window.location.protocol + this.#viewFormData.link;
					BX.clipboard.copy(flowURL);
					BX.UI.Notification.Center.notify({
						id: notificationId,
						content: main_core.Loc.getMessage('TASKS_FLOW_VIEW_FORM_TITLE_COPY_LINK')
					});
					this.#notificationList.add(notificationId);
					main_core_events.EventEmitter.subscribeOnce('UI.Notification.Balloon:onClose', baseEvent => {
						const closingBalloon = baseEvent.getTarget();
						if (closingBalloon.getId() === notificationId) {
							this.#notificationList.delete(notificationId);
						}
					});
				}
			});
			return title;
		}
		#renderContent() {
			const content = main_core.Tag.render`
			<div class="tasks-flow__view-form-content">
				${this.#renderSegmentButton()}
				${this.#renderDetails()}
				${this.#renderSimilarFlows()}
			</div>
		`;
			this.#updateSegmentsVisibility();
			return content;
		}
		#renderSegmentButton() {
			this.#selectedSegment = 'details';
			return new SegmentButton({
				segments: [{
					id: 'details',
					title: main_core.Loc.getMessage('TASKS_FLOW_VIEW_FORM_DETAILS'),
					isActive: true
				}, {
					id: 'similarFlows',
					title: main_core.Loc.getMessage('TASKS_FLOW_VIEW_FORM_SIMILAR_FLOWS')
				}],
				onSegmentSelected: segment => {
					if (this.#selectedSegment !== segment.id) {
						this.#selectedSegment = segment.id;
						this.#updateSegmentsVisibility();
					}
				}
			}).render();
		}
		#updateSegmentsVisibility() {
			main_core.Dom.style(this.#layout.details, 'display', 'none');
			this.#layout.similarFlows.hide();
			if (this.#selectedSegment === 'details') {
				main_core.Dom.style(this.#layout.details, 'display', '');
			}
			if (this.#selectedSegment === 'similarFlows') {
				this.#layout.similarFlows.show();
			}
		}
		#renderDetails() {
			this.#layout.details = main_core.Tag.render`
			<div class="tasks-flow__view-form-details">
				${this.#renderField(main_core.Loc.getMessage('TASKS_FLOW_VIEW_FORM_CREATOR'), this.#renderEntity(this.#viewFormData.creator))}
				${this.#renderField(main_core.Loc.getMessage('TASKS_FLOW_VIEW_FORM_ADMINISTRATOR'), this.#renderEntity(this.#viewFormData.owner))}
				${this.#renderField(main_core.Loc.getMessage('TASKS_FLOW_VIEW_FORM_TEAM'), this.#renderTeam())}
				${this.#renderProjectField()}
			</div>
		`;
			return this.#layout.details;
		}
		#renderProjectField() {
			if (!this.#viewFormData.project) {
				const content = this.#viewFormData.flow.demo === true ? main_core.Loc.getMessage('TASKS_FLOW_VIEW_FORM_PROJECT_DEMO') : main_core.Loc.getMessage('TASKS_FLOW_VIEW_FORM_PROJECT_HIDDEN');
				return this.#renderField(main_core.Loc.getMessage('TASKS_FLOW_VIEW_FORM_PROJECT'), content);
			}
			return this.#renderField(main_core.Loc.getMessage('TASKS_FLOW_VIEW_FORM_PROJECT'), this.#renderEntity(this.#viewFormData.project));
		}
		#renderField(title, content) {
			return main_core.Tag.render`
			<div class="tasks-flow__view-form_field-name">
				${title}
			</div>
			<div class="tasks-flow__view-form_field-value">
				${content}
			</div>
		`;
		}
		#renderEntity(entity) {
			return main_core.Tag.render`
			<a class="tasks-flow__view-form_entity" href="${encodeURI(entity.uri)}">
				${this.#renderAvatar(entity)}
				<div class="tasks-flow__view-form_entity-name" title="${main_core.Text.encode(entity.name)}">
					${main_core.Text.encode(entity.name)}
				</div>
			</a>
		`;
		}
		#renderTeam() {
			if (this.#viewFormData.flow.demo === true) {
				return main_core.Loc.getMessage('TASKS_FLOW_VIEW_FORM_PROJECT_DEMO');
			}
			if (this.#viewFormData.team.length === 1) {
				return this.#renderEntity(this.#viewFormData.team[0]);
			}
			this.#layout.teamNode = main_core.Tag.render`
			<div class="tasks-flow__view-form_line-avatars">
				${this.#viewFormData.team.map(entity => this.#renderAvatar(entity))}
				${this.#renderShowTeamButton()}
			</div>
		`;
			if (this.#viewFormData.teamCount === this.#viewFormData.team.length) {
				main_core.Event.bind(this.#layout.teamNode, 'click', this.#onShowTeamButtonClickHandler.bind(this));
			}
			return this.#layout.teamNode;
		}
		#renderAvatar(entity) {
			const style = this.#isAvatar(entity.avatar) ? `background-image: url('${encodeURI(entity.avatar)}');` : '';
			return main_core.Tag.render`
			<span class="ui-icon ui-icon-common-user tasks-flow__view-form_avatar" title="${main_core.Text.encode(entity.name)}">
				<i style="${style}"></i>
			</span>
		`;
		}
		#isAvatar(avatar) {
			return main_core.Type.isStringFilled(avatar);
		}
		#renderShowTeamButton() {
			if (this.#viewFormData.teamCount === this.#viewFormData.team.length) {
				this.#layout.showTeamButton?.remove();
				this.#layout.showTeamButton = null;
				return '';
			}
			this.#layout.showTeamButton = main_core.Tag.render`
			<div class="tasks-flow__view-form_show-team-button">
				${this.#getShowTeamButtonText()}
			</div>
		`;
			main_core.Event.bind(this.#layout.showTeamButton, 'click', this.#onShowTeamButtonClickHandler.bind(this));
			return this.#layout.showTeamButton;
		}
		#getShowTeamButtonText() {
			return main_core.Loc.getMessage('TASKS_FLOW_VIEW_FORM_ALL_N', {
				'#NUM#': this.#viewFormData.teamCount
			});
		}
		#onShowTeamButtonClickHandler() {
			const flowId = this.#params.flowId;
			const bindElement = this.#layout.showTeamButton ?? this.#layout.teamNode;
			this.#layout.teamPopup ??= tasks_flow_teamPopup.TeamPopup.getInstance({
				flowId
			});
			this.#layout.teamPopup.show(bindElement);
		}
		#renderSimilarFlows() {
			this.#layout.similarFlows ??= new SimilarFlows({
				flowId: this.#params.flowId,
				isFeatureEnabled: this.#viewFormData.isFeatureEnabled,
				createTaskButtonClickHandler: () => this.#layout.popup?.destroy()
			});
			return this.#layout.similarFlows.render();
		}
	}

	exports.ViewForm = ViewForm;

})(this.BX.Tasks.Flow = this.BX.Tasks.Flow || {}, BX, BX.Event, BX, BX.Main, BX.Tasks.Flow, BX.Tasks, BX.UI, BX.UI, BX.UI);
//# sourceMappingURL=view-form.bundle.js.map
