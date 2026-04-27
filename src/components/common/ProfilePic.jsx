import './profile.css';

function ProfilePic({ imageUrl }) {
  return (
    <div
      className="profile"
      style={imageUrl != null ? { backgroundImage: `url(${imageUrl})` } : {}}
    />
  );
}

export default ProfilePic;
