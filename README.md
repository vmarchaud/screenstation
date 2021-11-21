# Screenstation

**NOTE: I've stopped using this product a while ago (mostly we removed big screens at my office after covid so i don't have an use right now) but it should works fine.**

Screenstation is a group of services used to remotely manages a fleet of screens across multiple rooms or offices.

When working at Keymetrics, some developers were working on a internal product that was allowing to manage screens that we had around our offices to display specific pages (mostly monitoring or BI).
When i left and joined Reelevant we had the same issue, sadly they didn't released the internal tool to the world so i motived myself to code a simpler version. One of my goal was to be able to use chromecast to avoid using as many PI's as screens i had.

Here the different services:
- `api` is the gateway that the `frontend` use to communicate to `workers` (over websockets)
  - its automatically exposed on `api-screenstation.local` (using mdns).
  - its register `workers.screenstation.local` which is used by worker to connect to it (using mdns too).
- `frontend` is the UI that allows to manage all `workers`
  - its automatically exposed on `screenstation.local` (again using mdns)
- `worker` is the actual worker that you'll need to deploy on each hardware.
  - one worker can use the screen connected to it and can *cast* to any chromecast available in its network.

A summary of features that you can use:
- Cast to the worker's attached screen
- Cast to any chromecast inside the network
- Automatically refresh any page every configurable interval
- Remotely connect to any screen to click/type on it (if you can to log yourself for ex.)
- If you shutdown a worker, it will stop sharing to any chromecast but will start again on startup.
- If someone take the control of a chromecast, the worker will wait for it to be available again to avoid a war :)

# How to use

Currently targeting both `armv7` (except of the frontend, but shouldn't be hard to build from source) and `x86`, you can find the last build i've made on the latest release (v0.3.3). 
When you have all binaries on your host, you simply need to launch them one by one (order: api -> worker -> frontend). There are systemd service template in `/deploy` if you want.
All the services are discovering themselves over mdns so there is no config to do prior to launching all services.
After few seconds, you should be able to reach `screenstation.local` from your browser.

