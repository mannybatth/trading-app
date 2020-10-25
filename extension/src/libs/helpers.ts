export function waitForElementToBeVisible(
  condition: (node: HTMLElement) => boolean,
  inParent = document.documentElement || document.body,
  useTimeout = true,
  waitTime = 3000
): Promise<HTMLElement | null> {
  return new Promise((resolve, reject) => {
    if (condition(inParent)) {
      resolve(inParent);
      return;
    }

    let timeout: NodeJS.Timeout;
    const messageObserver = new MutationObserver((mutationsList, observer) => {
      mutationsList.forEach((mutation) => {
        mutation.addedNodes.forEach((node: HTMLElement) => {
          if (condition(node)) {
            observer.disconnect();
            resolve(node);

            if (timeout) {
              clearTimeout(timeout);
              timeout = null;
            }
          }
        });
      });
    });
    messageObserver.observe(inParent, {
      attributes: false,
      childList: true,
      subtree: true,
    });

    if (useTimeout) {
      timeout = setTimeout(() => {
        messageObserver.disconnect();
        resolve(null);
      }, waitTime);
    }
  });
}

export function containsXtradeIcon(node: HTMLElement): boolean {
  const reactionsDiv = node.querySelector('[class*="reactions-"]');
  return reactionsDiv?.querySelector('img[alt="Xtrades"]') ? true : false;
}
