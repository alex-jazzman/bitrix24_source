/**
 * @module crm/stage-selector
 */
jn.define('crm/stage-selector', (require, exports, module) => {

	const { Haptics } = require('haptics');
	const { NavigationLoader } = require('navigation-loader');
	const { isEqual } = require('utils/object');
	const { throttle } = require('utils/function');
	const { getStageIcon } = require('crm/assets/stage');
	const { CategoryStorage } = require('crm/storage/category');
	const { StageListView } = require('crm/stage-list-view');

	const STAGE_WIDTH = device.screen.width * 0.48;
	const STAGE_MARGIN = 8;
	const FIRST_STAGE_VIEW_WIDTH = 16;

	/**
	 * @class StageSelector
	 */
	class StageSelector extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			const { activeStageId } = props;

			this.state = {
				category: this.getCategoryByProps(props),
				activeStageId,
			};

			this.uid = (props.uid || Random.getString(10));

			this.handleStageClick = throttle(this.handleStageClick, 500, this);
			this.prevActiveStageId = null;
		}

		getCategoryByProps(props)
		{
			const { entityTypeId, categoryId } = props;

			return CategoryStorage.getCategory(entityTypeId, categoryId);
		}

		componentDidMount()
		{
			CategoryStorage
				.subscribeOnChange(() => this.reloadCategory())
				.subscribeOnLoading(({ status }) => NavigationLoader.setLoading(status))
				.markReady();
		}

		reloadCategory()
		{
			const category = this.getCategoryByProps(this.props);
			if (!isEqual(this.state.category, category))
			{
				this.setState({ category });
			}
		}

		componentWillReceiveProps(newProps)
		{
			const { activeStageId } = newProps;

			if (this.props.categoryId !== newProps.categoryId)
			{
				this.prevActiveStageId = null;
			}

			this.state.category = this.getCategoryByProps(newProps);
			this.state.activeStageId = activeStageId;
		}

		isReadonly()
		{
			return BX.prop.getBoolean(this.props, 'readOnly', false);
		}

		isReadonlyNotificationEnabled()
		{
			return BX.prop.getBoolean(this.props, 'showReadonlyNotification', false);
		}

		showBorder()
		{
			return BX.prop.getBoolean(this.props, 'showBorder', false);
		}

		getStagesFromCategory()
		{
			const { category } = this.state;

			if (!category)
			{
				return [];
			}

			const { successStages, failedStages, processStages } = category;

			return [...processStages, ...successStages, ...failedStages];
		}

		componentDidUpdate(prevProps, prevState)
		{
			//this.animate();
		}

		getStageIndexById(stages, stageId)
		{
			return Math.max(stages.findIndex(({ id }) => id === stageId), 0);
		}

		getCurrentSliderPosition(stages, activeIndex)
		{
			if (activeIndex === 0)
			{
				return this.props.hasHiddenEmptyView ? FIRST_STAGE_VIEW_WIDTH : STAGE_MARGIN + FIRST_STAGE_VIEW_WIDTH;
			}
			else
			{
				return activeIndex * (-STAGE_WIDTH - STAGE_MARGIN) + FIRST_STAGE_VIEW_WIDTH + 2 * STAGE_MARGIN;
			}
		}

		openStageList(activeStageId)
		{
			const { entityTypeId, categoryId, data } = this.props;

			return StageListView.open({
				entityTypeId,
				categoryId,
				activeStageId,
				data,
				readOnly: true,
				canMoveStages: false,
				enableStageSelect: true,
				onStageSelect: ({ id }, category, data) => this.changeActiveStageId(id, category, data),
				uid: this.uid,
			});
		}

		handleStageClick(first, id, category, data)
		{
			if (this.isReadonly())
			{
				return;
			}

			Keyboard.dismiss();

			if (first)
			{
				void this.openStageList(id);
			}
			else
			{
				Haptics.impactLight();
				this.changeActiveStageId(id, category, data);
			}
		}

		openStageChangeMenu(stage, category, data)
		{
			const { id, name, color } = stage;

			const menu = new ContextMenu({
				actions: [
					{
						id: 'change-stage',
						title: name,
						data: {
							svgIcon: getStageIcon(color),
						},
						onClickCallback: () => this.handleStageClick(false, id, category, data),
					},
				],
				params: {
					title: BX.message('CRM_STAGE_SELECTOR_CHANGE_STAGE_TITLE'),
					showCancelButton: true,
					showActionLoader: false,
				},
			});

			menu.show();
		}

		notifyAboutReadOnlyStatus()
		{
			if (this.isReadonlyNotificationEnabled())
			{
				Notify.showUniqueMessage(
					BX.message('CRM_STAGE_SELECTOR_NOTIFY_READONLY_TEXT'),
					BX.message('CRM_STAGE_SELECTOR_NOTIFY_READONLY_TITLE'),
					{ time: 4 },
				);
			}
		}

		changeActiveStageId(activeStageId, category, data)
		{
			if (this.isReadonly() || this.state.activeStageId === activeStageId)
			{
				return;
			}

			this.prevActiveStageId = this.state.activeStageId;

			const { onStageSelect } = this.props;
			if (typeof onStageSelect === 'function')
			{
				onStageSelect(activeStageId, category, data).then((response) => {
					this.setState({ activeStageId: response.columnId || activeStageId });
				});
			}
			else
			{
				this.setState({ activeStageId });
			}
		}

		render()
		{
			this.animate();

			return View(
				{
					style: {
						flexDirection: 'column',
					},
				},
				View({
						style: {
							width: '100%',
							flexDirection: 'row',
							height: 50,
						},
					},
					this.renderStageSlider(),
				),
				View(
					{
						style: {
							marginHorizontal: 16,
							padding: 4,
							flexDirection: 'row',
							flex: 1,
							borderBottomWidth: 1,
							borderBottomColor: this.showBorder() ? this.props.borderColor: null,
						},
					},
				),
			);
		}

		animate()
		{
			if (this.prevActiveStageId && this.state.activeStageId !== this.prevActiveStageId)
			{
				setTimeout(() => {
					const activeIndex = this.getStageIndexById(this.currentStages, this.state.activeStageId);

					this.stageSliderRef.animate(
						{
							delay: 100,
							duration: 500,
							left: this.getCurrentSliderPosition(this.currentStages, activeIndex),
						},
					);
				}, 100);
			}
		}

		renderStageSlider()
		{
			this.currentStages = this.getSliderStages();
			const activeIndex = this.getStageIndexById(this.currentStages, this.state.activeStageId);
			let currentPosition;
			if (this.prevActiveStageId && this.prevActiveStageId !== this.state.activeStageId)
			{
				const prevIndex = this.getStageIndexById(this.currentStages, this.prevActiveStageId);
				currentPosition = this.getCurrentSliderPosition(this.currentStages, prevIndex);
			}
			else
			{
				currentPosition = this.getCurrentSliderPosition(this.currentStages, activeIndex);
			}

			const renderedStages = this.currentStages.map((stage, index) => {
				return this.renderStage(
					stage,
					index,
					activeIndex,
					this.state.activeStageId,
				);
			});

			return View(
				{
					style: {
						width: (STAGE_WIDTH + STAGE_MARGIN) * this.currentStages.length + FIRST_STAGE_VIEW_WIDTH,
						flexDirection: 'row',
						height: 50,
						position: 'absolute',
						top: 0,
						//animation fix (create new object on each render)
						left: this.state.activeStageId % 2 ? currentPosition : currentPosition + 0.1,
					},
					ref: (ref) => this.stageSliderRef = ref,
				},
				...renderedStages,
			);
		}

		getSliderStages()
		{
			const stages = this.getStagesFromCategory();
			const activeIndex = this.getStageIndexById(stages, this.state.activeStageId);

			if (!this.prevActiveStageId)
			{
				return this.getInitialSliderStages(stages, activeIndex);
			}

			const prevIndex = this.getStageIndexById(stages, this.prevActiveStageId);
			if (prevIndex === activeIndex)
			{
				return this.getInitialSliderStages(stages, activeIndex);
			}

			let start = Math.min(activeIndex, prevIndex);
			const maxIndex = Math.max(prevIndex, activeIndex);

			if (start !== 0)
			{
				start = start - 1;
			}

			if (stages[activeIndex].semantics !== 'P')
			{
				if (stages[prevIndex].semantics === 'P')
				{
					return [...this.state.category.processStages.slice(start), stages[activeIndex]];
				}
				else
				{
					return [this.state.category.processStages[this.state.category.processStages.length - 1], stages[activeIndex]];
				}
			}
			else
			{
				if (stages[prevIndex].semantics === 'S')
				{
					return [...this.state.category.processStages.slice(start), stages[prevIndex]];
				}
				else if (stages[prevIndex].semantics === 'F')
				{
					return [...this.state.category.processStages.slice(start), ...this.state.category.successStages, stages[prevIndex]];
				}
			}

			return stages.slice(start, maxIndex + 2);
		}

		getInitialSliderStages(stages, activeIndex)
		{
			let start = 0;
			let end = 0;
			if (activeIndex === 0)
			{
				return stages.slice(activeIndex, 2);
			}

			if (stages[activeIndex - 1])
			{
				start = activeIndex - 1;
			}

			if (stages[activeIndex].semantics !== 'P')
			{
				return [this.state.category.processStages[this.state.category.processStages.length - 1], stages[activeIndex]];
			}
			else if (stages[activeIndex + 1])
			{
				if (stages[activeIndex + 1].semantics === 'P')
				{
					end = 3;
				}
				else
				{
					end = 2;
				}
			}

			return stages.slice(start, activeIndex + end);
		}

		renderStage(stage, index, activeIndex, activeStageId)
		{
			const {
				color,
				name,
				id,
			} = stage;
			const { category, data, useStageChangeMenu } = this.props;
			const backgroundColor = index > activeIndex ? '#eef2f4' : color;
			const readOnly = this.isReadonly();

			return View(
				{
					style: {
						height: 50,
						width: STAGE_WIDTH,
						marginRight: 8,
						paddingTop: 8,
						paddingBottom: 8,
						flexDirection: 'row',
					},
					onClick: () => {
						if (readOnly)
						{
							this.notifyAboutReadOnlyStatus();
						}
						else if (useStageChangeMenu && activeStageId !== id)
						{
							this.openStageChangeMenu(stage, category, data);
						}
						else
						{
							this.handleStageClick(activeStageId === id, id, category, data);
						}
					},
					onLongClick: () => {
						if (readOnly)
						{
							this.notifyAboutReadOnlyStatus();
						}
						else if (useStageChangeMenu && activeStageId !== id)
						{
							this.handleStageClick(activeStageId === id, id, category, data);
						}
					},
				},
				View(
					{
						style: {
							width: STAGE_WIDTH - 10,
							height: '100%',
							borderRadius: 5,
							backgroundColor: index > activeIndex ? '#eef2f4' : backgroundColor,
							flexDirection: 'column',
							borderBottomWidth: 3,
							borderBottomColor: color,
						},
					},
					View(
						{
							style: {
								flexDirection: 'row',
								alignItems: 'center',
								justifyContent: 'space-between',
								height: '100%',
								paddingLeft: 8,
								paddingRight: index < activeIndex ? 10 : 0,
							},
						},
						Text(
							{
								numberOfLines: 1,
								ellipsize: 'end',
								style: {
									height: 'auto',
									color: index > activeIndex ? '#a8adb4' : this.calculateTextColor(backgroundColor),
									fontWeight: '500',
									flexShrink: 2,
								},
								text: name,
							},
						),
						!readOnly && activeStageId === id ? Image(
							{
								style: {
									width: 8,
									height: 5,
									margin: 5,
								},
								svg: {
									content: svgImages.stageSelectArrow(),
								},
							},
						) : null,
					),
				),
				Image(
					{
						style: {
							width: 15,
							height: 34,
							marginLeft: -5,
						},
						resizeMode: 'contain',
						svg: {
							content: svgImages.arrow(backgroundColor, color),
						},
					},
				),
			);
		}

		calculateTextColor(baseColor)
		{
			let r, g, b;
			if (baseColor > 7)
			{
				let hexComponent = baseColor.split('(')[1].split(')')[0];
				hexComponent = hexComponent.split(',');
				r = parseInt(hexComponent[0]);
				g = parseInt(hexComponent[1]);
				b = parseInt(hexComponent[2]);
			}
			else if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(baseColor))
			{
				let c = baseColor.substring(1).split('');
				if (c.length === 3)
				{
					c = [c[0], c[0], c[1], c[1], c[2], c[2]];
				}
				c = '0x' + c.join('');
				r = (c >> 16) & 255;
				g = (c >> 8) & 255;
				b = c & 255;
			}

			const y = 0.21 * r + 0.72 * g + 0.07 * b;
			return (y < 145) ? '#fff' : '#333';
		}
	}

	const svgImages = {
		stageSelectArrow: () => {
			return `<svg width="8" height="5" viewBox="0 0 8 5" fill="none" xmlns="http://www.w3.org/2000/svg"><path opacity="0.5" fill-rule="evenodd" clip-rule="evenodd" d="M7.48524 0.949718L3.94971 4.48525L0.414173 0.949718H7.48524Z" fill="white"/></svg>`;
		},
		arrow: (backgroundColor, borderColor) => {
			return `<svg width="15" height="34" viewBox="0 0 15 34" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 0H0.314926C2.30669 0 4.16862 0.9884 5.28463 2.63814L13.8629 15.3191C14.5498 16.3344 14.5498 17.6656 13.8629 18.6809L5.28463 31.3619C4.16863 33.0116 2.30669 34 0.314926 34H0V0Z" fill="${backgroundColor}"/><path d="M0 31H5.5L5.2812 31.3282C4.1684 32.9974 2.29502 34 0.288897 34H0V31Z" fill="${borderColor}"/></svg>`;
		},
	};
	module.exports = { StageSelector };
});
