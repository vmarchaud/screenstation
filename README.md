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

# Screenshots

### Homescreen
![Screenshot from 2021-11-21 17-31-05](https://user-images.githubusercontent.com/2820968/142770716-f51554f7-758a-43d5-a699-bfb909e5a8b4.png)
### Set a refresh time for a view
![Screenshot from 2021-11-21 17-31-27](https://user-images.githubusercontent.com/2820968/142770719-a55e9124-db47-4545-aacd-9bb32b38e053.png)
### Remotely control a view
![Screenshot from 2021-11-21 17-31-46](https://user-images.githubusercontent.com/2820968/142770741-5e25bad5-89b7-4973-bdfc-d3e5c1ff5f72.png)
### Set an url
![Screenshot from 2021-11-21 17-32-09](https://user-images.githubusercontent.com/2820968/142770742-f6db8fe0-3604-4732-9cf5-097c5ee403c0.png)
### Cast to a chromecast
![Screenshot from 2021-11-21 17-35-02](https://user-images.githubusercontent.com/2820968/142770744-9ae9ff42-db3d-4584-af26-56a618448d3e.png)


