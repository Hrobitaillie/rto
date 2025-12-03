class RealTimeObserver {
    #version = "2.1.3-1";
    #callback;
    #options;
    #observer;
    #rootMargin;
    #targets = new Set();
    #viewport;
    #rootMarginElement;

    constructor(callback, options = {}) {
        this.#callback = callback;
        this.#options = options;
        this.#rootMargin = this.#parseMargins(this.#options.rootMargin || "0");
        this.#observer = this.#createObserver();
        if (this.#options.debug) {
            const consoleStyle =
                "background-color: #FBB046; font-size: 18px; font-weight: bold; padding:3px 5px; color:#292538";
            console.log(
                `%cRealTimeObserver v${this.#version} - Debug mode enabled`,
                consoleStyle,
            );
            this.#createViewport();
            addStyle();
        }
    }

    #createObserver() {
        return new IntersectionObserver(this.#handleIntersections.bind(this), {
            ...this.#options,
            rootMargin: this.#transformRootMargin(),
        });
    }

    get root() {
        return this.#observer.root;
    }

    get rootMargin() {
        return this.#observer.rootMargin;
    }

    get thresholds() {
        return this.#observer.thresholds;
    }

    disconnect() {
        this.#targets.clear();
        this.#observer.disconnect();
    }

    observe(target) {
        this.#targets.add(target);
        this.#observer.observe(target);
        if (this.#options.debug) {
            this.#addThresholdMarkers(target);
        }
    }

    takeRecords() {
        return this.#observer.takeRecords();
    }

    unobserve(target) {
        this.#targets.delete(target);
        this.#observer.unobserve(target);
        if (this.#options.debug) {
            this.#removeThresholdMarkers(target);
        }
    }

    #transformRootMargin() {
        const rect = this.#expandRectByRootMargin(this.#getVisualRect());
        const rootRect = this.#getRootRect();
        const rootMargin = [
            -rootRect.top + rect.top,
            rootRect.right - rect.right,
            rootRect.bottom - rect.bottom,
            -rootRect.left + rect.left,
        ].map((margin) => `${margin}px`).join(" ");

        return rootMargin;
    }

    #expandRectByRootMargin(rect) {
        const margins = this.#rootMargin.map(({ type, value }, index) =>
            type === "px"
                ? value
                : (value * (index % 2 ? rect.width : rect.height)) / 100
        );

        const rootMargin = {
            top: rect.top - margins[0],
            right: rect.right + margins[1],
            bottom: rect.bottom + margins[2],
            left: rect.left - margins[3],
            width: rect.right + margins[1] - (rect.left - margins[3]),
            height: rect.bottom + margins[2] - (rect.top - margins[0]),
        };

        return rootMargin;
    }
    #addThresholdMarkers(target) {
        const overlay = document.createElement("div");
        overlay.classList.add("threshold-overlay");
        target.appendChild(overlay);

        let threshold = this.#options.threshold;
        threshold = typeof threshold === "number" ? threshold : 0.5;
        threshold = threshold ? threshold : 1;
        const marker = document.createElement("div");
        marker.classList.add("threshold-marker");

        marker.style.setProperty("--threshold", threshold * 100 + "%");
        marker.dataset.threshold = threshold;
        overlay.appendChild(marker);

        const overlayLabel = document.createElement("span");
        overlayLabel.classList.add("overlay-label");
        overlayLabel.textContent = `Élément observé`;
        overlay.appendChild(overlayLabel);

        const markerLabel = document.createElement("span");
        markerLabel.classList.add("marker-label");
        markerLabel.textContent = `Zone d'intersection: ${threshold * 100}%`;
        marker.appendChild(markerLabel);
    }

    #updateThresholdMarkers(target, intersectionRatio) {
        const overlay = target.querySelector(".threshold-overlay");
        if (overlay) {
            overlay.style.borderColor = intersectionRatio > 0
                ? "red"
                : "rgba(255, 0, 0, 0.5)";
        }

        const markers = target.querySelectorAll(".threshold-marker");
        markers.forEach((marker) => {
            const threshold = parseFloat(marker.dataset.threshold);
            // marker.style.borderColor = intersectionRatio >= threshold ? 'green' : 'red';
            marker.style.background = intersectionRatio >= threshold
                ? "rgba(0, 255, 0, 0.3)"
                : "rgba(255, 0, 0, 0.3)";
        });
    }

    #removeThresholdMarkers(target) {
        const overlay = target.querySelector(".threshold-overlay");
        if (overlay) {
            overlay.remove();
        }
    }

    #handleIntersections(entries) {
        entries.forEach((entry) => {
            this.#callback(entry);
            this.#updateThresholdMarkers(entry.target, entry.intersectionRatio);
        });
    }

    #createViewport() {
        this.#viewport = document.createElement("div");
        this.#viewport.setAttribute("id", "viewport");
        document.body.appendChild(this.#viewport);

        this.#rootMarginElement = document.createElement("div");
        this.#rootMarginElement.setAttribute("id", "root-margin");
        this.#viewport.appendChild(this.#rootMarginElement);

        const rootMarginabel = document.createElement("span");
        rootMarginabel.classList.add("root_margin-label");
        rootMarginabel.textContent = `Zone d'intersection: ${this.#rootMargin.map(({ value, type }) => `${value}${type}`).join(
            " ",
        )
            }`;
        this.#rootMarginElement.appendChild(rootMarginabel);

        window.visualViewport.addEventListener("scroll", () => {
            this.#updateViewport();
        });

        setInterval(() => {
            this.#updateViewport();
        }, 50);
        this.#updateViewport();
    }

    #updateViewport() {
        const rootRect = this.#getRootRect();

        const margins = this.#rootMargin.map(({ value, type }, index) => {
            let marginInPixels = type === "%"
                ? (value * (index % 2 ? rootRect.width : rootRect.height) / 100)
                : value;

            return marginInPixels;
        });

        const padding = 4;
        // Applique les marges correctement (sans padding inutile)
        this.#rootMarginElement.style.top = `${margins[0] + padding}px`;
        this.#rootMarginElement.style.right = `${margins[1] + padding}px`;
        this.#rootMarginElement.style.bottom = `${margins[2] + padding}px`;
        this.#rootMarginElement.style.left = `${margins[3] + padding}px`;
    }

    #parseMargins(margin) {
        const parts = margin.split(/\s+/);
        return ["top", "right", "bottom", "left"].map((_, i) =>
            this.#parseMargin(parts[i] || parts[0])
        );
    }

    #parseMargin(margin) {
        return {
            type: margin.endsWith("%") ? "%" : "px",
            value: parseFloat(margin),
        };
    }

    #getRootRect() {
        const doc = document.documentElement;
        return {
            top: 0,
            left: 0,
            right: doc.clientWidth,
            width: doc.clientWidth,
            bottom: doc.clientHeight,
            height: doc.clientHeight,
        };
    }

    #getVisualRect() {
        const viewport = window.visualViewport;
        return {
            top: viewport.offsetTop,
            left: viewport.offsetLeft,
            right: viewport.offsetLeft + viewport.width,
            width: viewport.width,
            bottom: viewport.offsetTop + viewport.height,
            height: viewport.height,
        };
    }
}

