/**
 * @module mail/simple-list/items/src/item-registry
 */
jn.define('mail/simple-list/items/src/item-registry', (require, exports, module) => {
	class ListItemRegistry
	{
		constructor()
		{
			this.constructors = new Map();
		}

		register(type, ItemConstructor)
		{
			if (!this.constructors.has(type))
			{
				this.constructors.set(type, ItemConstructor);
			}
		}

		create(type, props)
		{
			const ItemConstructor = this.constructors.get(type);

			return ItemConstructor ? new ItemConstructor(props) : null;
		}
	}

	const listItemRegistry = new ListItemRegistry();

	module.exports = { ListItemRegistry, listItemRegistry };
});
