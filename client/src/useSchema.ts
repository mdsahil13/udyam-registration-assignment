import { useEffect, useState } from 'react';
import type { Schema } from './types';
import { fetchSchema } from './api';

export function useSchema() {
  const [schema, setSchema] = useState<Schema | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const s = await fetchSchema();
      setSchema(s);
      setLoading(false);
    })();
  }, []);

  return { schema, loading };
}
