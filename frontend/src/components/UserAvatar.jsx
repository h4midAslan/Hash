import { useState } from "react";

export default function UserAvatar({ user, size = "md", className = "" }) {
  const [imgError, setImgError] = useState(false);

  const sizes = {
    xs: "w-8 h-8 text-xs",
    sm: "w-10 h-10 text-sm",
    md: "w-14 h-14 text-xl",
    lg: "w-24 h-24 text-3xl",
  };

  const sizeClass = sizes[size] || sizes.md;
  const name = user?.full_name || user?.name || user?.username || user?.email?.split("@")[0] || "U";
  const pic = user?.profile_picture;

  const showImg = pic && pic.startsWith("http") && !imgError;

  if (showImg) {
    return (
      <img
        src={pic}
        alt={name}
        className={`${sizeClass} rounded-2xl object-cover ${className}`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold flex-shrink-0 ${className}`}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
