/*! coi-serviceworker v0.1.7 - MIT License - https://github.com/gzuidhof/coi-serviceworker */
if (typeof window === 'undefined') {
    self.addEventListener("install", () => self.skipWaiting());
    self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

    self.addEventListener("fetch", (event) => {
        if (event.request.cache === "only-if-cached" && event.request.mode !== "same-origin") {
            return;
        }

        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    if (response.status === 0) {
                        return response;
                    }

                    const newHeaders = new Headers(response.headers);
                    newHeaders.set("Cross-Origin-Embedder-Policy", "require-corp");
                    newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");

                    return new Response(response.body, {
                        status: response.status,
                        statusText: response.statusText,
                        headers: newHeaders,
                    });
                })
                .catch((e) => console.error(e))
        );
    });
} else {
    (() => {
        const reload = () => {
            window.location.reload();
        };

        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.getRegistration().then((registration) => {
                if (registration && registration.active && !navigator.serviceWorker.controller) {
                    reload();
                }

                // LIGNE 44 CORRIGÉE POUR GITHUB PAGES
                navigator.serviceWorker.register('./coi-serviceworker.js', { scope: "./" }).then((registration) => {
                    registration.addEventListener("updatefound", () => {
                        const installingWorker = registration.installing;
                        installingWorker.onstatechange = () => {
                            if (installingWorker.state === "installed") {
                                reload();
                            }
                        };
                    });
                });
            });
        }
    })();
}
