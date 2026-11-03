import { Loc } from 'main.core';

const IMAGE_PATH = '/bitrix/js/biconnector/ai-digest-setup/images/';

// The sprites are cut along one common frame, so each layer covers the frame whole and names no geometry.
const SCENE_ASPECT = 593 / 520;
const SCENE_LAYERS = Object.freeze([
	{ src: 'onboarding-back.webp', depth: 1, shift: 3, period: 11 },
	{ src: 'onboarding-icons.webp', depth: 4, shift: 8, period: 5 },
	{ src: 'onboarding-mascot.webp', depth: 3, shift: 4, period: 7 },
]);

type ButtonLike = {
	getContainer: () => HTMLElement;
};

type WhatsNewLike = {
	show: () => void;
	hide: () => void;
	destroy: () => void;
};

export type OnboardingDialogModules = {
	WhatsNew: new (options: Object) => WhatsNewLike;
	WhatsNewSize: { Md: string };
	WhatsNewBackdrop: { Water: string };
	WhatsNewColor: { DarkBlue: string };
	Button: new (options: Object) => ButtonLike;
	AirButtonStyle: { FILLED_SUCCESS: string; PLAIN: string };
	ButtonSize: { LARGE: string };
	Outline: { GRAPHS_DIAGRAM: string; CLOCK: string; CIRCLE_MORE: string };
};

export type OnboardingDialogHandlers = {
	onTry: () => void;
	// Any close of the dialog - the cross, Esc, "Later" or "Try" - is the end of the onboarding.
	onClose: () => void;
};

export const createOnboardingDialog = (
	modules: OnboardingDialogModules,
	handlers: OnboardingDialogHandlers,
): () => void => {
	const {
		WhatsNew,
		WhatsNewSize,
		WhatsNewBackdrop,
		WhatsNewColor,
		Button,
		AirButtonStyle,
		ButtonSize,
		Outline,
	} = modules;

	let dialog: WhatsNewLike | null = null;
	const createButton = (
		text: string | null | undefined,
		style: string,
		testId: string,
		onPress: () => void,
	): ButtonLike => {
		return new Button({
			text,
			style,
			size: ButtonSize.LARGE,
			useAirDesign: true,
			dataset: { testid: testId },
			onclick: (): {} => {
				dialog?.hide();
				onPress();

				return {};
			},
		});
	};

	const laterButton = createButton(
		Loc.getMessage('BICONNECTOR_AI_DIGEST_ONBOARDING_LATER'),
		AirButtonStyle.PLAIN,
		'biconnector-ai-digest-onboarding-later',
		() => {},
	);
	const tryButton = createButton(
		Loc.getMessage('BICONNECTOR_AI_DIGEST_ONBOARDING_TRY_MSGVER_1'),
		AirButtonStyle.FILLED_SUCCESS,
		'biconnector-ai-digest-onboarding-try',
		handlers.onTry,
	);

	const preparedDialog = new WhatsNew({
		size: WhatsNewSize.Md,
		backdrop: WhatsNewBackdrop.Water,
		backdropColor: WhatsNewColor.DarkBlue,
		label: Loc.getMessage('BICONNECTOR_AI_DIGEST_ONBOARDING_LABEL'),
		title: Loc.getMessage('BICONNECTOR_AI_DIGEST_ONBOARDING_TITLE_MSGVER_1'),
		subtitle: Loc.getMessage('BICONNECTOR_AI_DIGEST_ONBOARDING_SUBTITLE'),
		scene: {
			aspect: SCENE_ASPECT,
			layers: SCENE_LAYERS.map((layer) => ({ ...layer, src: `${IMAGE_PATH}${layer.src}` })),
		},
		items: [
			{
				icon: Outline.GRAPHS_DIAGRAM,
				title: Loc.getMessage('BICONNECTOR_AI_DIGEST_ONBOARDING_ITEM_REPORT_TITLE'),
				description: Loc.getMessage('BICONNECTOR_AI_DIGEST_ONBOARDING_ITEM_REPORT_TEXT'),
				accent: true,
			},
			{
				icon: Outline.CLOCK,
				title: Loc.getMessage('BICONNECTOR_AI_DIGEST_ONBOARDING_ITEM_SCHEDULE_TITLE'),
				description: Loc.getMessage('BICONNECTOR_AI_DIGEST_ONBOARDING_ITEM_SCHEDULE_TEXT'),
				accent: true,
			},
			{
				icon: Outline.CIRCLE_MORE,
				title: Loc.getMessage('BICONNECTOR_AI_DIGEST_ONBOARDING_ITEM_MENU_TITLE'),
				description: Loc.getMessage('BICONNECTOR_AI_DIGEST_ONBOARDING_ITEM_MENU_TEXT'),
				accent: true,
			},
		],
		actions: [laterButton, tryButton],
		// The show is spent on the server before the dialog opens: a stray click outside must not burn it.
		closeByClickOutside: false,
		events: {
			onAfterShow: () => tryButton.getContainer().focus(),
			onAfterHide: () => {
				preparedDialog.destroy();
				handlers.onClose();
			},
		},
	});
	dialog = preparedDialog;

	return (): void => preparedDialog.show();
};