function addStyle() {
    const style = document.createElement("style");
    style.innerHTML = `
        #viewport {
            position: fixed;
            outline: solid 2px rgba(0, 180, 0,0);
            background: rgba(0, 180, 0, 0.0);
            pointer-events:none;
            border-radius: 3px;
            z-index: 1000000;
            inset: 4px;
        }
        #root-margin {
            position: fixed;
            background: rgba(0, 37, 220, 0.1);
            outline: dashed 2px rgb(0, 37, 220);
            mix-blend-mode: screen;
            border-radius: 3px;
            box-sizing: border-box;
            border-radius: 8px;

        }
        *:has(>.threshold-overlay){
            position:relative
        }
        .threshold-overlay{
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: 3px solid rgba(255, 0, 0, 0.3);
            background-color: rgba(255, 0, 0, 0.1);
            pointer-events: none;
            border-radius: 8px;
            padding:4px
        }
        
        *[data-active="true"] .threshold-overlay{
            background: rgba(0, 255, 0, 0.3);
            border: 3px dashed green !important;
        }
        .threshold-marker{
            --padding: 4px;
            position: absolute;
            left: var(--padding);
            width: calc(100% - (var(--padding) * 2));
            height: calc(var(--threshold) - (var(--padding) * 2));
            outline: 2px dashed red;
            outline-offset: -4px;
            background: rgba(255, 0, 0, 0.3);
            top: var(--padding);
            border-radius: 8px;

        }
        .overlay-label {
            position: absolute;
            top: 0px;
            width: max-content;
            right: calc(100% + 8px);
            font-size: 12px;
            color: white;
            background: rgba(0, 0, 0, 0.6);
            padding: 2px 5px;
            border-radius: 3px;
            pointer-events: none;
        }

        .marker-label {
            position: absolute;
            top: 4px;
            right: 4px;
            font-size: 12px;
            color: white;
            background: rgba(0, 0, 0, 0.6);
            padding: 2px 5px;
            border-radius: 3px;
            pointer-events: none;
        }
        .root_margin-label {
            position: absolute;
            top: 50%;
            right: 4px;
            font-size: 12px;
            color: white;
            background: rgba(0, 0, 0, 0.6);
            padding: 2px 5px;
            border-radius: 3px;
            pointer-events: none;
            z-index:500000;
            transform: translateY(-50%);
        }

    `;
    document.head.appendChild(style);
}
