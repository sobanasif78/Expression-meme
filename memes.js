// ---------------------------------------------------------------
// MEME & GESTURE CONFIG — Cat Meme Edition 🐱
// ---------------------------------------------------------------
// 1. expressions: Map facial expressions detected by face-api.js
// 2. gestures: Map pose gestures detected by MediaPipe Pose/Hands
//
// Each expression/gesture has:
//   - image: the meme image shown every time this mood is detected
//   - sound: key into app.js's SOUND_LIBRARY (synthesized, no files needed)
//   - variants: array of { emoji, label, caption } — a random one is
//     picked each time the mood changes, so the caption/emoji varies,
//     but the image (if set) always shows.
//
// If a mood has no `image` set, the emoji from the picked variant is
// shown instead.
//
// Drop cat meme images into memes/ using the filenames referenced
// below (e.g. memes/happy-cat.png) and they'll show automatically.
// ---------------------------------------------------------------

const MEME_CONFIG = {
  // Facial expressions
  expressions: {
    happy: {
      sound: "happy",
      image: "memes/uwucat.jpg",
      variants: [
        { emoji: "😸", label: "Happy", caption: "I can haz good vibes" },
        { emoji: "😹", label: "Happy", caption: "Certified good boi grin" },
        { emoji: "🐈", label: "Happy", caption: "Zoomies incoming" },
        { emoji: "😻", label: "Happy", caption: "Heart-eyes cat mode: ON" },
        { emoji: "🙀", label: "Happy", caption: "Chaotic good kitty energy" }
      ]
    },
    sad: {
      sound: "sad",
      variants: [
        { emoji: "😿", label: "Sad", caption: "Crying cat has entered the chat" },
        { emoji: "🥲", label: "Sad", caption: "No treats. It's fine. Everything is fine." },
        { emoji: "😢", label: "Sad", caption: "Sad trombone cat incoming" },
        { emoji: "🙁", label: "Sad", caption: "Monday face, but make it feline" }
      ]
    },
    angry: {
      sound: "angry",
      image: "memes/punchcat.jpg",
      variants: [
        { emoji: "😾", label: "Angry", caption: "Grumpy Cat has logged on" },
        { emoji: "🤬", label: "Angry", caption: "When the food bowl is empty" },
        { emoji: "😠", label: "Angry", caption: "Hiss. That is all." },
        { emoji: "💢", label: "Angry", caption: "Someone moved my sunny spot" }
      ]
    },
    surprised: {
      sound: "surprised",
      image: "memes/huh.png",
      variants: [
        { emoji: "🙀", label: "Surprised", caption: "Surprised cat face, activated" },
        { emoji: "😳", label: "Surprised", caption: "Wait, WHAT?! (cat version)" },
        { emoji: "🫨", label: "Surprised", caption: "The cucumber behind me" },
        { emoji: "😱", label: "Surprised", caption: "Startled kitty jumpscare" }
      ]
    },
    disgusted: {
      sound: "disgusted",
      variants: [
        { emoji: "🙀", label: "Disgusted", caption: "That's not the fancy feast" },
        { emoji: "😾", label: "Disgusted", caption: "Sniffed the wrong thing" },
        { emoji: "😖", label: "Disgusted", caption: "Bath time face" }
      ]
    },
    fearful: {
      sound: "fearful",
      variants: [
        { emoji: "😨", label: "Fearful", caption: "The vacuum cleaner is out" },
        { emoji: "😰", label: "Fearful", caption: "Vet appointment energy" },
        { emoji: "🙀", label: "Fearful", caption: "It's bath time isn't it" }
      ]
    },
    neutral: {
      sound: "neutral",
      image: "memes/pokercat.jpg",
      variants: [
        { emoji: "🐱", label: "Neutral", caption: "Judging you silently" },
        { emoji: "🫥", label: "Neutral", caption: "Present, but barely (cat is aloof)" },
        { emoji: "😐", label: "Neutral", caption: "Blank stare, deep judgment" }
      ]
    }
  },

  // Pose gestures
  gestures: {
    index_up: {
      sound: "shush",
      image: "memes/shhcat.jpg",
      variants: [
        { emoji: "☝️", label: "Shush", caption: "Ceiling cat is watching" },
        { emoji: "🤫", label: "Shush", caption: "Hold that thought, hooman" }
      ]
    },
    bicep_flex: {
      sound: "flex",
      variants: [
        { emoji: "💪", label: "Flex", caption: "Buff cat energy, we all gonna make it" },
        { emoji: "🦾", label: "Flex", caption: "Gains detected (mostly fur)" }
      ]
    },
    finger_mouth: {
      sound: "shook",
      variants: [
        { emoji: "🙀", label: "Shook", caption: "When the laser pointer disappears" },
        { emoji: "😬", label: "Shook", caption: "Knocked the cup off the table on purpose" }
      ]
    },
    fist: {
      sound: "angry",
      image: "memes/punchcat.jpg",
      variants: [
        { emoji: "😾", label: "Stoic Cat", caption: "Do not pet. Do not speak." },
        { emoji: "✊", label: "Stoic Cat", caption: "Silent judgment fist" }
      ]
    },
    rockstar: {
      sound: "flex",
      variants: [
        { emoji: "🤘", label: "Rockstar Cat", caption: "Knocking things off shelves since forever" },
        { emoji: "🎸", label: "Rockstar Cat", caption: "3am zoomies concert tour" }
      ]
    },
    open_palm: {
      sound: "shook",
      image: "memes/hand stretched out, palm facing up .jpg",
      variants: [
        { emoji: "🖐️", label: "No Monies", caption: "i HAVE NO MONIES for treats" },
        { emoji: "🤲", label: "No Monies", caption: "Empty paws, empty bowl" }
      ]
    },
    fingers_together: {
      sound: "shook",
      image: "memes/fingers together muehehe .jpg",
      variants: [
        { emoji: "🤌", label: "Muehehe", caption: "Plotting something. Don't ask." },
        { emoji: "😼", label: "Muehehe", caption: "Excellent... *steeples paws*" }
      ]
    },
    hands_above_head: {
      sound: "sad",
      image: "memes/two hands on head .jpg",
      variants: [
        { emoji: "😭", label: "Devastated Cat", caption: "The vet appointment was today" },
        { emoji: "🙀", label: "Devastated Cat", caption: "They're all out of the good treats" }
      ]
    },
    hands_beside_face: {
      sound: "fearful",
      image: "memes/crashout cat .jpg",
      variants: [
        { emoji: "😩", label: "Crash Out Cat", caption: "It's not the reaction you think it is" },
        { emoji: "🫨", label: "Crash Out Cat", caption: "Full meltdown, no notes" }
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
