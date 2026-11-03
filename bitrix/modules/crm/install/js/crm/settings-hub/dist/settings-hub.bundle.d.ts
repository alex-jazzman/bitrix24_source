/* eslint-disable */
type HubSectionDescriptor = {
	id: string;
	title: string;
	hideTitle?: boolean;
};

type SettingsRecord = ScalarRecord | ArrayRecord | RelationRecord | NavigationRecord;

type ScalarRecord = BaseRecord & {
	kind: 'scalar';
	valueKey: string;
	description?: string;
	field?: FieldDescriptor;
};

type BaseRecord = {
	id: string;
	sectionId: string;
	controlType: string;
	title: string;
	availableFromStep: AvailableStep;
	legacyBinding?: LegacyBinding;
	disabled?: DisabledDescriptor;
};

type AvailableStep = 1 | 2;

type LegacyBinding = {
	name?: string;
	dataName?: string;
	dataRole?: string;
	switcherId?: string;
};

type DisabledDescriptor = {
	condition: string;
	reasonSource: string;
};

type FieldDescriptor = {
	inputType?: 'text' | 'number';
	min?: number;
	max?: number;
};

type ArrayRecord = BaseRecord & {
	kind: 'array';
	itemsKey: string;
	itemIdKey: string;
	itemTitleKey: string;
	itemValueKey: string;
};

type RelationRecord = BaseRecord & {
	kind: 'relation';
	source: RelationSource;
	selector: RelationSelector;
	direction?: RelationDirection;
	adapterKey: string;
};

type RelationSource = {
	availableItemsKey?: string;
	selectedItemsKey: string;
};

type RelationSelector = {
	entityType: string;
	filterKey?: string;
	multiple: boolean;
};

type RelationDirection = 'parent' | 'child';

type NavigationRecord = BaseRecord & {
	kind: 'navigation';
	actionKey: string;
};

type DisabledState = {
	isDisabled: boolean;
	reason: string;
};

type HubDescriptionEdit = {
	value: string;
	caret: number;
};

type BaseButtonOptions = unknown;

type ButtonCounterOptions = unknown;

type ButtonCounterOptions = {
	color: string | null;
	style: CounterStyle | null;
	value: number | null;
	maxValue: number | null;
	useSymbolPercent?: boolean | undefined;
};

type ButtonOptions = unknown;

type SystemMenuOptions = unknown;

type SwitcherOptions = {
	attributeName?: string;
	node?: HTMLElement;
	id?: string | number;
	checked?: boolean;
	inputName?: string;
	handlers?: SwitcherHandlers;
	size?: BX.Crm.SettingsHub.SwitcherSize;
	color?: BX.Crm.SettingsHub.SwitcherColor;
	disabled?: boolean;
	useAirDesign?: boolean;
	style?: BX.Crm.SettingsHub.AirSwitcherStyle;
	showStateTitle?: boolean;
	accessible?: boolean;
	ariaLabel?: string;
	ariaLabelledBy?: string;
};

type SwitcherHandlers = {
	toggled?: SwitcherEventHandler;
	checked?: SwitcherEventHandler;
	unchecked?: SwitcherEventHandler;
	lock?: SwitcherEventHandler;
	unlock?: SwitcherEventHandler;
};

type SwitcherEventHandler = (this: BX.Crm.SettingsHub.Switcher, event?: SwitcherEvent) => void;

type SwitcherEventName = keyof SwitcherHandlers;

/**
 * A handler gets the native pointer event when the switch was clicked, and a bare `{}` when
 * the state was changed programmatically. Consumers call stopPropagation() on it, so the type
 * has to keep that reachable while staying optional for the programmatic path.
 */
type SwitcherEvent = Partial<Pick<Event, 'stopPropagation' | 'preventDefault' | 'target'>>;

type SwitcherSize = typeof BX.Crm.SettingsHub.SwitcherSize[keyof typeof BX.Crm.SettingsHub.SwitcherSize];

type SwitcherColor = typeof BX.Crm.SettingsHub.SwitcherColor[keyof typeof BX.Crm.SettingsHub.SwitcherColor];

type AirSwitcherStyle = typeof BX.Crm.SettingsHub.AirSwitcherStyle[keyof typeof BX.Crm.SettingsHub.AirSwitcherStyle];

type FieldInputType = 'text' | 'number';

type RecordKind = 'scalar' | 'array' | 'relation' | 'navigation';

