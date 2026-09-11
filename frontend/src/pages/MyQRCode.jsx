import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import UserLayout from '../components/layout/UserLayout';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services';
import { buildLibraryCardDataUrl, downloadCardImage } from '../utils/cardRenderer';
import { toast } from 'react-toastify';

const MyQRCode = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [generatingImage, setGeneratingImage] = useState(false);

  useEffect(() => {
    authService.getMe()
      .then(async (res) => {
        setProfile(res.data);
        if (res.data.card?.qr_code_data) {
          setGeneratingImage(true);
          try {
            const dataUrl = await QRCode.toDataURL(res.data.card.qr_code_data, {
              width: 300, margin: 2,
              color: { dark: '#000000', light: '#ffffff' },
              errorCorrectionLevel: 'H'
            });
            setQrDataUrl(dataUrl);
          } catch {
            if (res.data.card?.qr_code_url) {
              setQrDataUrl(`http://localhost:5000${res.data.card.qr_code_url}`);
            }
          } finally {
            setGeneratingImage(false);
          }
        }
      })
      .catch(() => toast.error('Failed to load card'));
  }, []);

  const roleLabel = user?.role?.charAt(0) + user?.role?.slice(1).toLowerCase();
  const card = profile?.card;

  const handleDownload = async () => {
    if (!qrDataUrl) return;
    try {
      setGeneratingImage(true);
      const dataUrl = await buildLibraryCardDataUrl({
        qrUrl: qrDataUrl,
        customerId: user?.customer_id,
        name: `${user?.first_name || ''} ${user?.last_name || ''}`,
        roleLabel: `${roleLabel} • ${user?.email || ''}`,
        cardNumber: card?.card_number
      });
      downloadCardImage(dataUrl, `${user.customer_id}_library_card.png`);
      toast.success('Library card image downloaded');
    } catch {
      toast.error('Failed to export card image');
    } finally {
      setGeneratingImage(false);
    }
  };

  const handlePrint = async () => {
    if (!qrDataUrl) return;
    try {
      setGeneratingImage(true);
      const dataUrl = await buildLibraryCardDataUrl({
        qrUrl: qrDataUrl,
        customerId: user?.customer_id,
        name: `${user?.first_name || ''} ${user?.last_name || ''}`,
        roleLabel: `${roleLabel} • ${user?.email || ''}`,
        cardNumber: card?.card_number
      });
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html><head><title>${user.customer_id} - Library Card</title></head>
        <body style="display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f1f5f9;margin:0">
          <img src="${dataUrl}" style="width:640px;max-width:95vw" />
        </body></html>
      `);
      printWindow.document.close();
      printWindow.print();
    } catch {
      toast.error('Failed to generate card for printing');
    } finally {
      setGeneratingImage(false);
    }
  };

  return (
    <UserLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Library QR Card</h1>
        <p className="text-gray-500 text-sm">Scan this card to log in or present at the library desk</p>
      </div>

      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 text-gray-900">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-2">
              <img src="/hope-logo.png" alt="Hope Haven Library" className="w-10 h-10 object-contain" />
              <div>
                <div className="text-lg font-bold text-gray-900">Hope Haven School Library</div>
                <div className="text-xs text-gray-500">Smart Library Access Card</div>
              </div>
            </div>
          </div>

          {!card ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-3">📇</div>
              <p className="text-sm mb-2 text-gray-600">You don't have a QR card yet.</p>
              <p className="text-xs text-gray-500">Ask a librarian to create one for you.</p>
            </div>
          ) : (
            <>
              <div className="flex justify-center mb-6">
                {generatingImage ? (
                  <div className="w-44 h-44 bg-white rounded-lg flex items-center justify-center">
                    <span className="text-gray-400 text-sm">Loading...</span>
                  </div>
                ) : qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR Code" className="w-44 h-44 bg-white p-2 rounded-lg" />
                ) : (
                  <div className="w-44 h-44 bg-white rounded-lg flex items-center justify-center text-gray-400 text-sm">
                    No QR card
                  </div>
                )}
              </div>

              <div className="text-center mb-6">
                <div className="text-sm opacity-80">MEMBER</div>
                <div className="text-xl font-bold font-mono">{user?.customer_id}</div>
                <div className="text-sm mt-1">{user?.first_name} {user?.last_name}</div>
                <div className="text-xs text-gray-500">{roleLabel} · {user?.email}</div>
                <div className="text-xs text-gray-500 mt-2 font-mono">Card: {card.card_number}</div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  disabled={!qrDataUrl}
                  className="flex-1 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
                >
                  Download Card
                </button>
                <button
                  onClick={handlePrint}
                  disabled={!qrDataUrl}
                  className="flex-1 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
                >
                  Print
                </button>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Need a new QR code?</strong> Only a librarian can create or regenerate QR cards.
            Visit the library desk or contact your librarian.
          </p>
        </div>

        <div className="mt-4 bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-700 mb-2">How it works</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>Download the QR image to your phone</li>
            <li>On the login page, tap "Scan QR Card" and scan your image</li>
            <li>Show this card at the library desk to borrow/return books</li>
          </ul>
          <Link to="/books" className="mt-4 inline-block px-4 py-2 bg-primary-600 text-white rounded-lg text-sm">Browse Books</Link>
        </div>
      </div>
    </UserLayout>
  );
};

export default MyQRCode;
