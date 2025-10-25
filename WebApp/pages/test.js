export default function Test() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>🎉 Test Page - AppBTP WebApp</h1>
      <p>Si vous voyez cette page, le déploiement fonctionne !</p>
      <p>Date: {new Date().toLocaleString()}</p>
      <style jsx>{`
        div {
          background: linear-gradient(135deg, #F85F6A 0%, #e74c3c 100%);
          color: white;
          border-radius: 10px;
          text-align: center;
        }
      `}</style>
    </div>
  );
}