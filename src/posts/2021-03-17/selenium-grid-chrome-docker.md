---
title: "Fix \"session deleted because of page crash\" when using Selenium Grid and Docker"
date: "2021-03-17"
path: "/2021-03-17/fix-session-deleted-page-crash-selenium-grid-chrome-docker"
coverImage: "./error.png"
author: "Joel"
excerpt: "What to do if you run into the page-crash error while running a chrome node in selenium grid with docker"
tags: ["ci", "selenium", "selenium-grid", "docker"]
---

Recently I created a CI pipeline that stands up a local selenium grid and then pipeline jobs run WebdriverIO tests against that selenium grid.

I noticed that when I ran more than a single feature file in parallel, that the first process for the first feature file would succeed, but all others would fail with the following error saying something about the page crashing:

```prolog
[0-5] 2021-03-16T18:49:58.094Z WARN webdriver: Request failed with status 500 due to unknown error: session deleted because of page crash                                     
from unknown error: cannot determine loading status                                                                                                                           
from tab crashed                                                                                                                                                              
  (Session info: chrome=89.0.4389.82)                                                                                                                                         
[0-5] 2021-03-16T18:49:58.103Z ERROR webdriver: Request failed with status 404 due to invalid session id: invalid session id
```

From then on, WebDriver would log that it was trying to connect to the session but not finding the session id and timing out.

```prolog
[0-5] 2021-03-16T18:49:58.118Z WARN webdriver: Request failed with status 500 due to Session [cdc0c2a1ee9d791bd13827a53754de91] was terminated due to BROWSER_TIMEOUT         
[0-5] 2021-03-16T18:49:58.124Z WARN webdriver: Request failed with status 500 due to Session [cdc0c2a1ee9d791bd13827a53754de91] was terminated due to BROWSER_TIMEOUT         
[0-5] 2021-03-16T18:49:58.129Z ERROR webdriver: Request failed with status 500 due to unknown error: Session [cdc0c2a1ee9d791bd13827a53754de91] was terminated due to BROWSER_
TIMEOUT
```

The selenium grid was configured to allow 20 concurrent sessions, as was the single Chrome node, so I was perplexed!

```yaml
selenium_hub:
  image: selenium/hub
  ports:
    - 4444
  environment:
    - SE_OPTS=-debug
    - GRID_MAX_SESSION=20
    - GRID_BROWSER_TIMEOUT=10000
    - GRID_TIMEOUT=10000
chrome:
  image: selenium/node-chrome
  depends_on:
    - selenium_hub
  environment: 
    - NODE_MAX_SESSION=20
    - NODE_MAX_INSTANCES=20
    - HUB_HOST=selenium_hub
    - HUB_PORT=4444
```

I was looking into this with a coworker when I googled the error message and came across this [StackOverflow answer](https://stackoverflow.com/a/53970825), which pointed me to this [github issue](https://github.com/elgalu/docker-selenium/issues/20) which tipped me off that, "... recent version(s) of *Chrome seem to crash in Docker containers, on certain pages, due to too small /dev/shm.*"

Given this limitation, there were a few ways to handle this

- Increase the size of `/dev/shm` with the `--shm-size` option (I believe `shm` stands for shared memory)
- Mount `/dev/shm:/dev/shm` from the host to the container
- Disable `/dev/shm` via the `--disable-dev-shm-usage` option so that the disk is used instead of memory, which can make things slower.

I decided to go with the 3rd option since memory is also limited in the CI context. I might change it in the future, but for now it works.

The StackOverflow answer also suggests adding the `--no-sandbox` option, which should be fine as long as you trust the websites your browser will be visiting.

In the context of WebdriverIO, I added these in the capabilities for Chrome:

```jsx
capabilities: [
  {
    browserName: 'chrome',
    'goog:chromeOptions': {
      args: [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--window-size=1920,1080',
      ],
    },
  }
...
]
```

Once I added these options, it worked! 🎉

This should also be true if you're using some other WebDriver-based framework or using another language since this is ultimately related to running the Chrome browser in the context of a Docker container.

Hopefully this helps someone else out there running into this.

# Links

- **StackOverflow Question**: [unknown error: session deleted because of page crash from unknown error: cannot determine loading status from tab crashed with ChromeDriver Selenium](https://stackoverflow.com/questions/53902507/unknown-error-session-deleted-because-of-page-crash-from-unknown-error-cannot)
- **Github Issue**: [UnknownError: session deleted because of page crash from tab crashed #20](https://github.com/elgalu/docker-selenium/issues/20)