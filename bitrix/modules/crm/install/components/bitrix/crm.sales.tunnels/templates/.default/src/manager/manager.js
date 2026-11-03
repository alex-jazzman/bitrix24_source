import { Cache, Event, Loc, Type } from 'main.core';
import { PopupWindow, PopupWindowButtonLink } from 'main.popup';
import { UI } from 'ui.notification';
import { sendData } from 'ui.analytics';
import Backend from '../backend';
import { Category } from '../category/category';
import CategoryStub from '../category/category-stub';
import Marker from '../marker/marker';
import type CategorySourceOptions from '../type/category-source-options';
import type Link from '../type/link';
import type Stage, { Tunnel } from '../type/stage';
import type TunnelScheme from '../type/tunnel-scheme';
import type AnalyticsLabels from '../type/analytics-labels';
import createStageStubs from './internal/create-stage-stubs';
import makeErrorMessageFromResponse from './internal/make-error-message';
import StageEditorController from './internal/stage-editor-controller';
import { createLazyStageEditorFactory, toStageEditorData } from './internal/stage-editor-adapter';

export default class Manager
{
	static lastInstance:?Manager = null;
	categories: Map<number, Category>;

	constructor(options: {
		entityTypeId: number,
		documentType: Array<string>,
		container: HTMLDivElement,
		addCategoryButtonTop: HTMLButtonElement,
		helpButton: HTMLButtonElement,
		categories: Array<{[key: string]: number}>,
		tunnelScheme: TunnelScheme,
		robotsUrl: string,
		generatorUrl: string,
		permissionEditUrl: string,
		analyticsLabels: AnalyticsLabels,

		isCategoryEditable: boolean,
		isCategoryCreatable: boolean,
		isCategoryAccessEditable: boolean,
		areStagesEditable: boolean,
		areTunnelsEditable: boolean,
		isAvailableGenerator: boolean,
		isAutomationEnabled: boolean,
		isStagesEnabled: boolean,
		isChanged: boolean,
	})
	{
		this.container = options.container;
		this.entityTypeId = options.entityTypeId;
		this.documentType = options.documentType;
		this.addCategoryButtonTop = options.addCategoryButtonTop;
		this.helpButton = options.helpButton;
		this.categoriesOptions = options.categories;
		this.robotsUrl = options.robotsUrl;
		this.generatorUrl = options.generatorUrl;
		this.permissionEditUrl = options.permissionEditUrl;
		this.analyticsLabels = options.analyticsLabels;
		this.tunnelScheme = options.tunnelScheme;
		this.isCategoryEditable = Boolean(options.isCategoryEditable);
		this.isCategoryCreatable = Boolean(options.isCategoryCreatable);
		this.isCategoryAccessEditable = Boolean(options.isCategoryAccessEditable);
		this.areStagesEditable = Boolean(options.areStagesEditable);
		this.areTunnelsEditable = Boolean(options.areTunnelsEditable);
		this.isAvailableGenerator = options.isAvailableGenerator;
		this.isStagesEnabled = options.isStagesEnabled;
		this.isAutomationEnabled = options.isAutomationEnabled && this.isStagesEnabled;
		this.categories = new Map();
		this.cache = new Cache.MemoryCache();
		this.isChanged = false;
		Backend.entityTypeId = this.entityTypeId;
		this.stageEditorController = new StageEditorController({
			entityTypeId: this.entityTypeId,
			entityTypeName: this.documentType[2],
			backend: Backend,
			editorFactory: createLazyStageEditorFactory(),
			getDeleteBlockReasons: () => [Loc.getMessage('CRM_ST_STAGE_DELETE_BLOCKED')],
			createDraft: (column) => this.createStageEditorDraft(column),
			removeDraft: (column) => this.removeStageEditorDraft(column),
			onPreview: (column, stage) => this.updateColumnFromEditorData(column, stage),
			onRestore: (column, stage) => this.updateColumnFromEditorData(column, stage),
			onCreate: (draftColumn, sourceColumn, stage) => (
				this.handleStageCreated(draftColumn, sourceColumn, stage)
			),
			onUpdate: (column, stage) => this.handleStageUpdated(column, stage),
			onDelete: (column) => this.handleStageDeleted(column),
			onOperationSuccess: (operation) => this.sendStageEditorAnalytics(operation, 'success'),
			onOperationFailure: (operation) => this.sendStageEditorAnalytics(operation, 'error'),
		});

		this.initCategories();
		this.initTunnels();

		if (this.isCategoryCreatable)
		{
			setTimeout(() => {
				if (!this.hasTunnels())
				{
					this.showCategoryStub();
				}
			});
		}

		Event.bind(this.getAddCategoryButton(), 'click', this.onAddCategoryClick.bind(this));
		Event.bind(this.addCategoryButtonTop, 'click', this.onAddCategoryTopClick.bind(this));
		Event.bind(this.helpButton, 'click', this.onHelpButtonClick.bind(this));

		this.constructor.lastInstance = this;

		sendData(this.analyticsLabels.openSliderLabel);
	}

