APP = 1pass4all
VERSION = 0.1.0
VERSION_STR = v$(subst .,_,$(VERSION))
APP_TITLE = $(APP)-$(VERSION_STR)
TIME := $(shell date +%Y_%m%d_%H%M)
PUBLISHED_TIME := 2012_0206_1354
DYNAMIC_SALT := $(shell base64 < /dev/urandom | tr / - | head -c 32)
FIXED_SALT = 9rjixtK35p091K2glFZWDgueRFqmSNfX
SALT = $(DYNAMIC_SALT)
# uncomment the next line when you need a constant salt
#SALT = $(FIXED_SALT)
SRC_DIR = src
LIB_DIR = lib
TPL_DIR = template
BUILD_DIR = build
RESULT_DIR = $(BUILD_DIR)/$(TIME)
SRC_JS = $(SRC_DIR)/hasher.js $(SRC_DIR)/passCreator.js
COMPILED_JS = $(BUILD_DIR)/compiled.js
SCRIPT_NAME = $(APP_TITLE).js
ENCODED_JS = $(BUILD_DIR)/encoded.js
INSTALL_TPL = $(TPL_DIR)/install.html
BOOKMARK_URL = $(BUILD_DIR)/bookmark.url
SCRIPT_URL = http:\/\/hzheng.github.com\/$(APP)\/archive\/$(PUBLISHED_TIME)\/$(SCRIPT_NAME)
INSTALL_HTM = $(BUILD_DIR)/install.html
RESULT_JS = $(BUILD_DIR)/$(SCRIPT_NAME)

all: $(INSTALL_HTM) $(BOOKMARK_URL)

$(COMPILED_JS): $(SRC_JS)
	@echo "compiling $^ to $@ (salt: $(SALT))"
	@mkdir -p $(RESULT_DIR)
	@sed -e 's/\(version: "\).*"/\1$(VERSION)"/' -e 's/\(debug = \)true/\10/' \
		 -e 's/\(salt: "\).*"/\1$(SALT)"/' $^ \
	 | java -jar $(LIB_DIR)/compiler.jar --js_output_file $@

$(RESULT_JS): $(COMPILED_JS)
	@echo "generating wrapped script:" $@
	@(echo "(function(){" | cat - $<; echo "})();") > $@
	@cp $@ $(RESULT_DIR)/

# Chrome and Safari 5 won't work for single percentage signs
$(ENCODED_JS): $(RESULT_JS)
	@echo "generating encoded script:" $@
	@sed -e 's/%/%25/g' $< > $@

$(INSTALL_HTM): $(ENCODED_JS) $(INSTALL_TPL)
	@echo "generating installation page: " $@
	@sed -e 's/$$VERSION/$(VERSION)/'  -e 's/$$SALT/$(SALT)/' -e 's/$$SCRIPT_URL/$(SCRIPT_URL)/' $(INSTALL_TPL) \
		| awk '{if ($$0 ~ /\$$SCRIPT/) {while (getline < "$<") print} else print}'  > $@
	@cp $@ $(RESULT_DIR)/

$(BOOKMARK_URL): $(RESULT_JS)
	@echo "generating bookmark url:" $@
	@echo "javascript:" | cat - $< > $@

clean:
	@rm -rf $(BUILD_DIR)/*

.PHONY: clean
