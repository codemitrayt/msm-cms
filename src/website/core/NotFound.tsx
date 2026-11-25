import { Link } from 'react-router-dom';
import { SearchX } from 'lucide-react';
import { Button } from '../../ui';

export function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 pb-32 text-center">
      <SearchX className="mx-auto h-14 w-14 text-brand" />
      <h1 className="mt-4 text-3xl font-bold">Page not found</h1>
      <p className="mt-2 text-slate-500">The page may be unpublished, moved or never existed.</p>
      <div className="mt-6 flex justify-center gap-2">
        <Link to="/"><Button>Go home</Button></Link>
        <Link to="/colleges/all"><Button variant="outline">Browse colleges</Button></Link>
      </div>
    </div>
  );
}
