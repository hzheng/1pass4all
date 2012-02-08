/**
 * 1pass4all's bookmarklet version(need installation)
 */

// password syntax
var PASS_SYNTAX = "[user ]master_password[ pass_len][ *hash_iteration][ +salt]"; 
var PASS_REGEX = /^(([^ ]*) +)?([^ ]{6,})( +(\d{1,2}))?( +\*(\d+))?( +\+([^ ]+))?( +!([^ ]*))?$/;

var onePassForAll = {
    /** Main function */
    main: function(settings) {
        extend(passCreator.settings, settings);
        try {
            var result = this._autofill();
        } catch (e) {
            handleError(e, "autofill");
            if (e.retry) {return;}
        }
        try {
            if (!result || !result[0]) { // no auto-submit
                this._showPasswordPanel(result && result[1]);
            }
        } catch (e2) {
            handleError(e2, "showPanel");
        }
    },

    markField: function(field, error) {
        setStyles(field, this.settings[error ? "fldFailStyle" : "fldSucceedStyle"]);
    },

    raiseError: function(name, msgId, fatal) {
        throw {
            name: name,
            message: messages.get(msgId) || msgId,
            retry: !fatal
        };
    },

    _autofill: function() {
        var domain = getDomain();
        var autoSubmit = this.settings.autoSubmit;
        if (!domain) {
            if (location.href.indexOf("file://") === 0) {
                domain = "file"; // local
                autoSubmit = false;
            }
            else {
                this.raiseError("DomainError", "error_no_domain", true);
            }
        }

        var pwdValues = this._checkPasswordFields();
        if (!pwdValues) {return [false, null];}
 
        pwdValues.domain = domain;
        var pwd = passCreator.generate(pwdValues.pass, domain, pwdValues.user,
                pwdValues.passLen, pwdValues.iteration, pwdValues.salt);
        this._pwdFld.value = pwd;
        this.markField(this._pwdFld);
        autoSubmit &= (this._form && (this._pwdFlds.length == 1));
        var cmd = pwdValues.cmd;
        autoSubmit &= (cmd === ""); // currently, any command means no-autoSubmit
        if (autoSubmit) {
            log("submitting");
            this._form.submit();
        }
        return [autoSubmit, pwdValues];
    },

    _getDocument: function(doc) {
        var el = doc.activeElement;
        if (!el || el.tagName != "IFRAME") {return doc;}

        doc = el.contentWindow || el.contentDocument;
        try {
            if (doc.document) {
                doc = doc.document;
            }
            return this._getDocument(doc);
        } catch (e) { // probably due to security reason(e.g. XSS)
            return document; // give up, return the original document
        }
    },

    _checkPasswordFields: function() {
        this._form = null;
        var pwdFlds = [];
        var doc = this._getDocument(document);
        var focused = doc.activeElement;
        var forms = doc.forms || [];
        for (var i = 0; i < forms.length; ++i) {
            var form = forms[i];
            // form.getElementsByTagName won't work(except IE) if form is inside a table
            //var inputs = form.getElementsByTagName("input");
            var inputs = form.elements;
            for (var j = 0; j < inputs.length; ++j) {
                var fld = inputs[j];
                if (fld.type != "password" || !isVisible(fld)) {
                    continue;
                }

                if (!this._form) {
                    this._form = form;
                }
                if (this._form == form) {
                    pwdFlds.push(fld);
                } else if (focused == fld) {
                    // always use the first form that contains password,
                    // unless the later one's password field is focused
                    this._form = form;
                    pwdFlds = [fld];
                }
            }
        }
        if (pwdFlds.length === 0) {
            if (focused && focused.type == "password") { 
                // last chance(no form)
                pwdFlds = [fld];
            } else {
                log("password field not found");
                return;
            }
        } 
        var pwdFld;
        for (i = pwdFlds.length - 1; i >= 0; --i) {
            if (pwdFlds[i] == focused) {
                pwdFld = focused;
                break;
            }
        }
        if (!pwdFld) { // choose the first one if none is focused
            pwdFld = pwdFlds[0];
        }
        var pwd = pwdFld.value;
        if (!pwd) {
            this.markField(pwdFld, true);
            pwdFld.focus();
            this.raiseError("PasswordError", "error_empty_pass");
        } 
 
        this._pwdFlds = pwdFlds;
        this._pwdFld = pwdFld;
        return this.parsePwdValue(pwd);
    },

    parsePwdValue: function(pwd, noAutoDetect) {
        var groups = PASS_REGEX.exec(pwd);
        if (!groups) {
            this.raiseError("SyntaxError", "error_pass_syntax");
        }

        var user = groups[1] ? groups[2] : null;
        if (user === "" && !noAutoDetect) { // autodetect user
            user = this._findUsername();
        }
        return {user: user, pass: groups[3], passLen: groups[5] || 0,
                iteration: groups[7] || 0, salt: groups[9] || "", cmd: groups[11] || ""};
    },

    _findUsername: function() {
        // ask for autodetect username
        if (this._pwdFlds.length > 1) {
            this.raiseError("PasswordError", "error_detect_user_with_multipwd");
        }

        var userFld;
        var userHidden; // candidate(useful for websites like gmail, yahoo mail)
        if (this._form) {
            var pwdFldFound = false;
            for (var i = this._form.elements.length - 1; i >= 0; --i) {
                var fld = this._form.elements[i];
                if (fld == this._pwdFld) {
                    pwdFldFound = true;
                } else if (pwdFldFound) {
                    // only look for the fields BEFORE the password field
                    if (fld.type == "text" && isVisible(fld)) {
                        userFld = fld;
                        break;
                    } else if (fld.type == "hidden" &&
                            /(email|username|login)$/i.test(fld.name)) {
                        userHidden = fld;
                    } else {
                        log("skipped " + fld);
                    }
                }
            }
        }
        userFld = userFld || userHidden;
        if (!userFld) {
            this.raiseError("PasswordError", "error_detect_user");
        }
        if (!userFld.value) {
            this.markField(userFld, true);
            userFld.focus();
            this.raiseError("LoginError", "error_empty_user");
        }
        log("user=" + userFld.value);
        this.markField(userFld);
        return userFld.value;
    },

    /** Show form */
    _showPasswordPanel: function(pwdValues) {
        var panel = document.getElementById(passCreator.PANEL_ID);
        if (panel) {
            panel.style.display = "block";
        } else {
            passCreator.createPasswordPanel(null, this.settings, pwdValues);
        }
    },

    settings: {
        autoSubmit: true,
        // styles
        fldSucceedStyle: {background: "#33FF66"},
        fldFailStyle: {background: "red"},
        panelCss: "position: fixed; top: 2px; right: 2px; width: 320px;" +
            "z-index: 2147483647; background-color: #c9c9c9;" +
            "margin: auto; padding: 6px 2px; border: 2px outset;" +
            "-moz-border-radius: 10px; -webkit-border-radius: 10px;" +
            "border-radius: 10px; -khtml-border-radius: 10px;",
        labelCss: "float: left; width: 40%; margin-right: 6px;" +
            "padding-top: 2px; text-align: right;" +
            "font: normal 10pt arial,verdana,sans-serif",
        inputCss: "width: 55%; margin: 3px 2px;",
        buttonCss: "background: #7182A4; color: #FFFFFF;" +
            "margin: 2px; border: 0px;" +
            "-moz-border-radius: 8px; -webkit-border-radius: 8px;" +
            "border-radius: 8px; -khtml-border-radius: 8px",
        titleBarStyle: {width: "100%", 
            color: "#1E1F21", 'background-color': "transparent",
            borderBottom: "2px inset #CACED6",
            marginBottom: "6px", padding: "0"},
        titleStyle: {width: "70%", padding: "1px 2px",
            font: "bold 12pt serif"},
        topBtnStyle: {cssFloat: "right", cursor: "pointer",
            padding: "1px 6px",
            color: "#5B657A", font: "normal 14px tahoma,arial,sans-serif"},
        inputRegionStyle: {},
        advancedDivStyle: {width: "100%", display: "none"},
        cmdDivStyle: {width: "75%", margin: "8px auto"},
        genBtnStyle: {cssFloat: "left"},
        clearBtnStyle: {cssFloat: "right"},
        resultDivStyle: {width: "100%", display: "none"},
        genpassStyle: {background: "transparent", color: "red",
            border: "0", 'font-weight': "bold"},
        errorDivStyle: {margin: "0 auto", width: "60%", font: "normal 10pt arial",
            color: "red", display: "none"}
    }
};

