(() => {
    BX.namespace("BX.Voximplant.PhoneCallView");

    BX.Voximplant.PhoneCallView.prototype.originRenderCrmButtons =
        BX.Voximplant.PhoneCallView.prototype.renderCrmButtons;
    BX.Voximplant.PhoneCallView.prototype.renderCrmButtons = function () {
        this.originRenderCrmButtons();

        const crmBindings = this.crmBindings || [];
        if (
            !this.elements.crmButtonsContainer ||
            !Array.isArray(crmBindings) ||
            !crmBindings.length
        ) {
            return;
        }

        crmBindings.forEach((crmBinding) => {
            const crmEntityType = crmBinding.ENTITY_TYPE;
            const crmEntityId = crmBinding.ENTITY_ID;

            const buttonNode = BX.Dom.create("div", {
                props: { className: "im-phone-call-crm-button" },
                children: [
                    BX.Dom.create("div", {
                        props: { className: "im-phone-call-crm-button-item" },
                        text:
                            BX.Loc.getMessage(
                                "IM_CRM_BTN_OPEN_" + crmEntityType
                            ) || "IM_CRM_BTN_OPEN_" + crmEntityType,
                    }),
                ],
                events: {
                    click: this._onOpenEntityButtonClick.bind(
                        this,
                        crmEntityType,
                        crmEntityId
                    ),
                },
            });
            this.elements.crmButtonsContainer.appendChild(buttonNode);
        });
    };

    BX.Voximplant.PhoneCallView.prototype._onOpenEntityButtonClick = function (
        crmEntityType,
        crmEntityId
    ) {
        let url = this._getCrmEditUrl(crmEntityType, crmEntityId);
        if (!url) return;

        url = BX.Uri.addParam(url, {
            phone: this.phoneNumber,
            origin_id: "VI_" + this.callId,
            init_mode: "edit",
        });

        BX.SidePanel.Instance.open(url);
    };
})();
