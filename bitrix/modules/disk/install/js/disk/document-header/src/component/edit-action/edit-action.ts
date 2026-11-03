import { Dom, Loc } from 'main.core';
import { Outline } from 'ui.icon-set.api.core';
import 'ui.icon-set.outline';
import { defineComponent, inject, markRaw } from 'ui.vue3';
import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';
import { mapState } from 'ui.vue3.pinia';

import { HeaderElement } from '../../const/element';
import { EditUrlInjectionKey, ShowPromoImmediatelyInjectionKey } from '../../const/injection';
import { HeaderTestId } from '../../const/testid';
import { showPromo } from '../../feature/show-promo/show-promo';
import { startEdit } from '../../feature/start-edit/start-edit';
import { ButtonSpinner } from '../../lib/button-spinner/button-spinner';
import { type DeferredComponent, loadMenu } from '../../lib/deferred-ui/deferred-ui';
import { useCompositionStore } from '../../model/composition/composition';
import { type CompositionModel, type EditorItem } from '../../model/composition/types';

import './edit-action.css';

const EditControl = 'edit';
const EditorsControl = 'editors';
/** The menu closes on the click which reaches the document first; the same click must not reopen it. */
const ReopenGuard = 250;

/** What the menu of the design system is given, described here so it is not carried by the opening. */
type MenuItem = {
	id: string,
	title: string,
	onClick: () => void,
};

type MenuBinding = {
	bindElement: HTMLElement | null,
	items: MenuItem[],
};

type EditActionContext = {
	AirButtonStyle: typeof AirButtonStyle,
	ButtonSize: typeof ButtonSize,
	EditControl: string,
	EditIcon: string,
	EditorsControl: string,
	HeaderTestId: typeof HeaderTestId,
	editUrl: string,
	shouldShowPromoImmediately: boolean,
};

type EditActionState = {
	isMenuOpen: boolean,
	anchor: HTMLElement | null,
	closedAt: number,
	/** The menu of the design system arrives on the first opening and stays for the next ones. */
	menuComponent: DeferredComponent | null,
	isMenuLoading: boolean,
	spinner: ButtonSpinner | null,
};

/**
 * The transition to editing: the button itself and the menu of the editors next to it. The list of
 * the editors comes with the composition and is neither completed nor filtered here; an object which
 * cannot be edited carries no such element at all, so there is no inactive button to press.
 */
