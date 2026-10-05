import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { EventRegistrationForm } from './pages/EventRegistrationForm';
import { PrepaProspectForm } from './pages/PrepaProspectForm';
import { TicketView } from './pages/TicketView';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminUsersDashboard } from './pages/AdminUsersDashboard';
import { FormSubmissionsView } from './pages/FormSubmissionsView';
import { ForcePasswordChange } from './components/ForcePasswordChange';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/forms/EventRegistration" element={<EventRegistrationForm />} />
        <Route path="/forms/EventRegistration/ticket" element={<TicketView />} />
        
        <Route path="/forms/PrepaStase" element={<PrepaProspectForm />} />
        
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin/dashboard" element={
          <ForcePasswordChange>
            <AdminDashboard />
          </ForcePasswordChange>
        } />
        <Route path="/admin/users" element={
          <ForcePasswordChange>
            <AdminUsersDashboard />
          </ForcePasswordChange>
        } />
        <Route path="/admin/forms/:form_identifier/data" element={
          <ForcePasswordChange>
            <FormSubmissionsView />
          </ForcePasswordChange>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