	hasTunnels(): boolean
	{
		return this.getTunnels().length > 0;
	}

	// Automation is the technical support of tunnels, the right is what makes them editable. The right
	// belongs to one funnel; without one the page-wide right answers, as it does for the funnel the page
	// offers to create.
	canEditTunnels(areTunnelsEditable: boolean = this.areTunnelsEditable): boolean
	{
		return this.isAutomationEnabled && Boolean(areTunnelsEditable);
	}

	// A tunnel belongs to the funnel it starts in, the one the server resolves from the source stage.
	canEditTunnelsOfLink(link: Link): boolean
	{
		return this.canEditTunnels(link.from.getData().column.getData().areTunnelsEditable);
	}

	// The right the server sent with the funnel, and the page-wide one for a funnel that arrives without
	// it.
	tunnelsEditableOf(options: CategorySourceOptions): boolean
	{
		return Boolean(options.ARE_TUNNELS_EDITABLE ?? this.areTunnelsEditable);
	}

	getContainer()
	{
		return this.cache.remember('container', () => {
			return document.querySelector('.crm-st');
		});
	}

	getAppContainer()
	{
		return this.cache.remember('appContainer', () => {
			return this.getContainer().querySelector('.crm-st-container');
		});
	}

	getCategoriesContainer()
	{
		return this.cache.remember('categoriesContainer', () => {
			return this.getAppContainer().querySelector('.crm-st-categories');
		});
	}

	getAddCategoryButton()
	{
		return this.cache.remember('addCategoryButton', () => {
			return this.getContainer().querySelector('.crm-st-add-category-btn');
		});
	}

	getMaxSort()
	{
		return [...this.categories.values()].reduce((acc, curr) => {
			return acc > curr.sort ? acc : curr.sort;
		}, 0);
	}

	onAddCategoryClick(event)
	{
		event.preventDefault();
		const analyticsLabelElement =
			event.currentTarget === this.addCategoryButtonTop
				? 'green_button'
				: 'gray_button'
		;

		if (!this.isCategoryCreatable)
		{
			return Promise.resolve(false);
		}

		if (BX.Crm.Restriction.Bitrix24.isRestricted('dealCategory'))
		{
			const restrictionData = BX.Crm.Restriction.Bitrix24.getData('dealCategory');
			if (restrictionData && restrictionData.quantityLimit <= this.categories.size)
			{
				BX.Crm.Restriction.Bitrix24.getHandler('dealCategory').call();

				return Promise.resolve(false);
			}
		}

		return Backend
			.createCategory({
				name: Loc.getMessage('CRM_ST_TITLE_EDITOR_PLACEHOLDER2'),
				sort: this.getMaxSort() + 10,
			})
			.then((response) => {
				this.addCategoryFromOptions(response.data);
				this.isChanged = true;

				const allStages = this.getStages();
				const newStages = [
					...response.data.STAGES.P,
					...response.data.STAGES.S,
					...response.data.STAGES.F,
				];

				newStages.forEach((item) => allStages.push(item));

				const category = this.getCategory(response.data.ID);

				category.enableTitleEdit('');
				category.getAllColumns()
					.forEach((column) => {
						this.tunnelScheme.stages.push({
							categoryId: column.getData().category.id,
							stageId: column.getId(),
							locked: false,
							tunnels: [],
						});
					});

				if (this.isShownCategoryStub())
				{
					this.hideCategoryStub();
				}

				this.analyticsLabels.createFunnelLabel.status = 'success';
			})
			.catch((response) => {
				this.analyticsLabels.createFunnelLabel.status = 'error';
				this.showErrorPopup(makeErrorMessageFromResponse(response));
			})
			.finally(() => {
				this.analyticsLabels.createFunnelLabel.c_element = analyticsLabelElement;
				sendData(this.analyticsLabels.createFunnelLabel);
			});
	}

