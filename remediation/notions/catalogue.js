/* =====================================================================
   CATALOGUE DES NOTIONS – c'est la liste affichée dans le menu de l'accueil.
   Le menu est sur 2 colonnes : les notions s'affichent dans l'ordre ci-dessous,
   deux par ligne.
   Pour ajouter une notion :
     1. créer le fichier notions/<id>.js (sur le modèle de chiffres-significatifs.js)
     2. ajouter une ligne ci-dessous avec le même id.
   Mettre  bientot: true  pour annoncer une notion pas encore disponible.
   ===================================================================== */
window.RPC_CATALOGUE = [
  /* ligne 1 */
  {
    id: 'chiffres-significatifs',
    titre: 'Chiffres significatifs',
    resume: 'Compter les CS, notation scientifique, arrondir, écrire un résultat de calcul et l\'accorder avec son incertitude.',
    niveau: 'Seconde à Terminale',
    fichier: 'notions/chiffres-significatifs.js'
  },
  {
    id: 'tableau-avancement',
    titre: 'Tableau d\'avancement',
    resume: 'Équation et coefficients, quantités de matière, remplir le tableau, réactif limitant et avancement maximal, état final, mélange stœchiométrique, taux d\'avancement.',
    niveau: 'Seconde à Terminale',
    fichier: 'notions/tableau-avancement.js'
  },
  /* ligne 2 */
  {
    id: 'vecteurs',
    titre: 'Les vecteurs en physique-chimie',
    resume: 'Vecteur ou valeur, coordonnées et norme, somme et différence (variation de vitesse), produit par un nombre, projection, produit scalaire et travail.',
    niveau: 'Seconde à Terminale',
    fichier: 'notions/vecteurs.js'
  },
  {
    id: 'vecteurs-mouvement',
    titre: 'Vecteurs position, vitesse et accélération',
    resume: 'Équations horaires, dériver un vecteur, primitives et conditions initiales, chronophotographie, mouvement circulaire et repère de Frenet.',
    niveau: 'Terminale',
    fichier: 'notions/vecteurs-mouvement.js'
  }
];
