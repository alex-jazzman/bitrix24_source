(function() {
	'use strict';

	BX.namespace('BX.Main');

	BX.Main.dropdownManager = {
		dropdownClass: 'main-dropdown',
		data: {},
		init()
		{
			const self = this;
			let result;
			let onLoadItems;
			let items;

			// A dropdown is built on demand, at the first event that reaches it. The pointer is
			// not the only way in: a keyboard user activates the control with Enter, Space or
			// an arrow, and without this branch no instance would ever be created for them —
			// so the menu, its navigation and the whole keyboard path would simply not exist.
			const ensureInstance = (target) => {
				if (!BX.hasClass(target, this.dropdownClass))
				{
					return null;
				}

				const existing = this.getById(target.id);

				if (existing && existing.dropdown === target)
				{
					self.push(target.id, existing);

					return existing;
				}

				const created = new BX.Main.dropdown(target);
				self.push(target.id, created);

				return created;
			};

			BX.bind(document, 'click', BX.delegate(function(event) {
				if (BX.hasClass(event.target, this.dropdownClass))
				{
					event.preventDefault();
					ensureInstance(event.target);
				}
			}, this));

			BX.bind(document, 'keydown', BX.delegate(function(event) {
				const isActivation = event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar';
				const isArrow = event.key === 'ArrowDown' || event.key === 'ArrowUp';

				if (!isActivation && !isArrow)
				{
					return;
				}

				if (!BX.hasClass(event.target, this.dropdownClass))
				{
					return;
				}

				const instance = ensureInstance(event.target);

				// The instance binds its own keydown handler, but only from now on: the very
				// key that created it has already passed that element by, so the opening it
				// asked for is carried out here.
				if (instance)
				{
					event.preventDefault();
					instance.openWithKeyboard(event.key);
				}
			}, this));

			onLoadItems = BX.Grid.Utils.getByClass(document.body, this.dropdownClass);

			if (BX.type.isArray(onLoadItems))
			{
				onLoadItems.forEach((current) => {
					result = self.getById(current.id);
					try
					{
						items = eval(BX.data(current, 'items'));
					}
					catch
					{}

					BX.onCustomEvent(window, 'Dropdown::load', [current.id, {}, null, BX.type.isArray(items) && items.length > 0 ? items[0] : [], BX.data(current, 'value')]);
				});
			}
		},

		push(id, instance)
		{
			this.data[id] = instance;
		},

		getById(id)
		{
			return (id in this.data) ? this.data[id] : null;
		},
	};
})();
