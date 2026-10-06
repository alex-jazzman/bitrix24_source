import { Event, Loc } from 'main.core';
import { EventEmitter } from "main.core.events";
import { DirectoryMenu } from 'mail.directorymenu';

const LABELS_SLIDER_URL = '/mail/labels';
const LABELS_SECTION = 'labels';

export class LeftMenu
{
	constructor(config={
		dirsWithUnseenMailCounters: {},
		mailboxId:'',
		filterId: '',
		labelsEnabled: false,
		labels: [],
		labelScopeMailboxId: null,
		systemDirs :
		{
			spam: 'Spam',
			trash: 'Trash',
			outcome: 'Outcome',
			drafts: 'Drafts',
			inbox: 'Inbox',
		}
	})
	{
		const leftDirectoryMenuWrapper = document.querySelector('.mail-left-menu-wrapper');

		this.directoryMenu = new DirectoryMenu({
			dirsWithUnseenMailCounters: config['dirsWithUnseenMailCounters'],
			filterId: config['filterId'],
			systemDirs: config['systemDirs'],
			sortMode: config['sortMode'],
			collapsedFolders: config['collapsedFolders'],
			folderCustomOrder: config['folderCustomOrder'],
			folderDefaultOrder: config['folderDefaultOrder'],
			manualSortingAvailable: config['manualSortingAvailable'],
			mailboxId: config['mailboxId'],
			onDirectorySelect: config['onDirectorySelect'],
			listImprovementsEnabled: Boolean(config['listImprovementsEnabled']),
			favoritesLabel: config['favoritesLabel'],
			favoritesActive: Boolean(config['favoritesActive']),
			labelsEnabled: Boolean(config['labelsEnabled']),
		});

		const favoritesNode = this.directoryMenu.getFavoritesNode();
		const foldersNode = this.directoryMenu.getNode();

		// folders, then favorites, then labels when they are on
		leftDirectoryMenuWrapper.append(foldersNode);

		if (favoritesNode)
		{
			leftDirectoryMenuWrapper.append(favoritesNode);
		}

		// the drafts item is rendered on the server above the folders, and its place is under them:
		// in the block of the favorites one where there is one, right after the folders where there is not
		const draftsNode = leftDirectoryMenuWrapper.querySelector('.mail-draft-navigation');
		if (draftsNode)
		{
			(favoritesNode ?? leftDirectoryMenuWrapper).append(draftsNode);
		}

		if (config['labelsEnabled'])
		{
			this.#mountLabels(config, leftDirectoryMenuWrapper);
		}
	}