	onAddCategoryTopClick(event)
	{
		this.onAddCategoryClick(event)
			.then((success) => {
				if (success)
				{
					window.scrollTo(0, document.body.scrollHeight);
				}
			});
	}

	onHelpButtonClick(event)
	{
		event.preventDefault();

		top.BX.Helper?.show('redirect=detail&code=20732764');
	}

	getCategoryStub(): CategoryStub
	{
		return this.cache.remember('categoryStub', () => {
			return new CategoryStub({
				renderTo: this.getCategoriesContainer(),
				appContainer: this.getAppContainer(),
				id: 'stub',
				name: 'stub',
				default: false,
				stages: {
					P: createStageStubs(5),
					S: createStageStubs(1),
					F: createStageStubs(2),
				},
				sort: 0,
				robotsSettingsLink: this.robotsUrl,
				generatorSettingsLink: this.generatorUrl,
				permissionEditLink: this.permissionEditUrl,
				lazy: true,
				isAvailableGenerator: true,
				isStagesEnabled: this.isStagesEnabled,
				isAutomationEnabled: true,
			});
		});
	}

	showCategoryStub()
	{
		this.shownCategoryStub = true;
		const categoryStub = this.getCategoryStub();
		categoryStub.draw();

		const firstCategory = [...this.categories.values()][0];

		const [columnFrom] = firstCategory.getSuccessKanban().getColumns();
		const [columnTo] = categoryStub.getProgressKanban().getColumns();

		if (this.isAutomationEnabled)
		{
			columnFrom.marker.addStubLinkTo(columnTo.marker, true);
		}
	}

	hideCategoryStub()
	{
		this.shownCategoryStub = false;
		this.getCategoryStub()
			.remove();
		this.cache.delete('categoryStub');
	}

	isShownCategoryStub(): boolean
	{
		return this.shownCategoryStub;
	}

	adjustCategoryStub()
	{
		if (!this.hasTunnels())
		{
			this.showCategoryStub();

			return;
		}

		this.hideCategoryStub();
	}

