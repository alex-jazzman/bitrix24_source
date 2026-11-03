import { EventEmitter } from 'main.core.events';
import { type JsonObject } from 'main.core';
import { SidePanel } from 'main.sidepanel';

import { Messenger } from 'im.public';
import { EventType, Layout, PromoId, SystemFolderCode } from 'im.v2.const';
import { Analytics } from 'im.v2.lib.analytics';
import { FolderManager } from 'im.v2.lib.folder';
import { LayoutManager } from 'im.v2.lib.layout';
import { PromoManager } from 'im.v2.lib.promo';
import { MessengerSlider } from 'im.v2.lib.slider';
import { type ImModelFolder, type ImModelLayout } from 'im.v2.model';

import { FolderListSettings } from './components/folder-list-settings/folder-list-settings';
import { PanelItem } from './components/item';
import { OnboardingTour } from './components/onboarding-tour/onboarding-tour';
import { PANEL_TOUR_TARGET, TOUR_STEPS } from './components/onboarding-tour/steps';
import { PanelSettings } from './components/settings';
import { PanelItemMenu } from './classes/item-menu';
import { TourLauncher } from './classes/tour-launcher';
import { isItemInListView } from './functions/tour-geometry';

import './css/folder-panel.css';

const NO_TOUR_STEP = 0;

const FIRST_TOUR_STEP = 1;
const LAST_TOUR_STEP = TOUR_STEPS.length;

