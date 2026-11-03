import { Loader } from 'main.loader';

type Spinner = {
	show: (target: HTMLElement) => unknown,
	destroy: () => void,
};

/**
 * The wait of a control which cannot answer at once - an action which asks the server, or one whose
 * part of the design system is still on its way. The spinner is laid over the control itself: nothing
 * is replaced in the page, so the control keeps its place in the tab order and the focus on it.
 *
 * One instance serves one control at a time, the way the header carries out one action at a time.
 */
export class ButtonSpinner
{
	#loader: Spinner | null = null;

	showOver(target: HTMLElement): void
	{
		this.#loader ??= new Loader({
			size: 20,
			color: 'var(--ui-color-accent-main-primary)',
			strokeWidth: 2,
		}) as unknown as Spinner;

		void this.#loader.show(target);
	}

	destroy(): void
	{
		this.#loader?.destroy();
		this.#loader = null;
	}
}
