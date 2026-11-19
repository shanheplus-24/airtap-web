# AirTAP Physics and Surrogate web

Website: https://shanheplus-24.github.io/airtap-web/

The published interface matches the active `WaterTAP_New/UI` frontend. It provides independent `AirTAP Physics` (`watertap.flowsheets.airtap_harvester.airtap_ui`) and `AirTAP Surrogate` (`watertap.flowsheets.airtap_surrogate.airtap_ui`) entries, material FIXED/OPTIMAL controls, location/date inputs, the three native objectives, transient/daily plots and Excel results export.

`site/` contains the production frontend and authenticated API transport; `frontend/` contains its matching React/Vite source. GitHub Pages deploys only `site/`. Native models and the packaged GRU assets run privately on NANOENERGYLAB; no model assets, research data or access credentials are published here.

`server/` contains the authenticated gateway. Its primary backend is the verified `WaterTAP_New` release; access to prior job records is retained through the previous private backend. The website uses the existing private access code.

The compute service is still a 24-hour trial, using a temporary HTTPS tunnel whose hostname changes after a tunnel restart. A server reboot requires recovery of the mounted environment and services. The Pages website address remains fixed; this is not a permanent multi-user compute deployment.

The original Flowsheet Processor UI license and copyright notices are retained in `LICENSE`.
