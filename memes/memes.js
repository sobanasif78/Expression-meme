// ---------------------------------------------------------------
// MEME CONFIG
// ---------------------------------------------------------------
// Each expression now points to a real image in the memes/ folder.
// To swap any of these out later, just replace the file in memes/
// and/or change the "image" path below.
// ---------------------------------------------------------------

const MEME_MAP = {
  happy: {
    emoji: "😂",
    label: "Happy",
    caption: "This is fine meme energy",
    image: "memes/happy.png"
  },
  sad: {
    emoji: "😢",
    label: "Sad",
    caption: "Crying in the club rn",
    image: "memes/sad.png"
  },
  angry: {
    emoji: "😡",
    label: "Angry",
    caption: "Deploying on a Friday energy",
    image: "memes/angry.png"
  },
  surprised: {
    emoji: "😲",
    label: "Surprised",
    caption: "Surprised Pikachu face",
    image: "memes/surprised.png"
  },
  fearful: {
    emoji: "😱",
    label: "Fearful",
    caption: "When the professor says 'pop quiz'",
    image: "memes/fearful.png"
  },
  disgusted: {
    emoji: "🤢",
    label: "Disgusted",
    caption: "That's a code smell",
    image: "memes/disgusted.png"
  },
  neutral: {
    emoji: "😐",
    label: "Neutral",
    caption: "Still loading a reaction…",
    image: "memes/neutral.png"
  }
};

// Order in which expression scores are displayed in the bar chart
const EXPRESSION_ORDER = [
  "happy", "sad", "angry", "surprised", "fearful", "disgusted", "neutral"
];
