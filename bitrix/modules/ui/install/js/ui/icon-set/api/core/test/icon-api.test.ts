import { Icon, IconHoverMode, Actions, Disk } from '../src/index';

describe('Icon class API', () => {
	it('should create icon with valid params', () => {
		const icon = new Icon({ icon: Actions.ARROW_RIGHT });
		const el = icon.render();
		assert.ok(el instanceof HTMLElement);
		assert.ok(el.classList.contains('ui-icon-set'));
		assert.ok(el.classList.contains('--arrow-right'));
	});

	it('should throw on invalid icon name', () => {
		assert.throws(() => {
			new Icon({ icon: 'nonexistent-icon-xyz' });
		});
	});

	it('should validate via static isValid', () => {
		assert.ok(Icon.isValid({ icon: Actions.ARROW_RIGHT }));
		assert.ok(!Icon.isValid({ icon: 'nonexistent-icon-xyz' }));
	});

	it('should set size via inline style', () => {
		const icon = new Icon({ icon: Actions.ARROW_RIGHT, size: 32 });
		const el = icon.render();
		assert.ok(el.style.getPropertyValue('--ui-icon-set__icon-size').includes('32'));
	});

	it('should set color', () => {
		const icon = new Icon({ icon: Actions.ARROW_RIGHT });
		icon.render();
		icon.setColor('red');
		assert.equal(icon.iconElement.style.getPropertyValue('--ui-icon-set__icon-color'), 'red');
	});

	it('should set hover mode DEFAULT', () => {
		const icon = new Icon({ icon: Actions.ARROW_RIGHT, hoverMode: IconHoverMode.DEFAULT });
		const el = icon.render();
		assert.ok(el.classList.contains('--hoverable-default'));
	});

	it('should set hover mode ALT', () => {
		const icon = new Icon({ icon: Actions.ARROW_RIGHT, hoverMode: IconHoverMode.ALT });
		const el = icon.render();
		assert.ok(el.classList.contains('--hoverable-alt'));
	});

	it('should apply fixed-color for Disk icons', () => {
		const icon = new Icon({ icon: Disk.DOC });
		const el = icon.render();
		assert.ok(el.classList.contains('--fixed-color'));
	});

	it('should not apply fixed-color for non-Disk icons', () => {
		const icon = new Icon({ icon: Actions.ARROW_RIGHT });
		const el = icon.render();
		assert.ok(!el.classList.contains('--fixed-color'));
	});

	it('should renderTo a node', () => {
		const container = document.createElement('div');
		const icon = new Icon({ icon: Actions.ARROW_RIGHT });
		icon.renderTo(container);
		assert.equal(container.children.length, 1);
		assert.ok(container.children[0].classList.contains('ui-icon-set'));
	});
});
