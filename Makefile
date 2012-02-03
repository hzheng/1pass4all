SRC_DIR = src
LIB_DIR = lib
TPL_DIR = template
BUILD_DIR = build
SRC_JS = $(SRC_DIR)/hasher.js $(SRC_DIR)/passCreator.js
COMPILED_JS = $(BUILD_DIR)/compiled.js
VERSION = v0_1
SCRIPT_NAME = 1pass4all-$(VERSION).js
WRAPPED_JS = $(BUILD_DIR)/$(SCRIPT_NAME)
INSTALL_HTM = $(BUILD_DIR)/install.html
INSTALL_TPL = $(TPL_DIR)/install.html
BOOKMARK_URL = $(BUILD_DIR)/bookmark.url
SALT := $(shell base64 < /dev/urandom | tr / - | head -c 32)
SCRIPT_URL = http://static.zhenghui.org/1pass4all/$(SCRIPT_NAME)

all: $(INSTALL_HTM) $(BOOKMARK_URL)

$(COMPILED_JS): $(SRC_JS)
	@echo "compiling $^ to $@ (salt: $(SALT))"
	@mkdir -p $(BUILD_DIR)
	@sed -e 's/\(debug = \)true/\10/' -e 's/\(salt: "\).*"/\1$(SALT)"/' $^ \
    | java -jar $(LIB_DIR)/compiler.jar --js_output_file $@

$(WRAPPED_JS): $(COMPILED_JS)
	@echo "generating wrapped script:" $@
	@(echo "(function(){" | cat - $<; echo "})();") > $@

$(INSTALL_HTM): $(WRAPPED_JS) $(INSTALL_TPL)
	@echo "generating installation page: " $@
	@awk '{if ($$0 ~ /\$$SCRIPT_URL/) {print "$(SCRIPT_URL)"} else if ($$0 ~ /\$$SCRIPT/) {while (getline < "$<") print} else print}' $(INSTALL_TPL) > $@

$(BOOKMARK_URL): $(WRAPPED_JS)
	@echo "generating bookmark url:" $@
	@echo "javascript:" | cat - $< > $@

clean:
	@rm -f $(BUILD_DIR)/*

.PHONY: clean
