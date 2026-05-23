import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import PrivateRoute from './routes/PrivateRoute'
import InstallBanner from './components/InstallBanner'
import SplashScreen from './components/SplashScreen'

import HomePage from './pages/public/HomePage'
import InscriptionPage from './pages/public/InscriptionPage'
import ChantsPage from './pages/public/ChantsPage'
import DocumentsPage from './pages/public/DocumentsPage'
import ProgrammePage from './pages/public/ProgrammePage'
import CommentairesPage from './pages/public/CommentairesPage'
import ContactPage from './pages/public/ContactPage'
import SuiviPage from './pages/public/SuiviPage'
import LieuPage from './pages/public/LieuPage'

import LoginPage from './pages/admin/LoginPage'
import DashboardPage from './pages/admin/DashboardPage'
import MembresPage from './pages/admin/MembresPage'
import CampeursPage from './pages/admin/CampeursPage'
import EnfantsPage from './pages/admin/EnfantsPage'
import TresoreriePage from './pages/admin/TresoreriePage'
import AnnoncesAdminPage from './pages/admin/AnnoncesAdminPage'
import ChantsAdminPage from './pages/admin/ChantsAdminPage'
import DocumentsAdminPage from './pages/admin/DocumentsAdminPage'
import ProgrammeAdminPage from './pages/admin/ProgrammeAdminPage'
import SoireePage from './pages/admin/SoireePage'
import SantePage from './pages/admin/SantePage'
import LogistiquePage from './pages/admin/LogistiquePage'
import SuiviPostCampPage from './pages/admin/SuiviPostCampPage'
import TemoignagesPage from './pages/public/TemoignagesPage'
import TemoignagesAdminPage from './pages/admin/TemoignagesAdminPage'
import ParametresPage from './pages/admin/ParametresPage'

function App() {
  const [splashDone, setSplashDone] = useState(false)

  return (
    <>
      {!splashDone && <SplashScreen onFinish={() => setSplashDone(true)} />}
      <InstallBanner />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/inscription" element={<InscriptionPage />} />
        <Route path="/chants" element={<ChantsPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/programme" element={<ProgrammePage />} />
        <Route path="/discussion" element={<CommentairesPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/suivi" element={<SuiviPage />} />
        <Route path="/temoignages" element={<TemoignagesPage />} />
        <Route path="/lieu" element={<LieuPage />} />

        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="/admin" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/admin/membres" element={<PrivateRoute><MembresPage /></PrivateRoute>} />
        <Route path="/admin/campeurs" element={<PrivateRoute><CampeursPage /></PrivateRoute>} />
        <Route path="/admin/enfants" element={<PrivateRoute><EnfantsPage /></PrivateRoute>} />
        <Route path="/admin/tresorerie" element={<PrivateRoute><TresoreriePage /></PrivateRoute>} />
        <Route path="/admin/annonces" element={<PrivateRoute><AnnoncesAdminPage /></PrivateRoute>} />
        <Route path="/admin/chants" element={<PrivateRoute><ChantsAdminPage /></PrivateRoute>} />
        <Route path="/admin/documents" element={<PrivateRoute><DocumentsAdminPage /></PrivateRoute>} />
        <Route path="/admin/programme" element={<PrivateRoute><ProgrammeAdminPage /></PrivateRoute>} />
        <Route path="/admin/soiree" element={<PrivateRoute><SoireePage /></PrivateRoute>} />
        <Route path="/admin/sante" element={<PrivateRoute><SantePage /></PrivateRoute>} />
        <Route path="/admin/logistique" element={<PrivateRoute><LogistiquePage /></PrivateRoute>} />
        <Route path="/admin/suivi-post-camp" element={<PrivateRoute><SuiviPostCampPage /></PrivateRoute>} />
        <Route path="/admin/temoignages" element={<PrivateRoute><TemoignagesAdminPage /></PrivateRoute>} />
        <Route path="/admin/parametres" element={<PrivateRoute><ParametresPage /></PrivateRoute>} />
      </Routes>
    </>
  )
}

export default App
