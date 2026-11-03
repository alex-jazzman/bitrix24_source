import { Event, Type } from 'main.core';
import { DocumentHeader } from 'disk.document-header';
import SaveAdapter from './save-adapter';

/** The container of the boost button the header expects; the board carries no boosts, so it stays empty. */
const BOOST_BUTTON_CONTAINER_ID = 'flipchart-boost-button-container';

/** The node the board is opened in: the SDK puts the frame of the board inside it. */
const DEFAULT_BOARD_CONTAINER_ID = 'flipchart-editor';

/** Messages the board posts to the page it is opened on. */
const BoardMessage = Object.freeze({
	Renamed: 'successBoardRenamed',
});

export default class Board
{
	saveAdapter: SaveAdapter = null;
	documentHeader: ?DocumentHeader = null;
	documentSessionHash: string = '';
	boardContainerId: string = DEFAULT_BOARD_CONTAINER_ID;

	constructor(options)
	{
		this.saveAdapter = new SaveAdapter();

		this.mountDocumentHeader(options);
	}

	/**
	 * The header of the opened board. It draws itself from the composition the server describes, and
	 * the page has nothing to do after the mount. Until the shell of the page renders the container,
	 * the page works without a header - and keeps the name synchronisation of the board it has today,
	 * which the same phase of the page takes away together with the old markup.
	 */
	mountDocumentHeader(options): void
	{
		if (!Type.isElementNode(options.headerContainerNode))
		{
			return;
		}

		this.documentSessionHash = Type.isStringFilled(options.documentSessionHash)
			? options.documentSessionHash
			: ''
		;

		if (Type.isStringFilled(options.boardContainerId))
		{
			this.boardContainerId = options.boardContainerId;
		}

		this.documentHeader = this.createDocumentHeader(options.headerContainerNode, {
			documentSessionHash: this.documentSessionHash,
			adapter: this.saveAdapter,
			boostContainerId: BOOST_BUTTON_CONTAINER_ID,
			logoUrl: Type.isString(options.logoUrl) ? options.logoUrl : '',
			// the board is opened in the mode it was opened in: there is no transition to editing
			editUrl: '',
			sessionBoost: null,
			shouldShowPromoImmediately: false,
			composition: options.headerComposition ?? null,
		});

		// a header which was not given the opening it belongs to reports so itself and draws nothing;
		// what the board says would then have nowhere to go
		if (this.documentSessionHash !== '')
		{
			Event.bind(window, 'message', this.handleBoardMessage);
			Event.bind(window, 'beforeunload', this.destroy);
		}
	}

	/** Which header the opening gets is decided in one place of its own. */
	createDocumentHeader(container: HTMLElement, context): DocumentHeader
	{
		return new DocumentHeader(container, context);
	}

	/**
	 * The page of the board is left behind together with the board: the header is unmounted and what
	 * the board says is no longer listened to, the way both neighbouring shells take themselves down.
	 */
	destroy = (): void => {
		Event.unbind(window, 'message', this.handleBoardMessage);
		Event.unbind(window, 'beforeunload', this.destroy);

		const header = this.documentHeader;
		this.documentHeader = null;
		header?.unmount();
	};

	/**
	 * The board talks to the page from its own frame, and anything else on the page can post the very
	 * same message: what the board says is accepted only from the frame it was opened in.
	 */
	handleBoardMessage = (event: MessageEvent): void => {
		if (!this.isSentByBoard(event))
		{
			return;
		}

		if (event.data?.event === BoardMessage.Renamed)
		{
			void this.applyNameFromBoard(event.data?.data?.name);
		}
	};

	isSentByBoard(event: MessageEvent): boolean
	{
		const frame = document.getElementById(this.boardContainerId)?.querySelector('iframe');

		return Boolean(frame) && event.source === frame.contentWindow;
	}

	/**
	 * The board was renamed on its own side, so the object is renamed after it: the name goes to the
	 * server through the header, which renames by the same action and shows what was stored. The
	 * extension of the object is none of the concern of the board - the server keeps it.
	 */
	async applyNameFromBoard(name: string): Promise<void>
	{
		if (!Type.isStringFilled(name))
		{
			return;
		}

		await this.documentHeader?.rename(name);
	}
}
