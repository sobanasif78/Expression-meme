// ---------------------------------------------------------------
// MEME & GESTURE CONFIG
// ---------------------------------------------------------------
// 1. expressions: Map facial expressions detected by face-api.js
// 2. gestures: Map pose gestures detected by MediaPipe Pose/Hands
//
// Each expression/gesture now has a `variants` array — every time
// the mood changes, a random variant from that array is shown, so
// the same mood doesn't always give you the exact same meme.
// Each entry also has a `sound` key that maps to a synthesized
// sound effect in app.js's SOUND_LIBRARY (no audio files needed —
// see SOUND_LIBRARY in app.js if you want to change how they sound).
//
// To add a new gesture meme:
// Simply add a new entry to `gestures` below (e.g. anime poses)
// and write a matching detector function in app.js!
//
// To add real meme images: drop files into memes/ and add an
// `image: "memes/yourfile.png"` field to any variant — if present,
// it's shown instead of the emoji + caption.
// ---------------------------------------------------------------

const MEME_CONFIG = {
  // Facial expressions
  expressions: {
    happy: {
      sound: "happy",
      variants: [
        { emoji: "😂", label: "Happy", caption: "This is fine meme energy", image: "memes/happy.png" },
        { emoji: "🤣", label: "Happy", caption: "Vibing at 200%" },
        { emoji: "😹", label: "Happy", caption: "Certified hood classic grin" },
        { emoji: "🥳", label: "Happy", caption: "It's not stress, it's excitement" },
        { emoji: "😆", label: "Happy", caption: "Chaotic good energy detected" }
      ]
    },
    sad: {
      sound: "sad",
      variants: [
        { emoji: "😢", label: "Sad", caption: "Crying in the club rn", image: "memes/sad.png" },
        { emoji: "🥲", label: "Sad", caption: "It's fine. Everything is fine." },
        { emoji: "😭", label: "Sad", caption: "Sad trombone incoming" },
        { emoji: "🙁", label: "Sad", caption: "Monday face, but it's not even Monday" }
      ]
    },
    angry: {
      sound: "angry",
      variants: [
        { emoji: "😡", label: "Angry", caption: "Deploying on a Friday energy", image: "memes/angry.png" },
        { emoji: "🤬", label: "Angry", caption: "When the CI pipeline fails again" },
        { emoji: "😠", label: "Angry", caption: "Merge conflict rage" },
        { emoji: "💢", label: "Angry", caption: "Someone touched the thermostat" }
      ]
    },
    surprised: {
      sound: "surprised",
      variants: [
        { emoji: "😲", label: "Surprised", caption: "Surprised Pikachu face", image: "memes/surprised.png" },
        { emoji: "😳", label: "Surprised", caption: "Wait, WHAT?" },
        { emoji: "🫨", label: "Surprised", caption: "Plot twist nobody asked for" },
        { emoji: "😱", label: "Surprised", caption: "The audacity of this bug" }
      ]
    },
    disgusted: {
      sound: "disgusted",
      variants: [
        { emoji: "🤢", label: "Disgusted", caption: "That's a code smell", image: "memes/disgusted.png" },
        { emoji: "🤮", label: "Disgusted", caption: "Nested ternaries, why" },
        { emoji: "😖", label: "Disgusted", caption: "Someone used tabs AND spaces" }
      ]
    },
    fearful: {
      sound: "fearful",
      variants: [
        { emoji: "😨", label: "Fearful", caption: "Production is down", image: "memes/fearful.png" },
        { emoji: "😰", label: "Fearful", caption: "\"We need to talk\" energy" },
        { emoji: "🙀", label: "Fearful", caption: "When the boss says 'got a sec?'" }
      ]
    },
    neutral: {
      sound: "neutral",
      variants: [
        { emoji: "😐", label: "Neutral", caption: "Still loading a reaction…", image: "memes/neutral.png" },
        { emoji: "🫥", label: "Neutral", caption: "Present, but barely" },
        { emoji: "😶", label: "Neutral", caption: "Poker face activated" }
      ]
    }
  },

  // Pose gestures
  gestures: {
    index_up: {
      sound: "shush",
      variants: [
        { emoji: "☝️", label: "Shush", caption: "Wait / shush…" },
        { emoji: "🤫", label: "Shush", caption: "Hold that thought" }
      ]
    },
    bicep_flex: {
      sound: "flex",
      variants: [
        { emoji: "💪", label: "Flex", caption: "We're all gonna make it brahs", image: "memes/zyzz.png" },
        { emoji: "🦾", label: "Flex", caption: "Gains detected" }
      ]
    },
    finger_mouth: {
      sound: "shook",
      variants: [
        { emoji: "🙊", label: "Shook", caption: "When the professor says 'pop quiz'", image: "memes/fearful.png" },
        { emoji: "😬", label: "Shook", caption: "Did I just say that out loud" }
      ]
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
  "happy", "sad", "angry", "surprised", "disgusted", "fearful", "neutral"
];
