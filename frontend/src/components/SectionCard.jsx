function SectionCard({ title, children, actions, className = '' }) {
  return (
    <section className={`card section-card ${className}`.trim()}>
      <div className="section-card-header">
        <h2>{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  )
}

export default SectionCard
