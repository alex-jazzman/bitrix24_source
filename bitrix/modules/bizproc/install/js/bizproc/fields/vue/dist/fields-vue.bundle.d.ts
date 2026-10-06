/* eslint-disable */
declare namespace BX.Bizproc.Fields {
	const FieldControl: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		params: {
			type: BX.Vue3.PropType<BX.Bizproc.Fields.RenderFieldParams>;
			required: true;
		};
		modelValue: {
			type: BX.Vue3.PropType<string | string[] | null>;
			default: null;
		};
		/** Channel of a caller placing a single control: the manager it already owns. */
		fieldManager: {
			type: BX.Vue3.PropType<BX.Bizproc.Fields.FieldManager | null>;
			default: null;
		};
	}>, {}, {
		manager: BX.Bizproc.Fields.FieldManager;
		ownsManager: boolean;
		fieldId: string | null;
		renderedType: string | null;
	}, {}, {
		mountField(): void;
		/** Draws the field anew where the property changed into another type - see the params watcher. */
		remountField(): void;
		handleChange(): void;
	}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, "update:modelValue"[], "update:modelValue", BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		params: {
			type: BX.Vue3.PropType<BX.Bizproc.Fields.RenderFieldParams>;
			required: true;
		};
		modelValue: {
			type: BX.Vue3.PropType<string | string[] | null>;
			default: null;
		};
		/** Channel of a caller placing a single control: the manager it already owns. */
		fieldManager: {
			type: BX.Vue3.PropType<BX.Bizproc.Fields.FieldManager | null>;
			default: null;
		};
	}>> & Readonly<{
		"onUpdate:modelValue"?: ((...args: any[]) => any) | undefined;
	}>, {
		modelValue: string | string[] | null;
		fieldManager: BX.Bizproc.Fields.FieldManager | null;
	}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
}
