/**
 * @module layout/socialnetwork/project-v2/create/src/view/intro
 */
jn.define('layout/socialnetwork/project-v2/create/src/view/intro', (require, exports, module) => {
	const { makeLibraryImagePath } = require('asset-manager');
	const { Button, ButtonSize } = require('ui-system/form/buttons');
	const { Text4, Text5 } = require('ui-system/typography/text');
	const { H3 } = require('ui-system/typography/heading');
	const { Area } = require('ui-system/layout/area');
	const { BoxFooter } = require('ui-system/layout/dialog-footer');
	const { Indent, Color } = require('tokens');
	const { Loc } = require('loc');
	const { Icon } = require('assets/icons');
	const { Link4, LinkMode, Ellipsize } = require('ui-system/blocks/link');
	const { Box } = require('ui-system/layout/box');
	const { createTestIdGenerator } = require('utils/test');

	const getTestId = createTestIdGenerator({
		prefix: 'project-create-intro',
	});

	const ProjectCreateIntro = ({ onContinue }) => Box(
		{
			testId: getTestId(),
			safeArea: { bottom: true },
			withScroll: true,
			footer: Footer({ onContinue }),
		},
		Area(
			{
				style: {
					flexDirection: 'column',
					backgroundColor: Color.bgContentPrimary.toHex(),
				},
			},
			HeroImage(),
			Title({
				text: Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_INTRO_TITLE')
					.replaceAll('[COLOR]', `[COLOR=${Color.accentMainPrimary.toHex()}]`),
			}),
			FeatureBox(
				Feature({
					text: Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_INTRO_FEATURE_1'),
					icon: Icon.PERSON_CHECKS,
				}),
				Feature({
					text: Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_INTRO_FEATURE_2'),
					icon: Icon.CHATS,
				}),
				Feature({
					text: Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_INTRO_FEATURE_3'),
					icon: Icon.BITRIX_GPT,
				}),
			),
			// DetailsLink(), todo: remove the comment when the helpdesk is ready
			InviteHint(),
		),
	);

	const Footer = ({ onContinue }) => BoxFooter(
		{
			testId: getTestId('footer'),
			safeArea: true,
			backgroundColor: Color.bgContentPrimary,
		},
		Button({
			testId: getTestId('continue-btn'),
			size: ButtonSize.L,
			text: Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_INTRO_CONTINUE'),
			stretched: true,
			backgroundColor: Color.accentMainPrimary,
			onClick: onContinue,
		}),
	);

	const HeroImage = () => View(
		{
			style: {
				alignItems: 'center',
				marginBottom: Indent.XL3.getValue(),
			},
		},
		Image({
			style: {
				width: 180,
				height: 130,
			},
			uri: makeLibraryImagePath('zefir-banner.png', 'projects-v2'),
			resizeMode: 'contain',
		}),
	);

	const Title = ({ text }) => View(
		{
			style: {
				marginBottom: Indent.XL3.getValue(),
			},
		},
		H3({
			value: text,
			nativeElement: BBCodeText,
			linksUnderline: false,
			color: Color.base2,
			style: {
				textAlign: 'center',
			},
		}),
	);

	const FeatureBox = (...children) => View(
		{
			style: {
				flexDirection: 'row',
				justifyContent: 'center',
			},
		},
		View(
			{
				style: {
					paddingHorizontal: Indent.XL3.getValue(),
					paddingTop: Indent.XL2.getValue(),
					marginBottom: Indent.L.getValue(),
					maxWidth: 340,
				},
			},
			...children,
		),
	);

	const Feature = ({ text, icon }) => View(
		{
			style: {
				flexDirection: 'row',
				justifyContent: 'flex-start',
				marginBottom: Indent.XL2.getValue(),
			},
		},
		Image({
			named: icon.getIconName(),
			tintColor: Color.accentMainPrimary.toHex(),
			style: {
				width: 28,
				height: 28,
				marginRight: Indent.L.getValue(),
			},
		}),
		Text4({
			text,
			color: Color.base2,
			style: {
				flexShrink: 1,
			},
		}),
	);

	const DetailsLink = () => Link4({
		testId: getTestId('details-link'),
		text: Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_DETAILS_LINK'),
		ellipsize: Ellipsize.END,
		mode: LinkMode.SOLID,
		color: Color.base4,
		numberOfLines: 1,
		textDecorationLine: 'underline',
		style: {
			alignSelf: 'center',
			marginBottom: Indent.L.toNumber(),
		},
		onClick: () => {},
	});

	const InviteHint = () => View(
		{
			style: {
				alignItems: 'center',
				marginTop: Indent.S.toNumber(),
			},
		},
		Text5({
			text: Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_INTRO_INVITE'),
			color: Color.base3,
			style: {
				textAlign: 'center',
			},
		}),
	);

	module.exports = { ProjectCreateIntro };
});