// @vue/component
export const FolderPanel = {
	name: 'FolderPanel',
	components: { PanelSettings, PanelItem, FolderListSettings, OnboardingTour },
	data(): JsonObject
	{
		return {
			showFolderList: false,
			tourStep: NO_TOUR_STEP,
		};
	},
	computed: {
		folderList(): ImModelFolder[]
		{
			return this.$store.getters['recent/folders/getVisibleList'];
		},
		highlightedTourTarget(): ?string
		{
			const target = TOUR_STEPS[this.tourStep - 1]?.target ?? null;
			if (target === null || target === PANEL_TOUR_TARGET)
			{
				return target;
			}

			const item = this.getFolderElement(target);
			const list = this.$refs.list;

			return item && list && isItemInListView(list, item) ? target : null;
		},
		tourAnchorElement(): ?HTMLElement
		{
			const target = this.highlightedTourTarget;
			if (target !== null && target !== PANEL_TOUR_TARGET)
			{
				return this.getFolderElement(target);
			}

			return this.getFolderElement(SystemFolderCode.all) ?? this.getFirstFolderElement();
		},
		isPanelHighlighted(): boolean
		{
			return this.highlightedTourTarget === PANEL_TOUR_TARGET;
		},
		isTourVisible(): boolean
		{
			return this.tourStep !== NO_TOUR_STEP;
		},
	},
	created()
	{
		this.itemElements = new Map();
		this.isUnmounting = false;
		this.tourLauncher = new TourLauncher();
		this.focusBeforeTour = null;

		this.contextMenuManager = new PanelItemMenu();
		this.contextMenuManager.subscribe(PanelItemMenu.events.openFolderList, this.onOpenFolderList);
	},
	mounted()
	{
		EventEmitter.subscribe(EventType.messenger.onClose, this.onMessengerClose);
		this.startTour();
	},
	beforeUnmount()
	{
		this.isUnmounting = true;
		this.tourLauncher.cancel();

		EventEmitter.unsubscribe(EventType.messenger.onClose, this.onMessengerClose);
		this.contextMenuManager.destroy();
	},
	methods: {
		openFolderLayout(layout: ImModelLayout)
		{
			const layoutManager = LayoutManager.getInstance();

			const targetLayout = layout.name === Layout.folderAll
				? layoutManager.resolveLayoutEntityId(layout)
				: layout;

			EventEmitter.emit(EventType.recent.closeNestedList);
			void layoutManager.setLayout(targetLayout);
		},
		onSelectFolder(folder: ImModelFolder)
		{
			const layout = FolderManager.getFolderLayout(folder);
			if (!layout)
			{
				return;
			}

			Analytics.getInstance().folder.onOpenFolder(folder);

			if (FolderManager.isFolderLayout(layout.name))
			{
				this.openFolderLayout(layout);

				return;
			}

			void Messenger.openNavigationItem({ id: layout.name });
		},
		onFolderContextMenu(folder: ImModelFolder, event: MouseEvent)
		{
			const context = { folderId: folder.id, folderType: folder.type, folder };
			const raisedByPointer = event.button === 2;
			const target = raisedByPointer
				? { left: event.pageX, top: event.pageY }
				: (this.itemElements.get(folder.id) ?? event.currentTarget);

			this.contextMenuManager.openMenu(context, target);
		},
		onOpenFolderList()
		{
			this.showFolderList = true;
		},
		startTour()
		{
			if (!PromoManager.getInstance().needToShow(PromoId.folderAllOnboarding))
			{
				return;
			}

			void this.tourLauncher.request(() => {
				if (
					this.isUnmounting
					|| !PromoManager.getInstance().needToShow(PromoId.folderAllOnboarding)
					|| !this.isMessengerOnTop()
				)
				{
					this.tourLauncher.finish();

					return;
				}

				this.focusBeforeTour = document.activeElement;
				this.setTourStep(FIRST_TOUR_STEP);
			});
		},
		isMessengerOnTop(): boolean
		{
			if (LayoutManager.getInstance().isEmbeddedMode())
			{
				return SidePanel.Instance.getOpenSlidersCount() === 0;
			}

			return MessengerSlider.getInstance().isFocused();
		},
		setTourStep(step: number)
		{
			this.scrollTourTargetIntoView(step);
			this.tourStep = step;

			if (step === LAST_TOUR_STEP)
			{
				this.markTourAsWatched();
			}
		},
		onTourNext()
		{
			if (this.tourStep < LAST_TOUR_STEP)
			{
				this.setTourStep(this.tourStep + 1);

				return;
			}

			this.openAllFolderSettings();
		},
		onTourPrev()
		{
			if (this.tourStep > FIRST_TOUR_STEP)
			{
				this.setTourStep(this.tourStep - 1);
			}
		},
		onTourGoto(step: number)
		{
			if (step !== this.tourStep)
			{
				this.setTourStep(step);
			}
		},
		onTourClose()
		{
			if (this.isUnmounting)
			{
				return;
			}

			if (this.isTourVisible)
			{
				this.markTourAsWatched();
			}

			this.finishTour();
		},
		onMessengerClose()
		{
			this.isUnmounting = true;
			this.hideTour();
			this.tourLauncher.cancel();
		},
		openAllFolderSettings()
		{
			// the user goes on to the settings screen rather than back to where the tour came in
			this.focusBeforeTour = null;
			this.hideTour();
			FolderManager.openAllFolderSettings();
		},
		finishTour()
		{
			this.hideTour();
			this.returnFocus();
		},
		returnFocus()
		{
			const element = this.focusBeforeTour;
			if (element && element !== document.body && element.isConnected)
			{
				element.focus();

				return;
			}

			this.$refs.container.focus();
		},
		hideTour()
		{
			this.tourStep = NO_TOUR_STEP;
			this.tourLauncher.finish();
		},
		markTourAsWatched()
		{
			void PromoManager.getInstance().markAsWatched(PromoId.folderAllOnboarding);
		},
		registerItemElement(folderId: number, item: ?Object)
		{
			if (item)
			{
				this.itemElements.set(folderId, item.$el);

				return;
			}

			this.itemElements.delete(folderId);
		},
		scrollTourTargetIntoView(step: number): void
		{
			const { target } = TOUR_STEPS[step - 1];
			const item = target === PANEL_TOUR_TARGET ? this.getFirstFolderElement() : this.getFolderElement(target);

			item?.scrollIntoView({ block: 'nearest' });
		},
		getFolderElement(code: string): ?HTMLElement
		{
			const folder = this.folderList.find((item: ImModelFolder) => item.code === code);

			return folder ? this.itemElements.get(folder.id) : null;
		},
		getFirstFolderElement(): ?HTMLElement
		{
			return this.itemElements.get(this.folderList[0]?.id);
		},
	},
	template: `
		<div class="bx-im-messenger-folder-panel__wrapper">
			<div
				class="bx-im-messenger-folder-panel__container"
				data-testid="folder-panel-container"
				tabindex="-1"
				ref="container"
			>
				<div
					class="bx-im-messenger-folder-panel__list --hidden-scroll"
					data-testid="folder-panel-list"
					ref="list"
				>
					<div
						class="bx-im-messenger-folder-panel__items"
						:class="{ 'ui-highlighter': isPanelHighlighted }"
						data-testid="folder-panel-items"
						ref="items"
					>
						<PanelItem
							v-for="folder in folderList"
							:key="folder.id"
							:item="folder"
							:highlighted="folder.code === highlightedTourTarget"
							:ref="(item) => registerItemElement(folder.id, item)"
							@click="onSelectFolder(folder)"
							@contextmenu.prevent="onFolderContextMenu(folder, $event)"
						/>
					</div>
				</div>
				<div class="bx-im-messenger-folder-panel__footer" data-testid="folder-panel-footer">
					<PanelSettings @openFolderList="onOpenFolderList" />
				</div>
			</div>
			<Transition name="bx-im-folder-list-panel">
				<FolderListSettings v-if="showFolderList" @close="showFolderList = false" />
			</Transition>
			<OnboardingTour
				v-if="isTourVisible"
				:step="tourStep"
				:bindElement="tourAnchorElement"
				:railElement="$refs.container"
				:listElement="$refs.list"
				:frameElement="isPanelHighlighted ? $refs.items : null"
				@prev="onTourPrev"
				@next="onTourNext"
				@goto="onTourGoto"
				@close="onTourClose"
			/>
		</div>
	`,
};
