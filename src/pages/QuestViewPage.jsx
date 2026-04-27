import { useLocation } from 'react-router-dom';
import HomePage from './HomePage';

function QuestViewPage() {
  const location = useLocation();
  const url = location.pathname.replace('/Quest/', '');
  return (
    <div>
      <HomePage url={url.toString().trim().length ? url : null} />
    </div>
  );
}

export default QuestViewPage;
