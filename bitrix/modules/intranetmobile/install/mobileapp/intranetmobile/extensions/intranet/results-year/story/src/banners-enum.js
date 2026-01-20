/**
 * @module intranet/results-year/story/src/banners-enum
 */
jn.define('intranet/results-year/story/src/banners-enum', (require, exports, module) => {
	const { BaseEnum } = require('utils/enums/base');

	/**
	 * @class BannersEnum
	 * @template TBannersEnum
	 * @extends {BaseEnum<BannersEnum>}
	 */
	class BannersEnum extends BaseEnum
	{
		static BOARD = new BannersEnum('board', {
			image: {
				style: {
					height: 351,
				},
				name: 'board.png',
			},
			backgroundColorGradient: {
				start: '#ff893b',
				middle: '#ff49c1',
				end: '#ff893b',
				angle: 225,
			},
		});

		static WINNER_BOARD = new BannersEnum('winner_board', {
			image: {
				style: {
					height: 502,
				},
				name: 'winner_board.png',
			},
			backgroundColorGradient: BannersEnum.BOARD.getValue().backgroundColorGradient,
		});

		static SITE = new BannersEnum('site', {
			image: {
				style: {
					height: 347,
				},
				name: 'site.png',
			},
			backgroundColorGradient: {
				start: '#ff49c1',
				middle: '#8e5bff',
				end: '#6732ff',
				angle: 180,
			},
		});

		static WINNER_SITE = new BannersEnum('winner_site', {
			image: {
				style: {
					height: 479,
				},
				name: 'winner_site.png',
			},
			backgroundColorGradient: BannersEnum.SITE.getValue().backgroundColorGradient,
		});

		static CHANNEL = new BannersEnum('channel', {
			image: {
				style: {
					height: 423,
					width: 353,
				},
				name: 'channel.png',
			},
			backgroundColorGradient: {
				start: '#ff893b',
				middle: '#ff49c1',
				end: '#6732ff',
				angle: 225,
			},
		});

		static WINNER_CHANNEL = new BannersEnum('winner_channel', {
			image: {
				style: {
					height: 502,
				},
				name: 'winner_channel.png',
			},
			backgroundColorGradient: BannersEnum.CHANNEL.getValue().backgroundColorGradient,
		});

		static CHECKIN = new BannersEnum('checkin', {
			image: {
				style: {
					height: 471,
				},
				name: 'checkin.png',
			},
			backgroundColorGradient: {
				start: '#6732ff',
				middle: '#143aff',
				end: '#2fec6f',
				angle: 135,
			},
		});

		static WINNER_CHECKIN = new BannersEnum('winner_checkin', {
			image: {
				style: {
					height: 548,
				},
				name: 'winner_checkin.png',
			},
			backgroundColorGradient: BannersEnum.CHECKIN.getValue().backgroundColorGradient,
		});

		static COLLAB = new BannersEnum('collab', {
			image: {
				style: {
					height: 381,
				},
				name: 'collab.png',
			},
			backgroundColorGradient: {
				start: '#3dfcf9',
				middle: '#2fec6f',
				end: '#ccf31e',
				angle: 225,
			},
			theme: 'light',
		});

		static WINNER_COLLAB = new BannersEnum('winner_collab', {
			image: {
				style: {
					height: 493,
				},
				name: 'winner_collab.png',
			},
			theme: BannersEnum.COLLAB.getValue().theme,
			backgroundColorGradient: BannersEnum.COLLAB.getValue().backgroundColorGradient,
		});

		static COPILOT = new BannersEnum('copilot', {
			image: {
				style: {
					height: 571,
				},
				name: 'copilot.png',
			},
			backgroundColorGradient: {
				start: '#ff893b',
				middle: '#ff49c1',
				end: '#be52ff',
				angle: 135,
			},
		});

		static WINNER_COPILOT = new BannersEnum('winner_copilot', {
			image: {
				style: {
					height: 508,
				},
				name: 'winner_copilot.png',
			},
			backgroundColorGradient: BannersEnum.COPILOT.getValue().backgroundColorGradient,
		});

		static DEAL = new BannersEnum('deal', {
			image: {
				style: {
					height: 471,
				},
				name: 'deal.png',
			},
			backgroundColorGradient: {
				start: '#a5e4ff',
				middle: '#08a6ff',
				end: '#143aff',
				angle: 180,
			},
		});

		static WINNER_DEAL = new BannersEnum('winner_deal', {
			image: {
				style: {
					height: 536,
				},
				name: 'winner_deal.png',
			},
			backgroundColorGradient: BannersEnum.DEAL.getValue().backgroundColorGradient,
		});

		static MESSAGE = new BannersEnum('message', {
			image: {
				style: {
					height: 338,
				},
				name: 'message.png',
			},
			backgroundColorGradient: {
				start: '#3dfcf9',
				middle: '#08a6ff',
				end: '#006dff',
				angle: 225,
			},
		});

		static WINNER_MESSAGE = new BannersEnum('winner_message', {
			image: {
				style: {
					height: 508,
				},
				name: 'winner_message.png',
			},
			backgroundColorGradient: BannersEnum.MESSAGE.getValue().backgroundColorGradient,
		});

		static REACTION = new BannersEnum('reaction', {
			image: {
				style: {
					height: 417,
				},
				name: 'reaction.png',
			},
			backgroundColorGradient: {
				start: '#ff893b',
				middle: '#ff893b',
				end: '#ffe055',
				angle: 135,
			},
		});

		static WINNER_REACTION = new BannersEnum('winner_reaction', {
			image: {
				style: {
					height: 463,
				},
				name: 'winner_reaction.png',
			},
			backgroundColorGradient: BannersEnum.REACTION.getValue().backgroundColorGradient,
		});

		static TASK = new BannersEnum('task', {
			image: {
				style: {
					height: 430,
				},
				name: 'task.png',
			},
			backgroundColorGradient: {
				start: '#e2ff60',
				middle: '#ccf31e',
				end: '#2fec6f',
				angle: 135,
			},
			theme: 'light',
		});

		static WINNER_TASK = new BannersEnum('winner_task', {
			image: {
				style: {
					height: 543,
				},
				name: 'winner_task.png',
			},
			theme: BannersEnum.TASK.getValue().theme,
			backgroundColorGradient: BannersEnum.TASK.getValue().backgroundColorGradient,
		});

		static WORKFLOW = new BannersEnum('workflow', {
			image: {
				style: {
					height: 537,
				},
				name: 'workflow.png',
			},
			backgroundColorGradient: {
				start: '#def3ff',
				middle: '#a5e4ff',
				end: '#08a6ff',
				angle: 225,
			},
			theme: 'light',
		});

		static WINNER_WORKFLOW = new BannersEnum('winner_workflow', {
			image: {
				style: {
					height: 502,
				},
				name: 'winner_workflow.png',
			},
			theme: BannersEnum.WORKFLOW.getValue().theme,
			backgroundColorGradient: BannersEnum.WORKFLOW.getValue().backgroundColorGradient,
		});

		static WINNER_BASE = new BannersEnum('winner_base', {
			image: {
				style: {
					height: 506,
				},
				name: 'winner_base.png',
			},
			backgroundColorGradient: {
				start: '#3dfcf9',
				middle: '#08a6ff',
				end: '#006dff',
				angle: 225,
			},
		});

		/**
		 * @param {string} type
		 * @returns {BannersEnum|null}
		 */
		static getBannerByType(type)
		{
			return BannersEnum.getEnum(type.toUpperCase()) || null;
		}

		static getAllBanners()
		{
			return [
				BannersEnum.BOARD,
				BannersEnum.WINNER_BOARD,
				BannersEnum.SITE,
				BannersEnum.WINNER_SITE,
				BannersEnum.CHANNEL,
				BannersEnum.WINNER_CHANNEL,
				BannersEnum.CHECKIN,
				BannersEnum.WINNER_CHECKIN,
				BannersEnum.COLLAB,
				BannersEnum.WINNER_COLLAB,
				BannersEnum.COPILOT,
				BannersEnum.WINNER_COPILOT,
				BannersEnum.DEAL,
				BannersEnum.WINNER_DEAL,
				BannersEnum.MESSAGE,
				BannersEnum.WINNER_MESSAGE,
				BannersEnum.REACTION,
				BannersEnum.WINNER_REACTION,
				BannersEnum.TASK,
				BannersEnum.WINNER_TASK,
				BannersEnum.WORKFLOW,
				BannersEnum.WINNER_WORKFLOW,
			];
		}

		static getBannersByFeatureId(featureId)
		{
			const baseFeature = BannersEnum.getEnum(featureId.toUpperCase());
			if (!baseFeature)
			{
				return [];
			}

			const winnerFeatureName = `WINNER_${featureId.toUpperCase()}`;
			const winnerFeature = BannersEnum.getEnum(winnerFeatureName);

			return winnerFeature ? [baseFeature, winnerFeature] : [baseFeature];
		}

		/**
		 * @returns {boolean}
		 */
		isLight()
		{
			return this.getValue().theme === 'light';
		}
	}

	module.exports = { BannersEnum };
});
