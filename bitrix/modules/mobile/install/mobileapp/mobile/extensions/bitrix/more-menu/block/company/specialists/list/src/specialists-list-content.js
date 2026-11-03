/**
 * @module more-menu/block/company/specialists/list/src/specialists-list-content
 */
jn.define('more-menu/block/company/specialists/list/src/specialists-list-content', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');

	/**
	 * Bottom-sheet content for the specialists list. Shows a loader while the owner fetches the list
	 * data on mount, then renders the list once it resolves. On a load error it delegates to the
	 * owner, which closes the sheet and surfaces a toast instead of leaving a half-empty list.
	 *
	 * @class SpecialistsListContent
	 */
	class SpecialistsListContent extends PureComponent
	{
		constructor(props)
		{
			super(props);

			this.state = { loading: true };
		}

		componentDidMount()
		{
			this.props.load()
				.then(() => this.setState({ loading: false }))
				.catch(() => this.props.onLoadError());
		}

		render()
		{
			return View(
				{ style: { flex: 1 } },
				this.state.loading
					? this.props.renderLoader()
					: this.props.renderList(),
			);
		}
	}

	module.exports = { SpecialistsListContent };
});
