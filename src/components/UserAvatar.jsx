// Hash a name string to a consistent background color from a navy palette.
const AVATAR_COLORS = [
  "#1e3a5f", // navy
  "#2d5282", // navy-light
  "#1e4d3b", // dark green
  "#5b21b6", // violet
  "#1e40af", // blue-dark
  "#7c2d12", // rust
  "#065f46", // emerald
  "#831843", // pink-dark
];

function nameToColor(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function toInitials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

// Drop-in avatar: shows photo if available, falls back to colored initials circle.
// size — pixel dimension (default 44)
function UserAvatar({ src, name = "", size = 44, className = "" }) {
  const style = { width: size, height: size };

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`pointer-events-none flex-shrink-0 rounded-full object-cover ${className}`}
        style={style}
      />
    );
  }

  const abbr = toInitials(name) || "?";
  const fontSize = Math.round(size * 0.38);

  return (
    <span
      className={`flex flex-shrink-0 select-none items-center justify-center rounded-full font-semibold text-white ${className}`}
      style={{ ...style, backgroundColor: nameToColor(name), fontSize }}
      aria-label={name}
    >
      {abbr}
    </span>
  );
}

export default UserAvatar;
