import Navbar from './Navbar';
import Footer from './Footer';
import LiveChatWidget from '../chat/LiveChatWidget';

export default function PublicLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <LiveChatWidget />
    </div>
  );
}
