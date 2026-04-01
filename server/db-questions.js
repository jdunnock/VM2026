import { run, get, all } from './db-core.js'
import { parseJsonOrArray } from './json-utils.js'
import { QUESTION_MANIFEST, QUESTION_MANIFEST_BY_SLUG, QUESTION_MANIFEST_SLUGS } from './question-manifest.js'

function normalizeQuestionText(text) {
  return typeof text === 'string' ? text.trim().replace(/\s+/g, ' ').toLowerCase() : ''
}

function mapAdminQuestionRow(row) {
  if (!row) {
    return null
  }

  const manifestQuestion = row.slug ? QUESTION_MANIFEST_BY_SLUG.get(row.slug) : null
  const questionText = manifestQuestion?.questionText ?? row.question_text
  const category = manifestQuestion?.category ?? row.category
  const options = manifestQuestion?.options ?? parseJsonOrArray(row.options_json)
  const points = manifestQuestion?.points ?? row.points
  const lockTime = manifestQuestion?.lockTime ?? row.lock_time
  const status = manifestQuestion?.status ?? row.status
  const allowFreeText = manifestQuestion?.allowFreeText ?? (row.allow_free_text === 1)

  return {
    id: row.id,
    slug: row.slug ?? null,
    questionText,
    category,
    options,
    correctAnswer: row.correct_answer,
    points,
    lockTime,
    status,
    allowFreeText,
    acceptedAnswers: parseJsonOrArray(row.accepted_answers_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function listManifestQuestionRows() {
  const rows = await all(
    `
    SELECT
    id,
    slug,
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
    WHERE slug IS NOT NULL
  `,
  )

  const rowsBySlug = new Map(rows.map((row) => [row.slug, row]))
  return QUESTION_MANIFEST_SLUGS.map((slug) => rowsBySlug.get(slug)).filter(Boolean)
}

export async function syncAdminQuestionsFromManifest() {
  const existingRows = await all(
    `
    SELECT
    id,
    slug,
    question_text
    FROM admin_questions
  `,
  )

  const matchedRowIds = new Set()
  const rowsBySlug = new Map()

  for (const row of existingRows) {
    if (row.slug && QUESTION_MANIFEST_BY_SLUG.has(row.slug) && !rowsBySlug.has(row.slug)) {
      rowsBySlug.set(row.slug, row)
      matchedRowIds.add(row.id)
    }
  }

  for (const manifestQuestion of QUESTION_MANIFEST) {
    if (rowsBySlug.has(manifestQuestion.slug)) {
      continue
    }

    const textMatch = existingRows.find(
      (row) => !matchedRowIds.has(row.id) && normalizeQuestionText(row.question_text) === normalizeQuestionText(manifestQuestion.questionText),
    )

    if (textMatch) {
      rowsBySlug.set(manifestQuestion.slug, textMatch)
      matchedRowIds.add(textMatch.id)
    }
  }

  for (const manifestQuestion of QUESTION_MANIFEST) {
    const existingRow = rowsBySlug.get(manifestQuestion.slug)
    if (existingRow) {
      await run(
        `
        UPDATE admin_questions
        SET
        slug = ?,
        question_text = ?,
        category = ?,
        options_json = ?,
        points = ?,
        lock_time = ?,
        status = ?,
        allow_free_text = ?,
        updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
        [
          manifestQuestion.slug,
          manifestQuestion.questionText,
          manifestQuestion.category,
          JSON.stringify(manifestQuestion.options),
          manifestQuestion.points,
          manifestQuestion.lockTime,
          manifestQuestion.status,
          manifestQuestion.allowFreeText ? 1 : 0,
          existingRow.id,
        ],
      )
      continue
    }

    await run(
      `
      INSERT INTO admin_questions (
      slug,
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
      VALUES (?, ?, ?, ?, '', ?, ?, ?, ?, '[]', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `,
      [
        manifestQuestion.slug,
        manifestQuestion.questionText,
        manifestQuestion.category,
        JSON.stringify(manifestQuestion.options),
        manifestQuestion.points,
        manifestQuestion.lockTime,
        manifestQuestion.status,
        manifestQuestion.allowFreeText ? 1 : 0,
      ],
    )
  }
}

export async function listAdminQuestions() {
  const rows = await listManifestQuestionRows()
  return rows.map(mapAdminQuestionRow)
}

export async function listPublishedAdminQuestions() {
  const rows = await listManifestQuestionRows()
  return rows
    .map(mapAdminQuestionRow)
    .filter((row) => row.status === 'published')
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
    slug,
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

  if (!row?.slug || !QUESTION_MANIFEST_BY_SLUG.has(row.slug)) {
    return null
  }

  return mapAdminQuestionRow(row)
}

export async function updateAdminQuestion(id, question) {
  await run(
    `
    UPDATE admin_questions
    SET
    correct_answer = ?,
    accepted_answers_json = ?,
    updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `,
    [question.correctAnswer, JSON.stringify(question.acceptedAnswers ?? []), id],
  )

  return getAdminQuestionById(id)
}

export async function deleteAdminQuestion(id) {
  await run('DELETE FROM participant_extra_answers WHERE question_id = ?', [id])
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
