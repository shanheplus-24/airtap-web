# AirTAP web

The browser frontend is published at https://shanheplus-24.github.io/airtap-web/.
Simulation runs on the separately managed NANOENERGYLAB service. An access code is required; credentials are never stored in this repository.

`site/` contains the production frontend and authenticated API transport. `frontend/` preserves its React/Vite source. `server/` contains the gateway that protects the compute service. GitHub Pages deploys only `site/`.

The current compute connection is a temporary HTTPS tunnel. Its address in `site/compute-config.js` must be updated after a tunnel restart. The website address remains unchanged. The compute service currently has a 24-hour trial limit and does not automatically recover after a server reboot.

The original Flowsheet Processor UI license and copyright notices are retained in `LICENSE`.
