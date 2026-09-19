import Card from '../components/Card.jsx'

function PlaceholderPage({ title, description }) {
  return (
    <div className="placeholder-page">
      <Card>
        <h1>{title}</h1>
        <p>{description}</p>
      </Card>
    </div>
  )
}

export default PlaceholderPage
