import { useEffect, useState } from 'react';
import defaultAvatar from '../../resources/user.png';
import './profile.css';

// Google profile pictures (lh3.googleusercontent.com) frequently return
// HTTP 429 / 403 on localhost and other origins because of referrer-based
// rate limiting. Two mitigations:
//   1. referrerPolicy="no-referrer" - hides the Origin/Referer headers, which
//      lets Google serve the image instead of rate-limiting it.
//   2. onError fallback - if the URL still fails (network, 4xx, 5xx), swap
//      to the bundled default avatar so the user always sees something.
function ProfilePic({ imageUrl }) {
  const [src, setSrc] = useState(imageUrl || defaultAvatar);

  useEffect(() => {
    setSrc(imageUrl || defaultAvatar);
  }, [imageUrl]);

  const handleError = () => {
    if (src !== defaultAvatar) setSrc(defaultAvatar);
  };

  return (
    <img
      className="profile"
      src={src}
      alt=""
      referrerPolicy="no-referrer"
      onError={handleError}
      draggable={false}
    />
  );
}

export default ProfilePic;
