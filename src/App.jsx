import { Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import AskQuestPage from './pages/AskQuestPage';
import SignUpPage from './pages/SignUpPage';
import BookmarksPage from './pages/BookmarksPage';
import MyQuestsPage from './pages/MyQuestsPage';
import QuestViewPage from './pages/QuestViewPage';
import './styles/App.css';

function App() {
  return (
    <div className="App">
      <Navbar />
      <div className="home-body">
        <Routes>
          <Route path="/" element={<HomePage url={null} />} />
          <Route path="/AskQuest" element={<AskQuestPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/Bookmarked" element={<BookmarksPage />} />
          <Route path="/MyQuestHome" element={<MyQuestsPage />} />
          <Route path="/Quest/*" element={<QuestViewPage />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}

export default App;