	addCategoryFromOptions(options: CategorySourceOptions)
	{
		let stages = options.STAGES;
		if (!this.isStagesEnabled)
		{
			stages = {
				P: createStageStubs(5),
				S: createStageStubs(1),
				F: createStageStubs(2),
			};
		}
		const category = new Category({
			renderTo: this.getCategoriesContainer(),
			appContainer: this.getAppContainer(),
			id: options.ID,
			name: options.NAME,
			default: options.IS_DEFAULT,
			stages: stages,
			sort: options.SORT,
			access: options.ACCESS,
			robotsSettingsLink: this.robotsUrl,
			generatorSettingsLink: this.generatorUrl,
			permissionEditLink: this.permissionEditUrl,
			generatorsCount: options.RC_COUNT,
			generatorsListUrl: options.RC_LIST_URL,
			isCategoryEditable: this.isCategoryEditable,
			isCategoryAccessEditable: this.isCategoryAccessEditable,
			areStagesEditable: this.areStagesEditable,
			areTunnelsEditable: this.tunnelsEditableOf(options),
			isAvailableGenerator: this.isAvailableGenerator,
			isAutomationEnabled: this.isAutomationEnabled,
			isStagesEnabled: this.isStagesEnabled,
			entityTypeId: this.entityTypeId,
		});

		category
			.subscribe('Category:title:save', (event) => {
				const { categoryId, value } = event.data;

				Backend
					.updateCategory({
						id: categoryId,
						fields: {
							NAME: value,
						},
					})
					.then(() => {
						UI.Notification.Center.notify({
							content: Loc.getMessage('CRM_ST_NOTIFICATION_CHANGES_SAVED'),
							autoHideDelay: 1500,
							category: 'save',
						});
						this.isChanged = true;

						this.analyticsLabels.renameFunnelLabel.status = 'success';
					})
					.catch((response) => {
						this.analyticsLabels.renameFunnelLabel.status = 'error';
						this.showErrorPopup(makeErrorMessageFromResponse(response));
					})
					.finally(() => {
						sendData(this.analyticsLabels.renameFunnelLabel);
					});
			})
			.subscribe('Category:access', (event) => {
				const { categoryId, access } = event.data;

				Backend
					.accessCategory({
						id: categoryId,
						access: access,
					})
					.then(() => {
						UI.Notification.Center.notify({
							content: Loc.getMessage('CRM_ST_NOTIFICATION_CHANGES_SAVED'),
							autoHideDelay: 1500,
							category: 'save',
						});
					})
					.catch((response) => {
						this.showErrorPopup(makeErrorMessageFromResponse(response));
					});
			})
			.subscribe('Category:access:copy', (event) => {
				const { categoryId, donorCategoryId } = event.data;

				Backend
					.copyAccessCategory({
						id: categoryId,
						donorId: donorCategoryId,
					})
					.then(() => {
						UI.Notification.Center.notify({
							content: Loc.getMessage('CRM_ST_NOTIFICATION_CHANGES_SAVED'),
							autoHideDelay: 1500,
							category: 'save',
						});
					})
					.catch((response) => {
						this.showErrorPopup(makeErrorMessageFromResponse(response));
					});
			})
			.subscribe('Category:remove', (event) => {
				Backend
					.removeCategory({
						id: event.data.categoryId,
					})
					.then(() => {
						event.data.onConfirm();
						UI.Notification.Center.notify({
							content: Loc.getMessage('CRM_ST_NOTIFICATION_CHANGES_SAVED'),
							autoHideDelay: 1500,
							category: 'save',
						});

						setTimeout(() => {
							if (this.isShownCategoryStub())
							{
								this.hideCategoryStub();
								this.showCategoryStub();

								return;
							}

							this.adjustCategoryStub();
							Marker.adjustLinks();
						});
						this.isChanged = true;

						this.analyticsLabels.deleteFunnelLabel.status = 'success';
					})
					.catch((response) => {
						event.data.onCancel();
						this.analyticsLabels.deleteFunnelLabel.status = 'error';

						this.showErrorPopup(makeErrorMessageFromResponse(response));
					})
					.finally(() => {
						sendData(this.analyticsLabels.deleteFunnelLabel);
					});
			})
			.subscribe('Column:link', (event) => {
				if (!this.canEditTunnelsOfLink(event.data.link))
				{
					return;
				}

				if (!event.data.preventSave)
				{
					if (BX.Crm.Restriction.Bitrix24.isRestricted('automation'))
					{
						return BX.Crm.Restriction.Bitrix24.getHandler('automation').call();
					}
					const from = {
						category: event.data.link.from.getData().column.getData().category.id,
						stage: event.data.link.from.getData().column.data.stage.STATUS_ID,
					};

					const to = {
						category: event.data.link.to.getData().column.getData().category.id,
						stage: event.data.link.to.getData().column.data.stage.STATUS_ID,
					};
					const robotAction = event.data.link.robotAction;

					Backend
						.createRobot({ from, to, robotAction })
						.then((response: {data: {tunnel: Tunnel, success: boolean}}) => {
							UI.Notification.Center.notify({
								content: Loc.getMessage('CRM_ST_NOTIFICATION_CHANGES_SAVED'),
								autoHideDelay: 1500,
								category: 'save',
							});

							const stage = this.getStages().find((item) => {
								return (
									String(item.CATEGORY_ID) === String(response.data.tunnel.srcCategory)
									&& String(item.STATUS_ID) === String(response.data.tunnel.srcStage)
								);
							});

							stage.TUNNELS.push(response.data.tunnel);
							this.analyticsLabels.createTunnelLabel.status = 'success';
						})
						.catch((response) => {
							const link = event.data.link;
							link.from.removeLink(link);

							this.analyticsLabels.createTunnelLabel.status = 'error';

							this.showErrorPopup(makeErrorMessageFromResponse(response));
						})
						.finally(() => {
							sendData(this.analyticsLabels.createTunnelLabel);
						});
				}

				this.hideCategoryStub();
			})
			.subscribe('Column:removeLinkFrom', (event) => {
				if (!this.canEditTunnelsOfLink(event.data.link))
				{
					return;
				}

				if (!event.data.preventSave)
				{
					const columnFrom = event.data.link.from.getData().column;
					const columnTo = event.data.link.to.getData().column;
					const srcCategory = columnFrom.getData().category.id;
					const srcStage = columnFrom.getId();
					const dstCategory = columnTo.getData().category.id;
					const dstStage = columnTo.getId();
					const tunnel = this.getTunnelByLink(event.data.link);

					if (tunnel)
					{
						if (BX.Crm.Restriction.Bitrix24.isRestricted('automation'))
						{
							return BX.Crm.Restriction.Bitrix24.getHandler('automation').call();
						}
						const requestOptions = {
							srcCategory,
							srcStage,
							dstCategory,
							dstStage,
							robot: tunnel.robot,
						};

						Backend
							.removeRobot(requestOptions)
							.then(() => {
								UI.Notification.Center.notify({
									content: Loc.getMessage('CRM_ST_NOTIFICATION_CHANGES_SAVED'),
									autoHideDelay: 1500,
									category: 'save',
								});
								this.analyticsLabels.deleteTunnelLabel.status = 'success';
							})
							.catch((response) => {
								this.analyticsLabels.deleteTunnelLabel.status = 'error';
								this.showErrorPopup(makeErrorMessageFromResponse(response));
							})
							.finally(() => {
								sendData(this.analyticsLabels.deleteTunnelLabel);
							});

						const stage = this.getStageDataById(srcStage);

						stage.TUNNELS = stage.TUNNELS.filter((item) => {
							return !(
								String(item.srcStage) === String(srcStage)
								&& String(item.srcCategory) === String(srcCategory)
								&& String(item.dstStage) === String(dstStage)
								&& String(item.dstCategory) === String(dstCategory)
							);
						});

						this.adjustCategoryStub();
					}
				}
			})
			.subscribe('Column:changeRobotAction', (event) => {
				if (!this.canEditTunnelsOfLink(event.data.link) || event.data.preventSave)
				{
					return;
				}

				if (BX.Crm.Restriction.Bitrix24.isRestricted('automation'))
				{
					return BX.Crm.Restriction.Bitrix24.getHandler('automation').call();
				}
				const columnFrom = event.data.link.from.getData().column;
				const columnTo = event.data.link.to.getData().column;
				const srcCategory = columnFrom.getData().category.id;
				const srcStage = columnFrom.getId();
				const dstCategory = columnTo.getData().category.id;
				const dstStage = columnTo.getId();
				const tunnel = this.getTunnelByLink(event.data.link);

				if (tunnel)
				{
					const from = {
						category: srcCategory,
						stage: srcStage,
					};
					const to = {
						category: dstCategory,
						stage: dstStage,
					};

					Backend
						.removeRobot(tunnel)
						.then(() => {
							Backend
								.createRobot({ from, to, robotAction: event.data.link.robotAction })
								.then((response: {data: {tunnel: Tunnel, success: boolean}}) => {
									UI.Notification.Center.notify({
										content: Loc.getMessage('CRM_ST_NOTIFICATION_CHANGES_SAVED'),
										autoHideDelay: 1500,
										category: 'save',
									});

									const stage = this.getStageDataById(srcStage);

									const index = stage.TUNNELS.findIndex((item) => {
										return (
											String(item.srcStage) === String(srcStage)
											&& String(item.srcCategory) === String(srcCategory)
											&& String(item.dstStage) === String(dstStage)
											&& String(item.dstCategory) === String(dstCategory)
										);
									});

									if (index >= 0)
									{
										stage.TUNNELS[index] = response.data.tunnel;
									}

									event.data.onChangeRobotEnd();
								})
								.catch((response) => this.showErrorPopup(makeErrorMessageFromResponse(response)));
						})
						.catch((response) => this.showErrorPopup(makeErrorMessageFromResponse(response)));
				}
			})
			.subscribe('Column:editLink', (event) => {
				if (!this.canEditTunnelsOfLink(event.data.link))
				{
					return;
				}
				const tunnel = this.getTunnelByLink(event.data.link);

				// eslint-disable-next-line
				BX.Bizproc.Automation.API.showRobotSettings(
					tunnel.robot,
					this.documentType,
					tunnel.srcStage,
					(robot) => {
						tunnel.robot = robot.serialize();

						Backend
							.updateRobot(tunnel)
							.then(() => {
								UI.Notification.Center.notify({
									content: Loc.getMessage('CRM_ST_NOTIFICATION_CHANGES_SAVED'),
									autoHideDelay: 1500,
									category: 'save',
								});

								tunnel.dstCategory = robot.getProperty('CategoryId');
								tunnel.dstStage = robot.getProperty('StageId');

								const category = this.getCategory(tunnel.dstCategory);
								const column = category.getKanbanColumn(tunnel.dstStage);

								event.data.link.from.updateLink(event.data.link, column.marker, true);

								this.adjustCategoryStub();
							}).catch((response) => {
								this.showErrorPopup(makeErrorMessageFromResponse(response));
							});
					},
				);
			})
			.subscribe('Category:sort', () => {
				const results = Category.instances
					.filter((category) => category.id !== 'stub')
					.map((category, index) => {
						return Backend
							.updateCategory({
								id: category.id,
								fields: {
									SORT: (index + 1) * 100,
								},
							});
					});

				Promise.all(results)
					.then(() => {
						UI.Notification.Center.notify({
							content: Loc.getMessage('CRM_ST_NOTIFICATION_CHANGES_SAVED'),
							autoHideDelay: 1500,
							category: 'save',
						});
						this.isChanged = true;
					});
			})
			.subscribe('Column:remove', (event) => {
				if (!Type.isNil(event.data.column.data.stageId))
				{
					const hasTunnels = this.isAutomationEnabled ? [...Marker.getAllLinks()].some((item) => {
						return (
							event.data.column.marker === item.from
							|| event.data.column.marker === item.to
						);
					}) : false;

					Backend
						.removeStage({
							statusId: event.data.column.getId(),
							stageId: event.data.column.data.stageId,
							entityId: event.data.column.data.entityId,
						})
						.then(() => {
							event.data.onConfirm();

							if (!hasTunnels)
							{
								UI.Notification.Center.notify({
									content: Loc.getMessage('CRM_ST_NOTIFICATION_CHANGES_SAVED'),
									autoHideDelay: 1500,
									category: 'save',
								});
								this.isChanged = true;
							}

							this.analyticsLabels.deleteStageLabel.status = 'success';
						})
						.catch((response) => {
							event.data.onCancel();
							this.analyticsLabels.deleteStageLabel.status = 'error';

							this.showErrorPopup(makeErrorMessageFromResponse(response));
						})
						.finally(() => {
							sendData(this.analyticsLabels.deleteStageLabel);
						});
				}
			})
			.subscribe('Column:change', (event) => {
				Backend
					.updateStage({
						statusId: event.data.column.getId(),
						stageId: event.data.column.data.stageId,
						entityId: event.data.column.data.entityId,
						name: event.data.column.getName(),
						sort: event.data.column.data.stage.SORT,
						color: event.data.column.getColor(),
						categoryId: event.data.column.getData().category.id,
					})
					.then(({ data }) => {
						if (data.success)
						{
							UI.Notification.Center.notify({
								content: Loc.getMessage('CRM_ST_NOTIFICATION_CHANGES_SAVED'),
								autoHideDelay: 1500,
								category: 'save',
							});
							this.isChanged = true;

							this.analyticsLabels.renameStageLabel.status = 'success';
						}
						else
						{
							this.analyticsLabels.renameStageLabel.status = 'error';
							this.showErrorPopup(makeErrorMessageFromResponse({ data }));
						}

						sendData(this.analyticsLabels.renameStageLabel);
					});
			})
			.subscribe('Column:edit', (event) => {
				this.stageEditorController.openEdit(event.data.column);
			})
			.subscribe('Column:addColumn', (event) => {
				this.stageEditorController.openCreate(event.data.column);
			})
			.subscribe('Column:sort', (event) => {
				const sortData = event.data.columns.map((column, index) => {
					const newSorting = (index + 1) * 100;
					const columnData = {
						statusId: column.getId(),
						stageId: column.data.stageId,
						entityId: column.data.entityId,
						name: column.getName(),
						sort: newSorting,
						color: column.getColor(),
						categoryId: column.getData().category.id,
					};

					column.data.stage.SORT = newSorting;

					return columnData;
				});

				Backend
					.updateStages(sortData)
					.then(({ data }) => {
						const success = data.every((item) => {
							return item.success;
						});

						if (success)
						{
							UI.Notification.Center.notify({
								content: Loc.getMessage('CRM_ST_NOTIFICATION_CHANGES_SAVED'),
								autoHideDelay: 1500,
								category: 'save',
							});
							this.isChanged = true;

							this.analyticsLabels.updateStageLabel.status = 'success';
						}
						else
						{
							this.analyticsLabels.updateStageLabel.status = 'error';
							this.showErrorPopup(makeErrorMessageFromResponse({ data }));
						}

						sendData(this.analyticsLabels.updateStageLabel);
					});
			})
			.subscribe('Category:slider:close', () => {
				this.reload();
			})
			.subscribe('Column:error', (event) => {
				this.showErrorPopup(makeErrorMessageFromResponse({
					data: {
						errors: [event.data.message],
					},
				}));
			});

		this.categories.set(String(options.ID), category);
	}

