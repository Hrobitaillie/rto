# RealTimeObserver (RTO)

![Version](https://img.shields.io/badge/version-1.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow)

Un wrapper autour de l'API `IntersectionObserver` qui permet de visualiser les zones d'intersection pour faciliter le développement.

<a href="https://codesandbox.io/p/sandbox/t97c4g?file=%2Fscript.js%3A15%2C17" target="_blank"> ➡️ Demo accessible ici ⬅️</a>
## ✨ Fonctionnalités

- ✅ Support des **pourcentages** dans `rootMargin`
- ✅ Support des **pixels** dans `rootMargin`
- ✅ Mode **debug visuel** avec overlays interactifs
- ✅ **Léger** et sans dépendances
- ✅ Parfait pour les animations au scroll, lazy loading, etc.

## 📦 Installation

### Via CDN

```html
<!-- Version complète -->
<script src="https://cdn.jsdelivr.net/gh/Hrobitaillie/rto@master/rto.js"></script>

<!-- Version minifiée (recommandée pour la production) -->
<script src="https://cdn.jsdelivr.net/gh/Hrobitaillie/rto@master/rto.min.js"></script>
```

### Fichier local

Téléchargez `rto.js` et incluez-le dans votre projet :

```html
<script src="chemin/vers/rto.js"></script>
```

## 🚀 Utilisation rapide

```javascript
// Créer un observer
const observer = new RealTimeObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    },
    {
        rootMargin: "0% 0% 50% 0%",  // ✨ Pourcentages supportés !
        threshold: 0.1,
        debug: true  // Mode debug activé
    }
);

// Observer des éléments
document.querySelectorAll('.element').forEach(el => {
    observer.observe(el);
});
```

## ⚙️ Options de configuration

### `rootMargin` (string)

Définit les marges autour de la zone d'intersection (viewport).

**Format:** `"top right bottom left"` (comme CSS padding/margin)

**Unités acceptées:** 
- `%` - Pourcentage du viewport ✨ **Nouvelle fonctionnalité**
- `px` - Pixels

**Exemples:**

```javascript
// Zone réduite de 50% en bas
rootMargin: "0% 0% 50% 0%"

// Zone agrandie de 100px en haut
rootMargin: "-100px 0px 0px 0px"

// Zone centrée (25% en haut et en bas)
rootMargin: "25% 0% 25% 0%"

// Mélange de pixels et pourcentages
rootMargin: "-50px 10% 100px 5%"
```

**Comportement:**
- ✅ Valeur **positive** : réduit la zone vers l'intérieur
- ✅ Valeur **négative** : agrandit la zone vers l'extérieur

### `threshold` (number | number[])

Seuil d'intersection pour déclencher le callback.
Array actuellement non testé donc fonctionnement non garanti.

**Valeur:** Entre `0` et `1`

```javascript
threshold: 0      // Dès qu'un pixel entre dans la zone
threshold: 0.5    // Quand 50% de l'élément est visible
threshold: 1      // Quand 100% de l'élément est visible
```

### `debug` (boolean)

Active le mode debug visuel.

**Quand `debug: true` :**
- 🔵 Zone bleue = zone d'intersection définie par `rootMargin`
- 🔴 Rouge = élément hors zone
- 🟠 Orange = élément partiellement visible (sous le seuil)
- 🟢 Vert = seuil atteint (callback déclenché)

```javascript
{
    debug: true  // Active les overlays visuels
}
```

## 📚 API

### Constructeur

```javascript
new RealTimeObserver(callback, options)
```

**Paramètres:**
- `callback` (Function) : Fonction appelée à chaque changement
  - `entries` (Array) : Liste des éléments
  - `observer` (RealTimeObserver) : Instance de l'observer
- `options` (Object) : Options de configuration

### Méthodes

```javascript
// Observer un élément
observer.observe(element);

// Arrêter d'observer un élément
observer.unobserve(element);

// Arrêter d'observer tous les éléments
observer.disconnect();

// Récupérer les enregistrements en attente
const records = observer.takeRecords();
```

### Propriétés en lecture seule

```javascript
observer.root         // Élément racine (généralement null)
observer.rootMargin   // RootMargin transformé en pixels
observer.thresholds   // Liste des seuils configurés
```

## 💡 Exemples pratiques

### Animation au scroll

```javascript
const fadeObserver = new RealTimeObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    },
    {
        rootMargin: "0% 0% 40% 0%",
        threshold: 0.1
    }
);

document.querySelectorAll('.fade-in').forEach(el => {
    fadeObserver.observe(el);
});
```

```css
.fade-in {
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.6s ease, transform 0.6s ease;
}

.fade-in.visible {
    opacity: 1;
    transform: translateY(0);
}
```

### Lazy loading d'images

```javascript
const lazyImageObserver = new RealTimeObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.add('loaded');
                lazyImageObserver.unobserve(img);
            }
        });
    },
    {
        rootMargin: "0% 0% 20% 0%",
        threshold: 0
    }
);

document.querySelectorAll('img[data-src]').forEach(img => {
    lazyImageObserver.observe(img);
});
```

### Compteur animé

```javascript
const counterObserver = new RealTimeObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = parseInt(counter.dataset.target);
                animateCounter(counter, target);
                counterObserver.unobserve(counter);
            }
        });
    },
    {
        rootMargin: "0% 0% 40% 0%",
        threshold: 0.1
    }
);

function animateCounter(element, target) {
    let current = 0;
    const increment = target / 100;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 20);
}
```

### Animation séquentielle

```javascript
const cardsObserver = new RealTimeObserver(
    (entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const cards = entry.target.querySelectorAll('.card');
                cards.forEach((card, index) => {
                    setTimeout(() => {
                        card.classList.add('visible');
                    }, index * 150);
                });
                cardsObserver.unobserve(entry.target);
            }
        });
    },
    {
        rootMargin: "0% 0% 40% 0%",
        threshold: 0.1
    }
);
```

## 🎨 Mode Debug

Le mode debug offre une visualisation en temps réel de l'intersection.

### Ce que vous voyez :

1. **Zone bleue** : Zone d'intersection active (définie par `rootMargin`)
2. **Overlay sur les éléments** :
   - 🔴 Rouge : Hors zone
   - 🟠 Orange : Partiellement visible (< seuil)
   - 🟢 Vert : Seuil atteint (callback actif)
3. **Labels informatifs** :
   - Pourcentage d'intersection
   - État du callback
   - Valeur du seuil

### Activer le mode debug :

```javascript
const observer = new RealTimeObserver(
    (entries) => {
        // Votre callback
    },
    {
        rootMargin: "0% 0% 50% 0%",
        threshold: 0.25,
        debug: true  // 🎨 Active le mode debug
    }
);
```

## 🔧 Différences avec IntersectionObserver

| Fonctionnalité | IntersectionObserver | RealTimeObserver |
|----------------|---------------------|------------------|
| rootMargin avec % | ❌ | ✅ |
| rootMargin avec px | ✅ | ✅ |
| Mode debug visuel | ❌ | ✅ |
| API identique | ✅ | ✅ |

## ⚠️ Limitations

- Ne fonctionne pas dans les iframes
- Nécessite un navigateur moderne (support de `IntersectionObserver` et `visualViewport`)
- En mode debug, un `setInterval` tourne toutes les 50ms

## 🌐 Compatibilité

RealTimeObserver fonctionne sur tous les navigateurs supportant :
- `IntersectionObserver`
- `visualViewport`
- Classes ES6

## 📄 Licence

MIT

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Ouvrir une issue pour signaler un bug
- Proposer une pull request pour ajouter une fonctionnalité
- Partager vos cas d'usage

## 📞 Support

Pour toute question ou problème, ouvrez une issue sur GitHub.

---

**Fait avec ❤️ pour simplifier l'IntersectionObserver**
