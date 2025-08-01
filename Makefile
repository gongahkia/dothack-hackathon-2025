.PHONY: backend frontend dev

backend:
	python3 backend.py

frontend:
	npm run dev

dev:
	# The & allows both to run concurrently
	$(MAKE) backend & $(MAKE) frontend