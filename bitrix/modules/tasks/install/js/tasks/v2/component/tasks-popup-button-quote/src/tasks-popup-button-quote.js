import { Runtime, Event } from 'main.core';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { TasksPopup } from 'tasks.v2.component.tasks-popup';

import {
	type TypePropsGetDataSelection,
	type TypeDataSelection,
	type TypeDataQuote,
	type TypeAction,
} from './types.js';
import './tasks-popup-button-quote.css';

export type { TypeDataQuote };

export const TYPES_DEFAULT_QUOTE_ACTIONS = {
	MESSAGE: 'TYPE_DEFAULT_QUOTE_ACTION_MESSAGE',
};

const getDataSelection = (props: TypePropsGetDataSelection): TypeDataSelection | null => {
	const {
		nodeAnchor,
		eventStart,
		eventFinish,
	} = props;

	const sel = window.getSelection();
	if (!sel.rangeCount)
	{
		return null;
	}

	let range = sel.getRangeAt(0).cloneRange();
	const direction = sel.direction;
	const isSelectionBackward = direction === 'backward';

	let isSelectionResultOnlyInside = true;
	const nodeParent = range.commonAncestorContainer;
	if (nodeParent)
	{
		const childrenOfSameParent = nodeParent.childNodes;
		for (let i = 0; i < childrenOfSameParent.length; i++)
		{
			const child = childrenOfSameParent[i];
			const isSelf = (child === nodeAnchor) || child.contains(nodeAnchor) || nodeAnchor.contains(child);
			if (!isSelf)
			{
				const isIntersectingSibling = range.intersectsNode(child);
				if (isIntersectingSibling)
				{
					isSelectionResultOnlyInside = false;
				}
			}
		}
	}
	else
	{
		isSelectionResultOnlyInside = false;
	}

	const isSelectionStartInsideAnchor = nodeAnchor.contains(eventStart.target);
	const isSelectionFinishInsideAnchor = nodeAnchor.contains(eventFinish.target);
	if (!(isSelectionStartInsideAnchor && isSelectionFinishInsideAnchor) && !isSelectionResultOnlyInside)
	{
		const rangeFresh = sel.getRangeAt(0).cloneRange();
		if (isSelectionStartInsideAnchor)
		{
			if (isSelectionBackward)
			{
				const endNode = rangeFresh.endContainer;
				const endOffset = rangeFresh.endOffset;
				rangeFresh.selectNode(nodeAnchor);
				rangeFresh.setEnd(endNode, endOffset);
			}
			else
			{
				const startNode = rangeFresh.startContainer;
				const startOffset = rangeFresh.startOffset;
				rangeFresh.selectNode(nodeAnchor);
				rangeFresh.setStart(startNode, startOffset);
			}
		}
		else if (isSelectionFinishInsideAnchor)
		{
			if (isSelectionBackward)
			{
				const startNode = rangeFresh.startContainer;
				const startOffset = rangeFresh.startOffset;
				rangeFresh.selectNode(nodeAnchor);
				rangeFresh.setStart(startNode, startOffset);
			}
			else
			{
				const endNode = rangeFresh.endContainer;
				const endOffset = rangeFresh.endOffset;
				rangeFresh.selectNode(nodeAnchor);
				rangeFresh.setEnd(endNode, endOffset);
			}
		}
		else
		{
			rangeFresh.selectNode(nodeAnchor);
		}
		sel.removeAllRanges();
		sel.addRange(rangeFresh);
		const rangeCut = sel.getRangeAt(0).cloneRange();
		range = rangeCut;
	}

	if (!range.getClientRects)
	{
		return null;
	}

	const quoteRaw = sel.toString();
	const quote = quoteRaw?.trim();
	if (!quote)
	{
		return null;
	}

	const isEndedOnText = isSelectionBackward
		? range.startContainer.nodeType === Node.TEXT_NODE
		: range.endContainer.nodeType === Node.TEXT_NODE;
	if (isEndedOnText && isSelectionFinishInsideAnchor)
	{
		range.collapse(isSelectionBackward); // pass "true" to get start coordinates
	}

	const rects = range.getClientRects();
	if (rects.length <= 0)
	{
		return null;
	}

	const rectNumberToOrientate = isSelectionBackward ? 0 : (rects.length - 1);
	const rect = rects[rectNumberToOrientate];
	const pageX = (isSelectionBackward || !isEndedOnText) ? rect.x : (rect.x + rect.width);
	const pageY = rect.y;
	const coordsSelection = {
		pageX,
		pageY,
	};

	const dataSelection = {
		coordsSelection,
		quote,
	};

	return dataSelection;
};

