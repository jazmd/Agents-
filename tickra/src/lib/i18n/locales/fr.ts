const fr = {
  nav: {
    method: 'Méthode',
    curriculum: 'Parcours',
    pricing: 'Tarifs',
    signIn: 'Connexion',
    getStarted: 'Commencer',
  },
  hero: {
    eyebrow: 'Un parcours structuré · Depuis la bougie 1',
    title: ['Commencez à la bougie 1.', 'Atteignez le niveau institutionnel.'],
    titleEm: 'institutionnel',
    body: "Tickra enseigne les marchés comme les salles de marché les apprennent — figure par figure, risque par risque, décision par décision. Des leçons de dix minutes, des vrais graphiques, zéro tape‑à‑l'œil.",
    primaryCta: 'Passer le test de niveau',
    secondaryCta: 'Voir une leçon type',
    chartCaption: 'EUR/USD · 1H · 24 dernières séances',
    stats: [
      { value: '127', label: 'Leçons structurées' },
      { value: '11', label: 'Pistes de maîtrise' },
      { value: '10 min', label: 'Engagement quotidien' },
    ],
  },
  method: {
    eyebrow: 'La méthode',
    title: 'Trois étapes. Aucun détour.',
    body: "La plupart des formations vendent des heures. Nous vendons un chemin. Le vôtre commence par un calibrage, tient en dix minutes par jour, et se termine face à un vrai graphique.",
    steps: [
      {
        index: '01',
        title: 'Calibrez votre point de départ',
        body: 'Un test de six questions lit ce que vous savez déjà et vous oriente vers le bon module. Sans condescendance, sans faux départ.',
      },
      {
        index: '02',
        title: 'Entraînez‑vous dix minutes par jour',
        body: "Une leçon, un quiz, un exercice sur graphique, une révision. Les streaks récompensent la régularité ; les vies protègent l'attention. Rien n'est sauté, un bloc à la fois.",
      },
      {
        index: '03',
        title: 'Passez au graphique réel',
        body: "Quand les figures deviennent réflexes, vous quittez les exercices pour les marchés réels — TradingView intégré, décisions journalisées, revue post‑trade.",
      },
    ],
  },
  bento: {
    eyebrow: 'Le produit',
    title: 'Un atelier, pas une bibliothèque.',
    body: 'Chaque leçon est construite autour de ce que vous faites, pas de ce que vous regardez.',
    items: {
      charts: {
        title: 'Vrais graphiques, dessinés en direct.',
        body: "Chaque leçon s'ouvre sur le graphique qu'elle enseigne. Trendlines, Fibonacci, zones d'offre — pratiqués sur de vraies séances historiques.",
      },
      streak: {
        title: 'Des streaks qui respectent votre temps.',
        body: 'Dix minutes comptent. Un jour manqué, un freeze conserve la série. Tickra récompense la régularité, pas le surmenage.',
      },
      library: {
        title: '127 modules, onze pistes.',
        body: "Des bougies japonaises aux régimes de volatilité. Chaque module se termine par un point de contrôle qui peut être manqué — et repassé.",
      },
      risk: {
        title: "Le risque d'abord. Toujours.",
        body: 'Taille de position, placement du stop, espérance. On enseigne le risque avant les figures, parce que perdre lentement est tout le métier.',
      },
      journal: {
        title: 'Décisions, journalisées.',
        body: 'Chaque exercice capture votre raisonnement. Après dix séances, Tickra fait remonter les schémas de vos propres erreurs.',
      },
      tv: {
        title: 'TradingView, en natif.',
        body: "Le moteur graphique en lequel vous avez déjà confiance, intégré à chaque leçon. Mêmes outils de dessin, mêmes données, zéro changement de contexte.",
      },
    },
  },
  metrics: {
    eyebrow: 'Sur le terrain',
    title: 'Apprenants. Leçons. Honnêteté.',
    body: 'Pas de captures de paper trading, pas de rendements fabriqués. Les seuls chiffres que nous publions sont ceux sur lesquels une plateforme pédagogique doit être jugée.',
    items: [
      { value: '12 400+', label: 'Apprenants actifs' },
      { value: '92 %', label: 'Terminent le test de niveau' },
      { value: '4,8 / 5', label: 'Note moyenne par leçon' },
      { value: '67', label: 'Pays atteints' },
    ],
    footnote: 'Chiffres auto‑déclarés, mai 2026. Mise à jour mensuelle.',
  },
  pricing: {
    eyebrow: 'Tarifs',
    title: 'Choisissez votre niveau de sérieux.',
    body: "Pas de jeu d'essai gratuit. Commencez gratuitement, passez payant quand le streak prouve votre engagement.",
    plans: [
      {
        id: 'free',
        name: 'Gratuit',
        price: '0 €',
        cadence: 'pour toujours',
        tagline: 'Pour la première semaine de curiosité.',
        cta: 'Commencer gratuitement',
        features: [
          'Test de niveau inclus',
          '12 premières leçons débloquées',
          '3 vies par jour',
          'Suivi des streaks',
          'Révisions de leçon avec pubs',
        ],
      },
      {
        id: 'pro',
        name: 'Pro',
        price: '14,99 €',
        cadence: '/ mois',
        tagline: 'Pour l’apprenant quotidien.',
        cta: 'Passer Pro',
        highlighted: true,
        features: [
          'Les 127 leçons débloquées',
          'Vies illimitées, zéro pub',
          'Choisissez n’importe quel module',
          'TradingView Pro intégré',
          'Journal de décisions et revue post‑trade',
          'Annulable à tout moment',
        ],
      },
      {
        id: 'lifetime',
        name: 'À vie',
        price: '199 €',
        cadence: 'une fois',
        tagline: 'Pour les engagés.',
        cta: 'Acheter une fois',
        features: [
          'Tout ce qui est dans Pro',
          'Tous les futurs modules inclus',
          'Cohorte privée d’apprenants',
          'Garantie satisfait ou remboursé 14 jours',
        ],
      },
    ],
  },
  faq: {
    eyebrow: 'Questions',
    title: 'Réponses honnêtes.',
    items: [
      {
        q: "Faut‑il un compte chez un courtier pour commencer ?",
        a: "Non. Les soixante premières leçons se déroulent entièrement dans Tickra sur des données historiques. Vous n'avez besoin d'un courtier que lorsque vous décidez de passer à l'exécution réelle — et nous vous accompagnons pour le choisir.",
      },
      {
        q: 'Tickra est‑il un service de signaux ?',
        a: "Non. Nous ne publions ni entrées, ni sorties, ni recommandations. Tickra est une plateforme d'apprentissage — les trades sont les vôtres, le raisonnement est le vôtre, la responsabilité est la vôtre.",
      },
      {
        q: 'Combien de temps avant de trader en réel ?',
        a: "La plupart des apprenants Pro atteignent le module Gestion du Risque en 4 à 6 semaines. Faut‑il alors trader en réel ? C'est une autre question — Tickra refuse de la précipiter.",
      },
      {
        q: 'Puis‑je annuler à tout moment ?',
        a: "Oui. Pro est facturé au mois, annulable en deux clics. L'offre À vie est couverte par une garantie satisfait ou remboursé de 14 jours, sans ping‑pong d'e‑mails.",
      },
      {
        q: 'Garantissez‑vous des profits ?',
        a: "Aucun pédagogue sérieux ne le fait. Nous garantissons un cursus, une communauté, et les mêmes exercices que les desks professionnels utilisent pour former leurs juniors. Le reste, c'est le marché.",
      },
    ],
  },
  cta: {
    eyebrow: 'Commencer',
    title: 'Lisez votre première bougie aujourd’hui.',
    body: 'Six questions, quatre‑vingt‑dix secondes. Tickra trouve où vous en êtes et programme la leçon une.',
    primary: 'Passer le test de niveau',
    secondary: 'Voir les tarifs',
  },
  footer: {
    tagline: 'Un cursus de trading, conçu comme un artisanat.',
    columns: [
      {
        title: 'Produit',
        links: [
          { label: 'Méthode', href: '#method' },
          { label: 'Parcours', href: '#curriculum' },
          { label: 'Tarifs', href: '/pricing' },
          { label: 'Journal des versions', href: '/changelog' },
        ],
      },
      {
        title: 'Société',
        links: [
          { label: 'À propos', href: '/about' },
          { label: 'Éditorial', href: '/editorial' },
          { label: 'Contact', href: '/contact' },
        ],
      },
      {
        title: 'Légal',
        links: [
          { label: 'CGU', href: '/terms' },
          { label: 'Confidentialité', href: '/privacy' },
          { label: 'Avertissement risque', href: '/risk' },
        ],
      },
    ],
    risk:
      "Le trading comporte un risque substantiel de perte. Tickra est une plateforme éducative ; rien sur ce site ne constitue un conseil en investissement.",
    copyright: '© 2026 Tickra. Tous droits réservés.',
  },
  onboarding: {
    eyebrow: 'Test de niveau',
    title: 'Six questions, puis un départ sur mesure.',
    subtitle: "Répondez honnêtement. Il n'y a pas de note, seulement une ligne de départ.",
    progress: 'Question {current} sur {total}',
    cta: { next: 'Suivant', back: 'Retour', finish: 'Voir mon niveau' },
    result: {
      novice: {
        label: 'Apprenti',
        body: 'Vous partez de la bougie elle‑même — parfait. Tickra ouvre par un primer de quatre leçons sur ce qu’un graphique représente réellement.',
        recommended: 'Leçon 01 · Ce qu’une bougie dit',
      },
      intermediate: {
        label: 'Opérateur',
        body: 'Vous maîtrisez le vocabulaire. Tickra passe le primer et vous démarre sur la structure, les supports et la taille de position.',
        recommended: 'Leçon 17 · Supports, résistances, structure',
      },
      advanced: {
        label: 'Stratège',
        body: 'Vous êtes au‑delà des bases. Tickra vous oriente directement vers l’analyse multi‑temporelle et l’allocation du capital.',
        recommended: 'Leçon 64 · Contexte multi‑temporel',
      },
    },
    questions: [
      {
        q: 'Avez‑vous déjà passé un vrai trade avec votre propre argent ?',
        choices: [
          { label: 'Jamais', weight: 0 },
          { label: 'Quelques fois', weight: 1 },
          { label: 'Régulièrement depuis plus d’un an', weight: 2 },
        ],
      },
      {
        q: 'Une bougie japonaise verte signifie que le prix a clôturé…',
        choices: [
          { label: 'Plus haut qu’à l’ouverture', weight: 2 },
          { label: 'Plus bas qu’à l’ouverture', weight: 0 },
          { label: 'Je ne suis pas sûr', weight: 0 },
        ],
      },
      {
        q: 'Un stop‑loss sert à…',
        choices: [
          { label: 'Plafonner la perte maximale sur un trade', weight: 2 },
          { label: 'Garantir un objectif de profit', weight: 0 },
          { label: 'J’en ai entendu parler mais jamais utilisé', weight: 1 },
        ],
      },
      {
        q: 'Si vous risquez 1 % par trade, après 10 pertes consécutives le compte baisse d’environ…',
        choices: [
          { label: '10 %', weight: 1 },
          { label: '9,6 %', weight: 2 },
          { label: '1 %', weight: 0 },
        ],
      },
      {
        q: 'Une figure d’avalement haussier (bullish engulfing) est…',
        choices: [
          { label: 'Deux bougies, la seconde couvrant entièrement le corps de la première', weight: 2 },
          { label: 'Une grande bougie verte unique', weight: 0 },
          { label: 'Un niveau horizontal sur le graphique', weight: 0 },
        ],
      },
      {
        q: "Avant d'entrer dans un trade, la première chose que vous décidez est…",
        choices: [
          { label: 'La perte maximale que vous acceptez sur ce trade', weight: 2 },
          { label: 'L’objectif de profit', weight: 1 },
          { label: 'La taille de la position', weight: 1 },
        ],
      },
    ],
  },
  dashboard: {
    eyebrow: 'Aujourd’hui',
    greeting: 'Content de vous revoir.',
    subtitle: 'Dix minutes aujourd’hui maintiennent le streak en vie.',
    streak: { label: 'Série actuelle', unit: 'jours', best: 'Record · {n}' },
    xp: { label: 'Expérience', toNext: '{n} XP pour {level}' },
    level: 'Niveau {n}',
    lives: { label: 'Vies', empty: 'Plus de vies — rechargez ou attendez demain.' },
    next: {
      label: 'Leçon du jour',
      cta: 'Reprendre la leçon',
      duration: '8 min · Piste 02',
    },
    map: {
      title: 'Votre parcours',
      legend: { done: 'Terminées', current: 'En cours', locked: 'Verrouillées' },
    },
    activity: {
      title: 'Sept derniers jours',
      caption: 'Minutes pratiquées',
    },
  },
  lesson: {
    breadcrumb: 'Parcours / Piste 01 · Fondations',
    eyebrow: 'Leçon 04 · 12 minutes',
    title: 'Lire une bougie japonaise.',
    intro:
      "Une bougie est une histoire compressée : ouverture, clôture, plus haut atteint, plus bas atteint. Lisez quatre nombres et vous lisez ce qu'ont été 60 minutes de comportement de foule. Cette leçon entraîne ce muscle.",
    anatomy: {
      title: 'Anatomie d’une bougie',
      caption: 'Une séance haussière : clôture au‑dessus de l’ouverture. Le corps montre l’amplitude tradée ; les mèches montrent les extrêmes rejetés.',
      labels: { high: 'Plus haut', low: 'Plus bas', open: 'Ouverture', close: 'Clôture', body: 'Corps', wick: 'Mèche' },
    },
    practice: {
      title: 'Pratique sur graphique réel',
      body: 'Ci‑dessous, le même EUR/USD que celui que regardent les desks pro. Utilisez les outils de dessin TradingView — ce sont ceux que vous utiliserez dans toutes les futures leçons.',
    },
    quiz: {
      title: 'Point de contrôle',
      question: 'Sur une bougie haussière, le haut du corps est le…',
      choices: ['Prix d’ouverture', 'Prix de clôture', 'Prix le plus haut', 'Prix le plus bas'],
      correct: 1,
      success: 'Correct — sur une bougie haussière, la clôture est toujours au‑dessus de l’ouverture. La mèche continue jusqu’au plus haut.',
      retry: 'Pas tout à fait. Relisez l’anatomie et réessayez.',
    },
    paywall: {
      eyebrow: 'Leçon Pro',
      title: 'Continuez avec la leçon complète.',
      body: 'Les neuf exercices restants, le replay du chart et la revue du point de contrôle font partie de Tickra Pro.',
      primary: 'Débloquer avec Pro',
      secondary: 'Voir les tarifs',
    },
  },
  about: {
    eyebrow: 'À propos',
    title: 'Nous construisons le cursus que nous aurions voulu avoir.',
    body: "Tickra a été fondée en 2025 par une petite équipe d'anciens traders pour compte propre et d'éditeurs. Nous étions fatigués de deux choses : les gourous qui vendent de la certitude, et les plateformes qui vendent des heures. Nous voulions un cours qui se lit comme un manuel d'école des métiers — court, honnête, construit autour de ce que vous faites vraiment.",
    principles: {
      title: 'Cinq principes que nous ne briserons pas.',
      items: [
        {
          heading: 'Jamais de signaux',
          body: 'Nous ne publierons jamais ni entrées, ni sorties, ni recommandations. Apprendre à décider est tout le métier.',
        },
        {
          heading: 'Le risque avant les figures',
          body: 'Chaque piste commence par la taille de position et le placement du stop. Les figures viennent ensuite.',
        },
        {
          heading: 'Uniquement des vrais graphiques',
          body: "Aucun exemple synthétique. Chaque exercice tourne sur une séance historique qui a réellement eu lieu.",
        },
        {
          heading: 'Lent quand il faut',
          body: 'Certaines leçons durent cinq minutes. D’autres prennent trois séances. Nous ne meublons pas et nous ne précipitons pas.',
        },
        {
          heading: 'Honnêtes sur les pertes',
          body: 'Tickra enseigne un métier qui statistiquement fait perdre de l’argent à la plupart des gens. Nous le disons sur chaque plan.',
        },
      ],
    },
    team: {
      title: 'Un studio, pas un marketplace.',
      body: "Tickra, c'est six personnes : deux rédacteurs, deux designers, deux ingénieurs. Nous recrutons lentement, nous livrons lentement, et nous pensons que les petites équipes font la meilleure pédagogie.",
    },
  },
  editorial: {
    eyebrow: 'Éditorial',
    title: 'Notes de terrain sur un métier.',
    body: "Des essais courts de nos rédacteurs et d'une poignée de praticiens en qui nous avons confiance. Pas de newsletter, pas de tunnel — juste de l'écriture soignée sur la lecture des marchés.",
    posts: [
      {
        kicker: 'Méthode · 7 min',
        title: 'Pourquoi nous enseignons la bougie avant l’indicateur.',
        excerpt:
          'Les indicateurs compressent le prix en un nombre. La bougie est déjà une compression. Nous défendons l’idée qu’il faut apprendre à lire l’objet compressé avant d’ajouter une couche.',
        date: '14 avril 2026',
      },
      {
        kicker: 'Risque · 9 min',
        title: 'La règle des 1 % n’est pas une règle. C’est un calibrage de départ.',
        excerpt:
          'La plupart des traders particuliers traitent « risquer 1 % par trade » comme une parole d’évangile. Nous défendons l’idée que c’est un défaut utile pour débuter et une contrainte créative pour les autres.',
        date: '28 mars 2026',
      },
      {
        kicker: 'Psychologie · 11 min',
        title: 'Du coût d’une série de gains.',
        excerpt:
          "Cinq gains de suite produisent un état qui dégrade statistiquement la sixième décision. Voici ce que font les desks pro pour le neutraliser.",
        date: '9 mars 2026',
      },
      {
        kicker: 'Interview · 22 min',
        title: 'Conversation avec une trader FX discrétionnaire.',
        excerpt:
          "Vingt‑deux minutes avec quelqu'un qui trade la même paire, de la même manière, depuis neuf ans. Surtout sur ce qu'elle ne fait pas.",
        date: '21 février 2026',
      },
    ],
  },
  contact: {
    eyebrow: 'Contact',
    title: 'Écrivez‑nous un vrai message.',
    body: 'Nous lisons tout. Nous répondons sous deux jours ouvrés à la plupart des messages. Pas de bot, pas de file de tickets, pas de réponses automatiques.',
    form: {
      name: 'Nom',
      namePlaceholder: 'Votre nom',
      email: 'Email',
      emailPlaceholder: 'vous@exemple.com',
      topic: 'Sujet',
      topics: ['Question générale', 'Facturation ou compte', 'Presse', 'Partenariat'],
      message: 'Message',
      messagePlaceholder: 'Dites‑nous ce qui vous occupe.',
      cta: 'Envoyer le message',
      notice: 'En envoyant, vous acceptez notre politique de confidentialité. Nous ne partageons jamais votre email.',
    },
    directs: {
      title: 'Ou écrivez directement.',
      items: [
        { label: 'Général', value: 'hello@tickra.com' },
        { label: 'Presse', value: 'press@tickra.com' },
        { label: 'Confidentialité', value: 'privacy@tickra.com' },
        { label: 'Studio', value: '16 rue du Faubourg, 75010 Paris' },
      ],
    },
  },
  changelog: {
    eyebrow: 'Journal des versions',
    title: 'Tout ce qui a été livré.',
    body: 'Nous publions une note chaque fois que nous changeons quelque chose qu’un apprenant peut remarquer. Versionnage en semver ; le changelog est écrit à la main.',
    versions: [
      {
        version: '0.7.0',
        date: '12 mai 2026',
        title: 'Journal de décisions.',
        items: [
          'Chaque exercice capture désormais votre raisonnement écrit avant que le mouvement du graphique ne soit révélé.',
          'Ajout d’une vue journal dans le dashboard avec un revealer de patterns mensuels.',
          'Amélioration du switch light/dark dans l’embed TradingView.',
        ],
      },
      {
        version: '0.6.0',
        date: '28 avril 2026',
        title: 'Lancement bilingue.',
        items: [
          "Traduction française complète sur la landing, l'app et les leçons.",
          'Le sélecteur de langue mémorise votre préférence pour les visites futures.',
          'Les images OG et les métadonnées SEO sont générées par locale.',
        ],
      },
      {
        version: '0.5.0',
        date: '6 avril 2026',
        title: 'Piste Gestion du Risque.',
        items: [
          'Sortie de la piste Gestion du Risque (douze leçons).',
          'Ajout d’un calculateur de taille de position intégré aux leçons concernées.',
          'Nouveau format de point de contrôle avec trois niveaux de difficulté par question.',
        ],
      },
      {
        version: '0.4.0',
        date: '18 mars 2026',
        title: 'Refonte des streaks.',
        items: [
          'Les streaks récompensent la régularité, pas le surmenage — limités à un jour de crédit par jour.',
          'Ajout d’un jeton de freeze pour pardonner un jour manqué par semaine.',
          'Le record de streak est affiché à côté du streak actuel.',
        ],
      },
    ],
  },
  mfa: {
    title: 'Authentification à deux facteurs',
    body: 'Un code à six chiffres depuis votre application d’authentification, en plus de votre mot de passe. Fortement recommandé.',
    statusOff: 'Désactivée',
    statusOn: 'Activée',
    enable: 'Activer la 2FA',
    disable: 'Désactiver',
    qrLabel: 'Scannez avec votre application d’authentification, puis saisissez le code à six chiffres ci‑dessous.',
    codeLabel: 'Code à six chiffres',
    verify: 'Vérifier et activer',
    cancel: 'Annuler',
    enabled: '2FA activée.',
    disabled: '2FA désactivée.',
    invalidCode: 'Code invalide. Réessayez.',
    failed: 'Impossible de modifier les réglages 2FA.',
  },
  export: {
    title: 'Exporter vos données',
    body: 'Téléchargez un fichier JSON contenant tout ce que nous stockons sur vous — profil, abonnement, progression des leçons, historique d’activité.',
    cta: 'Télécharger mes données',
    pending: 'Préparation…',
    failed: 'Échec de l’export. Réessayez ou contactez le support.',
  },
  cookies: {
    title: 'Cookies, en bref.',
    body: 'Tickra stocke deux cookies fonctionnels (votre langue et votre thème) plus une session de connexion lorsque vous avez un compte. Aucun tracking tiers. Aucune publicité.',
    accept: 'J’ai compris',
    learn: 'Lire la politique de confidentialité',
  },
  reset: {
    request: {
      eyebrow: 'Mot de passe',
      title: 'Un nouveau mot de passe, envoyé dans votre boîte.',
      body: 'Saisissez l’email lié à votre compte Tickra. Nous envoyons un lien unique, valable une heure.',
      emailLabel: 'Email',
      emailPlaceholder: 'vous@exemple.com',
      cta: 'Envoyer le lien',
      back: 'Retour à la connexion',
      sent: {
        title: 'Consultez votre boîte.',
        body: 'Si un compte existe pour cet email, un lien de réinitialisation est en route. Ouvrez‑le dans l’heure.',
      },
    },
    confirm: {
      eyebrow: 'Nouveau mot de passe',
      title: 'Définissez un nouveau mot de passe.',
      body: 'Huit caractères minimum. Nous le hachons, nous ne le voyons jamais.',
      passwordLabel: 'Nouveau mot de passe',
      cta: 'Enregistrer',
      success: 'Mot de passe mis à jour. Vous pouvez vous connecter.',
    },
  },
  deleteAccount: {
    title: 'Supprimer le compte',
    body: 'Définitif. Nous effaçons votre profil, votre progression, vos streaks, votre journal et votre abonnement actif sous 30 jours.',
    confirm: 'Saisissez votre email pour confirmer.',
    cta: 'Supprimer le compte',
    cancel: 'Annuler',
    done: 'Compte supprimé.',
    fail: 'Suppression impossible. Contactez le support.',
  },
  signIn: {
    eyebrow: 'Connexion',
    title: 'Content de vous revoir.',
    subtitle: 'Votre streak vous attend de l’autre côté.',
    emailLabel: 'Email',
    emailPlaceholder: 'vous@exemple.com',
    passwordLabel: 'Mot de passe',
    forgotten: 'Mot de passe oublié ?',
    cta: 'Se connecter',
    or: 'Ou continuer avec',
    google: 'Continuer avec Google',
    apple: 'Continuer avec Apple',
    newHere: 'Nouveau sur Tickra ?',
    create: 'Passer le test de niveau',
    notice:
      'Aucun mot de passe requis pour le test. Nous ne demandons un email que lorsque vous enregistrez votre progression.',
  },
  notFound: {
    eyebrow: 'Erreur 404',
    title: 'Cette page est hors du graphique.',
    body: 'Le lien que vous avez suivi n’existe pas, a été déplacé ou n’a jamais été publié. Retournez au parcours.',
    primary: 'Retour à l’accueil',
    secondary: 'Ouvrir le tableau de bord',
  },
  legal: {
    backToHome: 'Retour à l’accueil',
    terms: {
      eyebrow: 'Conditions d’utilisation',
      title: 'Les règles du jeu.',
      updated: 'Dernière mise à jour · avril 2026',
      sections: [
        {
          heading: 'Vocation pédagogique',
          body: "Tickra est une plateforme éducative. Rien sur ce site ne constitue un conseil en investissement, financier, fiscal ou juridique. Les décisions prises avec votre capital restent entièrement les vôtres.",
        },
        {
          heading: 'Compte et accès',
          body: "Un seul compte par personne. Partager les accès, scraper les leçons ou revendre du contenu entraîne la résiliation immédiate sans remboursement.",
        },
        {
          heading: 'Abonnements et remboursements',
          body: "Pro est renouvelé mensuellement jusqu'à annulation. L'offre À vie est un paiement unique, couvert par une garantie satisfait ou remboursé de 14 jours à compter de l'achat. Au‑delà, l'achat À vie n'est plus remboursable.",
        },
        {
          heading: 'Usage acceptable',
          body: 'Vous vous engagez à ne pas utiliser Tickra pour tromper d’autres apprenants, diffuser des logiciels malveillants, ni dégrader le service pour autrui.',
        },
        {
          heading: 'Résiliation',
          body: 'Vous pouvez fermer votre compte à tout moment depuis les réglages. Nous pouvons suspendre les comptes contrevenant à ces conditions, avec un préavis écrit lorsque possible.',
        },
      ],
    },
    privacy: {
      eyebrow: 'Confidentialité',
      title: 'Ce que nous gardons, ce que nous ne collectons jamais.',
      updated: 'Dernière mise à jour · avril 2026',
      sections: [
        {
          heading: 'Ce que nous collectons',
          body: "L'email de compte, le mot de passe haché, la progression dans les leçons, l'historique des streaks et des télémétries d'usage anonymes. C'est la liste complète.",
        },
        {
          heading: 'Ce que nous ne collectons jamais',
          body: 'Aucune information bancaire, aucun identifiant de courtier, aucun historique de trades hors de ce que vous journalisez volontairement dans Tickra. Nous ne sommes pas un courtier.',
        },
        {
          heading: 'Cookies',
          body: "Deux cookies : la préférence de langue (tickra-locale) et la préférence de thème (tickra-theme). Aucun cookie de tracking tiers. Notre analytics anonymise les IP.",
        },
        {
          heading: 'Vos droits',
          body: "Conformément au RGPD, vous pouvez demander un export complet ou une suppression définitive de vos données à tout moment via privacy@tickra.com. Nous répondons sous 30 jours.",
        },
      ],
    },
    risk: {
      eyebrow: 'Avertissement risque',
      title: "Lisez ceci avant tout passage d'ordre.",
      updated: 'Dernière mise à jour · avril 2026',
      sections: [
        {
          heading: 'Le trading est par défaut un jeu perdant',
          body: "La majorité des traders particuliers perdent de l'argent. Tickra enseigne l'art de lire les marchés ; il ne peut pas supprimer le risque inhérent à l'engagement de capital.",
        },
        {
          heading: 'Performances passées, rendements futurs',
          body: "Tout ce que vous apprenez sur Tickra a fonctionné, quelque part, à un moment, pour quelqu'un. Aucune de ces approches ne garantit des rendements futurs entre vos mains, sur votre compte, sur ce marché.",
        },
        {
          heading: "L'effet de levier amplifie les deux côtés",
          body: "Beaucoup des instruments évoqués sur Tickra sont à effet de levier. Le levier multiplie les gains et les pertes du même facteur — au‑delà du dépôt initial sur certains produits.",
        },
        {
          heading: "Engagez du capital que vous pouvez perdre",
          body: "Ne tradez jamais avec de l'argent destiné au loyer, à l'alimentation, au remboursement de dettes ou à votre fonds de réserve. Décidez votre tolérance à la perte à froid, avant que le graphique ne bouge.",
        },
        {
          heading: 'Consultez un professionnel si besoin',
          body: "Tickra ne remplace pas un conseiller financier agréé. Si votre situation nécessite un accompagnement personnalisé, consultez‑en un avant d'agir.",
        },
      ],
    },
  },
  signUp: {
    eyebrow: 'Créer un compte',
    title: 'Une nouvelle ligne de graphiques s’ouvre.',
    subtitle: 'Mot de passe : 8 caractères minimum. Nous le hachons, nous ne le voyons jamais.',
    fullName: 'Nom complet',
    fullNamePlaceholder: 'Votre nom',
    emailLabel: 'Email',
    emailPlaceholder: 'vous@exemple.com',
    passwordLabel: 'Mot de passe',
    passwordHint: 'Au moins 8 caractères.',
    cta: 'Créer le compte',
    or: 'Ou inscription avec',
    google: 'Inscription avec Google',
    apple: 'Inscription avec Apple',
    haveAccount: 'Déjà apprenant ?',
    signIn: 'Se connecter',
    notice: 'En créant un compte, vous acceptez nos CGU et notre politique de confidentialité.',
    checkEmail: {
      title: 'Consultez votre boîte de réception.',
      body: 'Nous avons envoyé un lien de confirmation. Ouvrez‑le depuis cet appareil pour finaliser votre compte.',
    },
  },
  curriculum: {
    eyebrow: 'Parcours',
    title: 'Tout le chemin, cartographié.',
    body: 'Onze pistes de maîtrise, 127 leçons, ici. Les trois premières sont gratuites. Pro et À vie débloquent tout ; votre test de niveau décide d’où l’on vous dépose.',
    trackLabel: 'Piste',
    lessonsLabel: 'leçons',
    minutesLabel: 'min',
    locked: 'Verrouillé',
    free: 'Gratuit',
    pro: 'Pro',
    openLesson: 'Ouvrir la leçon',
  },
  settings: {
    eyebrow: 'Compte',
    title: 'Vos réglages.',
    sections: {
      profile: {
        title: 'Profil',
        body: 'Comment Tickra s’adresse à vous, et la langue dans laquelle nous livrons les leçons.',
        fullName: 'Nom complet',
        email: 'Email',
        locale: 'Langue préférée',
        save: 'Enregistrer',
        saved: 'Profil mis à jour.',
      },
      subscription: {
        title: 'Abonnement',
        body: 'Plan actuel, statut de renouvellement, et portail de facturation.',
        plan: 'Plan actuel',
        status: 'Statut',
        renewal: 'Renouvellement le',
        cancelled: 'Annulation le',
        manage: 'Gérer la facturation',
        upgrade: 'Passer Pro',
        cancelNote: 'Votre abonnement se terminera à la fin de la période.',
      },
      danger: {
        title: 'Déconnexion',
        body: 'Fermer cette session sur cet appareil.',
        signOut: 'Se déconnecter',
      },
    },
  },
  theme: { light: 'Passer en thème clair', dark: 'Passer en thème sombre' },
  locale: { switch: 'Changer de langue' },
} as const;

export default fr;