	updateColumnFromEditorData(column, stageData)
	{
		const currentStage = column.getData().stage;
		const stage = {
			...currentStage,
			NAME: stageData.name,
			COLOR: stageData.color,
			DESCRIPTION: stageData.description,
		};
		const data = {
			...column.getData(),
			stage,
		};

		column.getGrid().updateColumn(column, {
			id: column.getId(),
			name: stage.NAME,
			color: stage.COLOR,
			total: column.getTotal(),
			data,
		});
		column.currentName = stage.NAME;
	}

	createStageEditorDraft(sourceColumn)
	{
		const grid = sourceColumn.getGrid();
		const sourceStage = sourceColumn.getData().stage;
		const category = this.getCategory(sourceColumn.getData().category.id);
		const draftId = `kanban-new-column-${BX.util.getRandomString(5)}`;
		const draftStage = {
			...sourceStage,
			ID: null,
			STATUS_ID: draftId,
			NAME: grid.getMessage('COLUMN_TITLE_PLACEHOLDER'),
			COLOR: `#${sourceColumn.getColor()}`,
			DESCRIPTION: '',
			SORT: Number(sourceStage.SORT) + 1,
			SYSTEM: 'N',
			TUNNELS: [],
		};

		const draftColumn = grid.addColumn({
			id: draftId,
			name: draftStage.NAME,
			color: sourceColumn.getColor(),
			canSort: false,
			canAddItem: false,
			droppable: false,
			data: category.getColumnData(draftStage),
			targetId: grid.getNextColumnSibling(sourceColumn),
		});
		Marker.adjustLinks();

		return draftColumn;
	}

