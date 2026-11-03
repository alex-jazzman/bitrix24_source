/**
 * @module more-menu/block/company/tariff-plate/src/enum/tariff-plate-state-enum
 */
jn.define('more-menu/block/company/tariff-plate/src/enum/tariff-plate-state-enum', (require, exports, module) => {
	const { Loc } = require('loc');
	const { BaseEnum } = require('utils/enums/base');

	const { Family } = require('more-menu/block/company/tariff-plate/src/const');
	const { TariffPlateCtaEnum } = require('more-menu/block/company/tariff-plate/src/enum/tariff-plate-cta-enum');
	const { TariffPlateSubtitleEnum } = require('more-menu/block/company/tariff-plate/src/enum/tariff-plate-subtitle-enum');

	const SUPPORTED_FAMILIES = new Set(Object.values(Family));

	/**
	 * A downgraded portal is drawn as a free one: it carries the free license family and name, and the
	 * expire date it still holds belongs to the paid plan that ended, not to a term of the free one.
	 * The web hides that date the same way - it never draws it for a free license. So the state has no
	 * card of its own and resolves into FREE; the server keeps sending the honest code.
	 */
	const DOWNGRADED_CODE = 'downgraded';

	/**
	 * Keeps the plate illustrated on portals whose license family ships no assets
	 * (getLicenseFamily() also returns nfr, tf, crm, team, company).
	 *
	 * @param {string} [family]
	 * @return {string}
	 */
	const resolveFamily = (family) => (SUPPORTED_FAMILIES.has(family) ? family : Family.BASIC);

	/**
	 * The paid families in the middle share one background: the standard and the professional plan wear
	 * the basic one. Only the families that differ are named here - the rest keep the background of
	 * their own name.
	 */
	const SHARED_BACKGROUNDS = new Map([
		[Family.STANDARD, Family.BASIC],
		[Family.PROFESSIONAL, Family.BASIC],
	]);

	/**
	 * @param {string} [family]
	 * @return {string}
	 */
	const resolveBackgroundFamily = (family) => {
		const resolved = resolveFamily(family);

		return SHARED_BACKGROUNDS.get(resolved) ?? resolved;
	};

	/**
	 * Per-state presentation config for the tariff plate, mirrors backend ALG-01.
	 * `image: null` means the icon is resolved by license family instead of the state.
	 *
	 * @extends {BaseEnum<TariffPlateStateEnum>}
	 */
	class TariffPlateStateEnum extends BaseEnum
	{
		// The only state whose two lines are swapped: the heading names the thing rather than the plan,
		// and the plan itself is the line underneath. Being the line that names the plan, it is also the
		// one that carries the weight, so this card reads big line last instead of first.
		static FREE = new TariffPlateStateEnum('free', {
			title: Loc.getMessage('M_TARIFF_PLATE_TARIFF_TITLE'),
			subtitle: TariffPlateSubtitleEnum.TARIFF_NAME,
			subtitleLeads: true,
			cta: TariffPlateCtaEnum.BUY,
		});

		static DEMO = new TariffPlateStateEnum('demo', {
			image: 'demo-active',
			background: 'basic',
			title: Loc.getMessage('M_TARIFF_PLATE_DEMO_NAME'),
			subtitle: TariffPlateSubtitleEnum.DEMO_DATE,
			cta: TariffPlateCtaEnum.BUY,
		});

		static ACTIVE = new TariffPlateStateEnum('active', {
			subtitle: TariffPlateSubtitleEnum.EXPIRE_DATE,
			cta: TariffPlateCtaEnum.UPGRADE,
		});

		static AUTOPAY = new TariffPlateStateEnum('autopay', {
			subtitle: TariffPlateSubtitleEnum.EXPIRE_DATE,
			cta: TariffPlateCtaEnum.UPGRADE,
		});

		static ALMOST_EXPIRED = new TariffPlateStateEnum('almostExpired', {
			image: 'expired',
			background: 'alert',
			subtitle: TariffPlateSubtitleEnum.DAYS_LEFT,
			cta: TariffPlateCtaEnum.RENEW,
		});

		static EXPIRED = new TariffPlateStateEnum('expired', {
			image: 'expired',
			background: 'alert',
			subtitle: TariffPlateSubtitleEnum.EXPIRED,
			cta: TariffPlateCtaEnum.RENEW,
		});

		/**
		 * Resolves the backend state code (e.g. 'expired') into the enum instance.
		 *
		 * @param {string} code
		 * @return {TariffPlateStateEnum}
		 */
		static fromCode(code)
		{
			if (code === DOWNGRADED_CODE)
			{
				return this.FREE;
			}

			return this.getEnums().find((item) => item.getName() === code) ?? this.ACTIVE;
		}

		getImage(family)
		{
			return this.getValue().image ?? resolveFamily(family);
		}

		getBackground(family)
		{
			return `bg-${this.getValue().background ?? resolveBackgroundFamily(family)}`;
		}

		getTitle(tariffName)
		{
			return this.getValue().title ?? tariffName;
		}

		getSubtitle()
		{
			return this.getValue().subtitle;
		}

		/**
		 * Whether the subtitle is the line that leads the card: it takes the type of the heading and the
		 * heading takes the small one. Everywhere else the heading leads.
		 *
		 * @return {boolean}
		 */
		isSubtitleLeading()
		{
			return this.getValue().subtitleLeads === true;
		}

		getCta()
		{
			return this.getValue().cta;
		}
	}

	module.exports = { TariffPlateStateEnum: TariffPlateStateEnum.export() };
});
