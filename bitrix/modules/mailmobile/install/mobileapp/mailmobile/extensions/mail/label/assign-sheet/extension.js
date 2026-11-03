/**
 * @module mail/label/assign-sheet
 */
jn.define('mail/label/assign-sheet', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');
	const { Color, Indent, Corner } = require('tokens');
	const { Text3, Text5 } = require('ui-system/typography/text');
	const { Checkbox } = require('ui-system/form/checkbox');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { Loc } = require('loc');
	const { showErrorToast } = require('toast/error');
	const { runLabelAction } = require('mail/label/transport');
	const { AjaxMethod } = require('mail/const');
	const {
		fetchLabels,
		assignLabels,
		unassignLabels,
	} = require('mail/statemanager/redux/slices/labels/thunk');
	const { LabelAssignmentController } = require('mail/label/assign-sheet/src/controller');
	const store = require('statemanager/redux/store');

	const LAYOUT_PROPERTIES = {
		backgroundColor: Color.bgContentPrimary.toHex(),
		modal: true,
		backdrop: {
			showOnTop: true,
			// The navigation bar carries the title of the sheet: hidden, the sheet opens as a bare
			// list of checkboxes, and the empty hint appears without a heading at all.
			hideNavigationBar: false,
			horizontalSwipeAllowed: false,
			// A third of the screen: the sheet holds the title and four rows, and the list of the
			// message stays visible behind it. Longer dictionaries scroll inside the sheet.
			mediumPositionPercent: 33,
			onlyMediumPosition: true,
			swipeAllowed: true,
		},
	};

	class LabelAssignSheetView extends PureComponent
	{
		constructor(props)
		{
			super(props);
			this.controller = props.controller;
			// The marks are kept here and not only in the controller: a pure component does not redraw
			// on a setState that changes nothing, and the checkbox would stay as it was.
			this.state = {
				labels: [],
				assigned: [],
				loading: true,
				failed: false,
			};
		}

		componentDidMount()
		{
			this.controller.open()
				.then(({ labels, assigned }) => {
					this.setState({ labels, assigned, loading: false });
				})
				.catch(() => {
					this.setState({ loading: false, failed: true });
					showErrorToast({}, this.props.layoutWidget);
				})
			;
		}

		render()
		{
			// A failed load is not an empty dictionary: the hint would claim there are no labels while
			// the answer of the server never arrived. The toast already tells what happened.
			if (this.state.failed)
			{
				return View({ testId: 'mail-label-assign-sheet-error' });
			}

			if (!this.state.loading && !this.controller.hasLabels())
			{
				return this.renderEmptyHint();
			}

			return View(
				{
					style: {
						paddingVertical: Indent.M.toNumber(),
						paddingHorizontal: Indent.M.toNumber(),
					},
				},
				...this.state.labels.map((label) => this.renderLabelRow(label)),
			);
		}

		renderEmptyHint()
		{
			return View(
				{
					testId: 'mail-label-assign-sheet-empty',
					style: {
						padding: Indent.XL2.toNumber(),
						alignItems: 'center',
					},
				},
				Text3({
					text: Loc.getMessage('MAILMOBILE_LABEL_ASSIGN_SHEET_EMPTY'),
					color: Color.base3,
					style: { textAlign: 'center' },
				}),
			);
		}

		renderLabelRow(label)
		{
			const assigned = this.state.assigned.includes(label.id);

			return View(
				{
					testId: `mail-label-assign-sheet-row-${label.id}`,
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						paddingVertical: 11.5,
						paddingHorizontal: Indent.L.toNumber(),
						borderRadius: Corner.L.toNumber(),
						marginBottom: Indent.XS.toNumber(),
					},
					onClick: () => this.onRowClick(label.id),
				},
				IconView({
					size: 24,
					icon: Icon.SALE_TAG,
					color: Color.accentMainPrimaryalt,
					style: { marginRight: Indent.L.toNumber() },
				}),
				Text3({
					text: label.name,
					color: Color.base1,
					style: { flex: 1 },
				}),
				new Checkbox({
					testId: `mail-label-assign-sheet-checkbox-${label.id}`,
					checked: assigned,
					useState: false,
					onClick: () => this.onRowClick(label.id),
				}),
			);
		}

		onRowClick(labelId)
		{
			// Twice on purpose: the first call shows the optimistic mark, the second shows what the
			// server confirmed — or the rollback.
			this.controller.toggle(labelId).finally(() => this.syncAssigned());
			this.syncAssigned();
		}

		syncAssigned()
		{
			if (!this.isUnmounted)
			{
				this.setState({ assigned: this.controller.getAssignedIds() });
			}
		}

		componentWillUnmount()
		{
			this.isUnmounted = true;
		}
	}

	class LabelAssignSheet
	{
		/**
		 * @param {{
		 *     uidId: string,
		 *     mailboxId: number,
		 *     parentWidget: object,
		 *     currentLabelIds?: number[]|null,
		 *     onChange?: function(object): void,
		 * }} params
		 */
		static show({ uidId, mailboxId, parentWidget, currentLabelIds = null, onChange = () => {} })
		{
			const controller = new LabelAssignmentController({
				uidId,
				currentLabelIds,
				ports: LabelAssignSheet.buildPorts({ mailboxId, onChange, parentWidget }),
			});

			const opener = parentWidget || PageManager;
			opener.openWidget('layout', {
				...LAYOUT_PROPERTIES,
				titleParams: {
					text: Loc.getMessage('MAILMOBILE_LABEL_ASSIGN_SHEET_TITLE'),
					type: 'dialog',
				},
				onReady: (layoutWidget) => {
					layoutWidget.showComponent(new LabelAssignSheetView({ controller, layoutWidget }));
				},
			}, parentWidget);
		}

		static buildPorts({ mailboxId, onChange, parentWidget })
		{
			// Every port settles with a failure of its own: `unwrap` turns a rejected thunk back into a
			// rejected promise, so a read that did not reach the server is told apart from an empty
			// answer and a write that did not happen rolls the optimistic mark back.
			return {
				loadLabels: () => store.dispatch(fetchLabels({ mailboxId }))
					.unwrap()
					.then((payload) => payload?.labels ?? [])
				,
				loadMessageLabels: (uidId) => runLabelAction(AjaxMethod.mailLabelMessageLabels, { id: uidId })
					.then((payload) => payload?.labelIds ?? [])
				,
				assign: ({ labelIds, ids }) => store.dispatch(assignLabels({ labelIds, ids })).unwrap(),
				unassign: ({ labelIds, ids }) => store.dispatch(unassignLabels({ labelIds, ids })).unwrap(),
				onChange,
				onError: () => showErrorToast({}, parentWidget),
			};
		}
	}

	module.exports = { LabelAssignSheet };
});
