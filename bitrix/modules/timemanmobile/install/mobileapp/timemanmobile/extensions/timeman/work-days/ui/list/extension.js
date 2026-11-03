/**
 * @module timeman/work-days/ui/list
 */
jn.define('timeman/work-days/ui/list', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');
	const { Indent, Corner, Color } = require('tokens');
	const { Moment } = require('utils/date');
	const { WorkDayItem } = require('timeman/work-days/ui/list/item');
	const { WorkDaysEmptyState } = require('timeman/work-days/ui/list/empty-state');
	const { BlinkView } = require('animation/components/blink-view');
	const { createTestIdGenerator } = require('utils/test');

	const BLINK_DELAY = 600;
	const DEFAULT_ITEM_HEIGHT = 130;
	const ESTIMATED_SCROLL_CONTEXT_ROWS = 8;

	class WorkDaysList extends PureComponent
	{
		/**
		 * @param {WorkDaysListProps} props
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({ prefix: 'work-days-list', context: this });
			this.blinkRefs = new Map();
			this.itemHeights = new Map();
			this.estimatedItemHeight = DEFAULT_ITEM_HEIGHT;
			this.dayKeys = [];
			this.currentScrollOffset = 0;
			this.scrolledDateKey = null;
		}

		componentDidMount()
		{
			this.#scrollToPendingDate();
		}

		componentWillReceiveProps(nextProps)
		{
			if (nextProps.timestamp !== this.props.timestamp && this.scrollViewRef)
			{
				this.itemHeights.clear();
				this.estimatedItemHeight = DEFAULT_ITEM_HEIGHT;
				this.scrolledDateKey = null;
				this.scrollViewRef.scrollTo({ y: 0, animated: false });
			}
		}

		componentDidUpdate(prevProps)
		{
			if (
				prevProps.scrollToTimestamp !== this.props.scrollToTimestamp
				|| prevProps.dayMap !== this.props.dayMap
			)
			{
				this.#scrollToPendingDate();
			}
		}

		render()
		{
			const days = this.#buildMonthDays();
			this.dayKeys = days.map(({ id }) => id);

			return View(
				{
					style: {
						flex: 1,
					},
				},
				days.length === 0
					? new WorkDaysEmptyState({
						testId: this.getTestId('empty-state'),
					})
					: ScrollView(
						{
							testId: this.getTestId('list'),
							style: {
								flex: 1,
								marginTop: Indent.XL2.toNumber(),

								borderTopLeftRadius: Corner.XL.toNumber(),
								borderTopRightRadius: Corner.XL.toNumber(),
							},
							ref: this.#bindRef,
							onScroll: ({ contentOffset }) => {
								this.currentScrollOffset = contentOffset.y;
							},
						},
						View(
							{
								style: {
									paddingTop: Indent.S.toNumber(),
									backgroundColor: Color.bgContentPrimary.toHex(),
									borderRadius: Corner.XL.toNumber(),
								},
							},
							...days.map((day, index) => this.#renderItem(day, index, days.length)),
						),
					),
			);
		}

		#bindRef = (ref) => {
			this.scrollViewRef = ref;
		};

		#renderItem(day, index, total)
		{
			const dateKey = day.id;

			return View(
				{
					key: dateKey,
					onLayout: ({ height }) => {
						this.itemHeights.set(dateKey, height);
						this.#updateEstimatedItemHeight();
						this.#scrollToPendingDate();
					},
				},
				new BlinkView({
					ref: (ref) => this.blinkRefs.set(dateKey, ref),
					highlightColor: Color.accentSoftOrange3.toHex(),
					slot: () => new WorkDayItem({
						key: dateKey,
						item: day,
						showBorder: index !== total - 1,
						typeId: day.typeId,
						userId: this.props.userId,
						parentWidget: this.props.layout,
					}),
				}),
			);
		}

		scrollToDate(timestamp)
		{
			return this.#scrollToDate(timestamp, false);
		}

		#scrollToPendingDate()
		{
			const { scrollToTimestamp } = this.props;
			if (!scrollToTimestamp)
			{
				return;
			}

			this.#scrollToDate(scrollToTimestamp, true);
		}

		#scrollToDate(timestamp, skipIfAlreadyScrolled)
		{
			const dateKey = this.#getDateKey(timestamp);
			if (skipIfAlreadyScrolled && this.scrolledDateKey === dateKey)
			{
				return true;
			}

			const blinkRef = this.blinkRefs.get(dateKey);
			const scrollPosition = this.#getScrollPosition(dateKey);

			if (!blinkRef || !this.scrollViewRef || !scrollPosition)
			{
				return false;
			}

			this.scrollViewRef.scrollTo({ y: scrollPosition.offset, animated: true });
			if (!scrollPosition.exact)
			{
				return false;
			}

			this.scrolledDateKey = dateKey;
			setTimeout(() => {
				blinkRef.blink();
			}, BLINK_DELAY);

			this.props.onDateScrolled?.(timestamp);

			return true;
		}

		#getScrollPosition(dateKey)
		{
			let offset = 0;
			let usedEstimatedHeight = false;

			for (const dayKey of this.dayKeys)
			{
				if (dayKey === dateKey)
				{
					return {
						offset: this.#prepareScrollOffset(offset, usedEstimatedHeight),
						exact: !usedEstimatedHeight,
					};
				}

				const height = this.itemHeights.get(dayKey);
				if (height === undefined)
				{
					offset += this.estimatedItemHeight;
					usedEstimatedHeight = true;
					continue;
				}

				offset += height;
			}

			return undefined;
		}

		#prepareScrollOffset(offset, usedEstimatedHeight)
		{
			return usedEstimatedHeight
				? Math.max(0, offset - this.estimatedItemHeight * ESTIMATED_SCROLL_CONTEXT_ROWS)
				: offset;
		}

		#updateEstimatedItemHeight()
		{
			const heights = [...this.itemHeights.values()].filter((height) => height > 0);
			if (heights.length === 0)
			{
				return;
			}

			this.estimatedItemHeight = heights.reduce((sum, height) => sum + height, 0) / heights.length;
		}

		#getDateKey(timestamp)
		{
			const date = new Moment(timestamp).date;
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, '0');
			const day = String(date.getDate()).padStart(2, '0');

			return `${year}-${month}-${day}`;
		}

		#buildMonthDays()
		{
			const { dayMap } = this.props;
			const days = [];

			dayMap.forEach(({ dayType, records, reports }, dateKey) => {
				if (!dayType)
				{
					return;
				}

				days.push({
					id: dateKey,
					timestamp: new Date(dateKey).getTime(),
					dayColor: dayType?.color || null,
					records,
					reports,
					typeId: dayType?.id || null,
				});
			});

			return days;
		}
	}

	module.exports = { WorkDaysList };
});
