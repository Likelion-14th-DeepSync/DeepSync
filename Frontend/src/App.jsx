import MobileLayout from './layouts/MobileLayout'
import Button from './components/common/Button'
import Card from './components/common/Card'

function App() {
  return (
    <MobileLayout>
      <div style={{ padding: '20px' }}>
        <Card>
          <h1>Wellness Care</h1>
          <p>공통 구조 테스트</p>
        </Card>

        <div style={{ marginTop: '20px' }}>
          <Button>시작하기</Button>
        </div>
      </div>
    </MobileLayout>
  )
}

export default App