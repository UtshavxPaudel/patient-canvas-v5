# MedForce AI - Patient Canvas & Adverse Event Dashboard

A modern collaborative medical dashboard application for adverse event monitoring, patient data visualization, and real-time clinical decision support.

## Features

- 🏥 **Patient Context Dashboard**: Comprehensive patient demographics and medical history
- 📊 **Encounter Timeline**: Visual timeline of patient encounters with medication overlays
- ⚠️ **Adverse Event Analytics**: RUCAM scoring and causality assessment
- 🧪 **Lab Visualization**: Interactive lab trends and tables with color-coded status
- 🔍 **Differential Diagnosis**: Track and manage differential diagnoses
- 🎯 **Focus System**: Smooth viewport transitions to specific components
- 🔄 **Real-Time Sync**: Server-Sent Events for instant updates across all clients
- 🎨 **Modern UI**: Clean, responsive design with smooth animations
- 🤝 **Google Meet Integration**: Collaborative viewing in video calls

## Getting Started

### Prerequisites

- Node.js (v20 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the backend server:
```bash
node api/server.js
```

3. In a new terminal, start the frontend:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) to view the app

### Testing the API

Run the test script to verify all endpoints:

```bash
node test-dashboard-api.js
```

### Storybook (Optional)

To view and test components in Storybook:

```bash
npm run storybook
```

Open [http://localhost:6006](http://localhost:6006) to view Storybook

## Usage

### Canvas Navigation
- **Pan**: Left-click and drag on empty space, or middle mouse button
- **Zoom**: Mouse wheel up/down (zooms around cursor)
- **Reset View**: Ctrl+R to reset viewport
- **Focus**: Ctrl+F to focus on first item

### Dashboard Components

The application includes 6 specialized dashboard components:

1. **PatientContext** - Patient demographics and medical summary
2. **EncounterTimeline** - Visual timeline of encounters with medications
3. **AdverseEventAnalytics** - RUCAM scoring and AE analysis
4. **LabTable** - Tabular lab values with trends
5. **LabChart** - Visual lab trends over time
6. **DifferentialDiagnosis** - Diagnosis tracking and management

### API Usage

#### Create a Dashboard Component

```javascript
const response = await fetch('http://localhost:3001/api/components', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    componentType: 'PatientContext',
    props: {
      patientData: {
        patient: {
          name: 'Sarah Miller',
          age: 43,
          sex: 'Female',
          mrn: 'MC-001001'
        }
      }
    }
  })
});

const component = await response.json();
console.log('Created:', component.id);
```

#### Focus on a Component

```javascript
await fetch('http://localhost:3001/api/focus', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    objectId: 'dashboard-item-patient-context'
  })
});
```

See `DASHBOARD_SYSTEM.md` for complete API documentation.

## Project Structure

```
src/
├── components/
│   ├── Canvas.tsx          # Main canvas component
│   ├── BoardItem.tsx      # Individual board items
│   ├── Toolbar.tsx         # Top toolbar
│   └── *.stories.tsx       # Storybook stories
├── types.ts               # TypeScript type definitions
├── App.tsx               # Main application component
└── index.tsx             # Application entry point
```

## Technologies Used

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Styled Components** - CSS-in-JS styling
- **Framer Motion** - Animations and transitions
- **React Router** - Routing and navigation

### Backend
- **Express.js** - REST API server
- **Server-Sent Events (SSE)** - Real-time updates
- **Redis** (optional) - Persistent storage
- **CORS** - Cross-origin resource sharing

### Integrations
- **Google Meet Add-ons** - Collaborative viewing
- **Storybook** - Component documentation

## Development

### Available Scripts

- `npm start` - Start frontend development server
- `npm run build` - Build for production
- `npm run storybook` - Start Storybook
- `npm run build-storybook` - Build Storybook
- `npm test` - Run tests
- `node api/server.js` - Start backend server (file-based storage)
- `node test-dashboard-api.js` - Test API endpoints

### Server Options

Three server implementations are available:

1. **server.js** - File-based storage (development)
   - Persists to `src/data/boardItems.json`
   - Best for local development

2. **server-vercel.js** - In-memory storage (Vercel)
   - 1-minute cache
   - Suitable for serverless deployment

3. **server-redis.js** - Redis persistence (production)
   - Permanent storage
   - Requires `REDIS_URL` environment variable

### Environment Variables

Create a `.env` file:

```bash
# Backend API URL
REACT_APP_API_BASE_URL=http://localhost:3001

# Redis (optional, for server-redis.js)
REDIS_URL=redis://localhost:6379

# Google Meet (optional)
REACT_APP_GCP_PROJECT_NUMBER=your_project_number
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details
