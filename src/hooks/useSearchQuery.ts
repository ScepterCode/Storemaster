
import { useState } from 'react';

export const useSearchQuery = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (query: string) => {
    setIsSearching(true);
    setSearchQuery(query);
    // Simulate search delay for UX
    setTimeout(() => {
      setIsSearching(false);
    }, 300);
  };

  return {
    searchQuery,
    setSearchQuery,
    isSearching,
    handleSearch,
  };
};