	removeStageEditorDraft(draftColumn)
	{
		draftColumn.getGrid().removeColumn(draftColumn);
		Marker.adjustLinks();
	}

	handleStageCreated(draftColumn, sourceColumn, stage)
	{
		const grid = draftColumn.getGrid();
		const category = this.getCategory(sourceColumn.getData().category.id);
		const targetId = grid.getNextColumnSibling(draftColumn);
		stage.TUNNELS = [];
		this.getStages().push(stage);
		grid.removeColumn(draftColumn);
		grid.addColumn({
			id: stage.STATUS_ID,
			name: stage.NAME,
			color: stage.COLOR.replace('#', ''),
			data: category.getColumnData(stage),
			targetId,
		});

		this.notifyStageEditorSaved();
		Marker.adjustLinks();

		return toStageEditorData(stage);
	}

	handleStageUpdated(column, stage)
	{
		const oldStage = column.getData().stage;
		stage.TUNNELS = stage.TUNNELS || oldStage.TUNNELS || [];
		const category = column.getData().category;

		column.getGrid().updateColumn(column, {
			id: column.getId(),
			name: stage.NAME,
			color: stage.COLOR.replace('#', ''),
			total: column.getTotal(),
			data: category.getColumnData(stage),
		});
		column.currentName = stage.NAME;

		this.notifyStageEditorSaved();
		Marker.adjustLinks();

		return toStageEditorData(stage);
	}

