# Remédiation Physique Chimie

Outil élève : choisir une notion → diagnostic → remédiation (fiche + exercices adaptatifs) → test final → rapport PDF.
Tout reste sur l'appareil de l'élève (localStorage + fichier de sauvegarde .json).

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | Accueil : menu des notions, principe, « Qui es-tu ? », comment reprendre plus tard |
| `notion.html?n=<id>` | Parcours d'une notion (lien direct possible à donner aux élèves) |
| `notions/catalogue.js` | **Liste des notions du menu** |
| `notions/chiffres-significatifs.js` | Contenu de la notion : points, fiches, rappels, générateurs d'exercices |
| `notions/vecteurs.js` | Notion « Les vecteurs en physique-chimie » (7 points, figures SVG générées) |
| `notions/vecteurs-mouvement.js` | Notion « Vecteurs position, vitesse et accélération » (Terminale, 7 points) |
| `assets/parcours.js` | Moteur commun (diagnostic, remédiation, test final, rapport PDF) |
| `assets/num.js` | Outils numériques communs (lecture des réponses, correction, notation scientifique) |
| `assets/commun.js` | Sauvegarde, identité, fichier .json |
| `assets/style.css` | Mise en forme |

## Ajouter une notion

1. Copier `notions/chiffres-significatifs.js` en `notions/<id>.js` et remplacer les points, fiches et générateurs.
2. Ajouter une entrée dans `notions/catalogue.js` (même `id`). `bientot: true` l'affiche en « Bientôt disponible ».

Types de questions disponibles (`assets/num.js`) :
- `qcm` : options + bonne réponse ;
- `int` : entier ;
- `num` : nombre jugé sur la valeur **et** le nombre de chiffres significatifs ;
- `val` : nombre signé jugé avec une tolérance (`tol`), avec des messages ciblés pour les erreurs typiques (`traps`, `signMsg`).

## Mode démo

`notion.html?n=chiffres-significatifs&demo` : parcours fictif pour tester le rapport PDF (stocké à part).

## Reprise de l'ancien outil

Si l'élève a déjà utilisé `chiffres-significatifs.html` sur le même site, sa progression est reprise automatiquement ; les anciens fichiers de sauvegarde sont aussi acceptés.
