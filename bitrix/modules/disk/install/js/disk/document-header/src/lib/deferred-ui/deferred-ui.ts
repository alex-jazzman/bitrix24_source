import { Runtime } from 'main.core';

/**
 * Parts of the design system no first render of the header needs. Each of them serves an action of the
 * person - the menu of the editors, the list of the present, the field of the name - and arrives with
 * the extension of its own only when such an action is taken, so the opening of an object no longer
 * carries them.
 *
 * A refusal is answered with `null`: the control which asked stays where it is, and the next attempt
 * asks again. Nothing already rendered is replaced here, so no focus moves because of a load.
 */

/** A component of the design system, as `<component :is>` takes it. */
export type DeferredComponent = Record<string, unknown>;

type MenuExtension = {
	BMenu: DeferredComponent,
};

type PopoverExtension = {
	PopoverAlignment: Record<string, string>,
	PopoverPosition: Record<string, string>,
};

type PopoverVueExtension = {
	BPopover: DeferredComponent,
};

type AvatarExtension = {
	Avatar: DeferredComponent,
};

type InputExtension = {
	BInput: DeferredComponent,
	InputDesign: Record<string, string>,
	InputSize: Record<string, string>,
};

/** The helpdesk of the portal, of which only the showing of a slider is needed here. */
export type InfoHelper = {
	show: (sliderCode: string) => void,
};

type InfoHelperExtension = {
	InfoHelper: InfoHelper,
};

export type DeferredPopover = {
	component: DeferredComponent,
	position: string,
	alignment: string,
};

export type DeferredInput = {
	component: DeferredComponent,
	size: string,
	design: string,
};

export async function loadMenu(): Promise<DeferredComponent | null>
{
	try
	{
		const extension = await Runtime.loadExtension('ui.system.menu.vue') as unknown as MenuExtension;

		return extension.BMenu;
	}
	catch
	{
		return null;
	}
}

/** The bubble of the list needs the place it is put in, and that is described by the same extension. */
export async function loadPopover(): Promise<DeferredPopover | null>
{
	try
	{
		const [placement, vue] = await Promise.all([
			Runtime.loadExtension('ui.system.popover') as unknown as Promise<PopoverExtension>,
			Runtime.loadExtension('ui.system.popover.vue') as unknown as Promise<PopoverVueExtension>,
		]);

		return {
			component: vue.BPopover,
			position: placement.PopoverPosition.Bottom,
			alignment: placement.PopoverAlignment.End,
		};
	}
	catch
	{
		return null;
	}
}

/**
 * The helpdesk is not a part of the design system, but it is asked for the same way and for the same
 * reason: it weighs about 160 KB with everything it brings along, and an opening which never runs
 * into a restriction never needs it. The pages of both office editors load it themselves; the page of
 * the board does not, and there this is the only way it arrives at all.
 */
export async function loadInfoHelper(): Promise<InfoHelper | null>
{
	try
	{
		const extension = await Runtime.loadExtension('ui.info-helper') as unknown as InfoHelperExtension;

		return extension.InfoHelper ?? null;
	}
	catch
	{
		return null;
	}
}

/**
 * The face of a participant weighs about 64 KB with the extension under it and belongs to the
 * roster alone, so an opening which draws no roster does not carry it.
 */
export async function loadAvatar(): Promise<DeferredComponent | null>
{
	try
	{
		const extension = await Runtime.loadExtension('ui.vue3.components.avatar') as unknown as AvatarExtension;

		return extension.Avatar ?? null;
	}
	catch
	{
		return null;
	}
}

export async function loadInput(): Promise<DeferredInput | null>
{
	try
	{
		const extension = await Runtime.loadExtension('ui.system.input.vue') as unknown as InputExtension;

		return {
			component: extension.BInput,
			size: extension.InputSize.Lg,
			design: extension.InputDesign.Naked,
		};
	}
	catch
	{
		return null;
	}
}