	handleStageDeleted(column)
	{
		Marker.getAllLinks().forEach((link) => {
			if (link.from === column.marker || link.to === column.marker)
			{
				link.from.removeLink(link);
			}
		});
		column.getGrid().removeColumn(column);

		this.notifyStageEditorSaved();
		setTimeout(() => {
			Marker.removeAllLinks();
			Marker.restoreAllLinks();
		});
	}

	notifyStageEditorSaved()
	{
		UI.Notification.Center.notify({
			content: Loc.getMessage('CRM_ST_NOTIFICATION_CHANGES_SAVED'),
			autoHideDelay: 1500,
			category: 'save',
		});
		this.isChanged = true;
	}

	sendStageEditorAnalytics(operation, status)
	{
		const labels = {
			create: this.analyticsLabels.createStageLabel,
			update: this.analyticsLabels.renameStageLabel,
			delete: this.analyticsLabels.deleteStageLabel,
		};
		const label = labels[operation];
		if (label)
		{
			label.status = status;
			sendData(label);
		}
	}

	showErrorPopup(message)
	{
		if (!this.errorPopup)
		{
			this.errorPopup = new PopupWindow({
				titleBar: Loc.getMessage('CRM_ST_ERROR_POPUP_TITLE'),
				width: 350,
				closeIcon: true,
				buttons: [
					new PopupWindowButtonLink({
						id: 'close',
						text: Loc.getMessage('CRM_ST_ERROR_POPUP_CLOSE_BUTTON_LABEL'),
						events: {
							click() {
								this.popupWindow.close();
							},
						},
					}),
				],
			});
		}

		this.errorPopup.setContent(message);
		this.errorPopup.show();
	}

