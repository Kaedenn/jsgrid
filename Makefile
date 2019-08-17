
SOURCES = $(wildcard *.js)

.PHONY: lint

lint:
	npx eslint $(SOURCES)
