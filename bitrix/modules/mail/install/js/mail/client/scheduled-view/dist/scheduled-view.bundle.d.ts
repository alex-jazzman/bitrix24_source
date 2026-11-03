/* eslint-disable */
type ScheduledViewState = {
	loading: boolean;
	pending: boolean;
	error: boolean;
	/** Reason of a refused action, already localized: the letter itself stays on the screen beside it. */
	actionError: string;
	message: BX.Mail.Client.ScheduledMessage.ScheduledMessageDto | null;
	edit: () => void;
	cancel: () => void;
};

type ContactChip = {
	testId: string;
	text: string;
	avatar: string | null;
};

type Options = {
	containerId: string;
	messageId: number;
	mailboxId: number;
	editPath: string;
	editWidth?: number;
	draftsPath: string;
	api?: BX.Mail.Client.ScheduledMessage.ScheduledMessageApi;
	navigate?: (path: string) => void;
	/** Seams of the slider the card is opened in: the tests of the screen stand in for the portal here. */
	notifyCancelled?: (messageId: number) => void;
	closeCard?: () => void;
};

declare namespace BX.Mail.Client {
	const ScheduledView: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		state: {
			type: BX.Vue3.PropType<ScheduledViewState>;
			required: true;
		};
	}>, {
		AlertDesign: Readonly<{
			tinted: "tinted";
			tintedSuccess: "tinted-success";
			tintedWarning: "tinted-warning";
			tintedAlert: "tinted-alert";
		}>;
		AirButtonStyle: typeof BX.Vue3.Components.AirButtonStyle;
		ButtonSize: typeof BX.Vue3.Components.ButtonSize;
		titleId: string;
		titleIcon: "o-mail-send";
		scheduleIcon: "so-clock";
		cancelIcon: "o-undo";
		editIcon: "edit-m";
	}, {}, {
		message(): BX.Mail.Client.ScheduledMessage.ScheduledMessageDto | null;
		canCancel(): boolean;
		canEdit(): boolean;
		scheduledAt(): string;
		errorReason(): string;
		senderChips(): ContactChip[];
		toChips(): ContactChip[];
		ccChips(): ContactChip[];
		/**
		 * The row of a letter without a copy stays in place by the mockup, but a label with no value is
		 * nothing to read out, so an empty row is kept out of the accessibility tree.
		 */
		hasCc(): boolean;
		/**
		 * The letter is written by someone else and the message carries no language of its own, so the
		 * embedded document declares the language as unknown: lending it the language of the interface would
		 * make the reader pronounce a foreign letter as a Russian one.
		 */
		bodyDocument(): string;
	}, {
		loc(code: string, replacements?: Record<string, string>): string;
	}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		state: {
			type: BX.Vue3.PropType<ScheduledViewState>;
			required: true;
		};
	}>> & Readonly<{}>, {}, {}, {
		Alert: typeof BX.UI.System.Alert.Vue.Alert;
		BIcon: typeof BX.UI.IconSet.BIcon;
		ContactChips: typeof ContactChips;
		HeadlineLg: typeof BX.UI.System.Typography.Vue.HeadlineLg;
		MessageField: typeof MessageField;
		TextMd: typeof BX.UI.System.Typography.Vue.TextMd;
		TextSm: typeof BX.UI.System.Typography.Vue.TextSm;
		UiButton: typeof BX.Vue3.Components.Button;
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	/**
	 * Read-only list of contacts. `ui.system.chip` writes `tabindex="0"` into its root, which on this screen
	 * gives a Tab stop with neither a role nor an action; the attribute is overwritten to keep the chip out of
	 * the keyboard path and leave the name as plain text for the reader.
	 */
	const ContactChips: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		items: {
			type: BX.Vue3.PropType<ContactChip[]>;
			default: () => ContactChip[];
		};
	}>, {
		chipDesign: "tinted";
		chipSize: "m";
	}, {}, {}, {
		/** The name stands right beside the avatar, so the picture is decorative and takes an empty alt. */
		imageOf(chip: ContactChip): BX.UI.System.Chip.Vue.ChipImage | null;
	}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		items: {
			type: BX.Vue3.PropType<ContactChip[]>;
			default: () => ContactChip[];
		};
	}>> & Readonly<{}>, {
		items: ContactChip[];
	}, {}, {
		Chip: typeof BX.UI.System.Chip.Vue.Chip;
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	/**
	 * One row of the letter card. The label and the value are a term and its definition, so the row stands as a
	 * group of a description list and the reader gets the pair bound together instead of a flat run of text; the
	 * list itself is opened by the owner of the rows.
	 */
	const MessageField: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		label: {
			type: StringConstructor;
			required: true;
		};
	}>, {}, {}, {}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		label: {
			type: StringConstructor;
			required: true;
		};
	}>> & Readonly<{}>, {}, {}, {
		TextSm: typeof BX.UI.System.Typography.Vue.TextSm;
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	class ScheduledViewApplication {
		constructor(options: Options);
		start(): void;
	}
}
