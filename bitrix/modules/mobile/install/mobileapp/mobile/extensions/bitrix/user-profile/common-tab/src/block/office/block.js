/**
 * @module user-profile/common-tab/src/block/office/block
 */
jn.define('user-profile/common-tab/src/block/office/block', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Component, Indent } = require('tokens');
	const { BaseBlock } = require('user-profile/common-tab/src/block/base-block');
	const { Office } = require('user-profile/common-tab/src/block/office/view');

	const AVAILABLE_STATUS = 'available';

	const TitleMessageId = {
		OWN: 'M_PROFILE_OFFICE_TITLE_OWN',
		EMPLOYEE: 'M_PROFILE_OFFICE_TITLE_EMPLOYEE',
	};

	/**
	 * @param {*} office
	 * @returns {{ status: *, officeId: *, title: *, snapshotUrl: *, presence: * }|null}
	 */
	const readOfficeSlice = (office) => {
		if (typeof office !== 'object' || office === null || Array.isArray(office))
		{
			return null;
		}

		const { status, officeId, title, snapshotUrl, presence } = office;

		return { status, officeId, title, snapshotUrl, presence };
	};

	/**
	 * @param {{ title: * }} office
	 * @returns {boolean}
	 */
	const hasTitle = (office) => typeof office.title === 'string' && office.title.trim() !== '';

	/**
	 * @returns {number|null}
	 */
	const getViewerId = () => {
		if (typeof env === 'undefined')
		{
			return null;
		}

		const viewerId = Number(env.userId);

		return Number.isInteger(viewerId) && viewerId > 0 ? viewerId : null;
	};

	/**
	 * @param {*} ownerId
	 * @returns {boolean}
	 */
	const isOwnProfile = (ownerId) => {
		const viewerId = getViewerId();

		return viewerId !== null && Number(ownerId) === viewerId;
	};

	class OfficeBlock extends BaseBlock
	{
		/**
		 * @param {{ office?: Object|null, ownerId?: number|string, isEditMode?: boolean }} commonTabData
		 * @returns {{ office: Object|null, isOwnProfile: boolean, isEditMode: boolean }}
		 */
		prepareProps(commonTabData)
		{
			try
			{
				const { office, ownerId, isEditMode } = commonTabData ?? {};

				return {
					office: readOfficeSlice(office),
					isOwnProfile: isOwnProfile(ownerId),
					isEditMode: isEditMode ?? false,
					...this.getWrapperOptions(),
				};
			}
			catch
			{
				return {
					office: null,
					isOwnProfile: false,
					isEditMode: false,
					...this.getWrapperOptions(),
				};
			}
		}

		/**
		 * @returns {string}
		 */
		getTitle()
		{
			return Loc.getMessage(this.props.isOwnProfile ? TitleMessageId.OWN : TitleMessageId.EMPLOYEE);
		}

		/**
		 * @returns {boolean}
		 */
		isAvailable()
		{
			const { office, isEditMode } = this.props;

			if (isEditMode || office === null)
			{
				return false;
			}

			return office.status === AVAILABLE_STATUS && hasTitle(office);
		}

		/**
		 * @returns {(props: { office: Object|null }) => Office}
		 */
		getContentClass()
		{
			return Office;
		}

		/**
		 * @returns {{ testId: string, titleTestId: string, cardProps: Object, titleStyle: Object }}
		 */
		getWrapperOptions()
		{
			return {
				testId: 'office-card',
				titleTestId: 'office-card-title',
				cardProps: {
					excludePaddingSide: {
						all: true,
					},
				},
				titleStyle: {
					marginHorizontal: Component.cardPaddingLr.toNumber(),
					marginTop: Component.cardPaddingT.toNumber(),
					marginBottom: Indent.L.toNumber(),
				},
			};
		}
	}

	module.exports = { OfficeBlock };
});
