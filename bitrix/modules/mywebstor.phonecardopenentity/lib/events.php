<?

namespace MyWebstor\PhoneCardOpenEntity;

class Events {
    public static function addPhoneCallsMod() {
        $exts = array(
            "mywebstor.phonecardopenentity.phone-calls-open-entity"
        );
        $request = \Bitrix\Main\Application::getInstance()
            ->getContext()
            ->getRequest();

        if (
            !$request->isAdminSection()
            && $request->get("IFRAME") !== "Y"
        )
            \Bitrix\Main\Ui\Extension::load($exts);
    }
}
