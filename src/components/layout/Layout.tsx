import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import ToastContainer from '../ui/ToastContainer';

export default function Layout() {
  return (
    <div className="flex h-screen bg-[#F8F7FF] overflow-hidden">
      <Sidebar />
      <main className="flex-1 ml-60 overflow-y-auto">
        <Outlet />
      </main>
      <ToastContainer />
    </div>
  );
}
