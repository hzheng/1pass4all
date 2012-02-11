APP = 1pass4all
VERSION = 0.2.3
VERSION_STR = v$(subst .,_,$(VERSION))
APP_TITLE = $(APP)-$(VERSION_STR)
TIME := $(shell date +%Y_%m%d_%H%M)
SALT = 9rjixtK35p091K2glFZWDgueRFqmSNfX
# uncomment the next line if you need a refresh salt
#SALT := $(shell base64 < /dev/urandom | tr / - | head -c 32)
PASS_LEN = 10
ITERATION = 100
SRC_DIR = src
LIB_DIR = lib
TPL_DIR = template
BUILD_DIR = build
RESULT_DIR = $(BUILD_DIR)/$(TIME)
BASIC_SRC = $(SRC_DIR)/hasher.js $(SRC_DIR)/passCreator.js
INSTALL_SRC = $(BASIC_SRC) $(SRC_DIR)/1pass4all.js
MOBILE_SRC = $(BASIC_SRC) $(SRC_DIR)/1pass4all_mobile.js
COMPILED_INSTALL_JS = $(BUILD_DIR)/compiled_install.js
COMPILED_MOBILE_JS = $(BUILD_DIR)/compiled_mobile.js
INSTALL_BOOKMARKLET = $(APP).js
INSTALL_SCRIPT_NAME = $(APP_TITLE).js
MOBILE_SCRIPT_NAME = $(APP_TITLE)_mobile.js
ENCODED_JS = $(BUILD_DIR)/encoded.js
INSTALL_TPL = $(TPL_DIR)/install.html
MOBILE_TPL = $(TPL_DIR)/mobile.html
BOOKMARK_URL = $(BUILD_DIR)/bookmark.url
SCRIPT_URL = http:\/\/hzheng.github.com\/$(APP)\/archive\/$(INSTALL_BOOKMARKLET)
APP_HOME_URL = http:\/\/hzheng.github.com\/$(APP)
INSTALL_HTM = $(BUILD_DIR)/install.html
MOBILE_HTM = $(BUILD_DIR)/mobile.html
RESULT_INSTALL_JS = $(BUILD_DIR)/$(INSTALL_SCRIPT_NAME)
RESULT_MOBILE_JS = $(BUILD_DIR)/$(MOBILE_SCRIPT_NAME)

all: init $(INSTALL_HTM) $(MOBILE_HTM) $(BOOKMARK_URL)

init:
	@mkdir -p $(RESULT_DIR)

$(COMPILED_INSTALL_JS): $(INSTALL_SRC)
	@echo "compiling $^ to $@ (salt: $(SALT))"
	@sed -e 's/\(version: "\).*"/\1$(VERSION)"/' -e 's/\(debug = \)true/\10/' \
	     -e 's/\(homeUrl: "\).*"/\1$(APP_HOME_URL)"/' \
		 -e 's/\(passLen: \)[0-9]*,/\1$(PASS_LEN),/' \
		 -e 's/\(iteration: \)[0-9]*,/\1$(ITERATION),/' \
		 -e 's/\(salt: "\).*"/\1$(SALT)"/' $^ \
	 | java -jar $(LIB_DIR)/compiler.jar --js_output_file $@

$(COMPILED_MOBILE_JS): $(MOBILE_SRC)
	@echo "compiling $^ to $@ (salt: $(SALT))"
	@sed -e 's/\(version: "\).*"/\1$(VERSION)"/' -e 's/\(debug = \)true/\10/' \
		 -e 's/\(passLen: \)[0-9]*,/\1$(PASS_LEN),/' \
		 -e 's/\(iteration: \)[0-9]*,/\1$(ITERATION),/' \
		 -e 's/\(salt: "\).*"/\1$(SALT)"/' $^ \
	 | java -jar $(LIB_DIR)/compiler.jar --js_output_file $@

$(RESULT_INSTALL_JS): $(COMPILED_INSTALL_JS)
	@echo "generating wrapped script(bookmarklet):" $@
	@(echo "(function(){" | cat - $<; echo "})();") > $@
	@cp $@ $(RESULT_DIR)/$(INSTALL_BOOKMARKLET)

$(RESULT_MOBILE_JS): $(COMPILED_MOBILE_JS)
	@echo "generating wrapped script(mobile):" $@
	@(echo "(function(){" | cat - $<; echo "})();") > $@

# Chrome and Safari 5 won't work for single percentage signs
# Single quotes must be escaped
$(ENCODED_JS): $(RESULT_INSTALL_JS)
	@echo "generating encoded script:" $@
	@sed -e 's/%/%25/g' -e "s/'/%27/g" $< > $@

$(INSTALL_HTM): $(ENCODED_JS) $(INSTALL_TPL)
	@echo "generating installation page: " $@
	@sed -e 's/$$VERSION/$(VERSION)/'  -e 's/$$SALT/$(SALT)/' -e 's/$$SCRIPT_URL/$(SCRIPT_URL)/' $(INSTALL_TPL) \
		| awk '{if ($$0 ~ /\$$SCRIPT/) {while (getline < "$<") print} else print}'  > $@
	@cp $@ $(RESULT_DIR)/

$(MOBILE_HTM): $(RESULT_MOBILE_JS) $(MOBILE_TPL)
	@echo "generating mobile page: " $@
	@sed -e 's/$$VERSION/$(VERSION)/' -e 's/$$APP_HOME_URL/$(APP_HOME_URL)/' \
		-e 's/$$SALT/$(SALT)/' -e 's/$$PASS_LEN/$(PASS_LEN)/' \
		-e 's/$$ITERATION/$(ITERATION)/' $(MOBILE_TPL) \
		| awk '{if ($$0 ~ /\$$SCRIPT/) {while (getline < "$<") print} else print}'  > $@
	@cp $@ $(RESULT_DIR)/

$(BOOKMARK_URL): $(RESULT_INSTALL_JS)
	@echo "generating bookmark url:" $@
	@echo "javascript:" | cat - $< > $@

clean:
	@rm -rf $(BUILD_DIR)/*

.PHONY: clean init
