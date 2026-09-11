// ---------------------------------------------------------------
// MEME & GESTURE CONFIG — Cat Meme Edition
// ---------------------------------------------------------------
// Each expression/gesture has:
//   - sound: key into app.js's SOUND_LIBRARY (synthesized, no files needed)
//   - how: plain-English instructions shown in the on-screen guide
//   - media: array of { image? or video? } — real cat photos/clips for
//     this mood. If non-empty, a random one is ALWAYS shown (no emoji
//     fallback) whenever this mood is active.
//   - variants: array of { emoji, label, caption } — used for the
//     emoji+caption fallback ONLY when `media` is empty/missing.
// ---------------------------------------------------------------

const MEME_CONFIG = {
  expressions: {
    happy: {
      sound: "happy",
      how: "Smile naturally at the camera",
      media: [
        { image: "memes/uwucat.jpg" },
        { image: "memes/uwucatt.jpg" },
        { image: "memes/laugh and point .jpg" },
        { video: "memes/spin cat.mov" }
      ],
      variants: [
        { emoji: "😻", label: "Happy", caption: "Heart-eyes cat mode: ON" }
      ]
    },
    sad: {
      sound: "sad",
      how: "Frown or pout",
      variants: [
        { emoji: "😿", label: "Sad", caption: "Crying cat has entered the chat" },
        { emoji: "🥲", label: "Sad", caption: "No treats. It's fine. Everything is fine." },
        { emoji: "🙁", label: "Sad", caption: "Monday face, but make it feline" }
      ]
    },
    angry: {
      sound: "angry",
      how: "Furrow your brows, look angry",
      media: [
        { image: "memes/punchcat.jpg" }
      ],
      variants: [
        { emoji: "😾", label: "Angry", caption: "Grumpy Cat has logged on" }
      ]
    },
    surprised: {
      sound: "surprised",
      how: "Raise eyebrows, open mouth wide",
      media: [
        { image: "memes/huh.png" },
        { image: "memes/cat.jpg" }
      ],
      variants: [
        { emoji: "🙀", label: "Surprised", caption: "Surprised cat face, activated" }
      ]
    },
    disgusted: {
      sound: "disgusted",
      how: "Scrunch your nose like something smells bad",
      media: [
        { video: "memes/shaking head .mov" }
      ],
      variants: [
        { emoji: "🙅", label: "Disgusted", caption: "Hard no from this cat" }
      ]
    },
    fearful: {
      sound: "fearful",
      how: "Wide eyes, tense/scared expression",
      variants: [
        { emoji: "😨", label: "Fearful", caption: "The vacuum cleaner is out" },
        { emoji: "😰", label: "Fearful", caption: "Vet appointment energy" }
      ]
    },
    neutral: {
      sound: "neutral",
      how: "Relaxed, no strong expression",
      media: [
        { image: "memes/pokercat.jpg" },
        { image: "memes/iunno cat.jpg" },
        { image: "memes/profcat.jpg" },
        { image: "memes/professorcat.jpg" }
      ],
      variants: [
        { emoji: "🐱", label: "Neutral", caption: "Judging you silently" }
      ]
    }
  },

  gestures: {
    index_up: {
      sound: "shush",
      how: "One hand up, index finger only, tip resting near your mouth",
      media: [
        { image: "memes/shhcat.jpg" }
      ],
      variants: [
        { emoji: "☝️", label: "Shush", caption: "Ceiling cat is watching" }
      ]
    },
    bicep_flex: {
      sound: "flex",
      how: "Bend an elbow ~90° with your fist at or above shoulder height",
      media: [
        { video: "memes/rocky cat.mov" }
      ],
      variants: [
        { emoji: "💪", label: "Flex", caption: "Buff cat, we all gonna make it" }
      ]
    },
    finger_mouth: {
      sound: "shook",
      how: "Touch your index fingertip to your mouth",
      variants: [
        { emoji: "🙀", label: "Shook", caption: "When the laser pointer disappears" },
        { emoji: "😬", label: "Shook", caption: "Knocked the cup off the table on purpose" }
      ]
    },
    fist: {
      sound: "angry",
      how: "Make a fist with one hand, thumb tucked in",
      media: [
        { image: "memes/punchcat.jpg" }
      ],
      variants: [
        { emoji: "😾", label: "Stoic Cat", caption: "Do not pet. Do not speak." }
      ]
    },
    rockstar: {
      sound: "flex",
      how: "Thumb and pinky out, other fingers curled",
      variants: [
        { emoji: "🤘", label: "Rockstar Cat", caption: "Knocking things off shelves since forever" },
        { emoji: "🎸", label: "Rockstar Cat", caption: "3am zoomies concert tour" }
      ]
    },
    open_palm: {
      sound: "shook",
      how: "Hold one hand up, all 5 fingers spread, away from your face",
      media: [
        { image: "memes/hand stretched out, palm facing up .jpg" },
        { video: "memes/two palms up.mov" }
      ],
      variants: [
        { emoji: "🖐️", label: "No Monies", caption: "i HAVE NO MONIES for treats" }
      ]
    },
    fingers_together: {
      sound: "shook",
      how: "Both hands up, index fingers extended, tips touching",
      media: [
        { image: "memes/fingers together muehehe .jpg" }
      ],
      variants: [
        { emoji: "🤌", label: "Muehehe", caption: "Plotting something. Don't ask." }
      ]
    },
    hands_above_head: {
      sound: "sad",
      how: "Raise both hands above the top of your head",
      media: [
        { image: "memes/two hands on head .jpg" }
      ],
      variants: [
        { emoji: "😭", label: "Devastated Cat", caption: "The vet appointment was today" }
      ]
    },
    hands_beside_face: {
      sound: "fearful",
      how: "Raise both hands to face height, beside your head (not above it)",
      media: [
        { image: "memes/crashout cat .jpg" }
      ],
      variants: [
        { emoji: "😩", label: "Crash Out Cat", caption: "It's not the reaction you think it is" }
      ]
    },
    hand_cover_face: {
      sound: "shook",
      how: "Bring one hand up over your face, roughly covering it",
      media: [
        { image: "memes/hand cover face .jpg" }
      ],
      variants: [
        { emoji: "🙈", label: "Kidnap Cat", caption: "You didn't see anything" }
      ]
    },
    side_eye: {
      sound: "disgusted",
      how: "Turn your head to one side while facing the camera",
      media: [
        { image: "memes/side eye cat.jpg" },
        { image: "memes/side eye.png" }
      ],
      variants: [
        { emoji: "👀", label: "Side Eye Cat", caption: "I heard that." }
      ]
    }
  }
};

const GESTURE_MAP = MEME_CONFIG.gestures;

const MEME_MAP = {
  ...MEME_CONFIG.expressions,
  ...MEME_CONFIG.gestures
};

const EXPRESSION_ORDER = [
  "happy", "sad", "angry", "surprised", "disgusted", "fearful", "neutral"
];
