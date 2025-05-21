
import { useState } from 'react';

export const useSearchQuery = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return {
    searchQuery,
    setSearchQuery,
  };
};
