/**
 * @module layout/ui/reaction-list
 */
jn.define('layout/ui/reaction-list', (require, exports, module) => {
	const { UserList } = require('layout/ui/reaction-list/user-list');
	const { ReactionPanel, ReduxReactionPanel } = require('layout/ui/reaction-list/tab-panel');
	const { BottomSheet } = require('bottom-sheet');
	const { Color } = require('tokens');

	class ReactionList extends LayoutComponent
	{
		static constants = Object.freeze({
			ALL: 'all',
		});

		constructor(props)
		{
			super(props);

			this.state = {
				selectedReactionTab: ReactionList.constants.ALL,
			};
		}

		/**
		 * @param {number} entityId
		 * @param {string} entityType
		 * @param {string} voteSignToken
		 * @param {boolean} withRedux
		 * @param {Array} [reactions]
		 * @param {number} [backdropMediumPositionPercent]
		 */
		static open({
			entityId,
			entityType,
			voteSignToken,
			reactions = [],
			withRedux,
			backdropMediumPositionPercent = 50,
		})
		{
			const props = {
				entityType,
				entityId,
				voteSignToken,
				reactions: withRedux ?? reactions,
				withRedux,
			};

			return this.#openBottomSheet(this, props, backdropMediumPositionPercent);
		}

		static #openBottomSheet(ComponentClass, props, mediumPositionPercent)
		{
			void new BottomSheet({
				component: (layout) => {
					return new ComponentClass({
						layout,
						...props,
					});
				},
			})
				.setBackgroundColor(Color.bgSecondary.toHex())
				.enableResizeContent()
				.disableHorizontalSwipe()
				.setMediumPositionPercent(mediumPositionPercent)
				.disableOnlyMediumPosition()
				.open();
		}

		componentDidMount()
		{
			BX.addCustomEvent('ReactionTabsEvent', (activeTab) => {
				this.setState({ selectedReactionTab: activeTab });
			});
		}

		render()
		{
			const { entityType, entityId, voteSignToken, withRedux, layout } = this.props;

			return View(
				{
					style: {
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'flex-start',
					},
				},
				this.renderScrollPanel(),
				new UserList({
					entityType,
					entityId,
					voteSignToken,
					withRedux,
					layout,
					selectedTab: this.state.selectedReactionTab,
				}),
			);
		}

		renderScrollPanel()
		{
			const { entityType, entityId, withRedux, reactions } = this.props;

			if (withRedux)
			{
				return ReduxReactionPanel({
					entityType,
					entityId,
				});
			}

			return ReactionPanel({
				reactions,
			});
		}
	}

	module.exports = {
		ReactionList,
	};
});
