/* eslint-disable */
type CallIconName = typeof BX.Call.Component.Ui.CallIconList extends Set<infer T> ? T : never;

type CallIconColor = typeof BX.Call.Component.Ui.CallIconColors extends Set<infer T> ? T : never;

type CallIconSize = typeof BX.Call.Component.Ui.CallIconSizes extends Set<infer T> ? T : never;

declare namespace BX.Call.Component.Ui {
	const CallIcon: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		icon: {
			type: StringConstructor;
			required: true;
			validator: (value: string) => boolean;
		};
		color: {
			type: StringConstructor;
			default: string;
			validator: (value: string) => boolean;
		};
		size: {
			type: NumberConstructor;
			default: number;
			validator: (value: number) => boolean;
		};
	}>, {}, {}, {
		additionalClasses(): string[];
		additionalStyles(): Record<string, string>;
	}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		icon: {
			type: StringConstructor;
			required: true;
			validator: (value: string) => boolean;
		};
		color: {
			type: StringConstructor;
			default: string;
			validator: (value: string) => boolean;
		};
		size: {
			type: NumberConstructor;
			default: number;
			validator: (value: number) => boolean;
		};
	}>> & Readonly<{}>, {
		size: number;
		color: string;
	}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	const CallIconLevel: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		icon: {
			type: StringConstructor;
			required: true;
			validator: (value: string) => boolean;
		};
		color: {
			type: StringConstructor;
			default: string;
			validator: (value: string) => boolean;
		};
		size: {
			type: NumberConstructor;
			default: number;
			validator: (value: number) => boolean;
		};
		animated: {
			type: BooleanConstructor;
			default: boolean;
		};
		fillColor: {
			type: StringConstructor;
			default: string;
			validator: (value: string) => boolean;
		};
		level: {
			type: NumberConstructor;
			default: number;
		};
	}>, {}, {}, {
		clampedLevel(): number;
		fillStyle(): Record<string, string>;
	}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		icon: {
			type: StringConstructor;
			required: true;
			validator: (value: string) => boolean;
		};
		color: {
			type: StringConstructor;
			default: string;
			validator: (value: string) => boolean;
		};
		size: {
			type: NumberConstructor;
			default: number;
			validator: (value: number) => boolean;
		};
		animated: {
			type: BooleanConstructor;
			default: boolean;
		};
		fillColor: {
			type: StringConstructor;
			default: string;
			validator: (value: string) => boolean;
		};
		level: {
			type: NumberConstructor;
			default: number;
		};
	}>> & Readonly<{}>, {
		size: number;
		color: string;
		animated: boolean;
		fillColor: string;
		level: number;
	}, {}, {
		CallIcon: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
			icon: {
				type: StringConstructor;
				required: true;
				validator: (value: string) => boolean;
			};
			color: {
				type: StringConstructor;
				default: string;
				validator: (value: string) => boolean;
			};
			size: {
				type: NumberConstructor;
				default: number;
				validator: (value: number) => boolean;
			};
		}>, {}, {}, {
			additionalClasses(): string[];
			additionalStyles(): Record<string, string>;
		}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
			icon: {
				type: StringConstructor;
				required: true;
				validator: (value: string) => boolean;
			};
			color: {
				type: StringConstructor;
				default: string;
				validator: (value: string) => boolean;
			};
			size: {
				type: NumberConstructor;
				default: number;
				validator: (value: number) => boolean;
			};
		}>> & Readonly<{}>, {
			size: number;
			color: string;
		}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	function ensureCallIconSprite(): void;

	const CallIconList: Set<"none" | "video" | "pause" | "play" | "microphone" | "microphone-off" | "video-off" | "chats" | "feedback" | "stop-hand" | "stop-hand-solid" | "screen-share" | "screen-share-pause" | "screen-share-off" | "record" | "record-solid" | "document" | "copilot" | "copilot-solid" | "hangup" | "person" | "person-speak" | "person-delegate" | "group" | "persons" | "expand" | "collapse" | "apps" | "setting" | "shield-checked" | "image" | "pin" | "unpin" | "more" | "chevron-up" | "chevron-right" | "chevron-down" | "chevron-left" | "alert-accent" | "clock" | "lock" | "earth-with-stop" | "flag" | "plus" | "sound-on" | "sound-off" | "check" | "trashcan" | "stop" | "cross" | "crown-solid" | "like" | "screen-phone" | "cloud" | "bulleted-list" | "magic-wand" | "text" | "create-chat" | "minus" | "rocket">;

	const CallIconColors: Set<"white" | "black" | "gray" | "yellow" | "purple" | "red" | "green">;

	const CallIconSizes: Set<14 | 16 | 20 | 40 | 22 | 12 | 18 | 24 | 26 | 28 | 30 | 32 | 48>;
}
