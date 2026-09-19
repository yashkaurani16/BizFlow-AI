import ActivityItem from './ActivityItem.jsx'
import SectionCard from './SectionCard.jsx'

function RecentActivitySection({ activities = [] }) {
  if (activities.length === 0) {
    return (
      <SectionCard title="Recent Cross-Module Activities">
        <p className="muted-copy">No recent activities recorded yet.</p>
      </SectionCard>
    )
  }

  return (
    <SectionCard title="Recent Cross-Module Activities">
      <ol className="activity-list">
        {activities.map((item) => (
          <ActivityItem
            key={item.id}
            activity={{
              ...item,
              title: item.relatedEntity ? `${item.title} • ${item.relatedEntity}` : item.title,
            }}
          />
        ))}
      </ol>
    </SectionCard>
  )
}

export default RecentActivitySection
