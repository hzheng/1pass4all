SRC_DIR = src
LIB_DIR = lib
BUILD_DIR = build
SRC_JS = $(SRC_DIR)/hasher.js $(SRC_DIR)/passCreator.js
COMPILED_JS = $(BUILD_DIR)/all.js
INSTALL_HTM = $(BUILD_DIR)/install.html
BOOKMARK_URL = $(BUILD_DIR)/bookmark.url
SALT = $(shell base64 < /dev/urandom | tr / - | head -c 32)

all: $(INSTALL_HTM) $(BOOKMARK_URL)

$(COMPILED_JS): $(SRC_JS)
	@echo "compiling " $^ to $@
	@mkdir -p $(BUILD_DIR)
	sed -e 's/\(debug = \)true/\10/' -e 's/\(salt: "\).*"/\1$(SALT)"/' $^ | java -jar $(LIB_DIR)/compiler.jar --js_output_file $@

$(INSTALL_HTM): $(COMPILED_JS)
	@echo "generating installation page: " $@
	@(echo "Please drag the link <a href='javascript:(function(){" | cat - $^; \
		echo "})();'>1pass4all</a> to your browser's bookmark bar.") > $@

$(BOOKMARK_URL): $(COMPILED_JS)
	@echo "generating bookmark url: " $@
	@(echo "javascript:(function(){" | cat - $^; echo "})();") > $@

clean:
	@rm -f $(BUILD_DIR)/*

.PHONY: clean
