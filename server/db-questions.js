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
        status
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
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `,
        [
            question.questionText,
            question.category,
            JSON.stringify(question.options),
            question.correctAnswer,
            question.points,
            question.lockTime,
            question.status,
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
            id,
        ],
    )

    return getAdminQuestionById(id)
}

export async function deleteAdminQuestion(id) {
    await run('DELETE FROM admin_questions WHERE id = ?', [id])
}
