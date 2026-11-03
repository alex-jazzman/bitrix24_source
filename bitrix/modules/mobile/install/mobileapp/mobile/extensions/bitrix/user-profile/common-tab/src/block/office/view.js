/**
 * @module user-profile/common-tab/src/block/office/view
 */
jn.define('user-profile/common-tab/src/block/office/view', (require, exports, module) => {
	const { SafeImage } = require('layout/ui/safe-image');
	const { Loc } = require('loc');
	const { Color, Component, Indent } = require('tokens');
	const { Type } = require('type');
	const { Text4, Text5 } = require('ui-system/typography');
	const { withCurrentDomain } = require('utils/url');

	const SNAPSHOT_HEIGHT = 132;
	const PLATE_CORNER = 8;

	const TestId = {
		SNAPSHOT: 'office-card-snapshot',
		PLATE: 'office-card-plate',
		PLATE_TITLE: 'office-card-plate-title',
		PRESENCE: 'office-card-presence',
	};

	const PresenceStatus = {
		PRESENT: 'present',
		ABSENT: 'absent',
		UNKNOWN: 'unknown',
	};

	const PRESENCE_MESSAGE_ID = new Map([
		[PresenceStatus.PRESENT, 'M_PROFILE_OFFICE_PRESENCE_PRESENT'],
		[PresenceStatus.ABSENT, 'M_PROFILE_OFFICE_PRESENCE_ABSENT'],
		[PresenceStatus.UNKNOWN, 'M_PROFILE_OFFICE_PRESENCE_UNKNOWN'],
	]);

	/**
	 * @param {string} [presence]
	 * @returns {string|null}
	 */
	const getPresenceMessageId = (presence) => {
		if (!presence)
		{
			return null;
		}

		return PRESENCE_MESSAGE_ID.get(presence) ?? PRESENCE_MESSAGE_ID.get(PresenceStatus.UNKNOWN);
	};

	/**
	 * @param {string} [presence]
	 * @returns {string}
	 */
	const getPresenceText = (presence) => {
		const messageId = getPresenceMessageId(presence);

		if (messageId === null)
		{
			return '';
		}

		const text = Loc.getMessage(messageId);

		return Type.isStringFilled(text) ? text : '';
	};

	/**
	 * @typedef {Object} OfficeSlice
	 * @property {string} [status]
	 * @property {number} [officeId]
	 * @property {string} [title]
	 * @property {string} [snapshotUrl]
	 * @property {string} [presence]
	 *
	 * @typedef {Object} OfficeProps
	 * @property {OfficeSlice|null} [office]
	 *
	 * @extends {LayoutComponent}
	 */
	class Office extends LayoutComponent
	{
		/**
		 * @returns {OfficeSlice}
		 */
		get office()
		{
			return this.props.office ?? {};
		}

		/**
		 * @returns {LayoutComponent}
		 */
		render()
		{
			const presenceText = getPresenceText(this.office.presence);

			return View(
				{
					style: {
						flexDirection: 'column',
						paddingBottom: Component.cardPaddingB.toNumber(),
					},
				},
				this.#renderSnapshotArea(),
				this.#renderPresence(presenceText),
			);
		}

		#renderSnapshotArea()
		{
			return View(
				{
					style: {
						height: SNAPSHOT_HEIGHT,
						justifyContent: 'flex-end',
						alignItems: 'flex-start',
						overflow: 'hidden',
						backgroundColor: Color.bgContentSecondary.toHex(),
					},
				},
				this.#renderSnapshot(),
				this.#renderPlate(),
			);
		}

		#renderSnapshot()
		{
			const { snapshotUrl } = this.office;

			if (!snapshotUrl)
			{
				return null;
			}

			return SafeImage({
				testId: TestId.SNAPSHOT,
				uri: withCurrentDomain(snapshotUrl),
				resizeMode: 'cover',
				withShimmer: true,
				clickable: false,
				wrapperStyle: {
					position: 'absolute',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
				},
				style: {
					width: '100%',
					height: '100%',
				},
			});
		}

		#renderPlate()
		{
			return View(
				{
					testId: TestId.PLATE,
					style: {
						maxWidth: '100%',
						marginHorizontal: Component.cardPaddingLr.toNumber(),
						marginBottom: Component.cardPaddingB.toNumber(),
						paddingHorizontal: Indent.L.toNumber(),
						paddingVertical: Indent.XS.toNumber(),
						borderRadius: PLATE_CORNER,
						backgroundColor: Color.bgContentPrimary.toHex(),
					},
				},
				Text4({
					testId: TestId.PLATE_TITLE,
					accent: true,
					text: this.office.title,
					color: Color.base1,
					numberOfLines: 2,
					ellipsize: 'end',
				}),
			);
		}

		#renderPresence(presenceText)
		{
			if (presenceText === '')
			{
				return null;
			}

			return Text5({
				testId: TestId.PRESENCE,
				text: presenceText,
				color: this.office.presence === PresenceStatus.PRESENT ? Color.accentMainSuccess : Color.base3,
				style: {
					marginHorizontal: Component.cardPaddingLr.toNumber(),
					marginTop: Indent.L.toNumber(),
				},
			});
		}
	}

	module.exports = {
		/**
		 * @param {OfficeProps} props
		 * @returns {Office}
		 */
		Office: (props) => new Office(props),
		getPresenceMessageId,
		getPresenceText,
	};
});