// @vue/component
export const TasksPopupButtonQuote = {
	name: 'TasksPopupButtonQuote',
	components: {
		BIcon,
		TasksPopup,
	},
	props: {
		isQuoteTrimmed: {
			type: Boolean,
			default: false,
		},
		elementAnchor: {
			type: Object,
			required: true,
		},
		elementScrollContainer: {
			type: Object,
			default: null,
		},
		actions: {
			/** @type [TypeAction] */
			type: Object,
			required: true,
		},
	},
	emits: [
		'click',
		'close',
	],
	setup(): {}
	{
		return {
			Outline,
		};
	},
	data(): Object
	{
		return {
			isOpened: false,
			eventStart: null,
			eventFinish: null,
			coordsEvent: {},
			quote: '',
		};
	},
	computed: {
		actionDefaultMessage(): boolean
		{
			return {
				type: TYPES_DEFAULT_QUOTE_ACTIONS.MESSAGE,
				icon: Outline.QUOTE,
			};
		},
		actionsDefault(): boolean
		{
			const actionsDefaultNew = [];
			actionsDefaultNew.push(this.actionDefaultMessage);

			return actionsDefaultNew;
		},
		optionsPopup(): boolean
		{
			const elementAnchor = this.elementAnchor;
			const elementScrollContainer = this.elementScrollContainer;
			const rectAnchor = elementAnchor.getBoundingClientRect();
			const rectAnchorLeft = rectAnchor.left;
			const rectAnchorTop = rectAnchor.top;
			const offsetForTail = 5;
			const offsetHorizontal = Number(this.coordsEvent.pageX) - rectAnchorLeft;
			const offsetVertical = (Number(this.coordsEvent.pageY - rectAnchorTop) * -1) + offsetForTail;
			const optionsPopupNew = {
				isWithBG: true,
				isWithPointer: true,
				id: 'popup-button-quote-task',
				className: 'tasks-popup-button-quote',
				positioning: {
					elementAnchor,
					elementScrollContainer,
					offsetHorizontal,
					offsetVertical,
					isCenteredHorizontally: true,
					isOpenedUp: true,
					isFlippingBlockedVertical: true,
				},
			};

			return optionsPopupNew;
		},
		actionsMerged(): boolean
		{
			const actionsRaw = this.actions;
			const actionsNew = actionsRaw.map(actionRaw => {
				const actionDefaultSame = this.actionsDefault.find(actionDefault => (
					actionDefault.type === actionRaw.type
				));
				const actionMerged = {
					...actionDefaultSame,
					...actionRaw,
				};

				return actionMerged;
			});

			return actionsNew;
		},
	},
	mounted(): void
	{
		this.addHandlerSelectionStart();
	},
	beforeUnmount(): void
	{
		this.removeHandlerSelectionStart();
	},
	methods: {
		async pasteQuoteInMessage(dataQuoteMessage): void
		{
			const { quote, chatId } = dataQuoteMessage;
			const optionsQuote = {};
			const { Messenger } = await Runtime.loadExtension('im.public');
			Messenger?.textarea.insertQuote(chatId, quote, optionsQuote);
		},
		processSelection(): void
		{
			// waiting for selection event to get calculated
			setTimeout(() => {
				const selection = window.getSelection();
				const textSelected = selection?.toString();
				const textSelectedTrimmed = textSelected?.trim();
				if (textSelectedTrimmed)
				{
					const sel = window.getSelection();

					if (!sel.rangeCount)
					{
						return;
					}

					const rangeFresh = sel.getRangeAt(0).cloneRange();
					const isIntersectingAnchor = rangeFresh.intersectsNode(this.elementAnchor);

					if (!isIntersectingAnchor)
					{
						return;
					}

					const propsCoordsSelection = {
						nodeAnchor: this.elementAnchor,
						eventStart: this.eventStart,
						eventFinish: this.eventFinish,
					};
					const dataSelection = getDataSelection(propsCoordsSelection);
					if (!dataSelection)
					{
						return;
					}
					const coordsSelection = dataSelection.coordsSelection;
					const coordsMouseUp = {
						pageX: this.eventFinish.pageX,
						pageY: this.eventFinish.pageY,
					};
					const coords = coordsSelection || coordsMouseUp;
					this.coordsEvent = coords;

					const quoteRaw = dataSelection.quote;
					const quote = this.isQuoteTrimmed ? quoteRaw.trim() : quoteRaw;
					this.quote = quote;

					this.isOpened = true;
				}
			}, 0);
		},
		handleSelectionStart(event): void
		{
			this.eventStart = event;
			this.isOpened = false;
			this.quote = '';
			this.removeHandlerSelectionFinish();
			this.addHandlerSelectionFinish();
		},
		handleSelectionFinish(event): void
		{
			this.eventFinish = event;
			this.removeHandlerSelectionFinish();
			this.processSelection();
		},
		handleClickButton(action: TypeAction): void
		{
			event.stopPropagation();

			const {
				type,
				chatId,
				isClosingPrevented,
			} = action;

			const dataQuote: TypeDataQuote = {
				event,
				type,
				quote: this.quote,
			};

			this.$emit('click', dataQuote);

			if (type === TYPES_DEFAULT_QUOTE_ACTIONS.MESSAGE)
			{
				const dataQuoteMessage = {
					quote: this.quote,
					chatId,
				};
				this.pasteQuoteInMessage(dataQuoteMessage);
			}

			if (!isClosingPrevented)
			{
				this.isOpened = false;
			}
		},
		handleClosePopup(): void
		{
			this.$emit('close');
			this.isOpened = false;
		},
		addHandlerSelectionFinish(): void
		{
			Event.bind(document, 'mouseup', this.handleSelectionFinish);
		},
		removeHandlerSelectionFinish(): void
		{
			Event.unbind(document, 'mouseup', this.handleSelectionFinish);
		},
		addHandlerSelectionStart(): void
		{
			this.elementAnchor && Event.bind(document, 'selectstart', this.handleSelectionStart);
		},
		removeHandlerSelectionStart(): void
		{
			this.elementAnchor && Event.unbind(document, 'selectstart', this.handleSelectionStart);
		},
	},
	template: `
		<TasksPopup
			v-if="isOpened"
			:options="optionsPopup"
			@close="handleClosePopup"
		>
			<ul class="tasks-popup-button-quote__actions-list">
				<li
					v-for="action in actionsMerged"
					class="tasks-popup-button-quote__actions-item"
				>
					<button
						class="tasks-popup-button-quote__action"
						@click="handleClickButton(action)"
					>
						<div class="tasks-popup-button-quote__action-bg"></div>
						<div class="tasks-popup-button-quote__action-content">
							<BIcon class="tasks-popup-button-quote__action-icon" :name="action.icon" />
						</div>
					</button>
				</li>
			</ul>
		</TasksPopup>
	`,
};
