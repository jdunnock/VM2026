/**
 * Barrel re-export — scoring subsystem.
 *
 * Split into three focused modules:
 *   scoring-helpers.js      — pure text normalization / key builders
 *   db-scoring-lookups.js   — database lookup builders
 *   db-scoring-calc.js      — scoring calculation and ranking
 */

export {
    listParticipantScores,
    getParticipantScoreByParticipantId,
} from './db-scoring-calc.js'

export {
    listParticipantsWithTips,
    buildPublishedQuestionLookups,
    buildGroupStandingsLookups,
    buildKnockoutRoundLookups,
} from './db-scoring-lookups.js'
