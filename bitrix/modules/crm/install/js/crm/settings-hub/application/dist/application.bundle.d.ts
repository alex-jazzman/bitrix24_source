/* eslint-disable */
type SettingId = string;

type ConfigTarget = Readonly<{
	type: 'url';
	href: string;
}> | Readonly<{
	type: 'helper';
	id: string;
}> | Readonly<{
	type: 'unavailable';
}>;

type SettingRowAction = ConfigTarget | MatrixSettingAction;

type MatrixSettingAction = Readonly<{
	type: 'matrix';
	settingId: SettingId;
}>;

declare namespace BX.Crm.SettingsHub.Application {
	class App {
		static start(container: HTMLElement, bootstrap: unknown): void;
		static stop(): void;
	}

	const CrmSettingsHubSidePanelLink: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		settingId: {
			type: BX.Vue3.PropType<SettingId>;
			required: true;
		};
		navigationId: {
			type: StringConstructor;
			required: true;
		};
		title: {
			type: StringConstructor;
			required: true;
		};
		description: {
			type: StringConstructor;
			default: string;
		};
	}>, Object, {}, {}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, "activate"[], "activate", BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		settingId: {
			type: BX.Vue3.PropType<SettingId>;
			required: true;
		};
		navigationId: {
			type: StringConstructor;
			required: true;
		};
		title: {
			type: StringConstructor;
			required: true;
		};
		description: {
			type: StringConstructor;
			default: string;
		};
	}>> & Readonly<{
		onActivate?: ((...args: any[]) => any) | undefined;
	}>, {
		description: string;
	}, {}, {
		CrmSettingsHubConfigSettingView: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
			settingId: {
				type: BX.Vue3.PropType<SettingId>;
				required: true;
			};
			title: {
				type: StringConstructor;
				required: true;
			};
			description: {
				type: StringConstructor;
				default: string;
			};
			target: {
				type: BX.Vue3.PropType<ConfigTarget | null>;
				default: null;
			};
		}>, Object, {}, {
			titleId(): string;
		}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, "activate"[], "activate", BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
			settingId: {
				type: BX.Vue3.PropType<SettingId>;
				required: true;
			};
			title: {
				type: StringConstructor;
				required: true;
			};
			description: {
				type: StringConstructor;
				default: string;
			};
			target: {
				type: BX.Vue3.PropType<ConfigTarget | null>;
				default: null;
			};
		}>> & Readonly<{
			onActivate?: ((...args: any[]) => any) | undefined;
		}>, {
			target: ConfigTarget | null;
			description: string;
		}, {}, {
			CrmSettingsHubSettingField: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
				title: {
					type: StringConstructor;
					required: true;
				};
				description: {
					type: StringConstructor;
					default: string;
				};
				titleId: {
					type: StringConstructor;
					default: string;
				};
				showChevron: {
					type: BooleanConstructor;
					default: boolean;
				};
				unavailable: {
					type: BooleanConstructor;
					default: boolean;
				};
			}>, Object, {}, {
				hasControl(): boolean;
				unavailableTestId(): string | null;
			}, {}, {
				methods: {
					loc(name: string, replacements?: {
						[key: string]: string;
					}): string;
				};
			}, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
				title: {
					type: StringConstructor;
					required: true;
				};
				description: {
					type: StringConstructor;
					default: string;
				};
				titleId: {
					type: StringConstructor;
					default: string;
				};
				showChevron: {
					type: BooleanConstructor;
					default: boolean;
				};
				unavailable: {
					type: BooleanConstructor;
					default: boolean;
				};
			}>> & Readonly<{}>, {
				unavailable: boolean;
				titleId: string;
				description: string;
				showChevron: boolean;
			}, {}, {
				BIcon: {
					props: {
						name: {
							type: StringConstructor;
							required: boolean;
							validator(value: string): boolean;
						};
						color: {
							type: StringConstructor;
							required: boolean;
							default: null;
						};
						size: {
							type: NumberConstructor;
							required: boolean;
							default: null;
						};
						hoverable: {
							type: BooleanConstructor;
							default: boolean;
						};
						hoverableAlt: {
							type: BooleanConstructor;
							default: boolean;
						};
						responsive: {
							type: BooleanConstructor;
							default: boolean;
						};
					};
					computed: {
						className(): string[];
						hoverableClassnameModifier(): string;
						responsiveClassnameModifier(): string;
						inlineSize(): string;
						inlineColor(): string;
						inlineStyle(): string;
					};
					template: string;
				};
				UiLabel: {
					name: string;
					props: {
						size: {
							type: StringConstructor;
							required: boolean;
							default: "md";
							validator: (value: any) => boolean;
						};
						style: {
							type: StringConstructor;
							required: boolean;
							default: "filled";
							validator: (value: any) => boolean;
						};
						bordered: {
							type: BooleanConstructor;
							required: boolean;
							default: boolean;
						};
						value: {
							type: StringConstructor;
							default: string;
						};
						icon: {
							type: StringConstructor;
							required: boolean;
							default: string;
							validator: (value: any) => boolean;
						};
					};
					watch: {
						value(newValue: string): void;
						size(newSize: string): void;
						style(newStyle: string): void;
						bordered(flag: boolean): void;
						icon(iconName: string): void;
					};
					beforeMount(): void;
					unmount(): void;
					mounted(): void;
					template: string;
				};
			}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
			CrmSettingsHubSettingRow: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
				action: {
					type: BX.Vue3.PropType<SettingRowAction | null>;
					default: null;
				};
				disabled: {
					type: BooleanConstructor;
					default: boolean;
				};
			}>, {}, {}, {
				actionTestId(): string | null;
				isFollowable(): boolean;
				actionAttributes(): Record<string, string | number>;
				actionListeners(): Readonly<{
					click: (event: MouseEvent) => void;
					keydown: (event: KeyboardEvent) => void;
				}> | Record<string, never>;
			}, {
				handleClick(event: MouseEvent): void;
				handleKeydown(event: KeyboardEvent): void;
				isNestedControl(event: Event): boolean;
				emitAction(): void;
			}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, "activate"[], "activate", BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
				action: {
					type: BX.Vue3.PropType<SettingRowAction | null>;
					default: null;
				};
				disabled: {
					type: BooleanConstructor;
					default: boolean;
				};
			}>> & Readonly<{
				onActivate?: ((...args: any[]) => any) | undefined;
			}>, {
				action: SettingRowAction | null;
				disabled: boolean;
			}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
		}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
}
