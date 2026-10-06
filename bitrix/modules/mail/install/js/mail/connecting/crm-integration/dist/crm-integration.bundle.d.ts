/* eslint-disable */
type CrmIntegrationSettingsType = {
	enabled: boolean;
	sync: {
		enabled: boolean;
		periodValue: string;
	};
	incoming: {
		enabled: boolean;
		createAction: string;
	};
	outgoing: {
		enabled: boolean;
		createAction: string;
	};
	assignKnownClientEmails: boolean;
	vcf: boolean;
	source: string;
	leadCreationAddresses: string;
	responsibleQueue: ResponsibleQueueItem[];
};

type ResponsibleQueueItem = {
	id: string | number;
	entityId: string;
	name: string;
};

type SettingOption = {
	value: string;
	label: string;
};

type IndirectPhraseParts = {
	beforeText: string | null;
	afterText: string | null;
};

type CrmNoAccessHintParams = {
	text: string;
	popupOptions: {
		className: string;
		darkMode: boolean;
		offsetTop: number;
		background: string;
		padding: number;
		angle: boolean;
		targetContainer: HTMLElement;
		offsetLeft: number;
	};
};

type SettingValue = string | number;

type SettingSelectorDialogOptions = Record<string, unknown>;

type SettingSelectorInstance = {
	select(value: SettingValue): void;
	getSelected(): SettingValue | null;
	renderTo(targetContainer: Element | null | undefined): void;
	settingDialog?: SettingSelectorDialog | null;
};

type SettingSelectorDialog = {
	subscribe(eventName: string, handler: (event: SettingSelectorEvent) => void): void;
	unsubscribe(eventName: string, handler: (event: SettingSelectorEvent) => void): void;
	destroy(): void;
};

type SettingSelectorEvent = {
	getData(): {
		item: SettingSelectorItem;
	};
};

type SettingSelectorItem = {
	getId(): SettingValue;
};

type TagSelectorInstance = {
	getTags(): SelectorTag[];
	removeTag(tag: SelectorTag): void;
	addTag(tag: {
		id: string | number;
		entityId: string;
		title: string;
	}): void;
	subscribe(eventName: string, handler: () => void): void;
	getDialog(): SelectorDialog | null;
	getOuterContainer(): HTMLElement | null | undefined;
	renderTo(target: Element | null | undefined): void;
};

type SelectorTag = {
	getEntityId(): string;
	getId(): string | number;
	getTitle(): string;
};

type SelectorDialog = {
	destroy(): void;
	show(): void;
	isOpen(): boolean;
};