messages.add({
    error_pass_syntax: {
        en: "Password format error. \n" +
            "The correct format is(bracketed terms are optional):\n" +
            PASS_SYNTAX + "\n\n" +
            "where the length of master_password is at least 6,\n" +
            "the length of generated password pass_len is a positive integer less than 100,\n" +
            "hash_iteration is a positive integer.",
        zh: "密码格式错误。正确格式为（[]内为可选项）：\n" +
            PASS_SYNTAX + "\n\n" +
            "其中主密码master_password长度不小于6位\n" +
            "生成密码长度pass_len是一个小于100的正整数,\n" +
            "hash迭代次数hash_iteration是一个正整数。"
    },
    error_detect_user_with_multipwd: {
        en: 
            "No username auto-detection when multiple password " +
            "fields are available. Please manually type username before " +
            "the leading white space or remove the space to ignore username.",
        zh:
            "多个密码项存在时将关闭用户名自动检查，" +
            "请在密码中的开头空格前手工输入用户名，或去掉该空格以忽略用户名。"
    },
    error_detect_user: {
        en: 
            "Sorry, cannot auto-detect username field. Please remove " +
            "the leading white space from the password or manually " +
            "type username before that white space.",
        zh:
            "抱歉无法自动检查到用户名，" +
            "请去掉密码中的开头空格，或在该空格前手工输入用户名。"
    }
});

if (window.test && debug) {
    log("in unit test");
} else {
    // read global settings(typically for offline script in IE favelet)
    onePassForAll.main(window._1pass4all_settings);
}
