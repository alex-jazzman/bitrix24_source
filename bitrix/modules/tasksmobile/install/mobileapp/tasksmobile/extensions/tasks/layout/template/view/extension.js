/**
 * @module tasks/layout/template/view
 */
jn.define('tasks/layout/template/view', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Color } = require('tokens');
	const { LoadingScreenComponent } = require('layout/ui/loading-screen');
	const { StatusBlock } = require('ui-system/blocks/status-block');
	const { makeLibraryImagePath } = require('asset-manager');
	const { RunActionExecutor } = require('rest/run-action-executor');
	const { batchActions } = require('statemanager/redux/batched-actions');
	const store = require('statemanager/redux/store');
	const { clone } = require('utils/object');
	const { createTestIdGenerator } = require('utils/test');
	const { usersUpserted } = require('statemanager/redux/slices/users');
	const { groupsUpserted } = require('tasks/statemanager/redux/slices/groups');
	const { ChecklistController } = require('tasks/checklist/controller');
	const {
		selectById,
		upsertTemplates,
	} = require('tasks/statemanager/redux/slices/templates');

	const { TemplateForm, mapTemplateFormProps } = require('tasks/layout/template/view/template-form');
	const { LayoutButtons } = require('tasks/layout/template/view/layout-buttons');
	const { StickyTitle } = require('tasks/layout/template/view/sticky-title');
	const { CreateTaskButton } = require('tasks/layout/template/view/create-task-button');

	class TemplateView extends LayoutComponent
	{
		static open(props)
		{
			const { layoutWidget: parentWidget = PageManager } = props;
			const templateViewComponent = new TemplateView(props);

			parentWidget
				.openWidget('layout', {
					titleParams: {
						text: Loc.getMessage('TASKSMOBILE_TEMPLATE_VIEW_DEFAULT_TITLE'),
						type: 'entity',
					},
				})
				.then((newLayout) => {
					templateViewComponent.init({
						...props,
						layout: newLayout,
					});

					newLayout.showComponent(templateViewComponent);
				})
				.catch(console.error)
			;
		}

		constructor(props)
		{
			super(props);

			this.layout = null;
			this.scrollViewRef = null;
			this.getTestId = createTestIdGenerator({
				prefix: 'template-view',
			});

			if (props.layout)
			{
				this.init(props);
			}
		}

		init(props)
		{
			this.layout = props.layout;
			this.layout.enableNavigationBarBorder(false);
			this.layout.on('titleClick', () => this.scrollViewRef?.scrollToBegin?.(true));

			this.checklistController = new ChecklistController({
				userId: env.userId,
				groupId: this.template?.groupId || 0,
				inLayout: true,
				hideCompleted: false,
				hideMoreMenu: true,
				parentWidget: this.layout,
			});

			this.stickyTitle = new StickyTitle({
				templateId: this.templateId,
				layout: this.layout,
				defaultTitle: Loc.getMessage('TASKSMOBILE_TEMPLATE_VIEW_DEFAULT_TITLE'),
			});

			this.state = {
				loading: !this.isDetailLoaded,
				isForbidden: false,
				isLoadError: false,
			};

			if (this.isDetailLoaded)
			{
				this.updateChecklistController(this.template);
				this.ensureLayoutButtons();
			}

			if (this.templateId > 0)
			{
				void this.loadTemplate();
			}
			else
			{
				this.setForbiddenState();
			}
		}

		componentWillUnmount()
		{
			this.checklistController?.clearChecklists?.();
			this.checklistController = null;
			this.destroyLayoutButtons();
			this.stickyTitle?.unsubscribe?.();
		}

		get templateId()
		{
			return Number(this.props.templateId);
		}

		get template()
		{
			return selectById(store.getState(), this.templateId);
		}

		get isDetailLoaded()
		{
			return Boolean(this.template?.detailLoaded);
		}

		bindScrollViewRef = (ref) => {
			this.scrollViewRef = ref;
		};

		ensureLayoutButtons()
		{
			if (!this.layoutButtons)
			{
				this.layoutButtons = new LayoutButtons({
					templateId: this.templateId,
					layout: this.layout,
				});
			}
		}

		destroyLayoutButtons()
		{
			this.layoutButtons?.unsubscribe?.();
			this.layoutButtons = null;
			this.layout?.setRightButtons?.([]);
		}

		updateChecklistController(template)
		{
			if (!this.checklistController)
			{
				return;
			}

			this.checklistController.clearChecklists();
			this.checklistController.setTaskId(template?.id || this.templateId);
			this.checklistController.setGroupId(template?.groupId || 0);

			if (template?.checklistTree)
			{
				this.checklistController.setChecklistTree(clone(template.checklistTree));
			}
		}

		async loadTemplate()
		{
			const shouldShowLoading = !this.isDetailLoaded;

			if (shouldShowLoading)
			{
				this.layout.setTitle({ useProgress: true }, true);
				this.setState({
					loading: true,
					isForbidden: false,
					isLoadError: false,
				});
			}
			else if (this.state.isForbidden || this.state.isLoadError)
			{
				this.setState({
					loading: false,
					isForbidden: false,
					isLoadError: false,
				});
			}

			try
			{
				const response = await new RunActionExecutor('tasksmobile.Template.getTemplate', {
					templateId: this.templateId,
				}).call(false);

				const { template, users = [], groups = [] } = response?.data || {};
				if (!template)
				{
					this.setForbiddenState();

					return;
				}

				const actions = [
					upsertTemplates({
						templates: [template],
						isDetail: true,
					}),
					users.length > 0 && usersUpserted(users),
					groups.length > 0 && groupsUpserted(groups),
				].filter(Boolean);

				if (actions.length > 0)
				{
					store.dispatch(batchActions(actions));
				}

				this.updateChecklistController(selectById(store.getState(), this.templateId) ?? template);
				this.ensureLayoutButtons();

				if (shouldShowLoading)
				{
					this.layout.setTitle({ useProgress: false }, true);
				}

				this.setState({
					loading: false,
					isForbidden: false,
					isLoadError: false,
				});
			}
			catch (error)
			{
				console.error(error);
				if (shouldShowLoading)
				{
					this.layout.setTitle({ useProgress: false }, true);
				}

				if (this.isDetailLoaded)
				{
					this.setState({
						loading: false,
						isForbidden: false,
						isLoadError: false,
					});
				}
				else
				{
					this.setLoadErrorState();
				}
			}
		}

		setForbiddenState()
		{
			this.layout.setTitle({ useProgress: false }, true);
			this.destroyLayoutButtons();
			this.setState({
				loading: false,
				isForbidden: true,
				isLoadError: false,
			});
		}

		setLoadErrorState()
		{
			this.layout.setTitle({ useProgress: false }, true);
			this.destroyLayoutButtons();
			this.setState({
				loading: false,
				isForbidden: false,
				isLoadError: true,
			});
		}

		render()
		{
			const template = this.template;
			const { loading, isForbidden, isLoadError } = this.state;
			const shouldWaitForDetailOnAndroid = (
				Application.getPlatform() === 'android'
				&& loading
				&& !this.isDetailLoaded
			);
			const ready = (
				Boolean(template)
				&& !isForbidden
				&& !isLoadError
				&& !shouldWaitForDetailOnAndroid
			);

			return View(
				{},
				loading && !ready && this.renderLoadingState(),
				isForbidden && this.renderForbiddenState(),
				isLoadError && this.renderLoadErrorState(),
				ready && this.renderTemplateContent(),
				ready && this.renderCreateTaskButton(template),
			);
		}

		renderLoadingState()
		{
			return new LoadingScreenComponent({
				backgroundColor: Color.bgNavigation.toHex(),
				testId: this.getTestId('loading-screen'),
			});
		}

		renderForbiddenState()
		{
			return this.renderStatusState({
				testId: this.getTestId('forbidden'),
				title: Loc.getMessage('TASKSMOBILE_TEMPLATE_VIEW_FORBIDDEN_TITLE'),
				description: Loc.getMessage('TASKSMOBILE_TEMPLATE_VIEW_FORBIDDEN_DESCRIPTION'),
			});
		}

		renderLoadErrorState()
		{
			return this.renderStatusState({
				testId: this.getTestId('load-error'),
				title: Loc.getMessage('TASKSMOBILE_TEMPLATE_VIEW_LOAD_ERROR_TITLE'),
				description: Loc.getMessage('TASKSMOBILE_TEMPLATE_VIEW_LOAD_ERROR_DESCRIPTION'),
				onRefresh: () => {
					void this.loadTemplate();
				},
			});
		}

		renderStatusState({ testId, title, description, onRefresh })
		{
			return StatusBlock({
				testId,
				image: Image({
					resizeMode: 'contain',
					style: {
						width: 152,
						height: 140,
					},
					svg: {
						uri: makeLibraryImagePath('access.svg', 'empty-states'),
					},
				}),
				title,
				description,
				onRefresh,
			});
		}

		renderTemplateContent()
		{
			const formProps = mapTemplateFormProps(store.getState(), {
				id: this.templateId,
				parentWidget: this.layout,
				checklistController: this.checklistController,
				testId: this.getTestId('form'),
			});

			return ScrollView(
				{
					ref: this.bindScrollViewRef,
					showsVerticalScrollIndicator: false,
					scrollEventThrottle: 10,
					onScroll: (pos) => this.stickyTitle.onScroll(pos),
					style: {
						flex: 1,
						width: '100%',
						backgroundColorGradient: {
							start: Color.bgNavigation.toHex(),
							middle: Color.bgContentSecondary.toHex(),
							end: Color.bgContentSecondary.toHex(),
							angle: 90,
						},
					},
				},
				View(
					{
						testId: this.getTestId('main-content'),
						style: {
							paddingBottom: 96,
							backgroundColor: Color.bgContentSecondary.toHex(),
						},
						onClick: () => Keyboard.dismiss(),
					},
					new TemplateForm(formProps).render(),
				),
			);
		}

		renderCreateTaskButton(template)
		{
			return new CreateTaskButton({
				testId: this.getTestId('create-task-button'),
				templateId: template.id,
				templateTitle: template.name,
			});
		}
	}

	module.exports = { TemplateView };
});
