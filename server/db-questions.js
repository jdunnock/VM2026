import { run, get, all } from './db-core.js'
import { parseJsonOrArray } from './json-utils.js'

export async function listAdminQuestions() {
    const rows = await all(
        `
      SELECT
        id,
        question_text,
        category,
        options_json,
        correct_answer,
        points,
        lock_time,
        status,
        allow_free_text,
        accepted_answers_json,
        created_at,
        updated_at
      FROM admin_questions
      ORDER BY id DESC
    `,
    )

    return rows.map((row) => ({
        id: row.id,
        questionText: row.question_text,
        category: row.category,
        options: parseJsonOrArray(row.options_json),
        correctAnswer: row.correct_answer,
        points: row.points,
        lockTime: row.lock_time,
        status: row.status,
        allowFreeText: row.allow_free_text === 1,
        acceptedAnswers: parseJsonOrArray(row.accepted_answers_json),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    }))
}

export async function listPublishedAdminQuestions() {
    const rows = await all(
        `
      SELECT
        id,
        question_text,
        category,
        options_json,
        points,
        lock_time,
        status,
        allow_free_text
      FROM admin_questions
      WHERE status = 'published'
      ORDER BY lock_time ASC, id ASC
    `,
    )

    return rows.map((row) => ({
        id: row.id,
        questionText: row.question_text,
        category: row.category,
        options: parseJsonOrArray(row.options_json),
        points: row.points,
        lockTime: row.lock_time,
        status: row.status,
        allowFreeText: row.allow_free_text === 1,
    }))
}

export async function createAdminQuestion(question) {
    const result = await run(
        `
      INSERT INTO admin_questions (
        question_text,
        category,
        options_json,
        correct_answer,
        points,
        lock_time,
        status,
        allow_free_text,
        accepted_answers_json,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `,
        [
            question.questionText,
            question.category,
            JSON.stringify(question.options),
            question.correctAnswer,
            question.points,
            question.lockTime,
            question.status,
            question.allowFreeText ? 1 : 0,
            JSON.stringify(question.acceptedAnswers ?? []),
        ],
    )

    return getAdminQuestionById(result.lastID)
}

export async function getAdminQuestionById(id) {
    const row = await get(
        `
      SELECT
        id,
        question_text,
        category,
        options_json,
        correct_answer,
        points,
        lock_time,
        status,
        allow_free_text,
        accepted_answers_json,
        created_at,
        updated_at
      FROM admin_questions
      WHERE id = ?
    `,
        [id],
    )

    if (!row) {
        return null
    }

    return {
        id: row.id,
        questionText: row.question_text,
        category: row.category,
        options: parseJsonOrArray(row.options_json),
        correctAnswer: row.correct_answer,
        points: row.points,
        lockTime: row.lock_time,
        status: row.status,
        allowFreeText: row.allow_free_text === 1,
        acceptedAnswers: parseJsonOrArray(row.accepted_answers_json),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    }
}

export async function updateAdminQuestion(id, question) {
    await run(
        `
      UPDATE admin_questions
      SET
        question_text = ?,
        category = ?,
        options_json = ?,
        correct_answer = ?,
        points = ?,
        lock_time = ?,
        status = ?,
        allow_free_text = ?,
        accepted_answers_json = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
        [
            question.questionText,
            question.category,
            JSON.stringify(question.options),
            question.correctAnswer,
            question.points,
            question.lockTime,
            question.status,
            question.allowFreeText ? 1 : 0,
            JSON.stringify(question.acceptedAnswers ?? []),
            id,
        ],
    )

    return getAdminQuestionById(id)
}

export async function deleteAdminQuestion(id) {
    await run('DELETE FROM admin_questions WHERE id = ?', [id])
}

export async function getQuestionAnswers(questionId) {
    const rows = await all(
        `
      SELECT
        pea.selected_answer,
        p.name AS participant_name
      FROM participant_extra_answers pea
      JOIN participants p ON p.id = pea.participant_id
      WHERE pea.question_id = ?
      ORDER BY pea.selected_answer ASC
    `,
        [questionId],
    )

    const answerMap = new Map()
    for (const row of rows) {
        if (!answerMap.has(row.selected_answer)) {
            answerMap.set(row.selected_answer, [])
        }
        answerMap.get(row.selected_answer).push(row.participant_name)
    }

    return Array.from(answerMap.entries()).map(([answer, participants]) => ({
        answer,
        count: participants.length,
        participants,
    }))
}
