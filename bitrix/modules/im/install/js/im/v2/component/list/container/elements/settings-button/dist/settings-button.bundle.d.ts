/* eslint-disable */
declare namespace BX.Messenger.v2.Component.List {
	const SettingsButton: BX.Vue3.DefineComponent<{}, {}, {}, {
		ICON_NAME: () => "settings-l";
		isAvailable(): boolean;
	}, {
		handleClick(): void;
		loc(phraseCode: string): string;
	}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {
		BIcon: typeof BX.UI.IconSet.BIcon;
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
}