declare namespace BX.Crm.SettingsHub {
	const CrmHubShell: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		sections: {
			type: BX.Vue3.PropType<HubSectionDescriptor[]>;
			required: true;
		};
		records: {
			type: BX.Vue3.PropType<SettingsRecord[]>;
			default: () => never[];
		};
		snapshot: {
			type: BX.Vue3.PropType<Record<string, unknown>>;
			required: true;
		};
		activeSectionId: {
			type: StringConstructor;
			required: true;
		};
		readOnly: {
			type: BooleanConstructor;
			default: boolean;
		};
		isPanelFixed: {
			type: BooleanConstructor;
			default: boolean;
		};
		controls: {
			type: BX.Vue3.PropType<Record<string, BX.Vue3.Component>>;
			default: null;
		};
	}>, {}, {}, {}, {
		recordsForSection(sectionId: string): SettingsRecord[];
		focusActiveSection(): void;
		handleUpdate(payload: {
			id: string;
			valueKey: string;
			value: unknown;
		}): void;
		handleAction(payload: {
			id: string;
			actionKey: string;
		}): void;
	}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, ("action" | "update")[], "action" | "update", BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		sections: {
			type: BX.Vue3.PropType<HubSectionDescriptor[]>;
			required: true;
		};
		records: {
			type: BX.Vue3.PropType<SettingsRecord[]>;
			default: () => never[];
		};
		snapshot: {
			type: BX.Vue3.PropType<Record<string, unknown>>;
			required: true;
		};
		activeSectionId: {
			type: StringConstructor;
			required: true;
		};
		readOnly: {
			type: BooleanConstructor;
			default: boolean;
		};
		isPanelFixed: {
			type: BooleanConstructor;
			default: boolean;
		};
		controls: {
			type: BX.Vue3.PropType<Record<string, BX.Vue3.Component>>;
			default: null;
		};
	}>> & Readonly<{
		onUpdate?: ((...args: any[]) => any) | undefined;
		onAction?: ((...args: any[]) => any) | undefined;
	}>, {
		readOnly: boolean;
		controls: Record<string, BX.Vue3.Component>;
		records: SettingsRecord[];
		isPanelFixed: boolean;
	}, {}, {
		CrmHubSection: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
			sectionId: {
				type: StringConstructor;
				required: true;
			};
			title: {
				type: StringConstructor;
				required: true;
			};
			hideTitle: {
				type: BooleanConstructor;
				default: boolean;
			};
		}>, {}, {}, {
			titleId(): string;
			testId(): string;
		}, {}, {
			methods: {
				loc(name: string, replacements?: {
					[key: string]: string;
				}): string;
			};
		}, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
			sectionId: {
				type: StringConstructor;
				required: true;
			};
			title: {
				type: StringConstructor;
				required: true;
			};
			hideTitle: {
				type: BooleanConstructor;
				default: boolean;
			};
		}>> & Readonly<{}>, {
			hideTitle: boolean;
		}, {}, {
			HeadlineXs: {
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
		}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
		CrmHubControlRenderer: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
			descriptor: {
				type: BX.Vue3.PropType<SettingsRecord>;
				required: true;
			};
			snapshot: {
				type: BX.Vue3.PropType<Record<string, unknown>>;
				required: true;
			};
			readOnly: {
				type: BooleanConstructor;
				default: boolean;
			};
			controls: {
				type: BX.Vue3.PropType<Record<string, BX.Vue3.Component>>;
				default: null;
			};
		}>, {}, {}, {
			resolvedControl(): BX.Vue3.Component | null;
			disabledState(): DisabledState;
			isDisabled(): boolean;
			reason(): string;
			description(): string;
			controlTestId(): string;
		}, {
			handleUpdate(value: unknown): void;
			handleAction(): void;
		}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, ("action" | "update")[], "action" | "update", BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
			descriptor: {
				type: BX.Vue3.PropType<SettingsRecord>;
				required: true;
			};
			snapshot: {
				type: BX.Vue3.PropType<Record<string, unknown>>;
				required: true;
			};
			readOnly: {
				type: BooleanConstructor;
				default: boolean;
			};
			controls: {
				type: BX.Vue3.PropType<Record<string, BX.Vue3.Component>>;
				default: null;
			};
		}>> & Readonly<{
			onUpdate?: ((...args: any[]) => any) | undefined;
			onAction?: ((...args: any[]) => any) | undefined;
		}>, {
			readOnly: boolean;
			controls: Record<string, BX.Vue3.Component>;
		}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	const CrmHubSection: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		sectionId: {
			type: StringConstructor;
			required: true;
		};
		title: {
			type: StringConstructor;
			required: true;
		};
		hideTitle: {
			type: BooleanConstructor;
			default: boolean;
		};
	}>, {}, {}, {
		titleId(): string;
		testId(): string;
	}, {}, {
		methods: {
			loc(name: string, replacements?: {
				[key: string]: string;
			}): string;
		};
	}, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		sectionId: {
			type: StringConstructor;
			required: true;
		};
		title: {
			type: StringConstructor;
			required: true;
		};
		hideTitle: {
			type: BooleanConstructor;
			default: boolean;
		};
	}>> & Readonly<{}>, {
		hideTitle: boolean;
	}, {}, {
		HeadlineXs: {
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
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	const CrmHubPassportCard: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		title: {
			type: StringConstructor;
			default: string;
		};
		titleLabel: {
			type: StringConstructor;
			default: string;
		};
		placeholder: {
			type: StringConstructor;
			default: string;
		};
		subtitle: {
			type: StringConstructor;
			default: string;
		};
		readOnly: {
			type: BooleanConstructor;
			default: boolean;
		};
	}>, {}, {}, {}, {
		handleTitleInput(value: string): void;
	}, {
		methods: {
			loc(name: string, replacements?: {
				[key: string]: string;
			}): string;
		};
	}, BX.Vue3.ComponentOptionsMixin, "update:title"[], "update:title", BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		title: {
			type: StringConstructor;
			default: string;
		};
		titleLabel: {
			type: StringConstructor;
			default: string;
		};
		placeholder: {
			type: StringConstructor;
			default: string;
		};
		subtitle: {
			type: StringConstructor;
			default: string;
		};
		readOnly: {
			type: BooleanConstructor;
			default: boolean;
		};
	}>> & Readonly<{
		"onUpdate:title"?: ((...args: any[]) => any) | undefined;
	}>, {
		title: string;
		placeholder: string;
		readOnly: boolean;
		titleLabel: string;
		subtitle: string;
	}, {}, {
		BInput: {
			name: string;
			components: {
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
				Chip: {
					name: string;
					components: {
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
					};
					props: {
						size: {
							type: StringConstructor;
							default: "l";
						};
						design: {
							type: StringConstructor;
							default: "outline";
						};
						icon: {
							type: StringConstructor;
							default: null;
						};
						iconColor: {
							type: StringConstructor;
							default: null;
						};
						iconBackground: {
							type: StringConstructor;
							default: null;
						};
						image: {
							type: ChipImage;
							default: null;
						};
						text: {
							type: StringConstructor;
							default: string;
						};
						rounded: {
							type: BooleanConstructor;
							default: boolean;
						};
						collapsed: {
							type: BooleanConstructor;
							default: boolean;
						};
						withClear: {
							type: BooleanConstructor;
							default: boolean;
						};
						dropdown: {
							type: BooleanConstructor;
							default: boolean;
						};
						lock: {
							type: BooleanConstructor;
							default: boolean;
						};
						compact: {
							type: BooleanConstructor;
							default: boolean;
						};
						trimmable: {
							type: BooleanConstructor;
							default: boolean;
						};
					};
					emits: string[];
					setup(): Object;
					methods: {
						handleKeydown(event: KeyboardEvent): void;
					};
					template: string;
				};
			};
			expose: string[];
			props: {
				modelValue: {
					type: StringConstructor;
					default: string;
				};
				rowsQuantity: {
					type: NumberConstructor;
					default: number;
				};
				resize: {
					type: StringConstructor;
					default: string;
					validator: (value: any) => boolean;
				};
				label: {
					type: StringConstructor;
					default: string;
				};
				labelInline: {
					type: BooleanConstructor;
					default: boolean;
				};
				placeholder: {
					type: StringConstructor;
					default: string;
				};
				error: {
					type: StringConstructor;
					default: string;
				};
				size: {
					type: StringConstructor;
					default: "l";
				};
				design: {
					type: StringConstructor;
					default: "grey";
				};
				icon: {
					type: StringConstructor;
					default: string;
				};
				chips: ChipProps[];
				center: {
					type: BooleanConstructor;
					default: boolean;
				};
				withSearch: {
					type: BooleanConstructor;
					default: boolean;
				};
				withClear: {
					type: BooleanConstructor;
					default: boolean;
				};
				dropdown: {
					type: BooleanConstructor;
					default: boolean;
				};
				clickable: {
					type: BooleanConstructor;
					default: boolean;
				};
				stretched: {
					type: BooleanConstructor;
					default: boolean;
				};
				active: {
					type: BooleanConstructor;
					default: boolean;
				};
				readonly: {
					type: BooleanConstructor;
					default: boolean;
				};
				type: {
					type: StringConstructor;
					default: string;
				};
				ariaLabel: {
					type: StringConstructor;
					default: string;
				};
				required: {
					type: BooleanConstructor;
					default: boolean;
				};
				copyable: {
					type: BooleanConstructor;
					default: boolean;
				};
			};
			emits: string[];
			setup(): Object;
			data(): Object;
			computed: {
				value: {
					get(): string;
					set(value: string): void;
				};
				disabled(): boolean;
				chipSize(): string;
				currentInputType(): string;
				passwordToggleAriaLabel(): string;
			};
			mounted(): void;
			methods: {
				focus(): void;
				handleClick(event: MouseEvent): void;
				handleFocus(event: FocusEvent): void;
				handleBlur(event: FocusEvent): void;
				togglePasswordVisibility(): void;
				handleCopy(): void;
			};
			template: string;
		};
		HeadlineMd: {
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
		TextXs: {
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
					classes(): string[];
				};
				template: string;
			};
			props: {
				size: {
					default: string;
				};
			};
		};
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	const CrmHubPassportHero: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		title: {
			type: StringConstructor;
			default: string;
		};
		titleLabel: {
			type: StringConstructor;
			default: string;
		};
		description: {
			type: StringConstructor;
			default: string;
		};
		descriptionPlaceholder: {
			type: StringConstructor;
			default: string;
		};
		icon: {
			type: StringConstructor;
			default: "o-smart-process";
		};
		locationTitle: {
			type: StringConstructor;
			default: string;
		};
		locationIcon: {
			type: StringConstructor;
			default: "o-location";
		};
		readOnly: {
			type: BooleanConstructor;
			default: boolean;
		};
		descriptionReadOnly: {
			type: BooleanConstructor;
			default: boolean;
		};
		limitDescription: {
			type: BooleanConstructor;
			default: boolean;
		};
	}>, Object, {
		isEditing: boolean;
	}, {
		titleText(): string;
	}, {
		startEdit(): void;
		startEditDescription(): void;
		openEditor(focusRef: string): void;
		primeTitleContent(): void;
		stopEdit(): void;
		handleFocusOut(): void;
		handleTitleInput(event: Event): void;
		handleTitlePaste(event: ClipboardEvent): void;
		handleDescriptionInput(value: string): void;
		resolveDescriptionField(): HTMLTextAreaElement | null;
		writeBackDescription(edit: HubDescriptionEdit): void;
		handleEditKeydown(event: KeyboardEvent): void;
		handleDescriptionKeydown(event: KeyboardEvent): void;
	}, {
		methods: {
			loc(name: string, replacements?: {
				[key: string]: string;
			}): string;
		};
	}, BX.Vue3.ComponentOptionsMixin, ("update:title" | "update:description")[], "update:title" | "update:description", BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		title: {
			type: StringConstructor;
			default: string;
		};
		titleLabel: {
			type: StringConstructor;
			default: string;
		};
		description: {
			type: StringConstructor;
			default: string;
		};
		descriptionPlaceholder: {
			type: StringConstructor;
			default: string;
		};
		icon: {
			type: StringConstructor;
			default: "o-smart-process";
		};
		locationTitle: {
			type: StringConstructor;
			default: string;
		};
		locationIcon: {
			type: StringConstructor;
			default: "o-location";
		};
		readOnly: {
			type: BooleanConstructor;
			default: boolean;
		};
		descriptionReadOnly: {
			type: BooleanConstructor;
			default: boolean;
		};
		limitDescription: {
			type: BooleanConstructor;
			default: boolean;
		};
	}>> & Readonly<{
		"onUpdate:title"?: ((...args: any[]) => any) | undefined;
		"onUpdate:description"?: ((...args: any[]) => any) | undefined;
	}>, {
		title: string;
		icon: string;
		description: string;
		readOnly: boolean;
		titleLabel: string;
		descriptionPlaceholder: string;
		locationTitle: string;
		locationIcon: string;
		descriptionReadOnly: boolean;
		limitDescription: boolean;
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
		BInput: {
			name: string;
			components: {
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
				Chip: {
					name: string;
					components: {
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
					};
					props: {
						size: {
							type: StringConstructor;
							default: "l";
						};
						design: {
							type: StringConstructor;
							default: "outline";
						};
						icon: {
							type: StringConstructor;
							default: null;
						};
						iconColor: {
							type: StringConstructor;
							default: null;
						};
						iconBackground: {
							type: StringConstructor;
							default: null;
						};
						image: {
							type: ChipImage;
							default: null;
						};
						text: {
							type: StringConstructor;
							default: string;
						};
						rounded: {
							type: BooleanConstructor;
							default: boolean;
						};
						collapsed: {
							type: BooleanConstructor;
							default: boolean;
						};
						withClear: {
							type: BooleanConstructor;
							default: boolean;
						};
						dropdown: {
							type: BooleanConstructor;
							default: boolean;
						};
						lock: {
							type: BooleanConstructor;
							default: boolean;
						};
						compact: {
							type: BooleanConstructor;
							default: boolean;
						};
						trimmable: {
							type: BooleanConstructor;
							default: boolean;
						};
					};
					emits: string[];
					setup(): Object;
					methods: {
						handleKeydown(event: KeyboardEvent): void;
					};
					template: string;
				};
			};
			expose: string[];
			props: {
				modelValue: {
					type: StringConstructor;
					default: string;
				};
				rowsQuantity: {
					type: NumberConstructor;
					default: number;
				};
				resize: {
					type: StringConstructor;
					default: string;
					validator: (value: any) => boolean;
				};
				label: {
					type: StringConstructor;
					default: string;
				};
				labelInline: {
					type: BooleanConstructor;
					default: boolean;
				};
				placeholder: {
					type: StringConstructor;
					default: string;
				};
				error: {
					type: StringConstructor;
					default: string;
				};
				size: {
					type: StringConstructor;
					default: "l";
				};
				design: {
					type: StringConstructor;
					default: "grey";
				};
				icon: {
					type: StringConstructor;
					default: string;
				};
				chips: ChipProps[];
				center: {
					type: BooleanConstructor;
					default: boolean;
				};
				withSearch: {
					type: BooleanConstructor;
					default: boolean;
				};
				withClear: {
					type: BooleanConstructor;
					default: boolean;
				};
				dropdown: {
					type: BooleanConstructor;
					default: boolean;
				};
				clickable: {
					type: BooleanConstructor;
					default: boolean;
				};
				stretched: {
					type: BooleanConstructor;
					default: boolean;
				};
				active: {
					type: BooleanConstructor;
					default: boolean;
				};
				readonly: {
					type: BooleanConstructor;
					default: boolean;
				};
				type: {
					type: StringConstructor;
					default: string;
				};
				ariaLabel: {
					type: StringConstructor;
					default: string;
				};
				required: {
					type: BooleanConstructor;
					default: boolean;
				};
				copyable: {
					type: BooleanConstructor;
					default: boolean;
				};
			};
			emits: string[];
			setup(): Object;
			data(): Object;
			computed: {
				value: {
					get(): string;
					set(value: string): void;
				};
				disabled(): boolean;
				chipSize(): string;
				currentInputType(): string;
				passwordToggleAriaLabel(): string;
			};
			mounted(): void;
			methods: {
				focus(): void;
				handleClick(event: MouseEvent): void;
				handleFocus(event: FocusEvent): void;
				handleBlur(event: FocusEvent): void;
				togglePasswordVisibility(): void;
				handleCopy(): void;
			};
			template: string;
		};
		UiButton: import("ui.vue3").BitrixVueComponentProps | {
			button: import("../../../../../../../../ui/install/js/ui/buttons/src").Button | null;
		};
		HeadlineXl: {
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
		TextXs: {
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
					classes(): string[];
				};
				template: string;
			};
			props: {
				size: {
					default: string;
				};
			};
		};
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	/**
	 * @namespace {BX.UI}
	 */
	class Button extends BaseButton {
		static BASE_CLASS: string;
		static Size: typeof ButtonSize;
		static Color: typeof ButtonColor;
		static State: typeof ButtonState;
		static Icon: typeof ButtonIcon;
		static Tag: typeof ButtonTag;
		static Style: typeof ButtonStyle;
		static AirStyle: typeof AirButtonStyle;
		constructor(options: ButtonOptions);
		isDependOnTheme: any;
		size: any;
		color: any;
		icon: any;
		state: any;
		id: string | null;
		context: any;
		menuWindow: Object | null;
		/**
		 * @protected
		 */
		protected handleMenuClick(event: MouseEvent): void;
		setText(text: string): this;
		setProps(props: {
			[propertyName: string]: string;
		}): this;
		setDataSet(props: {
			[propertyName: string]: string;
		}): this;
		setSize(size: ButtonSize | null): this;
		getSize(): ButtonSize | null;
		setColor(color: ButtonColor | null): this;
		getColor(): ButtonColor | null;
		setIcon(icon: string | null, iconPosition?: "right" | "left"): this;
		setCollapsedIcon(icon: ButtonIcon | null): this;
		getIcon(): ButtonIcon | null;
		setState(state: ButtonState | null): this;
		getState(): ButtonState | null;
		setNoCaps(noCaps?: boolean): this;
		isNoCaps(): boolean;
		setRound(round?: boolean): this;
		isRound(): boolean;
		setDependOnTheme(dependOnTheme?: boolean): this;
		setDropdown(dropdown?: boolean): this;
		isDropdown(): boolean;
		setCollapsed(collapsed?: boolean): this;
		isCollapsed(): boolean;
		setLeftCorners(withLeftCorners?: boolean): this;
		setRightCorners(withRightCorners?: boolean): this;
		/**
		 * @protected
		 */
		protected setMenu(options: BX.Main.MenuOptions): this;
		/**
		 * Sets a menu rendered by the ui.system.menu extension instead of the main.popup one.
		 * Passing false removes it, while the PHP setter takes null for that. The arrow is a caller's
		 * concern here, unlike the PHP setter, which keeps it in sync itself.
		 */
		setSystemMenu(options: SystemMenuOptions | false): this;
		/**
		 * Returns the menu instance, which is created on the first opening: the ui.system.menu class
		 * is available at runtime only. A menu that has never been opened gives null, unlike
		 * getMenuWindow(), which has its instance right after setMenu().
		 */
		getSystemMenu(): Object | null;
		/**
		 * Unlike getSystemMenu(), tells a kind of the set menu apart even before its first opening.
		 */
		hasSystemMenu(): boolean;
		getMenuBindElement(): HTMLElement;
		getMenuClickElement(): HTMLElement;
		/**
		 * @protected
		 */
		protected handleMenuShow(): void;
		/**
		 * @protected
		 */
		protected handleMenuClose(): void;
		getMenuWindow(): BX.Main.Menu | null;
		setId(id: string | null): this;
		getId(): string | null;
		setActive(active?: boolean): this;
		isActive(): boolean;
		setHovered(hovered?: boolean): this;
		isHover(): boolean;
		setDisabled(disabled?: boolean): this;
		setWaiting(waiting?: boolean): this;
		isWaiting(): boolean;
		setClocking(clocking?: boolean): this;
		isClocking(): boolean;
		/**
		 * @protected
		 */
		protected setProperty(property: string, value?: any, enumeration: Object): this;
		setContext(context: any): this;
		getContext(): any;
		setWide(isWide: boolean): this;
		isWide(): boolean;
		setStyle(style: string): void;
		getStyle(): string;
		setLeftCounter(options: BX.UI.ButtonCounterOptions | null): this;
		setRightCounter(options: BX.UI.ButtonCounterOptions | null): this;
		/**
		 * @protected
		 */
		protected prepareCounterOptions(options: BX.UI.ButtonCounterOptions | null): BX.UI.ButtonCounterOptions | null;
		startShimmer(): void;
		stopShimmer(): void;
	}

	class BaseButton {
		constructor(options: BaseButtonOptions);
		options: Object & BaseButtonOptions;
		/**
		 * 'buttonNode', 'textNode' and counterNode options use only in ButtonManager.createFromNode
		 */
		button: any;
		textNode: any;
		counterNode: any;
		text: string;
		counter: string | number | null;
		events: {};
		link: string;
		maxWidth: number | null;
		tag: ButtonTag | undefined;
		baseClass: string;
		disabled: boolean;
		/**
		 * @protected
		 */
		protected init(): void;
		setAirDesign(use: boolean): void;
		hasAirDesign(): boolean;
		/**
		 * @protected
		 */
		protected getDefaultOptions(): Object;
		render(): HTMLElement;
		renderTo(node: HTMLElement): HTMLElement;
		getContainer(): HTMLElement;
		/**
		 * @protected
		 */
		protected getBaseClass(): string;
		setText(text: string): this;
		getTextContainer(): HTMLElement;
		getText(): string;
		/**
		 * Use for buttons with air option
		 * Use only to create or delete a counter. Update counter value via getLeftCounter() method.
		 *
		 * @param options Object | null Object for creating. null for deleting.
		 */
		setLeftCounter(options: ButtonCounterOptions | null): this;
		/**
		 * Use for buttons with air option
		 * Use only to create or delete a counter. Update counter value via getRightCounter() method.
		 *
		 * @param options Object | null Object for creating. null for deleting.
		 */
		setRightCounter(options: ButtonCounterOptions | null): this;
		getLeftCounter(): ButtonCounter;
		getRightCounter(): ButtonCounter;
		/**
		 * use for old buttons (without useAirTheme option)
		 */
		setCounter(counter: number | string): this;
		getCounter(): number | string | null;
		setLink(link: string): this;
		getLink(): string;
		setMaxWidth(maxWidth: number): this;
		getMaxWidth(): number | null;
		getTag(): ButtonTag;
		setProps(props: {
			[propertyName: string]: string;
		}): this;
		getProps(): {
			[property: string]: string;
		};
		setDataSet(props: {
			[propertyName: string]: string;
		}): this;
		getDataSet(): DOMStringMap;
		addClass(className: string): this;
		removeClass(className: string): this;
		setDisabled(disabled?: boolean): this;
		isDisabled(): boolean;
		isInputType(): boolean;
		bindEvents(events: {
			[event: string]: (button: this, event: MouseEvent) => {};
		}): this;
		unbindEvents(events: string[]): this;
		bindEvent(eventName: string, fn: (button: this, event: MouseEvent) => {}): this;
		unbindEvent(eventName: string): this;
		/**
		 * @protected
		 */
		protected isEnumValue(value: any, enumeration: Object): boolean;
	}

	/**
	 * @namespace {BX.UI}
	 */
	class ButtonTag {
		static BUTTON: number;
		static LINK: number;
		static SUBMIT: number;
		static INPUT: number;
		static DIV: number;
		static SPAN: number;
	}

	class ButtonCounter {
		constructor(options: ButtonCounterOptions);
		render(): HTMLElement;
		getValue(): number;
		setValue(value: number): void;
		setColor(color: string): void;
		setStyle(style: BX.UI.CounterStyle): void;
		validateOptions(options: ButtonCounterOptions): void;
	}

	/**
	 * @namespace {BX.UI}
	 */
	class ButtonSize {
		static EXTRA_LARGE: string;
		static LARGE: string;
		static MEDIUM: string;
		static SMALL: string;
		static EXTRA_SMALL: string;
		static EXTRA_EXTRA_SMALL: string;
	}

	/**
	 * @namespace {BX.UI}
	 */
	class ButtonColor {
		static DANGER: string;
		static DANGER_DARK: string;
		static DANGER_LIGHT: string;
		static SUCCESS: string;
		static SUCCESS_DARK: string;
		static SUCCESS_LIGHT: string;
		static PRIMARY_DARK: string;
		static PRIMARY: string;
		static SECONDARY: string;
		static SECONDARY_LIGHT: string;
		static WARNING_LIGHT: string;
		static LINK: string;
		static LIGHT: string;
		static LIGHT_BORDER: string;
		static AI: string;
		static BASE_LIGHT: string;
		static COLLAB: string;
		static PRIMARY_BORDER: string;
		static CURTAIN_PRIMARY: string;
		static CURTAIN_WARNING: string;
	}

	/**
	 * @namespace {BX.UI}
	 */
	class ButtonState {
		static HOVER: string;
		static ACTIVE: string;
		static DISABLED: string;
		static CLOCKING: string;
		static WAITING: string;
		static AI_WAITING: string;
	}

	/**
	 * @namespace {BX.UI}
	 */
	class ButtonIcon {
		static UNFOLLOW: string;
		static FOLLOW: string;
		static ADD: string;
		static ADD_M: string;
		static STOP: string;
		static START: string;
		static PAUSE: string;
		static ADD_FOLDER: string;
		static SETTING: string;
		static TASK: string;
		static INFO: string;
		static SEARCH: string;
		static PRINT: string;
		static LIST: string;
		static BUSINESS: string;
		static BUSINESS_CONFIRM: string;
		static BUSINESS_WARNING: string;
		static CAMERA: string;
		static PHONE_UP: string;
		static PHONE_DOWN: string;
		static PHONE_CALL: string;
		static BACK: string;
		static REMOVE: string;
		static DOWNLOAD: string;
		static DOTS: string;
		static DONE: string;
		static CANCEL: string;
		static DISK: string;
		static LOCK: string;
		static MAIL: string;
		static CHAT: string;
		static PAGE: string;
		static CLOUD: string;
		static EDIT: string;
		static SHARE: string;
		static ANGLE_UP: string;
		static ANGLE_DOWN: string;
		static EYE_OPENED: string;
		static EYE_CLOSED: string;
		static ALERT: string;
		static FAIL: string;
		static SUCCESS: string;
		static PLAN: string;
		static TARIFF: string;
		static BATTERY: string;
		static NO_BATTERY: string;
		static HALF_BATTERY: string;
		static LOW_BATTERY: string;
		static CRIT_BATTERY: string;
		static DEMO: string;
		static ROBOTS: string;
		static NOTE: string;
		static SCRIPT: string;
		static PRINT2: string;
		static FUNNEL: string;
		static FORWARD: string;
		static COPY: string;
		static AI: string;
		static BUSINESS_NEW: string;
		static OUTLINE_ADD: string;
		static HELP: string;
		static CHECK: string;
		static CHEVRON_LEFT_S: string;
		static CHEVRON_RIGHT_S: string;
		static REFRESH: string;
		static APPS: string;
		static IMAGE: string;
		static CITY: string;
		static TWO_PERSONS: string;
		static COPILOT: string;
		static RELOAD: string;
		static WORKFLOW: string;
		static PERSON: string;
		static WORKFLOW_STOP: string;
		static MARKET: string;
		static KEY: string;
		static MAIL_PLUS: string;
		static FUNNEL_FILTER: string;
		static CALENDAR_WITH_SLOTS: string;
		static CHATS: string;
		static CALENDAR_WITH_CHECKS: string;
		static EXCLAMATION: string;
	}

	/**
	 * @namespace {BX.UI}
	 */
	class ButtonStyle {
		static NO_CAPS: string;
		static ROUND: string;
		static DROPDOWN: string;
		static COLLAPSED: string;
		static DEPEND_ON_THEME: string;
	}

	/**
	 * @namespace {BX.UI}
	 */
	class AirButtonStyle {
		static FILLED: string;
		static FILLED_WHITE: string;
		static FILLED_BITRIX_GPT: string;
		static TINTED: string;
		static TINTED_ALERT: string;
		static TINTED_BITRIX_GPT: string;
		static OUTLINE_ACCENT_1: string;
		static OUTLINE_ACCENT_2: string;
		static OUTLINE: string;
		static OUTLINE_NO_ACCENT: string;
		static OUTLINE_BITRIX_GPT: string;
		static PLAIN_ACCENT: string;
		static PLAIN: string;
		static PLAIN_NO_ACCENT: string;
		static SELECTION: string;
		static FILLED_COPILOT: string;
		static FILLED_SUCCESS: string;
		static FILLED_ALERT: string;
		static FILLED_BOOST: string;
	}

	const CrmHubCard: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		cardId: {
			type: StringConstructor;
			required: true;
		};
		title: {
			type: StringConstructor;
			default: string;
		};
		icon: {
			type: StringConstructor;
			default: string;
		};
		collapsible: {
			type: BooleanConstructor;
			default: boolean;
		};
		defaultOpen: {
			type: BooleanConstructor;
			default: boolean;
		};
	}>, {}, {
		isOpen: boolean;
	}, {
		titleId(): string;
		testId(): string;
	}, {
		toggle(): void;
		handleHeaderKeydown(event: KeyboardEvent): void;
	}, {
		methods: {
			loc(name: string, replacements?: {
				[key: string]: string;
			}): string;
		};
	}, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		cardId: {
			type: StringConstructor;
			required: true;
		};
		title: {
			type: StringConstructor;
			default: string;
		};
		icon: {
			type: StringConstructor;
			default: string;
		};
		collapsible: {
			type: BooleanConstructor;
			default: boolean;
		};
		defaultOpen: {
			type: BooleanConstructor;
			default: boolean;
		};
	}>> & Readonly<{}>, {
		title: string;
		icon: string;
		collapsible: boolean;
		defaultOpen: boolean;
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
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	const CrmHubBanner: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		tone: {
			type: StringConstructor;
			default: string;
		};
		testId: {
			type: StringConstructor;
			default: string;
		};
	}>, {}, {}, {
		isWarning(): boolean;
	}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		tone: {
			type: StringConstructor;
			default: string;
		};
		testId: {
			type: StringConstructor;
			default: string;
		};
	}>> & Readonly<{}>, {
		tone: string;
		testId: string;
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
		TextSm: {
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
					classes(): string[];
				};
				template: string;
			};
			props: {
				size: {
					default: string;
				};
			};
		};
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	const CrmHubFeatureCard: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		featureId: {
			type: StringConstructor;
			required: true;
		};
		title: {
			type: StringConstructor;
			default: string;
		};
		titleText: {
			type: StringConstructor;
			default: string;
		};
		description: {
			type: StringConstructor;
			default: string;
		};
		descriptionText: {
			type: StringConstructor;
			default: string;
		};
		icon: {
			type: StringConstructor;
			default: string;
		};
		checked: {
			type: BooleanConstructor;
			default: boolean;
		};
		disabled: {
			type: BooleanConstructor;
			default: boolean;
		};
		reason: {
			type: StringConstructor;
			default: string;
		};
	}>, Object, {}, {
		headingText(): string;
		descriptionContent(): string;
		labelId(): string;
		descriptionId(): string;
		hintId(): string;
		describedBy(): string | null;
		ariaState(): {
			role: "switch";
			ariaChecked: "true" | "false";
		};
	}, {
		handleCheck(): void;
		handleUncheck(): void;
		handleKeydown(event: KeyboardEvent): void;
		handleRowClick(event: MouseEvent): void;
	}, {
		methods: {
			loc(name: string, replacements?: {
				[key: string]: string;
			}): string;
		};
	}, BX.Vue3.ComponentOptionsMixin, "update"[], "update", BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		featureId: {
			type: StringConstructor;
			required: true;
		};
		title: {
			type: StringConstructor;
			default: string;
		};
		titleText: {
			type: StringConstructor;
			default: string;
		};
		description: {
			type: StringConstructor;
			default: string;
		};
		descriptionText: {
			type: StringConstructor;
			default: string;
		};
		icon: {
			type: StringConstructor;
			default: string;
		};
		checked: {
			type: BooleanConstructor;
			default: boolean;
		};
		disabled: {
			type: BooleanConstructor;
			default: boolean;
		};
		reason: {
			type: StringConstructor;
			default: string;
		};
	}>> & Readonly<{
		onUpdate?: ((...args: any[]) => any) | undefined;
	}>, {
		title: string;
		icon: string;
		disabled: boolean;
		checked: boolean;
		reason: string;
		description: string;
		titleText: string;
		descriptionText: string;
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
			beforeUnmount(): void;
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
		TextSm: {
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
					classes(): string[];
				};
				template: string;
			};
			props: {
				size: {
					default: string;
				};
			};
		};
		TextXs: {
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
					classes(): string[];
				};
				template: string;
			};
			props: {
				size: {
					default: string;
				};
			};
		};
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	const CrmHubOptionRow: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		rowId: {
			type: StringConstructor;
			required: true;
		};
		title: {
			type: StringConstructor;
			default: string;
		};
		description: {
			type: StringConstructor;
			default: string;
		};
		titleText: {
			type: StringConstructor;
			default: string;
		};
		descriptionText: {
			type: StringConstructor;
			default: string;
		};
		checked: {
			type: BooleanConstructor;
			default: null;
		};
		disabled: {
			type: BooleanConstructor;
			default: boolean;
		};
		last: {
			type: BooleanConstructor;
			default: boolean;
		};
		testId: {
			type: StringConstructor;
			default: string;
		};
	}>, {}, {}, {
		resolvedTitle(): string;
		resolvedDescription(): string;
		hasToggle(): boolean;
		labelId(): string;
		descriptionId(): string;
		describedBy(): string | null;
		ariaState(): {
			role: "switch";
			ariaChecked: "true" | "false";
		};
	}, {
		handleRowClick(): void;
		handleKeydown(event: KeyboardEvent): void;
		handleCheck(): void;
		handleUncheck(): void;
	}, {
		methods: {
			loc(name: string, replacements?: {
				[key: string]: string;
			}): string;
		};
	}, BX.Vue3.ComponentOptionsMixin, "update"[], "update", BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		rowId: {
			type: StringConstructor;
			required: true;
		};
		title: {
			type: StringConstructor;
			default: string;
		};
		description: {
			type: StringConstructor;
			default: string;
		};
		titleText: {
			type: StringConstructor;
			default: string;
		};
		descriptionText: {
			type: StringConstructor;
			default: string;
		};
		checked: {
			type: BooleanConstructor;
			default: null;
		};
		disabled: {
			type: BooleanConstructor;
			default: boolean;
		};
		last: {
			type: BooleanConstructor;
			default: boolean;
		};
		testId: {
			type: StringConstructor;
			default: string;
		};
	}>> & Readonly<{
		onUpdate?: ((...args: any[]) => any) | undefined;
	}>, {
		title: string;
		testId: string;
		disabled: boolean;
		last: boolean;
		checked: boolean;
		description: string;
		titleText: string;
		descriptionText: string;
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
					type: SwitcherOptions;
					default: {};
				};
			};
			switcher: null;
			mounted(): void;
			beforeUnmount(): void;
			watch: {
				isChecked(): void;
				isDisabled(): void;
				options(newOptions: any, oldOptions: any): void;
			};
			methods: {
				renderSwitcher(): void;
				isOptionsEqual(newOptions: SwitcherOptions, oldOptions: SwitcherOptions): boolean;
			};
			template: string;
		};
		TextSm: {
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
					classes(): string[];
				};
				template: string;
			};
			props: {
				size: {
					default: string;
				};
			};
		};
		TextXs: {
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
					classes(): string[];
				};
				template: string;
			};
			props: {
				size: {
					default: string;
				};
			};
		};
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	class Switcher {
		node: HTMLElement;
		checked: boolean;
		id: string | number;
		handlers: SwitcherHandlers;
		inputNode?: HTMLInputElement;
		events: Record<SwitcherEventName, SwitcherEventName>;
		static list: Switcher[];
		static className: string;
		static classNameOff: string;
		/**
		 * Switcher.
		 *
		 * @param {object} [options] - Options.
		 * @param {string} [options.attributeName] - Name of switcher attribute.
		 * @param {Element} [options.node] - Node.
		 * @param {string} [options.id] - ID.
		 * @param {123} [options.checked] - Checked.
		 * @param {string} [options.inputName] - Input name.
		 * @constructor
		 */
		constructor(options?: SwitcherOptions);
		static getById(id: string | number): Switcher | null;
		static initByClassName(): void;
		static getList(): Switcher[];
		init(options?: SwitcherOptions): void;
		/**
		 * Releases the instance. Every switcher is kept in the static list, so an owner that drops
		 * the node has to call this or the node and the handler closures stay reachable through it.
		 * Idempotent: a second call does nothing.
		 */
		destroy(): void;
		disable(disabled: boolean, fireEvents?: boolean, event?: SwitcherEvent): void;
		check(checked: boolean, fireEvents?: boolean, event?: SwitcherEvent): void;
		isDisabled(): boolean;
		isChecked(): boolean;
		toggle(event?: SwitcherEvent): void;
		setLoading(mode: boolean): void;
		isLoading(): boolean;
		setAirDesign(flag?: boolean): void;
		renderTo(targetNode: HTMLElement): void;
		getNode(): HTMLElement;
		getAttributeName(): string;
		getInputName(): string | undefined;
		setAriaLabel(value: string): void;
		getAriaLabel(): string;
		setAriaLabelledBy(value: string): void;
		getAriaLabelledBy(): string;
	}

	const SwitcherSize: {
		readonly extraLarge: "extra-large";
		readonly large: "large";
		readonly medium: "medium";
		readonly small: "small";
		readonly extraSmall: "extra-small";
		readonly extraExtraSmall: "extra-extra-small";
	};

	const SwitcherColor: {
		readonly primary: "primary";
		readonly green: "green";
	};

	const AirSwitcherStyle: {
		readonly FILLED: "FILLED";
		readonly SOLID: "SOLID";
		readonly TINTED: "TINTED";
		readonly FILLED_SUCCESS: "FILLED_SUCCESS";
		readonly FILLED_ALERT: "FILLED_ALERT";
		readonly FILLED_WARNING: "FILLED_WARNING";
		readonly FILLED_BLACK: "FILLED_BLACK";
		readonly FILLED_WHITE: "FILLED_WHITE";
		readonly FILLED_NO_ACCENT: "FILLED_NO_ACCENT";
		readonly FILLED_BITRIX_GPT: "FILLED_BITRIX_GPT";
		readonly FILLED_BOOST: "FILLED_BOOST";
		readonly TINTED_ACCENT_1: "TINTED_ACCENT_1";
		readonly TINTED_SUCCESS: "TINTED_SUCCESS";
		readonly TINTED_ALERT: "TINTED_ALERT";
		readonly TINTED_WARNING: "TINTED_WARNING";
		readonly TINTED_GREEN: "TINTED_GREEN";
		readonly TINTED_VIOLET: "TINTED_VIOLET";
		readonly TINTED_NO_ACCENT: "TINTED_NO_ACCENT";
		readonly TINTED_BITRIX_GPT: "TINTED_BITRIX_GPT";
		readonly OUTLINE: "OUTLINE";
		readonly OUTLINE_ACCENT_1: "OUTLINE_ACCENT_1";
		readonly OUTLINE_ACCENT_2: "OUTLINE_ACCENT_2";
		readonly OUTLINE_ALERT: "OUTLINE_ALERT";
		readonly OUTLINE_BOOST: "OUTLINE_BOOST";
		readonly OUTLINE_NO_ACCENT: "OUTLINE_NO_ACCENT";
		readonly OUTLINE_SUCCESS: "OUTLINE_SUCCESS";
		readonly OUTLINE_WARNING: "OUTLINE_WARNING";
		readonly OUTLINE_BITRIX_GPT: "OUTLINE_BITRIX_GPT";
		readonly SELECTION: "SELECTION";
	};

	const CrmHubSavePanel: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		isDirty: {
			type: BooleanConstructor;
			default: boolean;
		};
		isWaiting: {
			type: BooleanConstructor;
			default: boolean;
		};
		readOnly: {
			type: BooleanConstructor;
			default: boolean;
		};
	}>, Object, {}, {
		isVisible(): boolean;
	}, {
		handleSave(): void;
		handleCancel(): void;
	}, {
		methods: {
			loc(name: string, replacements?: {
				[key: string]: string;
			}): string;
		};
	}, BX.Vue3.ComponentOptionsMixin, ("cancel" | "save")[], "cancel" | "save", BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		isDirty: {
			type: BooleanConstructor;
			default: boolean;
		};
		isWaiting: {
			type: BooleanConstructor;
			default: boolean;
		};
		readOnly: {
			type: BooleanConstructor;
			default: boolean;
		};
	}>> & Readonly<{
		onCancel?: ((...args: any[]) => any) | undefined;
		onSave?: ((...args: any[]) => any) | undefined;
	}>, {
		readOnly: boolean;
		isDirty: boolean;
		isWaiting: boolean;
	}, {}, {
		UiButton: import("ui.vue3").BitrixVueComponentProps | {
			button: import("../../../../../../../../ui/install/js/ui/buttons/src").Button | null;
		};
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	const CrmHubControlRenderer: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		descriptor: {
			type: BX.Vue3.PropType<SettingsRecord>;
			required: true;
		};
		snapshot: {
			type: BX.Vue3.PropType<Record<string, unknown>>;
			required: true;
		};
		readOnly: {
			type: BooleanConstructor;
			default: boolean;
		};
		controls: {
			type: BX.Vue3.PropType<Record<string, BX.Vue3.Component>>;
			default: null;
		};
	}>, {}, {}, {
		resolvedControl(): BX.Vue3.Component | null;
		disabledState(): DisabledState;
		isDisabled(): boolean;
		reason(): string;
		description(): string;
		controlTestId(): string;
	}, {
		handleUpdate(value: unknown): void;
		handleAction(): void;
	}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, ("action" | "update")[], "action" | "update", BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		descriptor: {
			type: BX.Vue3.PropType<SettingsRecord>;
			required: true;
		};
		snapshot: {
			type: BX.Vue3.PropType<Record<string, unknown>>;
			required: true;
		};
		readOnly: {
			type: BooleanConstructor;
			default: boolean;
		};
		controls: {
			type: BX.Vue3.PropType<Record<string, BX.Vue3.Component>>;
			default: null;
		};
	}>> & Readonly<{
		onUpdate?: ((...args: any[]) => any) | undefined;
		onAction?: ((...args: any[]) => any) | undefined;
	}>, {
		readOnly: boolean;
		controls: Record<string, BX.Vue3.Component>;
	}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	const CrmHubToggleControl: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		descriptor: {
			type: BX.Vue3.PropType<ScalarRecord>;
			required: true;
		};
		snapshot: {
			type: BX.Vue3.PropType<Record<string, unknown>>;
			required: true;
		};
		disabled: {
			type: BooleanConstructor;
			default: boolean;
		};
		reason: {
			type: StringConstructor;
			default: string;
		};
		description: {
			type: StringConstructor;
			default: string;
		};
	}>, {}, {}, {
		isChecked(): boolean;
		labelId(): string;
		hintId(): string;
		descriptionId(): string;
		describedBy(): string | null;
		ariaState(): {
			role: "switch";
			ariaChecked: "true" | "false";
		};
	}, {
		handleCheck(): void;
		handleUncheck(): void;
		handleKeydown(event: KeyboardEvent): void;
	}, {
		methods: {
			loc(name: string, replacements?: {
				[key: string]: string;
			}): string;
		};
	}, BX.Vue3.ComponentOptionsMixin, "update"[], "update", BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		descriptor: {
			type: BX.Vue3.PropType<ScalarRecord>;
			required: true;
		};
		snapshot: {
			type: BX.Vue3.PropType<Record<string, unknown>>;
			required: true;
		};
		disabled: {
			type: BooleanConstructor;
			default: boolean;
		};
		reason: {
			type: StringConstructor;
			default: string;
		};
		description: {
			type: StringConstructor;
			default: string;
		};
	}>> & Readonly<{
		onUpdate?: ((...args: any[]) => any) | undefined;
	}>, {
		disabled: boolean;
		reason: string;
		description: string;
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
					type: SwitcherOptions;
					default: {};
				};
			};
			switcher: null;
			mounted(): void;
			beforeUnmount(): void;
			watch: {
				isChecked(): void;
				isDisabled(): void;
				options(newOptions: any, oldOptions: any): void;
			};
			methods: {
				renderSwitcher(): void;
				isOptionsEqual(newOptions: SwitcherOptions, oldOptions: SwitcherOptions): boolean;
			};
			template: string;
		};
		TextSm: {
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
					classes(): string[];
				};
				template: string;
			};
			props: {
				size: {
					default: string;
				};
			};
		};
		TextXs: {
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
					classes(): string[];
				};
				template: string;
			};
			props: {
				size: {
					default: string;
				};
			};
		};
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	const CrmHubFieldControl: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		descriptor: {
			type: BX.Vue3.PropType<ScalarRecord>;
			required: true;
		};
		snapshot: {
			type: BX.Vue3.PropType<Record<string, unknown>>;
			required: true;
		};
		disabled: {
			type: BooleanConstructor;
			default: boolean;
		};
		reason: {
			type: StringConstructor;
			default: string;
		};
	}>, {}, {}, {
		value(): string;
		hintId(): string;
		inputType(): FieldInputType;
	}, {
		handleInput(value: string): void;
	}, {
		methods: {
			loc(name: string, replacements?: {
				[key: string]: string;
			}): string;
		};
	}, BX.Vue3.ComponentOptionsMixin, "update"[], "update", BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		descriptor: {
			type: BX.Vue3.PropType<ScalarRecord>;
			required: true;
		};
		snapshot: {
			type: BX.Vue3.PropType<Record<string, unknown>>;
			required: true;
		};
		disabled: {
			type: BooleanConstructor;
			default: boolean;
		};
		reason: {
			type: StringConstructor;
			default: string;
		};
	}>> & Readonly<{
		onUpdate?: ((...args: any[]) => any) | undefined;
	}>, {
		disabled: boolean;
		reason: string;
	}, {}, {
		BInput: {
			name: string;
			components: {
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
				Chip: {
					name: string;
					components: {
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
					};
					props: {
						size: {
							type: StringConstructor;
							default: "l";
						};
						design: {
							type: StringConstructor;
							default: "outline";
						};
						icon: {
							type: StringConstructor;
							default: null;
						};
						iconColor: {
							type: StringConstructor;
							default: null;
						};
						iconBackground: {
							type: StringConstructor;
							default: null;
						};
						image: {
							type: ChipImage;
							default: null;
						};
						text: {
							type: StringConstructor;
							default: string;
						};
						rounded: {
							type: BooleanConstructor;
							default: boolean;
						};
						collapsed: {
							type: BooleanConstructor;
							default: boolean;
						};
						withClear: {
							type: BooleanConstructor;
							default: boolean;
						};
						dropdown: {
							type: BooleanConstructor;
							default: boolean;
						};
						lock: {
							type: BooleanConstructor;
							default: boolean;
						};
						compact: {
							type: BooleanConstructor;
							default: boolean;
						};
						trimmable: {
							type: BooleanConstructor;
							default: boolean;
						};
					};
					emits: string[];
					setup(): Object;
					methods: {
						handleKeydown(event: KeyboardEvent): void;
					};
					template: string;
				};
			};
			expose: string[];
			props: {
				modelValue: {
					type: StringConstructor;
					default: string;
				};
				rowsQuantity: {
					type: NumberConstructor;
					default: number;
				};
				resize: {
					type: StringConstructor;
					default: string;
					validator: (value: any) => boolean;
				};
				label: {
					type: StringConstructor;
					default: string;
				};
				labelInline: {
					type: BooleanConstructor;
					default: boolean;
				};
				placeholder: {
					type: StringConstructor;
					default: string;
				};
				error: {
					type: StringConstructor;
					default: string;
				};
				size: {
					type: StringConstructor;
					default: "l";
				};
				design: {
					type: StringConstructor;
					default: "grey";
				};
				icon: {
					type: StringConstructor;
					default: string;
				};
				chips: ChipProps[];
				center: {
					type: BooleanConstructor;
					default: boolean;
				};
				withSearch: {
					type: BooleanConstructor;
					default: boolean;
				};
				withClear: {
					type: BooleanConstructor;
					default: boolean;
				};
				dropdown: {
					type: BooleanConstructor;
					default: boolean;
				};
				clickable: {
					type: BooleanConstructor;
					default: boolean;
				};
				stretched: {
					type: BooleanConstructor;
					default: boolean;
				};
				active: {
					type: BooleanConstructor;
					default: boolean;
				};
				readonly: {
					type: BooleanConstructor;
					default: boolean;
				};
				type: {
					type: StringConstructor;
					default: string;
				};
				ariaLabel: {
					type: StringConstructor;
					default: string;
				};
				required: {
					type: BooleanConstructor;
					default: boolean;
				};
				copyable: {
					type: BooleanConstructor;
					default: boolean;
				};
			};
			emits: string[];
			setup(): Object;
			data(): Object;
			computed: {
				value: {
					get(): string;
					set(value: string): void;
				};
				disabled(): boolean;
				chipSize(): string;
				currentInputType(): string;
				passwordToggleAriaLabel(): string;
			};
			mounted(): void;
			methods: {
				focus(): void;
				handleClick(event: MouseEvent): void;
				handleFocus(event: FocusEvent): void;
				handleBlur(event: FocusEvent): void;
				togglePasswordVisibility(): void;
				handleCopy(): void;
			};
			template: string;
		};
		TextSm: {
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
					classes(): string[];
				};
				template: string;
			};
			props: {
				size: {
					default: string;
				};
			};
		};
		TextXs: {
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
					classes(): string[];
				};
				template: string;
			};
			props: {
				size: {
					default: string;
				};
			};
		};
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	const CrmHubTextControl: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		descriptor: {
			type: BX.Vue3.PropType<ScalarRecord>;
			required: true;
		};
		snapshot: {
			type: BX.Vue3.PropType<Record<string, unknown>>;
			required: true;
		};
		reason: {
			type: StringConstructor;
			default: string;
		};
	}>, {}, {}, {
		value(): string;
		labelId(): string;
		hintId(): string;
	}, {}, {
		methods: {
			loc(name: string, replacements?: {
				[key: string]: string;
			}): string;
		};
	}, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		descriptor: {
			type: BX.Vue3.PropType<ScalarRecord>;
			required: true;
		};
		snapshot: {
			type: BX.Vue3.PropType<Record<string, unknown>>;
			required: true;
		};
		reason: {
			type: StringConstructor;
			default: string;
		};
	}>> & Readonly<{}>, {
		reason: string;
	}, {}, {
		TextSm: {
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
					classes(): string[];
				};
				template: string;
			};
			props: {
				size: {
					default: string;
				};
			};
		};
		TextXs: {
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
					classes(): string[];
				};
				template: string;
			};
			props: {
				size: {
					default: string;
				};
			};
		};
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	const CrmHubNavigationControl: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		descriptor: {
			type: BX.Vue3.PropType<NavigationRecord>;
			required: true;
		};
		disabled: {
			type: BooleanConstructor;
			default: boolean;
		};
		reason: {
			type: StringConstructor;
			default: string;
		};
	}>, Object, {}, {
		labelId(): string;
		hintId(): string;
	}, {
		handleClick(): void;
	}, {
		methods: {
			loc(name: string, replacements?: {
				[key: string]: string;
			}): string;
		};
	}, BX.Vue3.ComponentOptionsMixin, "action"[], "action", BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		descriptor: {
			type: BX.Vue3.PropType<NavigationRecord>;
			required: true;
		};
		disabled: {
			type: BooleanConstructor;
			default: boolean;
		};
		reason: {
			type: StringConstructor;
			default: string;
		};
	}>> & Readonly<{
		onAction?: ((...args: any[]) => any) | undefined;
	}>, {
		disabled: boolean;
		reason: string;
	}, {}, {
		UiButton: import("ui.vue3").BitrixVueComponentProps | {
			button: import("../../../../../../../../ui/install/js/ui/buttons/src").Button | null;
		};
		TextSm: {
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
					classes(): string[];
				};
				template: string;
			};
			props: {
				size: {
					default: string;
				};
			};
		};
		TextXs: {
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
					classes(): string[];
				};
				template: string;
			};
			props: {
				size: {
					default: string;
				};
			};
		};
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	const SUPPLY_STEP: AvailableStep;

	const DefaultControlType: Readonly<{
		Toggle: "toggle";
		Field: "field";
		Text: "text";
		Navigation: "navigation";
	}>;

	const HUB_DESCRIPTION_MAX_LENGTH = 1000;

	function normalizeHubDescription(value: unknown): string;

	function countHubDescriptionChars(value: string): number;

	function limitHubDescriptionInput(value: string): string;

	function limitHubDescriptionEdit(previous: string, value: string, caret?: number): HubDescriptionEdit;
}
