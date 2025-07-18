(function ()
{
	"use strict";
	BX.namespace("BX.Report.Analytics.Config");

	BX.Report.Analytics.Config.Controls = function (options)
	{
		this.configurationButton = options.configurationButton;
		this.boardId = options.boardId;
		this.boardOptions = BX.prop.getArray(options, "boardOptions", []);

		this.toolbar = new BX.Report.Integration.Toolbar();
		this.pageControlsContainer = this.toolbar.getRightButtonsContainer();

		this.init();
	};

	BX.Report.Analytics.Config.Controls.prototype = {
		init: function ()
		{
			BX.bind(
				this.configurationButton,
				"click",
				this.handleConfigurationButtonClick.bind(this)
			);
			this.loader = new BX.Loader({size: 80});
		},

		handleConfigurationButtonClick: function ()
		{
			if (!this.menu)
			{
				var menuItems = [];

				this.boardOptions.forEach(function (optionFields)
				{
					menuItems.push({
						text: optionFields['TITLE'],
						className: "menu-popup-no-icon",
						onclick: function ()
						{
							this.menu.popupWindow.close();
							this.toggleBoardOption(optionFields['NAME']);
						}.bind(this)
					})
				}, this);

				if (menuItems.length > 0)
				{
					menuItems.push({
						separator: true
					})
				}

				menuItems.push({
					text: this.getToggleBoardTitle(),
					className: "menu-popup-no-icon",
					onclick: function ()
					{
						this.menu.popupWindow.close();
						this.toggleBoard();
					}.bind(this)
				});

				this.menu = new BX.PopupMenuWindow(
					'report-analytics-config-control-menu',
					this.configurationButton,
					menuItems,
					{
						closeByEsc: true,
						autoHide: true,
						cacheable: false,
						events: {
							onDestroy: function ()
							{
								this.menu = null;
							}.bind(this)
						}
					}
				);
			}

			this.menu.toggle();
		},

		getToggleBoardTitle: function ()
		{
			return BX.message("VISUALCONSTRUCTOR_DASHBOARD_GO_TO_DEFAULT");
		},

		toggleBoard: function ()
		{
			this.contentContainer = document.querySelector(".report-analytics-content");
			this.cleanPageContent();
			this.showLoader();
			BX.Report.VC.Core.ajaxPost("analytics.toggleToDefaultByBoardKey", {
				data: {
					IFRAME: "Y",
					boardKey: this.boardId
				},
				onFullSuccess: BX.delegate(function (response)
				{
					this.hideLoader();
					this.changePageTitle(response.additionalParams.pageTitle);
					this.changePageControls(response.additionalParams.pageControlsParams);
					BX.html(this.contentContainer, response.data);
				}, this)
			});
		},

		toggleBoardOption: function (optionName)
		{
			this.contentContainer = document.querySelector(".report-analytics-content");
			this.cleanPageContent();
			this.showLoader();
			BX.Report.VC.Core.ajaxPost("analytics.toggleBoardOption", {
				data: {
					IFRAME: "Y",
					boardKey: this.boardId,
					optionName: optionName
				},
				onFullSuccess: BX.delegate(function (response)
				{
					this.hideLoader();
					this.changePageTitle(response.additionalParams.pageTitle);
					this.changePageControls(response.additionalParams.pageControlsParams);
					BX.html(this.contentContainer, response.data);
				}, this)
			});
		},

		cleanPageContent: function ()
		{
			this.toolbar.cleanContent();
			BX.cleanNode(this.contentContainer);
			if (BX.Report.Dashboard)
			{
				BX.Report.Dashboard.BoardRepository.destroyBoards();
			}
			if (BX.VisualConstructor && BX.VisualConstructor.BoardRepository)
			{
				BX.VisualConstructor.BoardRepository.destroyBoards();
			}
		},
		changePageControls: function (controlsContent)
		{
			var config = {};
			config.onFullSuccess = function (result)
			{
				BX.html(this.pageControlsContainer, result.html);
			}.bind(this);
			BX.Report.VC.Core._successHandler(controlsContent, config);
		},
		changePageTitle: function (title)
		{
			this.toolbar.setTitle(title);
		},
		showLoader: function ()
		{
			var preview = this.toolbar.createSkeleton();

			this.contentContainer.appendChild(preview);
		},
		hideLoader: function ()
		{
			this.loader.hide();
		}
	};

})();
