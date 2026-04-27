import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './footer.css';

function Footer() {
  const location = useLocation();
  const [displayFoot, setDisplayFoot] = useState(true);
  const lastScrollTop = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const st = window.pageYOffset || document.documentElement.scrollTop;
      if (st > lastScrollTop.current) {
        setDisplayFoot((prev) => (prev ? false : prev));
      } else {
        setDisplayFoot((prev) => (!prev ? true : prev));
      }
      lastScrollTop.current = st <= 0 ? 0 : st;
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="footer-bar noselect" style={displayFoot ? {} : { height: 0 }}>
      <Link
        to="/"
        className={'home-tab margin-tab' + (location.pathname === '/' ? ' active-tab' : '')}
      >Home</Link>
      <Link
        to="/MyQuestHome"
        className={'my-quest-tab margin-tab' + (location.pathname === '/MyQuestHome' ? ' active-tab' : '')}
      >My quest</Link>
      <Link
        to="/Bookmarked"
        className={'saved-tab margin-tab' + (location.pathname === '/Bookmarked' ? ' active-tab' : '')}
      >Saved</Link>
    </div>
  );
}

export default Footer;