export const EditAction = defineComponent({
	name: 'DiskDocumentHeaderEditAction',
	components: {
		UiButton,
	},
	props: {
		/**
		 * The narrowest header keeps the button and gives up its caption; the name the control is
		 * addressed by does not depend on the width.
		 */
		showCaption: {
			type: Boolean,
			default: true,
		},
	},
	setup(): EditActionContext
	{
		return {
			AirButtonStyle,
			ButtonSize,
			EditControl,
			// the same pencil the name of the object carries, as the mockup draws them alike
			EditIcon: Outline.EDIT_L,
			EditorsControl,
			HeaderTestId,
			editUrl: inject(EditUrlInjectionKey, ''),
			shouldShowPromoImmediately: inject(ShowPromoImmediatelyInjectionKey, false),
		};
	},
	data(): EditActionState
	{
		return {
			isMenuOpen: false,
			anchor: null,
			closedAt: 0,
			menuComponent: null,
			isMenuLoading: false,
			spinner: null,
		};
	},
	computed: {
		...mapState(useCompositionStore, ['composition', 'hasElement']),
		isPresent(): boolean
		{
			return this.hasElement(HeaderElement.Edit);
		},
		editors(): EditorItem[]
		{
			return this.composition?.editors ?? [];
		},
		hasMenu(): boolean
		{
			return this.editors.length > 0;
		},
		caption(): string
		{
			return Loc.getMessage('DISK_DOCUMENT_HEADER_EDIT_ACTION') ?? '';
		},
		menuLabel(): string
		{
			return Loc.getMessage('DISK_DOCUMENT_HEADER_EDIT_MENU_ACTION') ?? '';
		},
		menuOptions(): MenuBinding
		{
			return {
				bindElement: this.anchor,
				items: this.editors.map((editor: EditorItem) => this.createMenuItem(editor)),
			};
		},
	},
	mounted(): void
	{
		this.syncButtonAttributes();
		void this.showPromoOverButton();
	},
	updated(): void
	{
		this.syncButtonAttributes();
		this.syncSpinner();
	},
	beforeUnmount(): void
	{
		this.destroySpinner();
	},
	methods: {
		createMenuItem(editor: EditorItem): MenuItem
		{
			return {
				id: editor.code,
				title: editor.name,
				onClick: () => {
					void this.startEditing(editor.code);
				},
			};
		},
		handleEdit(): void
		{
			void this.startEditing('');
		},
		/**
		 * The scenario of the restriction due right after the object was opened. It is anchored to the
		 * button of the transition, so it appears only where there is a button to press.
		 */
		showPromoOverButton(): Promise<void>
		{
			if (!this.shouldShowPromoImmediately)
			{
				return Promise.resolve();
			}

			return showPromo(this.control(EditControl));
		},
		/**
		 * The menu of the editors is not a part of the opening: it arrives with the extension of its own
		 * on the first press. The control it hangs on keeps its place while the extension is on the way,
		 * so the press does not throw the focus anywhere, and the wait is shown over that same control.
		 */
		async toggleMenu(): Promise<void>
		{
			const anchor = this.control(EditorsControl);
			if (anchor === null || performance.now() - this.closedAt < ReopenGuard || this.isMenuLoading)
			{
				return;
			}

			if (this.isMenuOpen)
			{
				this.isMenuOpen = false;

				return;
			}

			this.anchor = markRaw(anchor);

			if (this.menuComponent === null)
			{
				this.isMenuLoading = true;
				this.syncSpinner();

				const component = await loadMenu();

				this.isMenuLoading = false;
				this.menuComponent = component === null ? null : markRaw(component);
			}

			// a menu which never arrived leaves the button alive: the next press asks for it again
			if (this.menuComponent !== null)
			{
				this.isMenuOpen = true;
			}
		},
		closeMenu(): void
		{
			this.isMenuOpen = false;
			this.closedAt = performance.now();
		},
		syncSpinner(): void
		{
			const control = this.control(EditorsControl);
			if (control === null)
			{
				return;
			}

			Dom.attr(control, 'aria-busy', String(this.isMenuLoading));

			if (this.isMenuLoading)
			{
				this.spinner ??= markRaw(new ButtonSpinner());
				this.spinner.showOver(control);

				return;
			}

			this.destroySpinner();
		},
		destroySpinner(): void
		{
			this.spinner?.destroy();
			this.spinner = null;
		},
		async startEditing(editorCode: string): Promise<void>
		{
			const composition: CompositionModel | null = this.composition;
			if (composition === null)
			{
				return;
			}

			await startEdit({
				editorCode,
				editUrl: this.editUrl,
				composition,
				trigger: this.control(EditControl),
			});
		},
		control(name: string): HTMLElement | null
		{
			const node = this.$el instanceof HTMLElement
				? this.$el.querySelector(`[data-header-action="${name}"]`)
				: null
			;

			return node instanceof HTMLElement ? node : null;
		},
		/**
		 * The button of the design system takes no accessible name through its props, and the button
		 * which opens the menu shows an arrow alone - both names are put onto the rendered nodes.
		 *
		 * The menu the second button opens is told about there as well. The menu of the design system
		 * marks its own control while it is open, and it is not on the page until the first press: what
		 * the button carries by itself is what a person hears before pressing anything.
		 */
		syncButtonAttributes(): void
		{
			Dom.attr(this.control(EditControl), 'aria-label', this.caption);

			const editors = this.control(EditorsControl);

			Dom.attr(editors, 'aria-label', this.menuLabel);
			Dom.attr(editors, 'aria-haspopup', 'menu');
			Dom.attr(editors, 'aria-expanded', this.isMenuOpen ? 'true' : 'false');
		},
	},
	template: `
		<div v-if="isPresent" class="disk-document-header-edit-action">
			<UiButton
				:text="showCaption ? caption : ''"
				:leftIcon="EditIcon"
				:dataset="{ headerAction: EditControl, testid: HeaderTestId.Edit }"
				:size="ButtonSize.MEDIUM"
				:style="AirButtonStyle.FILLED"
				:removeRightCorners="hasMenu"
				@click="handleEdit"
			/>
			<UiButton
				v-if="hasMenu"
				class="disk-document-header-edit-action__menu"
				:dataset="{ headerAction: EditorsControl, testid: HeaderTestId.EditMenu }"
				:size="ButtonSize.MEDIUM"
				:style="AirButtonStyle.FILLED"
				removeLeftCorners
				dropdown
				@click="toggleMenu"
			/>
			<component :is="menuComponent" v-if="isMenuOpen" :options="menuOptions" @close="closeMenu"/>
		</div>
	`,
});
