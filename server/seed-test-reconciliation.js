/**
 * Test script: sets up DB state for admin answer reconciliation testing.
 *
 * 1. Runs full simulation (reset + setup + C0-C7)
 * 2. Un-settles "Skytteligavinnare" question
 * 3. Marks it as allowFreeText
 * 4. Replaces some participant answers with misspelled free-text variants
 *
 * Usage: node server/seed-test-reconciliation.js
 */

import { run, all } from './db-core.js'
import { initDatabase, closeDatabase } from './db-schema.js'
import { findParticipantByName } from './db-participants.js'
import { listAdminQuestions, updateAdminQuestion, getAdminQuestionById } from './db-questions.js'
import { execSync } from 'node:child_process'

const SIM_NAMES = [
    'Anders', 'Björn', 'Cecilia', 'David', 'Erik',
    'Fanny', 'Gustav', 'Helena', 'Isak', 'Julia',
    'Karl', 'Laura', 'Magnus', 'Nora', 'Oscar',
]

// Free-text variants of "Kylian Mbappé" that participants might type
const FREETEXT_VARIANTS = [
    { name: 'Anders', answer: 'Mbabbe' },
    { name: 'Cecilia', answer: 'K. Mbappe' },
    { name: 'David', answer: 'mbappe' },
    { name: 'Erik', answer: 'Kylian Mbappe' },
    { name: 'Gustav', answer: 'Mbappé' },
    { name: 'Helena', answer: 'kylian mbappé' },
    { name: 'Karl', answer: 'Mbabbe' },
]

async function main() {
    console.log('=== Setting up reconciliation test scenario ===\n')

    // Step 1: Run full simulation
    console.log('Step 1: Running full simulation (reset + setup + C0-C7)...')
    const phases = ['reset', 'setup', 'C0', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7']
    for (const phase of phases) {
        execSync(`node server/seed-simulation.js ${phase}`, { stdio: 'inherit' })
    }
    console.log()

    // Re-init DB connection after simulation phases
    await initDatabase()

    // Step 2: Find the Skytteligavinnare question
    console.log('Step 2: Finding Skytteligavinnare question...')
    const questions = await listAdminQuestions()
    const skytte = questions.find((q) => q.questionText === 'Skytteligavinnare')
    if (!skytte) {
        console.error('ERROR: Skytteligavinnare question not found!')
        await closeDatabase()
        process.exit(1)
    }
    console.log(`  Found: id=${skytte.id}, correctAnswer="${skytte.correctAnswer}"`)

    // Step 3: Un-settle and mark as allowFreeText
    console.log('Step 3: Un-settling and enabling allowFreeText...')
    await updateAdminQuestion(skytte.id, {
        ...skytte,
        correctAnswer: '',
        allowFreeText: true,
        acceptedAnswers: [],
    })
    console.log('  Skytteligavinnare is now unsettled + allowFreeText=true')

    // Step 4: Replace some participant answers with free-text variants
    console.log('Step 4: Injecting free-text answer variants...')
    for (const variant of FREETEXT_VARIANTS) {
        const participant = await findParticipantByName(variant.name)
        if (!participant) {
            console.log(`  SKIP: participant "${variant.name}" not found`)
            continue
        }

        // Update the normalized extra answers table directly
        await run(
            `UPDATE participant_extra_answers
             SET selected_answer = ?, updated_at = CURRENT_TIMESTAMP
             WHERE participant_id = ? AND question_id = ?`,
            [variant.answer, participant.id, skytte.id],
        )

        // Also update the JSON blob in participant_tips
        const tipRow = await run(
            `SELECT id, tips_json FROM participant_tips WHERE participant_id = ?`,
            [participant.id],
        ).catch(() => null)

        // Update tips_json if it exists
        const rows = await all(
            `SELECT id, tips_json FROM participant_tips WHERE participant_id = ?`,
            [participant.id],
        )
        if (rows.length > 0) {
            const tips = JSON.parse(rows[0].tips_json)
            if (tips.extraAnswers) {
                tips.extraAnswers[String(skytte.id)] = variant.answer
                await run(
                    `UPDATE participant_tips SET tips_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                    [JSON.stringify(tips), rows[0].id],
                )
            }
        }

        console.log(`  ${variant.name}: "${variant.answer}"`)
    }

    // Step 5: Show summary
    console.log('\n=== Summary ===')
    const allAnswers = await all(
        `SELECT p.name, pea.selected_answer
         FROM participant_extra_answers pea
         JOIN participants p ON p.id = pea.participant_id
         WHERE pea.question_id = ?
         ORDER BY pea.selected_answer`,
        [skytte.id],
    )
    console.log(`\nAll answers for "Skytteligavinnare" (question ${skytte.id}):`)
    for (const row of allAnswers) {
        console.log(`  ${row.name}: "${row.selected_answer}"`)
    }

    const verified = await getAdminQuestionById(skytte.id)
    console.log(`\nQuestion state:`)
    console.log(`  correctAnswer: "${verified.correctAnswer}"`)
    console.log(`  allowFreeText: ${verified.allowFreeText}`)
    console.log(`  acceptedAnswers: ${JSON.stringify(verified.acceptedAnswers)}`)

    console.log('\n✓ Ready! Open admin → Frågor → "Granska svar" on Skytteligavinnare to test reconciliation.')

    await closeDatabase()
}

main().catch((err) => {
    console.error('Fatal error:', err)
    process.exit(1)
})
