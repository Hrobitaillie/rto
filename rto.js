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
        console.log(target, this);
        const overlay = document.createElement("div");
        overlay.classList.add("section-overlay");
        target.appendChild(overlay);
        
        const threshold = this.#options.threshold;
        const thresholdOverlay = document.createElement("div");
        thresholdOverlay.style.flexBasis = `${threshold * 100}%`;
        thresholdOverlay.style.top = `${this.#rootMargin[0].value}%`;

        thresholdOverlay.classList.add("threshold-overlay");
        overlay.appendChild(thresholdOverlay);

        // Label explicatif pour le threshold
        const thresholdLabel = document.createElement("span");
        thresholdLabel.classList.add("threshold-label");
        thresholdLabel.textContent = `Seuil: ${threshold * 100}% - Cette zone doit être dans la zone bleue pour déclencher le callback`;
        thresholdOverlay.appendChild(thresholdLabel);

        // Label pour l'info générale
        const infoLabel = document.createElement("span");
        infoLabel.classList.add("info-label");
        infoLabel.textContent = `Élément observé - Intersection: 0%`;
        overlay.appendChild(infoLabel);
    }

    #updateThresholdMarkers(target, intersectionRatio) {
        const overlay = target.querySelector(".section-overlay");
        const thresholdOverlay = target.querySelector(".threshold-overlay");
        const infoLabel = target.querySelector(".info-label");
        const ratioLabel = target.querySelector(".ratio-label");
        const intersectionZone = target.querySelector(".intersection-zone");
        const intersectionLabel = target.querySelector(".intersection-label");
        const statusLabel = target.querySelector(".status-label");
        const threshold = this.#options.threshold || 0;
        
        if (overlay) {
            // Le contour de la section change de couleur selon le seuil
            if (intersectionRatio >= threshold) {
            } else if (intersectionRatio > 0) {
                overlay.style.borderColor = "orange";
                thresholdOverlay.style.backgroundColor = "rgba(255, 165, 0, 0.4)";
                thresholdOverlay.style.borderColor = "orange";
            } else {
                overlay.style.borderColor = "rgba(255, 0, 0, 0.5)";
                thresholdOverlay.style.backgroundColor = "rgba(128, 128, 128, 0.3)";
                thresholdOverlay.style.borderColor = "rgba(128, 128, 128, 0.5)";
            }
        }
        
        // Met à jour le label d'info
        if (infoLabel) {
            const status = intersectionRatio >= threshold ? '✓ Callback déclenché' : 
                          intersectionRatio > 0 ? `⊘ ${Math.round(intersectionRatio * 100)}% / ${threshold * 100}%` :
                          '✕ Hors zone';
            infoLabel.textContent = `Élément observé - Intersection: ${Math.round(intersectionRatio * 100)}% - ${status}`;
        }

        // Met à jour le label du ratio
        if (ratioLabel) {
            ratioLabel.textContent = `Visible: ${Math.round(intersectionRatio * 100)}%`;
        }

        // Met à jour la zone d'intersection pour montrer la portion visible
        if (intersectionZone) {
            const threshold = parseFloat(intersectionZone.dataset.threshold);
            
            // La hauteur représente la portion de l'élément qui est dans la zone bleue
            intersectionZone.style.setProperty("--intersection-ratio", intersectionRatio);
            
            if (intersectionLabel) {
                intersectionLabel.textContent = `Portion visible: ${Math.round(intersectionRatio * 100)}%`;
            }
            
            // Couleur selon le seuil
            if (intersectionRatio >= threshold) {
                intersectionZone.style.background = "rgba(0, 255, 0, 0.4)";
                intersectionZone.style.borderColor = "green";
                intersectionZone.style.borderStyle = "solid";
                
                if (statusLabel) {
                    statusLabel.textContent = `✓ Seuil atteint: ${Math.round(intersectionRatio * 100)}% ≥ ${threshold * 100}%`;
                    statusLabel.style.backgroundColor = "rgba(0, 255, 0, 0.8)";
                    statusLabel.style.color = "white";
                }
            } else {
                intersectionZone.style.background = "rgba(255, 165, 0, 0.4)";
                intersectionZone.style.borderColor = "orange";
                intersectionZone.style.borderStyle = "dashed";
                
                if (statusLabel) {
                    if (intersectionRatio > 0) {
                        statusLabel.textContent = `⊘ ${Math.round(intersectionRatio * 100)}% < ${threshold * 100}%`;
                        statusLabel.style.backgroundColor = "rgba(255, 165, 0, 0.8)";
                    } else {
                        statusLabel.textContent = `✕ Hors zone (seuil: ${threshold * 100}%)`;
                        statusLabel.style.backgroundColor = "rgba(255, 0, 0, 0.8)";
                    }
                    statusLabel.style.color = "white";
                }
            }
        }
    }

    #removeThresholdMarkers(target) {
        const overlay = target.querySelector(".section-overlay");
        if (overlay) {
            overlay.remove();
        }
    }

    #handleIntersections(entries) {
         if (this.#options.debug) {
            entries.forEach((entry) => {
                this.#updateThresholdMarkers(entry.target, entry.intersectionRatio);
            });
        }
        // Appelle le callback avec toutes les entries, comme l'IntersectionObserver natif
        this.#callback(entries, this);
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

        const padding = 0;
        // Applique les marges: rootMargin positif = étend vers l'extérieur = réduit top/left, augmente right/bottom
        // Pour les positions CSS: top diminue (monte), right diminue (va à gauche), bottom diminue (descend), left diminue (va à droite)
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
            outline-offset: -2px;

        }
        *:has(>.section-overlay){
            position:relative
        }
        .section-overlay{
            position: absolute;
            inset: 0px;
            border: 3px dashed rgba(255, 0, 0, 0.3);
            background-color: rgba(255, 0, 0, 0.1);
            pointer-events: none;
            border-radius: 8px;
            display: flex;
            flex-direction: column;
        }
        
        *[data-active="true"],
        *.active,
        *.visible{
            .section-overlay{
                background: rgba(0, 255, 0, 0.3);
                border: 3px solid green !important;
            }
        }
        .threshold-overlay {
            background: rgba(99, 99, 99, 0.3);
            border: 2px dashed gray;
            pointer-events: none;
            border-radius: 4px;
            transition: background 0.2s ease-out, border-color 0.2s ease-out;
            position: sticky;
            top: 0;
        }
        
        .threshold-label {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 11px;
            color: white;
            background: rgba(0, 0, 0, 0.8);
            padding: 4px 8px;
            border-radius: 4px;
            pointer-events: none;
            font-weight: bold;
            text-align: center;
            max-width: 90%;
            line-height: 1.4;
        }
        
        .info-label {
            position: absolute;
            bottom: 4px;
            left: 4px;
            font-size: 11px;
            color: white;
            background: rgba(0, 0, 0, 0.8);
            padding: 4px 8px;
            border-radius: 4px;
            pointer-events: none;
            font-weight: bold;
        }
        .intersection-zone {
            --padding: 4px;
            --intersection-ratio: 0;
            position: absolute;
            left: var(--padding);
            width: calc(100% - (var(--padding) * 2));
            height: calc((100% - (var(--padding) * 2)) * var(--intersection-ratio));
            border: 2px dashed orange;
            background: rgba(255, 165, 0, 0.4);
            border-radius: 4px;
            min-height: 0;
            transition: height 0.1s ease-out, background 0.2s ease-out, border-color 0.2s ease-out;
            bottom: var(--padding);
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
            right: 4px;
            font-size: 10px;
            color: white;
            background: rgba(0, 0, 0, 0.7);
            padding: 2px 5px;
            border-radius: 3px;
            pointer-events: none;
            font-weight: bold;
        }
        
        .intersection-label {
            top: 4px;
        }
        .ratio-label {
            position: absolute;
            bottom: 4px;
            left: 4px;
            font-size: 12px;
            color: white;
            background: rgba(0, 0, 0, 0.7);
            padding: 3px 6px;
            border-radius: 3px;
            pointer-events: none;
            font-weight: bold;
        }
        .status-label {
            position: absolute;
            bottom: 4px;
            right: 4px;
            font-size: 12px;
            color: white;
            background: rgba(255, 0, 0, 0.8);
            padding: 3px 6px;
            border-radius: 3px;
            pointer-events: none;
            font-weight: bold;
            transition: background-color 0.3s ease;
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
