import { Link } from 'react-router-dom';
import { UtensilsCrossed } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-surface-2">
      <div className="text-center max-w-xs">
        <UtensilsCrossed className="w-12 h-12 text-gray-300 mx-auto mb-4" aria-hidden="true" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Page not found</h1>
        <p className="text-base text-muted mb-6">The link you followed may be broken or the menu may have moved.</p>
        <Link to="/" className="text-brand font-semibold text-base hover:underline min-h-11 inline-flex items-center">
          ← Go home
        </Link>
      </div>
    </div>
  );
}