	#mountLabels(config, wrapper)
	{
		const { LabelCollection, apiClient } = BX.Mail.Label.Core;
		const { LabelsMenu } = BX.Mail.Label.Menu;

		const filter = BX.Main.filterManager.getById(config['filterId']);

		this.apiClient = apiClient;
		this.filter = filter;
		this.labelScopeMailboxId = config['labelScopeMailboxId'] ?? null;
		this.inboxPath = config['systemDirs']?.inbox ?? '';
		this.labelCollection = new LabelCollection(config['labels'] || []);
		this.labelsMenu = new LabelsMenu({
			container: wrapper,
			labels: this.labelCollection.getAll(),
			onSelect: (labelId) => this.#selectLabel(filter, labelId),
			onCreate: () => this.#openLabelsSlider(),
		});

		this.labelsMenu.render();

		// the labels live outside the folder bundle, so they join its single point of
		// switching the highlight between the sections
		this.directoryMenu.registerSection(LABELS_SECTION, {
			activate: (labelId) => this.labelsMenu.setActive(labelId),
			deactivate: () => this.labelsMenu.setActive(null),
			// Opening the drafts does not take the label out of the filter, and closing them
			// brings no apply of that filter either. Without this the highlight would go to a
			// folder while the list stays narrowed down to the label.
			claim: () => this.#activeLabelId(filter),
		});

		this.#overrideDirectorySelection(filter);

		this.filterApplyHandler = () => this.#syncActiveLabel(filter);
		EventEmitter.subscribe('BX.Main.Filter:apply', this.filterApplyHandler);

		this.labelsSliderCloseHandler = (sliderEvent) => this.#handleLabelsSliderClose(sliderEvent);
		this.labelsEventTargets = new Set([this.#getSidePanelEventTarget()]);
		if (typeof BX !== 'undefined' && BX.addCustomEvent)
		{
			this.labelsEventTargets.add(BX);
		}
		this.labelsEventTargets.forEach(
			(target) => target.addCustomEvent('SidePanel.Slider:onCloseComplete', this.labelsSliderCloseHandler),
		);

		// window.top.BX outlives this document, so its handler has to go away with the document.
		Event.bind(window, 'pagehide', this.#handlePageLeave);

		this.#restoreActiveState(config);
	}

	#handlePageLeave = () => {
		this.destroy();
	};

	destroy()
	{
		if (!this.labelsSliderCloseHandler)
		{
			return;
		}

		this.labelsEventTargets.forEach(
			(target) => target.removeCustomEvent('SidePanel.Slider:onCloseComplete', this.labelsSliderCloseHandler),
		);
		this.labelsSliderCloseHandler = null;

		EventEmitter.unsubscribe('BX.Main.Filter:apply', this.filterApplyHandler);
		this.filterApplyHandler = null;

		Event.unbind(window, 'pagehide', this.#handlePageLeave);

		this.labelsMenu?.destroy();
	}

	#getSidePanelEventTarget()
	{
		if (window.top && window.top.BX && window.top.BX.addCustomEvent)
		{
			return window.top.BX;
		}

		return BX;
	}

	#handleLabelsSliderClose(sliderEvent)
	{
		const url = sliderEvent?.getSlider?.()?.getUrl?.() ?? '';
		if (url.includes(LABELS_SLIDER_URL))
		{
			this.#refetchLabels();
			BX.Mail.Label.AssignMenu?.invalidateSharedLabels();
		}
	}

	#restoreActiveState(config)
	{
		this.#applyActiveLabel(parseInt(config['labelActiveId'], 10));
	}

	openLabelsCreation()
	{
		this.#openLabelsSlider();
	}

	#selectLabel(filter, labelId)
	{
		if (!filter)
		{
			return;
		}

		// the label is a section of its own: the screen leaves the drafts and the
		// address drops the section marker before the filter reloads the list
		BX.Mail.Home.MessageList?.hideDrafts();
		BX.Mail.Home.MessageList?.leaveFavoritesSection();

		this.#syncLabelFilterItems(filter);

		const filterApi = filter.getApi();
		filterApi.setFields({ LABEL_ID: String(labelId), DIR: '' });
		filterApi.apply();
	}

	#syncLabelFilterItems(filter)
	{
		if (!filter)
		{
			return;
		}

		const fields = filter.getParam('FIELDS');
		if (!Array.isArray(fields))
		{
			return;
		}

		const labelField = fields.find((field) => field.NAME === 'LABEL_ID');
		if (!labelField)
		{
			return;
		}

		const emptyItem = (labelField.ITEMS || []).find((item) => item.VALUE === '') ?? { NAME: '', VALUE: '' };
		labelField.ITEMS = [
			emptyItem,
			...this.labelCollection.getAll().map((label) => ({ NAME: label.name, VALUE: String(label.id) })),
		];
	}

	#overrideDirectorySelection(filter)
	{
		const originalChooseFunction = this.directoryMenu.chooseFunction.bind(this.directoryMenu);
		this.directoryMenu.chooseFunction = (path) => {
			if (filter)
			{
				filter.getApi().setFields({ LABEL_ID: '' });
			}
			originalChooseFunction(path);
		};
	}

	#syncActiveLabel(filter)
	{
		if (!filter)
		{
			return;
		}

		this.#applyActiveLabel(this.#activeLabelId(filter) ?? 0);
	}

	/** @return {?number} id of the label the filter is narrowed down to, null when it is not */
	#activeLabelId(filter)
	{
		if (!filter)
		{
			return null;
		}

		const labelId = parseInt(filter.getFilterFieldsValues()['LABEL_ID'], 10);

		return labelId > 0 ? labelId : null;
	}

	// The label state is read back from the filter, and any filter of the screen -
	// the drafts one included - reports its apply here, so the label is re-asserted
	// only while no other section owns the highlight.
	#applyActiveLabel(labelId)
	{
		if (labelId > 0)
		{
			this.directoryMenu.syncSection(LABELS_SECTION, labelId);
		}
		else
		{
			this.directoryMenu.releaseSection(LABELS_SECTION);
		}
	}

	#openLabelsSlider()
	{
		if (!BX.SidePanel)
		{
			return;
		}

		BX.SidePanel.Instance.open(`${LABELS_SLIDER_URL}?form=y`, {
			width: 680,
			cacheable: false,
		});
	}

	#refetchLabels()
	{
		this.apiClient.list(this.labelScopeMailboxId)
			.then((labels) => {
				this.labelCollection.setAll(labels);
				this.labelsMenu.setLabels(this.labelCollection.getAll());
				this.#syncLabelFilterItems(this.filter);
				this.#reassignActiveLabelIfMissing();
			})
			.catch(() => this.#notifyError());
	}

	#notifyError()
	{
		top.BX.UI.Notification.Center.notify({
			autoHideDelay: 2000,
			content: Loc.getMessage('MAIL_MESSAGE_LIST_LABELS_LOAD_ERROR'),
		});
	}

	#reassignActiveLabelIfMissing()
	{
		const activeLabelId = this.#getActiveLabelId();
		if (activeLabelId <= 0 || this.labelCollection.getById(activeLabelId))
		{
			return;
		}

		const remaining = this.labelCollection.getAll();
		if (remaining.length > 0)
		{
			this.#selectLabel(this.filter, remaining[0].id);
		}
		else
		{
			this.#selectDefaultFolder();
		}
	}

	#getActiveLabelId()
	{
		if (!this.filter)
		{
			return 0;
		}

		return parseInt(this.filter.getFilterFieldsValues()['LABEL_ID'], 10) || 0;
	}

	#selectDefaultFolder()
	{
		if (this.inboxPath)
		{
			this.directoryMenu.chooseFunction(this.inboxPath);
		}
	}
}
