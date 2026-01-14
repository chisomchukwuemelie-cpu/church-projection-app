import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Projector from './pages/Projector';
import { ProjectionProvider } from './context/ProjectionContext';

function App() {
  console.log("DEBUG: App component rendering");
  return (
    <Router>
      <ProjectionProvider>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projector" element={<Projector />} />
        </Routes>
      </ProjectionProvider>
    </Router>
  );
}

export default App;
