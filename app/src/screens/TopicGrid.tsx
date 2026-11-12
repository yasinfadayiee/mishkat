import { TOPICS } from '../data/topics'

/** فهرست موضوع‌ها، گروه‌گروه (در کتابخانه) */
export function TopicGrid({ open }: { open: (id: string) => void }) {
  const groups = [...new Set(TOPICS.map((t) => t.group))]
  return (
    <section className="shelf topic-shelf">
      <div className="shelf-head">
        <h2>یک موضوع، از همهٔ کتاب‌ها</h2>
        <small>قرآن، نهج‌البلاغه، غرر و کتاب‌های حدیث، کنار هم</small>
      </div>
      {groups.map((g) => (
        <div key={g} className="topic-group">
          <b>{g}</b>
          <div className="topic-chips">
            {TOPICS.filter((t) => t.group === g).map((t) => (
              <button key={t.id} onClick={() => open(t.id)}>
                {t.name}
              </button>
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}

