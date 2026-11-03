import { Dom, Text } from 'main.core';
import { PopupManager } from 'main.popup';
import { FocusNavigator } from 'ui.a11y';
import {
	AirButtonStyle as AirVanillaButtonStyle,
	type ButtonOptions,
	ButtonSize as VanillaButtonSize,
} from 'ui.buttons';
import { Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';
import { LabelSize, LabelStyle } from 'ui.system.label';
import { Label as UiLabel } from 'ui.system.label.vue';
import { BMenu, type MenuItemOptions, type MenuOptions, type MenuSectionOptions } from 'ui.system.menu.vue';
import { defineComponent, nextTick } from 'ui.vue3';
import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';

import { Phrase } from '../../const';
import { loadRecentTemplates } from '../../feature/load-recent-templates/load-recent-templates';
import { openTemplateManager } from '../../feature/open-template-manager/open-template-manager';
import {
	createTemplatePreviewController,
	type TemplatePreviewController,
} from '../../feature/preview-template/preview-template';
import {
	createTemplatePreparationController,
	type TemplatePreparationController,
} from '../../feature/template-application/template-application';
import { useComposeEditor } from '../../infrastructure/adapter/editor/editor';
import { loc } from '../../lib/loc/loc';
import { useComposeState } from '../../model/compose/compose';
import {
	type PreparedTemplate,
	type TemplateListItem,
	type TemplateReference,
} from '../../model/compose/types';
import { TemplateAll } from '../template-all/template-all';
import { TemplateApplyDialog } from '../template-apply-dialog/template-apply-dialog';
import { TemplatePreview } from '../template-preview/template-preview';

import './template-picker.css';

const TestId = Object.freeze({
	picker: 'mail-template-picker',
	control: 'mail-template-picker-open',
	newLabel: 'mail-template-picker-new-label',
	retry: 'mail-template-picker-load-retry',
	applyRetry: 'mail-template-picker-apply-retry',
	allControl: 'mail-template-picker-all',
	createControl: 'mail-template-picker-create',
	configureControl: 'mail-template-picker-configure',
});

const MenuWidth = 360;

/** `main.popup` keeps a menu 11px away from the control it hangs above, hence a slightly wider gap. */
const MenuWindowGap = 16;

/** A window shorter than the menu itself gets a scrolled menu, not a sliver of one. */
const MenuMinHeight = 120;

/** Popup sections: the templates under a title, the rest behind a separator. */
const MenuSection = Object.freeze({
	Templates: 'templates',
	Actions: 'actions',
});

/**
 * `MenuItemOptions` requires every option, so only the ones filled here are picked; `ui.buttons` requires
 * the collapsed icon the same way, hence a partial set of the button options too.
 */
type TemplateMenuItem =
	Pick<MenuItemOptions, 'sectionCode'>
	& Partial<Pick<MenuItemOptions, 'id' | 'title' | 'subtitle' | 'isLocked' | 'onClick' | 'dataset'>>
	& { ariaLabel?: string, uiButtonOptions?: Partial<ButtonOptions> };

type TemplateMenuSection = Pick<MenuSectionOptions, 'code'> & Partial<Pick<MenuSectionOptions, 'title'>>;

type TemplateMenuOptions = Partial<Omit<MenuOptions, 'items' | 'sections'>> & {
	items: TemplateMenuItem[],
	sections: TemplateMenuSection[],
};

/**
 * Both lists leave the prepared template in compose state; this component is the single route from that state
 * to the application dialog.
 */
// @vue/component
export const TemplatePicker = defineComponent({
	name: 'MailComposeTemplatePicker',

	components: {
		BMenu,
		TemplateAll,
		TemplateApplyDialog,
		TemplatePreview,
		UiButton,
		UiLabel,
	},

	props: {
		menuId: {
			type: String,
			default: () => `mail-compose-templates-menu-${Text.getRandom()}`,
		},
	},

	emits: ['decision-required'],

	setup()
	{
		return {
			state: useComposeState(),
			editor: useComposeEditor(),
			controlStyle: AirButtonStyle.PLAIN_NO_ACCENT,
			controlSize: ButtonSize.SMALL,
			// No icon is specified for the control, so the template sheet of the icon set stands in.
			controlIcon: Outline.O_TEMPLATE_TASK,
			labelStyle: LabelStyle.TINTED_SUCCESS,
			labelSize: LabelSize.XS,
			testId: TestId,
		};
	},

	data(): {
		isAllShown: boolean,
		isMenuShown: boolean,
		isPreviewShown: boolean,
		previewTemplate: PreparedTemplate | null,
		previewError: boolean,
		isPreviewPending: boolean,
		previewController: TemplatePreviewController | null,
		isApplyShown: boolean,
		applicationTemplate: PreparedTemplate | null,
		selectionError: boolean,
		isSelectionPending: boolean,
		selectionController: TemplatePreparationController | null,
		}
	{
		return {
			isAllShown: false,
			isMenuShown: false,
			isPreviewShown: false,
			previewTemplate: null,
			previewError: false,
			isPreviewPending: false,
			previewController: null,
			isApplyShown: false,
			applicationTemplate: null,
			selectionError: false,
			isSelectionPending: false,
			selectionController: null,
		};
	},

	computed: {
		controlText(): string
		{
			return loc(Phrase.TemplatesButton);
		},

		newLabel(): string
		{
			return loc(Phrase.TemplatesNewLabel);
		},

		templates(): TemplateListItem[]
		{
			return this.state.templates.recent;
		},

		/**
		 * Address of the section the templates are written in. Templates belong to CRM, and the server
		 * leaves the address empty whenever the user cannot be led there: an empty one means no entry.
		 */
		managePath(): string
		{
			return this.state.paths.templatesManage;
		},

		manageItems(): TemplateMenuItem[]
		{
			if (this.managePath === '')
			{
				return [];
			}

			return [
				{
					sectionCode: MenuSection.Actions,
					uiButtonOptions: {
						useAirDesign: true,
						text: loc(Phrase.TemplatesCreateButton),
						style: AirVanillaButtonStyle.OUTLINE,
						size: VanillaButtonSize.SMALL,
						// The screen behind the button lists the same templates, hence the icon of the control.
						icon: Outline.O_TEMPLATE_TASK,
						dataset: { testid: TestId.createControl },
						// `ui.buttons` types a click handler as returning an object.
						onclick: (): {} => {
							void this.handleCreateClick();

							return {};
						},
					},
				},
				{
					sectionCode: MenuSection.Actions,
					uiButtonOptions: {
						useAirDesign: true,
						text: loc(Phrase.TemplatesConfigureButton),
						style: AirVanillaButtonStyle.OUTLINE,
						size: VanillaButtonSize.SMALL,
						// The section behind the button is where a template is written, not chosen.
						icon: Outline.SETTINGS,
						dataset: { testid: TestId.configureControl },
						onclick: (): {} => {
							this.handleConfigureClick();

							return {};
						},
					},
				},
			];
		},

		menuItems(): TemplateMenuItem[]
		{
			const items: TemplateMenuItem[] = this.templates.flatMap((template) => [
				{
					id: `template-${template.reference.source}-${template.reference.id}`,
					sectionCode: MenuSection.Templates,
					title: template.title,
					subtitle: this.subtitle(template),
					isLocked: !template.canApply,
					dataset: { testid: this.templateTestId(template.reference) },
					onClick: (): void => {
						if (template.canApply)
						{
							this.handleTemplateClick(template.reference);
						}
					},
				},
				{
					id: `preview-${template.reference.source}-${template.reference.id}`,
					sectionCode: MenuSection.Templates,
					title: loc(Phrase.TemplatePreviewButton),
					ariaLabel: `${loc(Phrase.TemplatePreviewButton)}: ${template.title}`,
					dataset: { testid: this.previewTestId(template.reference) },
					onClick: (): void => {
						this.handlePreviewClick(template.reference);
					},
				},
			]);

			if (this.state.templates.isLoading)
			{
				items.push({ sectionCode: MenuSection.Templates, title: loc(Phrase.TemplatesLoading) });
			}
			else if (this.state.templates.error)
			{
				items.push({
					sectionCode: MenuSection.Templates,
					title: loc(Phrase.TemplatesRetry),
					subtitle: loc(Phrase.TemplatesLoadError),
					dataset: { testid: TestId.retry },
					onClick: (): void => {
						this.handleRetry();
					},
				});
			}
			else if (this.state.templates.isLoaded && this.templates.length === 0)
			{
				items.push({ sectionCode: MenuSection.Templates, title: loc(Phrase.TemplatesEmpty) });
			}

			if (this.selectionError)
			{
				items.push({
					sectionCode: MenuSection.Templates,
					title: loc(Phrase.TemplatesRetry),
					subtitle: loc(Phrase.TemplateApplyError),
					dataset: { testid: TestId.applyRetry },
					onClick: (): void => {
						this.selectionController?.retry();
					},
				});
			}

			return [...items, {
				sectionCode: MenuSection.Actions,
				uiButtonOptions: {
					useAirDesign: true,
					text: loc(Phrase.TemplatesAllButton),
					style: AirVanillaButtonStyle.OUTLINE,
					size: VanillaButtonSize.SMALL,
					dataset: { testid: TestId.allControl },
					onclick: (): {} => {
						this.handleAllClick();

						return {};
					},
				},
			}, ...this.manageItems];
		},

		menuOptions(): TemplateMenuOptions
		{
			return {
				bindElement: this.getControlNode(),
				width: MenuWidth,
				// A retry offered inside the menu must not close it along with the item it stands on.
				closeOnItemClick: false,
				// The popup skips a recalculation while its bind element stands still, and the control does:
				// every recalculation asked for here follows a changed menu, not a moved control.
				bindOptions: { forceBindPosition: true },
				sections: [
					{ code: MenuSection.Templates, title: loc(Phrase.TemplatesMenuTitle) },
					{ code: MenuSection.Actions },
				],
				items: this.menuItems,
			};
		},
	},

	watch: {
		/** The menu is shown before its templates arrive, so its height is not the one it opened with. */
		menuItems(): void
		{
			this.fitMenuToWindow();
		},
	},

	mounted(): void
	{
		this.markControlAria();
	},

	beforeUnmount(): void
	{
		this.selectionController?.destroy();
		this.previewController?.destroy();
	},

	methods: {
		/**
		 * The control says it opens a menu while the menu is not there yet: `BMenu` stamps these attributes on
		 * the bind element when it opens and puts back the ones it found when it closes, so the state at rest
		 * belongs to the consumer. The attributes go on the node rather than into the markup because the
		 * rendered button of `ui.buttons` stands outside the template of its Vue wrapper.
		 */
		markControlAria(): void
		{
			const control = this.getControlNode();
			control?.setAttribute('aria-haspopup', 'menu');
			control?.setAttribute('aria-expanded', 'false');
		},

		/** The subject of the template, and the reason instead of it while the template cannot be applied. */
		subtitle(template: TemplateListItem): string
		{
			if (template.canApply)
			{
				return template.subject;
			}

			return template.disabledReason === 'CRM_CONTEXT_REQUIRED'
				? loc(Phrase.TemplateUnavailableCrmContext)
				: loc(Phrase.TemplateUnavailable);
		},

		handleControlClick(): void
		{
			if (this.isSelectionPending || this.isApplyShown)
			{
				return;
			}

			this.isMenuShown = true;
			this.markMenuItems();
			this.fitMenuToWindow();
			void loadRecentTemplates(this.state).then(this.markMenuItems);
		},

		/**
		 * The control sits at the bottom of the form, where there is no room for the menu, so the popup
		 * turns it upwards by the height it has at that moment. `updateItems` of the design system then
		 * replaces the content in place and leaves the position alone, so the loaded list used to grow
		 * past the bottom of the window. The height is capped by the room the control has around it: a
		 * list too long for that room scrolls inside the menu instead of running out of the window.
		 */
		fitMenuToWindow(): void
		{
			void nextTick((): void => {
				const control = this.getControlNode();
				const popup = PopupManager.getPopupById(this.menuId);
				if (!control || !popup?.isShown())
				{
					return;
				}

				const { top, bottom } = control.getBoundingClientRect();
				const room = Math.max(top, window.innerHeight - bottom) - MenuWindowGap;
				popup.setMaxHeight(Math.max(room, MenuMinHeight));
				popup.adjustPosition();
			});
		},

		handleTemplateClick(reference: TemplateReference): void
		{
			if (this.isSelectionPending || this.isApplyShown)
			{
				return;
			}

			this.selectionError = false;
			this.getSelectionController().select(reference);
		},

		handleAllClick(): void
		{
			if (this.isSelectionPending || this.isApplyShown)
			{
				return;
			}

			PopupManager.getPopupById(this.menuId)?.destroy();
			this.isMenuShown = false;
			this.isAllShown = true;
		},

		handleAllClose(): void
		{
			if (!this.isSelectionPending)
			{
				this.isAllShown = false;
				void nextTick((): void => {
					FocusNavigator.restoreFocus(this.getControlNode(), { preventScroll: true });
				});
			}
		},

		handleRetry(): void
		{
			void loadRecentTemplates(this.state, true).then(this.markMenuItems);
		},

		async handleCreateClick(): Promise<void>
		{
			PopupManager.getPopupById(this.menuId)?.destroy();
			this.isMenuShown = false;
			await nextTick();
			if (this.managePath !== '')
			{
				openTemplateManager({
					state: this.state,
					path: this.managePath,
					createPath: this.state.paths.templatesCreate,
					create: true,
					onRefresh: this.handleCreateClosed,
				});
			}
		},

		handleCreateClosed(): void
		{
			this.isMenuShown = true;
			this.markMenuItems();
			this.fitMenuToWindow();
		},

		handlePreviewClick(reference: TemplateReference): void
		{
			PopupManager.getPopupById(this.menuId)?.destroy();
			this.isMenuShown = false;
			this.isPreviewShown = true;
			this.previewError = false;
			this.getPreviewController().preview(reference);
		},

		handlePreviewClose(): void
		{
			this.isPreviewShown = false;
			void nextTick((): void => {
				FocusNavigator.restoreFocus(this.getControlNode(), { preventScroll: true });
			});
		},

		/**
		 * The section opens over the form, which lives in a panel of its own; the panel of the section
		 * is not cached, so a template written in it is there the next time it is opened.
		 */
		handleConfigureClick(): void
		{
			PopupManager.getPopupById(this.menuId)?.close();
			this.isMenuShown = false;
			openTemplateManager({ state: this.state, path: this.managePath, onRefresh: this.markMenuItems });
		},

		/**
		 * The section can write, change or remove a template, so the quick list is read anew instead of
		 * standing on what it loaded before; a failed request leaves the form on the list it already has.
		 */
		handleConfigureClosed(): void
		{
			void loadRecentTemplates(this.state, true).then(this.markMenuItems);
		},

		handlePreparedTemplate(): void
		{
			const template = this.state.templates.prepared;
			if (!template)
			{
				return;
			}

			this.isMenuShown = false;
			this.isAllShown = false;
			this.applicationTemplate = template;
			this.isApplyShown = true;
			this.$emit('decision-required', template);
		},

		handleApplicationClose(): void
		{
			this.isMenuShown = false;
			this.isPreviewShown = false;
			this.isApplyShown = false;
			this.applicationTemplate = null;
		},

		getPreviewController(): TemplatePreviewController
		{
			this.previewController ??= createTemplatePreviewController({
				onPendingChange: (pending): void => {
					this.isPreviewPending = pending;
				},
				onResult: (template): void => {
					this.previewTemplate = template;
					this.previewError = false;
				},
				onError: (): void => {
					this.previewError = true;
				},
			});

			return this.previewController;
		},

		getFormId(): string
		{
			return this.getControlNode()?.closest('form')?.id ?? '';
		},

		templateTestId(reference: TemplateReference): string
		{
			return `mail-template-picker-apply-${reference.source}-${reference.id}`;
		},

		previewTestId(reference: TemplateReference): string
		{
			return `mail-template-picker-preview-${reference.source}-${reference.id}`;
		},

		markMenuItems(): void
		{
			void nextTick((): void => {
				const menu = document.getElementById(this.menuId);
				const actions = menu?.querySelectorAll<HTMLElement>('.ui-popup-menu-item-action') ?? [];
				this.menuItems.forEach((item, index): void => {
					if (item.ariaLabel && actions[index])
					{
						actions[index].setAttribute('aria-label', item.ariaLabel);
					}
				});

				this.templates.forEach((template): void => {
					const apply = menu?.querySelector<HTMLElement>(
						`[data-testid="${this.templateTestId(template.reference)}"]`,
					);
					const preview = menu?.querySelector<HTMLElement>(
						`[data-testid="${this.previewTestId(template.reference)}"]`,
					);
					const applyItem = apply?.closest<HTMLElement>('.ui-popup-menu-item');
					const previewItem = preview?.closest<HTMLElement>('.ui-popup-menu-item');
					if (!apply || !preview || !applyItem || !previewItem)
					{
						return;
					}

					Dom.addClass(applyItem, 'mail-compose-template-picker__template-item');
					Dom.addClass(apply, 'mail-compose-template-picker__template-apply');
					Dom.addClass(preview, 'mail-compose-template-picker__template-preview');
					if (previewItem !== applyItem)
					{
						applyItem.append(preview);
						previewItem.remove();
					}
				});
			});
		},

		getSelectionController(): TemplatePreparationController
		{
			this.selectionController ??= createTemplatePreparationController({
				state: this.state,
				editor: this.editor,
				formId: this.getFormId(),
				onPendingChange: (isPending): void => {
					this.isSelectionPending = isPending;
					if (isPending)
					{
						this.isMenuShown = false;
						this.isAllShown = false;
						this.selectionError = false;
					}
				},
				onResult: (result): void => {
					this.selectionError = false;
					if (result.status === 'needsDecision')
					{
						this.handlePreparedTemplate();
					}
					else if (result.status === 'applied')
					{
						this.isAllShown = false;
						this.isMenuShown = false;
					}
				},
				onError: (): void => {
					this.selectionError = true;
					this.isMenuShown = true;
					this.markMenuItems();
				},
			});

			return this.selectionController;
		},

		/**
		 * The rendered button stands next to the placeholder of its Vue wrapper rather than inside it, so the
		 * popup binds to the node found by `data-testid`.
		 */
		getControlNode(): HTMLElement | null
		{
			const row = this.$refs.row as HTMLElement | undefined;

			return row?.querySelector<HTMLElement>(`[data-testid="${TestId.control}"]`) ?? null;
		},
	},

	template: `
		<div ref="row" class="mail-compose-template-picker" :data-testid="testId.picker">
			<UiButton
				:text="controlText"
				:style="controlStyle"
				:size="controlSize"
				:leftIcon="controlIcon"
				:loading="isSelectionPending"
				:disabled="isApplyShown"
				:dataset="{ testid: testId.control }"
				@click="handleControlClick"
			/>
			<UiLabel
				:value="newLabel"
				:style="labelStyle"
				:size="labelSize"
				:data-testid="testId.newLabel"
			/>
			<BMenu
				v-if="isMenuShown"
				:id="menuId"
				:options="menuOptions"
				@close="isMenuShown = false"
			/>
			<TemplateAll
				v-if="isAllShown"
				:popupId="menuId + '-all'"
				@select="handleTemplateClick"
				@close="handleAllClose"
			/>
			<TemplatePreview
				v-if="isPreviewShown"
				:template="previewTemplate"
				:isLoading="isPreviewPending"
				:hasError="previewError"
				@retry="previewController?.retry()"
				@close="handlePreviewClose"
			/>
			<TemplateApplyDialog
				v-if="isApplyShown && applicationTemplate"
				:popupId="menuId + '-apply'"
				:formId="getFormId()"
				:template="applicationTemplate"
				@close="handleApplicationClose"
			/>
		</div>
	`,
});
