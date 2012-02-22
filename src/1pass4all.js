/**
 * 1pass4all's bookmarklet version(need installation)
 */

var onePassForAll = {
    PASS_SYNTAX: "[user ]master_password[ pass_len][ @domain][ *hash_iteration][ +salt][ -options]",
    PASS_REGEX: /^(([^ ]*) +)?([^ ]{6,})( +(\d{1,2}))?( +@([^ ]+))?( +\*(\d+))?( +\+([^ ]+))?( +-([^ ]+))?$/,

    /** Main function */
    main: function(settings) {
        extend(passCreator.settings, settings);
        extend(this.settings, settings);
        try {
            var pwdValues = this._autofill();
        } catch (e) {
            handleError(e, "autofill");
            if (e.retry) {return;}
        }
        try {
            if (!this._autoSubmit) {
                this._showPasswordPanel(pwdValues);
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
        this._autoSubmit = this.settings.autoSubmit === "true";
        if (!domain) {
            if (location.href.indexOf("file://") === 0) {
                domain = "file"; // local
                this._autoSubmit = false;
            }
            else {
                this.raiseError("DomainError", "error_no_domain", true);
            }
        }

        var pwdValues = this._checkPasswordFields();
        if (!pwdValues) {return {domain: domain};}
 
        if (!pwdValues.domain) {
            pwdValues.domain = domain;
        }
        var pwd = passCreator.generate(pwdValues);
        this._pwdFld.value = pwd;
        this.markField(this._pwdFld);
        this._autoSubmit &= (pwdValues.autoSubmit !== false);
        if (this._autoSubmit) {
            log("submitting");
            this._form.submit();
        }
        return pwdValues;
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
                    break;
                }
            }
        }
        if (pwdFlds.length === 0) {
            // some passwords may be not contained in a form
            this._form = null;
            inputs = doc.getElementsByTagName("input");
            for (j = 0; j < inputs.length; ++j) {
                fld = inputs[j];
                if (fld.type == "password" && isVisible(fld)) {
                    log("found a password outside any form");
                    pwdFlds.push(fld);
                }
            }
            // no luck
            if (pwdFlds.length === 0) {
                log("password field not found");
                this._autoSubmit = false;
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
        if (!pwd || pwd.length < passCreator.MIN_MASTER_PASS_LEN) {
            this.markField(pwdFld, true);
            pwdFld.focus();
            this.raiseError("SyntaxError", "error_masterpass_too_short");
        } 
 
        this._pwdFld = pwdFld;
        var singlePwdFld = (this._countPwdFlds(this._form) == 1);
        this._autoSubmit &= singlePwdFld;
        return this.parsePwdValue(pwd, true, singlePwdFld);
    },

    _countPwdFlds: function(form) {
        if (!form) {return 0;}

        var inputs = form.elements;
        var nPwdFlds = 0;
        for (var i = inputs.length - 1; i >= 0; --i) {
            var fld = inputs[i];
            if (fld.type == "password" && isVisible(fld)) {
                ++nPwdFlds;
            }
        }
        log("password field's count: " + nPwdFlds);
        return nPwdFlds;
    },

    parsePwdValue: function(pwd, autoDetect, singlePwdFld) {
        log("parsing " + pwd);
        var groups = this.PASS_REGEX.exec(pwd);
        if (!groups) {
            this.raiseError("SyntaxError", "error_pass_syntax");
        }

        var user = groups[1] ? groups[2] : null;
        if (user === "" && autoDetect) { // autodetect user
            if (singlePwdFld) {
                user = this._findUsername();
            } else {
                this.raiseError("PasswordError", "error_detect_user_with_multipwd");
            }
        }
        var base = null;
        var autoSubmit = null;
        var options = groups[13] || "";
        for (var i = 0; i < options.length; ++i) {
            switch (options[i]) {
                case 'A': base = 64; break;
                case '6': base = 64; break;
                case 'a': base = 62; break;
                case 'n': base = 10; break;
                case 'p': autoSubmit = false; break;
                default: this.raiseError("SyntaxError",
                                 messages.get("error_option") + options[i]);
            }
        }
        return {user: user, pass: groups[3], passLen: groups[5] || 0,
                domain: groups[7] || "", iteration: groups[9] || 0,
                salt: groups[11] || "", passBase: base,
                autoSubmit: autoSubmit};
    },

    _findUsername: function() {
        var userFld;
        var userHidden; // candidate(useful for websites like gmail, yahoo mail)
        if (this._form) {
            var pwdFldFound = false;
            for (var i = this._form.elements.length - 1; i >= 0; --i) {
                var fld = this._form.elements[i];
                if (fld == this._pwdFld) {
                    pwdFldFound = true;
                } else if (pwdFldFound) {
                    var isShown = isVisible(fld);
                    // only look for the fields BEFORE the password field
                    if (fld.type == "text" && isShown) {
                        userFld = fld;
                        break;
                    } else if ((fld.type == "hidden" || !isShown)  &&
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
        autoSubmit: "true", // string(NOT boolean), may be modified by Makefile
        // styles
        fldSucceedStyle: {background: "#33FF66"},
        fldFailStyle: {background: "red"},
        panelCss: "position: fixed; top: 2px; right: 2px; width: 320px;" +
            "z-index: 2147483647; background-color: #DCDCDC;" +
            "margin: auto; padding: 6px 2px; border: 2px outset;" +
            "-moz-border-radius: 10px; -webkit-border-radius: 10px;" +
            "border-radius: 10px; -khtml-border-radius: 10px;",
        labelCss: "float: left; width: 40%; margin: 0 6px 0 0;" +
            "padding: 2px 1px; text-align: right;" +
            "font: normal 10pt arial,verdana,sans-serif",
        fldCss: "overflow: hidden; width: 55%",
        inputCss: "width: 100%; margin: 3px 2px; padding: 2px;" +
            "border: none;" +
            "background: #FFF;",
        selectCss: "width: 55%; margin: 3px 2px; padding: 2px",
        buttonCss: "background: #7182A4; color: #FFFFFF;" +
            "margin: 2px; border: 0px; padding: 2px 6px;" +
            "font: normal 9pt arial;" +
            "-moz-border-radius: 8px; -webkit-border-radius: 8px;" +
            "border-radius: 8px; -khtml-border-radius: 8px",
        titleBarStyle: {width: "100%", 
            color: "#1E1F21", 'background-color': "transparent",
            borderBottom: "2px inset #CACED6",
            marginBottom: "6px", padding: "0"},
        titleStyle: {width: "70%", padding: "1px 2px", margin: "1px",
            font: "bold 12pt serif"},
        topBtnStyle: {cssFloat: "right", cursor: "pointer",
            padding: "1px 6px", border: "none", "text-decoration": "none",
            color: "#5B657A", font: "normal 14px tahoma,arial,sans-serif"},
        advancedDivStyle: {width: "100%", display: "none"},
        cmdDivStyle: {width: "75%", margin: "8px auto"},
        genBtnStyle: {cssFloat: "left"},
        clearBtnStyle: {cssFloat: "right"},
        msgDivStyle: {width: "100%", 'text-align': "center", 
            font: "normal 10pt arial", display: "none"},
        msgFldStyle: {color: "red", background: "transparent", border: "none", 'text-align': "center"},
        resultDivStyle: {width: "100%", 'text-align': "center", 
            font: "normal 10pt arial", display: "none"},
        resultFldStyle: {color: "green", background: "transparent", border: "none", 'text-align': "center"}
    }
};

messages.add({
    error_pass_syntax: {
        en: "Password format error. \n" +
            "The correct format is(bracketed terms are optional):\n" +
            onePassForAll.PASS_SYNTAX + "\n\n" +
            "where master_password's length is at least 6,\n" +
            "the generated password's length pass_len is a positive integer less than 100,\n" +
            "hash_iteration is an integer(0-9999),\n" +
            "options are other options(e.g. p: disable auto-submit)",
        zh: "密码格式错误。正确格式为（[]内为可选项）：\n" +
            onePassForAll.PASS_SYNTAX + "\n\n" +
            "其中主密码master_password长度不小于6位，\n" +
            "生成密码长度pass_len是一个小于100的正整数，\n" +
            "hash迭代次数hash_iteration是一个整数（0-9999），\n" +
            "options是其他选项（p表示禁止自动提交）。"
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
    error_option: {
        en: "unknown option in password: -",
        zh: "密码中有未知选项：-"
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
