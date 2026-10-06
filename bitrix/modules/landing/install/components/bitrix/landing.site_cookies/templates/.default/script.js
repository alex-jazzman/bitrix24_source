(function() {

	'use strict';

	BX.namespace('BX.Landing');

	/**
	 * Constructor for helper.
	 * @param params
	 * @constructor
	 */
	BX.Landing.SiteCookies = function(params)
	{
		this.bbFormAjaxPath = params.bbFormAjaxPath;
		this.idAgreementNew = params.idAgreementNew ? BX(params.idAgreementNew) : null;
		this.classNameAgreementBlock = params.classNameAgreementBlock || 'landing-agreement-block';
		this.classNameAgreementDelete = params.classNameAgreementDelete || 'landing-agreement-delete';
		this.classNameAgreementAdd = params.classNameAgreementAdd || 'landing-agreement-add';
		this.classNameEditIcon = params.classNameEditIcon || 'landing-agreement-edit';
		this.classCloseWarningIcon = params.classCloseWarningIcon || 'landing-agreement-warning-close';
		this.classInputBlock = params.classInputBlock || 'landing-agreement-input-block';
		this.classEditTitle = params.classEditTitle || 'landing-agreement-cookies-name-edit';
		this.classTitleInput = params.classTitleInput || 'landing-agreement-cookies-name-input';
		this.classBlockAreaShow = params.classBlockAreaShow || 'landing-agreement-block-inner-show';
		this.inputBlocks = document.querySelectorAll('.landing-agreement-input');
		this.messages = params.messages || {};

		this.binding();
		this.bindEvents();
	};

	BX.Landing.SiteCookies.prototype =
	{
		/**
		 * Binding some actions. Runs again after an agreement is added, so every listener it sets is
		 * guarded by a class: without the guard the nodes already on the page collect a new handler
		 * on every call.
		 */
		binding: function()
		{
			// remove cookie buttons
			var deleteButtons = [].slice.call(
				document.querySelectorAll('.' + this.classNameAgreementDelete)
			);
			deleteButtons.map(function(deleteButton)
			{
				if (!BX.hasClass(deleteButton, 'landing-binding'))
				{
					BX.addClass(deleteButton, 'landing-binding');
					BX.bind(deleteButton, 'click', function(event)
					{
						BX.UI.Dialogs.MessageBox.confirm(
							this.messages.removeAlertText,
							this.messages.removeAlertTitle,
							function(messageBox) {
								// resolved while the block is still in the document
								var target = this.resolveFocusAfterRemove(deleteButton);
								this.removeAgreement(deleteButton);
								messageBox.close();
								// after the dialog is gone: it restores the focus onto the node that
								// opened it, and that node has just been removed with its block
								if (target)
								{
									target.focus();
								}
							}.bind(this)
						);
					}.bind(this));
				}
			}.bind(this));

			// rename buttons: bound here and not in bindEvents, so an agreement added by the request
			// can be renamed too
			var editIcons = [].slice.call(
				document.querySelectorAll('.' + this.classNameEditIcon)
			);
			editIcons.map(function(icon)
			{
				if (!BX.hasClass(icon, 'landing-binding'))
				{
					BX.addClass(icon, 'landing-binding');
					icon.addEventListener('click', this.showInput.bind(this));
				}
			}.bind(this));

			// add cookie button
			var addButton = document.querySelector('.' + this.classNameAgreementAdd);
			if (addButton)
			{
				if (!BX.hasClass(addButton, 'landing-binding'))
				{
					BX.addClass(addButton, 'landing-binding');
					BX.bind(addButton, 'click', function(event)
					{
						this.addNewAgreement(addButton);
					}.bind(this));
				}
			}
		},

		bindEvents: function()
		{
			// edit blocks. Only system agreements carry a checkbox, so the height below is written
			// for them alone: a custom agreement lives on an auto height and must keep it.
			var openedBlocks = [];
			[].forEach.call(this.inputBlocks, function(item) {
				item.addEventListener('click', BX.delegate(this.toggleSection, this));

				var block = item.parentNode.nextElementSibling;
				if (block.classList.contains(this.classBlockAreaShow))
				{
					openedBlocks.push(block);
				}
			}.bind(this));

			// the blocks are measured first and written after: a height written between two
			// measurements makes the browser lay the page out again before the next one can be read
			var heights = openedBlocks.map(function(block) {
				return block.children[0].offsetHeight + 'px';
			});
			openedBlocks.forEach(function(block, index) {
				block.style.height = heights[index];
			});
			// the heights are in place by now and these calls write the very same values, so the whole
			// set costs one measurement; what they are called for is the watch on the editor being built
			openedBlocks.forEach(function(block) {
				this.syncHeight(block);
			}.bind(this));

			var closeButton = document.getElementById(this.classCloseWarningIcon);
			if (closeButton)
			{
				closeButton.addEventListener('click', this.closeWarning.bind(this))
			}

			this.watchEditorFocus();
		},

		/**
		 * Marks the description whose editor holds the caret.
		 *
		 * The text is edited inside an iframe: the host receives no focus events and `:focus-within`
		 * never matches, so the state is kept as a class, set when the window loses the focus to
		 * that frame.
		 */
		watchEditorFocus: function()
		{
			var container = document.querySelector('.landing-agreement');
			if (this.editorFocusWatched || !container)
			{
				return;
			}
			this.editorFocusWatched = true;

			var focusClass = 'landing-agreement-editor-focus';
			var bind = function(iframe) {
				if (iframe.landingFocusBound)
				{
					return;
				}

				var editor = iframe.closest('.landing-agreement-editor');
				if (!editor)
				{
					return;
				}
				iframe.landingFocusBound = true;

				var mark = function() {
					editor.classList.add(focusClass);
				};
				var unmark = function() {
					editor.classList.remove(focusClass);
				};

				// the frame itself takes the focus in this document
				iframe.addEventListener('focus', mark);
				iframe.addEventListener('blur', unmark);

				// and the caret goes on into the document it holds, where the host sees nothing
				var bindInner = function() {
					var inner = iframe.contentDocument;
					if (!inner)
					{
						return;
					}
					inner.addEventListener('focusin', mark);
					inner.addEventListener('focusout', unmark);
					inner.addEventListener('mousedown', mark);
				};

				bindInner();
				iframe.addEventListener('load', bindInner);
			};

			var scan = function() {
				var frames = container.querySelectorAll('.landing-agreement-editor iframe');
				[].forEach.call(frames, bind);
			};

			// the editor builds its frame after the page is ready, and an agreement added by the
			// request brings one more. The watch is kept on the agreements alone: the rest of the
			// document belongs to the portal and mutates constantly.
			scan();
			if (typeof MutationObserver === 'undefined')
			{
				return;
			}

			// the first frames are built in every agreement at once, and the editor keeps rebuilding
			// its own markup inside these containers afterwards: without a pause between the runs the
			// whole set of agreements would be walked on every single mutation of the subtree
			var scanTimeout = null;
			var scheduleScan = function() {
				if (scanTimeout)
				{
					return;
				}
				scanTimeout = setTimeout(function() {
					scanTimeout = null;
					scan();
				}, 100);
			};

			this.editorFocusObserver = new MutationObserver(scheduleScan);
			this.editorFocusObserver.observe(container, {childList: true, subtree: true});
		},

		/**
		 * Keeps the height of an opened block on the height of its content.
		 *
		 * The editor inside is built by the client after the page is ready, so a single measurement
		 * taken now would cut the fields off while leaving them in the keyboard path.
		 * @param {HTMLElement} block Opened block.
		 */
		syncHeight: function(block)
		{
			var content = block.children[0];
			var apply = function() {
				if (block.classList.contains(this.classBlockAreaShow))
				{
					block.style.height = content.offsetHeight + 'px';
				}
			}.bind(this);

			// The block carries a transition on every property, and the content growing under the typed
			// text is not a folding: left to that transition, every such write would start the .2s run
			// anew and hold the wrapper behind its own content for as long as it lasts.
			var applyWithoutTransition = function() {
				// a folded block keeps its height of zero, and the reading below is not free
				if (!block.classList.contains(this.classBlockAreaShow))
				{
					return;
				}

				block.style.transition = 'none';
				apply();
				// the new height is settled here: without the reading the browser would land on the
				// returned transition alone and animate the growth all the same
				void block.offsetHeight;
				block.style.transition = '';
			}.bind(this);

			apply();

			if (typeof ResizeObserver === 'undefined')
			{
				// nothing to watch the editor with: the height is taken once more, late enough for the
				// fields to be built by then
				setTimeout(apply, 1200);

				return;
			}

			if (!block.landingHeightObserver)
			{
				block.landingHeightObserver = new ResizeObserver(applyWithoutTransition);
				block.landingHeightObserver.observe(content);
			}
		},

		/**
		 * Turns to edit mode on of block title.
		 */
		showInput: function(event)
		{
			var pencil = event.currentTarget;
			var parent = pencil.parentNode;
			var input = pencil.previousElementSibling;

			// The field keeps its own value and is never filled from the title node: an agreement
			// without a name shows a stand-in phrase there, and taking it as the value would save that
			// phrase as the real name of the agreement.
			input.dataset.landingOriginalValue = input.value;
			// the field is hidden until the class is set, and a hidden field takes no focus
			parent.classList.add(this.classEditTitle);
			input.focus();

			input.landingKeydownHandler = this.onEditKeydown.bind(this, input, pencil);
			input.landingFocusoutHandler = this.hideInput.bind(this, input, pencil, false);
			input.addEventListener('keydown', input.landingKeydownHandler);
			input.addEventListener('focusout', input.landingFocusoutHandler);
		},

		/**
		 * Handles the keyboard inside the edit mode.
		 * @param {HTMLElement} input Title field.
		 * @param {HTMLElement} pencil Button the mode was entered from.
		 * @param {KeyboardEvent} event Event.
		 */
		onEditKeydown: function(input, pencil, event)
		{
			if (event.key === 'Enter')
			{
				// a field inside a form submits it, and submitting here saves every agreement
				event.preventDefault();
				this.hideInput(input, pencil, true);
			}
			else if (event.key === 'Escape')
			{
				// first of all: the side panel closes on Escape, and it would take the unsaved
				// values of every agreement with it
				event.stopPropagation();
				input.value = input.dataset.landingOriginalValue;
				this.hideInput(input, pencil, true);
			}
		},

		/**
		 * Turns to edit mode off of block title.
		 * @param {HTMLElement} input Title field.
		 * @param {HTMLElement} pencil Button the mode was entered from.
		 * @param {boolean} returnFocus Whether the focus goes back onto the pencil.
		 */
		hideInput: function(input, pencil, returnFocus)
		{
			// before the focus moves: returning it fires focusout, and a second run would overwrite
			// the value the first one has just restored
			input.removeEventListener('keydown', input.landingKeydownHandler);
			input.removeEventListener('focusout', input.landingFocusoutHandler);

			var title = input.previousElementSibling;
			// an empty title leaves the agreement without a visible caption and takes the telling
			// part out of the names of its buttons
			title.textContent = input.value || this.messages.newAgreement || '';
			input.setAttribute('value', input.value);
			input.parentNode.classList.remove(this.classEditTitle);

			if (returnFocus)
			{
				pencil.focus();
			}
		},

		/**
		 * Closes the edit mode of any agreement that is in it.
		 */
		finishActiveEdit: function()
		{
			var active = document.querySelector('.' + this.classEditTitle);
			if (active)
			{
				var input = active.querySelector('.' + this.classTitleInput);
				var pencil = active.querySelector('.' + this.classNameEditIcon);
				if (input && pencil)
				{
					this.hideInput(input, pencil, false);
				}
			}
		},

		/**
		 * Hides warning block.
		 */
		closeWarning: function(event)
		{
			var warningBlock = event.currentTarget.closest('.ui-alert');
			var section = warningBlock.closest('.landing-agreement-wrapper');

			warningBlock.remove();

			if (!section)
			{
				return;
			}

			// the button that held the focus has just been removed together with the block. The
			// heading is the named node of the section; a section drawn without one still has its own
			// controls, and the first of them is nearer than the body. Looked up after the removal:
			// the button that closed the warning is a button of this section too
			var target = section.querySelector('.landing-agreement-title')
				|| section.querySelector('button');
			if (target)
			{
				target.focus();
			}
		},

		/**
		 * Toggles block.
		 */
		toggleSection: function(event)
		{
			var hiddenBlock = event.currentTarget.parentNode.nextElementSibling;
			var checkbox = event.currentTarget;

			if (hiddenBlock.classList.contains(this.classBlockAreaShow))
			{
				checkbox.checked = false;
				hiddenBlock.style.height = 0;
				hiddenBlock.classList.remove(this.classBlockAreaShow);
			}
			else
			{
				checkbox.checked = true;
				hiddenBlock.classList.add(this.classBlockAreaShow);
				this.syncHeight(hiddenBlock);
			}
		},

		/**
		 * Creates new agreement form.
		 * @param {HTMLElement} addButton Add button node.
		 */
		addNewAgreement: function(addButton)
		{
			if (!this.bbFormAjaxPath)
			{
				return;
			}
			BX.ajax({
				url: this.bbFormAjaxPath,
				method: 'GET',
				onsuccess: function(data)
				{
					if (this.idAgreementNew)
					{
						var newForm = BX.create('div', {
							html: data
						});
						this.idAgreementNew.append(newForm);
						this.binding();
						this.focusNewAgreement(newForm);

						return;
					}
					this.binding();
				}.bind(this)
			});
		},

		/**
		 * Opens the rename mode of the agreement that has just arrived.
		 *
		 * Nothing else tells a screen reader that the form is there: the focus stays on the add
		 * button, and the new block is appended to the end of the list.
		 * @param {HTMLElement} newForm Wrapper of the inserted markup.
		 */
		focusNewAgreement: function(newForm)
		{
			var pencil = newForm.querySelector('.' + this.classNameEditIcon);
			if (!pencil)
			{
				return;
			}

			// the request may have been in flight while another agreement was being renamed
			this.finishActiveEdit();
			this.showInput({currentTarget: pencil});
		},

		/**
		 * Tells where the focus goes once the agreement is removed.
		 *
		 * The agreements added by the request live in a container of their own, so the neighbour is
		 * looked up across the whole section: a walk by siblings would not cross that border.
		 * @param {HTMLElement} removeNode Remove button of the agreement being removed.
		 * @return {HTMLElement|null}
		 */
		resolveFocusAfterRemove: function(removeNode)
		{
			var addButton = document.querySelector('.' + this.classNameAgreementAdd);
			var section = removeNode.closest('.landing-agreement-wrapper-custom');
			var block = removeNode.closest('.' + this.classNameAgreementBlock);
			if (!section || !block)
			{
				return addButton;
			}

			var pencils = [].slice.call(section.querySelectorAll('.' + this.classNameEditIcon));
			var current = -1;
			pencils.forEach(function(pencil, index) {
				if (block.contains(pencil))
				{
					current = index;
				}
			});

			if (current < 0)
			{
				return addButton;
			}

			return pencils[current - 1] || pencils[current + 1] || addButton;
		},

		/**
		 * Removes agreement block.
		 * @param {HTMLElement} removeNode Remove button node.
		 */
		removeAgreement: function(removeNode)
		{
			var node = removeNode.closest('.' + this.classNameAgreementBlock);
			while (node)
			{
				if (BX.hasClass(node, this.classNameAgreementBlock))
				{
					BX.remove(node);
					break;
				}
			}
		}
	};

})();
