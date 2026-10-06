import { describe, it, beforeEach, afterEach, before } from 'mocha';
import { assert } from 'chai';

import { FloatingNodePanel } from '../../src/floating-node-panel';

// minimal stub of BX.Landing.UI.Collection.FormCollection global (BasePanel dependency)
class FormCollectionStub extends Array
{}

function fireMouseEvent(element: HTMLElement, type: string, relatedTarget: EventTarget | null = null): void
{
	element.dispatchEvent(new MouseEvent(type, { bubbles: false, relatedTarget }));
}

describe('Landing.UI.Panel.FloatingNodePanel', () => {
	let targetNode: HTMLElement;
	let panel: FloatingNodePanel;
	let firstButtonClicks: MouseEvent[];
	let secondButtonClicks: MouseEvent[];

	before(() => {
		// BasePanel constructor relies on globals provided
		// by the legacy landing_master bundle in the real editor
		const globalScope: any = window;
		const bx = globalScope.BX ?? (globalScope.BX = {});
		const landingNamespace = bx.Landing ?? (bx.Landing = {});
		const uiNamespace = landingNamespace.UI ?? (landingNamespace.UI = {});
		const collectionNamespace = uiNamespace.Collection ?? (uiNamespace.Collection = {});
		collectionNamespace.FormCollection = collectionNamespace.FormCollection ?? FormCollectionStub;
	});

	beforeEach(() => {
		targetNode = document.createElement('div');
		document.body.appendChild(targetNode);

		firstButtonClicks = [];
		secondButtonClicks = [];

		panel = new FloatingNodePanel({
			buttons: [
				{
					id: 'first',
					iconClass: '--file-upload',
					title: 'First',
					onClick: (event) => firstButtonClicks.push(event),
				},
				{
					id: 'second',
					iconClass: '--trash-bin',
					title: 'Second',
					onClick: (event) => secondButtonClicks.push(event),
				},
			],
		});
	});

	afterEach(() => {
		panel.detach();
		targetNode.remove();
	});

	it('should render provided buttons', () => {
		const buttons = panel.layout.querySelectorAll('.landing-ui-panel-floating-node__button');

		assert.equal(buttons.length, 2);
		assert.equal(buttons[0].dataset.id, 'first');
		assert.equal(buttons[1].dataset.id, 'second');
	});

	it('should be hidden and detached from DOM before attach', () => {
		assert.isFalse(panel.isShown());
		assert.isNull(panel.layout.parentElement);
	});

	it('should append layout to the target node document on attach', () => {
		panel.attach(targetNode);

		assert.equal(panel.layout.parentElement, document.body);
		assert.isFalse(panel.isShown());
	});

	it('should show on target node mouseenter', () => {
		panel.attach(targetNode);

		fireMouseEvent(targetNode, 'mouseenter');

		assert.isTrue(panel.isShown());
	});

	it('should hide immediately on target node mouseleave', () => {
		panel.attach(targetNode);
		fireMouseEvent(targetNode, 'mouseenter');

		fireMouseEvent(targetNode, 'mouseleave', document.body);

		assert.isFalse(panel.isShown());
	});

	it('should hide when cursor leaves the window (relatedTarget is null)', () => {
		panel.attach(targetNode);
		fireMouseEvent(targetNode, 'mouseenter');

		fireMouseEvent(targetNode, 'mouseleave', null);

		assert.isFalse(panel.isShown());
	});

	it('should stay shown when cursor moves from node to panel', () => {
		panel.attach(targetNode);
		fireMouseEvent(targetNode, 'mouseenter');

		const button: HTMLElement = panel.layout.querySelector('[data-id="first"]');
		fireMouseEvent(targetNode, 'mouseleave', button);

		assert.isTrue(panel.isShown());
	});

	it('should stay shown when cursor moves from panel back to node', () => {
		panel.attach(targetNode);
		fireMouseEvent(targetNode, 'mouseenter');

		fireMouseEvent(panel.layout, 'mouseleave', targetNode);

		assert.isTrue(panel.isShown());
	});

	it('should hide immediately when cursor leaves the panel not onto the node', () => {
		panel.attach(targetNode);
		fireMouseEvent(targetNode, 'mouseenter');

		fireMouseEvent(targetNode, 'mouseleave', panel.layout);
		fireMouseEvent(panel.layout, 'mouseleave', document.body);

		assert.isFalse(panel.isShown());
	});

	it('should hide on Escape keydown when shown', () => {
		panel.attach(targetNode);
		fireMouseEvent(targetNode, 'mouseenter');
		assert.isTrue(panel.isShown());

		document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

		assert.isFalse(panel.isShown());
	});

	it('should ignore non-Escape keydown', () => {
		panel.attach(targetNode);
		fireMouseEvent(targetNode, 'mouseenter');

		document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

		assert.isTrue(panel.isShown());
	});

	it('should stop reacting on Escape after detach', () => {
		panel.attach(targetNode);
		fireMouseEvent(targetNode, 'mouseenter');
		panel.detach();

		document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

		// the document keydown listener is released on detach:
		// the shown-state class must stay intact after Escape
		assert.isTrue(panel.isShown());
		assert.isNull(panel.layout.parentElement);
	});

	it('should call provided onClick handler on button click', () => {
		panel.attach(targetNode);
		fireMouseEvent(targetNode, 'mouseenter');

		const button: HTMLElement = panel.layout.querySelector('[data-id="second"]');
		button.click();

		assert.equal(secondButtonClicks.length, 1);
		assert.equal(firstButtonClicks.length, 0);
	});

	it('should stop reacting on hover after detach', () => {
		panel.attach(targetNode);
		panel.detach();

		fireMouseEvent(targetNode, 'mouseenter');

		assert.isFalse(panel.isShown());
		assert.isNull(panel.layout.parentElement);
	});

	it('should render no buttons when the buttons option is empty', () => {
		const emptyPanel = new FloatingNodePanel({ buttons: [] });

		assert.equal(emptyPanel.layout.querySelectorAll('.landing-ui-panel-floating-node__button').length, 0);
	});

	it('should ignore attach of a non-DOM value', () => {
		panel.attach(null);

		assert.isNull(panel.layout.parentElement);

		fireMouseEvent(targetNode, 'mouseenter');
		assert.isFalse(panel.isShown());
	});

	it('should be a no-op to detach a never attached panel', () => {
		assert.doesNotThrow(() => panel.detach());
		assert.isNull(panel.layout.parentElement);
	});

	it('should release the previous node on re-attach', () => {
		const secondNode = document.createElement('div');
		document.body.appendChild(secondNode);

		panel.attach(targetNode);
		panel.attach(secondNode);

		fireMouseEvent(targetNode, 'mouseenter');
		assert.isFalse(panel.isShown(), 'previous node must not control the panel');

		fireMouseEvent(secondNode, 'mouseenter');
		assert.isTrue(panel.isShown(), 'new node must control the panel');

		secondNode.remove();
	});

	it('should ignore Escape while the panel is hidden', () => {
		panel.attach(targetNode);

		assert.doesNotThrow(() => {
			document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
		});
		assert.isFalse(panel.isShown());
	});

	it('should prevent default and stop propagation of the button click', () => {
		panel.attach(targetNode);
		fireMouseEvent(targetNode, 'mouseenter');

		let documentClicks = 0;
		const onDocumentClick = (): void => {
			documentClicks++;
		};
		document.addEventListener('click', onDocumentClick);

		try
		{
			const button: HTMLElement = panel.layout.querySelector('[data-id="first"]');
			button.click();
		}
		finally
		{
			document.removeEventListener('click', onDocumentClick);
		}

		assert.equal(firstButtonClicks.length, 1);
		assert.isTrue(firstButtonClicks[0].defaultPrevented, 'click must be prevented');
		assert.equal(documentClicks, 0, 'click must not bubble outside the panel');
	});

	it('should stick to the top right corner of a wide node', () => {
		targetNode.style.cssText = 'position: absolute; top: 100px; left: 100px; width: 400px; height: 150px;';
		panel.attach(targetNode);

		fireMouseEvent(targetNode, 'mouseenter');

		const panelWidth = panel.layout.getBoundingClientRect().width;
		// PANEL_INSET = 12: top = nodeTop + 12, left = nodeRight - panelWidth - 12
		assert.equal(panel.layout.style.top, '112px');
		assert.equal(panel.layout.style.left, `${(100 + 400) - panelWidth - 12}px`);
	});

	it('should not overflow a node narrower than the panel to the left', () => {
		targetNode.style.cssText = 'position: absolute; top: 100px; left: 100px; width: 10px; height: 50px;';
		panel.attach(targetNode);

		fireMouseEvent(targetNode, 'mouseenter');

		// right-corner position would be to the left of the node itself:
		// Math.max keeps the panel at nodeLeft + PANEL_INSET
		assert.equal(panel.layout.style.left, '112px');
	});

	it('should work with a target node inside an iframe document', () => {
		const iframe = document.createElement('iframe');
		document.body.appendChild(iframe);

		try
		{
			const innerDocument = iframe.contentDocument;
			const innerNode = innerDocument.createElement('div');
			innerDocument.body.appendChild(innerNode);

			panel.attach(innerNode);
			assert.equal(panel.layout.parentElement, innerDocument.body, 'panel must live in the node document');

			fireMouseEvent(innerNode, 'mouseenter');
			assert.isTrue(panel.isShown());

			// Escape listener must be bound to the iframe document, not the top one
			innerDocument.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
			assert.isFalse(panel.isShown());

			panel.detach();
		}
		finally
		{
			iframe.remove();
		}
	});

	it('should keep the same position when the node is scaled by css transform', () => {
		targetNode.style.cssText = 'position: absolute; top: 100px; left: 100px; width: 200px; height: 150px;';
		panel.attach(targetNode);

		fireMouseEvent(targetNode, 'mouseenter');
		const topWithoutTransform = panel.layout.style.top;
		const leftWithoutTransform = panel.layout.style.left;
		assert.isNotEmpty(topWithoutTransform);
		assert.isNotEmpty(leftWithoutTransform);

		// hover:scale mid-animation state must not move the panel
		targetNode.style.transform = 'scale(1.05)';
		fireMouseEvent(targetNode, 'mouseenter');

		assert.equal(panel.layout.style.top, topWithoutTransform);
		assert.equal(panel.layout.style.left, leftWithoutTransform);
	});
});