declare namespace BX.Mail.Connecting.CrmIntegration {
	const CrmIntegration: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		modelValue: {
			type: BX.Vue3.PropType<CrmIntegrationSettingsType>;
			required: true;
		};
		canEditCrmIntegration: {
			type: BooleanConstructor;
			default: boolean;
		};
		backgroundColor: {
			type: StringConstructor;
			default: string;
		};
		syncPeriodOptions: {
			type: BX.Vue3.PropType<SettingOption[]>;
			required: true;
		};
		entityOptions: {
			type: BX.Vue3.PropType<SettingOption[]>;
			required: true;
		};
		sourceOptions: {
			type: BX.Vue3.PropType<SettingOption[]>;
			required: true;
		};
		isEditMode: {
			type: BooleanConstructor;
			default: boolean;
		};
		showVcfOption: {
			type: BooleanConstructor;
			default: boolean;
		};
		showEnableSwitcher: {
			type: BooleanConstructor;
			default: boolean;
		};
	}>, {
		loc: typeof loc;
	}, {
		showAddressTextarea: boolean;
		crmLeadSourceDialogOptions: Record<string, unknown>;
	}, {
		localModelValue: {
			get(): CrmIntegrationSettingsType;
			set(newValue: CrmIntegrationSettingsType): void;
		};
		syncLabel(): IndirectPhraseParts;
		incomingLabel(): IndirectPhraseParts;
		outgoingLabel(): IndirectPhraseParts;
		leadSourceIncomingLabel(): IndirectPhraseParts;
		switcherOptions(): {
			size: string;
			showStateTitle: boolean;
			useAirDesign: boolean;
		};
		noAccessHintParams(): CrmNoAccessHintParams;
		normalizedSyncPeriodOptions(): SettingOption[];
		normalizedEntityOptions(): SettingOption[];
		normalizedSourceOptions(): SettingOption[];
		controlsDisabled(): boolean;
	}, {
		handleSwitcherClick(): void;
	}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, "update:modelValue"[], "update:modelValue", BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		modelValue: {
			type: BX.Vue3.PropType<CrmIntegrationSettingsType>;
			required: true;
		};
		canEditCrmIntegration: {
			type: BooleanConstructor;
			default: boolean;
		};
		backgroundColor: {
			type: StringConstructor;
			default: string;
		};
		syncPeriodOptions: {
			type: BX.Vue3.PropType<SettingOption[]>;
			required: true;
		};
		entityOptions: {
			type: BX.Vue3.PropType<SettingOption[]>;
			required: true;
		};
		sourceOptions: {
			type: BX.Vue3.PropType<SettingOption[]>;
			required: true;
		};
		isEditMode: {
			type: BooleanConstructor;
			default: boolean;
		};
		showVcfOption: {
			type: BooleanConstructor;
			default: boolean;
		};
		showEnableSwitcher: {
			type: BooleanConstructor;
			default: boolean;
		};
	}>> & Readonly<{
		"onUpdate:modelValue"?: ((...args: any[]) => any) | undefined;
	}>, {
		canEditCrmIntegration: boolean;
		backgroundColor: string;
		isEditMode: boolean;
		showVcfOption: boolean;
		showEnableSwitcher: boolean;
	}, {}, {
		Switcher: {
			name: string;
			emits: string[];
			props: {
				isChecked: {
					type: BooleanConstructor;
					required: boolean;
				};
				isDisabled: {
					type: BooleanConstructor;
					default: boolean;
				};
				options: {
					type: import("ui.switcher").SwitcherOptions;
					default: {};
				};
			};
			switcher: null;
			mounted(): void;
			watch: {
				isChecked(): void;
				isDisabled(): void;
				options(newOptions: any, oldOptions: any): void;
			};
			methods: {
				renderSwitcher(): void;
				isOptionsEqual(newOptions: import("ui.switcher").SwitcherOptions, oldOptions: import("ui.switcher").SwitcherOptions): boolean;
			};
			template: string;
		};
		BitrixSettingSelector: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
			modelValue: {
				type: BX.Vue3.PropType<string | number>;
				required: true;
			};
			options: {
				type: BX.Vue3.PropType<SettingOption[]>;
				required: true;
			};
			dialogOptions: {
				type: BX.Vue3.PropType<{
					[x: string]: unknown;
				} | null>;
				required: false;
				default: null;
			};
			dataTestId: {
				type: StringConstructor;
				default: string;
			};
			disabled: {
				type: BooleanConstructor;
				default: boolean;
			};
		}>, {}, {
			selectorInstance: {
				select(value: string | number): void;
				getSelected(): (string | number) | null;
				renderTo(targetContainer: Element | null | undefined): void;
				settingDialog?: {
					subscribe(eventName: string, handler: (event: {
						getData(): {
							item: {
								getId(): string | number;
							};
						};
					}) => void): void;
					unsubscribe(eventName: string, handler: (event: {
						getData(): {
							item: {
								getId(): string | number;
							};
						};
					}) => void): void;
					destroy(): void;
				} | null;
			} | null;
			itemOnSelectHandler: ((event: {
				getData(): {
					item: {
						getId(): string | number;
					};
				};
			}) => void) | null;
		}, {}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, "update:modelValue"[], "update:modelValue", BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
			modelValue: {
				type: BX.Vue3.PropType<string | number>;
				required: true;
			};
			options: {
				type: BX.Vue3.PropType<SettingOption[]>;
				required: true;
			};
			dialogOptions: {
				type: BX.Vue3.PropType<{
					[x: string]: unknown;
				} | null>;
				required: false;
				default: null;
			};
			dataTestId: {
				type: StringConstructor;
				default: string;
			};
			disabled: {
				type: BooleanConstructor;
				default: boolean;
			};
		}>> & Readonly<{
			"onUpdate:modelValue"?: ((...args: any[]) => any) | undefined;
		}>, {
			disabled: boolean;
			dialogOptions: {
				[x: string]: unknown;
			} | null;
			dataTestId: string;
		}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
		UserSelector: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
			modelValue: {
				type: BX.Vue3.PropType<ResponsibleQueueItem[]>;
				default: () => ResponsibleQueueItem[];
			};
			dataTestId: {
				type: StringConstructor;
				default: string;
			};
			disabled: {
				type: BooleanConstructor;
				default: boolean;
			};
		}>, {}, {
			selectorInstance: {
				getTags(): {
					getEntityId(): string;
					getId(): string | number;
					getTitle(): string;
				}[];
				removeTag(tag: {
					getEntityId(): string;
					getId(): string | number;
					getTitle(): string;
				}): void;
				addTag(tag: {
					id: string | number;
					entityId: string;
					title: string;
				}): void;
				subscribe(eventName: string, handler: () => void): void;
				getDialog(): {
					destroy(): void;
					show(): void;
					isOpen(): boolean;
				} | null;
				getOuterContainer(): HTMLElement | null | undefined;
				renderTo(target: Element | null | undefined): void;
			} | null;
		}, {}, {
			onUpdate(): void;
		}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, "update:modelValue"[], "update:modelValue", BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
			modelValue: {
				type: BX.Vue3.PropType<ResponsibleQueueItem[]>;
				default: () => ResponsibleQueueItem[];
			};
			dataTestId: {
				type: StringConstructor;
				default: string;
			};
			disabled: {
				type: BooleanConstructor;
				default: boolean;
			};
		}>> & Readonly<{
			"onUpdate:modelValue"?: ((...args: any[]) => any) | undefined;
		}>, {
			disabled: boolean;
			modelValue: ResponsibleQueueItem[];
			dataTestId: string;
		}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
		HeadlineSm: {
			extends: {
				name: string;
				inheritAttrs: boolean;
				props: {
					size: {
						type: StringConstructor;
						required: boolean;
						validator: (value: any) => boolean;
					};
					accent: {
						type: BooleanConstructor;
						default: boolean;
					};
					tag: {
						type: StringConstructor;
						default: string;
					};
					align: {
						type: StringConstructor;
						default: null;
						validator: (value: any) => boolean;
					};
					transform: {
						type: StringConstructor;
						default: null;
						validator: (value: any) => boolean;
					};
					wrap: {
						type: StringConstructor;
						default: null;
						validator: (value: any) => boolean;
					};
					className: {
						type: (ObjectConstructor | ArrayConstructor | StringConstructor)[];
						default: null;
					};
				};
				computed: {
					classes(): any[];
				};
				template: string;
			};
			props: {
				size: {
					default: string;
				};
			};
		};
	}, {
		hint: {
			mounted(element: HTMLElement, { value }: {
				value: import("ui.vue3.directives.hint").HintParams | Function;
			}): void;
			updated(element: HTMLElement, { value }: {
				value: import("ui.vue3.directives.hint").HintParams | Function;
			}): void;
			beforeUnmount(element: HTMLElement): void;
		};
	}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	function loc(phraseCode: string, replacements?: Record<string, string>): string;

	const BitrixSettingSelector: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		modelValue: {
			type: BX.Vue3.PropType<SettingValue>;
			required: true;
		};
		options: {
			type: BX.Vue3.PropType<SettingOption[]>;
			required: true;
		};
		dialogOptions: {
			type: BX.Vue3.PropType<SettingSelectorDialogOptions | null>;
			required: false;
			default: null;
		};
		dataTestId: {
			type: StringConstructor;
			default: string;
		};
		disabled: {
			type: BooleanConstructor;
			default: boolean;
		};
	}>, {}, {
		selectorInstance: SettingSelectorInstance | null;
		itemOnSelectHandler: ((event: SettingSelectorEvent) => void) | null;
	}, {}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, "update:modelValue"[], "update:modelValue", BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		modelValue: {
			type: BX.Vue3.PropType<SettingValue>;
			required: true;
		};
		options: {
			type: BX.Vue3.PropType<SettingOption[]>;
			required: true;
		};
		dialogOptions: {
			type: BX.Vue3.PropType<SettingSelectorDialogOptions | null>;
			required: false;
			default: null;
		};
		dataTestId: {
			type: StringConstructor;
			default: string;
		};
		disabled: {
			type: BooleanConstructor;
			default: boolean;
		};
	}>> & Readonly<{
		"onUpdate:modelValue"?: ((...args: any[]) => any) | undefined;
	}>, {
		disabled: boolean;
		dialogOptions: SettingSelectorDialogOptions | null;
		dataTestId: string;
	}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	const UserSelector: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		modelValue: {
			type: BX.Vue3.PropType<ResponsibleQueueItem[]>;
			default: () => ResponsibleQueueItem[];
		};
		dataTestId: {
			type: StringConstructor;
			default: string;
		};
		disabled: {
			type: BooleanConstructor;
			default: boolean;
		};
	}>, {}, {
		selectorInstance: TagSelectorInstance | null;
	}, {}, {
		onUpdate(): void;
	}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, "update:modelValue"[], "update:modelValue", BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		modelValue: {
			type: BX.Vue3.PropType<ResponsibleQueueItem[]>;
			default: () => ResponsibleQueueItem[];
		};
		dataTestId: {
			type: StringConstructor;
			default: string;
		};
		disabled: {
			type: BooleanConstructor;
			default: boolean;
		};
	}>> & Readonly<{
		"onUpdate:modelValue"?: ((...args: any[]) => any) | undefined;
	}>, {
		disabled: boolean;
		modelValue: ResponsibleQueueItem[];
		dataTestId: string;
	}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
}
