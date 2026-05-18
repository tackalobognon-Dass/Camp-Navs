import { Routes, Route } from 'react-router-dom'
import PrivateRoute from './routes/PrivateRoute'

import HomePage from './pages/public/HomePage'
import InscriptionPage from './pages/public/InscriptionPage'
import ChantsPage from './pages/public/ChantsPage'
import DocumentsPage from './pages/public/DocumentsPage'
import ProgrammePage from './pages/public/ProgrammePage'

import LoginPage from './pages/admin/LoginPage'
import DashboardPage from './pages/admin/DashboardPage'
import CampeursPage from './pages/admin/CampeursPage'
import TresoreriePage from './pages/admin/TresoreriePage'
import AnnoncesAdminPage from './pages/admin/AnnoncesAdminPage'
import ChantsAdminPage from './pages/admin/ChantsAdminPage'
import DocumentsAdminPage from './pages/admin/DocumentsAdminPage'
import ProgrammeAdminPage from './pages/admin/ProgrammeAdminPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/inscription" element={<InscriptionPage />} />
      <Route path="/chants" element={<ChantsPage />} />
      <Route path="/documents" element={<DocumentsPage />} />
      <Route path="/programme" element={<ProgrammePage />} />

      <Route path="/admin/login" element={<LoginPage />} />
      <Route path="/admin" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
      <Route path="/admin/campeurs" element={<PrivateRoute><CampeursPage /></PrivateRoute>} />
      <Route path="/admin/tresorerie" element={<PrivateRoute><TresoreriePage /></PrivateRoute>} />
      <Route path="/admin/annonces" element={<PrivateRoute><AnnoncesAdminPage /></PrivateRoute>} />
      <Route path="/admin/chants" element={<PrivateRoute><ChantsAdminPage /></PrivateRoute>} />
      <Route path="/admin/documents" element={<PrivateRoute><DocumentsAdminPage /></PrivateRoute>} />
      <Route path="/admin/programme" element={<PrivateRoute><ProgrammeAdminPage /></PrivateRoute>} />
    </Routes>
  )
}

export default App
