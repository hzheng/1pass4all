### APP VARIABLES
APP = 1pass4all
VERSION = 0.2.6
VERSION_STR = v$(subst .,_,$(VERSION))
APP_TITLE = $(APP)-$(VERSION_STR)
BOOKMARKLET_NAME = $(APP).js
TIME := $(shell date +%Y_%m%d_%H%M)

### PARAMETERS
SALT = 9rjixtK35p091K2glFZWDgueRFqmSNfX
# uncomment the next line if you need a refresh salt
#SALT := $(shell base64 < /dev/urandom | tr / - | head -c 32)
PASS_LEN = 10
PASS_BASE = 94
ITERATION = 100
# auto-submit(true or false)
AUTO_SUBMIT = true
SCRIPT_URL = http:\/\/hzheng.github.com\/$(APP)\/archive\/$(BOOKMARKLET_NAME)
APP_HOME_URL = http:\/\/hzheng.github.com\/$(APP)

### DIRECTORIES
SRC_DIR = src
LIB_DIR = lib
TPL_DIR = template
RES_DIR = resources
BUILD_DIR = build
#DIST_DIR = $(BUILD_DIR)/$(TIME)
DIST_DIR = $(BUILD_DIR)/dist

### SOURCES
BASIC_SRC = $(SRC_DIR)/hasher.js $(SRC_DIR)/passCreator.js
BOOKMARKLET_SRC = $(BASIC_SRC) $(SRC_DIR)/1pass4all.js
MOBILE_SRC = $(BASIC_SRC) $(SRC_DIR)/1pass4all_mobile.js
INSTALL_RES = $(SRC_DIR)/install.js $(SRC_DIR)/install.css
INSTALL_TPL = $(TPL_DIR)/install.html
INSTALL_ZH_TPL = $(TPL_DIR)/install_zh.html
MOBILE_TPL = $(TPL_DIR)/mobile.html

### BUILDS
COMPILED_BOOKMARKLET_JS = $(BUILD_DIR)/compiled_bookmarklet.js
COMPILED_MOBILE_JS = $(BUILD_DIR)/compiled_mobile.js
ENCODED_JS = $(BUILD_DIR)/encoded.js
BOOKMARKLET_URL = $(BUILD_DIR)/bookmark.url
INSTALL_HTM = $(BUILD_DIR)/install.html
INSTALL_ZH_HTM = $(BUILD_DIR)/install_zh.html
MOBILE_HTM = $(BUILD_DIR)/mobile.html
BUILT_BOOKMARKLET_JS = $(BUILD_DIR)/$(APP_TITLE).js
BUILT_MOBILE_JS = $(BUILD_DIR)/$(APP_TITLE)_mobile.js
MOBILE_URL = $(BUILD_DIR)/mobile.url

### TARGETS
all: init $(INSTALL_HTM) $(INSTALL_ZH_HTM) $(BOOKMARKLET_URL)

init:
	@mkdir -p $(DIST_DIR)

$(COMPILED_BOOKMARKLET_JS): $(BOOKMARKLET_SRC)
	@echo "compiling $^ to $@ (salt: $(SALT))"
	@sed -e 's/\(version: "\).*"/\1$(VERSION)"/' -e 's/\(debug = \)true/\10/' \
	     -e 's/\(autoSubmit: "\).*"/\1$(AUTO_SUBMIT)"/' \
	     -e 's/\(homeUrl: "\).*"/\1$(APP_HOME_URL)"/' \
	     -e 's/\(passLen: "\).*"/\1$(PASS_LEN)"/' \
	     -e 's/\(passBase: "\).*"/\1$(PASS_BASE)"/' \
	     -e 's/\(iteration: "\).*"/\1$(ITERATION)"/' \
		 -e 's/\(salt: "\).*"/\1$(SALT)"/' $^ \
	 | java -jar $(LIB_DIR)/compiler.jar --js_output_file $@

$(COMPILED_MOBILE_JS): $(MOBILE_SRC)
	@echo "compiling $^ to $@ (salt: $(SALT))"
	@sed -e 's/\(version: "\).*"/\1$(VERSION)"/' -e 's/\(debug = \)true/\10/' \
	     -e 's/\(passLen: "\).*"/\1$(PASS_LEN)"/' \
	     -e 's/\(passBase: "\).*"/\1$(PASS_BASE)"/' \
	     -e 's/\(iteration: "\).*"/\1$(ITERATION)"/' \
		 -e 's/\(salt: "\).*"/\1$(SALT)"/' $^ \
	 | java -jar $(LIB_DIR)/compiler.jar --js_output_file $@

