<?php

/**
 * @var $params array
 */

if (!isset($params)) { ?>
    <div class="paykeeper__wrapp">
        <div class="paykeeper__block">
            <p class="paykeeper__error">Missing data $params</p>
        </div>
    </div>
<?php } elseif ($params["form_type"] == "create") { ?>
    <div class="paykeeper__wrapp">
        <div class="paykeeper__block">
            <p class="paykeeper__text"><?=$params["detail_page_message"]?></p>
            <form name="paykeeper__form" id="paykeeper__form" action="<?=$params["form_url"]?>" accept-charset="utf-8" method="post">
                <input type="hidden" name="sum" value="<?=$params["sum"]?>"/>
                <input type="hidden" name="orderid" value="<?=$params["orderid"]?>"/>
                <?php if ($params["contacts"]) { ?>
                <label for="pk_name">Укажите ФИО</label><br>
                <input id="pk_name" type="text" name="clientid" value="" placeholder="Введите ФИО" required/><br>
                <label for="pk_email">Укажите Email</label><br>
                <input id="pk_email" type="text" name="client_email" value="" placeholder="Введите Email" required/><br>
                <label for="pk_phone">Укажите телефон</label><br>
                <input id="pk_phone" type="text" name="client_phone" value="" placeholder="Введите телефон" required/>
                <?php } else { ?>
                <input type="hidden" name="clientid" value="<?=$params["clientid"]?>"/>
                <input type="hidden" name="client_email" value="<?=$params["client_email"]?>"/>
                <input type="hidden" name="client_phone" value="<?=$params["client_phone"]?>"/>
                <?php } ?>
                <input type="hidden" name="service_name" value="<?=$params["service_name"]?>"/>
                <input type="hidden" name="cart" value = "<?=htmlentities($params["cart"],ENT_QUOTES)?>"/>
                <?php if (isset($params["sbp"])) { ?>
                    <input type="hidden" name="pstype" value = "sbp_default"/>
                <?php } else if (isset($params["pstype"])) { ?>
                    <input type="hidden" name="pstype" value = "<?=$params["pstype"]?>"/>
                <?php } ?>
                <?php if (isset($params["user_result_callback"])) { ?>
                    <input type="hidden" name="user_result_callback" value = "<?=$params["user_result_callback"]?>"/>
                <?php } ?>
                <input type="hidden" name="lang" value="<?=$params["lang"]?>"/>
                <input type="hidden" name="sign" value = "<?=$params["sign"]?>"/>
                <input type="submit" class="paykeeper__button" value="<?=$params["pay_button"]?>"/>
            </form>
        </div>
    </div>
    <script type="text/javascript">
        function PayKeeperFormEvent(func) {
            if (window.addEventListener) {
                window.addEventListener("DOMContentLoaded", func, false);
            } else {
                var oldonload = window.onload;
                window.onload = function(e) {
                    if (oldonload) {
                        oldonload(e);
                    }
                    func();
                };
            }
        }

        function PayKeeperFormFunc() {
            <?php if ($params["redirect"]) { ?>
            setTimeout(function() {
                document.forms["paykeeper__form"].submit();
            }, 100);
            <?php } else { ?>
            return true;
            <?php } ?>
        }
        PayKeeperFormEvent(PayKeeperFormFunc);
    </script>
<?php } else { ?>
    <div class="paykeeper__wrapp">
        <div class="paykeeper__block">
            <?=$params["detail_page_message"]?>
        </div>
    </div>
<?php } ?>
<style>
    body .paykeeper__wrapp {
        text-align: left;
        width: 100%;
        margin: 20px 0;
        font-family: Arial, sans-serif;
    }
    body .paykeeper__block {
        font-family: Arial, sans-serif;
        width: 100%;
        padding: 10px 10px 13px;
        border: 1px solid #e5e5e5;
        text-align: center;
        margin-bottom: 12px;
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    body .paykeeper__button {
        font-family: Arial, sans-serif;
        display: inline-block;
        max-width: 320px;
        width: 100%;
        margin: 8px 0 5px;
        background-color: #28a745 !important;
        color: #fff !important;
        border: none;
        box-shadow: none;
        outline: none;
        font-size: 14px;
        font-weight: normal;
        line-height: 1.43;
        text-align: center;
        white-space: nowrap;
        vertical-align: middle;
        padding: 6px 12px;
        text-decoration: none !important;
    }
    body .paykeeper__button:active,
    body .paykeeper__button:focus {
        color: #fff !important;
        background-color: #1e7e34 !important;
    }
    body .paykeeper__button:hover {
        color: #fff !important;
        background-color: #218838 !important;
    }
    body .paykeeper__text {
        font-family: Arial, sans-serif;
        display: block;
        font-size: 16px;
        max-width: 400px;
    }
    body .paykeeper__error {
        font-family: Arial, sans-serif;
        display: block;
        font-size: 14px;
        color:#000;
    }
    @media(max-width: 500px) {
        body .paykeeper__block {
            display: block;
            text-align: center;
        }
    }
</style>