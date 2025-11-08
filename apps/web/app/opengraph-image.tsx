import { ImageResponse } from 'next/og'

// Image metadata
export const alt = 'Pitchivo - AI-Powered B2B Outreach'
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

// Image generation
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 60,
          background: 'linear-gradient(135deg, #00FA9A 0%, #90EE90 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'system-ui',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            marginBottom: 30,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              background: 'white',
              borderRadius: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: 50 }}>✨</span>
          </div>
          <h1
            style={{
              fontSize: 80,
              fontWeight: 'bold',
              margin: 0,
            }}
          >
            Pitchivo
          </h1>
        </div>
        <p
          style={{
            fontSize: 32,
            margin: 0,
            opacity: 0.95,
            textAlign: 'center',
            maxWidth: 900,
          }}
        >
          AI-Powered B2B Outreach for Ingredient Suppliers
        </p>
        <p
          style={{
            fontSize: 24,
            margin: 0,
            marginTop: 20,
            opacity: 0.9,
          }}
        >
          Upload. Connect. Pitch Smarter.
        </p>
      </div>
    ),
    {
      ...size,
    }
  )
}