$(BUILT_BOOKMARKLET_JS): $(COMPILED_BOOKMARKLET_JS)
	@echo "generating wrapped script(bookmarklet):" $@
	@(echo "(function(){" | cat - $<; echo "})();") > $@
	@cp $@ $(DIST_DIR)/$(BOOKMARKLET_NAME)

$(BUILT_MOBILE_JS): $(COMPILED_MOBILE_JS)
	@echo "generating wrapped script(mobile):" $@
	@(echo "(function(){" | cat - $<; echo "})();") > $@

# Chrome and Safari 5 won't work for single percentage signs
# Single quotes must be escaped
$(ENCODED_JS): $(BUILT_BOOKMARKLET_JS)
	@echo "generating encoded script:" $@
	@sed -e 's/%/%25/g' -e "s/'/%27/g" $< > $@

$(INSTALL_HTM): $(ENCODED_JS) $(INSTALL_TPL) $(INSTALL_RES) $(MOBILE_URL)
	@echo "generating installation page: " $@
	@sed -e 's/$$VERSION/$(VERSION)/' -e 's/$$SCRIPT_URL/$(SCRIPT_URL)/' \
		 -e 's/$$SALT/$(SALT)/' -e 's/$$ITERATION/$(ITERATION)/' \
		 -e 's/$$PASS_LEN/$(PASS_LEN)/' -e 's/$$PASS_BASE/$(PASS_BASE)/' \
         -e 's/$$AUTO_SUBMIT/$(AUTO_SUBMIT)/' $(INSTALL_TPL) \
		| awk '{if ($$0 ~ /\$$MOBILE_URL/) {while (getline < "$(MOBILE_URL)") print} else if ($$0 ~ /\$$SCRIPT/) {while (getline < "$<") print} else print}'  > $@
	@cp $@ $(INSTALL_RES) $(RES_DIR)/* $(DIST_DIR)/

$(INSTALL_ZH_HTM): $(ENCODED_JS) $(INSTALL_ZH_TPL) $(MOBILE_URL)
	@echo "generating Chinese installation page: " $@
	@sed -e 's/$$VERSION/$(VERSION)/' -e 's/$$SCRIPT_URL/$(SCRIPT_URL)/' \
		 -e 's/$$SALT/$(SALT)/' -e 's/$$ITERATION/$(ITERATION)/' \
		 -e 's/$$PASS_LEN/$(PASS_LEN)/' -e 's/$$PASS_BASE/$(PASS_BASE)/' \
         -e 's/$$AUTO_SUBMIT/$(AUTO_SUBMIT)/' $(INSTALL_ZH_TPL) \
		| awk '{if ($$0 ~ /\$$MOBILE_URL/) {while (getline < "$(MOBILE_URL)") print} else if ($$0 ~ /\$$SCRIPT/) {while (getline < "$<") print} else print}'  > $@
	@cp $@ $(INSTALL_RES) $(RES_DIR)/* $(DIST_DIR)/
	@cp $@ $(DIST_DIR)/

$(MOBILE_HTM): $(BUILT_MOBILE_JS) $(MOBILE_TPL)
	@echo "generating mobile page: " $@
	@sed -e 's/$$VERSION/$(VERSION)/' -e 's/$$APP_HOME_URL/$(APP_HOME_URL)/' \
		-e 's/$$SALT/$(SALT)/' -e 's/$$PASS_LEN/$(PASS_LEN)/' \
		-e 's/$$ITERATION/$(ITERATION)/' $(MOBILE_TPL) \
		| awk '{if ($$0 ~ /\$$SCRIPT/) {while (getline < "$<") print} else print}'  > $@
	@cp $@ $(DIST_DIR)/

$(MOBILE_URL): $(MOBILE_HTM)
	@echo "generating mobile url: " $@
	@perl -MMIME::Base64 -0777 -ne '$$_= encode_base64($$_);s/\s+//g;print "data:text/html;charset=utf-8;base64,$$_"' < $< > $@

$(BOOKMARKLET_URL): $(BUILT_BOOKMARKLET_JS)
	@echo "generating bookmark url:" $@
	@echo "javascript:" | cat - $< > $@

clean:
	@rm -rf $(BUILD_DIR)/*

.PHONY: clean init
