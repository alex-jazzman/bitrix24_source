/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_core_events, note_sidebar, note_ui_themeContext, ui_notification, note_ui_railGeometry) {
	'use strict';

	// [API-02] Copilot chat creation, pinned in one place so the parameter names are testable.
	//
	// The type goes out as the upper-case string: im's client constant ChatType.copilot is 'copilot',
	// but CreateService runs it through #prepareType() (camel→snake, upper-case) before the request.
	// We call the action directly, without that service, so we upper-case it ourselves.
	const COPILOT_CHAT_TYPE = 'COPILOT';

	// Universal copilot role. An invalid code is NOT rejected by im — RoleManager::getValidRoleCode()
	// silently substitutes the default one — so the only way to catch a typo here is a test.
	const COPILOT_MAIN_ROLE = 'copilot_assistant';

	// No `title`: CopilotChat::generateTitle() fills in a numbered name from im's own phrases.
	// No `parentChatId`: the knowledge-base panel is not tied to a project chat.
	function buildCreateDialogConfig() {
		return {
			// The fields must sit inside `data`: BX.ajax.runAction sends exactly config.data, which is
			// also why im.v2.lib.rest rebuilds the config as { ...config, data: prepare(config.data) }.
			data: {
				fields: {
					type: COPILOT_CHAT_TYPE,
					copilotMainRole: COPILOT_MAIN_ROLE
				}
			}
		};
	}
	function buildDialogId(chatId) {
		return `chat${Number(chatId)}`;
	}

	/**
	 * Creates a fresh copilot dialog and returns its dialogId.
	 */
	async function createCopilotDialog() {
		const response = await main_core.ajax.runAction('im.v2.Chat.add', buildCreateDialogConfig());
		const chatId = Number(response?.data?.chatId ?? 0);
		if (!Number.isInteger(chatId) || chatId <= 0) {
			throw new Error('note.ai-chat: im.v2.Chat.add returned no chatId');
		}
		return buildDialogId(chatId);
	}

	const WRAPPER_EXTENSION = 'intranet.ai-chat-panel';

	// Root node of the foreign wrapper. Our only point of contact with its markup, and a knowingly
	// accepted dependency: this is where the design-system context class sits.
	const WRAPPER_ROOT_SELECTOR = '.intranet-ai-chat-panel';

	// The column follows the module theme, and so does the widget inside it. Two families: `content` is
	// the column's own surface, `edge` is what the foreign wrapper's chrome is styled against.
	const COLUMN_CONTEXT_CLASS = Object.freeze({
		[note_ui_themeContext.NoteTheme.LIGHT]: '--ui-context-content-light',
		[note_ui_themeContext.NoteTheme.DARK]: '--ui-context-content-dark'
	});
	const WIDGET_CONTEXT_CLASS = Object.freeze({
		[note_ui_themeContext.NoteTheme.LIGHT]: '--ui-context-edge-light',
		[note_ui_themeContext.NoteTheme.DARK]: '--ui-context-edge-dark'
	});

	// Our own class, deliberately not the navigation's `note-sidebar-resizing`: that one also lights up the
	// navigation grip (`sidebar.css` `.note-sidebar-resizing .sidebar-resizer::before`), so sharing it made
	// the far edge of the page look grabbed while this panel was the one being dragged.
	const RESIZING_CLASS = 'note-ai-chat-resizing';

	/**
	 * The rail column that hosts the BitrixGPT widget. Owns the intranet wrapper, the four failure
	 * paths and nothing else: whether the panel is open is the shell's state, and the panel asks the
	 * shell to close through the same public event everyone else uses (EVENT-01).
	 */
	const NoteAiChatPanelComponent = {
		name: 'NoteAiChatPanel',
		props: {
			open: {
				type: Boolean,
				default: false
			},
			// Effective navigation width — already accounts for the collapsed state.
			sidebarWidth: {
				type: Number,
				default: 0
			},
			// Region-aware product name, provided by the server. Used for the accessible name and
			// substituted into the failure notification.
			productName: {
				type: String,
				default: ''
			}
		},
		emits: ['mounted', 'geometry'],
		data() {
			return {
				// [ALG-02] Live inputs of the geometry. clientWidth, not innerWidth: the latter counts the
				// scrollbar, which would move the overlay threshold by its width.
				viewportWidth: document.documentElement.clientWidth,
				resizeRaf: 0,
				onWindowResize: null,
				// The shell reserves the rail in flow from the first frame of opening (its own placeholder
				// slides the width in, squeezing the header and the document in one motion), and this
				// component is created in the middle of that. So the column stays collapsed until the
				// widget is actually in place and then takes the width over from the placeholder in the
				// same patch — `instant` kills the transition for that one handover frame, otherwise the
				// panel would slide the same width a second time.
				widgetReady: false,
				instant: false,
				// Width asked for by the current drag; 0 means "no drag in this page life". Deliberately not
				// persisted: a reload opens the panel at PANEL_WIDTH again. Reactive because the geometry is
				// derived from it on every frame of the gesture.
				draggedWidth: 0,
				dragging: false,
				// Kept in data rather than read on render: the module theme changes at runtime, and both
				// context classes hang off it.
				theme: note_ui_themeContext.NoteThemeContext.get()
			};
		},
		created() {
			// Plain instance fields: none of them belongs in the render path, and a reactive proxy around
			// the bound handlers would break removeEventListener identity.
			// The wrapper instance MUST stay out of data(): the foreign class keeps its state in private
			// fields, and reading those through Vue's reactive proxy throws.
			this.panel = null;
			this.mountPromise = null;
			// One notification per attempt: the widget's own error event and a rejected mount() can
			// describe the same failure.
			this.failed = false;
			this.enterRaf = 0;
			this.unsubscribeTheme = null;
			this.dragStartX = 0;
			this.dragStartWidth = 0;
			this.pendingWidth = 0;
			this.dragRaf = 0;
			this.onDragMove = event => this.handleDragMove(event);
			this.onDragEnd = () => this.releaseDrag();
		},
		mounted() {
			this.onWindowResize = () => this.scheduleViewportMeasure();
			window.addEventListener('resize', this.onWindowResize);
			this.publishGeometry();
			// Unsubscribed on unmount only: closing the panel does not unmount it, so a close-scoped
			// unsubscribe would stop tracking the theme from the second open onwards.
			this.unsubscribeTheme = note_ui_themeContext.NoteThemeContext.subscribe(event => {
				this.theme = event?.data?.theme === note_ui_themeContext.NoteTheme.DARK ? note_ui_themeContext.NoteTheme.DARK : note_ui_themeContext.NoteTheme.LIGHT;
			});
		},
		beforeUnmount() {
			if (this.onWindowResize) {
				window.removeEventListener('resize', this.onWindowResize);
				this.onWindowResize = null;
			}
			if (this.resizeRaf !== 0) {
				cancelAnimationFrame(this.resizeRaf);
				this.resizeRaf = 0;
			}
			if (this.enterRaf !== 0) {
				cancelAnimationFrame(this.enterRaf);
				this.enterRaf = 0;
			}
			this.unsubscribeTheme?.();
			this.unsubscribeTheme = null;
			// A drag interrupted by teardown must not leave document-level listeners or the resizing class
			// behind. There is nothing to save — the width never leaves the component.
			this.releaseDrag();
			// Reached only on shell teardown (leaving the page) or the ALG-01 failure path: closing the
			// panel collapses geometry and deliberately keeps the wrapper in the DOM.
			this.panel?.unmount();
			this.panel = null;
			this.mountPromise = null;
		},
		computed: {
			columnContextClass() {
				return COLUMN_CONTEXT_CLASS[this.theme] ?? COLUMN_CONTEXT_CLASS[note_ui_themeContext.NoteTheme.LIGHT];
			},
			// [ALG-02] Single source of the applied width and of the placement mode. Recomputed on every
			// input change — window resize, navigation collapse, a drag frame — so the mode switches on
			// the fly without ever closing the panel.
			geometry() {
				return note_ui_railGeometry.resolveRailGeometry({
					viewportWidth: this.viewportWidth,
					sidebarWidth: this.sidebarWidth,
					desiredWidth: this.draggedWidth
				});
			}
		},
		watch: {
			geometry() {
				this.publishGeometry();
			},
			// A gesture starts and ends without the width necessarily changing, and the shell has to know
			// about both edges: while the pointer drives the width, the neighbours must follow it frame by
			// frame instead of animating towards it.
			dragging() {
				this.publishGeometry();
			},
			theme() {
				// The wrapper's class sits on a foreign node, so it does not follow from a re-render.
				this.pinWidgetContext();
			}
		},
		methods: {
			// The shell needs the mode (it publishes the rail width for the hotkeys button and drops its
			// own placeholder) but must not import this extension to learn it — the whole point of the
			// lazy load. So geometry travels upward as a prop-less signal.
			publishGeometry() {
				this.$emit('geometry', {
					mode: this.geometry.mode,
					width: this.geometry.width,
					dragging: this.dragging
				});
			},
			/**
			 * The wrapper is rendered with a context class the portal derives from its own theme picker,
			 * which says nothing about the module's theme. Re-scoped to the active one, in the `edge`
			 * family: that is what the widget's chrome is styled against. The only class this module ever
			 * writes onto the foreign markup — everything else about the widget's palette is CSS in
			 * `note.ui.theme-context`.
			 */
			pinWidgetContext() {
				const wrapper = this.$refs.container?.querySelector(WRAPPER_ROOT_SELECTOR);
				if (!wrapper) {
					return;
				}

				// Snapshotted first: classList is live, and removing while iterating it skips entries.
				Array.from(wrapper.classList).filter(className => className.startsWith('--ui-context-')).forEach(className => main_core.Dom.removeClass(wrapper, className));
				main_core.Dom.addClass(wrapper, WIDGET_CONTEXT_CLASS[this.theme] ?? WIDGET_CONTEXT_CLASS[note_ui_themeContext.NoteTheme.LIGHT]);
			},
			/**
			 * Pointer events rather than the mouse events the navigation resizer uses: the panel hosts the
			 * widget's iframe, and a gesture over it survives only because the listeners sit on `document`
			 * and the transparent overlay covers the frame for the duration. Everything the user sees — the
			 * 8px grip with its 2px bar — follows the navigation resizer.
			 */
			startResize(event) {
				if (!this.open) {
					return;
				}

				// Suppresses the text selection the gesture would otherwise start on the page behind.
				event.preventDefault();
				this.dragging = true;
				// The applied width, not a measured one: the panel may be mid-transition, and a
				// getBoundingClientRect() during the slide would anchor the drag to an interpolated value.
				this.dragStartX = event.clientX;
				this.dragStartWidth = this.geometry.width;
				this.pendingWidth = this.dragStartWidth;
				main_core.Dom.addClass(document.body, RESIZING_CLASS);
				document.addEventListener('pointermove', this.onDragMove);
				document.addEventListener('pointerup', this.onDragEnd);
				// The OS aborts gestures on window switch or touch takeover. Without this the panel would
				// stay in its resizing state and the listeners would leak.
				document.addEventListener('pointercancel', this.onDragEnd);
			},
			handleDragMove(event) {
				if (!this.dragging) {
					return;
				}

				// The grip is on the left edge, so dragging left (smaller clientX) widens the panel. The
				// floor is the panel minimum rather than 0: the geometry reads 0 as "no drag" and would jump
				// back to PANEL_WIDTH instead of resting on the minimum.
				this.pendingWidth = Math.max(note_ui_railGeometry.PANEL_MIN_WIDTH, this.dragStartWidth + (this.dragStartX - event.clientX));

				// One layout write per frame. The panel hosts the widget's heavy iframe: applying the width
				// on every pointermove would flood reflow across it. Writing to a reactive field inside the
				// frame keeps Vue's own patch on the same schedule — clamping against the remaining space is
				// the geometry's job, so no upper bound is applied here.
				if (this.dragRaf === 0) {
					this.dragRaf = requestAnimationFrame(() => {
						this.dragRaf = 0;
						this.draggedWidth = this.pendingWidth;
					});
				}
			},
			/**
			 * End of the gesture, however it ended — released, cancelled or torn down. There is no save
			 * step and therefore no difference between those cases: the width lives in `draggedWidth` until
			 * the page is reloaded.
			 */
			releaseDrag() {
				if (!this.dragging) {
					return;
				}
				this.dragging = false;
				// Flush the frame still in flight synchronously, otherwise the last movement of the gesture
				// is dropped and the panel rests one frame behind the pointer.
				if (this.dragRaf !== 0) {
					cancelAnimationFrame(this.dragRaf);
					this.dragRaf = 0;
				}
				this.draggedWidth = this.pendingWidth;
				main_core.Dom.removeClass(document.body, RESIZING_CLASS);
				document.removeEventListener('pointermove', this.onDragMove);
				document.removeEventListener('pointerup', this.onDragEnd);
				document.removeEventListener('pointercancel', this.onDragEnd);
			},
			scheduleViewportMeasure() {
				if (this.resizeRaf !== 0) {
					return;
				}
				this.resizeRaf = requestAnimationFrame(() => {
					this.resizeRaf = 0;
					this.viewportWidth = document.documentElement.clientWidth;
				});
			},
			/**
			 * Idempotent by a cached promise: a repeated open (or a double click) mounts the wrapper
			 * that already exists instead of ordering a second dialog.
			 */
			ensureMounted() {
				if (this.mountPromise !== null) {
					return this.mountPromise;
				}
				this.failed = false;
				this.mountPromise = (async () => {
					// Every reversible step first — creating the dialog is the only irreversible one, so it
					// goes last. Ordered the other way round, a wrapper that fails to load would leave an
					// empty copilot chat in the user's history, and one more on every retry.
					const [response, exports] = await Promise.all([main_core.ajax.runAction('note.infrastructure.AiChatController.getWidgetConfig'), main_core.Runtime.loadExtension(WRAPPER_EXTENSION)]);
					const chatWidgetConfig = response?.data?.config ?? {};
					const AiChatPanel = exports?.AiChatPanel ?? BX.Intranet?.AiChatPanel;
					if (!AiChatPanel) {
						throw new Error(`note.ai-chat: ${WRAPPER_EXTENSION} is not available`);
					}
					const dialogId = await createCopilotDialog();

					// Held in a local as well as in the field: the widget can report an error while mount()
					// is still awaiting, and the teardown that follows nulls the field.
					const panel = new AiChatPanel({
						dialogId,
						chatWidgetConfig,
						events: {
							// The collapse button lives inside im's own widget header; the wrapper only
							// relays its event. Without this handler that visible button does nothing,
							// and its markup is not ours to hook into.
							onHideButtonClick: () => this.requestClose(),
							// Same handling as a rejected mount: the widget is unusable either way, and a
							// resolved promise left in the cache would hand the dead app back on the next open.
							onError: errors => this.failMount(errors)
						}
					});
					this.panel = panel;
					await panel.mount(this.$refs.container);
					// Torn down by an error while mount() was in flight — there is nothing left to reveal.
					if (this.panel !== panel) {
						return;
					}
					this.pinWidgetContext();
					// Order matters: no transition, then the width, then the shell drops its placeholder —
					// all in one patch, so the rail never holds two widths at once.
					this.instant = true;
					this.widgetReady = true;
					this.$emit('mounted');
					// Two frames: a single one would restore the transition before the handover is painted.
					this.enterRaf = requestAnimationFrame(() => {
						this.enterRaf = requestAnimationFrame(() => {
							this.enterRaf = 0;
							this.instant = false;
						});
					});
				})()
				// Swallowed on purpose: rethrowing would surface as an unhandled rejection and leave the
				// shell indicator up.
				.catch(error => this.failMount(error));
				return this.mountPromise;
			},
			/**
			 * The one failure path, shared by a rejected mount and the widget's own error event: tear the
			 * wrapper down, forget the cached promise so the next click is a real retry, notify once.
			 */
			failMount(error) {
				if (this.failed) {
					console.error('note.ai-chat: mount failed', error);
					return;
				}
				this.failed = true;

				// mount() appends the wrapper node to our container BEFORE it awaits the widget, so after a
				// failure the wrapper is already in the DOM — leaving it would put a second one next to it on
				// the next attempt. Guarded: a teardown failure here would replace the real reason in the log
				// with its own.
				try {
					this.panel?.unmount();
				} catch (teardownError) {
					console.warn('note.ai-chat: wrapper teardown failed', teardownError);
				}
				this.panel = null;
				// Cleared so the next click retries instead of resolving the failed attempt.
				this.mountPromise = null;
				// The column must not keep claiming a widget it no longer holds.
				this.widgetReady = false;
				this.notifyFailure();
				this.requestClose();
				console.error('note.ai-chat: mount failed', error);
			},
			requestClose() {
				main_core_events.EventEmitter.emit(note_sidebar.NoteEvent.AI_CHAT_TOGGLE_REQUESTED, new main_core_events.BaseEvent({
					data: {
						desired: 'close'
					}
				}));
			},
			notifyFailure() {
				const content = String(main_core.Loc.getMessage('NOTE_APP_AI_CHAT_MOUNT_ERROR') ?? '').replace('#NAME#', String(this.productName ?? '')).trim();
				if (!content) {
					return;
				}
				BX.UI.Notification.Center.notify({
					content,
					position: 'top-right',
					autoHideDelay: 4000
				});
			}
		},
		template: `
		<section
			class="note-ai-chat-panel"
			:class="[columnContextClass, {
				'--open': open && widgetReady,
				'--overlay': geometry.mode === 'overlay',
				'--instant': instant,
				'--dragging': dragging,
			}]"
			:style="{ '--note-ai-chat-width': \`\${geometry.width}px\` }"
			role="complementary"
			:aria-label="productName"
		>
			<div
				v-if="open"
				class="note-ai-chat-panel__resizer"
				role="separator"
				aria-orientation="vertical"
				@pointerdown="startResize"
			></div>
			<div ref="container" class="note-ai-chat-panel__container"></div>
			<!-- Transparent layer for the duration of the gesture: it keeps the pointer from being
					 swallowed by the widget's iframe and holds the resize cursor over the whole page. -->
			<div v-if="dragging" class="note-ai-chat-panel__drag-overlay"></div>
		</section>
	`
	};

	exports.COPILOT_CHAT_TYPE = COPILOT_CHAT_TYPE;
	exports.COPILOT_MAIN_ROLE = COPILOT_MAIN_ROLE;
	exports.NoteAiChatPanelComponent = NoteAiChatPanelComponent;
	exports.buildCreateDialogConfig = buildCreateDialogConfig;
	exports.buildDialogId = buildDialogId;
	exports.createCopilotDialog = createCopilotDialog;

})(this.BX.Note = this.BX.Note || {}, BX, BX.Event, BX.Note.Sidebar, BX.Note.Ui, BX.UI.Notification, BX.Note.Ui);
//# sourceMappingURL=ai-chat.bundle.js.map