	getSlider()
	{
		// eslint-disable-next-line
		return BX.SidePanel.Instance.getSlider(
			window.location.pathname,
		);
	}

	reload()
	{
		const slider = this.getSlider();

		if (slider)
		{
			slider.reload();
		}
	}

	getStageDataById(id: string): Stage
	{
		return this.getStages().find((stage) => String(stage.STATUS_ID) === String(id));
	}

	getTunnelByLink(link: Link)
	{
		const columnFrom = link.from.getData().column;
		const columnTo = link.to.getData().column;
		const srcCategory = columnFrom.getData().category.id;
		const srcStage = columnFrom.getId();
		const dstCategory = columnTo.getData().category.id;
		const dstStage = columnTo.getId();

		const stageFrom = this.getStageDataById(srcStage);

		if (stageFrom)
		{
			return stageFrom.TUNNELS.find((item) => {
				return (
					String(item.srcCategory) === String(srcCategory)
					&& String(item.srcStage) === String(srcStage)
					&& String(item.dstCategory) === String(dstCategory)
					&& String(item.dstStage) === String(dstStage)
				);
			});
		}

		return null;
	}

	getCategory(id: number | string): Category
	{
		return this.categories.get(String(id));
	}

	getStages(): Array<Stage>
	{
		return this.cache.remember('allStages', () => {
			return this.categoriesOptions.reduce((acc, category) => {
				return [
					...acc,
					...category.STAGES.P,
					...category.STAGES.S,
					...category.STAGES.F,
				];
			}, []);
		});
	}

	getTunnels(): Array<Tunnel>
	{
		return this.getStages().reduce((acc, stage) => {
			return [...acc, ...(stage.TUNNELS || [])];
		}, []);
	}

	initCategories()
	{
		this.categoriesOptions.map((categoryOptions) => {
			this.addCategoryFromOptions(categoryOptions);
		});
	}

	initTunnels()
	{
		if (!this.isAutomationEnabled)
		{
			return;
		}
		this.getStages()
			.filter((stage) => {
				return Type.isArray(stage.TUNNELS) && stage.TUNNELS.length;
			})
			.forEach((stage) => {
				stage.TUNNELS.forEach((tunnel) => {
					const categoryFrom = this.getCategory(tunnel.srcCategory);
					const categoryTo = this.getCategory(tunnel.dstCategory);

					if (categoryFrom && categoryTo)
					{
						const columnFrom = categoryFrom.getKanbanColumn(tunnel.srcStage);
						const columnTo = categoryTo.getKanbanColumn(tunnel.dstStage);

						if (columnFrom && columnTo)
						{
							const preventEvent = true;
							columnFrom.marker.addLinkTo(columnTo.marker, tunnel.robotAction, preventEvent);
						}
					}
				});
			});
	}

	static getLastInstance(): ?Manager
	{
		return this.lastInstance;
	}
}
