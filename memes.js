// ---------------------------------------------------------------
// MEME & GESTURE CONFIG
// ---------------------------------------------------------------
// 1. expressions: Map facial expressions detected by face-api.js
// 2. gestures: Map pose gestures detected by MediaPipe Pose
//
// To add a new gesture meme:
// Simply add a new entry to `gestures` below (e.g. anime poses)
// and write a matching detector function in app.js!
// ---------------------------------------------------------------

const MEME_CONFIG = {
  // Facial expressions
  expressions: {
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
  },

  // Pose gestures
  gestures: {
    index_up: {
      image: "memes/happy.png",
      label: "shush",
      emoji: "☝️",
      caption: "Wait / shush…"
    },
    bicep_flex: {
      image: "memes/zyzz.png",
      label: "flex",
      emoji: "💪",
      caption: "We're all gonna make it brahs"
    },
    finger_mouth: {
      image: "memes/fearful.png",
      label: "shook",
      emoji: "🙊",
      caption: "When the professor says 'pop quiz'"
    }
  }
};

// Convenience references
const GESTURE_MAP = MEME_CONFIG.gestures;

// Combined MEME_MAP for backward compatibility
const MEME_MAP = {
  ...MEME_CONFIG.expressions,
  ...MEME_CONFIG.gestures
};

// Order in which expression scores are displayed in the bar chart
const EXPRESSION_ORDER = [
  "happy", "sad", "angry", "surprised", "disgusted", "neutral"
];
