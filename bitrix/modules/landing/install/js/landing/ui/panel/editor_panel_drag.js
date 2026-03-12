;(function() {
	'use strict';

	BX.namespace('BX.Landing.UI.Panel');

	const Dom = BX.Dom;
	const Event = BX.Event;
	const DomWriter = BX.DOM;
	const Type = BX.Type;

	function getOwnerWindow(element)
	{
		return element && element.ownerDocument ? element.ownerDocument.defaultView : null;
	}

	function supportsPointerEvents(element)
	{
		const ownerWindow = getOwnerWindow(element);

		return Boolean(ownerWindow && ownerWindow.PointerEvent);
	}

	function getPointerPosition(event, ownerWindow, isFixedPosition)
	{
		const win = ownerWindow || window;
		const scrollX = win.scrollX || 0;
		const scrollY = win.scrollY || 0;
		const pageX = ('pageX' in event) ? event.pageX : (event.clientX + scrollX);
		const pageY = ('pageY' in event) ? event.pageY : (event.clientY + scrollY);

		return {
			x: isFixedPosition ? event.clientX : pageX,
			y: isFixedPosition ? event.clientY : pageY,
		};
	}

	function applyPanelPosition(editor, topValue, leftValue)
	{
		DomWriter.write(() => {
			Dom.removeClass(editor.layout, 'landing-ui-transition');
			Dom.style(editor.layout, { top: `${topValue}px`, left: `${leftValue}px` });
		});
	}

	function isPrimaryPointer(event)
	{
		return event.button === undefined || event.button === 0;
	}

	function createDragState()
	{
		return {
			dragging: false,
			offsetX: 0,
			offsetY: 0,
			ownerWindow: null,
			isFixedPosition: false,
		};
	}

	function trySetPointerCapture(layout, event)
	{
		if (!layout.setPointerCapture)
		{
			return;
		}

		try
		{
			layout.setPointerCapture(event.pointerId);
		}
		catch
		{
			// ignore
		}
	}

	function tryReleasePointerCapture(layout, event)
	{
		if (!layout.releasePointerCapture)
		{
			return;
		}

		try
		{
			layout.releasePointerCapture(event.pointerId);
		}
		catch
		{
			// ignore
		}
	}

	function bindWindowPointerEvents(ownerWindow, handlers)
	{
		if (!ownerWindow)
		{
			return;
		}

		Event.bind(ownerWindow, 'pointermove', handlers.onPointerMove, true);
		Event.bind(ownerWindow, 'pointerup', handlers.onPointerUp, true);
		Event.bind(ownerWindow, 'pointercancel', handlers.onPointerUp, true);
	}

	function unbindWindowPointerEvents(ownerWindow, handlers)
	{
		if (!ownerWindow)
		{
			return;
		}

		Event.unbind(ownerWindow, 'pointermove', handlers.onPointerMove, true);
		Event.unbind(ownerWindow, 'pointerup', handlers.onPointerUp, true);
		Event.unbind(ownerWindow, 'pointercancel', handlers.onPointerUp, true);
	}

	function getPointerOffsets(editor, ownerWindow, event)
	{
		const panelRect = editor.layout.getBoundingClientRect();
		const isFixedPosition = ownerWindow.getComputedStyle(editor.layout).position === 'fixed';
		const scrollX = ownerWindow.scrollX || 0;
		const scrollY = ownerWindow.scrollY || 0;
		const baseLeft = isFixedPosition ? panelRect.left : panelRect.left + scrollX;
		const baseTop = isFixedPosition ? panelRect.top : panelRect.top + scrollY;
		const pointerPosition = getPointerPosition(event, ownerWindow, isFixedPosition);

		return {
			isFixedPosition,
			offsetX: pointerPosition.x - baseLeft,
			offsetY: pointerPosition.y - baseTop,
		};
	}

	function handlePointerMove(event, editor, dragState)
	{
		if (!dragState.dragging)
		{
			return;
		}

		const pointerPosition = getPointerPosition(event, dragState.ownerWindow, dragState.isFixedPosition);
		applyPanelPosition(editor, pointerPosition.y - dragState.offsetY, pointerPosition.x - dragState.offsetX);
	}

	function endPointerDrag(dragState, event, editor, dragButton, pointerHandlers)
	{
		if (!dragState.dragging)
		{
			return dragState;
		}

		unbindWindowPointerEvents(dragState.ownerWindow, pointerHandlers);
		tryReleasePointerCapture(dragButton.layout, event);
		Dom.addClass(editor.layout, 'landing-ui-transition');

		return { ...dragState, dragging: false };
	}

	function beginPointerDrag(dragState, event, editor, dragButton, pointerHandlers)
	{
		if (!isPrimaryPointer(event))
		{
			return dragState;
		}

		const ownerWindow = getOwnerWindow(dragButton.layout) || window;
		const pointerOffsets = getPointerOffsets(editor, ownerWindow, event);
		const nextState = {
			...dragState,
			ownerWindow,
			isFixedPosition: pointerOffsets.isFixedPosition,
			offsetX: pointerOffsets.offsetX,
			offsetY: pointerOffsets.offsetY,
			dragging: true,
		};

		trySetPointerCapture(dragButton.layout, event);
		bindWindowPointerEvents(ownerWindow, pointerHandlers);
		if (editor && Type.isFunction(editor.emit))
		{
			editor.emit('onButtonClick', { event });
		}
		event.preventDefault();

		return nextState;
	}

	function attachPointerDrag(editor, dragButton)
	{
		let dragState = createDragState();
		const pointerHandlers = {
			onPointerMove: (event) => handlePointerMove(event, editor, dragState),
			onPointerUp: (event) => {
				dragState = endPointerDrag(dragState, event, editor, dragButton, pointerHandlers);
			},
			onPointerDown: (event) => {
				dragState = beginPointerDrag(dragState, event, editor, dragButton, pointerHandlers);
			},
		};

		Event.bind(dragButton.layout, 'pointerdown', pointerHandlers.onPointerDown);
	}

	BX.Landing.UI.Panel.EditorPanelDrag = {
		supportsPointerEvents,
		attachPointerDrag,
	};
})();
