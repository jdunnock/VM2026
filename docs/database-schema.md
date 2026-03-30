# VM2026 Database Schema

SQLite with WAL journal mode and foreign keys enabled.

## ER-diagram

```mermaid
erDiagram
    participants {
        INTEGER id PK
        TEXT name UK "UNIQUE"
        TEXT access_code_hash
        TEXT created_at
        TEXT last_seen_at
    }

    participant_tips {
        INTEGER id PK
        INTEGER participant_id FK,UK "UNIQUE"
        TEXT tips_json
        TEXT created_at
        TEXT updated_at
    }

    participant_fixture_tips {
        INTEGER id PK
        INTEGER participant_id FK
        TEXT fixture_id
        TEXT match_key "nullable"
        INTEGER home_score "nullable"
        INTEGER away_score "nullable"
        TEXT sign "CHECK 1-X-2"
        BOOLEAN synced_from_json
    }

    participant_group_placements {
        INTEGER id PK
        INTEGER participant_id FK
        TEXT group_code
        INTEGER position "CHECK 1-4"
        TEXT team_name "nullable"
        BOOLEAN synced_from_json
    }

    participant_knockout_predictions {
        INTEGER id PK
        INTEGER participant_id FK
        TEXT round_title
        INTEGER position
        TEXT team_name "nullable"
        BOOLEAN synced_from_json
    }

    participant_extra_answers {
        INTEGER id PK
        INTEGER participant_id FK
        INTEGER question_id FK
        TEXT selected_answer
        BOOLEAN synced_from_json
    }

    admin_questions {
        INTEGER id PK
        TEXT question_text
        TEXT category
        TEXT options_json
        TEXT correct_answer
        INTEGER points
        TEXT lock_time
        TEXT status "draft or published"
        INTEGER allow_free_text "0 or 1"
        TEXT accepted_answers_json
        TEXT created_at
        TEXT updated_at
    }

    match_results {
        TEXT match_id PK
        TEXT stage "group or knockout"
        TEXT round "nullable"
        TEXT group_code "nullable"
        TEXT home_team
        TEXT away_team
        TEXT kickoff_at
        INTEGER home_score "nullable"
        INTEGER away_score "nullable"
        TEXT result_status "planned-live-completed"
        TEXT settled_at "nullable"
    }

    participants ||--o| participant_tips : "1:1 tips JSON blob"
    participants ||--o{ participant_fixture_tips : "1:N match predictions"
    participants ||--o{ participant_group_placements : "1:N group placements"
    participants ||--o{ participant_knockout_predictions : "1:N knockout picks"
    participants ||--o{ participant_extra_answers : "1:N extra question answers"
    admin_questions ||--o{ participant_extra_answers : "1:N answers per question"
```

## Unique Constraints

| Table | Columns |
|-------|---------|
| `participant_fixture_tips` | `(participant_id, fixture_id)` |
| `participant_group_placements` | `(participant_id, group_code, position)` |
| `participant_knockout_predictions` | `(participant_id, round_title, position)` |
| `participant_extra_answers` | `(participant_id, question_id)` |

## Indexes

| Index | Table | Columns |
|-------|-------|---------|
| `idx_fixture_tips_participant` | `participant_fixture_tips` | `(participant_id, updated_at)` |
| `idx_group_placements_participant_group` | `participant_group_placements` | `(participant_id, group_code)` |
| `idx_knockout_predictions_participant_round` | `participant_knockout_predictions` | `(participant_id, round_title)` |
| `idx_extra_answers_participant` | `participant_extra_answers` | `(participant_id)` |
| `idx_extra_answers_question` | `participant_extra_answers` | `(question_id)` |

## Notes

- `match_results` is standalone — linked to fixture tips via `fixture_id`/`match_key` in application code, not via FK
- `participant_tips` stores the full tips JSON blob (legacy); normalized tables (`_fixture_tips`, `_group_placements`, `_knockout_predictions`, `_extra_answers`) are the primary source
- `allow_free_text` + `accepted_answers_json` columns on `admin_questions` were added via migrations
