
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to dashboard
    navigate('/');
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-50 to-teal-50">
      <div className="text-center animate-pulse">
        <p className="text-xl">Loading dashboard...</p>
      </div>
    </div>
  );
};

export default Index;
