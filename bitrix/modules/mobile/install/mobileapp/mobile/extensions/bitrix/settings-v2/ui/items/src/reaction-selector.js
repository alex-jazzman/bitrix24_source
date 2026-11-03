/**
 * @module settings-v2/ui/items/src/reaction-selector
 */
jn.define('settings-v2/ui/items/src/reaction-selector', (require, exports, module) => {
	const { createTestIdGenerator } = require('utils/test');
	const { Color, Indent } = require('tokens');
	const { Text3, Text5 } = require('ui-system/typography/text');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { ReactionIconView, ReactionIcon } = require('ui-system/blocks/reaction/icon');
	const { DEFAULT_REACTION } = require('layout/ui/reaction/const');
	const { requireLazy } = require('require-lazy');
	const { Type } = require('type');
	const { debounce } = require('utils/function');

	const REACTION_PICKER_EXTENSION = 'layout/ui/reaction/picker';

	// Slightly taller than the chevron: the extra height widens the gap between the control and its subtitle.
	const REACTION_PREVIEW_SIZE = 22;

	// Collapse a burst of quick re-picks into a single persist (last pick wins).
	const PERSIST_DEBOUNCE_MS = 400;

	/**
	 * @class ReactionSelectorItem
	 * @desc Settings control that previews the current main reaction and opens the reaction
	 * picker on tap. The picked value is persisted through the settings-v2 controller
	 * (single writer) via controller.set. The layout mirrors SettingSelector:
	 * the title with the reaction preview + chevron on the right, and an optional subtitle
	 * rendered tightly underneath (same as a toggle subtitle).
	 */
	class ReactionSelectorItem extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				testId: props.testId || 'settings-reaction-selector-item',
				context: this,
			});

			this.layoutWidget = props.layoutWidget ?? PageManager;

			this.state = {
				currentReaction: props.value,
			};

			// Serialize persists: only one controller.set is ever in flight. A pick that arrives while a
			// write is running is not started in parallel; the running loop persists it once the current
			// write settles (see persistCurrentReaction).
			this.isPersisting = false;

			// pendingReaction — latest optimistic pick; lastPersistedReaction — last value confirmed by
			// the controller. Together they let the serialized write persist only the final choice and
			// roll the preview back to a known-good value on failure.
			this.pendingReaction = props.value;
			this.lastPersistedReaction = props.value;
			this.schedulePersist = debounce(() => {
				void this.persistCurrentReaction();
			}, PERSIST_DEBOUNCE_MS, this);

			this.openPicker = this.openPicker.bind(this);

			// Warm the reaction picker in the background as soon as the reaction row renders, so tapping
			// it opens instantly. The heavy picker chain (bottom-sheet, popup-menu, asset-manager) is no
			// longer a hard dependency of the shared settings items bundle; see openPicker().
			void requireLazy(REACTION_PICKER_EXTENSION, false);
		}

		get controller()
		{
			return this.props.controller;
		}

		render()
		{
			const { id, style } = this.props;

			return View(
				{
					testId: this.getTestId(id),
					style,
					onClick: this.openPicker,
				},
				View(
					{
						style: {
							flexDirection: 'column',
						},
					},
					this.renderTopContainer(),
					this.renderSubtitle(),
				),
			);
		}

		renderTopContainer()
		{
			return View(
				{
					style: {
						alignItems: 'center',
						flexDirection: 'row',
					},
				},
				View(
					{
						style: {
							flex: 1,
							flexDirection: 'row',
							paddingVertical: Indent.XS2.toNumber(),
						},
					},
					this.renderTitle(),
				),
				this.renderPreview(),
			);
		}

		renderTitle()
		{
			return Text3({
				testId: this.getTestId('title'),
				text: this.props.title,
				color: Color.base1,
				numberOfLines: 2,
				style: {
					flex: 1,
					flexShrink: 1,
				},
			});
		}

		renderSubtitle()
		{
			const { subtitle } = this.props;
			if (!subtitle)
			{
				return null;
			}

			return Text5({
				testId: this.getTestId('subtitle'),
				text: subtitle,
				color: Color.base3,
				numberOfLines: 5,
				style: {
					marginTop: Indent.XS2.toNumber(),
					paddingVertical: Indent.XS2.toNumber(),
				},
			});
		}

		renderPreview()
		{
			return View(
				{
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						marginLeft: Indent.XL4.toNumber(),
					},
				},
				this.renderReactionIcon(),
				IconView({
					size: 20,
					icon: Icon.CHEVRON_TO_THE_RIGHT,
					color: Color.base4,
					style: {
						marginLeft: Indent.XS.toNumber(),
					},
				}),
			);
		}

		renderReactionIcon()
		{
			// Fall back to the default reaction icon so an unknown/stale id from the server does
			// not leave the control without a preview.
			const icon = ReactionIcon.getIconByReactionId(this.state.currentReaction)
				?? ReactionIcon.getIconByReactionId(DEFAULT_REACTION);
			if (!icon)
			{
				return null;
			}

			return ReactionIconView({
				testId: this.getTestId('preview'),
				icon,
				size: REACTION_PREVIEW_SIZE,
			});
		}

		async openPicker()
		{
			const picker = await requireLazy(REACTION_PICKER_EXTENSION, false);
			if (!picker)
			{
				return;
			}
			const { ReactionPicker, ReactionPack, OrderType } = picker;

			await ReactionPicker.open({
				parentWidget: this.layoutWidget,
				customPack: ReactionPack.ALL,
				order: OrderType.CURRENT_USER_FAVORITES,
				primaryReactionId: this.state.currentReaction,
				onReactionPick: (reactionId) => {
					if (Type.isStringFilled(reactionId))
					{
						this.onChange(reactionId);
					}
				},
			});
		}

		onChange(reactionId)
		{
			if (!Type.isStringFilled(reactionId) || reactionId === this.pendingReaction)
			{
				return;
			}

			// Optimistic preview updates immediately; the write is debounced and serialized so quickly
			// tapping through several reactions collapses into a single persist of the final choice with
			// no parallel or out-of-order writes. The controller shows the success/error toast and rolls
			// back on failure.
			this.pendingReaction = reactionId;
			this.setState({ currentReaction: reactionId });
			this.schedulePersist();
		}

		/**
		 * @desc Persists the pending reaction and reconciles the preview to the actual
		 * persisted/rolled-back value. Serialized: a single controller.set runs at a time; a pick that
		 * arrives during an in-flight write is persisted on the next loop iteration, so only the final
		 * choice ever reaches the server. Debounced through schedulePersist; also awaitable directly.
		 * @return {Promise<void>}
		 */
		async persistCurrentReaction()
		{
			if (this.isPersisting)
			{
				return;
			}

			this.isPersisting = true;
			try
			{
				while (this.pendingReaction !== this.lastPersistedReaction)
				{
					const targetReaction = this.pendingReaction;
					const persistedReaction = await this.persist(targetReaction, this.lastPersistedReaction);
					this.lastPersistedReaction = persistedReaction;

					// A newer pick arrived while this write was in flight: leave its optimistic preview
					// untouched and let the next iteration persist it.
					if (this.pendingReaction !== targetReaction)
					{
						continue;
					}

					// No newer pick: reconcile pendingReaction and the preview to what actually persisted.
					// On a rollback this frees pendingReaction from the rejected value, so re-picking the
					// same reaction is not swallowed by the onChange guard.
					this.pendingReaction = persistedReaction;
					if (persistedReaction !== this.state.currentReaction)
					{
						this.setState({ currentReaction: persistedReaction });
					}
				}
			}
			finally
			{
				this.isPersisting = false;
			}
		}

		/**
		 * @desc Persists the reaction through the settings controller (single writer) and returns
		 * the actual persisted/rolled-back value. Never throws: falls back to the previous value.
		 * @param {string} reactionId
		 * @param {string} previousReaction
		 * @return {Promise<string>}
		 */
		async persist(reactionId, previousReaction)
		{
			const { controller } = this.props;
			if (!controller || !Type.isFunction(controller.set))
			{
				return reactionId;
			}

			try
			{
				const result = await controller.set(reactionId);

				return Type.isStringFilled(result) ? result : reactionId;
			}
			catch (error)
			{
				console.error('ReactionSelectorItem.persist error:', error);

				return previousReaction;
			}
		}
	}

	module.exports = {
		ReactionSelectorItem,
	};
});
