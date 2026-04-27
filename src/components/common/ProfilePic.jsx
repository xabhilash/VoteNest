import { useState } from 'react';
import defaultAvatar from '../../resources/user.png';
import './profile.css';

// Google's photo CDN (lh3.googleusercontent.com) returns 403 when the request
// carries a third-party Referer header. Using an <img> with referrerPolicy
// ="no-referrer" strips that header so the photo actually loads on deployed
// origins (Firebase Hosting, custom domains, etc.).
function ProfilePic({ imageUrl }) {
  const [errored, setErrored] = useState(false);
  const valid = imageUrl != null && imageUrl !== 'Anon' && !errored;
  const src = valid ? imageUrl : defaultAvatar;

  return (
    <img
      className="profile"
      src={src}
      alt=""
      referrerPolicy="no-referrer"
      onError={() => setErrored(true)}
    />
  );
}

export default ProfilePic;
