/**
 * Langues et domaines ACTIFS sur la plateforme côté contributeurs.
 *
 * ⚙️ Contexte MVP pilote : la première campagne de collecte est limitée à
 * la langue Mooré et au domaine "administration".
 *
 * Rien n'est supprimé — les listes complètes (4 langues, 4 domaines) restent
 * intactes en base de données, dans le backend et dans les pages admin.
 *
 * 🔁 Pour ouvrir la plateforme à d'autres langues/domaines, ajoutez
 * simplement les valeurs aux listes ci-dessous — aucun autre changement
 * n'est nécessaire :
 *
 *   ACTIVE_LANGUAGES = ["Mooré", "Dioula"]                        // ex.
 *   ACTIVE_DOMAINS   = ["administration", "sante", "agriculture"] // ex.
 *
 * Les indicateurs SINGLE_LANGUAGE / SINGLE_DOMAIN ci-dessous se recalculent
 * automatiquement : dès qu'une liste contient plus d'une option, l'écran de
 * contribution retrouve ses libellés (« Choisir… ») et ses états de
 * sélection (surbrillance, couleurs).
 */

/** Langues proposées aux contributeurs (page d'enregistrement). */
export const ACTIVE_LANGUAGES: string[] = ["Mooré"]

/** Domaines proposés aux contributeurs (page d'enregistrement). */
export const ACTIVE_DOMAINS: string[] = ["administration"]

/**
 * Vrai si une seule langue est active → affichage informatif : pas de
 * libellé « Choisir une langue », pas d'état sélectionné (vert).
 */
export const SINGLE_LANGUAGE: boolean = ACTIVE_LANGUAGES.length === 1

/**
 * Vrai si un seul domaine est actif → affichage informatif : pas de
 * libellé « Choisir un domaine », pas de couleur ni d'état sélectionné.
 */
export const SINGLE_DOMAIN: boolean = ACTIVE_DOMAINS.length === 1
